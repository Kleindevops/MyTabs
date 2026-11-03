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

      const svgIcons: string[] = []
      const appleIcons: string[] = []
      const sizedIcons: { url: string; size: number }[] = []
      const regularIcons: string[] = []

      // 2. Extract SVG icons (sharpest possible vector graphics)
      const svgMatches = [...html.matchAll(/<link[^>]+(?:rel=["'](?:icon|shortcut icon)["'][^>]*type=["']image\/svg\+xml["']|type=["']image\/svg\+xml["'][^>]*rel=["'](?:icon|shortcut icon)["'])[^>]*>/gi)]
      for (const m of svgMatches) {
        const hrefMatch = m[0].match(/href=["']([^"']+)["']/i)
        if (hrefMatch && hrefMatch[1]) {
          try {
            const absolute = new URL(hrefMatch[1], targetUrl).href
            if (!svgIcons.includes(absolute)) svgIcons.push(absolute)
          } catch {}
        }
      }

      // 3. Extract apple-touch-icon (high-resolution official App icons, e.g. 152x152, 180x180, 192x192)
      const appleMatches = [...html.matchAll(/<link[^>]+rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)["'][^>]*>/gi)]
      for (const m of appleMatches) {
        const hrefMatch = m[0].match(/href=["']([^"']+)["']/i)
        if (hrefMatch && hrefMatch[1]) {
          try {
            const absolute = new URL(hrefMatch[1], targetUrl).href
            if (!appleIcons.includes(absolute)) appleIcons.push(absolute)
          } catch {}
        }
      }

      // 4. Extract standard icon tags and parse sizes
      const iconMatches = [...html.matchAll(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*>/gi)]
      for (const m of iconMatches) {
        const hrefMatch = m[0].match(/href=["']([^"']+)["']/i)
        if (hrefMatch && hrefMatch[1]) {
          try {
            const absolute = new URL(hrefMatch[1], targetUrl).href
            if (absolute.endsWith('.svg')) {
              if (!svgIcons.includes(absolute)) svgIcons.push(absolute)
              continue
            }
            const sizeMatch = m[0].match(/sizes=["'](\d+)x\d+["']/i)
            const sizeVal = sizeMatch ? parseInt(sizeMatch[1], 10) : 32
            if (!sizedIcons.some(item => item.url === absolute)) {
              sizedIcons.push({ url: absolute, size: sizeVal })
            }
          } catch {}
        }
      }

      // Sort sized icons descending (512 -> 192 -> 180 -> 128 -> 96 -> 64 -> 32)
      sizedIcons.sort((a, b) => b.size - a.size)

      // Cascading priority: SVG > Apple Touch Icon > High-Res Sized Icons > Standard
      const combined = [
        ...svgIcons,
        ...appleIcons,
        ...sizedIcons.map(s => s.url),
        ...regularIcons
      ]

      result.icons = Array.from(new Set(combined))
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
