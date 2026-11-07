import type { SelectionTriggerMode } from './types'
import {
  analyzeEnglishGrammar,
  renderGrammarToHtml,
  type GrammarDisplayMode,
  type AnalyzedSentence
} from './grammar-engine'

let hostElement: HTMLElement | null = null
let shadowRoot: ShadowRoot | null = null
let tooltipElement: HTMLElement | null = null
let isSelectionBubbleEnabled = true
let isGrammarEnabled = true
let currentGrammarMode: GrammarDisplayMode = 'syntax'
let currentSelectedText = ''
let currentTargetLang = 'zh-Hans'
let currentTriggerMode: SelectionTriggerMode = 'bubble'
let isAdaptiveSize = true
let isResizable = true
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

    /* 极细滚动条美化 */
    ::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.4);
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(107, 114, 128, 0.7);
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
      width: 380px;
      max-width: calc(100vw - 32px);
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(229, 231, 235, 0.85);
      border-radius: 14px;
      box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08);
      padding: 12px 14px;
      color: #1f2937;
      font-size: 13px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: mt-card-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      z-index: 2147483647;
      overflow: hidden;
    }

    .mt-card.mt-card-resizable {
      resize: both;
      overflow: auto;
      min-width: 320px;
      min-height: 160px;
    }

    @keyframes mt-card-in {
      from {
        opacity: 0;
        transform: translateY(4px) scale(0.97);
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
      shrink: 0;
    }

    .mt-brand {
      display: flex;
      align-items: center;
      gap: 5px;
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
      color: #6b7280;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .mt-icon-btn:hover {
      background: #f3f4f6;
      color: #1f2937;
    }

    .mt-original-box {
      display: flex;
      flex-direction: column;
      gap: 3px;
      shrink: 0;
    }

    .mt-section-title {
      font-size: 10.5px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .mt-toggle-orig-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #4f46e5;
      font-size: 11px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 4px;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      text-transform: none;
      letter-spacing: normal;
    }

    .mt-toggle-orig-btn:hover {
      background: #eef2ff;
      color: #3730a3;
    }

    .mt-original-text {
      color: #4b5563;
      font-size: 12px;
      line-height: 1.45;
      background: #f9fafb;
      padding: 6px 10px;
      border-radius: 6px;
      border-left: 3px solid #cbd5e1;
      max-height: 80px;
      overflow-y: auto;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .mt-result-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-height: 40px;
      overflow: hidden;
    }

    .mt-trans-result {
      color: #111827;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.6;
      word-break: break-word;
      white-space: pre-wrap;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 4px;
      flex: 1;
    }

    .mt-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 12px;
      padding: 10px 2px;
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

    /* 语法高亮分词胶囊通用样式 */
    .mt-grammar-token {
      display: inline-block;
      padding: 0 4px;
      margin: 1px 1.5px;
      border-radius: 4px;
      transition: all 0.15s ease;
      cursor: help;
      line-height: 1.45;
    }
    .mt-grammar-token:hover {
      filter: brightness(0.92);
      transform: translateY(-1px);
      box-shadow: 0 2px 5px rgba(0,0,0,0.12);
    }
    .mt-token-plain {
      display: inline;
    }

    /* 句子成分模式配色 (浅色模式) */
    .mt-role-subject {
      background: rgba(59, 130, 246, 0.12);
      color: #1d4ed8;
      border: 1px solid rgba(59, 130, 246, 0.32);
      font-weight: 500;
    }
    .mt-role-predicate {
      background: rgba(239, 68, 68, 0.12);
      color: #b91c1c;
      border: 1px solid rgba(239, 68, 68, 0.38);
      font-weight: 600;
    }
    .mt-role-object {
      background: rgba(16, 185, 129, 0.12);
      color: #047857;
      border: 1px solid rgba(16, 185, 129, 0.32);
      font-weight: 500;
    }
    .mt-role-predicative {
      background: rgba(6, 182, 212, 0.12);
      color: #0e7490;
      border: 1px solid rgba(6, 182, 212, 0.32);
      font-weight: 500;
    }
    .mt-role-modifier {
      background: rgba(245, 158, 11, 0.12);
      color: #b45309;
      border: 1px dashed rgba(245, 158, 11, 0.42);
    }
    .mt-role-conjunction {
      background: rgba(139, 92, 246, 0.12);
      color: #6d28d9;
      border: 1px solid rgba(139, 92, 246, 0.32);
      font-weight: 600;
    }

    /* 词性模式配色 (浅色模式) */
    .mt-pos-noun {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
      border-bottom: 2px solid #3b82f6;
    }
    .mt-pos-verb {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border-bottom: 2px solid #ef4444;
      font-weight: 600;
    }
    .mt-pos-adj {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
      border-bottom: 2px solid #10b981;
    }
    .mt-pos-adv {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
      border-bottom: 2px solid #f59e0b;
    }
    .mt-pos-pron {
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
      border-bottom: 2px solid #6366f1;
    }
    .mt-pos-prep {
      background: rgba(168, 85, 247, 0.1);
      color: #9333ea;
      border-bottom: 2px solid #a855f7;
    }
    .mt-pos-conj {
      background: rgba(236, 72, 153, 0.1);
      color: #db2777;
      border-bottom: 2px solid #ec4899;
    }
    .mt-pos-det {
      background: rgba(107, 114, 128, 0.08);
      color: #4b5563;
    }

    /* 语法浮动提示气泡 Tooltip */
    .mt-grammar-tooltip {
      position: absolute;
      background: rgba(17, 24, 39, 0.95);
      backdrop-filter: blur(8px);
      color: #ffffff;
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 11px;
      line-height: 1.35;
      pointer-events: none;
      z-index: 2147483647;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      transition: opacity 0.12s ease;
      white-space: nowrap;
      display: none;
    }
    .mt-grammar-tooltip .mt-tip-sub {
      color: #9ca3af;
      font-size: 10px;
    }

    /* 模式切换按钮栏 */
    .mt-grammar-controls {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #f1f5f9;
      padding: 2px 3px;
      border-radius: 6px;
    }
    .mt-mode-btn {
      background: transparent;
      border: none;
      font-size: 10.5px;
      color: #64748b;
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .mt-mode-btn:hover {
      color: #1e2937;
    }
    .mt-mode-btn.active {
      background: #ffffff;
      color: #4f46e5;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* 语法图例栏 */
    .mt-grammar-legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 5px 10px;
      padding-top: 5px;
      margin-top: 4px;
      border-top: 1px dashed #e5e7eb;
      font-size: 10.5px;
      color: #6b7280;
    }
    .mt-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .mt-legend-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    /* 暗色模式适配 */
    @media (prefers-color-scheme: dark) {
      .mt-card {
        background: rgba(30, 41, 59, 0.96);
        border-color: rgba(51, 65, 85, 0.85);
        color: #f1f5f9;
        box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5);
      }
      .mt-header {
        border-bottom-color: #334155;
        color: #94a3b8;
      }
      .mt-section-title {
        color: #64748b;
      }
      .mt-toggle-orig-btn {
        color: #818cf8;
      }
      .mt-toggle-orig-btn:hover {
        background: #312e81;
        color: #c7d2fe;
      }
      .mt-original-text {
        background: #0f172a;
        color: #cbd5e1;
        border-left-color: #475569;
      }
      .mt-trans-result {
        color: #f8fafc;
      }
      .mt-icon-btn {
        color: #94a3b8;
      }
      .mt-icon-btn:hover {
        background: #334155;
        color: #f1f5f9;
      }
      .mt-role-subject {
        background: rgba(59, 130, 246, 0.22);
        color: #93c5fd;
        border-color: rgba(59, 130, 246, 0.4);
      }
      .mt-role-predicate {
        background: rgba(239, 68, 68, 0.22);
        color: #fca5a5;
        border-color: rgba(239, 68, 68, 0.45);
      }
      .mt-role-object {
        background: rgba(16, 185, 129, 0.22);
        color: #6ee7b7;
        border-color: rgba(16, 185, 129, 0.4);
      }
      .mt-role-predicative {
        background: rgba(6, 182, 212, 0.22);
        color: #67e8f9;
        border-color: rgba(6, 182, 212, 0.4);
      }
      .mt-role-modifier {
        background: rgba(245, 158, 11, 0.2);
        color: #fcd34d;
        border-color: rgba(245, 158, 11, 0.45);
      }
      .mt-role-conjunction {
        background: rgba(139, 92, 246, 0.22);
        color: #c4b5fd;
        border-color: rgba(139, 92, 246, 0.45);
      }
      .mt-pos-noun {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
      }
      .mt-pos-verb {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
      }
      .mt-pos-adj {
        background: rgba(16, 185, 129, 0.2);
        color: #6ee7b7;
      }
      .mt-pos-adv {
        background: rgba(245, 158, 11, 0.2);
        color: #fcd34d;
      }
      .mt-pos-pron {
        background: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
      }
      .mt-pos-prep {
        background: rgba(168, 85, 247, 0.2);
        color: #d8b4fe;
      }
      .mt-pos-conj {
        background: rgba(236, 72, 153, 0.2);
        color: #f472b6;
      }
      .mt-grammar-controls {
        background: #0f172a;
      }
      .mt-mode-btn {
        color: #94a3b8;
      }
      .mt-mode-btn:hover {
        color: #f8fafc;
      }
      .mt-mode-btn.active {
        background: #1e2937;
        color: #818cf8;
      }
      .mt-grammar-legend {
        border-top-color: #334155;
        color: #94a3b8;
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

function ensureTooltip(): HTMLElement {
  const root = ensureHost()
  if (tooltipElement && tooltipElement.isConnected) return tooltipElement
  tooltipElement = document.createElement('div')
  tooltipElement.className = 'mt-grammar-tooltip'
  root.appendChild(tooltipElement)
  return tooltipElement
}

function renderLegendHtml(mode: GrammarDisplayMode): string {
  if (mode === 'syntax') {
    return `
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #3b82f6;"></span>主语 (S)</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #ef4444;"></span>谓语 (V)</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #10b981;"></span>宾/表语 (O/P)</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #f59e0b;"></span>修饰/从句 (M)</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #8b5cf6;"></span>连词/引导词 (C)</span>
    `
  }
  if (mode === 'pos') {
    return `
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #3b82f6;"></span>名词</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #ef4444;"></span>动词</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #10b981;"></span>形容词</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #f59e0b;"></span>副词</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #8b5cf6;"></span>介词</span>
      <span class="mt-legend-item"><span class="mt-legend-dot" style="background: #ec4899;"></span>连词</span>
    `
  }
  return ''
}

export function hideSelectionUI() {
  if (!shadowRoot) return
  const triggers = shadowRoot.querySelectorAll('.mt-float-trigger, #mt-trigger')
  triggers.forEach((t) => t.remove())
  const cards = shadowRoot.querySelectorAll('.mt-card, #mt-card')
  cards.forEach((c) => c.remove())
  if (tooltipElement) {
    tooltipElement.style.display = 'none'
  }
}

const SAFE_BOTTOM_GAP = 28 // 底部预留避让系统任务栏与浏览器边界
const SAFE_TOP_GAP = 16 // 顶部预留安全边距

function showBubbleTrigger(rect: DOMRect, text: string) {
  const root = ensureHost()
  hideSelectionUI()

  currentSelectedText = text

  const trigger = document.createElement('div')
  trigger.id = 'mt-trigger'
  trigger.className = 'mt-float-trigger'
  trigger.title = 'MyTabs 翻译'
  trigger.innerHTML = `译`

  // 避免超出屏幕边界
  const safeX = Math.min(rect.left + window.scrollX, window.innerWidth + window.scrollX - 40)
  const safeY = Math.min(rect.bottom + window.scrollY + 8, window.innerHeight + window.scrollY - 40)

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
    openTranslationCard(rect, text)
  })

  // 支持鼠标悬停 200ms 自动展开
  let hoverTimer: number | null = null
  trigger.addEventListener('mouseenter', () => {
    hoverTimer = window.setTimeout(() => {
      openTranslationCard(rect, text)
    }, 200)
  })
  trigger.addEventListener('mouseleave', () => {
    if (hoverTimer) clearTimeout(hoverTimer)
  })

  root.appendChild(trigger)
}

function openTranslationCard(rect: DOMRect, text: string) {
  const root = ensureHost()
  hideSelectionUI()

  const card = document.createElement('div')
  card.id = 'mt-card'
  card.className = 'mt-card'
  if (isResizable) {
    card.classList.add('mt-card-resizable')
  }

  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  const isLongText = text.length > 80

  // 1. 宽度自适应计算
  let cardWidth = 380
  if (isAdaptiveSize) {
    if (isLongText) {
      cardWidth = Math.min(540, viewportW - 32)
    } else if (text.length > 30) {
      cardWidth = Math.min(430, viewportW - 32)
    } else {
      cardWidth = 360
    }
  }
  card.style.width = `${cardWidth}px`

  // 2. 计算卡片水平坐标（防止左右超出屏幕）
  let posX = rect.left + window.scrollX
  if (posX + cardWidth > viewportW + window.scrollX - 16) {
    posX = viewportW + window.scrollX - cardWidth - 16
  }
  if (posX < window.scrollX + 16) posX = window.scrollX + 16
  card.style.left = `${posX}px`

  // 3. 计算视口上方与下方可用高度空间与自适应停靠
  const spaceBelow = viewportH - rect.bottom - SAFE_BOTTOM_GAP
  const spaceAbove = rect.top - SAFE_TOP_GAP
  let isUpward = false
  let maxCardHeight = 460
  let posY = rect.bottom + window.scrollY + 8

  if (isAdaptiveSize) {
    const targetHeight = isLongText ? 480 : 280
    const maxAvailable = Math.max(220, viewportH - SAFE_TOP_GAP - SAFE_BOTTOM_GAP)
    maxCardHeight = Math.min(540, Math.min(targetHeight, maxAvailable))

    if (spaceBelow >= maxCardHeight + 8) {
      isUpward = false
      posY = rect.bottom + window.scrollY + 8
    } else if (spaceAbove >= maxCardHeight + 8) {
      isUpward = true
      posY = Math.max(window.scrollY + SAFE_TOP_GAP, rect.top + window.scrollY - maxCardHeight - 8)
    } else {
      // 上下空间都较为局促（如选区本身跨度很大、贴近屏幕边缘）
      // 智能在视口安全范围内停靠，避免被屏幕底边挤扁
      if (spaceBelow >= spaceAbove) {
        isUpward = false
        const clientTop = Math.max(SAFE_TOP_GAP, Math.min(rect.bottom + 8, viewportH - SAFE_BOTTOM_GAP - maxCardHeight))
        posY = window.scrollY + clientTop
      } else {
        isUpward = true
        const clientTop = Math.max(SAFE_TOP_GAP, rect.top - maxCardHeight - 8)
        posY = window.scrollY + clientTop
      }
    }
  } else {
    isUpward = spaceBelow < 260 && spaceAbove > spaceBelow
    const availableHeight = isUpward ? spaceAbove : spaceBelow
    maxCardHeight = Math.min(520, Math.max(180, Math.floor(availableHeight - 12)))
    posY = isUpward ? rect.top + window.scrollY - 8 : rect.bottom + window.scrollY + 8
  }

  card.style.maxHeight = `${maxCardHeight}px`
  card.style.top = `${posY}px`
  card.addEventListener('mousedown', (e) => e.stopPropagation())

  // 4. 渲染卡片结构：支持长原文折叠与语法彩色分析
  const wordCount = text.length
  const showCollapsibleOrig = isAdaptiveSize && isLongText

  const isEnglish = /[a-zA-Z]{2,}/.test(text)
  const analyzedSentences: AnalyzedSentence[] = (isEnglish && isGrammarEnabled)
    ? analyzeEnglishGrammar(text)
    : []

  const initialContentHtml = (isEnglish && isGrammarEnabled)
    ? renderGrammarToHtml(analyzedSentences, currentGrammarMode)
    : escapeHtml(text)

  const legendInitialHtml = (isEnglish && isGrammarEnabled && currentGrammarMode !== 'plain')
    ? `<div class="mt-grammar-legend" id="mt-grammar-legend">${renderLegendHtml(currentGrammarMode)}</div>`
    : `<div class="mt-grammar-legend" id="mt-grammar-legend" style="display: none;"></div>`

  const controlsHtml = (isEnglish && isGrammarEnabled)
    ? `
      <div class="mt-grammar-controls" id="mt-grammar-switch">
        <button class="mt-mode-btn ${currentGrammarMode === 'syntax' ? 'active' : ''}" data-mode="syntax" type="button" title="句子主干成分分析 (主谓宾定状从句)">成分</button>
        <button class="mt-mode-btn ${currentGrammarMode === 'pos' ? 'active' : ''}" data-mode="pos" type="button" title="词性分类标注 (名/动/形/副等)">词性</button>
        <button class="mt-mode-btn ${currentGrammarMode === 'plain' ? 'active' : ''}" data-mode="plain" type="button" title="原始纯文本">纯文本</button>
      </div>
    `
    : ''

  const origSectionHtml = showCollapsibleOrig
    ? `
    <div class="mt-original-box">
      <div class="mt-section-title">
        <span>选区原文 · 共 ${wordCount} 字</span>
        <div style="display: flex; align-items: center; gap: 6px;">
          ${controlsHtml}
          <button class="mt-toggle-orig-btn" id="mt-btn-toggle-orig" type="button">展开原文 ▾</button>
        </div>
      </div>
      <div class="mt-original-text" id="mt-orig-text" style="display: none;">${initialContentHtml}</div>
      ${legendInitialHtml}
    </div>
    `
    : `
    <div class="mt-original-box">
      <div class="mt-section-title">
        <span>选区原文 · 共 ${wordCount} 字</span>
        ${controlsHtml}
      </div>
      <div class="mt-original-text" id="mt-orig-text">${initialContentHtml}</div>
      ${legendInitialHtml}
    </div>
    `

  card.innerHTML = `
    <div class="mt-header">
      <div class="mt-brand">
        <span>🌹</span>
        <span>MyTabs 翻译与语法</span>
      </div>
      <div class="mt-actions">
        <button class="mt-icon-btn" id="mt-btn-speak" title="朗读">🔊 朗读</button>
        <button class="mt-icon-btn" id="mt-btn-copy" title="复制">📋 复制</button>
      </div>
    </div>
    ${origSectionHtml}
    <div class="mt-result-container">
      <div class="mt-loading" id="mt-loading-box">
        <div class="mt-spinner"></div>
        <span>正在调用微软直连引擎极速翻译...</span>
      </div>
      <div class="mt-trans-result" id="mt-result-box" style="display: none;"></div>
    </div>
  `

  root.appendChild(card)

  // 如果非自适应且朝上展开，将卡片底部对准选区上方
  if (isUpward && !isAdaptiveSize) {
    const cardH = card.offsetHeight
    posY = Math.max(window.scrollY + SAFE_TOP_GAP, rect.top + window.scrollY - cardH - 8)
    card.style.top = `${posY}px`
  }

  // 绑定折叠原文按钮
  if (showCollapsibleOrig) {
    const toggleBtn = card.querySelector('#mt-btn-toggle-orig') as HTMLButtonElement
    const origBox = card.querySelector('#mt-orig-text') as HTMLElement
    const legendBox = card.querySelector('#mt-grammar-legend') as HTMLElement
    if (toggleBtn && origBox) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const isHidden = origBox.style.display === 'none'
        origBox.style.display = isHidden ? 'block' : 'none'
        if (legendBox && currentGrammarMode !== 'plain') {
          legendBox.style.display = isHidden ? 'flex' : 'none'
        }
        toggleBtn.textContent = isHidden ? '收起原文 ▴' : '展开原文 ▾'
        requestAnimationFrame(clampToViewport)
      })
    }
  }

  // 绑定语法模式切换与 Tooltip 事件
  if (isEnglish && isGrammarEnabled) {
    const switchBox = card.querySelector('#mt-grammar-switch')
    const origBox = card.querySelector('#mt-orig-text') as HTMLElement
    const legendBox = card.querySelector('#mt-grammar-legend') as HTMLElement

    if (switchBox && origBox) {
      switchBox.querySelectorAll('.mt-mode-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const mode = (btn as HTMLElement).getAttribute('data-mode') as GrammarDisplayMode
          if (!mode) return
          currentGrammarMode = mode

          switchBox.querySelectorAll('.mt-mode-btn').forEach((b) => b.classList.remove('active'))
          btn.classList.add('active')

          origBox.innerHTML = renderGrammarToHtml(analyzedSentences, currentGrammarMode)

          if (legendBox) {
            if (currentGrammarMode === 'plain') {
              legendBox.style.display = 'none'
            } else {
              legendBox.style.display = 'flex'
              legendBox.innerHTML = renderLegendHtml(currentGrammarMode)
            }
          }

          requestAnimationFrame(clampToViewport)
        })
      })
    }

    if (origBox) {
      origBox.addEventListener('mouseover', (e) => {
        const target = (e.target as HTMLElement)?.closest?.('.mt-grammar-token') as HTMLElement | null
        if (!target) return
        const tipHtml = target.getAttribute('data-grammar-tip')
        if (!tipHtml) return

        const tip = ensureTooltip()
        tip.innerHTML = tipHtml
        tip.style.display = 'block'

        const targetRect = target.getBoundingClientRect()
        const tipW = tip.offsetWidth
        const tipH = tip.offsetHeight

        let tipX = targetRect.left + window.scrollX + (targetRect.width / 2) - (tipW / 2)
        let tipY = targetRect.top + window.scrollY - tipH - 6

        if (tipX < window.scrollX + 8) tipX = window.scrollX + 8
        if (tipX + tipW > window.innerWidth + window.scrollX - 8) {
          tipX = window.innerWidth + window.scrollX - tipW - 8
        }
        if (targetRect.top - tipH - 6 < 8) {
          tipY = targetRect.bottom + window.scrollY + 6
        }

        tip.style.left = `${tipX}px`
        tip.style.top = `${tipY}px`
      })

      origBox.addEventListener('mouseout', (e) => {
        const target = (e.target as HTMLElement)?.closest?.('.mt-grammar-token')
        if (target && tooltipElement) {
          tooltipElement.style.display = 'none'
        }
      })
    }
  }

  // 绑定朗读与复制按钮
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

  // 动态视口校准：确保卡片底部绝对不沉入 Windows 任务栏或浏览器视口下方
  const clampToViewport = () => {
    const cardRect = card.getBoundingClientRect()
    const maxBottom = window.innerHeight - SAFE_BOTTOM_GAP

    if (cardRect.bottom > maxBottom) {
      const overflow = cardRect.bottom - maxBottom
      const curTop = parseFloat(card.style.top) || 0
      const safeTop = Math.max(window.scrollY + SAFE_TOP_GAP, curTop - overflow)
      card.style.top = `${safeTop}px`
    }

    if (isUpward && !isAdaptiveSize) {
      const cardH = card.offsetHeight
      const upwardTop = Math.max(window.scrollY + SAFE_TOP_GAP, rect.top + window.scrollY - cardH - 8)
      card.style.top = `${upwardTop}px`
    }
  }

  // 请求后台翻译
  chrome.runtime.sendMessage(
    {
      type: 'TRANSLATE_SINGLE_TEXT',
      text,
      targetLang: currentTargetLang
    },
    (res) => {
      const loadingBox = card.querySelector('#mt-loading-box') as HTMLElement
      const resultBox = card.querySelector('#mt-result-box') as HTMLElement
      if (loadingBox) loadingBox.style.display = 'none'

      if (chrome.runtime.lastError) {
        if (resultBox) {
          resultBox.style.display = 'block'
          resultBox.textContent = '扩展已更新，请刷新网页后使用翻译'
          resultBox.style.color = '#ef4444'
        }
        clampToViewport()
        return
      }

      if (resultBox) {
        resultBox.style.display = 'block'
        if (res?.success && res.translated) {
          resultBox.textContent = res.translated
        } else {
          resultBox.textContent = res?.error || '翻译暂不可用，请稍后重试'
          resultBox.style.color = '#ef4444'
        }
      }

      // 异步渲染完成后，立即执行动态视口边界二次修正
      requestAnimationFrame(clampToViewport)
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
  triggerMode: SelectionTriggerMode = 'bubble',
  adaptiveSize: boolean = true,
  resizable: boolean = true,
  grammarHighlight: boolean = true,
  grammarDefaultMode: GrammarDisplayMode = 'syntax'
) {
  isSelectionBubbleEnabled = enabled
  currentTargetLang = targetLang
  currentTriggerMode = triggerMode
  isAdaptiveSize = adaptiveSize
  isResizable = resizable
  isGrammarEnabled = grammarHighlight
  currentGrammarMode = grammarDefaultMode

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
      // 过滤空串、超长（>25000字符）或纯标点/纯空白/纯数字
      if (!text || text.length === 0 || text.length > 25000 || /^[\s\d.,!?;:()]+$/.test(text)) {
        hideSelectionUI()
        return
      }

      if (selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return

      if (currentTriggerMode === 'direct') {
        openTranslationCard(rect, text)
      } else {
        showBubbleTrigger(rect, text)
      }
    }, 20)
  })

  // 监听用户按下 Ctrl+C 复制事件：同样支持自动呼出翻译卡片
  document.addEventListener('copy', () => {
    if (!isSelectionBubbleEnabled) return
    setTimeout(() => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      if (text && text.length >= 1 && text.length <= 25000 && !/^[\s\d.,!?;:()]+$/.test(text)) {
        try {
          if (!selection || selection.rangeCount === 0) return
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()
          if (rect && (rect.width > 0 || rect.height > 0)) {
            if (currentTriggerMode === 'direct') {
              openTranslationCard(rect, text)
            } else {
              showBubbleTrigger(rect, text)
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
  triggerMode: SelectionTriggerMode = 'bubble',
  adaptiveSize: boolean = true,
  resizable: boolean = true,
  grammarHighlight: boolean = true,
  grammarDefaultMode: GrammarDisplayMode = 'syntax'
) {
  isSelectionBubbleEnabled = enabled
  currentTargetLang = targetLang
  currentTriggerMode = triggerMode
  isAdaptiveSize = adaptiveSize
  isResizable = resizable
  isGrammarEnabled = grammarHighlight
  currentGrammarMode = grammarDefaultMode
  if (!enabled) {
    hideSelectionUI()
  }
}

