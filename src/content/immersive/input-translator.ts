/**
 * 输入框连续 3 次空格快捷翻译 (Triple-Space Translation)
 * 支持 input、textarea 以及 contenteditable 富文本
 * 自动识别中英文互翻，完美触发 React/Vue 表单合成事件
 */

let isTripleSpaceEnabled = false
let isInitialized = false
const spaceTimestamps: number[] = []
let activeToast: HTMLElement | null = null

function showFloatingToast(targetEl: HTMLElement, message: string) {
  if (!isTripleSpaceEnabled) return
  if (activeToast) activeToast.remove()

  const toast = document.createElement('div')
  toast.setAttribute('data-mytabs-ignore', 'true')
  toast.style.cssText = `
    position: absolute;
    background: rgba(17, 24, 39, 0.9);
    color: #fff;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    pointer-events: none;
    z-index: 2147483647;
    backdrop-filter: blur(8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    opacity: 0;
    transform: translateY(4px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `
  toast.textContent = message
  document.body.appendChild(toast)

  const rect = targetEl.getBoundingClientRect()
  const top = rect.top + window.scrollY - 28
  const left = rect.left + window.scrollX

  toast.style.top = `${Math.max(top, 10)}px`
  toast.style.left = `${Math.max(left, 10)}px`

  requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  })

  activeToast = toast
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(-4px)'
    setTimeout(() => toast.remove(), 250)
  }, 1800)
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set
  const prototype = Object.getPrototypeOf(element)
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value)
  } else if (valueSetter) {
    valueSetter.call(element, value)
  } else {
    element.value = value
  }

  // 触发框架事件
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

async function handleTripleSpaceTrigger(target: HTMLElement) {
  if (!isTripleSpaceEnabled) return

  let sourceText = ''
  const isInputOrTextarea = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  const isContentEditable = target.isContentEditable

  if (isInputOrTextarea) {
    sourceText = (target as HTMLInputElement | HTMLTextAreaElement).value
  } else if (isContentEditable) {
    sourceText = target.innerText || target.textContent || ''
  }

  // 过滤尾部多余空格并校验
  sourceText = sourceText.trim()
  if (sourceText.length === 0) return

  // 智能识别翻译方向：中文多则翻为英文，英文多则翻为简体中文
  const chineseChars = sourceText.match(/[\u4e00-\u9fa5]/g) || []
  const isChineseDominant = chineseChars.length / sourceText.length > 0.35
  const targetLang = isChineseDominant ? 'en' : 'zh-Hans'
  const directionLabel = isChineseDominant ? '英文' : '中文'

  showFloatingToast(target, `正在翻译为${directionLabel}...`)

  chrome.runtime.sendMessage(
    {
      type: 'TRANSLATE_SINGLE_TEXT',
      text: sourceText,
      targetLang
    },
    (res) => {
      if (!isTripleSpaceEnabled) return

      if (res?.success && res.translated) {
        if (isInputOrTextarea) {
          setNativeValue(target as HTMLInputElement | HTMLTextAreaElement, res.translated)
        } else if (isContentEditable) {
          target.innerText = res.translated
          target.dispatchEvent(new Event('input', { bubbles: true }))
        }
        showFloatingToast(target, `🌹 已快速翻译为${directionLabel}`)
      } else {
        showFloatingToast(target, '翻译失败，请检查网络')
      }
    }
  )
}

export function initTripleSpaceTranslator(enabled: boolean = false) {
  isTripleSpaceEnabled = enabled

  if (isInitialized) return
  isInitialized = true

  document.addEventListener('keydown', (e) => {
    if (!isTripleSpaceEnabled) {
      spaceTimestamps.length = 0
      return
    }
    if (e.key !== ' ' && e.code !== 'Space') return

    const target = e.target as HTMLElement
    if (!target) return

    const isInput = target instanceof HTMLInputElement && ['text', 'search', 'url'].includes(target.type)
    const isTextarea = target instanceof HTMLTextAreaElement
    const isContentEditable = target.isContentEditable

    if (!isInput && !isTextarea && !isContentEditable) return

    const now = Date.now()
    spaceTimestamps.push(now)

    // 只保留最近 3 次
    if (spaceTimestamps.length > 3) {
      spaceTimestamps.shift()
    }

    // 判断连续 3 次按空格且总耗时在 650 毫秒以内
    if (spaceTimestamps.length === 3) {
      const diff = spaceTimestamps[2] - spaceTimestamps[0]
      if (diff < 650) {
        // 阻止第 3 次空格输入
        e.preventDefault()
        spaceTimestamps.length = 0
        handleTripleSpaceTrigger(target)
      }
    }
  }, true)
}

export function updateTripleSpaceConfig(enabled: boolean) {
  isTripleSpaceEnabled = enabled
  spaceTimestamps.length = 0
  if (!enabled && activeToast) {
    try {
      activeToast.remove()
    } catch {}
    activeToast = null
  }
}
