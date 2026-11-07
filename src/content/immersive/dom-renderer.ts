import type { TranslatableNodeWrapper, ImmersiveConfig } from './types'

const STYLE_ELEMENT_ID = 'mytabs-trans-global-styles'

/**
 * 注入沉浸式翻译排版样式
 */
export function injectTranslationStyles(styleType: 'dashed' | 'block' | 'highlight' = 'dashed') {
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    const existing = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement
    existing.textContent = getCssRules(styleType)
    return
  }

  const styleEl = document.createElement('style')
  styleEl.id = STYLE_ELEMENT_ID
  styleEl.setAttribute('data-mytabs-ignore', 'true')
  styleEl.textContent = getCssRules(styleType)
  ;(document.head || document.documentElement).appendChild(styleEl)
}

function getCssRules(styleType: string): string {
  let variantStyles = ''

  if (styleType === 'block') {
    variantStyles = `
      background-color: rgba(99, 102, 241, 0.06);
      border-left: 3px solid #6366f1;
      padding: 6px 12px;
      border-radius: 4px;
      margin-top: 6px;
      margin-bottom: 8px;
    `
  } else if (styleType === 'highlight') {
    variantStyles = `
      background-color: rgba(254, 240, 138, 0.25);
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
    `
  } else {
    // 默认 dashed: 柔和下划细虚线，极简优雅
    variantStyles = `
      border-bottom: 1px dashed rgba(156, 163, 175, 0.45);
      padding-bottom: 4px;
      margin-top: 4px;
      margin-bottom: 8px;
    `
  }

  return `
    mytabs-trans {
      display: block !important;
      position: relative !important;
      font-size: 0.93em !important;
      line-height: 1.55 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif !important;
      color: #4b5563 !important;
      font-weight: 400 !important;
      text-align: inherit !important;
      letter-spacing: normal !important;
      word-break: break-word !important;
      opacity: 0;
      transform: translateY(-2px);
      transition: opacity 0.25s ease-out, transform 0.25s ease-out !important;
      user-select: text !important;
      ${variantStyles}
    }

    @media (prefers-color-scheme: dark) {
      mytabs-trans {
        color: #9ca3af !important;
      }
    }

    mytabs-trans.mt-trans-visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }

    mytabs-trans.mt-trans-hidden {
      display: none !important;
    }

    /* 浮动加载动画占位条 */
    .mytabs-trans-skeleton {
      display: inline-block;
      height: 14px;
      width: 70%;
      background: linear-gradient(90deg, rgba(200,200,200,0.15) 25%, rgba(200,200,200,0.3) 50%, rgba(200,200,200,0.15) 75%);
      background-size: 200% 100%;
      animation: mt-skeleton 1.5s infinite;
      border-radius: 4px;
      margin-top: 4px;
    }

    @keyframes mt-skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `
}

/**
 * 将翻译结果挂载到原文节点下方
 */
export function mountTranslationNode(wrapper: TranslatableNodeWrapper, config: ImmersiveConfig): HTMLElement {
  if (wrapper.transElement && wrapper.transElement.isConnected) {
    wrapper.transElement.textContent = wrapper.translatedText || ''
    wrapper.transElement.classList.add('mt-trans-visible')
    return wrapper.transElement
  }

  const transEl = document.createElement('mytabs-trans')
  transEl.setAttribute('data-mytabs-trans', 'true')
  transEl.setAttribute('data-block-id', wrapper.id)
  transEl.textContent = wrapper.translatedText || ''

  // 插入在原文元素正后方
  const parent = wrapper.element.parentElement
  if (parent) {
    if (wrapper.element.nextSibling) {
      parent.insertBefore(transEl, wrapper.element.nextSibling)
    } else {
      parent.appendChild(transEl)
    }
  }

  // 触发渐显动画
  requestAnimationFrame(() => {
    transEl.classList.add('mt-trans-visible')
  })

  wrapper.transElement = transEl
  return transEl
}

/**
 * 切换全局译文显示/隐藏状态
 */
export function setTranslationsVisibility(visible: boolean) {
  const transNodes = document.querySelectorAll<HTMLElement>('mytabs-trans')
  transNodes.forEach((node) => {
    if (visible) {
      node.classList.remove('mt-trans-hidden')
    } else {
      node.classList.add('mt-trans-hidden')
    }
  })
}
