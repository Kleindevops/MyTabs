<template>
  <footer
    class="fixed bottom-0 left-0 right-0 h-16 z-30 select-none glass-panel-light border-t border-white/20 shadow-[0_-8px_32px_rgba(0,0,0,0.25)] px-3 md:px-6 flex items-center justify-between"
    style="background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);"
  >
    <!-- Left: Start Menu & Category Switcher (Windows Start style) -->
    <div class="flex items-center space-x-1.5 shrink-0 z-20">
      <!-- Windows / Start Logo Button -->
      <button
        @click.stop="showStartMenu = !showStartMenu"
        @dragover.prevent="showStartMenu = true"
        title="分类导航与开始菜单"
        :class="[
          'start-menu-button p-2 rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 border border-white/15',
          showStartMenu
            ? 'bg-white/25 text-white shadow-md shadow-black/10 backdrop-blur-md ring-1 ring-white/30'
            : 'glass-panel-light hover:bg-white/20 text-white/90 shadow-sm'
        ]"
      >
        <LayoutGrid class="w-4 h-4 text-white/90 group-hover:text-white" />
        <span class="text-xs font-semibold hidden sm:inline">分类</span>
      </button>

      <!-- Taskbar Bookmark Search (Windows 11 style) -->
      <TaskbarBookmarkSearch
        :bookmarks="bookmarks"
        :categories="categories"
        :isVaultUnlocked="isVaultUnlocked"
        @locate="onLocateBookmark"
        @open="openBookmark"
      />

      <!-- Start Menu Popup -->
      <div
        v-if="showStartMenu"
        class="start-menu-container absolute left-4 bottom-20 w-60 rounded-2xl p-2 shadow-[0_16px_36px_rgba(0,0,0,0.3)] border border-white/20 animate-in fade-in slide-in-from-bottom-2 z-50 space-y-1 glass-panel-light backdrop-blur-2xl"
        style="background: rgba(255, 255, 255, 0.16); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);"
      >
        <div class="px-2.5 py-1.5 text-[10px] font-semibold text-white/60 uppercase tracking-wider flex items-center justify-between">
          <span>书签分类目录</span>
          <span class="text-[9px] text-white/40 font-normal">指向显示删除</span>
        </div>

        <div
          v-for="cat in displayedCategories"
          :key="cat.id"
          role="button"
          tabindex="0"
          @click="$emit('select-category', cat); showStartMenu = false"
          @dragover.prevent="onCategoryDragOver($event, cat)"
          @dragenter.prevent="onCategoryDragOver($event, cat)"
          @dragleave="onCategoryDragLeave($event, cat)"
          @drop="onCategoryDrop($event, cat)"
          :class="[
            'group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer select-none',
            dragOverCatId === cat.id
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
              : activeCategoryId === cat.id
                ? 'bg-white/25 text-white shadow-sm font-semibold backdrop-blur-md ring-1 ring-white/20'
                : 'text-white/80 hover:text-white hover:bg-white/15'
          ]"
        >
          <div class="flex items-center space-x-2 truncate pr-1">
            <component :is="getCategoryIcon(cat)" class="w-3.5 h-3.5 opacity-80 shrink-0" />
            <span class="truncate">{{ cat.name }}</span>
          </div>

          <div class="flex items-center shrink-0 space-x-1">
            <!-- Delete Category Button (shown on hover, minus icon) -->
            <button
              v-if="cat.id !== 'cat-vault'"
              @click.stop="confirmDeleteCategory(cat)"
              title="删除此分类"
              class="opacity-0 group-hover:opacity-100 p-1 -mr-1 rounded-lg text-white/70 hover:text-red-300 hover:bg-red-500/30 transition-all flex items-center justify-center"
            >
              <Minus class="w-3.5 h-3.5" />
            </button>
            <!-- Checkmark indicator when active (hidden when hovering to leave clean space for delete minus) -->
            <Check
              v-if="activeCategoryId === cat.id"
              class="w-3.5 h-3.5 text-white/90 group-hover:hidden"
            />
          </div>
        </div>

        <div class="pt-1 border-t border-white/15">
          <button
            @click="$emit('add-category'); showStartMenu = false"
            class="w-full flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs text-white/85 hover:text-white hover:bg-white/15 transition-colors"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>新建分类</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Center: Paged Bookmarks Taskbar Icons (with Prev/Next arrows & Wheel flip) - Strictly Horizontally & Vertically Centered -->
    <div
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center max-w-[calc(100vw-280px)] sm:max-w-xl md:max-w-2xl"
    >
      <div
        class="pointer-events-auto flex items-center space-x-1.5 sm:space-x-3 glass-panel-light px-2.5 py-1.5 rounded-2xl border border-white/15 shadow-md backdrop-blur-md"
        @wheel.prevent="handleWheel"
      >
        <!-- Invisible spacer on left to keep icons perfectly centered when totalPages > 1 -->
        <span
          v-if="totalPages > 1"
          class="text-[10px] font-mono invisible px-2 py-0.5 rounded-md border border-transparent shrink-0 hidden sm:inline select-none pointer-events-none"
          aria-hidden="true"
        >
          {{ currentPage }} / {{ totalPages }}
        </span>

        <!-- Prev Page Button -->
        <button
          @click="prevPage"
          :disabled="currentPage <= 1"
          title="上一页 (或滑动滚轮)"
          class="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/15 disabled:opacity-20 disabled:hover:bg-transparent transition-all shrink-0"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <!-- Paged Bookmark Icons -->
        <div class="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
          <div
            v-for="bm in pagedBookmarks"
            :key="bm.id"
            @click="openBookmark(bm)"
            @contextmenu.prevent="$emit('contextmenu', $event, bm)"
            class="group relative flex flex-col items-center cursor-pointer shrink-0 transition-transform duration-200 hover:scale-110 active:scale-95"
            :title="`${bm.title} (右键打开菜单)`"
          >
            <!-- Squircle Icon -->
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center relative overflow-hidden transition-all"
              :class="[
                !bm.bgColor || bm.bgColor === 'transparent'
                  ? (isSmallIcon(bm)
                      ? 'bg-white/15 border border-white/20 backdrop-blur-md shadow-md hover:bg-white/25'
                      : (bm.icon ? 'bg-transparent border border-transparent hover:bg-white/15' : 'bg-white/15 border border-white/20 backdrop-blur-md shadow-md')
                    )
                  : 'border border-white/20 backdrop-blur-md shadow-md'
              ]"
              :style="bm.bgColor && bm.bgColor !== 'transparent' ? { backgroundColor: bm.bgColor } : {}"
            >
              <img
                v-if="bm.icon"
                :src="bm.icon"
                :alt="bm.title"
                :class="[
                  'object-contain transition-transform group-hover:scale-110',
                  isSmallIcon(bm)
                    ? 'w-5 h-5 sm:w-6 sm:h-6 max-w-[24px] max-h-[24px] drop-shadow-sm'
                    : 'w-7 h-7 sm:w-8 sm:h-8 rounded-md'
                ]"
                @load="handleIconLoaded(bm.id, $event)"
                @error="bm.icon = undefined"
              />
              <span v-else class="text-sm font-bold text-white drop-shadow-sm">
                {{ bm.title ? bm.title.slice(0, 1).toUpperCase() : 'W' }}
              </span>
            </div>

            <!-- Active Indicator Underline Dot -->
            <span class="w-1 h-1 rounded-full bg-white/40 group-hover:bg-blue-400 mt-1 transition-colors"></span>
          </div>

          <!-- Add Bookmark Button (shown when on last page or fitting) -->
          <button
            v-if="isAddOnThisPage"
            @click="$emit('add-bookmark')"
            title="添加网站到当前分类"
            class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all shrink-0 hover:scale-110 active:scale-95 shadow-sm"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>

        <!-- Next Page Button -->
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          title="下一页 (或滑动滚轮)"
          class="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/15 disabled:opacity-20 disabled:hover:bg-transparent transition-all shrink-0"
        >
          <ChevronRight class="w-4 h-4" />
        </button>

        <!-- Page Indicator Pill (e.g. 1/3) -->
        <span
          v-if="totalPages > 1"
          class="text-[10px] font-mono text-white/80 px-2 py-0.5 rounded-md bg-white/15 border border-white/10 shadow-sm shrink-0 hidden sm:inline"
        >
          {{ currentPage }} / {{ totalPages }}
        </span>
      </div>
    </div>

    <!-- Right: Windows System Tray (OneDrive, AI, Clock, Settings) -->
    <div class="flex items-center space-x-1.5 sm:space-x-2 shrink-0 z-20">
      <!-- Data Sync / Backup Pill -->
      <button
        @click="$emit('open-onedrive')"
        title="数据备份与同步状态 (点击管理)"
        class="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl glass-panel-light hover:bg-white/20 border border-white/15 text-white/90 transition-all text-xs shadow-sm"
      >
        <Cloud class="w-3.5 h-3.5 text-sky-300" />
        <span class="hidden lg:inline text-[11px] font-medium">数据备份</span>
      </button>

      <!-- AI Copilot Side Panel Toggle -->
      <button
        @click="$emit('open-sidepanel')"
        title="打开 AI 侧边栏助手"
        class="p-2 rounded-xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/50 hover:to-purple-500/50 border border-white/20 text-white transition-all hover:scale-105 active:scale-95 shadow-sm backdrop-blur-md"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-300 transition-transform group-hover:rotate-12" />
      </button>

      <!-- Settings Gear -->
      <button
        @click="$emit('open-settings')"
        title="打开系统设置"
        class="p-2 rounded-xl glass-panel-light hover:bg-white/20 border border-white/15 text-white/90 transition-all hover:scale-105 active:scale-95 shadow-sm"
      >
        <Settings class="w-3.5 h-3.5" />
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  LayoutGrid, ChevronLeft, ChevronRight, Plus, Minus, Check,
  Cloud, Sparkles, Settings, Folder, Lock
} from 'lucide-vue-next'
import type { CategoryItem, BookmarkItem, AppSettings } from '../../shared/types'
import { isSmallFavicon } from '../../shared/favicon'
import TaskbarBookmarkSearch from './TaskbarBookmarkSearch.vue'

const props = defineProps<{
  categories: CategoryItem[]
  activeCategoryId: string
  bookmarks: BookmarkItem[]
  settings: AppSettings
  isDragging?: boolean
  isVaultUnlocked?: boolean
}>()

const emit = defineEmits<{
  (e: 'select-category', cat: CategoryItem): void
  (e: 'add-category'): void
  (e: 'delete-category', cat: CategoryItem): void
  (e: 'add-bookmark'): void
  (e: 'delete-bookmark', id: string): void
  (e: 'contextmenu', ev: MouseEvent, bm: BookmarkItem): void
  (e: 'open-settings'): void
  (e: 'open-sidepanel'): void
  (e: 'open-onedrive'): void
  (e: 'move-bookmark', payload: { bookmarkId: string; targetCategoryId: string }): void
  (e: 'locate-bookmark', bm: BookmarkItem): void
}>()

function onLocateBookmark(bm: BookmarkItem) {
  if (bm.categoryId === props.activeCategoryId) {
    const idx = currentCategoryBookmarks.value.findIndex(b => b.id === bm.id)
    if (idx !== -1) {
      currentPage.value = Math.floor(idx / pageSize.value) + 1
    }
  }
  emit('locate-bookmark', bm)
}

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

function getCategoryIcon(cat: CategoryItem) {
  if (cat.isPrivate || cat.id === 'cat-vault') {
    return Lock
  }
  return Folder
}

const showStartMenu = ref(false)
const currentPage = ref(1)
const pageSize = ref(8) // Number of bookmark icons per page on taskbar
const dragOverCatId = ref<string | null>(null)
let hoverCategoryTimer: any = null

// Visible categories on taskbar (exclude private vault category unless unlocked)
const displayedCategories = computed(() => {
  return (props.categories || []).filter((c) => {
    if (c.isPrivate || c.id === 'cat-vault') {
      return props.isVaultUnlocked === true
    }
    return true
  })
})

// Category bookmarks
const currentCategoryBookmarks = computed(() => {
  return props.bookmarks.filter((b) => b.categoryId === props.activeCategoryId)
})

// Total pages needed
const totalPages = computed(() => {
  const count = currentCategoryBookmarks.value.length + 1 // +1 for the Add button
  return Math.max(1, Math.ceil(count / pageSize.value))
})

// Sliced bookmarks for current page
const pagedBookmarks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return currentCategoryBookmarks.value.slice(start, start + pageSize.value)
})

// Is the "Add" button placed on this current page
const isAddOnThisPage = computed(() => {
  const count = currentCategoryBookmarks.value.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return count >= start && count < end
})

// Reset to page 1 whenever category changes
watch(() => props.activeCategoryId, () => {
  currentPage.value = 1
})

function confirmDeleteCategory(cat: CategoryItem) {
  emit('delete-category', cat)
}

function handleGlobalClick(e: MouseEvent) {
  if (showStartMenu.value) {
    const target = e.target as HTMLElement
    if (!target.closest('.start-menu-container') && !target.closest('.start-menu-button')) {
      showStartMenu.value = false
    }
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showStartMenu.value) {
    showStartMenu.value = false
  }
}

onMounted(() => {
  updatePageSizeByWidth()
  window.addEventListener('resize', updatePageSizeByWidth)
  window.addEventListener('click', handleGlobalClick)
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePageSizeByWidth)
  window.removeEventListener('click', handleGlobalClick)
  window.removeEventListener('keydown', handleGlobalKeydown)
  if (hoverCategoryTimer) clearTimeout(hoverCategoryTimer)
})

function updatePageSizeByWidth() {
  if (window.innerWidth < 640) {
    pageSize.value = 5
  } else if (window.innerWidth < 1024) {
    pageSize.value = 7
  } else {
    pageSize.value = 9
  }
}

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

function handleWheel(e: WheelEvent) {
  if (e.deltaY > 0) {
    nextPage()
  } else if (e.deltaY < 0) {
    prevPage()
  }
}

function onCategoryDragOver(e: DragEvent, cat: CategoryItem) {
  e.preventDefault()
  dragOverCatId.value = cat.id
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  if (!hoverCategoryTimer) {
    hoverCategoryTimer = setTimeout(() => {
      emit('select-category', cat)
    }, 550)
  }
}

function onCategoryDragLeave(e: DragEvent, cat: CategoryItem) {
  if (dragOverCatId.value === cat.id) {
    dragOverCatId.value = null
  }
  if (hoverCategoryTimer) {
    clearTimeout(hoverCategoryTimer)
    hoverCategoryTimer = null
  }
}

function onCategoryDrop(e: DragEvent, cat: CategoryItem) {
  e.preventDefault()
  dragOverCatId.value = null
  if (hoverCategoryTimer) {
    clearTimeout(hoverCategoryTimer)
    hoverCategoryTimer = null
  }
  let bmId: string | null = null;
  try {
    const raw = e.dataTransfer?.getData("application/json");
    if (raw) {
      const data = JSON.parse(raw);
      bmId = data.bookmarkId;
    }
  } catch (err) {
    console.error("Error handling category drop:", err);
  }
  if (!bmId) {
    bmId = e.dataTransfer?.getData("text/plain") || null;
  }
  if (bmId) {
    emit("move-bookmark", { bookmarkId: bmId, targetCategoryId: cat.id });
  }
}

function isPrivateBookmark(bm: BookmarkItem): boolean {
  if (bm.openInIncognito) return true
  if (bm.categoryId === 'cat-vault') return true
  if (props.categories?.find(c => c.id === bm.categoryId)?.isPrivate) return true
  return false
}

function openBookmark(bm: BookmarkItem) {
  if (!bm.url) return
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
