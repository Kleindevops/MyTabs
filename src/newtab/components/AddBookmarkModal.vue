<template>
  <div class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-3xl modal-surface p-6 shadow-2xl space-y-4 border border-white/15">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 class="text-sm font-semibold text-white flex items-center space-x-2">
          <span>添加常用网站</span>
        </h3>
        <button @click="$emit('cancel')" class="text-white/60 hover:text-white text-xs p-1">✕</button>
      </div>

      <!-- Live Preview Badge -->
      <div class="flex items-center space-x-4 p-3 rounded-2xl bg-white/5 border border-white/10">
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 transition-all"
          :class="[
            bgColor === 'transparent'
              ? (isSmallFavicon(icon)
                  ? 'bg-white/15 border border-white/20 shadow-md backdrop-blur-md'
                  : (icon ? 'bg-transparent border border-transparent' : 'bg-white/15 border border-white/20 shadow-lg')
                )
              : 'border border-white/20 shadow-lg'
          ]"
          :style="bgColor !== 'transparent' ? { backgroundColor: bgColor } : { backgroundColor: 'transparent' }"
        >
          <img
            v-if="icon"
            :src="icon"
            :alt="title || 'Preview'"
            :class="[
              'object-contain',
              isSmallFavicon(icon) ? 'w-6 h-6 max-w-[24px] max-h-[24px]' : 'w-9 h-9 rounded-lg'
            ]"
            @error="handleIconLoadError"
          />
          <span v-else class="text-xl font-bold text-white tracking-wider drop-shadow-md">
            {{ title ? title.slice(0, 1).toUpperCase() : 'W' }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-white truncate">{{ title || '网站名称预览' }}</div>
          <div class="text-xs text-slate-400 font-mono truncate">{{ url || 'https://example.com' }}</div>
          <div class="text-[10px] text-blue-400 mt-0.5">
            {{ icon ? '已自动获取官方高清图标' : '输入网址自动获取图标' }}
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
        <div>
          <label class="block text-slate-300 mb-1 font-medium">网址 URL</label>
          <div class="relative">
            <input
              type="text"
              v-model="url"
              @input="onUrlInput"
              @blur="onUrlBlur"
              placeholder="https://github.com"
              required
              class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono pr-20"
            />
            <button
              type="button"
              @click="fetchIconFromUrl"
              class="absolute right-1.5 top-1.5 px-2 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/60 text-blue-300 text-[10px] transition-colors"
            >
              获取图标
            </button>
          </div>
        </div>

        <div>
          <label class="block text-slate-300 mb-1 font-medium">网站标题</label>
          <input
            type="text"
            v-model="title"
            placeholder="如: GitHub"
            required
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-slate-300 mb-1 font-medium">所属分类</label>
          <select
            v-model="categoryId"
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option v-for="c in availableCategories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <!-- Custom Icon URL / Upload Toggle -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-slate-300 font-medium">网站图标 (Icon)</label>
            <label class="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
              <span>本地上传图片</span>
              <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
            </label>
          </div>
          <input
            type="text"
            v-model="icon"
            placeholder="图标图片链接 (或自动抓取)"
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
          />
        </div>

        <!-- Color Accent Picker -->
        <div>
          <label class="block text-slate-300 mb-1.5 font-medium">图标底色</label>
          <div class="flex items-center space-x-2">
            <button
              type="button"
              v-for="color in colors"
              :key="color"
              @click="bgColor = color"
              :style="color === 'transparent' ? {} : { backgroundColor: color }"
              :class="[
                'w-6 h-6 rounded-full transition-transform flex items-center justify-center',
                color === 'transparent' ? 'border border-dashed border-white/60 bg-white/15' : '',
                bgColor === color ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
              ]"
              :title="color === 'transparent' ? '透明底色 (默认)' : color"
            >
              <Ban v-if="color === 'transparent'" class="w-3.5 h-3.5 text-white/90" />
            </button>
            <input
              type="color"
              v-model="colorPickerValue"
              title="自定义底色"
              class="w-6 h-6 rounded-full overflow-hidden border-0 cursor-pointer bg-transparent"
            />
          </div>
        </div>

        <!-- Open in Incognito toggle -->
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div>
            <div class="font-medium text-slate-200 flex items-center gap-1.5">
              <span>无痕隐私模式打开</span>
              <span v-if="isCurrentCategoryPrivate" class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-normal">个人空间强制生效</span>
            </div>
            <div class="text-[10px] text-slate-400">点击卡片时直接在无痕窗口打开，底层物理零记录，关闭即焚</div>
          </div>
          <input
            type="checkbox"
            v-model="openInIncognito"
            :disabled="isCurrentCategoryPrivate"
            class="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer disabled:opacity-60"
          />
        </div>

        <div class="flex items-center space-x-2 pt-3 border-t border-white/10">
          <button
            type="button"
            @click="$emit('cancel')"
            class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/30 transition-colors"
          >
            保存添加
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Ban } from 'lucide-vue-next'
import type { CategoryItem, BookmarkItem } from '../../shared/types'
import {
  extractHostname,
  findPresetForDomain,
  getFaviconCandidates,
  guessBrandColor,
  suggestTitleFromUrl,
  isSmallFavicon
} from '../../shared/favicon'

const props = withDefaults(
  defineProps<{
    categories: CategoryItem[]
    defaultCategoryId: string
    defaultPinned?: boolean
  }>(),
  {
    defaultPinned: false
  }
)

const emit = defineEmits<{
  (e: 'save', bm: Omit<BookmarkItem, 'id'>): void
  (e: 'cancel'): void
}>()

const title = ref('')
const url = ref('https://')
const icon = ref('')
const categoryId = ref(props.defaultCategoryId || props.categories[0]?.id || 'cat-common')
const bgColor = ref('transparent')
const openInIncognito = ref(false)

const availableCategories = computed(() => {
  if (props.defaultCategoryId === 'cat-vault') {
    return props.categories
  }
  return props.categories.filter(c => !c.isPrivate && c.id !== 'cat-vault')
})

const colorPickerValue = computed({
  get: () => (bgColor.value && bgColor.value !== 'transparent' ? bgColor.value : '#2563eb'),
  set: (val: string) => {
    bgColor.value = val
  }
})

const isCurrentCategoryPrivate = computed(() => {
  return categoryId.value === 'cat-vault' || props.categories?.find(c => c.id === categoryId.value)?.isPrivate
})

watch(isCurrentCategoryPrivate, (isPrivate) => {
  if (isPrivate) {
    openInIncognito.value = true
  }
}, { immediate: true })

const colors = [
  'transparent', // 透明底色 (默认)
  '#181717', // Dark / GitHub
  '#00AEEC', // Bilibili cyan
  '#0084FF', // Zhihu blue
  '#2563eb', // Indigo
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#059669', // Emerald
  '#d97706', // Amber
]

let typingTimer: any = null

function onUrlInput() {
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    fetchIconFromUrl()
  }, 400)
}

function onUrlBlur() {
  fetchIconFromUrl()
}

function fetchIconFromUrl() {
  const raw = url.value.trim()
  if (!raw || raw === 'https://' || raw === 'http://') return

  const hostname = extractHostname(raw)
  if (!hostname || hostname.length < 3) return

  // Check preset
  const preset = findPresetForDomain(hostname)
  if (preset) {
    icon.value = preset.icon
    if (!title.value.trim() || title.value === '网站' || title.value === 'Https' || title.value === 'Http') {
      title.value = preset.title
    }
    return
  }

  // Fallback to favicon candidate
  const candidates = getFaviconCandidates(raw)
  if (candidates.length > 0) {
    icon.value = candidates[0]
  }
  if (!title.value.trim() || title.value === '网站' || title.value === 'Https' || title.value === 'Http') {
    const suggested = suggestTitleFromUrl(raw)
    if (suggested) title.value = suggested
  }

  // 2. High-precision background metadata fetch (extracts real apple-touch-icon & page <title>!)
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      chrome.runtime.sendMessage({ type: 'FETCH_SITE_METADATA', url: raw }, (res) => {
        if (res && res.success) {
          if (res.title && (!title.value.trim() || title.value === '网站' || title.value === 'Https' || title.value === 'Http')) {
            title.value = res.title
          }
          if (res.icon) {
            icon.value = res.icon
          }
        }
      })
    } catch {}
  }
}

function handleIconLoadError() {
  const candidates = getFaviconCandidates(url.value)
  const currentIdx = candidates.indexOf(icon.value)
  if (currentIdx !== -1 && currentIdx < candidates.length - 1) {
    icon.value = candidates[currentIdx + 1]
  } else {
    const hostname = extractHostname(url.value)
    if (hostname && !icon.value.endsWith('/favicon.ico')) {
      icon.value = `https://${hostname}/favicon.ico`
    }
  }
}

function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      icon.value = reader.result
    }
  }
  reader.readAsDataURL(file)
}

function handleSubmit() {
  let targetUrl = url.value.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`
  }

  const selectedCategory = props.categories.find(c => c.id === categoryId.value)

  emit('save', {
    title: title.value.trim() || suggestTitleFromUrl(targetUrl),
    url: targetUrl,
    icon: icon.value.trim() || undefined,
    categoryId: categoryId.value,
    bgColor: bgColor.value,
    isPrivate: selectedCategory?.isPrivate || false,
    openInIncognito: isCurrentCategoryPrivate.value || openInIncognito.value,
    isPinnedToTaskbar: !!props.defaultPinned
  })
}
</script>
