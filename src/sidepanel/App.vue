<template>
  <div class="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md shrink-0">
      <div class="flex items-center space-x-2">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Sparkles class="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 class="text-sm font-semibold text-white tracking-wide flex items-center gap-1.5">
            MyTabs AI
            <span
              :class="[
                'text-[10px] px-1.5 py-0.2 rounded-full font-medium border',
                aiSettings.apiKey
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30 cursor-pointer'
              ]"
              @click="!aiSettings.apiKey && (showSettings = true)"
            >
              {{ aiSettings.apiKey ? aiSettings.model : '点击配置 API Key' }}
            </span>
          </h1>
        </div>
      </div>

      <div class="flex items-center space-x-1">
        <button
          @click="clearChat"
          title="清空对话"
          class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 class="w-4 h-4" />
        </button>
        <button
          @click="showSettings = true"
          title="AI 模型与 API 设置"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Settings class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <div class="flex items-center space-x-1 px-4 py-2 border-b border-slate-800 bg-slate-900/40 text-xs shrink-0">
      <button
        @click="activeTab = 'chat'"
        :class="[
          'px-3 py-1.5 rounded-lg transition-all font-medium flex items-center space-x-1.5',
          activeTab === 'chat'
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        ]"
      >
        <Bot class="w-3.5 h-3.5" />
        <span>智能问答</span>
      </button>

      <button
        @click="activeTab = 'summary'; triggerPageSummary()"
        :class="[
          'px-3 py-1.5 rounded-lg transition-all font-medium flex items-center space-x-1.5',
          activeTab === 'summary'
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        ]"
      >
        <FileText class="w-3.5 h-3.5" />
        <span>网页速读</span>
      </button>
    </div>

    <!-- API Key Missing Notice Banner -->
    <div
      v-if="!aiSettings.apiKey"
      class="mx-4 mt-3 p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-200 text-xs flex items-center justify-between shrink-0"
    >
      <div class="flex items-center space-x-2">
        <Key class="w-4 h-4 text-blue-400 shrink-0" />
        <span>只需粘贴您的 API Key 即可直接使用 DeepSeek 或任意模型</span>
      </div>
      <button
        @click="showSettings = true"
        class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shrink-0 shadow-sm transition-colors"
      >
        填入 Key
      </button>
    </div>

    <!-- Messages Container -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-for="(msg, idx) in currentMessages"
        :key="idx"
        :class="[
          'flex space-x-2.5 select-text leading-relaxed text-sm',
          msg.role === 'user' ? 'justify-end' : 'justify-start'
        ]"
      >
        <!-- Assistant Avatar -->
        <div
          v-if="msg.role === 'assistant'"
          class="w-6 h-6 rounded-md bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 mt-0.5"
        >
          <Sparkles class="w-3.5 h-3.5" />
        </div>

        <!-- Bubble -->
        <div
          :class="[
            'p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap break-words text-xs shadow-sm',
            msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
          ]"
        >
          {{ msg.content }}

          <!-- Copy Button on Assistant Message -->
          <div v-if="msg.role === 'assistant'" class="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 select-none">
            <span>{{ aiSettings.model }}</span>
            <button
              @click="copyText(msg.content, idx)"
              class="flex items-center space-x-1 hover:text-slate-200 transition-colors"
            >
              <Check v-if="copiedMsgIdx === idx" class="w-3 h-3 text-emerald-400" />
              <Copy v-else class="w-3 h-3" />
              <span>{{ copiedMsgIdx === idx ? '已复制' : '复制' }}</span>
            </button>
          </div>
        </div>

        <!-- User Avatar -->
        <div
          v-if="msg.role === 'user'"
          class="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5"
        >
          <User class="w-3.5 h-3.5" />
        </div>
      </div>

      <!-- Streaming Indicator -->
      <div v-if="isLoading && !currentStreamingContent" class="flex items-center space-x-2 text-slate-400 text-xs py-2">
        <Loader2 class="w-4 h-4 animate-spin text-blue-400" />
        <span>AI 正在思考中...</span>
      </div>
    </div>

    <!-- Quick Prompts (only in chat mode) -->
    <div v-if="activeTab === 'chat' && chatMessages.length <= 1" class="px-4 py-2 flex flex-wrap gap-1.5 shrink-0">
      <button
        v-for="p in quickPrompts"
        :key="p"
        @click="sendPrompt(p)"
        class="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
      >
        {{ p }}
      </button>
    </div>

    <!-- Input Footer -->
    <footer class="p-3 bg-slate-900/90 border-t border-slate-800 shrink-0">
      <div class="flex items-end space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl p-2 focus-within:border-blue-500 transition-colors">
        <textarea
          ref="inputRef"
          v-model="inputContent"
          rows="1"
          placeholder="给 AI 发送消息 (Enter 发送，Shift+Enter 换行)..."
          @keydown.enter.prevent="handleKeyDown"
          class="flex-1 bg-transparent border-0 resize-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none max-h-28 py-1"
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="!inputContent.trim() || isLoading"
          class="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shrink-0 shadow-sm shadow-blue-600/30"
        >
          <Send class="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>

    <!-- Settings Modal Drawer -->
    <div
      v-if="showSettings"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 class="text-sm font-semibold text-white flex items-center gap-2">
            <Settings class="w-4 h-4 text-blue-400" />
            AI 模型配置 (只需输入 API Key)
          </h2>
          <button @click="showSettings = false" class="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- Preset Selector -->
          <div>
            <label class="block text-slate-300 mb-1 font-medium">模型服务商</label>
            <select
              v-model="aiSettings.provider"
              @change="onProviderChange"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option v-for="(val, key) in AI_PRESETS" :key="key" :value="key">
                {{ val.name }}
              </option>
            </select>
          </div>

          <!-- API Key Input -->
          <div>
            <label class="block text-slate-300 mb-1 font-medium">
              API Key (密钥)
              <span class="text-rose-400">*</span>
            </label>
            <input
              type="password"
              v-model="aiSettings.apiKey"
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
            <p class="text-[10px] text-slate-400 mt-1">
              密钥仅安全保存在您的本地浏览器中，绝不上报给任何中间服务器。
            </p>
          </div>

          <!-- Base URL (Customizable) -->
          <div>
            <label class="block text-slate-300 mb-1 font-medium">接口地址 (Base URL)</label>
            <input
              type="text"
              v-model="aiSettings.baseUrl"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Model Name -->
          <div>
            <label class="block text-slate-300 mb-1 font-medium">模型名称 (Model)</label>
            <input
              type="text"
              v-model="aiSettings.model"
              placeholder="deepseek-chat / gpt-4o-mini"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Test Connection Button -->
          <div class="pt-1">
            <button
              @click="testConnection"
              :disabled="isTesting || !aiSettings.apiKey"
              class="w-full py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <RefreshCw v-if="isTesting" class="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>{{ testResult || '测试 API 连接连通性' }}</span>
            </button>
          </div>
        </div>

        <div class="flex items-center space-x-2 pt-2">
          <button
            @click="saveAISettings"
            class="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/30 transition-colors"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Sparkles, Trash2, Settings, Bot, FileText, Send, User, Copy, Check, Loader2, Key, RefreshCw } from 'lucide-vue-next'
import { loadSettings, saveSettings } from '../shared/storage'
import { AI_PRESETS, streamChatCompletion, testAIConnection, type ChatMessage } from '../shared/ai-client'
import type { AISettings } from '../shared/types'

const activeTab = ref<'chat' | 'summary'>('chat')
const showSettings = ref(false)
const isLoading = ref(false)
const isTesting = ref(false)
const testResult = ref('')
const inputContent = ref('')
const copiedMsgIdx = ref<number | null>(null)
const chatContainer = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const currentStreamingContent = ref('')

const quickPrompts = [
  '请用通俗易懂的语言解释',
  '精简提炼核心要点',
  '翻译为地道的中文',
  '编写一段示例代码'
]

const aiSettings = ref<AISettings>({
  provider: 'deepseek',
  apiKey: '',
  baseUrl: AI_PRESETS.deepseek.baseUrl,
  model: AI_PRESETS.deepseek.defaultModel,
  temperature: 0.7
})

const chatMessages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: '你好！我是 MyTabs 智能助手。你可以随时在此与我对话、提问，或点击上方“网页速读”一键总结当前浏览的网页。'
  }
])

const summaryMessages = ref<ChatMessage[]>([])

const currentMessages = computed(() => {
  return activeTab.value === 'chat' ? chatMessages.value : summaryMessages.value
})

onMounted(async () => {
  const settings = await loadSettings()
  if (settings.ai) {
    aiSettings.value = { ...settings.ai }
  }

  // Listen for background right-click context menu triggers
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'SIDEPANEL_TRIGGER_ACTION') {
        handleContextMenuAction(msg)
      }
    })
  }
})

function onProviderChange() {
  const preset = AI_PRESETS[aiSettings.value.provider]
  if (preset) {
    aiSettings.value.baseUrl = preset.baseUrl
    aiSettings.value.model = preset.defaultModel
  }
}

async function saveAISettings() {
  const settings = await loadSettings()
  settings.ai = { ...aiSettings.value }
  await saveSettings(settings)
  showSettings.value = false
}

async function testConnection() {
  isTesting.value = true
  testResult.value = '测试连接中...'
  const res = await testAIConnection(aiSettings.value)
  isTesting.value = false
  testResult.value = res.success ? '✓ 连通成功！' : `✕ ${res.message}`
  setTimeout(() => {
    testResult.value = ''
  }, 4000)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.shiftKey) return
  sendMessage()
}

async function sendMessage() {
  const text = inputContent.value.trim()
  if (!text || isLoading.value) return

  if (!aiSettings.value.apiKey) {
    showSettings.value = true
    return
  }

  inputContent.value = ''
  chatMessages.value.push({ role: 'user', content: text })
  scrollToBottom()

  isLoading.value = true
  currentStreamingContent.value = ''

  // Create empty assistant placeholder
  const assistantMsgIndex = chatMessages.value.length
  chatMessages.value.push({ role: 'assistant', content: '' })

  try {
    await streamChatCompletion(
      chatMessages.value.slice(0, -1),
      aiSettings.value,
      (delta) => {
        currentStreamingContent.value += delta
        chatMessages.value[assistantMsgIndex].content += delta
        scrollToBottom()
      }
    )
  } catch (err: any) {
    chatMessages.value[assistantMsgIndex].content = `⚠️ 请求出错: ${err.message}`
  } finally {
    isLoading.value = false
    currentStreamingContent.value = ''
  }
}

async function triggerPageSummary() {
  if (summaryMessages.value.length > 0) return

  if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
    summaryMessages.value = [{ role: 'assistant', content: '未在扩展运行环境中，无法提取网页正文。' }]
    return
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return

  summaryMessages.value.push({
    role: 'assistant',
    content: `正在提取网页《${tab.title || '当前网页'}》正文并生成速读总结...`
  })

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PAGE_CONTENT' })
    if (!response?.content) {
      summaryMessages.value.push({ role: 'assistant', content: '⚠️ 未能从当前网页中提取到充足的正文文本。' })
      return
    }

    if (!aiSettings.value.apiKey) {
      showSettings.value = true
      return
    }

    isLoading.value = true
    const prompt = `你是一个专业的文章阅读与分析专家。请根据以下提取自《${response.title}》的网页内容，输出一份结构清晰的速读总结：\n\n1. 核心主题与一句话总结\n2. 关键亮点/要点列表 (3-5 条)\n3. 深度结论或启示\n\n--- 网页原文 ---\n${response.content}`

    const summaryIdx = summaryMessages.value.length
    summaryMessages.value.push({ role: 'assistant', content: '' })

    await streamChatCompletion(
      [
        { role: 'system', content: '你是一位高效的网页总结助手。' },
        { role: 'user', content: prompt }
      ],
      aiSettings.value,
      (delta) => {
        summaryMessages.value[summaryIdx].content += delta
        scrollToBottom()
      }
    )
  } catch (err: any) {
    summaryMessages.value.push({ role: 'assistant', content: `总结失败: ${err.message || '请刷新目标页面后再试'}` })
  } finally {
    isLoading.value = false
  }
}

async function handleContextMenuAction(msg: { menuId: string; selectionText: string; pageTitle?: string }) {
  activeTab.value = 'chat'
  let prompt = ''
  if (msg.menuId === 'mytabs_ai_explain') {
    prompt = `请通俗易懂地解释以下内容：\n\n"${msg.selectionText}"`
  } else if (msg.menuId === 'mytabs_ai_translate') {
    prompt = `请将以下文本翻译为通顺地道的中文（如果是中文则翻译为英文）：\n\n"${msg.selectionText}"`
  } else if (msg.menuId === 'mytabs_ai_summary') {
    activeTab.value = 'summary'
    triggerPageSummary()
    return
  }

  if (prompt) {
    sendPrompt(prompt)
  }
}

function sendPrompt(text: string) {
  inputContent.value = text
  sendMessage()
}

function clearChat() {
  if (activeTab.value === 'chat') {
    chatMessages.value = [
      { role: 'assistant', content: '对话已清空。有什么我可以帮你的吗？' }
    ]
  } else {
    summaryMessages.value = []
  }
}

function copyText(text: string, idx: number) {
  navigator.clipboard.writeText(text)
  copiedMsgIdx.value = idx
  setTimeout(() => {
    if (copiedMsgIdx.value === idx) copiedMsgIdx.value = null
  }, 1800)
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}
</script>
