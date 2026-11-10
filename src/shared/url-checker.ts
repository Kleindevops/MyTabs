import type { BookmarkItem } from './types'

export interface UrlCheckResult {
  bookmarkId: string
  url: string
  title: string
  status: 'ok' | 'failed'
  statusCode: number
  statusText?: string
  reason?: string
  checkedAt: number
}

/**
 * 极简、轻量、直接获取 HTTP 返回码的核心探测函数
 * 核心机制：
 * 1. 优先使用 HEAD 请求嗅探状态码（绝大部分网站直接返回 Header，0 数据体传输）
 * 2. 对拒斥 HEAD 的站点（405/400），改用带 Range: bytes=0-0 的 GET 请求只读取 1 字节
 * 3. 拿到状态码第一毫秒立即 abort() 掐断连接，绝不下载任何网页和媒体数据，0 GPU 压力
 */
export async function checkSingleUrl(
  url: string,
  timeoutMs = 6000,
  abortSignal?: AbortSignal
): Promise<{
  ok: boolean
  statusCode: number
  statusText?: string
  reason?: string
}> {
  if (abortSignal?.aborted) {
    return { ok: false, statusCode: 0, statusText: '已取消', reason: '已取消检查' }
  }

  let targetUrl = url.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  // 1. 优先以 HEAD 请求快速嗅探 HTTP 状态码
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store'
    })
    clearTimeout(timer)
    controller.abort() // 立即掐断底层 socket 连接

    const code = response.status
    if (code >= 200 && code < 400) {
      return { ok: true, statusCode: code, statusText: `HTTP ${code} 正常` }
    }
    if (code === 401 || code === 403) {
      return { ok: true, statusCode: code, statusText: `HTTP ${code} (需要登录/正常运行)` }
    }
    if (code === 405 || code === 400) {
      // 少数服务器不允许 HEAD 请求（405 Method Not Allowed），回退到轻量 GET
      return await checkWithSimpleGet(targetUrl, timeoutMs, abortSignal)
    }
    if (code === 404) {
      return { ok: false, statusCode: 404, statusText: 'HTTP 404', reason: '页面不存在 (404死链)' }
    }
    if (code === 410) {
      return { ok: false, statusCode: 410, statusText: 'HTTP 410', reason: '链接已永久下线' }
    }
    if (code >= 500) {
      return { ok: false, statusCode: code, statusText: `HTTP ${code}`, reason: `服务器错误 (${code})` }
    }

    return { ok: false, statusCode: code, statusText: `HTTP ${code}`, reason: `异常返回码 HTTP ${code}` }
  } catch (err: any) {
    if (abortSignal?.aborted) {
      return { ok: false, statusCode: 0, statusText: '已取消', reason: '已取消检查' }
    }
    if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return { ok: false, statusCode: 0, statusText: '连接超时', reason: '服务器超时未响应 (5秒)' }
    }

    // 若 HEAD 请求发生网络拦截，进一步用轻量 GET 验证
    return await checkWithSimpleGet(targetUrl, timeoutMs, abortSignal)
  }
}

/**
 * 以轻量 GET 获取状态码（只请求 1 字节 Header，拿到立即中止）
 */
async function checkWithSimpleGet(
  targetUrl: string,
  timeoutMs: number,
  abortSignal?: AbortSignal
): Promise<{
  ok: boolean
  statusCode: number
  statusText?: string
  reason?: string
}> {
  if (abortSignal?.aborted) {
    return { ok: false, statusCode: 0, statusText: '已取消', reason: '已取消检查' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Range': 'bytes=0-0' // 限制只接收第 1 个字节
      }
    })
    clearTimeout(timer)
    controller.abort() // 立即掐断底层 socket

    const code = response.status
    if ((code >= 200 && code < 400) || code === 206) {
      return { ok: true, statusCode: code, statusText: `HTTP ${code} 正常` }
    }
    if (code === 401 || code === 403) {
      return { ok: true, statusCode: code, statusText: `HTTP ${code} (需权限/正常运行)` }
    }
    if (code === 404) {
      return { ok: false, statusCode: 404, statusText: 'HTTP 404', reason: '页面不存在 (404死链)' }
    }
    if (code >= 500) {
      return { ok: false, statusCode: code, statusText: `HTTP ${code}`, reason: `服务器错误 (${code})` }
    }
    return { ok: false, statusCode: code, statusText: `HTTP ${code}`, reason: `异常返回码 HTTP ${code}` }
  } catch (err: any) {
    if (abortSignal?.aborted) {
      return { ok: false, statusCode: 0, statusText: '已取消', reason: '已取消检查' }
    }
    if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return { ok: false, statusCode: 0, statusText: '连接超时', reason: '连接超时 (服务器未响应)' }
    }
    return { ok: false, statusCode: 0, statusText: '无法连接', reason: '无法连接 (域名失效或被拒绝)' }
  }
}

/**
 * 优先委托给后台 Service Worker 执行无头网络请求（GPU 占用 0% 且不受 CORS 拦截）
 */
export async function checkUrlViaBackground(
  url: string,
  timeoutMs = 6000,
  abortSignal?: AbortSignal
): Promise<{ ok: boolean; statusCode: number; statusText?: string; reason?: string }> {
  if (abortSignal?.aborted) {
    return { ok: false, statusCode: 0, statusText: '已取消', reason: '已取消检查' }
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const response = await new Promise<any>((resolve) => {
        let isDone = false
        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true
            resolve({ ok: false, statusCode: 0, statusText: '检测超时', reason: '检测超时 (服务器未响应)' })
          }
        }, timeoutMs + 1000)

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            if (!isDone) {
              isDone = true
              clearTimeout(timer)
              resolve({ ok: false, statusCode: 0, statusText: '已取消', reason: '已取消检查' })
            }
          }, { once: true })
        }

        chrome.runtime.sendMessage(
          { type: 'CHECK_SINGLE_URL', url, timeoutMs },
          (res) => {
            if (!isDone) {
              isDone = true
              clearTimeout(timer)
              if (chrome.runtime.lastError || !res) {
                resolve(null) // trigger local fallback
              } else {
                resolve(res)
              }
            }
          }
        )
      })

      if (response && typeof response.ok === 'boolean') {
        return response
      }
    } catch {
      // fallback to local check
    }
  }

  return await checkSingleUrl(url, timeoutMs, abortSignal)
}

/**
 * 批量检查网址列表（支持并发控制与主动中止）
 */
export async function checkBookmarkList(
  bookmarks: BookmarkItem[],
  concurrency = 2,
  onProgress?: (progress: { checked: number; total: number; latestResult?: UrlCheckResult }) => void,
  abortSignal?: AbortSignal
): Promise<UrlCheckResult[]> {
  const results: UrlCheckResult[] = []
  const total = bookmarks.length
  let checkedCount = 0

  if (total === 0) {
    return results
  }

  let currentIndex = 0

  async function worker() {
    while (currentIndex < bookmarks.length) {
      if (abortSignal?.aborted) break

      const idx = currentIndex++
      const bm = bookmarks[idx]

      let res: { ok: boolean; statusCode: number; statusText?: string; reason?: string }
      try {
        res = await checkUrlViaBackground(bm.url, 6000, abortSignal)
      } catch (e: any) {
        if (abortSignal?.aborted) break
        res = { ok: false, statusCode: 0, statusText: '检测失败', reason: '检测失败: ' + (e?.message || '未知错误') }
      }

      if (abortSignal?.aborted) break

      const itemResult: UrlCheckResult = {
        bookmarkId: bm.id,
        url: bm.url,
        title: bm.title,
        status: res.ok ? 'ok' : 'failed',
        statusCode: res.statusCode || 0,
        statusText: res.statusText,
        reason: res.reason,
        checkedAt: Date.now()
      }

      results.push(itemResult)
      checkedCount++

      if (onProgress) {
        onProgress({
          checked: checkedCount,
          total,
          latestResult: itemResult
        })
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker())
  await Promise.all(workers)

  return results
}
