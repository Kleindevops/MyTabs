<template>
  <div class="flex flex-col w-[440px] h-[560px] bg-slate-950 text-slate-100 font-sans select-none overflow-hidden relative">
    <!-- Floating Toast Notification -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-95"
    >
      <div
        v-if="toastMessage"
        class="absolute top-14 left-3 right-3 z-50 px-3 py-2 rounded-xl bg-slate-900/95 border border-purple-500/40 shadow-2xl backdrop-blur-md flex items-center justify-between text-xs animate-in"
      >
        <div class="flex items-center space-x-2 text-purple-200 min-w-0">
          <Sparkles class="w-4 h-4 text-amber-400 shrink-0" />
          <span class="text-[11px] leading-snug font-medium break-all">{{ toastMessage }}</span>
        </div>
        <button
          @click="toastMessage = null"
          class="text-slate-400 hover:text-white ml-2 text-xs p-0.5 rounded transition-colors shrink-0"
          title="关闭提示"
        >
          ✕
        </button>
      </div>
    </transition>
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md shrink-0">
      <div class="flex items-center space-x-2">
        <div class="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/25">
          <Radio class="w-4 h-4 text-white animate-pulse" />
        </div>
        <div>
          <h1 class="text-sm font-semibold text-white tracking-wide flex items-center gap-1.5">
            <span>资源嗅探器</span>
            <span class="text-[11px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
              {{ displayedResources.length }}
            </span>
          </h1>
        </div>
      </div>

      <div class="flex items-center space-x-1.5 text-xs">
        <!-- Sort Toggle Button -->
        <button
          @click="toggleSort"
          :title="sortBy === 'size' ? '当前：按文件体积降序' : '当前：按捕获时间排序'"
          class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1 text-[11px]"
        >
          <ArrowUpDown class="w-3 h-3 text-blue-400" />
          <span>{{ sortBy === 'size' ? '体积降序' : '最新时间' }}</span>
        </button>

        <!-- Clear resources -->
        <button
          @click="clearResources"
          title="清空当前嗅探列表"
          class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Filter Bar -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/50 text-xs shrink-0">
      <div class="flex items-center space-x-1">
        <button
          v-for="filter in filters"
          :key="filter.type"
          @click="currentFilter = filter.type"
          :class="[
            'px-2.5 py-1 rounded-lg transition-all font-medium text-xs flex items-center space-x-1',
            currentFilter === filter.type
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          ]"
        >
          <span>{{ filter.label }}</span>
          <span
            v-if="filter.count > 0"
            class="text-[10px] px-1 py-0.2 rounded-full opacity-70"
            :class="currentFilter === filter.type ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-400'"
          >
            {{ filter.count }}
          </span>
        </button>
      </div>

      <!-- Hide Chunks Toggle (when in All Videos filter) -->
      <label
        v-if="currentFilter === 'video'"
        class="flex items-center space-x-1.5 text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer"
        title="过滤掉无意义的2秒切片片段"
      >
        <input
          type="checkbox"
          v-model="hideChunksInVideos"
          class="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
        />
        <span>隐藏碎片切片</span>
      </label>
    </div>

    <!-- Smart Guidance Hint when multiple videos exist -->
    <div
      v-if="currentFilter === 'recommended' && displayedResources.length > 0"
      class="px-4 py-1.5 bg-blue-500/10 border-b border-blue-500/20 text-[11px] text-blue-300 flex items-center justify-between"
    >
      <span class="flex items-center gap-1.5">
        <Sparkles class="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span>已为您智能过滤碎片，按体积推荐真实主视频与完整流</span>
      </span>
      <span class="text-[10px] text-blue-400/80">点击「试看」播放确认</span>
    </div>

    <!-- Resource Cards List -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
      <div
        v-for="(item, idx) in displayedResources"
        :key="item.id"
        :class="[
          'group p-3 rounded-2xl border transition-all duration-200 flex flex-col space-y-2 relative',
          isMainRecommendation(item, idx)
            ? 'bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-slate-900 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
            : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50'
        ]"
      >
        <!-- Top Row: Icon + Filename + Badges + Actions -->
        <div class="flex items-start justify-between space-x-2">
          <div class="flex items-start space-x-2.5 min-w-0 flex-1">
            <!-- Icon -->
            <div
              :class="[
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm',
                item.type === 'm3u8' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : '',
                item.type === 'video' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : '',
                item.type === 'audio' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : '',
                item.type === 'image' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : ''
              ]"
            >
              <Flame v-if="item.type === 'm3u8'" class="w-4 h-4 text-amber-400" />
              <Video v-else-if="item.type === 'video'" class="w-4 h-4" />
              <Music v-else-if="item.type === 'audio'" class="w-4 h-4" />
              <Image v-else class="w-4 h-4" />
            </div>

            <div class="min-w-0 flex-1">
              <!-- Recommended Tag & Title -->
              <div class="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <span
                  v-if="isMainRecommendation(item, idx)"
                  class="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold text-[10px] flex items-center gap-0.5"
                >
                  <Crown class="w-3 h-3 text-amber-400" />
                  <span>推荐主视频</span>
                </span>
                <span
                  v-if="item.type === 'm3u8'"
                  class="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold text-[10px]"
                >
                  HLS 完整源
                </span>
                <span class="text-xs font-semibold text-white truncate max-w-[200px]" :title="item.title || item.filename">
                  {{ item.title || item.filename }}
                </span>
              </div>

              <!-- Format & Size Badge -->
              <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                <span class="uppercase px-1.5 py-0.2 bg-slate-800 rounded font-mono font-bold text-slate-300">
                  {{ item.type === 'm3u8' ? 'M3U8' : getFileExt(item) }}
                </span>
                <span
                  :class="[
                    'font-medium',
                    (item.size || 0) > 10 * 1024 * 1024 ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                  ]"
                >
                  {{ item.sizeFormatted }}
                </span>
                <span v-if="item.isChunk" class="text-[10px] text-slate-500 font-mono">(切片碎片)</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-1 shrink-0">
            <!-- Preview / Play Button -->
            <button
              v-if="item.type === 'video' || item.type === 'audio'"
              @click="togglePreview(item.id)"
              :class="[
                'px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1',
                activePreviewId === item.id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              ]"
              title="内置小窗试看，确认是否为您想找的视频"
            >
              <Play v-if="activePreviewId !== item.id" class="w-3 h-3 text-emerald-400" />
              <Square v-else class="w-3 h-3 fill-current" />
              <span>{{ activePreviewId === item.id ? '收起' : '试看' }}</span>
            </button>

            <!-- Copy URL -->
            <button
              @click="copyUrl(item.url, item.id)"
              :title="copiedId === item.id ? '已复制直链' : '复制下载直链'"
              class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Check v-if="copiedId === item.id" class="w-3.5 h-3.5 text-emerald-400" />
              <Copy v-else class="w-3.5 h-3.5" />
            </button>

            <!-- Download Button -->
            <button
              @click="downloadResource(item)"
              title="下载此资源"
              class="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm shadow-blue-600/30"
            >
              <Download class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Inline Preview Player (Expands right inside the card!) -->
        <div v-if="activePreviewId === item.id" class="pt-2 border-t border-white/10 space-y-2 animate-in fade-in duration-200">
          <video
            v-if="item.type === 'video'"
            :src="item.url"
            controls
            autoplay
            class="w-full max-h-44 rounded-xl bg-black shadow-inner"
            @error="handlePreviewError"
          ></video>
          <audio
            v-else-if="item.type === 'audio'"
            :src="item.url"
            controls
            autoplay
            class="w-full"
          ></audio>

          <div class="flex items-center justify-between text-[10px] text-slate-400">
            <span>试看如无法播放，可尝试新标签页直接打开</span>
            <button
              @click="openInNewTab(item.url)"
              class="text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
            >
              <span>新窗口试看</span>
              <ExternalLink class="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        <!-- M3U8 Toolset (when item is M3U8) -->
        <div v-if="item.type === 'm3u8'" class="pt-2 border-t border-purple-500/20 flex flex-col space-y-2 text-[11px]">
          <div class="flex items-center justify-between">
            <span class="text-purple-300 font-semibold text-[10px] flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5 text-amber-400" />
              <span>HLS 完整切片源 (含 AES 加密)</span>
            </span>
            <span class="text-[9.5px] text-purple-400/80 font-mono">命令行工具</span>
          </div>

          <!-- 3-Column Command Actions -->
          <div class="grid grid-cols-3 gap-1.5">
            <!-- Method 1: Copy Direct Link -->
            <button
              @click="copyUrl(item.url, item.id)"
              class="px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium transition-all shadow-sm flex items-center justify-center space-x-1 active:scale-95"
              title="复制纯净 M3U8 视频直链"
            >
              <Check v-if="copiedId === item.id" class="w-3 h-3 text-emerald-300" />
              <Copy v-else class="w-3 h-3" />
              <span>{{ copiedId === item.id ? '已复制' : '复制直链' }}</span>
            </button>

            <!-- Method 2: Copy FFmpeg Download Command -->
            <button
              @click="copyFFmpegCommand(item.url, item.id)"
              class="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium transition-colors flex items-center justify-center space-x-1 active:scale-95 border border-slate-700/80"
              title="复制 FFmpeg 单行无损合并下载命令"
            >
              <Check v-if="copiedCmdId === item.id" class="w-3 h-3 text-emerald-400" />
              <Terminal v-else class="w-3 h-3 text-emerald-400" />
              <span>{{ copiedCmdId === item.id ? '已复制' : 'FFmpeg 命令' }}</span>
            </button>

            <!-- Method 3: Copy N_m3u8DL-RE Download Command -->
            <button
              @click="copyNm3u8dlCommand(item.url, item.id)"
              class="px-2 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 text-[10px] font-medium transition-all shadow-sm flex items-center justify-center space-x-1 active:scale-95"
              title="复制 N_m3u8DL-RE 下载命令（提示：要在软件目录下执行命令）"
            >
              <Check v-if="copiedNm3u8Id === item.id" class="w-3 h-3 text-emerald-300" />
              <Terminal v-else class="w-3 h-3 text-purple-300" />
              <span>{{ copiedNm3u8Id === item.id ? '已复制' : 'N_m3u8DL-RE' }}</span>
            </button>
          </div>

          <div class="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-200/90 leading-relaxed space-y-1">
            <div class="text-slate-300">
              <code>.m3u8</code> 为流媒体切片索引。可点击「<b>复制直链</b>」使用播放器播放，或点击「<b>FFmpeg</b>」/「<b>N_m3u8DL-RE</b>」复制命令行合并下载为 MP4。
            </div>
            <div class="text-amber-300/95 flex items-center gap-1 font-mono text-[9.5px]">
              <span>💡 提示：要在 <b>N_m3u8DL-RE.exe</b> 软件目录下执行命令。</span>
            </div>
          </div>
        </div>

        <!-- URL Preview Snippet -->
        <div class="text-[10px] text-slate-400 truncate bg-slate-950/70 px-2 py-1 rounded font-mono border border-slate-900/80">
          {{ item.url }}
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="displayedResources.length === 0" class="h-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
        <Radio class="w-10 h-10 text-slate-600 mb-2 stroke-1" />
        <p class="text-xs font-semibold text-slate-300">暂未嗅探到可下载的音视频资源</p>
        <p class="text-[11px] text-slate-500 mt-1 max-w-[280px] leading-relaxed">
          请在网页中点击播放视频或刷新页面，嗅探器将自动捕获并推荐体积最大的完整视频源
        </p>
      </div>
    </div>

    <!-- Footer Shortcuts -->
    <footer class="px-4 py-2.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
      <button
        @click="openSidePanel"
        class="flex items-center space-x-1.5 text-slate-300 hover:text-blue-400 transition-colors"
      >
        <Sparkles class="w-3.5 h-3.5 text-blue-400" />
        <span>打开 AI 侧边栏</span>
      </button>

      <button
        @click="openNewTab"
        class="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>新标签页工作台</span>
        <ExternalLink class="w-3 h-3" />
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Radio, Trash2, Video, Music, Image, Download, Copy, Check, Sparkles,
  ExternalLink, ArrowUpDown, Play, Square, Crown, Flame, Terminal
} from 'lucide-vue-next'
import type { SniffedResource } from '../shared/types'

const resources = ref<SniffedResource[]>([])
const currentFilter = ref<'recommended' | 'video' | 'audio' | 'image' | 'all'>('recommended')
const sortBy = ref<'size' | 'time'>('size')
const hideChunksInVideos = ref(true)
const activePreviewId = ref<string | null>(null)
const copiedId = ref<string | null>(null)
const copiedCmdId = ref<string | null>(null)
const copiedNm3u8Id = ref<string | null>(null)
const toastMessage = ref<string | null>(null)
let toastTimer: any = null
let activeTabId = -1

const filters = computed(() => {
  const allList = resources.value
  const recCount = allList.filter((r) => r.type === 'm3u8' || ((r.type === 'video') && !r.isChunk && (r.size || 0) > 2 * 1024 * 1024)).length
  const videoCount = allList.filter((r) => r.type === 'video' || r.type === 'm3u8').length
  const audioCount = allList.filter((r) => r.type === 'audio').length
  const imageCount = allList.filter((r) => r.type === 'image').length

  return [
    { label: '🌟 精选推荐', type: 'recommended' as const, count: recCount },
    { label: '全部视频', type: 'video' as const, count: videoCount },
    { label: '音频', type: 'audio' as const, count: audioCount },
    { label: '图片', type: 'image' as const, count: imageCount },
    { label: '全部', type: 'all' as const, count: allList.length }
  ]
})

const displayedResources = computed(() => {
  let list = [...resources.value]

  // Filter stage
  if (currentFilter.value === 'recommended') {
    // Show M3U8, non-chunk videos, or videos with substantial size (> 2MB)
    const recs = list.filter((r) => {
      if (r.type === 'm3u8') return true
      if (r.type === 'video' && !r.isChunk) return true
      if (r.type === 'video' && (r.size || 0) >= 2 * 1024 * 1024) return true
      return false
    })
    // If recommended filter matches nothing, fallback to non-chunk or top items
    list = recs.length > 0 ? recs : list.filter(r => r.type === 'video' || r.type === 'm3u8')
  } else if (currentFilter.value === 'video') {
    list = list.filter((r) => {
      if (r.type !== 'video' && r.type !== 'm3u8') return false
      if (hideChunksInVideos.value && r.isChunk && r.type !== 'm3u8') return false
      return true
    })
  } else if (currentFilter.value === 'audio') {
    list = list.filter((r) => r.type === 'audio')
  } else if (currentFilter.value === 'image') {
    list = list.filter((r) => r.type === 'image')
  }

  // Sort stage
  if (sortBy.value === 'size') {
    list.sort((a, b) => {
      // M3U8 master stream always at top
      if (a.type === 'm3u8' && b.type !== 'm3u8') return -1
      if (b.type === 'm3u8' && a.type !== 'm3u8') return 1
      return (b.size || 0) - (a.size || 0)
    })
  } else {
    list.sort((a, b) => b.timestamp - a.timestamp)
  }

  return list
})

onMounted(async () => {
  if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      activeTabId = tab.id
      chrome.runtime.sendMessage({ type: 'GET_SNIFFED_RESOURCES', tabId: activeTabId }, (res) => {
        if (res?.resources) {
          resources.value = res.resources
        }
      })
    }
  }
})

function isMainRecommendation(item: SniffedResource, idx: number): boolean {
  if (displayedResources.value.length === 0) return false
  // Top 1 item in recommended list is always the primary recommendation
  return (currentFilter.value === 'recommended' || currentFilter.value === 'video') && idx === 0 && (item.type === 'video' || item.type === 'm3u8')
}

function getFileExt(item: SniffedResource): string {
  try {
    const clean = item.url.split('?')[0]
    const ext = clean.split('.').pop()
    if (ext && ext.length <= 5) return ext.toUpperCase()
  } catch {}
  return item.type.toUpperCase()
}

function toggleSort() {
  sortBy.value = sortBy.value === 'size' ? 'time' : 'size'
}

function togglePreview(id: string) {
  if (activePreviewId.value === id) {
    activePreviewId.value = null
  } else {
    activePreviewId.value = id
  }
}

function handlePreviewError() {
  console.warn('Video cannot be played directly via blob/CORS, suggest new tab')
}

function unwrapMediaUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    for (const key of ['url', 'src', 'video', 'v', 'link', 'file', 'target']) {
      const val = parsed.searchParams.get(key)
      if (val && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('//'))) {
        const clean = val.startsWith('//') ? `https:${val}` : val
        return decodeURIComponent(clean)
      }
    }
  } catch {}
  return rawUrl
}

function openInNewTab(url: string) {
  window.open(unwrapMediaUrl(url), '_blank')
}

function showToast(msg: string, duration = 3000) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = null
  }, duration)
}

function copyUrl(url: string, id: string) {
  const cleanUrl = unwrapMediaUrl(url)
  navigator.clipboard.writeText(cleanUrl)
  copiedId.value = id
  showToast('已复制 M3U8 直链到剪贴板', 1800)
  setTimeout(() => {
    if (copiedId.value === id) copiedId.value = null
  }, 1800)
}

function copyFFmpegCommand(url: string, id: string) {
  const cleanUrl = unwrapMediaUrl(url)
  const cmd = `ffmpeg -i "${cleanUrl}" -c copy "video.mp4"`
  navigator.clipboard.writeText(cmd)
  copiedCmdId.value = id
  showToast('已复制 FFmpeg 下载命令', 2000)
  setTimeout(() => {
    if (copiedCmdId.value === id) copiedCmdId.value = null
  }, 1800)
}

function copyNm3u8dlCommand(url: string, id: string) {
  const cleanUrl = unwrapMediaUrl(url)
  const cmd = `N_m3u8DL-RE.exe "${cleanUrl}" --auto-select --save-dir "D:\\download" --save-name "outlook.MP4"`
  navigator.clipboard.writeText(cmd)
  copiedNm3u8Id.value = id
  showToast('已复制 N_m3u8DL-RE 命令！（提示：要在软件目录下执行命令）', 3800)
  setTimeout(() => {
    if (copiedNm3u8Id.value === id) copiedNm3u8Id.value = null
  }, 2000)
}

function downloadResource(item: SniffedResource) {
  const cleanUrl = unwrapMediaUrl(item.url)
  let downloadFilename = item.filename
  if (item.title) {
    const ext = item.type === 'm3u8' ? 'm3u8' : getFileExt(item).toLowerCase()
    downloadFilename = `${item.title}.${ext}`
  }

  if (typeof chrome !== 'undefined' && chrome.downloads?.download) {
    chrome.downloads.download({
      url: cleanUrl,
      filename: downloadFilename || undefined,
      saveAs: true
    })
  } else {
    window.open(cleanUrl, '_blank')
  }
}

function clearResources() {
  resources.value = []
  activePreviewId.value = null
  if (activeTabId > 0 && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: 'CLEAR_SNIFFED_RESOURCES', tabId: activeTabId })
  }
}

function openSidePanel() {
  if (activeTabId > 0 && typeof chrome !== 'undefined' && (chrome.sidePanel as any)?.open) {
    (chrome.sidePanel as any).open({ tabId: activeTabId })
    window.close()
  }
}

function openNewTab() {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url: 'chrome://newtab' })
  } else {
    window.open('/newtab.html', '_blank')
  }
}
</script>
