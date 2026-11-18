import { setupSniffer, getTabResources, clearTabResources, addDOMMediaResource } from './sniffer'
import { setupHistoryCleaner, updatePrivacyRules } from './history-cleaner'
import { setupContextMenus } from './context-menu'
import { fetchSiteMetadata } from './site-meta'
import { setupPopupBlocker } from './popup-blocker'
import { loadSettings } from '../shared/storage'
import { batchTranslateViaEdge, translateSingleText } from '../shared/translation'
import { checkSingleUrl } from '../shared/url-checker'

// Initialize core background modules
setupSniffer()
setupHistoryCleaner()
setupContextMenus()
setupPopupBlocker()

let isTranslationEnabled = true

// Load privacy rules and translation state into memory on launch
loadSettings().then((settings) => {
  if (settings?.privacyRules) {
    updatePrivacyRules(settings.privacyRules)
  }
  if (settings?.immersiveTranslate) {
    isTranslationEnabled = settings.immersiveTranslate.enabled !== false
  }
})

// Listen to storage changes to update cached rules and translation state in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.mytabs_app_settings?.newValue) {
    const newSettings = changes.mytabs_app_settings.newValue
    if (newSettings.privacyRules) {
      updatePrivacyRules(newSettings.privacyRules)
    }
    if (newSettings.immersiveTranslate) {
      isTranslationEnabled = newSettings.immersiveTranslate.enabled !== false
    }
  }
})

// Memory cache for active incognito window
let currentIncognitoWindowId: number | null = null

// Helper to persist/clean active incognito window ID across session and local storage
async function setStoredIncognitoWindowId(id: number | null): Promise<void> {
  currentIncognitoWindowId = id
  if (id !== null) {
    try {
      if (chrome.storage?.local) {
        await chrome.storage.local.set({ activeIncognitoWindowId: id })
      }
      if (chrome.storage?.session) {
        await chrome.storage.session.set({ activeIncognitoWindowId: id })
      }
    } catch {}
  } else {
    try {
      if (chrome.storage?.local) {
        await chrome.storage.local.remove('activeIncognitoWindowId')
      }
      if (chrome.storage?.session) {
        await chrome.storage.session.remove('activeIncognitoWindowId')
      }
    } catch {}
  }
}

async function getStoredIncognitoWindowId(): Promise<number | null> {
  if (currentIncognitoWindowId !== null) {
    return currentIncognitoWindowId
  }
  try {
    if (chrome.storage?.local) {
      const res = await chrome.storage.local.get('activeIncognitoWindowId')
      if (res?.activeIncognitoWindowId && typeof res.activeIncognitoWindowId === 'number') {
        currentIncognitoWindowId = res.activeIncognitoWindowId
        return currentIncognitoWindowId
      }
    }
  } catch {}
  try {
    if (chrome.storage?.session) {
      const res = await chrome.storage.session.get('activeIncognitoWindowId')
      if (res?.activeIncognitoWindowId && typeof res.activeIncognitoWindowId === 'number') {
        currentIncognitoWindowId = res.activeIncognitoWindowId
        return currentIncognitoWindowId
      }
    }
  } catch {}
  return null
}

// Track the active incognito window to reuse it across multiple bookmark clicks
chrome.windows.onRemoved.addListener(async (windowId) => {
  const storedId = await getStoredIncognitoWindowId()
  if (storedId === windowId || currentIncognitoWindowId === windowId) {
    await setStoredIncognitoWindowId(null)
  }
})

// Safely test whether extension is granted incognito access by user in chrome://extensions
async function checkIncognitoAllowed(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.extension?.isAllowedIncognitoAccess) {
        chrome.extension.isAllowedIncognitoAccess((allowed) => resolve(!!allowed))
        return
      }
    } catch {}
    resolve(true)
  })
}

// Mutex queue to prevent race condition when multiple bookmarks clicked rapidly
let incognitoActionQueue: Promise<any> = Promise.resolve()

async function openInIncognitoInternal(url: string): Promise<{ success: boolean; reused: boolean; isAllowed: boolean; error?: string }> {
  const isAllowed = await checkIncognitoAllowed()

  // 1. Check whether we have a recorded active incognito window ID
  let targetWindowId = await getStoredIncognitoWindowId()

  // Verify that the recorded window is actually alive
  if (targetWindowId !== null) {
    try {
      const win = await chrome.windows.get(targetWindowId)
      if (!win?.id) {
        targetWindowId = null
        await setStoredIncognitoWindowId(null)
      }
    } catch {
      targetWindowId = null
      await setStoredIncognitoWindowId(null)
    }
  }

  // 2. If no window was recorded, query all open windows across browser
  if (targetWindowId === null) {
    try {
      const allWins = await chrome.windows.getAll({ windowTypes: ['normal'] })
      const found = allWins.find((w) => w.incognito && w.id)
      if (found?.id) {
        targetWindowId = found.id
        await setStoredIncognitoWindowId(found.id)
      }
    } catch {}
  }

  // 3. If targetWindowId is found, attempt to append a new tab into it
  if (targetWindowId !== null) {
    try {
      await chrome.tabs.create({ windowId: targetWindowId, url, active: true })
      await chrome.windows.update(targetWindowId, { focused: true })
      return { success: true, reused: true, isAllowed }
    } catch (err: any) {
      console.warn('Failed to append tab into existing incognito window:', err)
      targetWindowId = null
      await setStoredIncognitoWindowId(null)
    }
  }

  // 4. Otherwise, create a new incognito window
  try {
    const newWin = await chrome.windows.create({ url, incognito: true, focused: true })
    if (newWin?.id) {
      await setStoredIncognitoWindowId(newWin.id)
    }
    return { success: true, reused: false, isAllowed }
  } catch (err: any) {
    console.warn('Failed to create incognito window:', err)
    return { success: false, error: String(err), isAllowed, reused: false }
  }
}

function openInIncognito(url: string): Promise<{ success: boolean; reused: boolean; isAllowed: boolean; error?: string }> {
  const task = incognitoActionQueue.then(() => openInIncognitoInternal(url)).catch((err) => ({
    success: false,
    error: String(err),
    isAllowed: false,
    reused: false
  }))
  incognitoActionQueue = task.then(() => {})
  return task
}

// Handle runtime messages across components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SNIFFED_RESOURCES') {
    const tabId = message.tabId || sender.tab?.id
    if (typeof tabId === 'number') {
      sendResponse({ resources: getTabResources(tabId) })
    } else {
      sendResponse({ resources: [] })
    }
    return true
  }

  if (message.type === 'CLEAR_SNIFFED_RESOURCES') {
    const tabId = message.tabId || sender.tab?.id
    if (typeof tabId === 'number') {
      clearTabResources(tabId)
    }
    sendResponse({ success: true })
    return true
  }

  if (message.type === 'DOM_MEDIA_DETECTED' && sender.tab?.id) {
    addDOMMediaResource(sender.tab.id, message.data)
    sendResponse({ success: true })
    return true
  }

  if (message.type === 'FETCH_SITE_METADATA' && message.url) {
    fetchSiteMetadata(message.url)
      .then((meta) => {
        sendResponse({ success: true, ...meta })
      })
      .catch((err) => {
        sendResponse({ success: false, error: String(err) })
      })
    return true
  }

  if (message.type === 'OPEN_INCOGNITO' && message.url) {
    openInIncognito(message.url).then((res) => sendResponse(res))
    return true
  }

  if (message.type === 'CHECK_SINGLE_URL' && message.url) {
    checkSingleUrl(message.url, message.timeoutMs || 6000).then((res) => sendResponse(res))
    return true
  }

  if (message.type === 'OPEN_SIDEPANEL') {
    const tabId = message.tabId || sender.tab?.id
    if (tabId) {
      (chrome.sidePanel as any).open({ tabId }).catch(() => {})
    }
    sendResponse({ success: true })
    return true
  }

  if (message.type === 'TRANSLATE_BATCH_TEXTS' && Array.isArray(message.texts)) {
    if (!isTranslationEnabled) {
      sendResponse({ success: false, error: 'TRANSLATION_DISABLED' })
      return true
    }
    batchTranslateViaEdge(message.texts, message.targetLang || 'zh-Hans', message.fromLang)
      .then((results) => {
        sendResponse({ success: true, results })
      })
      .catch((err) => {
        sendResponse({ success: false, error: String(err) })
      })
    return true
  }

  if (message.type === 'TRANSLATE_SINGLE_TEXT' && typeof message.text === 'string') {
    if (!isTranslationEnabled) {
      sendResponse({ success: false, error: 'TRANSLATION_DISABLED' })
      return true
    }
    translateSingleText(message.text, message.targetLang || 'zh-Hans', message.fromLang)
      .then((translated) => {
        sendResponse({ success: true, translated })
      })
      .catch((err) => {
        sendResponse({ success: false, error: String(err) })
      })
    return true
  }
})
