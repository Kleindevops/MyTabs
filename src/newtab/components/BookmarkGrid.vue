<template>
  <div class="w-full max-w-5xl mx-auto px-4 py-2 select-none">
    <!-- Grid -->
    <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-y-5 gap-x-3 md:gap-x-5 justify-items-center">
      <!-- Bookmark Cards -->
      <div
        v-for="(bm, index) in bookmarks"
        :key="bm.id"
        :draggable="true"
        @dragstart="handleDragStart($event, bm, index)"
        @dragend="handleDragEnd"
        @dragover.prevent="handleDragOver($event, bm)"
        @dragleave="handleDragLeave($event, bm)"
        @drop="handleDrop($event, bm)"
        class="group relative flex flex-col items-center cursor-pointer cursor-grab active:cursor-grabbing w-20 transition-transform duration-200 hover:scale-105 active:scale-95"
        :class="[
          draggingBmId === bm.id ? 'opacity-30 scale-90' : '',
          dragOverBmId === bm.id && draggingBmId !== bm.id ? 'scale-110 ring-2 ring-blue-400/80 rounded-2xl bg-blue-500/15 shadow-xl' : ''
        ]"
        @click="openBookmark(bm)"
        @contextmenu.prevent="$emit('contextmenu', $event, bm)"
      >
        <!-- Icon Container (Squircle) -->
        <div
          class="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all duration-300 relative overflow-hidden"
          :class="[
            !bm.bgColor || bm.bgColor === 'transparent'
              ? (isSmallIcon(bm)
                  ? 'bg-white/15 hover:bg-white/25 border border-white/20 shadow-md backdrop-blur-md'
                  : (bm.icon ? 'bg-transparent border border-transparent hover:bg-white/10 hover:border-white/20' : 'bg-white/10 hover:bg-white/20 border border-white/20 shadow-lg')
                )
              : 'border border-white/20 shadow-lg group-hover:shadow-2xl'
          ]"
          :style="bm.bgColor && bm.bgColor !== 'transparent' ? { backgroundColor: bm.bgColor } : {}"
        >
          <!-- Favicon or Initial Character -->
          <img
            v-if="bm.icon"
            :src="bm.icon"
            :alt="bm.title"
            :class="[
              'object-contain transition-transform group-hover:scale-110',
              isSmallIcon(bm)
                ? 'w-7 h-7 sm:w-8 sm:h-8 max-w-[32px] max-h-[32px] drop-shadow-sm'
                : 'w-10 h-10 md:w-12 md:h-12 rounded-xl'
            ]"
            @load="handleIconLoaded(bm.id, $event)"
            @error="bm.icon = undefined"
          />
          <span v-else class="text-xl md:text-2xl font-bold text-white tracking-wider drop-shadow-md">
            {{ bm.title ? bm.title.slice(0, 1).toUpperCase() : 'W' }}
          </span>

          <!-- Incognito tag if private -->
          <span
            v-if="isPrivateBookmark(bm)"
            title="以无痕模式打开 (底层物理零记录，关闭即焚)"
            class="absolute bottom-1 right-1 px-1 py-0.2 bg-purple-900/90 border border-purple-400/40 rounded text-[8px] text-purple-200 font-mono shadow-sm"
          >
            无痕
          </span>
        </div>

        <!-- Title Underneath (e.g. github) -->
        <span class="mt-2 text-xs font-medium text-white/90 group-hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] text-center truncate w-full px-1">
          {{ bm.title }}
        </span>
      </div>

      <!-- Add Bookmark Button -->
      <div
        @click="$emit('add-bookmark')"
        class="group flex flex-col items-center cursor-pointer w-20 transition-transform duration-200 hover:scale-105 active:scale-95"
        title="添加网站"
      >
        <div class="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/20 transition-all duration-300 shadow-md">
          <Plus class="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
        </div>
        <span class="mt-2 text-xs font-medium text-white/70 group-hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] text-center">
          添加
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import type { BookmarkItem, CategoryItem } from '../../shared/types'
import { isSmallFavicon } from '../../shared/favicon'

const props = defineProps<{
  bookmarks: BookmarkItem[]
  categories?: CategoryItem[]
}>()

const emit = defineEmits<{
  (e: 'add-bookmark'): void
  (e: 'contextmenu', ev: MouseEvent, bm: BookmarkItem): void
  (e: 'drag-start', bm: BookmarkItem): void
  (e: 'drag-end'): void
  (e: 'reorder', payload: { fromId: string; toId: string }): void
}>()

const draggingBmId = ref<string | null>(null)
const dragOverBmId = ref<string | null>(null)
const smallIconMap = ref<Record<string, boolean>>({})

function handleIconLoaded(id: string, ev: Event) {
  const img = ev.target as HTMLImageElement
  if (img && img.naturalWidth > 0 && img.naturalWidth <= 48) {
    smallIconMap.value[id] = true
  }
}

function isSmallIcon(bm: BookmarkItem): boolean {
  if (smallIconMap.value[bm.id]) return true
  return isSmallFavicon(bm.icon)
}

function handleDragStart(e: DragEvent, bm: BookmarkItem, index: number) {
  draggingBmId.value = bm.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({
      bookmarkId: bm.id,
      sourceCategoryId: bm.categoryId,
      index
    }))
    e.dataTransfer.setData('text/plain', bm.id)
  }
  emit('drag-start', bm)
}

function handleDragEnd() {
  draggingBmId.value = null
  dragOverBmId.value = null
  emit('drag-end')
}

function handleDragOver(e: DragEvent, bm: BookmarkItem) {
  if (draggingBmId.value && draggingBmId.value !== bm.id) {
    dragOverBmId.value = bm.id
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }
}

function handleDragLeave(e: DragEvent, bm: BookmarkItem) {
  if (dragOverBmId.value === bm.id) {
    dragOverBmId.value = null
  }
}

function handleDrop(e: DragEvent, targetBm: BookmarkItem) {
  const sourceId = draggingBmId.value
  dragOverBmId.value = null
  draggingBmId.value = null

  if (sourceId && sourceId !== targetBm.id) {
    emit('reorder', { fromId: sourceId, toId: targetBm.id })
  }
}

function isPrivateBookmark(bm: BookmarkItem): boolean {
  if (bm.openInIncognito) return true
  if (bm.categoryId === 'cat-vault') return true
  if (props.categories?.find(c => c.id === bm.categoryId)?.isPrivate) return true
  return false
}

function openBookmark(bm: BookmarkItem) {
  if (!bm?.url) return
  if (isPrivateBookmark(bm)) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'OPEN_INCOGNITO', url: bm.url }, (res) => {
        if (res && res.isAllowed === false) {
          const go = confirm(
            '💡【多标签页合并提示】\n\n检测到您尚未在 Chrome 中开启「在无痕模式下启用」开关。\n\n受 Chrome 浏览器底层安全限制，只有开启该权限后，才允许在【同一个无痕窗口】中合并打开多个标签页。\n\n是否立即前往扩展设置页面开启？'
          )
          if (go && chrome.tabs?.create) {
            chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id })
          }
        }
      })
      return
    }
  }
  window.open(bm.url, '_blank')
}
</script>
