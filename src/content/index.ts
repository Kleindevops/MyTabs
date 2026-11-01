// Content script: DOM Media Detector & Webpage Article Text Extractor

// 1. Detect media elements in the DOM
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

// Initial scan and observer for dynamically inserted video players
scanDOMMedia()
const observer = new MutationObserver(() => {
  scanDOMMedia()
})
observer.observe(document.documentElement, { childList: true, subtree: true })

// 2. Intelligent page text extraction for AI summarization
function extractReadablePageText(): string {
  // Try priority tags: article, main, content
  const mainCandidate = document.querySelector('article') || document.querySelector('main') || document.body
  if (!mainCandidate) return ''

  // Clone to safely remove noise
  const clone = mainCandidate.cloneNode(true) as HTMLElement

  // Remove scripts, styles, forms, nav, headers, footers
  const noiseSelectors = ['script', 'style', 'nav', 'header', 'footer', 'noscript', 'iframe', 'svg', '.ads', '#comments']
  noiseSelectors.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove())
  })

  // Get text content and clean whitespace
  const rawText = clone.innerText || clone.textContent || ''
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .slice(0, 15000) // limit characters for LLM context
}

// Listen for AI summary extraction request
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
})
