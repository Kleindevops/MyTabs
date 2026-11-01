import type { PrivacyRule } from '../shared/types'

let cachedRules: PrivacyRule[] = []

export function updatePrivacyRules(rules: PrivacyRule[]): void {
  cachedRules = rules || []
}

function matchesPattern(url: string, pattern: string): boolean {
  if (!pattern || !url) return false
  try {
    // Convert wildcard pattern like *://*.google.com/* into Regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape special regex chars except *
      .replace(/\*/g, '.*')
    const regex = new RegExp(`^${regexPattern}$`, 'i')
    return regex.test(url)
  } catch {
    return url.toLowerCase().includes(pattern.toLowerCase())
  }
}

export function setupHistoryCleaner(): void {
  // 1. Listen for new visits in browser history
  chrome.history.onVisited.addListener((historyItem) => {
    if (!historyItem.url) return
    const url = historyItem.url

    const matchedRule = cachedRules.find(
      (r) => r.enabled && r.action === 'delete_history' && matchesPattern(url, r.pattern)
    )

    if (matchedRule) {
      chrome.history.deleteUrl({ url }, () => {
        console.log(`[MyTabs 隐私管理] 已自动抹除无痕历史: ${url}`)
      })
    }
  })

  // 2. Listen to navigations to intercept incognito-required URLs
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Only intercept main frame top-level navigations
    if (details.frameId !== 0 || !details.url || details.url.startsWith('chrome://')) return

    const matchedRule = cachedRules.find(
      (r) => r.enabled && r.action === 'incognito' && matchesPattern(details.url, r.pattern)
    )

    if (matchedRule) {
      try {
        const tab = await chrome.tabs.get(details.tabId)
        // If already inside an incognito window, allow normally
        if (tab.incognito) return

        // Otherwise: close normal tab and open incognito window
        await chrome.tabs.remove(details.tabId)
        await chrome.windows.create({
          url: details.url,
          incognito: true,
          focused: true
        })
        console.log(`[MyTabs 隐私管理] 已将敏感网址重定向至无痕窗口: ${details.url}`)
      } catch (err) {
        console.warn('Incognito redirect error:', err)
      }
    }
  })
}
