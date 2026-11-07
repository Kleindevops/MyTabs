// Content script: DOM Media Detector, Webpage Article Text Extractor, Smart Popup Interceptor & Immersive Translator
import { initImmersiveTranslation, togglePageBilingualTranslation, updateImmersiveConfig } from './immersive'

// ==========================================
// 1. Media Detection
// ==========================================
function scanDOMMedia() {
  const videos = document.querySelectorAll<HTMLVideoElement>('video')
  videos.forEach((video) => {
    const src = video.currentSrc || video.src
    if (src && !src.startsWith('blob:') && src.startsWith('http')) {
      chrome.runtime.sendMessage({
        type: 'DOM_MEDIA_DETECTED',
        data: {
          url: src,
          type: 'video',
          filename: document.title || '网页视频'
        }
      }).catch(() => {})
    }
  })

  const audios = document.querySelectorAll<HTMLAudioElement>('audio')
  audios.forEach((audio) => {
    const src = audio.currentSrc || audio.src
    if (src && !src.startsWith('blob:') && src.startsWith('http')) {
      chrome.runtime.sendMessage({
        type: 'DOM_MEDIA_DETECTED',
        data: {
          url: src,
          type: 'audio',
          filename: document.title || '网页音频'
        }
      }).catch(() => {})
    }
  })
}

// ==========================================
// 2. Article Text Extraction for AI Sidebar
// ==========================================
function extractReadablePageText(): string {
  const mainCandidate = document.querySelector('article') || document.querySelector('main') || document.body
  if (!mainCandidate) return ''

  const clone = mainCandidate.cloneNode(true) as HTMLElement
  const noiseSelectors = ['script', 'style', 'nav', 'header', 'footer', 'noscript', 'iframe', 'svg', '.ads', '#comments']
  noiseSelectors.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove())
  })

  const rawText = clone.innerText || clone.textContent || ''
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .slice(0, 15000)
}

// ==========================================
// 3. Smart Popup & In-Page Overlay Blocker
// ==========================================
let popupBlockerEnabled = true
let blockModalOverlays = true
let blockClickjacking = true
let restoreScroll = true
let isCurrentSiteWhitelisted = false

function checkHostnameWhitelisted(whitelist: string[]): boolean {
  try {
    const host = window.location.hostname.toLowerCase()
    return (whitelist || []).some((item) => {
      const clean = item.trim().toLowerCase()
      return clean && (host === clean || host.endsWith('.' + clean))
    })
  } catch {
    return false
  }
}

function injectWindowOpenHook() {
  if (!popupBlockerEnabled || isCurrentSiteWhitelisted) return
  try {
    const script = document.createElement('script')
    script.setAttribute('data-mytabs', 'guard')
    script.textContent = `
      (function() {
        if (window.__mytabs_open_guarded) return;
        window.__mytabs_open_guarded = true;
        const _origOpen = window.open;
        let _lastOpen = 0;
        window.open = function(url, target, features) {
          const now = Date.now();
          if (now - _lastOpen < 800) {
            console.warn('[MyTabs 弹窗拦截] 阻止高频恶意弹窗:', url);
            window.dispatchEvent(new CustomEvent('mytabs_blocked_popup', { detail: { url } }));
            return null;
          }
          _lastOpen = now;
          return _origOpen.apply(this, arguments);
        };
      })();
    `
    ;(document.head || document.documentElement).appendChild(script)
    script.remove()
  } catch {}
}

window.addEventListener('mytabs_blocked_popup', (e: any) => {
  chrome.runtime.sendMessage({
    type: 'POPUP_INTERCEPTED_BY_CONTENT',
    url: e.detail?.url || 'window.open-spam'
  }).catch(() => {})
})

function cleanClickjackingTraps() {
  if (!popupBlockerEnabled || !blockClickjacking || isCurrentSiteWhitelisted) return

  const viewportW = window.innerWidth
  const viewportH = window.innerHeight

  const candidates = document.querySelectorAll<HTMLElement>('a, div')
  candidates.forEach((el) => {
    if (el.hasAttribute('data-mytabs-cleaned')) return

    const style = window.getComputedStyle(el)
    if (style.position !== 'fixed' && style.position !== 'absolute') return

    const rect = el.getBoundingClientRect()
    const coversWide = rect.width >= viewportW * 0.4 && rect.height >= viewportH * 0.4
    if (!coversWide) return

    const zIndex = parseInt(style.zIndex, 10)
    const isHighZ = !isNaN(zIndex) && zIndex >= 999
    const isTransparent =
      style.opacity === '0' ||
      style.visibility === 'hidden' ||
      (style.backgroundColor && style.backgroundColor.includes('rgba') && style.backgroundColor.includes(', 0)'))

    if (isHighZ && isTransparent && el.tagName.toLowerCase() === 'a') {
      el.setAttribute('data-mytabs-cleaned', 'true')
      el.remove()
      chrome.runtime.sendMessage({
        type: 'POPUP_INTERCEPTED_BY_CONTENT',
        url: (el as HTMLAnchorElement).href || 'clickjack-transparent-overlay'
      }).catch(() => {})
    }
  })
}

function cleanInPageModals() {
  if (!popupBlockerEnabled || !blockModalOverlays || isCurrentSiteWhitelisted) return

  const adOverlayKeywords = [
    'login-modal', 'login-overlay', 'app-download', 'guide-overlay',
    'ad-modal', 'popup-ad', 'pop-overlay', 'backdrop-ad', 'wall-dialog'
  ]

  const fixedEls = document.querySelectorAll<HTMLElement>('div, section, aside')
  let cleanedAny = false

  fixedEls.forEach((el) => {
    if (el.hasAttribute('data-mytabs-checked')) return
    el.setAttribute('data-mytabs-checked', 'true')

    const style = window.getComputedStyle(el)
    if (style.position !== 'fixed') return

    const zIndex = parseInt(style.zIndex, 10)
    if (isNaN(zIndex) || zIndex < 1000) return

    const rect = el.getBoundingClientRect()
    const isFullScreen = rect.width >= window.innerWidth * 0.75 && rect.height >= window.innerHeight * 0.75
    if (!isFullScreen) return

    const className = (el.className || '').toString().toLowerCase()
    const id = (el.id || '').toLowerCase()
    const combined = `${className} ${id}`

    const matchesKeyword = adOverlayKeywords.some((kw) => combined.includes(kw))
    if (matchesKeyword) {
      el.style.display = 'none'
      cleanedAny = true
      chrome.runtime.sendMessage({
        type: 'POPUP_INTERCEPTED_BY_CONTENT',
        url: `overlay:${combined.slice(0, 50)}`
      }).catch(() => {})
    }
  })

  // Restore scrollbars if blocked by in-page modal
  if (restoreScroll && cleanedAny) {
    document.body.style.setProperty('overflow', 'auto', 'important')
    document.documentElement.style.setProperty('overflow', 'auto', 'important')
  }
}

function runBlockerCycle() {
  cleanClickjackingTraps()
  cleanInPageModals()
}

// Fetch initial config from background service worker
try {
  chrome.runtime.sendMessage({ type: 'GET_POPUP_BLOCKER_CONFIG' }, (response) => {
    if (response?.config) {
      popupBlockerEnabled = response.config.enabled
      blockModalOverlays = response.config.blockModalOverlays
      blockClickjacking = response.config.blockClickjacking
      restoreScroll = response.config.restoreScroll
      isCurrentSiteWhitelisted = checkHostnameWhitelisted(response.config.whitelist)
      if (popupBlockerEnabled && !isCurrentSiteWhitelisted) {
        injectWindowOpenHook()
        runBlockerCycle()
      }
    }
  })
} catch {}

// Sync settings updates in real time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.mytabs_app_settings?.newValue) {
    const newSettings = changes.mytabs_app_settings.newValue
    if (newSettings.popupBlocker) {
      const config = newSettings.popupBlocker
      popupBlockerEnabled = config.enabled
      blockModalOverlays = config.blockModalOverlays
      blockClickjacking = config.blockClickjacking
      restoreScroll = config.restoreScroll
      isCurrentSiteWhitelisted = checkHostnameWhitelisted(config.whitelist)
      if (popupBlockerEnabled && !isCurrentSiteWhitelisted) {
        injectWindowOpenHook()
        runBlockerCycle()
      }
    }
    if (newSettings.immersiveTranslate) {
      updateImmersiveConfig(newSettings.immersiveTranslate)
    }
  }
})

// Initialize scan, observer & immersive translator
scanDOMMedia()
runBlockerCycle()

try {
  chrome.storage.local.get(['mytabs_app_settings'], (res) => {
    const settings = res?.mytabs_app_settings
    initImmersiveTranslation(settings?.immersiveTranslate)
  })
} catch {
  initImmersiveTranslation()
}

let debounceTimer: number | null = null
const observer = new MutationObserver(() => {
  scanDOMMedia()
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    runBlockerCycle()
  }, 250)
})

observer.observe(document.documentElement, { childList: true, subtree: true })

// Runtime message listener for content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'EXTRACT_PAGE_CONTENT') {
    const content = extractReadablePageText()
    sendResponse({
      title: document.title,
      url: window.location.href,
      content
    })
    return true
  }

  if (request.type === 'MANUAL_CLEAN_PAGE_OVERLAYS') {
    cleanClickjackingTraps()
    cleanInPageModals()
    document.body.style.setProperty('overflow', 'auto', 'important')
    document.documentElement.style.setProperty('overflow', 'auto', 'important')
    sendResponse({ success: true })
    return true
  }

  if (request.type === 'TOGGLE_PAGE_BILINGUAL') {
    togglePageBilingualTranslation()
    sendResponse({ success: true })
    return true
  }
})
