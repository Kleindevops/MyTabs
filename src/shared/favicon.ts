// High-resolution Vector SVG presets and Favicon Fetching Engine for MyTabs

// Pre-defined SVG icons as base64 Data URLs so they render 100% sharp with zero network dependency
function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const PRESET_SITE_ICONS: Record<string, { icon: string; bgColor: string; title: string }> = {
  'github.com': {
    title: 'GitHub',
    bgColor: '#181717',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#ffffff" />
        <path fill="#181717" d="M50 14C30.12 14 14 30.12 14 50c0 15.9 10.31 29.38 24.62 34.15 1.8.33 2.46-.78 2.46-1.74 0-.86-.03-3.69-.05-6.7-10.01 2.18-12.12-4.25-12.12-4.25-1.64-4.16-4-5.27-4-5.27-3.27-2.23.25-2.19.25-2.19 3.61.25 5.51 3.71 5.51 3.71 3.21 5.5 8.43 3.91 10.48 2.99.33-2.33 1.26-3.91 2.29-4.81-7.99-.91-16.39-4-16.39-17.77 0-3.92 1.4-7.13 3.69-9.64-.37-.91-1.6-4.56.35-9.5 0 0 3.02-.97 9.89 3.69 2.87-.8 5.94-1.2 9-1.2 3.06 0 6.13.4 9 1.2 6.87-4.66 9.88-3.69 9.88-3.69 1.96 4.95.73 8.6.36 9.5 2.3 2.51 3.68 5.72 3.68 9.64 0 13.8-8.41 16.85-16.43 17.74 1.29 1.11 2.44 3.3 2.44 6.66 0 4.81-.04 8.68-.04 9.86 0 .97.65 2.09 2.48 1.74C75.7 79.37 86 65.89 86 50c0-19.88-16.12-36-36-36z"/>
      </svg>
    `)
  },
  'bilibili.com': {
    title: 'Bilibili',
    bgColor: '#00AEEC',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="12" y="26" width="76" height="58" rx="16" fill="#ffffff" />
        <path d="M30 14L42 26M70 14L58 26" stroke="#ffffff" stroke-width="7" stroke-linecap="round" />
        <circle cx="38" cy="52" r="5" fill="#00AEEC" />
        <circle cx="62" cy="52" r="5" fill="#00AEEC" />
        <path d="M44 64C47 67 53 67 56 64" stroke="#00AEEC" stroke-width="4" stroke-linecap="round" fill="none" />
      </svg>
    `)
  },
  'zhihu.com': {
    title: '知乎',
    bgColor: '#0084FF',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text x="50" y="70" font-size="58" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">知</text>
      </svg>
    `)
  },
  'sspai.com': {
    title: '少数派',
    bgColor: '#D71A1B',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text x="50" y="70" font-size="58" font-family="'PingFang SC', 'Microsoft YaHei', sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">少</text>
      </svg>
    `)
  },
  'youtube.com': {
    title: 'YouTube',
    bgColor: '#FF0000',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="16" y="28" width="68" height="46" rx="14" fill="#ffffff" />
        <polygon points="42,40 64,51 42,62" fill="#FF0000" />
      </svg>
    `)
  },
  'weread.qq.com': {
    title: '微信读书',
    bgColor: '#0087fc',
    icon: 'https://rescdn.qqmail.com/node/wr/wrpage/style/images/independent/appleTouchIcon/apple-touch-icon-152x152.png'
  },
  'v2ex.com': {
    title: 'V2EX',
    bgColor: '#333344',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text x="50" y="66" font-size="38" font-family="Arial, sans-serif" font-weight="900" fill="#ffffff" text-anchor="middle">V2</text>
      </svg>
    `)
  },
  'juejin.cn': {
    title: '掘金',
    bgColor: '#1E80FF',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <polygon points="50,18 64,30 50,42 36,30" fill="#ffffff" />
        <polygon points="50,48 74,66 64,74 50,62 36,74 26,66" fill="#ffffff" />
      </svg>
    `)
  },
  'stackoverflow.com': {
    title: 'Stack Overflow',
    bgColor: '#F48024',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M24 64V80H76V64" stroke="#ffffff" stroke-width="7" fill="none" />
        <rect x="33" y="69" width="34" height="6" fill="#ffffff" />
        <rect x="34" y="55" width="34" height="6" transform="rotate(10 34 55)" fill="#ffffff" />
        <rect x="38" y="42" width="34" height="6" transform="rotate(25 38 42)" fill="#ffffff" />
        <rect x="46" y="30" width="34" height="6" transform="rotate(45 46 30)" fill="#ffffff" />
      </svg>
    `)
  },
  'notion.so': {
    title: 'Notion',
    bgColor: '#000000',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="18" y="18" width="64" height="64" rx="14" fill="#ffffff" />
        <path d="M34 32H44L60 56V32H68V68H58L42 44V68H34Z" fill="#000000" />
      </svg>
    `)
  },
  'feishu.cn': {
    title: '飞书',
    bgColor: '#00D6B9',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M25 70L50 25L75 50L45 75Z" fill="#ffffff" />
        <path d="M50 25L75 50L60 80Z" fill="#e0fcf6" opacity="0.8" />
      </svg>
    `)
  },
  'music.163.com': {
    title: '网易云音乐',
    bgColor: '#C20C0C',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="32" fill="none" stroke="#ffffff" stroke-width="7" />
        <circle cx="50" cy="50" r="14" fill="#ffffff" />
        <circle cx="50" cy="50" r="6" fill="#C20C0C" />
      </svg>
    `)
  },
  'douban.com': {
    title: '豆瓣',
    bgColor: '#007722',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text x="50" y="70" font-size="58" font-family="'PingFang SC', sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">豆</text>
      </svg>
    `)
  },
  'v.qq.com': {
    title: '腾讯视频',
    bgColor: '#FF6428',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <polygon points="38,32 72,50 38,68" fill="#ffffff" />
      </svg>
    `)
  },
  'pan.baidu.com': {
    title: '百度网盘',
    bgColor: '#ffffff',
    icon: 'https://nd-static.bdstatic.com/m-static/v20-main/favicon-main.ico'
  },
  'npmjs.com': {
    title: 'NPM',
    bgColor: '#CB3837',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="18" y="32" width="64" height="36" fill="#ffffff" />
        <path d="M28 40H44V60H36V48H28ZM50 40H66V60H58V48H50ZM70 40H78V60H70Z" fill="#CB3837" />
      </svg>
    `)
  },
  'developer.mozilla.org': {
    title: 'MDN Web 文档',
    bgColor: '#000000',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text x="50" y="65" font-size="34" font-family="Arial, sans-serif" font-weight="900" fill="#ffffff" text-anchor="middle">MDN</text>
      </svg>
    `)
  },
  'deepl.com': {
    title: 'DeepL 翻译',
    bgColor: '#0F2B46',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text x="50" y="68" font-size="44" font-family="Arial, sans-serif" font-weight="900" fill="#00D2D3" text-anchor="middle">D</text>
      </svg>
    `)
  },
  'google.com': {
    title: 'Google',
    bgColor: '#ffffff',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
    `)
  },
  'bing.com': {
    title: 'Bing',
    bgColor: '#008373',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M28 20V76L46 84L68 70L58 60L46 64V32Z" fill="#ffffff" />
      </svg>
    `)
  },
  'baidu.com': {
    title: '百度',
    bgColor: '#ffffff',
    icon: 'https://www.baidu.com/favicon.ico'
  }
}

/**
 * Extract clean hostname / domain from any user-entered URL
 */
export function extractHostname(url: string): string {
  if (!url) return ''
  try {
    let clean = url.trim()
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`
    }
    const parsed = new URL(clean)
    const host = parsed.hostname.toLowerCase()
    if (!host || host === 'https' || host === 'http' || host === 'localhost') {
      return ''
    }
    return host
  } catch {
    const stripped = url.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase().trim()
    return stripped === 'https' || stripped === 'http' ? '' : stripped
  }
}

/**
 * Match a hostname to known domain preset or parent domain (e.g. docs.github.com -> github.com)
 */
export function findPresetForDomain(hostname: string): { icon: string; bgColor: string; title: string } | null {
  if (!hostname) return null
  if (PRESET_SITE_ICONS[hostname]) {
    return PRESET_SITE_ICONS[hostname]
  }

  // Check parent domains
  const parts = hostname.split('.')
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.')
    if (PRESET_SITE_ICONS[parent]) {
      return PRESET_SITE_ICONS[parent]
    }
  }

  return null
}

/**
 * Get native Chrome extension cached favicon URL (zero latency, offline support, bypasses CORS)
 */
export function getChromeFaviconUrl(url: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    const clean = url.startsWith('http') ? url : `https://${url}`
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(clean)}&size=64`
  }
  return ''
}

/**
 * Get high resolution Favicon URL for any domain with cascading priority
 */
export function getFaviconCandidates(url: string): string[] {
  const hostname = extractHostname(url)
  if (!hostname) return []

  const preset = findPresetForDomain(hostname)
  const list: string[] = []

  if (preset) {
    list.push(preset.icon)
  }

  // 1. Chrome native cached high-res icon
  const chromeFav = getChromeFaviconUrl(url)
  if (chromeFav) {
    list.push(chromeFav)
  }

  // 2. Official root Apple Touch Icon (high-res PNG for mobile devices)
  list.push(`https://${hostname}/apple-touch-icon.png`)
  list.push(`https://${hostname}/apple-touch-icon-precomposed.png`)

  // 3. Fallback standard root favicon
  list.push(`https://${hostname}/favicon.ico`)

  return list
}

/**
 * Guess Brand background color
 */
export function guessBrandColor(url: string): string {
  const hostname = extractHostname(url)
  if (!hostname) return '#2563eb'

  const preset = findPresetForDomain(hostname)
  if (preset) {
    return preset.bgColor
  }

  // Color hash for consistent distinctive colors
  const defaultPalette = [
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#059669', // Emerald
    '#dc2626', // Red
    '#d97706', // Amber
    '#0891b2', // Cyan
    '#1e293b'  // Slate
  ]
  let hash = 0
  for (let i = 0; i < hostname.length; i++) {
    hash = hostname.charCodeAt(i) + ((hash << 5) - hash)
  }
  return defaultPalette[Math.abs(hash) % defaultPalette.length]
}

/**
 * Suggest a readable clean title from a URL
 */
export function suggestTitleFromUrl(url: string): string {
  const hostname = extractHostname(url)
  if (!hostname) return ''

  const preset = findPresetForDomain(hostname)
  if (preset) return preset.title

  // Format domain e.g. weread.qq.com -> Weread; vuejs.org -> Vuejs
  const cleanHost = hostname.replace(/^(www|m|wap|api|login|auth)\./i, '')
  const parts = cleanHost.replace(/\.(com|cn|org|net|io|dev|app|cc|tv|edu|gov|me|top|vip|xyz|co)$/i, '').split('.')
  const main = parts.filter(p => p !== 'qq' && p !== 'com' && p !== 'cn')[0] || parts[0] || cleanHost
  if (!main || main === 'https' || main === 'http') return ''
  return main.charAt(0).toUpperCase() + main.slice(1)
}
