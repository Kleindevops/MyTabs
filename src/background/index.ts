import { setupSniffer, getTabResources, clearTabResources, addDOMMediaResource } from './sniffer'
import { setupHistoryCleaner, updatePrivacyRules } from './history-cleaner'
import { setupContextMenus } from './context-menu'
import { fetchSiteMetadata } from './site-meta'
import { setupPopupBlocker } from './popup-blocker'
import { loadSettings } from '../shared/storage'
import { batchTranslateViaEdge, translateSingleText } from '../shared/translation'

// Initialize core background modules
setupSniffer()
setupHistoryCleaner()
setupContextMenus()
setupPopupBlocker()

// Load privacy rules into memory on launch
loadSettings().then((settings) => {
  if (settings?.privacyRules) {
    updatePrivacyRules(settings.privacyRules)
  }
})

// Listen to storage changes to update cached privacy rules in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.mytabs_app_settings?.newValue) {
    const newSettings = changes.mytabs_app_settings.newValue
    if (newSettings.privacyRules) {
      updatePrivacyRules(newSettings.privacyRules)
    }
  }
})

// Track the active incognito window to reuse it across multiple bookmark clicks
chrome.windows.onRemoved.addListener((windowId) => {
  try {
    chrome.storage.session.get('activeIncognitoWindowId', (data) => {
      if (data?.activeIncognitoWindowId === windowId) {
        chrome.storage.session.remove('activeIncognitoWindowId')
      }
    })
  } catch {}
})

async function openInIncognito(url: string) {
  // Check whether extension is granted incognito access by user in chrome://extensions
  const isAllowed = await new Promise<boolean>((resolve) => {
    try {
      chrome.extension.isAllowedIncognitoAccess((allowed) => resolve(allowed))
    } catch {
      resolve(false)
    }
  })

  // 1. Try to find an existing open incognito window
  let targetWindowId: number | null = null

  // A. Check storage.session (persists across service worker sleep cycles)
  try {
    const data = await chrome.storage.session.get('activeIncognitoWindowId')
    if (data?.activeIncognitoWindowId) {
      const win = await chrome.windows.get(data.activeIncognitoWindowId)
      if (win?.id) {
        targetWindowId = win.id
      }
    }
  } catch {
    await chrome.storage.session.remove('activeIncognitoWindowId')
  }

  // B. If not in session storage, query all open windows across browser
  if (!targetWindowId) {
    try {
      const allWins = await chrome.windows.getAll()
      const found = allWins.find((w) => w.incognito && w.id)
      if (found?.id) {
        targetWindowId = found.id
        await chrome.storage.session.set({ activeIncognitoWindowId: found.id })
      }
    } catch {}
  }

  // 2. If an existing incognito window is found, create tab inside it
  if (targetWindowId !== null) {
    try {
      await chrome.tabs.create({ windowId: targetWindowId, url, active: true })
      await chrome.windows.update(targetWindowId, { focused: true })
      return { success: true, reused: true, isAllowed }
    } catch (err) {
      console.warn('Failed to append tab to existing incognito window:', err)
      targetWindowId = null
      await chrome.storage.session.remove('activeIncognitoWindowId')
    }
  }

  // 3. Otherwise, create a new incognito window
  try {
    const newWin = await chrome.windows.create({ url, incognito: true, focused: true })
    if (newWin?.id) {
      await chrome.storage.session.set({ activeIncognitoWindowId: newWin.id })
    }
    return { success: true, reused: false, isAllowed }
  } catch (err) {
    console.warn('Failed to create incognito window:', err)
    return { success: false, error: String(err), isAllowed }
  }
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

  if (message.type === 'OPEN_SIDEPANEL') {
    const tabId = message.tabId || sender.tab?.id
    if (tabId) {
      (chrome.sidePanel as any).open({ tabId }).catch(() => {})
    }
    sendResponse({ success: true })
    return true
  }

  if (message.type === 'TRANSLATE_BATCH_TEXTS' && Array.isArray(message.texts)) {
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
