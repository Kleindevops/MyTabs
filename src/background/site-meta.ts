/**
 * Site Metadata & High-Resolution Icon Extractor
 * Leverages background service worker's elevated network privileges to fetch real official icons and titles
 */

export interface SiteMetadataResult {
  title?: string
  icon?: string
  icons: string[]
}

export async function fetchSiteMetadata(rawUrl: string): Promise<SiteMetadataResult> {
  const result: SiteMetadataResult = { icons: [] }
  if (!rawUrl || rawUrl.length < 4) return result

  let targetUrl = rawUrl.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`
  }

  try {
    const parsed = new URL(targetUrl)
    const hostname = parsed.hostname.toLowerCase()
    if (!hostname || hostname === 'https' || hostname === 'http') return result

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const resp = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    })
    clearTimeout(timeoutId)

    if (resp.ok) {
      const html = await resp.text()

      // 1. Extract <title>
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      if (titleMatch && titleMatch[1]) {
        let pageTitle = titleMatch[1].replace(/[\r\n\t]/g, ' ').trim()
        // Remove common noisy suffix e.g. "微信读书-正版书籍免费阅读" -> "微信读书"
        pageTitle = pageTitle.split(/[-_|–—·]/)[0].trim()
        if (pageTitle && pageTitle.length > 0 && pageTitle.length <= 40) {
          result.title = pageTitle
        }
      }

      // 2. Extract apple-touch-icon (high-resolution official App icons, e.g. 152x152, 180x180)
      const appleMatches = [...html.matchAll(/<link[^>]+rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)["'][^>]*>/gi)]
      for (const m of appleMatches) {
        const hrefMatch = m[0].match(/href=["']([^"']+)["']/i)
        if (hrefMatch && hrefMatch[1]) {
          try {
            const absolute = new URL(hrefMatch[1], targetUrl).href
            if (!result.icons.includes(absolute)) {
              result.icons.unshift(absolute) // Apple touch icon has highest priority!
            }
          } catch {}
        }
      }

      // 3. Extract standard icon tags
      const iconMatches = [...html.matchAll(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*>/gi)]
      for (const m of iconMatches) {
        const hrefMatch = m[0].match(/href=["']([^"']+)["']/i)
        if (hrefMatch && hrefMatch[1]) {
          try {
            const absolute = new URL(hrefMatch[1], targetUrl).href
            if (!result.icons.includes(absolute)) {
              result.icons.push(absolute)
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    // Network failure or timeout
  }

  // Set the primary icon
  if (result.icons.length > 0) {
    result.icon = result.icons[0]
  }

  return result
}
