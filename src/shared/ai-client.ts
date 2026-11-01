import type { AISettings } from './types'

export const AI_PRESETS: Record<string, { name: string; baseUrl: string; defaultModel: string }> = {
  deepseek: {
    name: 'DeepSeek (深度求索 - 推荐)',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat'
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini'
  },
  moonshot: {
    name: 'Kimi (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k'
  },
  zhipu: {
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash'
  },
  siliconflow: {
    name: '硅基流动 SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct'
  },
  custom: {
    name: '自定义 OpenAI 兼容接口',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini'
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  settings: AISettings,
  onChunk: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  if (!settings.apiKey) {
    throw new Error('请先在设置中填写 AI API Key')
  }

  const baseUrl = settings.baseUrl.replace(/\/+$/, '')
  const endpoint = `${baseUrl}/chat/completions`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey.trim()}`
    },
    body: JSON.stringify({
      model: settings.model || 'deepseek-chat',
      messages,
      temperature: settings.temperature ?? 0.7,
      stream: true
    }),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMsg = `API 请求失败 (${response.status})`
    try {
      const errObj = JSON.parse(errorText)
      if (errObj.error?.message) {
        errorMsg = errObj.error.message
      }
    } catch {
      errorMsg = errorText || errorMsg
    }
    throw new Error(errorMsg)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('浏览器不支持流式响应读取')
  }

  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith(':')) continue
      if (trimmed === 'data: [DONE]') continue

      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6))
          const delta = json.choices?.[0]?.delta?.content || ''
          if (delta) {
            fullContent += delta
            onChunk(delta)
          }
        } catch {
          // ignore partial json
        }
      }
    }
  }

  return fullContent
}

export async function testAIConnection(settings: AISettings): Promise<{ success: boolean; message: string }> {
  try {
    let result = ''
    await streamChatCompletion(
      [{ role: 'user', content: 'Say "hello" in 1 word.' }],
      settings,
      (delta) => { result += delta }
    )
    return { success: true, message: `连接成功！模型响应: ${result.trim()}` }
  } catch (err: any) {
    return { success: false, message: err.message || '连接失败' }
  }
}
