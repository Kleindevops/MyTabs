import type { AppSettings, SearchEngine, PopupBlockerConfig, PopupBlockerStats } from './types'
import { writeBackupToOneDrive } from './onedrive'
import { PRESET_SITE_ICONS, extractHostname, findPresetForDomain, getFaviconCandidates, suggestTitleFromUrl } from './favicon'

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=%s',
    icon: 'Search',
    placeholder: '微软 Bing 搜索...',
    isCustom: false
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=%s',
    icon: 'Globe',
    placeholder: 'Google 搜索...',
    isCustom: false
  },
  {
    id: 'baidu',
    name: '百度',
    url: 'https://www.baidu.com/s?wd=%s',
    icon: 'SearchCheck',
    placeholder: '百度一下，你就知道...',
    isCustom: false
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/search?q=%s',
    icon: 'Code',
    placeholder: 'GitHub 仓库与代码搜索...',
    isCustom: false
  },
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    url: 'https://search.bilibili.com/all?keyword=%s',
    icon: 'Tv',
    placeholder: '哔哩哔哩 (゜-゜)つロ 干杯~',
    isCustom: false
  }
]

export interface PopularEnginePreset {
  name: string
  url: string
  icon: string
  placeholder: string
  category: string
}

export const POPULAR_SEARCH_ENGINES_PRESETS: PopularEnginePreset[] = [
  {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=%s',
    icon: 'Shield',
    placeholder: 'DuckDuckGo 隐私搜索...',
    category: '隐私保护'
  },
  {
    name: '知乎',
    url: 'https://www.zhihu.com/search?type=content&q=%s',
    icon: 'MessageSquare',
    placeholder: '知乎 搜索问题或话题...',
    category: '问答社区'
  },
  {
    name: '微信读书',
    url: 'https://weread.qq.com/web/search/global?keyword=%s',
    icon: 'BookOpen',
    placeholder: '微信读书 搜索书籍或作者...',
    category: '阅读学习'
  },
  {
    name: 'Google 学术',
    url: 'https://scholar.google.com/scholar?q=%s',
    icon: 'GraduationCap',
    placeholder: 'Google Scholar 学术文献检索...',
    category: '科研文献'
  },
  {
    name: '小红书',
    url: 'https://www.xiaohongshu.com/search_result?keyword=%s',
    icon: 'Compass',
    placeholder: '小红书 搜索生活经验与灵感...',
    category: '生活灵感'
  },
  {
    name: 'Yandex',
    url: 'https://yandex.com/search/?text=%s',
    icon: 'Search',
    placeholder: 'Yandex 全球多语种搜索...',
    category: '海外搜索'
  },
  {
    name: 'NPM',
    url: 'https://www.npmjs.com/search?q=%s',
    icon: 'Package',
    placeholder: 'NPM 搜索开源软件包...',
    category: '开发者'
  },
  {
    name: 'MDN Web',
    url: 'https://developer.mozilla.org/zh-CN/search?q=%s',
    icon: 'Code',
    placeholder: 'MDN 检索 Web 技术规范与 API...',
    category: '开发者'
  },
  {
    name: '维基百科',
    url: 'https://zh.wikipedia.org/wiki/Special:Search?search=%s',
    icon: 'Book',
    placeholder: '维基百科 自由的百科全书...',
    category: '百科知识'
  }
]

export const DEFAULT_POPUP_BLOCKER: PopupBlockerConfig = {
  enabled: true,
  blockNewTabPopups: true,
  blockModalOverlays: true,
  blockClickjacking: true,
  restoreScroll: true,
  whitelist: [
    'login.live.com',
    'accounts.google.com',
    'github.com',
    'alipay.com'
  ],
  stats: {
    totalBlocked: 0,
    todayBlocked: 0,
    lastDate: new Date().toISOString().slice(0, 10)
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: '1.0.0',
  categories: [
    { id: 'cat-common', name: '常用推荐', icon: 'Compass' },
    { id: 'cat-dev', name: '开发者', icon: 'Code' },
    { id: 'cat-office', name: '效率办公', icon: 'Briefcase' },
    { id: 'cat-media', name: '影音视听', icon: 'Film' },
    { id: 'cat-vault', name: '个人空间', icon: 'Lock', isPrivate: true, isLocked: true }
  ],
  bookmarks: [
    // 常用推荐
    { id: 'bm-1', title: 'Bilibili', url: 'https://www.bilibili.com', bgColor: '#00AEEC', categoryId: 'cat-common', isPinnedToTaskbar: true, icon: PRESET_SITE_ICONS['bilibili.com']?.icon },
    { id: 'bm-2', title: 'GitHub', url: 'https://github.com', bgColor: '#181717', categoryId: 'cat-common', isPinnedToTaskbar: true, icon: PRESET_SITE_ICONS['github.com']?.icon },
    { id: 'bm-3', title: '知乎', url: 'https://www.zhihu.com', bgColor: '#0084ff', categoryId: 'cat-common', isPinnedToTaskbar: true, icon: PRESET_SITE_ICONS['zhihu.com']?.icon },
    { id: 'bm-4', title: '少数派', url: 'https://sspai.com', bgColor: '#d71a1b', categoryId: 'cat-common', isPinnedToTaskbar: true, icon: PRESET_SITE_ICONS['sspai.com']?.icon },
    { id: 'bm-5', title: 'YouTube', url: 'https://www.youtube.com', bgColor: '#ff0000', categoryId: 'cat-common', icon: PRESET_SITE_ICONS['youtube.com']?.icon },
    { id: 'bm-6', title: '微信读书', url: 'https://weread.qq.com', bgColor: '#1b88ee', categoryId: 'cat-common', icon: PRESET_SITE_ICONS['weread.qq.com']?.icon },

    // 开发者
    { id: 'bm-dev-1', title: 'MDN Web 文档', url: 'https://developer.mozilla.org', bgColor: '#000000', categoryId: 'cat-dev', icon: PRESET_SITE_ICONS['developer.mozilla.org']?.icon },
    { id: 'bm-dev-2', title: 'Stack Overflow', url: 'https://stackoverflow.com', bgColor: '#f48024', categoryId: 'cat-dev', icon: PRESET_SITE_ICONS['stackoverflow.com']?.icon },
    { id: 'bm-dev-3', title: 'V2EX', url: 'https://www.v2ex.com', bgColor: '#333344', categoryId: 'cat-dev', icon: PRESET_SITE_ICONS['v2ex.com']?.icon },
    { id: 'bm-dev-4', title: '掘金', url: 'https://juejin.cn', bgColor: '#1e80ff', categoryId: 'cat-dev', icon: PRESET_SITE_ICONS['juejin.cn']?.icon },
    { id: 'bm-dev-5', title: 'NPM', url: 'https://www.npmjs.com', bgColor: '#cb3837', categoryId: 'cat-dev', icon: PRESET_SITE_ICONS['npmjs.com']?.icon },

    // 效率办公
    { id: 'bm-off-1', title: 'Notion', url: 'https://www.notion.so', bgColor: '#000000', categoryId: 'cat-office', icon: PRESET_SITE_ICONS['notion.so']?.icon },
    { id: 'bm-off-2', title: '飞书', url: 'https://www.feishu.cn', bgColor: '#00d6b9', categoryId: 'cat-office', icon: PRESET_SITE_ICONS['feishu.cn']?.icon },
    { id: 'bm-off-3', title: '腾讯文档', url: 'https://docs.qq.com', bgColor: '#1e6ceb', categoryId: 'cat-office', icon: PRESET_SITE_ICONS['docs.qq.com']?.icon },
    { id: 'bm-off-4', title: 'DeepL 翻译', url: 'https://www.deepl.com', bgColor: '#0f2b46', categoryId: 'cat-office', icon: PRESET_SITE_ICONS['deepl.com']?.icon },

    // 影音视听
    { id: 'bm-med-1', title: '网易云音乐', url: 'https://music.163.com', bgColor: '#c20c0c', categoryId: 'cat-media', icon: PRESET_SITE_ICONS['music.163.com']?.icon },
    { id: 'bm-med-2', title: '豆瓣', url: 'https://www.douban.com', bgColor: '#007722', categoryId: 'cat-media', icon: PRESET_SITE_ICONS['douban.com']?.icon },
    { id: 'bm-med-3', title: '腾讯视频', url: 'https://v.qq.com', bgColor: '#ff6428', categoryId: 'cat-media', icon: PRESET_SITE_ICONS['v.qq.com']?.icon },

    // 个人空间 (初始测试数据)
    { id: 'bm-pvt-1', title: '个人网盘', url: 'https://pan.baidu.com', bgColor: '#09aaff', categoryId: 'cat-vault', isPrivate: true, openInIncognito: true, icon: PRESET_SITE_ICONS['pan.baidu.com']?.icon }
  ],
  wallpaper: {
    type: 'bing',
    value: 'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN',
    blur: 0,
    mask: 30
  },
  ai: {
    provider: 'deepseek',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    temperature: 0.7
  },
  privacyRules: [
    { id: 'pr-1', pattern: '*://*.bad-history.com/*', action: 'delete_history', enabled: true },
    { id: 'pr-2', pattern: '*://*.private-site.org/*', action: 'incognito', enabled: false }
  ],
  oneDrive: {
    hasDirectory: false,
    autoSync: true,
    backupFileName: 'mytabs_backup.json'
  },
  popupBlocker: DEFAULT_POPUP_BLOCKER,
  showHotNews: true,
  vaultAutoLockMinutes: 5,
  searchEngines: DEFAULT_SEARCH_ENGINES,
  defaultSearchEngineId: 'bing'
}

export const STORAGE_KEY = 'mytabs_app_settings'

function mergeSettings(loaded: any): AppSettings {
  if (!loaded) return { ...DEFAULT_SETTINGS }

  // Automatic Migration: Upgrade any legacy vault category to '个人空间'
  let categories = Array.isArray(loaded.categories) && loaded.categories.length > 0
    ? loaded.categories
    : DEFAULT_SETTINGS.categories

  categories = categories.map((c: any) => {
    if (c.id === 'cat-vault' || c.name === '\u79c1\u5bc6\u7a7a\u95f4') {
      return { ...c, name: '个人空间' }
    }
    return c
  })

  let bookmarks = Array.isArray(loaded.bookmarks) ? loaded.bookmarks : DEFAULT_SETTINGS.bookmarks
  bookmarks = bookmarks.map((b: any) => {
    if (b.title === '\u4e2a\u4eba\u79c1\u5bc6\u7f51\u76d8' || b.title === '私人专属网盘') {
      b = { ...b, title: '个人网盘' }
    }
    // Fix accidental "Https" or "Http" title
    if ((b.title === 'Https' || b.title === 'Http') && b.url) {
      const fixedTitle = suggestTitleFromUrl(b.url)
      if (fixedTitle) b = { ...b, title: fixedTitle }
    }
    // Force openInIncognito for bookmarks in personal space
    if (b.categoryId === 'cat-vault') {
      b = { ...b, openInIncognito: true }
    }
    // Auto upgrade known presets to official authentic high-res vector icons
    if (b.url) {
      const hostname = extractHostname(b.url)
      const preset = findPresetForDomain(hostname)
      if (preset) {
        const isUserUpload = b.icon?.startsWith('data:image/png') || b.icon?.startsWith('data:image/jpeg')
        if (!isUserUpload) {
          b = {
            ...b,
            icon: preset.icon,
            bgColor: (b.bgColor && b.bgColor !== 'transparent' && b.bgColor !== '#181717') ? b.bgColor : preset.bgColor
          }
        }
      } else if (!b.icon || b.icon.includes('size=32')) {
        const candidates = getFaviconCandidates(b.url)
        if (candidates.length > 0) {
          b = { ...b, icon: candidates[0] }
        }
      }
    }
    // Migration: If bookmark had the old default black '#181717' (except official GitHub bm-2)
    // or if title/url is Linux, migrate to 'transparent'
    if (b.id !== 'bm-2' && b.id !== 'bm-dev-1' && b.id !== 'bm-off-1' && (b.bgColor === '#181717' || b.bgColor === '#000000' || !b.bgColor || b.title?.toLowerCase().includes('linux') || b.url?.includes('linux.do'))) {
      b = { ...b, bgColor: 'transparent' }
    }
    return b
  })

  // Migration for taskbar pinned bookmarks: if none are pinned, initialize top 4 public bookmarks
  const hasPinned = bookmarks.some((b: any) => b.isPinnedToTaskbar === true)
  if (!hasPinned && bookmarks.length > 0) {
    let count = 0
    bookmarks = bookmarks.map((b: any) => {
      if (!b.isPrivate && b.categoryId !== 'cat-vault' && count < 4) {
        count++
        return { ...b, isPinnedToTaskbar: true }
      }
      return b
    })
  }

  let wallpaper = { ...DEFAULT_SETTINGS.wallpaper, ...(loaded.wallpaper || {}) }
  if (wallpaper.isPinned) {
    wallpaper.type = 'custom'
  }

  const popupBlocker: PopupBlockerConfig = {
    ...DEFAULT_POPUP_BLOCKER,
    ...(loaded.popupBlocker || {}),
    stats: {
      ...DEFAULT_POPUP_BLOCKER.stats,
      ...(loaded.popupBlocker?.stats || {})
    },
    whitelist: Array.isArray(loaded.popupBlocker?.whitelist)
      ? loaded.popupBlocker.whitelist
      : DEFAULT_POPUP_BLOCKER.whitelist
  }

  // Search engines migration & fallback
  let searchEngines: SearchEngine[] = Array.isArray(loaded.searchEngines) && loaded.searchEngines.length > 0
    ? loaded.searchEngines
    : DEFAULT_SEARCH_ENGINES

  searchEngines = searchEngines.map((e: any) => ({
    id: e.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: e.name || '搜索引擎',
    url: e.url || 'https://www.bing.com/search?q=%s',
    icon: e.icon || 'Search',
    placeholder: e.placeholder || `${e.name || '网页'} 搜索...`,
    isCustom: e.isCustom ?? !DEFAULT_SEARCH_ENGINES.some(d => d.id === e.id)
  }))

  const defaultSearchEngineId = loaded.defaultSearchEngineId && searchEngines.some(e => e.id === loaded.defaultSearchEngineId)
    ? loaded.defaultSearchEngineId
    : (searchEngines[0]?.id || 'bing')

  return {
    ...DEFAULT_SETTINGS,
    ...loaded,
    categories,
    bookmarks,
    wallpaper,
    popupBlocker,
    searchEngines,
    defaultSearchEngineId,
    showHotNews: loaded.showHotNews !== false,
    ai: { ...DEFAULT_SETTINGS.ai, ...(loaded.ai || {}) },
    oneDrive: { ...DEFAULT_SETTINGS.oneDrive, ...(loaded.oneDrive || {}) },
    vaultAutoLockMinutes: typeof loaded.vaultAutoLockMinutes === 'number' ? loaded.vaultAutoLockMinutes : 5,
    privacyRules: Array.isArray(loaded.privacyRules) ? loaded.privacyRules : DEFAULT_SETTINGS.privacyRules
  }
}

export async function loadSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        if (res && res[STORAGE_KEY]) {
          resolve(mergeSettings(res[STORAGE_KEY]))
        } else {
          resolve({ ...DEFAULT_SETTINGS })
        }
      })
    } else {
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) {
        try {
          resolve(mergeSettings(JSON.parse(local)))
        } catch {
          resolve({ ...DEFAULT_SETTINGS })
        }
      } else {
        resolve({ ...DEFAULT_SETTINGS })
      }
    }
  })
}

export async function saveSettings(settings: AppSettings, triggerOneDrive = true): Promise<void> {
  if (!settings.oneDrive) {
    settings.oneDrive = { hasDirectory: false, autoSync: true, backupFileName: 'mytabs_backup.json' }
  }
  settings.oneDrive.lastModifiedTime = Date.now()
  const plainData = JSON.parse(JSON.stringify(settings))
  return new Promise<void>((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: plainData }, () => {
        resolve()
      })
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plainData))
      resolve()
    }
  }).then(async () => {
    // If auto-sync is enabled and directory is bound, write backup asynchronously
    if (triggerOneDrive && plainData.oneDrive?.autoSync && plainData.oneDrive?.hasDirectory) {
      try {
        const res = await writeBackupToOneDrive(plainData, plainData.oneDrive?.backupFileName)
        if (res.success && res.timestamp) {
          settings.oneDrive.lastSyncTime = res.timestamp
          if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.set({ [STORAGE_KEY]: JSON.parse(JSON.stringify(settings)) })
          } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
          }
        }
      } catch (err) {
        console.warn('Auto sync to backup file failed:', err)
      }
    }
  })
}

export async function updatePopupBlockerStats(delta: number = 1): Promise<PopupBlockerStats> {
  const today = new Date().toISOString().slice(0, 10)
  return new Promise<PopupBlockerStats>((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        const settings = res?.[STORAGE_KEY] ? res[STORAGE_KEY] : { ...DEFAULT_SETTINGS }
        if (!settings.popupBlocker) {
          settings.popupBlocker = { ...DEFAULT_POPUP_BLOCKER }
        }
        if (settings.popupBlocker.stats.lastDate !== today) {
          settings.popupBlocker.stats.todayBlocked = 0
          settings.popupBlocker.stats.lastDate = today
        }
        settings.popupBlocker.stats.todayBlocked += delta
        settings.popupBlocker.stats.totalBlocked += delta
        chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
          resolve(settings.popupBlocker.stats)
        })
      })
    } else {
      resolve({ totalBlocked: 0, todayBlocked: 0, lastDate: today })
    }
  })
}

export async function resetPopupBlockerStats(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  return new Promise<void>((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        const settings = res?.[STORAGE_KEY] ? res[STORAGE_KEY] : { ...DEFAULT_SETTINGS }
        if (!settings.popupBlocker) {
          settings.popupBlocker = { ...DEFAULT_POPUP_BLOCKER }
        }
        settings.popupBlocker.stats = {
          totalBlocked: 0,
          todayBlocked: 0,
          lastDate: today
        }
        chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
          resolve()
        })
      })
    } else {
      resolve()
    }
  })
}

export function exportSettingsAsJSON(settings: AppSettings): void {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mytabs_backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importSettingsFromJSON(file: File): Promise<AppSettings> {
  const text = await file.text()
  const data = JSON.parse(text) as AppSettings
  if (!data.categories || !data.bookmarks) {
    throw new Error('无效的 MyTabs 备份配置文件')
  }
  const merged = mergeSettings(data)
  await saveSettings(merged, false)
  return merged
}
