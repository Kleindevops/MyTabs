import type { BookmarkItem } from './types'

export interface UrlCheckResult {
  bookmarkId: string
  url: string
  title: string
  status: 'ok' | 'failed'
  statusCode?: number
  reason?: string
  checkedAt: number
}

/**
 * 真实检测单个网址是否能正常打开
 * 核心优化：
 * 1. 优先以 HEAD 请求嗅探状态码，杜绝数据体（Body）下载
 * 2. 遇到不支持 HEAD 的站点，采用带 Range: bytes=0-0 的超轻量 GET 探测，只接收 1 字节即掐断连接
 * 3. 严格设置 cache: 'no-store'，防止触发浏览器 GPU 纹理与本地缓存分配
 * 4. 收到响应头后立即 controller.abort()，坚决不让浏览器接收多余数据
 */
export async function checkSingleUrl(
  url: string,
  timeoutMs = 6000,
  abortSignal?: AbortSignal
): Promise<{
  ok: boolean
  statusCode?: number
  reason?: string
}> {
  if (abortSignal?.aborted) {
    return { ok: false, reason: '已取消检查' }
  }

  let targetUrl = url.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  // 1. 尝试以轻量 HEAD 请求快速嗅探状态码（零 Body 传输）
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    const response = await fetch(targetUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    clearTimeout(timer)
    controller.abort() // 立即掐断底层 socket 连接

    // 200 ~ 399: 正常存活
    if (response.status >= 200 && response.status < 400) {
      return { ok: true, statusCode: response.status }
    }
    // 401, 403: 网站存活正常运行，仅需要登录或受到权限拦截
    if (response.status === 401 || response.status === 403) {
      return { ok: true, statusCode: response.status }
    }
    // 明确的死链或服务器崩溃
    if (response.status === 404) {
      return { ok: false, statusCode: 404, reason: 'HTTP 404 页面不存在' }
    }
    if (response.status === 410) {
      return { ok: false, statusCode: 410, reason: 'HTTP 410 链接已永久下线' }
    }
    if (response.status >= 500 && response.status <= 504) {
      return { ok: false, statusCode: response.status, reason: `HTTP ${response.status} 服务器不可用` }
    }

    // 针对 405 Method Not Allowed 或 400 等状态，进一步用超轻量 Range GET 验证
    if (response.status === 405 || response.status === 400) {
      return await checkWithGet(targetUrl, timeoutMs, abortSignal)
    }

    return { ok: false, statusCode: response.status, reason: `HTTP ${response.status} 访问异常` }
  } catch (err: any) {
    if (abortSignal?.aborted) {
      return { ok: false, reason: '已取消检查' }
    }
    if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return { ok: false, reason: '连接超时 (服务器未响应)' }
    }

    // 尝试以轻量 GET 重试
    return await checkWithGet(targetUrl, timeoutMs, abortSignal)
  }
}

/**
 * 以超轻量 GET (Range: bytes=0-0) 方式二次确认，杜绝全量网页与流媒体下载
 */
async function checkWithGet(
  targetUrl: string,
  timeoutMs: number,
  abortSignal?: AbortSignal
): Promise<{
  ok: boolean
  statusCode?: number
  reason?: string
}> {
  if (abortSignal?.aborted) {
    return { ok: false, reason: '已取消检查' }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Range': 'bytes=0-0' // 关键优化：只请求 1 个字节验证连通性，防止服务器下发 MB 级网页与媒体流
      }
    })
    clearTimeout(timer)
    controller.abort() // 立即掐断底层 socket 连接

    if ((response.status >= 200 && response.status < 400) || response.status === 206) {
      return { ok: true, statusCode: response.status }
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: true, statusCode: response.status }
    }
    if (response.status === 404) {
      return { ok: false, statusCode: 404, reason: 'HTTP 404 页面不存在' }
    }
    if (response.status >= 500 && response.status <= 504) {
      return { ok: false, statusCode: response.status, reason: `HTTP ${response.status} 服务器不可用` }
    }

    return { ok: false, statusCode: response.status, reason: `HTTP ${response.status} 访问异常` }
  } catch (err: any) {
    if (abortSignal?.aborted) {
      return { ok: false, reason: '已取消检查' }
    }
    if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return { ok: false, reason: '连接超时 (服务器未响应)' }
    }

    // 在特殊网络环境下使用 no-cors 探测 TCP/TLS 是否存活
    return await checkWithNoCors(targetUrl, Math.min(timeoutMs, 4000), abortSignal)
  }
}

/**
 * 最终以 no-cors 探测底层 TCP/TLS 连通性，防止特殊跨域头阻断正常站点
 */
async function checkWithNoCors(
  targetUrl: string,
  timeoutMs: number,
  abortSignal?: AbortSignal
): Promise<{
  ok: boolean
  statusCode?: number
  reason?: string
}> {
  if (abortSignal?.aborted) {
    return { ok: false, reason: '已取消检查' }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    await fetch(targetUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Range': 'bytes=0-0'
      }
    })
    clearTimeout(timer)
    controller.abort() // 立即掐断连接

    // 成功收到 opaque 响应，说明 DNS 与 TCP/TLS 握手均成功，网站可建立连接
    return { ok: true }
  } catch (err: any) {
    if (abortSignal?.aborted) {
      return { ok: false, reason: '已取消检查' }
    }
    if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return { ok: false, reason: '连接超时 (服务器未响应)' }
    }
    return { ok: false, reason: '无法访问此网站 (域名失效或连接被拒绝)' }
  }
}

/**
 * 优先委托给后台 Service Worker 执行无头网络请求（GPU 占用 0% 且不受 CORS 拦截）
 * 若未在扩展环境（如单元测试或本地开发），平滑回退到本地探测
 */
export async function checkUrlViaBackground(
  url: string,
  timeoutMs = 6000,
  abortSignal?: AbortSignal
): Promise<{ ok: boolean; statusCode?: number; reason?: string }> {
  if (abortSignal?.aborted) {
    return { ok: false, reason: '已取消检查' }
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      const response = await new Promise<any>((resolve) => {
        let isDone = false
        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true
            resolve({ ok: false, reason: '检测超时 (服务器未响应)' })
          }
        }, timeoutMs + 1000)

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            if (!isDone) {
              isDone = true
              clearTimeout(timer)
              resolve({ ok: false, reason: '已取消检查' })
            }
          }, { once: true })
        }

        chrome.runtime.sendMessage(
          { type: 'CHECK_SINGLE_URL', url, timeoutMs },
          (res) => {
            if (!isDone) {
              isDone = true
              clearTimeout(timer)
              if (chrome.runtime.lastError) {
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
  concurrency = 2, // 保持并发为 2：平稳流畅，彻底消除网络峰值与渲染压力
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

      let res: { ok: boolean; statusCode?: number; reason?: string }
      try {
        res = await checkUrlViaBackground(bm.url, 6000, abortSignal)
      } catch (e: any) {
        if (abortSignal?.aborted) break
        res = { ok: false, reason: '检测失败: ' + (e?.message || '未知错误') }
      }

      if (abortSignal?.aborted) break

      const itemResult: UrlCheckResult = {
        bookmarkId: bm.id,
        url: bm.url,
        title: bm.title,
        status: res.ok ? 'ok' : 'failed',
        statusCode: res.statusCode,
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
