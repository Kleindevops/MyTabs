<template>
  <div class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-3xl modal-surface p-6 shadow-2xl space-y-4 border border-white/15">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 class="text-sm font-semibold text-white flex items-center space-x-2">
          <span>编辑网站图标</span>
        </h3>
        <button @click="$emit('cancel')" class="text-white/60 hover:text-white text-xs p-1">✕</button>
      </div>

      <!-- Live Preview -->
      <div class="flex flex-col items-center justify-center py-4 bg-white/5 rounded-2xl border border-white/10">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden"
          :class="[
            bgColor === 'transparent'
              ? (icon ? 'bg-transparent border border-transparent' : 'bg-white/15 border border-white/20 backdrop-blur-md shadow-xl')
              : 'border border-white/20 backdrop-blur-md shadow-xl'
          ]"
          :style="bgColor !== 'transparent' ? { backgroundColor: bgColor } : { backgroundColor: 'transparent' }"
        >
          <img
            v-if="icon"
            :src="icon"
            :alt="bookmark.title"
            class="w-11 h-11 rounded-lg object-contain drop-shadow"
            @error="onImageError"
          />
          <span v-else class="text-2xl font-bold text-white tracking-wider drop-shadow-md">
            {{ customText || bookmark.title?.slice(0, 1).toUpperCase() || 'W' }}
          </span>
        </div>
        <span class="mt-2 text-xs font-medium text-white/90">{{ bookmark.title }}</span>
        <span class="text-[10px] text-white/40 font-mono truncate max-w-[260px]">{{ bookmark.url }}</span>
      </div>

      <!-- Tabs / Method selector -->
      <div class="space-y-3.5 text-xs">
        <!-- 1. Auto Favicon Candidates -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-slate-300 font-medium">推荐与抓取的图标</label>
            <button
              type="button"
              @click="reFetchCandidates"
              class="text-[11px] text-blue-400 hover:text-blue-300"
            >
              重新获取
            </button>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <button
              type="button"
              v-for="(cand, idx) in candidates"
              :key="idx"
              @click="icon = cand"
              :class="[
                'p-2 rounded-xl flex items-center justify-center bg-slate-900 border transition-all h-12',
                icon === cand ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-500/10' : 'border-slate-800 hover:border-slate-700'
              ]"
            >
              <img :src="cand" class="w-6 h-6 object-contain" @error="removeCandidate(idx)" />
            </button>

            <!-- Text mode button -->
            <button
              type="button"
              @click="icon = ''"
              :class="[
                'p-2 rounded-xl flex flex-col items-center justify-center bg-slate-900 border transition-all h-12',
                !icon ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-500/10' : 'border-slate-800 hover:border-slate-700'
              ]"
              title="使用首字纯色"
            >
              <span class="text-xs font-bold text-slate-300">首字</span>
            </button>
          </div>
        </div>

        <!-- 2. Custom Image URL or Upload -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-slate-300 font-medium">图片 URL 或 本地上传</label>
            <label class="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
              <span>本地上传图片</span>
              <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
            </label>
          </div>
          <input
            type="text"
            v-model="icon"
            placeholder="粘贴任意图片链接 (https://...)"
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
          />
        </div>

        <!-- 3. Background Color Picker -->
        <div>
          <label class="block text-slate-300 mb-1.5 font-medium">图标底色</label>
          <div class="flex items-center space-x-2">
            <button
              type="button"
              v-for="color in presetColors"
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

        <!-- Actions -->
        <div class="flex items-center space-x-2 pt-3 border-t border-white/10">
          <button
            type="button"
            @click="$emit('cancel')"
            class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSave"
            class="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/30 transition-colors"
          >
            保存图标
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Ban } from 'lucide-vue-next'
import type { BookmarkItem } from '../../shared/types'
import {
  extractHostname,
  findPresetForDomain,
  getFaviconCandidates
} from '../../shared/favicon'

const props = defineProps<{
  bookmark: BookmarkItem
}>()

const emit = defineEmits<{
  (e: 'save', payload: { id: string; icon?: string; bgColor?: string }): void
  (e: 'cancel'): void
}>()

const icon = ref(props.bookmark.icon || '')
const bgColor = ref(props.bookmark.bgColor || 'transparent')
const customText = ref('')
const candidates = ref<string[]>([])

const colorPickerValue = computed({
  get: () => (bgColor.value && bgColor.value !== 'transparent' ? bgColor.value : '#2563eb'),
  set: (val: string) => {
    bgColor.value = val
  }
})

const presetColors = [
  'transparent', // 透明 (默认)
  '#181717', // Dark / GitHub
  '#00AEEC', // Bilibili
  '#0084FF', // Zhihu
  '#2563eb', // Indigo
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#059669', // Emerald
  '#d97706', // Amber
]

onMounted(() => {
  reFetchCandidates()
})

function reFetchCandidates() {
  const url = props.bookmark.url
  if (!url) return

  const list: string[] = []
  const hostname = extractHostname(url)
  const preset = findPresetForDomain(hostname)
  if (preset) {
    list.push(preset.icon)
  }

  const generated = getFaviconCandidates(url)
  for (const c of generated) {
    if (!list.includes(c)) {
      list.push(c)
    }
  }

  candidates.value = list
  if (!icon.value && list.length > 0) {
    icon.value = list[0]
  }

  // Fetch real online icons from webpage source via background
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    try {
      chrome.runtime.sendMessage({ type: 'FETCH_SITE_METADATA', url }, (res) => {
        if (res && res.success && Array.isArray(res.icons)) {
          for (const realIcon of res.icons) {
            if (!candidates.value.includes(realIcon)) {
              candidates.value.unshift(realIcon)
            }
          }
        }
      })
    } catch {}
  }
}

function removeCandidate(idx: number) {
  candidates.value.splice(idx, 1)
}

function onImageError() {
  // If the active icon fails to load, remove or fallback
  if (candidates.value.length > 1) {
    candidates.value = candidates.value.filter(c => c !== icon.value)
    if (candidates.value.length > 0) {
      icon.value = candidates.value[0]
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
      candidates.value.unshift(reader.result)
    }
  }
  reader.readAsDataURL(file)
}

function handleSave() {
  emit('save', {
    id: props.bookmark.id,
    icon: icon.value.trim() || undefined,
    bgColor: bgColor.value
  })
}
</script>
