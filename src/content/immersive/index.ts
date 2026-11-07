import type { ImmersiveConfig, BilingualDisplayState, TranslatableNodeWrapper } from './types'
import { scanPageTranslatableBlocks } from './dom-scanner'
import { injectTranslationStyles, mountTranslationNode, setTranslationsVisibility } from './dom-renderer'
import { initSelectionTranslator, updateSelectionConfig, hideSelectionUI } from './selection-bubble'
import { initTripleSpaceTranslator, updateTripleSpaceConfig } from './input-translator'

let displayState: BilingualDisplayState = 'idle'
let trackedBlocks: TranslatableNodeWrapper[] = []
let viewportObserver: IntersectionObserver | null = null

let activeConfig: ImmersiveConfig = {
  enabled: true,
  targetLang: 'zh-Hans',
  bilingualStyle: 'dashed',
  selectionTranslate: true,
  selectionTriggerMode: 'bubble',
  tripleSpaceTranslate: true
}

// 收集待翻译队列并批处理
const pendingQueue: TranslatableNodeWrapper[] = []
let batchTimer: number | null = null

function showGlobalNotice(text: string) {
  const existing = document.getElementById('mytabs-global-notice')
  if (existing) existing.remove()

  const notice = document.createElement('div')
  notice.id = 'mytabs-global-notice'
  notice.setAttribute('data-mytabs-ignore', 'true')
  notice.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    background: rgba(17, 24, 39, 0.88);
    color: #fff;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
    z-index: 2147483647;
    backdrop-filter: blur(12px);
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
    opacity: 0;
    transform: translateY(-8px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `
  notice.textContent = text
  document.body.appendChild(notice)

  requestAnimationFrame(() => {
    notice.style.opacity = '1'
    notice.style.transform = 'translateY(0)'
  })

  setTimeout(() => {
    notice.style.opacity = '0'
    notice.style.transform = 'translateY(-8px)'
    setTimeout(() => notice.remove(), 250)
  }, 2200)
}

function flushPendingTranslations() {
  if (pendingQueue.length === 0) return

  // 每次提取最多 25 个
  const batch = pendingQueue.splice(0, 25)
  const texts = batch.map((b) => b.originalText)

  chrome.runtime.sendMessage(
    {
      type: 'TRANSLATE_BATCH_TEXTS',
      texts,
      targetLang: activeConfig.targetLang
    },
    (res) => {
      if (res?.success && Array.isArray(res.results)) {
        res.results.forEach((item: any, idx: number) => {
          const wrapper = batch[idx]
          if (wrapper) {
            wrapper.translatedText = item.translated || wrapper.originalText
            wrapper.status = 'done'
            mountTranslationNode(wrapper, activeConfig)
          }
        })
      } else {
        batch.forEach((wrapper) => {
          wrapper.status = 'failed'
        })
      }

      // 如果队列中还有，稍后继续消化
      if (pendingQueue.length > 0) {
        setTimeout(flushPendingTranslations, 150)
      }
    }
  )
}

function queueForTranslation(wrapper: TranslatableNodeWrapper) {
  if (wrapper.status !== 'pending') return
  wrapper.status = 'in_progress'
  pendingQueue.push(wrapper)

  if (batchTimer) clearTimeout(batchTimer)
  batchTimer = window.setTimeout(() => {
    flushPendingTranslations()
  }, 100)
}

function setupViewportObserver() {
  if (viewportObserver) viewportObserver.disconnect()

  viewportObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const wrapper = trackedBlocks.find((b) => b.element === el)
          if (wrapper && wrapper.status === 'pending') {
            queueForTranslation(wrapper)
          }
        }
      })
    },
    {
      rootMargin: '400px 0px 400px 0px' // 前瞻 400px 预加载，滚到时刚好已译出
    }
  )

  trackedBlocks.forEach((wrapper) => {
    if (wrapper.element.isConnected) {
      viewportObserver?.observe(wrapper.element)
    }
  })
}

/**
 * 切换整页双语对照翻译
 */
export function togglePageBilingualTranslation() {
  if (!activeConfig.enabled) {
    showGlobalNotice('翻译功能已在设置中关闭')
    return
  }

  if (displayState === 'showing') {
    setTranslationsVisibility(false)
    displayState = 'hidden'
    showGlobalNotice('🌹 已隐藏双语译文')
    return
  }

  if (displayState === 'hidden') {
    setTranslationsVisibility(true)
    displayState = 'showing'
    showGlobalNotice('🌹 已开启双语对照')
    return
  }

  // 首次运行翻译扫描
  injectTranslationStyles(activeConfig.bilingualStyle)
  trackedBlocks = scanPageTranslatableBlocks(activeConfig.targetLang)

  if (trackedBlocks.length === 0) {
    showGlobalNotice('本页内容无需翻译或已为中文')
    return
  }

  displayState = 'showing'
  showGlobalNotice(`🌹 开始双语翻译，共扫描到 ${trackedBlocks.length} 个段落`)
  setupViewportObserver()
}

/**
 * 初始化翻译全套服务
 */
export function initImmersiveTranslation(config?: Partial<ImmersiveConfig>) {
  if (config) {
    activeConfig = { ...activeConfig, ...config }
  }

  // 1. 初始化划词悬浮释义
  const isSelectionEnabled = Boolean(activeConfig.enabled && activeConfig.selectionTranslate)
  const triggerMode = activeConfig.selectionTriggerMode || 'bubble'
  const adaptiveSize = activeConfig.selectionAdaptiveSize !== false
  const resizable = activeConfig.selectionResizable !== false
  initSelectionTranslator(isSelectionEnabled, activeConfig.targetLang, triggerMode, adaptiveSize, resizable)

  // 2. 初始化输入框 3 次空格翻译
  const isTripleSpaceEnabled = Boolean(activeConfig.enabled && activeConfig.tripleSpaceTranslate)
  initTripleSpaceTranslator(isTripleSpaceEnabled)

  // 3. 注册全局快捷键监听 (Alt + W)
  window.addEventListener('keydown', (e) => {
    if (!activeConfig.enabled) return
    if (e.altKey && (e.key === 'w' || e.key === 'W' || e.code === 'KeyW')) {
      e.preventDefault()
      togglePageBilingualTranslation()
    }
  })
}

export function updateImmersiveConfig(newConfig: Partial<ImmersiveConfig>) {
  activeConfig = { ...activeConfig, ...newConfig }
  injectTranslationStyles(activeConfig.bilingualStyle)

  const isGloballyEnabled = Boolean(activeConfig.enabled)

  // 如果总开关被关闭，立即清理并隐藏当前页面上所有的双语译文与划词浮窗
  if (!isGloballyEnabled) {
    if (displayState === 'showing') {
      setTranslationsVisibility(false)
      displayState = 'hidden'
    }
    hideSelectionUI()
  }

  const isSelectionEnabled = Boolean(isGloballyEnabled && activeConfig.selectionTranslate)
  const triggerMode = activeConfig.selectionTriggerMode || 'bubble'
  const adaptiveSize = activeConfig.selectionAdaptiveSize !== false
  const resizable = activeConfig.selectionResizable !== false
  updateSelectionConfig(isSelectionEnabled, activeConfig.targetLang, triggerMode, adaptiveSize, resizable)

  const isTripleSpaceEnabled = Boolean(isGloballyEnabled && activeConfig.tripleSpaceTranslate)
  updateTripleSpaceConfig(isTripleSpaceEnabled)
}

