import type { PopupBlockerConfig, PopupBlockerStats } from '../shared/types'
import { DEFAULT_POPUP_BLOCKER, loadSettings, STORAGE_KEY } from '../shared/storage'

let cachedConfig: PopupBlockerConfig = { ...DEFAULT_POPUP_BLOCKER }

// Rapid tab spawn tracker: openerTabId -> { count, lastTime }
const tabSpawnTracker = new Map<number, { count: number; lastTime: number }>()

// Pending spawned popup tabs tracking for async URL navigation inspection
interface PendingPopupInfo {
  tabId: number
  sourceTabId: number
  isIncognito: boolean
  createdAt: number
}
const pendingPopupTabs = new Map<number, PendingPopupInfo>()

// Clean up tracker for closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  tabSpawnTracker.delete(tabId)
  pendingPopupTabs.delete(tabId)
})

// Auto sweep stale pending popup entries older than 30 seconds
setInterval(() => {
  const now = Date.now()
  for (const [tabId, info] of pendingPopupTabs.entries()) {
    if (now - info.createdAt > 30000) {
      pendingPopupTabs.delete(tabId)
    }
  }
}, 15000)

export function updatePopupBlockerConfig(config: PopupBlockerConfig): void {
  cachedConfig = config || { ...DEFAULT_POPUP_BLOCKER }
}

export function getPopupBlockerConfig(): PopupBlockerConfig {
  return cachedConfig
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.toLowerCase()
  } catch {
    return ''
  }
}

function isWhitelisted(domain: string): boolean {
  if (!domain || !cachedConfig.whitelist || cachedConfig.whitelist.length === 0) return false
  const lowerDomain = domain.toLowerCase()
  return cachedConfig.whitelist.some((w) => {
    const item = w.trim().toLowerCase()
    if (!item) return false
    return lowerDomain === item || lowerDomain.endsWith('.' + item)
  })
}

// Comprehensive Suspicious URL patterns often used in ad networks, pop-unders, clickjack redirects & casino/adult spams
const SUSPICIOUS_PATTERNS = [
  /popads/i,
  /popcash/i,
  /adsterra/i,
  /exoclick/i,
  /propellerads/i,
  /trafficjunky/i,
  /trafficstars/i,
  /juicyads/i,
  /plugrush/i,
  /doubleclick/i,
  /googleadservices/i,
  /adservice/i,
  /adclick/i,
  /adnxs/i,
  /adroll/i,
  /clickserve/i,
  /zeroredirect/i,
  /bet365/i,
  /1xbet/i,
  /adcolony/i,
  /clickbank/i,
  /popunder/i,
  /syndication/i,
  /fastclick/i,
  /revenuehits/i,
  /hilltopads/i,
  /clickadu/i,
  /bidvertiser/i,
  /yandex.*\/clck\//i,
  /[?&](pop|popunder|ad_id|aff_id|click_id|sub_id|clickid)=/i,
  /[?&]utm_(source|medium)=pop/i,
  /\/pop-?up\//i,
  /\/pop-?under\//i,
  /\/click-?tracker\//i,
  /\/affiliate-?redirect/i
]

function isSuspiciousUrl(url: string): boolean {
  if (!url || url === 'about:blank') return false
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(url))
}

async function recordBlock(sourceTabId: number, targetUrl: string, isIncognito: boolean = false) {
  const today = new Date().toISOString().slice(0, 10)
  if (cachedConfig.stats.lastDate !== today) {
    cachedConfig.stats.todayBlocked = 0
    cachedConfig.stats.lastDate = today
  }
  cachedConfig.stats.todayBlocked++
  cachedConfig.stats.totalBlocked++

  // Update badge on source tab
  try {
    if (sourceTabId > 0) {
      await chrome.action.setBadgeText({ tabId: sourceTabId, text: '🛡️' })
      await chrome.action.setBadgeBackgroundColor({ tabId: sourceTabId, color: '#3b82f6' })

      // Dispatch real-time notification to content script on source page
      chrome.tabs.sendMessage(sourceTabId, {
        type: 'POPUP_BLOCKED_NOTICE',
        isIncognito
      }).catch(() => {})
    }
  } catch {}

  // Save stats to storage silently with atomic patch (never overwrite bookmarks)
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        if (res?.[STORAGE_KEY]) {
          const s = res[STORAGE_KEY]
          if (!s.popupBlocker) {
            s.popupBlocker = { ...cachedConfig }
          }
          s.popupBlocker.stats = { ...cachedConfig.stats }
          chrome.storage.local.set({ [STORAGE_KEY]: s })
        }
      })
    }
  } catch {}

  // Privacy protection: Under incognito, NEVER log or persist specific URLs to safeguard user privacy!
  if (isIncognito) {
    console.log('[MyTabs 弹窗拦截] [隐私模式防护] 已成功拦截无痕窗口弹窗 (敏感地址已自动脱敏，不留存储痕迹)')
  } else {
    console.log(`[MyTabs 弹窗拦截] 已成功拦截来自标签 #${sourceTabId} 的弹窗: ${targetUrl.slice(0, 80)}`)
  }
}

export function setupPopupBlocker(): void {
  // Load initial settings
  loadSettings().then((settings) => {
    if (settings?.popupBlocker) {
      cachedConfig = settings.popupBlocker
    }
  })

  // Keep cached configuration in sync with local storage
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.mytabs_app_settings?.newValue) {
      const newSettings = changes.mytabs_app_settings.newValue
      if (newSettings.popupBlocker) {
        cachedConfig = newSettings.popupBlocker
      }
    }
  })

  // 1. Navigation target creation hook (Captures new tabs spawned from existing tabs)
  chrome.webNavigation.onCreatedNavigationTarget.addListener(async (details) => {
    if (!cachedConfig.enabled || !cachedConfig.blockNewTabPopups) return

    try {
      const sourceTab = await chrome.tabs.get(details.sourceTabId)
      if (!sourceTab || !sourceTab.url) return

      // Don't intercept internal browser pages or extension pages
      if (
        sourceTab.url.startsWith('chrome://') ||
        sourceTab.url.startsWith('edge://') ||
        sourceTab.url.startsWith('chrome-extension://')
      ) {
        return
      }

      const sourceDomain = extractDomain(sourceTab.url)
      if (isWhitelisted(sourceDomain)) return

      const targetUrl = details.url || ''
      const isSuspicious = isSuspiciousUrl(targetUrl)

      // If already suspicious, kill the popup tab immediately
      if (isSuspicious) {
        await chrome.tabs.remove(details.tabId)
        await recordBlock(details.sourceTabId, targetUrl, sourceTab.incognito)
        return
      }

      // Otherwise, track this spawned tab for subsequent URL navigation changes (solves initial about:blank popup escape)
      pendingPopupTabs.set(details.tabId, {
        tabId: details.tabId,
        sourceTabId: details.sourceTabId,
        isIncognito: !!sourceTab.incognito,
        createdAt: Date.now()
      })
    } catch {}
  })

  // 2. Tab creation hook (Captures rapid pop-under flood / multiple tabs burst)
  chrome.tabs.onCreated.addListener(async (newTab) => {
    if (!cachedConfig.enabled || !cachedConfig.blockNewTabPopups) return
    if (!newTab.id || !newTab.openerTabId) return

    const openerId = newTab.openerTabId

    try {
      const opener = await chrome.tabs.get(openerId)
      if (!opener || !opener.url) return
      if (
        opener.url.startsWith('chrome://') ||
        opener.url.startsWith('edge://') ||
        opener.url.startsWith('chrome-extension://')
      ) {
        return
      }

      const openerDomain = extractDomain(opener.url)
      if (isWhitelisted(openerDomain)) return

      const now = Date.now()
      const tracker = tabSpawnTracker.get(openerId) || { count: 0, lastTime: 0 }

      // Rapid tab opening detection (more than 1 tab within 1200ms without user intervention is a popup bomb)
      if (now - tracker.lastTime < 1200) {
        tracker.count++
      } else {
        tracker.count = 1
      }
      tracker.lastTime = now
      tabSpawnTracker.set(openerId, tracker)

      // If 2nd tab is spawned in burst, immediately terminate it
      if (tracker.count > 1) {
        await chrome.tabs.remove(newTab.id)
        await recordBlock(openerId, newTab.pendingUrl || newTab.url || 'rapid-popup-flood', newTab.incognito)
        return
      }

      // Check if target pendingUrl matches suspicious ad network
      const targetUrl = newTab.pendingUrl || newTab.url || ''
      if (targetUrl && isSuspiciousUrl(targetUrl)) {
        await chrome.tabs.remove(newTab.id)
        await recordBlock(openerId, targetUrl, newTab.incognito)
        return
      }

      // Track this new tab for subsequent url updates
      pendingPopupTabs.set(newTab.id, {
        tabId: newTab.id,
        sourceTabId: openerId,
        isIncognito: !!newTab.incognito,
        createdAt: Date.now()
      })
    } catch {}
  })

  // 3. Tab update hook: Inspect URL changes for tracked popup tabs (Catches late-loading ad URLs)
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!cachedConfig.enabled || !cachedConfig.blockNewTabPopups) return
    const tracked = pendingPopupTabs.get(tabId)
    if (!tracked) return

    const currentUrl = changeInfo.url || tab.url || ''
    if (!currentUrl || currentUrl === 'about:blank') return

    if (isSuspiciousUrl(currentUrl)) {
      try {
        await chrome.tabs.remove(tabId)
        pendingPopupTabs.delete(tabId)
        await recordBlock(tracked.sourceTabId, currentUrl, tracked.isIncognito || tab.incognito)
      } catch {}
      return
    }

    // If loaded into a normal safe URL for over 5 seconds, remove from pending watch pool
    if (tab.status === 'complete') {
      setTimeout(() => {
        pendingPopupTabs.delete(tabId)
      }, 5000)
    }
  })

  // 4. Web navigation before-navigate hook: Catch suspicious redirects on tracked popup tabs before page even starts rendering
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (!cachedConfig.enabled || !cachedConfig.blockNewTabPopups) return
    if (details.frameId !== 0) return

    const tracked = pendingPopupTabs.get(details.tabId)
    if (!tracked) return

    if (details.url && isSuspiciousUrl(details.url)) {
      try {
        await chrome.tabs.remove(details.tabId)
        pendingPopupTabs.delete(details.tabId)
        await recordBlock(tracked.sourceTabId, details.url, tracked.isIncognito)
      } catch {}
    }
  })

  // 5. Handle messages from content script or settings UI
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'POPUP_INTERCEPTED_BY_CONTENT') {
      const sourceTabId = sender.tab?.id || 0
      const isIncognito = sender.tab?.incognito || false
      recordBlock(sourceTabId, message.url || 'in-page-overlay', isIncognito)
      sendResponse({ success: true })
      return true
    }

    if (message.type === 'GET_POPUP_BLOCKER_CONFIG') {
      sendResponse({ config: cachedConfig })
      return true
    }
  })
}
