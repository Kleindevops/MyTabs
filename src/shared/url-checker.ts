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
 * 采用 HEAD -> GET -> no-cors 兜底递进探测机制，确保真实网络请求且不产生误判
 */
export async function checkSingleUrl(url: string, timeoutMs = 7000): Promise<{
  ok: boolean
  statusCode?: number
  reason?: string
}> {
  let targetUrl = url.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  // 1. 尝试以 HEAD 请求快速嗅探状态码
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(targetUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    clearTimeout(timer)

    // 200 ~ 399: 正常
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

    // 针对 405 Method Not Allowed 或其它状态，进一步用 GET 验证
    if (response.status === 405 || response.status === 400) {
      return await checkWithGet(targetUrl, timeoutMs)
    }

    // 其它 4xx 状态码
    return { ok: false, statusCode: response.status, reason: `HTTP ${response.status} 访问异常` }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return { ok: false, reason: '连接超时 (服务器未在限制时间内响应)' }
    }

    // 尝试以 GET 请求重试
    return await checkWithGet(targetUrl, timeoutMs)
  }
}

/**
 * 以 GET 方式二次确认
 */
async function checkWithGet(targetUrl: string, timeoutMs: number): Promise<{
  ok: boolean
  statusCode?: number
  reason?: string
}> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
    clearTimeout(timer)

    if (response.status >= 200 && response.status < 400) {
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
    if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return { ok: false, reason: '连接超时 (服务器未响应)' }
    }

    // 在特殊网络环境下使用 no-cors 探测 TCP/TLS 是否存活
    return await checkWithNoCors(targetUrl, Math.min(timeoutMs, 5000))
  }
}

/**
 * 最终以 no-cors 探测底层 TCP/TLS 连通性，防止特殊跨域头阻断正常站点
 */
async function checkWithNoCors(targetUrl: string, timeoutMs: number): Promise<{
  ok: boolean
  statusCode?: number
  reason?: string
}> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    await fetch(targetUrl, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    })
    clearTimeout(timer)
    // 成功收到 opaque 响应，说明 DNS 与 TCP/TLS 握手均成功，网站可建立连接
    return { ok: true }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
      return { ok: false, reason: '连接超时 (服务器未响应)' }
    }
    return { ok: false, reason: '无法访问此网站 (域名失效或连接被拒绝)' }
  }
}

/**
 * 批量检查网址列表（支持并发控制）
 */
export async function checkBookmarkList(
  bookmarks: BookmarkItem[],
  concurrency = 4,
  onProgress?: (progress: { checked: number; total: number; latestResult?: UrlCheckResult }) => void
): Promise<UrlCheckResult[]> {
  const results: UrlCheckResult[] = []
  const total = bookmarks.length
  let checkedCount = 0

  if (total === 0) {
    return results
  }

  // 队列执行
  let currentIndex = 0

  async function worker() {
    while (currentIndex < bookmarks.length) {
      const idx = currentIndex++
      const bm = bookmarks[idx]

      let res: { ok: boolean; statusCode?: number; reason?: string }
      try {
        res = await checkSingleUrl(bm.url)
      } catch (e: any) {
        res = { ok: false, reason: '检测失败: ' + (e?.message || '未知错误') }
      }

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
