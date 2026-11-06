<template>
  <div class="w-full max-w-5xl mx-auto px-4 py-2 select-none relative group/grid" @wheel="handleWheel">
    <!-- Floating Left Navigation Arrow (shown when on page > 1) -->
    <button
      v-if="totalPages > 1 && currentPage > 1"
      @click="prevPage"
      @dragover.prevent="handleDragOverArrow('prev')"
      @dragleave="handleDragLeaveArrow"
      title="上一页 (可滑动鼠标滚轮 / 按键盘 ← 键)"
      class="absolute -left-2 sm:-left-6 md:-left-10 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/75 hover:bg-slate-800 text-white/70 hover:text-white border border-white/15 hover:border-white/30 backdrop-blur-md shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
    >
      <ChevronLeft class="w-5 h-5" />
    </button>

    <!-- Floating Right Navigation Arrow (shown when not on last page) -->
    <button
      v-if="totalPages > 1 && currentPage < totalPages"
      @click="nextPage"
      @dragover.prevent="handleDragOverArrow('next')"
      @dragleave="handleDragLeaveArrow"
      title="下一页 (可滑动鼠标滚轮 / 按键盘 → 键)"
      class="absolute -right-2 sm:-right-6 md:-right-10 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/75 hover:bg-slate-800 text-white/70 hover:text-white border border-white/15 hover:border-white/30 backdrop-blur-md shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
    >
      <ChevronRight class="w-5 h-5" />
    </button>

    <!-- Grid Container with minimum height to avoid vertical layout jumping -->
    <div class="min-h-[290px] md:min-h-[310px] flex flex-col justify-start">
      <!-- Grid: 8 columns on md/lg to guarantee 3 rows x 8 icons = 24 items per page -->
      <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-5 gap-x-2 sm:gap-x-3 md:gap-x-4 justify-items-center">
        <!-- Bookmark Cards -->
        <div
          v-for="(bm, index) in pagedBookmarks"
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
            class="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all duration-300 relative overflow-hidden pointer-events-none select-none"
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
              draggable="false"
              :class="[
                'object-contain transition-transform group-hover:scale-110 pointer-events-none select-none',
                isSmallIcon(bm)
                  ? 'w-7 h-7 sm:w-8 sm:h-8 max-w-[32px] max-h-[32px] drop-shadow-sm'
                  : 'w-10 h-10 md:w-12 md:h-12 rounded-xl'
              ]"
              @load="handleIconLoaded(bm.id, $event)"
              @error="bm.icon = undefined"
            />
            <span v-else class="text-xl md:text-2xl font-bold text-white tracking-wider drop-shadow-md pointer-events-none select-none">
              {{ bm.title ? bm.title.slice(0, 1).toUpperCase() : 'W' }}
            </span>

            <!-- Incognito tag if private -->
            <span
              v-if="isPrivateBookmark(bm)"
              title="以无痕模式打开 (底层物理零记录，关闭即焚)"
              class="absolute bottom-1 right-1 px-1 py-0.2 bg-purple-900/90 border border-purple-400/40 rounded text-[8px] text-purple-200 font-mono shadow-sm pointer-events-none select-none"
            >
              无痕
            </span>
          </div>

          <!-- Title Underneath (e.g. github) -->
          <span class="mt-2 text-xs font-medium text-white/90 group-hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] text-center truncate w-full px-1 pointer-events-none select-none">
            {{ bm.title }}
          </span>
        </div>

        <!-- Add Bookmark Button (Only placed on the last page) -->
        <div
          v-if="isAddOnThisPage"
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

    <!-- Bottom Pagination Dots & Arrows Pill (Only visible when totalPages > 1) -->
    <div v-if="totalPages > 1" class="flex items-center justify-center space-x-2 mt-2 z-20">
      <div class="flex items-center space-x-1.5 px-3 py-1 rounded-full glass-panel-light border border-white/15 backdrop-blur-md shadow-md">
        <!-- Prev Button -->
        <button
          @click="prevPage"
          :disabled="currentPage <= 1"
          title="上一页"
          class="p-1 rounded-full text-white/60 hover:text-white disabled:opacity-20 disabled:hover:text-white/60 transition-colors"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
        </button>

        <!-- Page Indicator Dots -->
        <div class="flex items-center space-x-1.5 px-1">
          <button
            v-for="p in totalPages"
            :key="p"
            @click="goToPage(p)"
            @dragover.prevent="handleDragOverPage(p)"
            @dragleave="handleDragLeavePage"
            :title="`第 ${p} 页 (可拖拽图标至此处翻页)`"
            :class="[
              'h-2 rounded-full transition-all duration-300 cursor-pointer',
              currentPage === p
                ? 'w-6 bg-blue-500 shadow-sm shadow-blue-500/50'
                : 'w-2 bg-white/30 hover:bg-white/60'
            ]"
          />
        </div>

        <!-- Next Button -->
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          title="下一页"
          class="p-1 rounded-full text-white/60 hover:text-white disabled:opacity-20 disabled:hover:text-white/60 transition-colors"
        >
          <ChevronRight class="w-3.5 h-3.5" />
        </button>

        <!-- Page Text for larger page counts -->
        <span v-if="totalPages > 5" class="text-[10px] font-mono text-white/50 pl-1">
          {{ currentPage }}/{{ totalPages }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { BookmarkItem, CategoryItem } from '../../shared/types'
import { isSmallFavicon } from '../../shared/favicon'

const props = defineProps<{
  bookmarks: BookmarkItem[]
  categories?: CategoryItem[]
  activeCategoryId?: string
}>()

const emit = defineEmits<{
  (e: 'add-bookmark'): void
  (e: 'contextmenu', ev: MouseEvent, bm: BookmarkItem): void
  (e: 'drag-start', bm: BookmarkItem): void
  (e: 'drag-end'): void
  (e: 'reorder', payload: { fromId: string; toId: string }): void
}>()

// 3 rows x 8 icons = 24 items per page
const PAGE_SIZE = 24
const currentPage = ref(1)

const draggingBmId = ref<string | null>(null)
const dragOverBmId = ref<string | null>(null)
const smallIconMap = ref<Record<string, boolean>>({})

// Total pages needed: total slots = bookmarks + 1 ("添加" button)
const totalPages = computed(() => {
  const totalItems = (props.bookmarks || []).length + 1
  return Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
})

// Current page bookmarks
const pagedBookmarks = computed(() => {
  const list = props.bookmarks || []
  const start = (currentPage.value - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
})

// The "添加" button is always placed at the end of the items list on the last page
const isAddOnThisPage = computed(() => {
  return currentPage.value === totalPages.value
})

// Reset to page 1 whenever category changes
watch(() => props.activeCategoryId, () => {
  currentPage.value = 1
})

// Clamp currentPage if bookmarks are deleted
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) {
    currentPage.value = Math.max(1, newTotal)
  }
})

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Mouse wheel page flipping with debounce
let lastWheelTime = 0
function handleWheel(e: WheelEvent) {
  if (totalPages.value <= 1) return
  const now = Date.now()
  if (now - lastWheelTime < 240) return

  const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
  if (delta > 25) {
    if (currentPage.value < totalPages.value) {
      nextPage()
      lastWheelTime = now
    }
  } else if (delta < -25) {
    if (currentPage.value > 1) {
      prevPage()
      lastWheelTime = now
    }
  }
}

// Keyboard arrow key navigation
function handleKeydown(e: KeyboardEvent) {
  if (totalPages.value <= 1) return
  const activeEl = document.activeElement
  const tag = (activeEl?.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || (activeEl as HTMLElement)?.isContentEditable) {
    return
  }

  if (e.key === 'ArrowLeft') {
    prevPage()
  } else if (e.key === 'ArrowRight') {
    nextPage()
  }
}

// Drag over pagination controls to flip pages
let dragPageHoverTimer: any = null
function handleDragOverPage(p: number) {
  if (dragPageHoverTimer) clearTimeout(dragPageHoverTimer)
  dragPageHoverTimer = setTimeout(() => {
    goToPage(p)
  }, 350)
}

function handleDragLeavePage() {
  if (dragPageHoverTimer) {
    clearTimeout(dragPageHoverTimer)
    dragPageHoverTimer = null
  }
}

function handleDragOverArrow(dir: 'prev' | 'next') {
  if (dragPageHoverTimer) clearTimeout(dragPageHoverTimer)
  dragPageHoverTimer = setTimeout(() => {
    if (dir === 'prev') prevPage()
    else nextPage()
  }, 350)
}

function handleDragLeaveArrow() {
  if (dragPageHoverTimer) {
    clearTimeout(dragPageHoverTimer)
    dragPageHoverTimer = null
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (dragPageHoverTimer) clearTimeout(dragPageHoverTimer)
})

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

function handleDragStart(e: DragEvent, bm: BookmarkItem, indexOnPage: number) {
  draggingBmId.value = bm.id
  const globalIndex = (currentPage.value - 1) * PAGE_SIZE + indexOnPage
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({
      bookmarkId: bm.id,
      sourceCategoryId: bm.categoryId,
      index: globalIndex
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
