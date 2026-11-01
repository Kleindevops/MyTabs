import type { SniffedResource } from '../shared/types'

// Map of tabId -> SniffedResource[]
const tabResources = new Map<number, SniffedResource[]>()
// Map of tabId -> Tab Title
const tabTitles = new Map<number, string>()

const MEDIA_EXTENSIONS = /\.(m3u8|mp4|flv|f4v|webm|ts|m4s|mp3|m4a|aac|flac|wav|ogg)(\?.*)?$/i
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i

/**
 * Auto unwrap media URLs from web players like DPlayer, CKPlayer, ArtPlayer, etc.
 * e.g. https://.../addons/dplayer/?url=https://vostrely.com/.../index.m3u8 -> https://vostrely.com/.../index.m3u8
 */
export function unwrapMediaUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    for (const key of ['url', 'src', 'video', 'v', 'link', 'file', 'target']) {
      const val = parsed.searchParams.get(key)
      if (val && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('//'))) {
        const clean = val.startsWith('//') ? `https:${val}` : val
        return decodeURIComponent(clean)
      }
    }
  } catch {}
  return rawUrl
}

export function setupSniffer(): void {
  // Listen to tab updates to track webpage titles for videos
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.title) {
      tabTitles.set(tabId, cleanTabTitle(tab.title))
      // Retroactively attach title to existing resources of this tab
      const list = tabResources.get(tabId)
      if (list) {
        for (const item of list) {
          if (!item.title) item.title = cleanTabTitle(tab.title)
        }
      }
    }
  })

  // Listen to response headers to detect media streams and files
  chrome.webRequest.onResponseStarted.addListener(
    (details) => {
      if (details.tabId < 0) return

      let mime = ''
      let contentLength = 0

      if (details.responseHeaders) {
        for (const h of details.responseHeaders) {
          const name = h.name.toLowerCase()
          if (name === 'content-type') {
            mime = h.value?.toLowerCase() || ''
          } else if (name === 'content-length') {
            contentLength = parseInt(h.value || '0', 10)
          }
        }
      }

      // Automatically unwrap player wrappers (like DPlayer / CKPlayer iframe wrappers)
      const finalUrl = unwrapMediaUrl(details.url)

      // If mime is text/html and not a player-wrapped media url, ignore plain webpages
      if (mime.includes('text/html') || mime.includes('text/plain')) {
        if (finalUrl === details.url) {
          return // Normal webpage, ignore
        }
      }

      let type: SniffedResource['type'] | null = null

      if (mime.includes('vnd.apple.mpegurl') || mime.includes('x-mpegurl') || finalUrl.includes('.m3u8')) {
        type = 'm3u8'
      } else if (mime.startsWith('video/') || MEDIA_EXTENSIONS.test(finalUrl)) {
        type = 'video'
      } else if (mime.startsWith('audio/')) {
        type = 'audio'
      } else if (mime.startsWith('image/') || IMAGE_EXTENSIONS.test(finalUrl)) {
        // Only capture significant images (> 50KB or SVG) to avoid ad tracker icons
        if (contentLength > 50 * 1024 || mime.includes('svg') || finalUrl.includes('.svg')) {
          type = 'image'
        }
      }

      if (!type) return

      const list = tabResources.get(details.tabId) || []

      // Avoid exact duplicates; if existing, update file size if newly found
      const existing = list.find((item) => item.url === finalUrl)
      if (existing) {
        if (contentLength > (existing.size || 0)) {
          existing.size = contentLength
          existing.sizeFormatted = formatBytes(contentLength, existing.type)
        }
        return
      }

      // Detect if this is a minor chunk / segment
      const isM3U8 = type === 'm3u8'
      const isChunk = Boolean(
        !isM3U8 && (
          finalUrl.includes('.ts') ||
          finalUrl.includes('.m4s') ||
          finalUrl.includes('/chunk') ||
          finalUrl.includes('/segment') ||
          finalUrl.includes('range=') ||
          mime.includes('mp2t') ||
          (contentLength > 0 && contentLength < 3 * 1024 * 1024 && (finalUrl.includes('.ts') || mime.includes('mp2t')))
        )
      )

      // Extract filename from final clean URL
      let filename = 'resource'
      try {
        const pathname = new URL(finalUrl).pathname
        const segments = pathname.split('/')
        const last = segments.pop() || ''
        if (last && last.length < 80) {
          filename = decodeURIComponent(last)
        }
      } catch {
        filename = `media_${Date.now()}`
      }

      // Obtain current page title
      let title = tabTitles.get(details.tabId)
      if (!title) {
        chrome.tabs.get(details.tabId).then((t) => {
          if (t?.title) {
            tabTitles.set(details.tabId, cleanTabTitle(t.title))
            const curList = tabResources.get(details.tabId)
            if (curList) {
              for (const r of curList) {
                if (!r.title) r.title = cleanTabTitle(t.title)
              }
            }
          }
        }).catch(() => {})
      }

      const resource: SniffedResource = {
        id: `sniff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: finalUrl,
        tabId: details.tabId,
        title: title || undefined,
        filename,
        type,
        size: contentLength,
        sizeFormatted: formatBytes(contentLength, type),
        mime,
        timestamp: Date.now(),
        isChunk
      }

      list.unshift(resource)
      tabResources.set(details.tabId, list)

      // Update badge count
      updateTabBadge(details.tabId, list.length)
    },
    { urls: ['<all_urls>'] },
    ['responseHeaders']
  )

  // Clear when tab is closed or navigated
  chrome.tabs.onRemoved.addListener((tabId) => {
    tabResources.delete(tabId)
    tabTitles.delete(tabId)
  })

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading' && changeInfo.url) {
      tabResources.delete(tabId)
      updateTabBadge(tabId, 0)
    }
  })
}

function cleanTabTitle(title: string): string {
  if (!title) return ''
  // Remove trailing website suffix like " - 哔哩哔哩", " - YouTube", " - 腾讯视频"
  return title
    .replace(/_哔哩哔哩_bilibili$/i, '')
    .replace(/ - 哔哩哔哩$/i, '')
    .replace(/ - YouTube$/i, '')
    .replace(/ - 腾讯视频$/i, '')
    .replace(/ - 爱奇艺$/i, '')
    .replace(/ - 优酷视频$/i, '')
    .trim()
}

function updateTabBadge(tabId: number, count: number): void {
  if (count > 0) {
    chrome.action.setBadgeText({ tabId, text: String(count) })
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#3b82f6' })
  } else {
    chrome.action.setBadgeText({ tabId, text: '' })
  }
}

function formatBytes(bytes: number, type?: SniffedResource['type']): string {
  if (type === 'm3u8') return 'HLS 完整流'
  if (!bytes || bytes <= 0) return '流媒体 / 未知大小'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let num = bytes
  while (num >= 1024 && i < units.length - 1) {
    num /= 1024
    i++
  }
  return `${num.toFixed(1)} ${units[i]}`
}

export function getTabResources(tabId: number): SniffedResource[] {
  return tabResources.get(tabId) || []
}

export function clearTabResources(tabId: number): void {
  tabResources.delete(tabId)
  updateTabBadge(tabId, 0)
}

// Add DOM detected resources (e.g. video tags sent from content script)
export function addDOMMediaResource(tabId: number, item: { url: string; type: SniffedResource['type']; filename?: string }): void {
  const finalUrl = unwrapMediaUrl(item.url)
  const list = tabResources.get(tabId) || []
  if (list.some((r) => r.url === finalUrl)) return

  const title = tabTitles.get(tabId)
  const resource: SniffedResource = {
    id: `dom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url: finalUrl,
    tabId,
    title: title || undefined,
    filename: item.filename || '网页内嵌媒体',
    type: item.type,
    timestamp: Date.now(),
    isChunk: false
  }

  list.unshift(resource)
  tabResources.set(tabId, list)
  updateTabBadge(tabId, list.length)
}
