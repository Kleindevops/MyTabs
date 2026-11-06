<template>
  <footer
    class="fixed bottom-0 left-0 right-0 h-16 z-30 select-none glass-panel-light border-t border-white/20 shadow-[0_-8px_32px_rgba(0,0,0,0.25)] px-3 md:px-6 flex items-center justify-between"
    style="background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);"
  >
    <!-- Left: Start Menu & Category Switcher (Windows Start style) -->
    <div class="flex items-center space-x-1.5 shrink-0">
      <!-- Windows / Start Logo Button -->
      <button
        @click="showStartMenu = !showStartMenu"
        title="分类导航与开始菜单"
        :class="[
          'p-2 rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 border border-white/15',
          showStartMenu
            ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-300/40'
            : 'glass-panel-light hover:bg-white/20 text-white/90 shadow-sm'
        ]"
      >
        <LayoutGrid class="w-4 h-4 text-blue-300 group-hover:text-white" />
        <span class="text-xs font-semibold hidden sm:inline">分类</span>
      </button>

      <!-- Category Pills (Quick switch on taskbar & drag drop targets) -->
      <div
        class="hidden md:flex items-center space-x-1.5 p-1 rounded-2xl transition-all duration-300"
        :class="[
          isDragging
            ? 'bg-slate-900/90 border-2 border-emerald-400/60 shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-400/20 backdrop-blur-xl'
            : 'glass-panel-light border border-white/10 shadow-md backdrop-blur-md'
        ]"
      >
        <button
          v-for="cat in displayedCategories"
          :key="cat.id"
          @click="$emit('select-category', cat); showStartMenu = false"
          @dragover.prevent="onCategoryDragOver($event, cat)"
          @dragenter.prevent="onCategoryDragOver($event, cat)"
          @dragleave="onCategoryDragLeave($event, cat)"
          @drop="onCategoryDrop($event, cat)"
          :class="[
            'relative px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 shrink-0 select-none truncate max-w-[120px]',
            dragOverCatId === cat.id
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-105 shadow-md shadow-emerald-600/30'
              : activeCategoryId === cat.id
                ? 'bg-white/25 text-white shadow-md shadow-black/10 backdrop-blur-md font-semibold'
                : 'text-white/75 hover:text-white hover:bg-white/15'
          ]"
          :title="isDragging ? `释放以将图标移动至「${cat.name}」` : `切换至「${cat.name}」分类`"
        >
          <component :is="getCategoryIcon(cat)" class="w-3.5 h-3.5 opacity-80 shrink-0" />
          <span class="truncate">{{ cat.name }}</span>
        </button>

        <!-- Quick Add Category Button -->
        <button
          v-if="!isDragging"
          @click="$emit('add-category'); showStartMenu = false"
          title="新建分类"
          class="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/15 transition-colors shrink-0"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Start Menu Popup -->
      <div
        v-if="showStartMenu"
        class="absolute left-4 bottom-20 w-56 rounded-2xl p-2 shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-2 z-50 space-y-1 backdrop-blur-2xl"
        style="background: rgba(15, 23, 42, 0.88);"
      >
        <div class="px-2.5 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
          书签分类目录
        </div>
        <button
          v-for="cat in displayedCategories"
          :key="cat.id"
          @click="$emit('select-category', cat); showStartMenu = false"
          @dragover.prevent="onCategoryDragOver($event, cat)"
          @dragenter.prevent="onCategoryDragOver($event, cat)"
          @dragleave="onCategoryDragLeave($event, cat)"
          @drop="onCategoryDrop($event, cat)"
          :class="[
            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
            dragOverCatId === cat.id
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
              : activeCategoryId === cat.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
          ]"
        >
          <span>{{ cat.name }}</span>
          <Check v-if="activeCategoryId === cat.id" class="w-3.5 h-3.5" />
        </button>

        <div class="pt-1 border-t border-white/10">
          <button
            @click="$emit('add-category'); showStartMenu = false"
            class="w-full flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-colors"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>新建分类</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Center: Paged Bookmarks Taskbar Icons (with Prev/Next arrows & Wheel flip) -->
    <div
      class="flex-1 flex items-center justify-center px-2 sm:px-6 overflow-hidden max-w-2xl mx-auto"
      @wheel.prevent="handleWheel"
    >
      <div class="flex items-center space-x-1.5 sm:space-x-3 glass-panel-light px-2.5 py-1.5 rounded-2xl border border-white/15 shadow-md backdrop-blur-md">
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
    <div class="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
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

      <!-- Digital Clock & Date (Windows tray bottom right) -->
      <div
        class="hidden sm:flex flex-col items-end justify-center px-2 py-0.5 rounded-xl text-right cursor-default hover:bg-white/10 transition-colors"
        title="当前时间"
      >
        <span class="text-xs font-semibold tracking-wider font-mono text-white/90 leading-tight">
          {{ trayTime }}
        </span>
        <span class="text-[9px] text-white/60 font-mono leading-tight">
          {{ trayDate }}
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  LayoutGrid, ChevronLeft, ChevronRight, Plus, Check,
  Cloud, Sparkles, Settings, Folder, Lock
} from 'lucide-vue-next'
import type { CategoryItem, BookmarkItem, AppSettings } from '../../shared/types'
import { isSmallFavicon } from '../../shared/favicon'

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
  (e: 'add-bookmark'): void
  (e: 'delete-bookmark', id: string): void
  (e: 'contextmenu', ev: MouseEvent, bm: BookmarkItem): void
  (e: 'open-settings'): void
  (e: 'open-sidepanel'): void
  (e: 'open-onedrive'): void
  (e: 'move-bookmark', payload: { bookmarkId: string; targetCategoryId: string }): void
}>()

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

const trayTime = ref('12:00')
const trayDate = ref('2026/11/01')
let clockTimer: number | null = null

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

onMounted(() => {
  updateTrayClock()
  clockTimer = window.setInterval(updateTrayClock, 1000)
  updatePageSizeByWidth()
  window.addEventListener('resize', updatePageSizeByWidth)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  window.removeEventListener('resize', updatePageSizeByWidth)
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

function updateTrayClock() {
  const now = new Date()
  const h = now.getHours().toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  trayTime.value = `${h}:${m}`
  trayDate.value = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
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
