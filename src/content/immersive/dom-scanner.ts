import type { TranslatableNodeWrapper } from './types'

// 忽略与保护标签选择器 (代码块、输入控件、导航广告等严格跳过)
const EXCLUDE_TAGS = new Set([
  'SCRIPT', 'STYLE', 'PRE', 'CODE', 'KBD', 'SAMP', 'VAR',
  'SVG', 'MATH', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME',
  'INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'OPTION',
  'NAV', 'NOSCRIPT'
])

const BLOCK_TAGS = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'DD', 'FIGCAPTION', 'TD']

/**
 * 检查元素本身或其祖先是否属于受保护排除标签
 */
export function isElementExcluded(el: HTMLElement): boolean {
  if (!el || !el.tagName) return true
  if (EXCLUDE_TAGS.has(el.tagName.toUpperCase())) return true
  if (el.hasAttribute('data-mytabs-ignore') || el.hasAttribute('data-mytabs-trans')) return true

  // 检查是否包含特定的代码高亮类名 (如 highlight, hljs, prism)
  const cls = (el.className || '').toString().toLowerCase()
  if (cls.includes('highlight') || cls.includes('hljs') || cls.includes('prism') || cls.includes('syntax')) {
    return true
  }

  // 向上检查 3 层祖先
  let cur: HTMLElement | null = el.parentElement
  let depth = 0
  while (cur && depth < 3) {
    if (EXCLUDE_TAGS.has(cur.tagName.toUpperCase())) return true
    if (cur.hasAttribute('data-mytabs-ignore') || cur.hasAttribute('data-mytabs-trans')) return true
    cur = cur.parentElement
    depth++
  }

  return false
}

/**
 * 判断文本是否绝大部分已经是目标语言
 */
function isAlreadyTargetLanguage(text: string, targetLang: string): boolean {
  const clean = text.trim()
  if (targetLang.startsWith('zh')) {
    const chineseChars = clean.match(/[\u4e00-\u9fa5]/g) || []
    return chineseChars.length / clean.length > 0.45
  }
  if (targetLang === 'en') {
    const englishChars = clean.match(/[a-zA-Z]/g) || []
    return englishChars.length / clean.length > 0.6
  }
  return false
}

/**
 * 判断段落文本是否为无效噪声或纯代码/纯数字
 */
function isNoiseOrCode(text: string): boolean {
  const clean = text.trim()
  if (clean.length < 3) return true
  // 纯数字或日期
  if (/^[\d\s\-_:.,\/+*()#%@!$¥€&|<>]+$/.test(clean)) return true
  // 常见代码语法
  if (/^(const|let|var|function|import|export|class|return|\/\/|\/\*)/.test(clean)) return true
  return false
}

/**
 * 扫描当前 DOM 并抽取待翻译段落
 */
export function scanPageTranslatableBlocks(targetLang: string = 'zh-Hans'): TranslatableNodeWrapper[] {
  const list: TranslatableNodeWrapper[] = []
  const seenElements = new Set<HTMLElement>()

  // 1. 扫描常规块级文本标签
  const selector = BLOCK_TAGS.join(', ')
  const candidates = document.querySelectorAll<HTMLElement>(selector)

  candidates.forEach((el) => {
    if (seenElements.has(el) || isElementExcluded(el)) return
    if (el.hasAttribute('data-mytabs-scanned')) return

    const rawText = (el.innerText || el.textContent || '').trim()
    if (!rawText || isNoiseOrCode(rawText) || isAlreadyTargetLanguage(rawText, targetLang)) {
      return
    }

    seenElements.add(el)
    el.setAttribute('data-mytabs-scanned', 'true')

    list.push({
      id: `mt-block-${Math.random().toString(36).slice(2, 9)}`,
      element: el,
      originalText: rawText,
      status: 'pending'
    })
  })

  // 2. 补充扫描 article / main / 邮件阅读面板 内包含较多纯文本的 div
  const containers = document.querySelectorAll<HTMLElement>('article div, main div, .content div, .post div, [role="main"] div, .ReadingPaneContainer div, .ItemBody div, [data-message-id] div')
  containers.forEach((el) => {
    if (seenElements.has(el) || isElementExcluded(el)) return
    if (el.hasAttribute('data-mytabs-scanned')) return
    // 必须是终端文本节点（不包含其他 p 或 h1~h6 子块），且文字超过 25 字
    if (el.querySelector('p, h1, h2, h3, h4, h5, h6, li, blockquote, div')) return

    const rawText = (el.innerText || el.textContent || '').trim()
    if (rawText.length > 25 && !isNoiseOrCode(rawText) && !isAlreadyTargetLanguage(rawText, targetLang)) {
      seenElements.add(el)
      el.setAttribute('data-mytabs-scanned', 'true')
      list.push({
        id: `mt-block-${Math.random().toString(36).slice(2, 9)}`,
        element: el,
        originalText: rawText,
        status: 'pending'
      })
    }
  })

  return list
}
