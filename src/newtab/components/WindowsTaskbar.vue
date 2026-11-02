<template>
  <footer
    class="fixed bottom-0 left-0 right-0 h-16 z-30 select-none glass-panel border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-3 md:px-6 flex items-center justify-between"
    style="background: rgba(15, 23, 42, 0.75);"
  >
    <!-- Left: Start Menu & Category Switcher (Windows Start style) -->
    <div class="flex items-center space-x-1.5 shrink-0">
      <!-- Windows / Start Logo Button -->
      <button
        @click="showStartMenu = !showStartMenu"
        title="分类导航与开始菜单"
        :class="[
          'p-2 rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5',
          showStartMenu ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/10 hover:bg-white/20 text-white/90'
        ]"
      >
        <LayoutGrid class="w-4 h-4 text-blue-400 group-hover:text-white" />
        <span class="text-xs font-semibold hidden sm:inline">分类</span>
      </button>

      <!-- Category Pills (Quick switch on taskbar) -->
      <div class="hidden md:flex items-center space-x-1 bg-black/20 p-1 rounded-xl border border-white/5">
        <button
          v-for="cat in displayedCategories"
          :key="cat.id"
          @click="$emit('select-category', cat); showStartMenu = false"
          :class="[
            'px-2.5 py-1 rounded-lg text-xs font-medium transition-all truncate max-w-[90px]',
            activeCategoryId === cat.id
              ? 'bg-white/25 text-white shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          ]"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- Start Menu Popup -->
      <div
        v-if="showStartMenu"
        class="absolute left-4 bottom-20 w-56 rounded-2xl glass-panel p-2 shadow-2xl border border-white/15 animate-in fade-in slide-in-from-bottom-2 z-50 space-y-1"
      >
        <div class="px-2.5 py-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
          书签分类目录
        </div>
        <button
          v-for="cat in displayedCategories"
          :key="cat.id"
          @click="$emit('select-category', cat); showStartMenu = false"
          :class="[
            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
            activeCategoryId === cat.id
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
      <div class="flex items-center space-x-1.5 sm:space-x-3 bg-black/25 px-2.5 py-1.5 rounded-2xl border border-white/5">
        <!-- Prev Page Button -->
        <button
          @click="prevPage"
          :disabled="currentPage <= 1"
          title="上一页 (或滑动滚轮)"
          class="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all shrink-0"
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
                  ? (bm.icon ? 'bg-transparent border border-transparent hover:bg-white/15' : 'bg-white/15 border border-white/20 backdrop-blur-md shadow-md')
                  : 'border border-white/20 backdrop-blur-md shadow-md'
              ]"
              :style="bm.bgColor && bm.bgColor !== 'transparent' ? { backgroundColor: bm.bgColor } : { backgroundColor: 'transparent' }"
            >
              <img
                v-if="bm.icon"
                :src="bm.icon"
                :alt="bm.title"
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-contain"
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
            class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all shrink-0 hover:scale-110 active:scale-95"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>

        <!-- Next Page Button -->
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          title="下一页 (或滑动滚轮)"
          class="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-all shrink-0"
        >
          <ChevronRight class="w-4 h-4" />
        </button>

        <!-- Page Indicator Pill (e.g. 1/3) -->
        <span
          v-if="totalPages > 1"
          class="text-[10px] font-mono text-white/50 px-1.5 py-0.5 rounded-md bg-white/5 shrink-0 hidden sm:inline"
        >
          {{ currentPage }} / {{ totalPages }}
        </span>
      </div>
    </div>

    <!-- Right: Windows System Tray (OneDrive, AI, Clock, Settings) -->
    <div class="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
      <!-- OneDrive Sync Pill -->
      <button
        @click="$emit('open-onedrive')"
        :title="settings.oneDrive?.hasDirectory ? 'OneDrive 备份已关联' : '未关联 OneDrive，点击配置'"
        class="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 transition-all flex items-center space-x-1 text-xs"
      >
        <Cloud class="w-3.5 h-3.5" :class="settings.oneDrive?.hasDirectory ? 'text-sky-400' : 'text-slate-400'" />
        <span class="hidden lg:inline text-[11px]">{{ settings.oneDrive?.hasDirectory ? '已同步' : '未备份' }}</span>
      </button>

      <!-- AI Assistant -->
      <button
        @click="$emit('open-sidepanel')"
        title="打开 AI 侧边栏"
        class="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 transition-all flex items-center space-x-1 text-xs"
      >
        <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
        <span class="hidden lg:inline text-[11px]">AI</span>
      </button>

      <!-- Settings -->
      <button
        @click="$emit('open-settings')"
        title="系统设置"
        class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
      >
        <Settings class="w-4 h-4" />
      </button>

      <!-- Windows Tray Clock -->
      <div
        class="hidden sm:flex flex-col items-end justify-center px-2 py-0.5 text-right font-mono text-white/90 border-l border-white/10 pl-2.5"
      >
        <span class="text-xs font-semibold leading-tight">{{ trayTime }}</span>
        <span class="text-[10px] text-white/50 leading-tight">{{ trayDate }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  LayoutGrid, ChevronLeft, ChevronRight, Plus, X, Check,
  Cloud, Sparkles, Settings
} from 'lucide-vue-next'
import type { CategoryItem, BookmarkItem, AppSettings } from '../../shared/types'

const props = defineProps<{
  categories: CategoryItem[]
  activeCategoryId: string
  bookmarks: BookmarkItem[]
  settings: AppSettings
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
}>()

const showStartMenu = ref(false)
const currentPage = ref(1)
const pageSize = ref(8) // Number of bookmark icons per page on taskbar

// Visible categories on taskbar (exclude private vault category)
const displayedCategories = computed(() => {
  return props.categories.filter((c) => !c.isPrivate && c.id !== 'cat-vault')
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
