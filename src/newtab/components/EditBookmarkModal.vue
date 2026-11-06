<template>
  <div class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-3xl modal-surface p-6 shadow-2xl space-y-4 border border-white/15">
      <div class="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 class="text-sm font-semibold text-white flex items-center space-x-2">
          <span>编辑网站主页信息</span>
        </h3>
        <button @click="$emit('cancel')" class="text-white/60 hover:text-white text-xs p-1">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
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

        <!-- Pin to taskbar toggle -->
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div>
            <div class="font-medium text-slate-200 flex items-center gap-1.5">
              <span>固定到底部任务栏 (Dock)</span>
            </div>
            <div class="text-[10px] text-slate-400">在屏幕底栏常驻显示，桌面存满 24 个也不会影响底栏清爽</div>
          </div>
          <input
            type="checkbox"
            v-model="isPinnedToTaskbar"
            class="w-4 h-4 rounded text-blue-500 accent-blue-500 cursor-pointer"
          />
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
            保存修改
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
const isPinnedToTaskbar = ref(props.bookmark.isPinnedToTaskbar || false)

const availableCategories = computed(() => {
  if (props.bookmark.categoryId === 'cat-vault') {
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
    isPinnedToTaskbar: isPinnedToTaskbar.value
  })
}
</script>
