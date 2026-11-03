// High-resolution Vector SVG presets and Favicon Fetching Engine for MyTabs

// Pre-defined SVG icons as base64 Data URLs so they render 100% sharp with zero network dependency
function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
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
  'baidu.com': {
    title: '百度',
    bgColor: '#ffffff',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#2932E1" />
        <ellipse cx="32" cy="35" rx="5" ry="9" fill="#ffffff" transform="rotate(-18 32 35)" />
        <ellipse cx="44" cy="26" rx="5.5" ry="10" fill="#ffffff" transform="rotate(-5 44 26)" />
        <ellipse cx="57" cy="27" rx="5.5" ry="10" fill="#ffffff" transform="rotate(8 57 27)" />
        <ellipse cx="69" cy="37" rx="5" ry="9" fill="#ffffff" transform="rotate(22 69 37)" />
        <path d="M36 48 C36 41 64 41 64 48 C70 58 67 71 50 73 C33 71 30 58 36 48 Z" fill="#ffffff" />
        <path d="M42 54 C45 51 55 51 58 54 C60 61 58 66 50 67 C42 66 40 61 42 54 Z" fill="#2932E1" />
      </svg>
    `)
  },
  'pan.baidu.com': {
    title: '百度网盘',
    bgColor: '#ffffff',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#ffffff" />
        <circle cx="39" cy="48" r="14" fill="#FF4343" />
        <circle cx="61" cy="48" r="14" fill="#06A7FF" />
        <path d="M39 37 C33 37 28 42 28 48 C28 54 33 59 39 59 C44 59 49 55 50 51 C51 55 56 59 61 59 C67 59 72 54 72 48 C72 42 67 37 61 37 C56 37 51 41 50 45 C49 41 44 37 39 37 Z" fill="none" stroke="#ffffff" stroke-width="3.5" />
        <path d="M25 67 L75 67" stroke="#06A7FF" stroke-width="4.5" stroke-linecap="round" />
      </svg>
    `)
  },
  'docs.qq.com': {
    title: '腾讯文档',
    bgColor: '#1E6CEB',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="20" y="16" width="60" height="68" rx="14" fill="#ffffff" />
        <path d="M32 34 H68" stroke="#1E6CEB" stroke-width="6" stroke-linecap="round" />
        <path d="M32 48 H68" stroke="#1E6CEB" stroke-width="6" stroke-linecap="round" />
        <path d="M32 62 H52" stroke="#1E6CEB" stroke-width="6" stroke-linecap="round" />
      </svg>
    `)
  },
  'zhihu.com': {
    title: '知乎',
    bgColor: '#0084FF',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#0084FF" />
        <path d="M30 22 C26 27 22 32 17 35 L21 39 C26 36 29 32 32 27 Z" fill="#ffffff" />
        <path d="M22 37 H42 V43 H22 Z" fill="#ffffff" />
        <path d="M16 52 H47 V58 H34 V79 H27 V58 H16 Z" fill="#ffffff" />
        <path d="M28 58 C26 66 22 73 16 78 L21 82 C27 76 32 68 34 58 Z" fill="#ffffff" />
        <path d="M33 58 C35 65 40 73 47 78 L43 83 C35 77 30 68 28 58 Z" fill="#ffffff" />
        <path d="M53 38 H82 V74 H53 Z M60 45 V67 H75 V45 Z" fill="#ffffff" />
      </svg>
    `)
  },
  'sspai.com': {
    title: '少数派',
    bgColor: '#D71A1B',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#D71A1B" />
        <polygon points="52,18 30,50 48,50 42,82 72,46 52,46" fill="#ffffff" />
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
    bgColor: '#1B88EE',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="16" y="18" width="68" height="64" rx="16" fill="#ffffff" />
        <path d="M26 30 C36 28 45 31 50 34 C55 31 64 28 74 30 V66 C64 64 55 67 50 70 C45 67 36 64 26 66 Z" fill="#1B88EE" />
        <path d="M50 34 V70" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
      </svg>
    `)
  },
  'v2ex.com': {
    title: 'V2EX',
    bgColor: '#333344',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#333344" />
        <polygon points="22,34 32,34 41,64 49,34 59,34 46,74 36,74" fill="#ffffff" />
        <path d="M57 41 C57 36 61 32 68 32 C75 32 79 36 79 41 C79 46 75 50 69 55 L58 64 V72 H82 V66 H67 L74 60 C80 55 86 49 86 41 C86 31 78 26 68 26 C58 26 50 32 50 41 Z" fill="#ffffff" />
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
        <circle cx="50" cy="50" r="46" fill="#007722" />
        <rect x="25" y="27" width="50" height="7" rx="3" fill="#ffffff" />
        <rect x="30" y="40" width="40" height="18" rx="4" fill="none" stroke="#ffffff" stroke-width="6" />
        <rect x="22" y="64" width="56" height="7" rx="3" fill="#ffffff" />
        <polygon points="36,71 42,71 39,81 33,81" fill="#ffffff" />
        <polygon points="64,71 58,71 61,81 67,81" fill="#ffffff" />
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
  'taobao.com': {
    title: '淘宝',
    bgColor: '#FF5000',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#FF5000" />
        <path d="M34 40 C34 30 41 22 50 22 C59 22 66 30 66 40" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
        <rect x="22" y="38" width="56" height="42" rx="12" fill="#ffffff" />
        <path d="M34 56 C38 68 62 68 66 56" fill="none" stroke="#FF5000" stroke-width="5" stroke-linecap="round" />
        <circle cx="36" cy="50" r="3.5" fill="#FF5000" />
        <circle cx="64" cy="50" r="3.5" fill="#FF5000" />
      </svg>
    `)
  },
  'jd.com': {
    title: '京东',
    bgColor: '#E1251B',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#E1251B" />
        <path d="M34 32 H44 V58 C44 65 39 70 32 70 C26 70 22 67 19 63 L25 57 C27 59 29 61 32 61 C34 61 35 59 35 57 V32 Z" fill="#ffffff" />
        <path d="M48 32 H65 C76 32 84 40 84 51 C84 62 76 70 65 70 H48 Z M58 41 V61 H65 C70 61 74 57 74 51 C74 45 70 41 65 41 Z" fill="#ffffff" />
      </svg>
    `)
  },
  'weibo.com': {
    title: '微博',
    bgColor: '#E6162D',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#ffffff" />
        <ellipse cx="50" cy="58" rx="28" ry="22" fill="#FFA500" />
        <circle cx="50" cy="56" r="10" fill="#000000" />
        <circle cx="53" cy="53" r="3.5" fill="#ffffff" />
        <path d="M66 32 C74 36 78 44 78 50" stroke="#E6162D" stroke-width="5" stroke-linecap="round" fill="none" />
        <path d="M60 38 C65 41 68 46 68 50" stroke="#E6162D" stroke-width="4" stroke-linecap="round" fill="none" />
      </svg>
    `)
  },
  'weixin.qq.com': {
    title: '微信',
    bgColor: '#07C160',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="42" cy="44" r="22" fill="#ffffff" />
        <circle cx="35" cy="42" r="3" fill="#07C160" />
        <circle cx="49" cy="42" r="3" fill="#07C160" />
        <path d="M30 62 L24 68 L32 64 Z" fill="#ffffff" />
        <circle cx="62" cy="56" r="18" fill="#ffffff" />
        <circle cx="56" cy="54" r="2.5" fill="#07C160" />
        <circle cx="68" cy="54" r="2.5" fill="#07C160" />
        <path d="M68 70 L74 76 L71 70 Z" fill="#ffffff" />
      </svg>
    `)
  },
  'xiaohongshu.com': {
    title: '小红书',
    bgColor: '#FF2442',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#FF2442" />
        <path d="M19 33 H34 C41 33 46 37 46 43 C46 49 41 53 34 53 H27 V67 H19 Z M27 40 V47 H33 C36 47 38 45 38 43 C38 41 36 40 33 40 Z M33 53 L45 67 H36 L27 55 Z" fill="#ffffff" />
        <path d="M48 33 H66 V40 H56 V47 H64 V53 H56 V60 H66 V67 H48 Z" fill="#ffffff" />
        <path d="M69 33 H81 C89 33 95 39 95 50 C95 61 89 67 81 67 H69 Z M77 40 V60 H81 C85 60 88 56 88 50 C88 44 85 40 81 40 Z" fill="#ffffff" />
      </svg>
    `)
  },
  'douyin.com': {
    title: '抖音',
    bgColor: '#161823',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#000000" />
        <path d="M46 26 V62 C46 68 41 73 35 73 C29 73 24 68 24 62 C24 56 29 51 35 51 C37 51 39 52 41 53 V42 C39 41 37 41 35 41 C23 41 14 50 14 62 C14 74 23 83 35 83 C47 83 56 74 56 62 V40 C62 44 69 47 77 47 V36 C70 36 63 32 59 26 Z" fill="#24F6F0" opacity="0.8" />
        <path d="M48 24 V60 C48 66 43 71 37 71 C31 71 26 66 26 60 C26 54 31 49 37 49 C39 49 41 50 43 51 V40 C41 39 39 39 37 39 C25 39 16 48 16 60 C16 72 25 81 37 81 C49 81 58 72 58 60 V38 C64 42 71 45 79 45 V34 C72 34 65 30 61 24 Z" fill="#FE2C55" opacity="0.8" />
        <path d="M47 25 V61 C47 67 42 72 36 72 C30 72 25 67 25 61 C25 55 30 50 36 50 C38 50 40 51 42 52 V41 C40 40 38 40 36 40 C24 40 15 49 15 61 C15 73 24 82 36 82 C48 82 57 73 57 61 V39 C63 43 70 46 78 46 V35 C71 35 64 31 60 25 Z" fill="#ffffff" />
      </svg>
    `)
  },
  'yuque.com': {
    title: '语雀',
    bgColor: '#00B96B',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#00B96B" />
        <polygon points="26,64 50,22 76,46 54,76" fill="#ffffff" />
        <polygon points="50,22 76,46 64,78" fill="#a4f3ce" />
        <circle cx="48" cy="38" r="4" fill="#00B96B" />
      </svg>
    `)
  },
  'csdn.net': {
    title: 'CSDN',
    bgColor: '#FC5531',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#FC5531" />
        <path d="M28 36 C22 41 20 48 20 54 C20 62 24 68 31 68 C36 68 40 65 42 61 L36 57 C35 59 33 61 31 61 C27 61 25 57 25 53 C25 47 28 43 32 43 C35 43 36 45 38 47 L43 43 C40 38 35 36 28 36 Z" fill="#ffffff" />
        <path d="M46 61 C47 65 50 68 55 68 C60 68 63 65 63 61 C63 57 60 55 54 53 C46 51 43 48 43 43 C43 37 47 34 54 34 C60 34 64 37 65 42 L60 44 C59 41 57 39 54 39 C51 39 48 40 48 43 C48 46 50 47 55 49 C63 51 68 54 68 60 C68 66 63 70 55 70 C47 70 42 66 41 60 Z" fill="#ffffff" />
        <path d="M70 35 H82 C91 35 97 41 97 52 C97 63 91 69 82 69 H70 Z M76 41 V63 H82 C87 63 91 59 91 52 C91 45 87 41 82 41 Z" fill="#ffffff" />
      </svg>
    `)
  },
  'chatgpt.com': {
    title: 'ChatGPT',
    bgColor: '#10A37F',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#ffffff" />
        <path d="M50 20 C54 20 57 22 59 25 L65 35 C68 35 71 37 73 39 C77 43 77 49 75 54 L71 62 C73 66 72 71 69 74 C65 78 59 79 55 77 L46 77 C43 80 38 81 34 79 C29 77 27 71 28 66 L25 58 C23 54 23 49 26 45 C27 43 29 41 31 40 L35 30 C38 25 44 21 50 20 Z" fill="#10A37F" />
        <circle cx="50" cy="50" r="10" fill="#ffffff" />
      </svg>
    `)
  },
  'claude.ai': {
    title: 'Claude',
    bgColor: '#D97757',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="16" y="16" width="68" height="68" rx="20" fill="#ffffff" />
        <path d="M50 24 L56 44 L76 50 L56 56 L50 76 L44 56 L24 50 L44 44 Z" fill="#D97757" />
      </svg>
    `)
  },
  'deepseek.com': {
    title: 'DeepSeek',
    bgColor: '#1D63FF',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#ffffff" />
        <path d="M28 58 C28 42 42 30 58 30 C72 30 76 40 76 48 C76 60 64 68 50 68 C42 68 36 65 32 61 L26 65 Z" fill="#1D63FF" />
        <circle cx="56" cy="42" r="4" fill="#ffffff" />
      </svg>
    `)
  },
  'linux.do': {
    title: 'LINUX DO',
    bgColor: '#24292E',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#ffffff" />
        <ellipse cx="50" cy="55" rx="22" ry="26" fill="#24292E" />
        <ellipse cx="50" cy="58" rx="14" ry="18" fill="#ffffff" />
        <circle cx="43" cy="42" r="4" fill="#ffffff" />
        <circle cx="57" cy="42" r="4" fill="#ffffff" />
        <circle cx="44" cy="42" r="2" fill="#000000" />
        <circle cx="56" cy="42" r="2" fill="#000000" />
        <polygon points="46,47 54,47 50,54" fill="#FFA500" />
        <ellipse cx="40" cy="80" rx="7" ry="3" fill="#FFA500" />
        <ellipse cx="60" cy="80" rx="7" ry="3" fill="#FFA500" />
      </svg>
    `)
  },
  'vercel.com': {
    title: 'Vercel',
    bgColor: '#000000',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <polygon points="50,20 82,76 18,76" fill="#ffffff" />
      </svg>
    `)
  },
  'x.com': {
    title: 'X',
    bgColor: '#000000',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M26 24 L45 51 L24 76 H32 L49 56 L64 76 H76 L55 47 L74 24 H66 L51 42 L38 24 Z" fill="#ffffff" />
      </svg>
    `)
  },
  'docker.com': {
    title: 'Docker',
    bgColor: '#1D63ED',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect x="22" y="44" width="8" height="8" rx="1" fill="#ffffff" />
        <rect x="33" y="44" width="8" height="8" rx="1" fill="#ffffff" />
        <rect x="44" y="44" width="8" height="8" rx="1" fill="#ffffff" />
        <rect x="33" y="33" width="8" height="8" rx="1" fill="#ffffff" />
        <rect x="44" y="33" width="8" height="8" rx="1" fill="#ffffff" />
        <rect x="44" y="22" width="8" height="8" rx="1" fill="#ffffff" />
        <path d="M14 55 C14 55 18 69 46 69 C74 69 82 55 86 52 C84 51 78 52 76 54 C72 52 64 53 60 55 H14 Z" fill="#ffffff" />
      </svg>
    `)
  },
  'mail.google.com': {
    title: 'Gmail',
    bgColor: '#ffffff',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M45 16.2v20.4c0 2.4-2 4.4-4.4 4.4H35V23.7L45 16.2z"/>
        <path fill="#34A853" d="M3 16.2l10 7.5V41H7.4C5 41 3 39 3 36.6V16.2z"/>
        <path fill="#EA4335" d="M35 13.5l-11 8.2-11-8.2V9.4C13 7 15 5 17.4 5h13.2C33 5 35 7 35 9.4v4.1z"/>
        <path fill="#FBBC05" d="M13 23.7V41h22V23.7l-11-8.2z"/>
      </svg>
    `)
  },
  'quark.cn': {
    title: '夸克',
    bgColor: '#1F52F9',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#1F52F9" />
        <circle cx="48" cy="48" r="24" fill="none" stroke="#ffffff" stroke-width="7" />
        <circle cx="48" cy="48" r="11" fill="#ffffff" />
        <path d="M65 65 L81 81" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
      </svg>
    `)
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
        <rect x="14" y="14" width="72" height="72" rx="16" fill="#000000" />
        <polygon points="24,66 24,34 32,34 42,52 52,34 60,34 60,66 52,66 52,44 44,60 40,60 32,44 32,66" fill="#ffffff" />
        <rect x="65" y="34" width="8" height="32" rx="2" fill="#3686F7" />
      </svg>
    `)
  },
  'deepl.com': {
    title: 'DeepL 翻译',
    bgColor: '#0F2B46',
    icon: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#0F2B46" />
        <path d="M42 26 H58 V42 H42 Z" fill="#00D2D3" />
        <path d="M58 42 H74 V58 H58 Z" fill="#00D2D3" />
        <path d="M42 58 H58 V74 H42 Z" fill="#00D2D3" />
        <path d="M26 42 H42 V58 H26 Z" fill="#00D2D3" />
        <circle cx="50" cy="50" r="6" fill="#0F2B46" />
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
  }
}

// Aliases for common alternative domains
const PRESET_ALIASES: Record<string, string> = {
  'openai.com': 'chatgpt.com',
  'twitter.com': 'x.com',
  'wx.qq.com': 'weixin.qq.com',
  'mp.weixin.qq.com': 'weixin.qq.com',
  'mail.google.com': 'google.com'
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
  
  const targetHost = PRESET_ALIASES[hostname] || hostname
  if (PRESET_SITE_ICONS[targetHost]) {
    return PRESET_SITE_ICONS[targetHost]
  }

  // Check parent domains
  const parts = targetHost.split('.')
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.')
    const aliasParent = PRESET_ALIASES[parent] || parent
    if (PRESET_SITE_ICONS[aliasParent]) {
      return PRESET_SITE_ICONS[aliasParent]
    }
  }

  return null
}

/**
 * Detect whether an icon source is a standard low-resolution favicon (16px - 32px)
 * or a high-resolution vector / apple-touch-icon
 */
export function isSmallFavicon(iconUrl?: string): boolean {
  if (!iconUrl) return false
  if (
    iconUrl.startsWith('data:image/svg+xml') ||
    iconUrl.endsWith('.svg') ||
    iconUrl.includes('apple-touch-icon')
  ) {
    return false
  }
  return (
    iconUrl.includes('_favicon/?pageUrl=') ||
    iconUrl.endsWith('.ico') ||
    iconUrl.includes('favicon.ico') ||
    iconUrl.includes('size=32') ||
    iconUrl.includes('size=16')
  )
}

/**
 * Get native Chrome extension cached favicon URL (zero latency, offline support, bypasses CORS)
 * Requesting size=64 ensures high-DPI crystal clarity for high-resolution screens
 */
export function getChromeFaviconUrl(url: string, size = 64): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    const clean = url.startsWith('http') ? url : `https://${url}`
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(clean)}&size=${size}`
  }
  return ''
}

/**
 * Get high resolution Favicon URL for any domain with cascading priority
 * Prioritizes vector SVGs and ultra-high-definition sources first
 */
export function getFaviconCandidates(url: string): string[] {
  const hostname = extractHostname(url)
  if (!hostname) return []

  const preset = findPresetForDomain(hostname)
  if (preset) {
    return [preset.icon]
  }

  const list: string[] = []

  // 1. Chrome native cached high-res icon (instant, 0 network, bypasses GFW)
  const chromeFav = getChromeFaviconUrl(url, 64)
  if (chromeFav) {
    list.push(chromeFav)
  }

  // 2. Official root Apple Touch Icon (high-res PNG for mobile/retina devices)
  list.push(`https://${hostname}/apple-touch-icon.png`)

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
