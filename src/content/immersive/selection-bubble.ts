import type { SelectionTriggerMode } from './types'

let hostElement: HTMLElement | null = null
let shadowRoot: ShadowRoot | null = null
let isSelectionBubbleEnabled = true
let currentSelectedText = ''
let currentTargetLang = 'zh-Hans'
let currentTriggerMode: SelectionTriggerMode = 'bubble'
let isInitialized = false

function ensureHost(): ShadowRoot {
  if (hostElement && shadowRoot && hostElement.isConnected) return shadowRoot

  if (hostElement && !hostElement.isConnected) {
    try {
      hostElement.remove()
    } catch {}
    hostElement = null
    shadowRoot = null
  }

  hostElement = document.createElement('div')
  hostElement.id = 'mytabs-selection-host'
  hostElement.setAttribute('data-mytabs-ignore', 'true')
  hostElement.style.cssText = 'position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;'
  ;(document.body || document.documentElement).appendChild(hostElement)

  shadowRoot = hostElement.attachShadow({ mode: 'open' })

  // 注入 Shadow DOM 独立样式
  const style = document.createElement('style')
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
    }

    .mt-float-trigger {
      position: absolute;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
      user-select: none;
      z-index: 10;
    }

    .mt-float-trigger:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.45);
    }

    .mt-card {
      position: absolute;
      width: 320px;
      max-width: calc(100vw - 32px);
      max-height: 400px;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      padding: 12px 14px;
      color: #1f2937;
      font-size: 13px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: mt-card-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      z-index: 20;
    }

    @keyframes mt-card-in {
      from {
        opacity: 0;
        transform: translateY(6px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .mt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 6px;
      font-size: 12px;
      color: #6b7280;
    }

    .mt-brand {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      color: #4f46e5;
    }

    .mt-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .mt-icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #9ca3af;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 11px;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .mt-icon-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .mt-original-text {
      color: #4b5563;
      font-size: 12px;
      line-height: 1.4;
      background: #f9fafb;
      padding: 6px 8px;
      border-radius: 6px;
      border-left: 3px solid #cbd5e1;
      max-height: 90px;
      overflow-y: auto;
      word-break: break-word;
    }

    .mt-trans-result {
      color: #111827;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.6;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .mt-loading {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      font-size: 12px;
      padding: 10px 0;
    }

    .mt-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid #e0e7ff;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: mt-spin 0.6s linear infinite;
    }

    @keyframes mt-spin {
      to { transform: rotate(360deg); }
    }

    /* 暗色模式适配 */
    @media (prefers-color-scheme: dark) {
      .mt-card {
        background: rgba(30, 41, 59, 0.95);
        border-color: rgba(51, 65, 85, 0.8);
        color: #f1f5f9;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      }
      .mt-header {
        border-bottom-color: #334155;
        color: #94a3b8;
      }
      .mt-original-text {
        background: #0f172a;
        color: #cbd5e1;
        border-left-color: #475569;
      }
      .mt-trans-result {
        color: #f8fafc;
      }
      .mt-icon-btn:hover {
        background: #334155;
        color: #f1f5f9;
      }
    }
  `
  shadowRoot.appendChild(style)
  return shadowRoot
}

function speakText(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = /[\u4e00-\u9fa5]/.test(text) ? 'zh-CN' : 'en-US'
  window.speechSynthesis.speak(utterance)
}

export function hideSelectionUI() {
  if (!shadowRoot) return
  const triggers = shadowRoot.querySelectorAll('.mt-float-trigger, #mt-trigger')
  triggers.forEach((t) => t.remove())
  const cards = shadowRoot.querySelectorAll('.mt-card, #mt-card')
  cards.forEach((c) => c.remove())
}

function showBubbleTrigger(x: number, y: number, text: string) {
  const root = ensureHost()
  hideSelectionUI()

  currentSelectedText = text

  const trigger = document.createElement('div')
  trigger.id = 'mt-trigger'
  trigger.className = 'mt-float-trigger'
  trigger.title = 'MyTabs 沉浸式翻译'
  trigger.innerHTML = `译`

  // 避免超出屏幕边界
  const safeX = Math.min(x, window.innerWidth + window.scrollX - 40)
  const safeY = Math.min(y + 8, window.innerHeight + window.scrollY - 40)

  trigger.style.left = `${safeX}px`
  trigger.style.top = `${safeY}px`

  trigger.addEventListener('mousedown', (e) => {
    e.stopPropagation()
    e.preventDefault()
  })

  // 支持点击直接展开
  trigger.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    openTranslationCard(safeX, safeY, text)
  })

  // 支持鼠标悬停 200ms 自动展开，无需费劲点击
  let hoverTimer: number | null = null
  trigger.addEventListener('mouseenter', () => {
    hoverTimer = window.setTimeout(() => {
      openTranslationCard(safeX, safeY, text)
    }, 200)
  })
  trigger.addEventListener('mouseleave', () => {
    if (hoverTimer) clearTimeout(hoverTimer)
  })

  root.appendChild(trigger)
}

function openTranslationCard(x: number, y: number, text: string) {
  const root = ensureHost()
  hideSelectionUI()

  const card = document.createElement('div')
  card.id = 'mt-card'
  card.className = 'mt-card'

  // 计算卡片位置（防止屏幕溢出）
  const cardWidth = 320
  let posX = x
  if (posX + cardWidth > window.innerWidth + window.scrollX - 20) {
    posX = window.innerWidth + window.scrollX - cardWidth - 20
  }
  if (posX < window.scrollX + 10) posX = window.scrollX + 10

  // 计算卡片垂直位置（若底部超出屏幕，翻转到选区上方）
  let posY = y + 8
  const estimatedHeight = 220
  if (posY - window.scrollY + estimatedHeight > window.innerHeight && y - window.scrollY - estimatedHeight > 20) {
    posY = y - estimatedHeight - 16
  }

  card.style.left = `${posX}px`
  card.style.top = `${posY}px`

  card.addEventListener('mousedown', (e) => e.stopPropagation())

  // 渲染卡片结构
  card.innerHTML = `
    <div class="mt-header">
      <div class="mt-brand">
        <span>🌹</span>
        <span>MyTabs 沉浸式翻译</span>
      </div>
      <div class="mt-actions">
        <button class="mt-icon-btn" id="mt-btn-speak" title="朗读">🔊 朗读</button>
        <button class="mt-icon-btn" id="mt-btn-copy" title="复制">📋 复制</button>
      </div>
    </div>
    <div class="mt-original-text">${escapeHtml(text.slice(0, 300))}${text.length > 300 ? '...' : ''}</div>
    <div class="mt-loading" id="mt-loading-box">
      <div class="mt-spinner"></div>
      <span>正在调用微软直连引擎极速翻译...</span>
    </div>
    <div class="mt-trans-result" id="mt-result-box" style="display: none;"></div>
  `

  root.appendChild(card)

  // 绑定功能按钮
  const btnSpeak = card.querySelector('#mt-btn-speak') as HTMLButtonElement
  btnSpeak?.addEventListener('click', () => speakText(text))

  const btnCopy = card.querySelector('#mt-btn-copy') as HTMLButtonElement
  btnCopy?.addEventListener('click', () => {
    const resultBox = card.querySelector('#mt-result-box')
    const copyContent = resultBox?.textContent || text
    navigator.clipboard.writeText(copyContent).then(() => {
      btnCopy.textContent = '✓ 已复制'
      setTimeout(() => {
        btnCopy.textContent = '📋 复制'
      }, 1500)
    })
  })

  // 请求后台翻译
  chrome.runtime.sendMessage(
    {
      type: 'TRANSLATE_SINGLE_TEXT',
      text,
      targetLang: currentTargetLang
    },
    (res) => {
      if (chrome.runtime.lastError) {
        const loadingBox = card.querySelector('#mt-loading-box') as HTMLElement
        const resultBox = card.querySelector('#mt-result-box') as HTMLElement
        if (loadingBox) loadingBox.style.display = 'none'
        if (resultBox) {
          resultBox.style.display = 'block'
          resultBox.textContent = '扩展已更新，请刷新网页后使用划词翻译'
          resultBox.style.color = '#ef4444'
        }
        return
      }

      const loadingBox = card.querySelector('#mt-loading-box') as HTMLElement
      const resultBox = card.querySelector('#mt-result-box') as HTMLElement
      if (loadingBox) loadingBox.style.display = 'none'

      if (resultBox) {
        resultBox.style.display = 'block'
        if (res?.success && res.translated) {
          resultBox.textContent = res.translated
        } else {
          resultBox.textContent = res?.error || '翻译暂不可用，请稍后重试'
          resultBox.style.color = '#ef4444'
        }
      }
    }
  )
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m] || m))
}

/**
 * 监听全局选区事件
 */
export function initSelectionTranslator(
  enabled: boolean = true,
  targetLang: string = 'zh-Hans',
  triggerMode: SelectionTriggerMode = 'bubble'
) {
  isSelectionBubbleEnabled = enabled
  currentTargetLang = targetLang
  currentTriggerMode = triggerMode

  if (isInitialized) return
  isInitialized = true

  document.addEventListener('mouseup', (e) => {
    if (!isSelectionBubbleEnabled) return

    // 如果点击的是我们的 Shadow Host，直接忽略
    if (hostElement && (e.target === hostElement || hostElement.contains(e.target as Node))) {
      return
    }

    // 忽略在特定的非翻译区域（如设置面板、禁止翻译的标记区域）
    const targetEl = e.target as HTMLElement | null
    if (targetEl?.closest?.('[data-no-selection-translate], [data-mytabs-ignore]')) {
      return
    }

    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        hideSelectionUI()
        return
      }

      const text = selection.toString().trim()
      // 过滤空串、超长（>5000字符）或纯标点/纯空白/纯数字
      if (!text || text.length === 0 || text.length > 5000 || /^[\s\d.,!?;:()]+$/.test(text)) {
        hideSelectionUI()
        return
      }

      if (selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return

      // 优先以选区左下方为锚点
      const anchorX = Math.round(rect.left + window.scrollX)
      const anchorY = Math.round(rect.bottom + window.scrollY)

      if (currentTriggerMode === 'direct') {
        openTranslationCard(anchorX, anchorY, text)
      } else {
        showBubbleTrigger(anchorX, anchorY, text)
      }
    }, 20)
  })

  // 监听用户按下 Ctrl+C 复制事件：同样支持自动呼出翻译卡片
  document.addEventListener('copy', () => {
    if (!isSelectionBubbleEnabled) return
    setTimeout(() => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      if (text && text.length >= 1 && text.length <= 5000 && !/^[\s\d.,!?;:()]+$/.test(text)) {
        try {
          if (!selection || selection.rangeCount === 0) return
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          if (rect) {
            const posX = Math.round(rect.left + window.scrollX)
            const posY = Math.round(rect.bottom + window.scrollY)
            if (currentTriggerMode === 'direct') {
              openTranslationCard(posX, posY, text)
            } else {
              showBubbleTrigger(posX, posY, text)
            }
          }
        } catch {}
      }
    }, 50)
  })

  // 点击空白区域时收起卡片
  document.addEventListener('mousedown', (e) => {
    if (hostElement && shadowRoot) {
      const path = e.composedPath()
      if (path.includes(hostElement)) return
    }
    hideSelectionUI()
  })

  // 按下 ESC 键收起
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideSelectionUI()
    }
  })
}

export function updateSelectionConfig(
  enabled: boolean,
  targetLang: string,
  triggerMode: SelectionTriggerMode = 'bubble'
) {
  isSelectionBubbleEnabled = enabled
  currentTargetLang = targetLang
  currentTriggerMode = triggerMode
  if (!enabled) {
    hideSelectionUI()
  }
}
