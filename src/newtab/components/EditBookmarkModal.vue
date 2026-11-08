<template>
  <div class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="w-full max-w-md rounded-3xl modal-surface shadow-2xl border border-white/15 flex flex-col max-h-[90vh] overflow-hidden my-auto">
      <!-- 1. Header (Pinned at top) -->
      <div class="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <h3 class="text-sm font-semibold text-white flex items-center space-x-2">
          <span>编辑网站主页信息</span>
        </h3>
        <button
          @click="$emit('cancel')"
          class="text-white/60 hover:text-white hover:bg-white/10 text-xs p-1.5 rounded-lg transition-colors"
          title="关闭"
        >
          ✕
        </button>
      </div>

      <!-- 2. Scrollable Form Body -->
      <form id="edit-bookmark-form" @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-3.5 text-xs">
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
          <label class="block text-slate-300 mb-1 font-medium">网址 URL</label>
          <input
            type="text"
            v-model="url"
            placeholder="https://example.com"
            required
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
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

        <!-- Notes / Remarks Field (Synchronized & Backed up to JSON) -->
        <div>
          <label class="block text-slate-300 mb-1 font-medium flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <span>网址备注 / 备忘</span>
              <span class="text-[10px] text-blue-400/80 font-normal">（自动包含在数据备份中）</span>
            </span>
            <span class="text-[10px] text-emerald-400 font-normal">仅在编辑主页时可见</span>
          </label>
          <textarea
            v-model="notes"
            rows="2"
            placeholder="输入关于此网址的备忘或补充信息（如账号备注、使用提示等）..."
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs resize-none leading-relaxed min-h-[50px]"
          ></textarea>
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
      </form>

      <!-- 3. Fixed Footer (Buttons Always Visible On-Screen!) -->
      <div class="px-5 py-3 sm:px-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-md shrink-0 flex items-center space-x-3">
        <button
          type="button"
          @click="$emit('cancel')"
          class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors text-xs"
        >
          取消
        </button>
        <button
          type="submit"
          form="edit-bookmark-form"
          class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/30 transition-colors text-xs"
        >
          保存修改
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Ban } from 'lucide-vue-next'
import type { CategoryItem, BookmarkItem } from '../../shared/types'

const props = defineProps<{
  bookmark: BookmarkItem
  categories: CategoryItem[]
}>()

const emit = defineEmits<{
  (e: 'save', bm: BookmarkItem): void
  (e: 'cancel'): void
}>()

const title = ref(props.bookmark.title)
const url = ref(props.bookmark.url)
const categoryId = ref(props.bookmark.categoryId)
const bgColor = ref(props.bookmark.bgColor || 'transparent')
const openInIncognito = ref(props.bookmark.openInIncognito || false)
const notes = ref(props.bookmark.notes || '')

const availableCategories = computed(() => {
  const isBookmarkVault = props.bookmark.categoryId === 'cat-vault' || props.bookmark.isPrivate || !!props.categories?.find(c => c.id === props.bookmark.categoryId)?.isPrivate
  if (isBookmarkVault) {
    // In personal space: strictly ONLY show personal space categories
    return props.categories.filter(c => c.isPrivate || c.id === 'cat-vault')
  }
  // In regular space: strictly ONLY show regular categories
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
  '#00AEEC', // Bilibili
  '#0084FF', // Zhihu
  '#2563eb', // Indigo
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#059669', // Emerald
  '#d97706', // Amber
]

function handleSubmit() {
  let targetUrl = url.value.trim()
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`
  }

  const selectedCategory = props.categories.find(c => c.id === categoryId.value)

  emit('save', {
    ...props.bookmark,
    title: title.value.trim(),
    url: targetUrl,
    categoryId: categoryId.value,
    bgColor: bgColor.value,
    isPrivate: selectedCategory?.isPrivate || false,
    openInIncognito: isCurrentCategoryPrivate.value || openInIncognito.value,
    isPinnedToTaskbar: props.bookmark.isPinnedToTaskbar,
    notes: notes.value.trim() ? notes.value.trim() : undefined
  })
}
</script>