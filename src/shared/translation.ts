/**
 * MyTabs 沉浸式翻译核心服务
 * 基于微软 Edge 官方免费直连通道，免 API Key、免翻墙、国内毫秒级响应
 */

export interface TranslationResultItem {
  original: string
  translated: string
  detectedLang?: string
}

// 内存级 LRU 翻译缓存 (最多保留 2000 条，减少网络往返)
const MAX_CACHE_SIZE = 2000
const translationCache = new Map<string, string>()

function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:::${text.trim()}`
}

function putCache(text: string, targetLang: string, translated: string) {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value
    if (firstKey) translationCache.delete(firstKey)
  }
  translationCache.set(getCacheKey(text, targetLang), translated)
}

function getFromCache(text: string, targetLang: string): string | undefined {
  return translationCache.get(getCacheKey(text, targetLang))
}

/**
 * 判断文本是否绝大多数为目标语言字符（如目标是中文，原文已是中文则跳过）
 */
export function isLikelyAlreadyTargetLang(text: string, targetLang: string): boolean {
  if (!text || text.trim().length === 0) return true
  const clean = text.trim()

  if (targetLang.startsWith('zh')) {
    // 检查中文字符比例
    const chineseChars = clean.match(/[\u4e00-\u9fa5]/g) || []
    return chineseChars.length / clean.length > 0.45
  }

  if (targetLang === 'en') {
    // 检查英文字符比例
    const englishChars = clean.match(/[a-zA-Z]/g) || []
    return englishChars.length / clean.length > 0.6
  }

  return false
}

/**
 * 判断是否属于不需要翻译的代码、纯数字或噪声文本
 */
export function isNoiseOrCodeSnippet(text: string): boolean {
  const clean = text.trim()
  if (clean.length < 2) return true
  // 纯数字或日期时间
  if (/^[\d\s\-_:.,\/+*()#%@!$¥€]+$/.test(clean)) return true
  // 常见代码语法特征
  if (/^(const|let|var|function|import|export|class|return|\/\/|\/\*)/.test(clean)) return true
  return false
}

/**
 * 调用微软 Edge 官方接口翻译单批次文本（最多 30 条）
 */
async function fetchEdgeTranslateBatch(
  texts: string[],
  targetLang: string = 'zh-Hans',
  fromLang?: string
): Promise<string[]> {
  if (texts.length === 0) return []

  const queryParams = new URLSearchParams({
    to: targetLang,
    isEnterpriseClient: 'false'
  })
  if (fromLang) {
    queryParams.set('from', fromLang)
  }

  const endpoint = `https://edge.microsoft.com/translate/translatetext?${queryParams.toString()}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    },
    body: JSON.stringify(texts)
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Edge 翻译服务响应异常 (${response.status}): ${errorText || response.statusText}`)
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Edge 翻译返回格式异常')
  }

  return data.map((item: any, idx: number) => {
    const translated = item?.translations?.[0]?.text
    return typeof translated === 'string' ? translated : texts[idx]
  })
}

/**
 * 批量并发分片翻译（支持上百段长文本，自动切片 + 缓存）
 */
export async function batchTranslateViaEdge(
  texts: string[],
  targetLang: string = 'zh-Hans',
  fromLang?: string
): Promise<TranslationResultItem[]> {
  const results: TranslationResultItem[] = new Array(texts.length)
  const uncachedIndices: number[] = []
  const uncachedTexts: string[] = []

  // 1. 命中缓存排查
  texts.forEach((txt, idx) => {
    const cached = getFromCache(txt, targetLang)
    if (cached !== undefined) {
      results[idx] = { original: txt, translated: cached }
    } else {
      uncachedIndices.push(idx)
      uncachedTexts.push(txt)
    }
  })

  if (uncachedTexts.length === 0) {
    return results
  }

  // 2. 切片并发请求（每批 25 条）
  const CHUNK_SIZE = 25
  const chunks: string[][] = []
  for (let i = 0; i < uncachedTexts.length; i += CHUNK_SIZE) {
    chunks.push(uncachedTexts.slice(i, i + CHUNK_SIZE))
  }

  // 并发分批请求（限制最大并发 4 组）
  const translatedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        return await fetchEdgeTranslateBatch(chunk, targetLang, fromLang)
      } catch (err) {
        console.warn('[MyTabs 翻译] 分批请求失败，降级回退:', err)
        return chunk // 失败时降级返回原文
      }
    })
  )

  // 3. 结果写回并更新缓存
  let cursor = 0
  translatedChunks.forEach((chunkResults) => {
    chunkResults.forEach((translatedText) => {
      const origIdx = uncachedIndices[cursor]
      const originalText = uncachedTexts[cursor]
      results[origIdx] = {
        original: originalText,
        translated: translatedText
      }
      putCache(originalText, targetLang, translatedText)
      cursor++
    })
  })

  return results
}

/**
 * 翻译单个文本或单词
 */
export async function translateSingleText(
  text: string,
  targetLang: string = 'zh-Hans',
  fromLang?: string
): Promise<string> {
  const clean = text.trim()
  if (!clean) return ''
  const cached = getFromCache(clean, targetLang)
  if (cached !== undefined) return cached

  const res = await batchTranslateViaEdge([clean], targetLang, fromLang)
  return res[0]?.translated || clean
}
