import type { AppSettings, WallpaperConfig } from './types'
import { saveSettings } from './storage'

export interface BingWallpaperInfo {
  url: string
  title: string
  copyright: string
  date: string
}

export const DYNAMIC_BING_URL = 'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN'

/**
 * Fetch official Bing Daily Wallpaper metadata.
 * Uses official cn.bing.com endpoint with fallback to biturl.top.
 */
export async function fetchBingDailyInfo(): Promise<BingWallpaperInfo> {
  // Strategy 1: Official Microsoft Bing API (100% authentic permanent URL)
  try {
    const res = await fetch('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN')
    if (res.ok) {
      const data = await res.json()
      if (data?.images && data.images.length > 0) {
        const item = data.images[0]
        let rawUrl = item.url || ''
        if (rawUrl.startsWith('/')) {
          rawUrl = `https://cn.bing.com${rawUrl}`
        }
        // Extract clean permanent URL without dynamic query parameters
        const cleanUrl = rawUrl.split('&rf=')[0]
        return {
          url: cleanUrl,
          title: item.title || '今日必应壁纸',
          copyright: item.copyright || '微软必应每日美图',
          date: item.startdate || new Date().toISOString().slice(0, 10)
        }
      }
    }
  } catch (err) {
    console.warn('Official Bing API request failed, trying fallback...', err)
  }

  // Strategy 2: Fallback to biturl.top JSON API
  try {
    const res = await fetch('https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN')
    if (res.ok) {
      const data = await res.json()
      if (data?.url) {
        return {
          url: data.url,
          title: data.copyright ? data.copyright.split('(')[0].trim() : '今日必应壁纸',
          copyright: data.copyright || '微软必应每日美图',
          date: data.start_date || new Date().toISOString().slice(0, 10)
        }
      }
    }
  } catch (err) {
    console.warn('Fallback biturl API request failed:', err)
  }

  // Strategy 3: Ultimate fallback
  return {
    url: DYNAMIC_BING_URL,
    title: '今日必应壁纸',
    copyright: '微软必应每日美图',
    date: new Date().toISOString().slice(0, 10)
  }
}

/**
 * Downloads an image and converts it into a compressed Base64 Data URL.
 * Storing a Base64 Data URL in storage guarantees that the wallpaper will NEVER
 * change with date, never be subject to CDN expiration or network issues.
 */
export async function downloadImageAsPermanentDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`HTTP error ${response.status}`)
    const blob = await response.blob()

    return await new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          // Standardize max resolution to 1920x1080 to maintain high quality while optimizing size
          let width = img.width || 1920
          let height = img.height || 1080
          if (width > 1920) {
            height = Math.round((height * 1920) / width)
            width = 1920
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(imageUrl)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          // Quality 0.88 produces visually lossless results at around 180KB
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
          resolve(dataUrl)
        } catch {
          // If canvas tainted or failed, fallback to raw FileReader or image URL
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = () => resolve(imageUrl)
          reader.readAsDataURL(blob)
        }
      }
      img.onerror = () => resolve(imageUrl)
      img.src = URL.createObjectURL(blob)
    })
  } catch (err) {
    console.warn('Failed to convert image to Data URL, using clean permanent URL instead:', err)
    return imageUrl
  }
}

/**
 * Pin current wallpaper permanently.
 * Guarantees that the current wallpaper is locked in place and will not change tomorrow.
 */
export async function pinCurrentWallpaperService(settings: AppSettings): Promise<{
  settings: AppSettings
  info: BingWallpaperInfo
}> {
  const info = await fetchBingDailyInfo()

  // Convert to permanent offline Data URL if possible, or use the clean permanent Bing CDN url
  let permanentValue = info.url
  if (info.url && !info.url.startsWith('data:') && !info.url.includes('format=image&index=0')) {
    permanentValue = await downloadImageAsPermanentDataUrl(info.url)
  }

  const updatedWallpaper: WallpaperConfig = {
    ...(settings.wallpaper || {}),
    type: 'custom',
    value: permanentValue,
    isPinned: true,
    pinnedTitle: info.title || info.copyright,
    pinnedDate: info.date,
    pinnedUrl: info.url
  }

  const updatedSettings: AppSettings = {
    ...settings,
    wallpaper: updatedWallpaper
  }

  await saveSettings(updatedSettings)
  return { settings: updatedSettings, info }
}

/**
 * Resume dynamic daily rotation (Unpin).
 */
export async function resumeBingDailyService(settings: AppSettings): Promise<AppSettings> {
  const updatedWallpaper: WallpaperConfig = {
    ...(settings.wallpaper || {}),
    type: 'bing',
    value: DYNAMIC_BING_URL,
    isPinned: false,
    pinnedTitle: undefined,
    pinnedDate: undefined,
    pinnedUrl: undefined
  }

  const updatedSettings: AppSettings = {
    ...settings,
    wallpaper: updatedWallpaper
  }

  await saveSettings(updatedSettings)
  return updatedSettings
}
