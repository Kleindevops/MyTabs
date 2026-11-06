<template>
  <div class="relative flex items-center">
    <!-- Taskbar Search Capsule Button (Windows 11 style) -->
    <button
      ref="searchTriggerBtnRef"
      @click="toggleSearch"
      :title="isOpen ? '关闭搜索面板 (Esc)' : (isInVault ? '搜索个人空间网址 (Ctrl+F)' : '搜索已添加的网址 (Ctrl+F 或 Ctrl+K)')"
      class="group flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-200 border text-xs font-medium"
      :class="[
        isOpen
          ? 'bg-white/25 text-white shadow-md shadow-black/15 backdrop-blur-md ring-1 ring-white/30 border-white/30'
          : 'glass-panel-light hover:bg-white/20 text-white/85 border-white/15 shadow-sm'
      ]"
    >
      <Search class="w-3.5 h-3.5 text-white/80 group-hover:text-white transition-colors shrink-0" />
      <span class="hidden sm:inline text-white/80 group-hover:text-white transition-colors truncate max-w-[90px] md:max-w-[120px]">
        {{ isInVault ? '搜索私密网址...' : '搜索网址...' }}
      </span>
      <kbd class="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/10">
        Ctrl+F
      </kbd>
    </button>

    <!-- Taskbar Search Flyout Panel (Windows 11 Fluent Frosted Glass style) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform translate-y-3 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-3 opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        ref="flyoutRef"
        class="absolute left-0 bottom-14 w-[340px] sm:w-[420px] md:w-[480px] max-h-[530px] rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden z-50 select-none animate-in backdrop-blur-2xl"
        style="background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08);"
      >
        <!-- Panel Header & Search Input Box -->
        <div class="p-3 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div class="relative flex items-center">
            <Search class="w-4 h-4 text-white/60 absolute left-3 pointer-events-none" />
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="isInVault ? '输入私密网址名称或域名，按回车快速定位...' : '输入网址名称或域名，按回车快速定位...'"
              class="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/25 focus:border-white/40 transition-all shadow-inner"
              @keydown.down.prevent="handleKeydownDown"
              @keydown.up.prevent="handleKeydownUp"
              @keydown.enter.prevent="handleKeydownEnter"
              @keydown.esc.prevent="closeSearch"
            />
            <button
              v-if="searchQuery"
              @click="clearQuery"
              title="清空输入"
              class="absolute right-2.5 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Quick Info / Status Bar under Input -->
          <div class="flex items-center justify-between mt-2 px-1 text-[11px] text-white/50">
            <span v-if="searchQuery.trim()">
              找到 <b class="text-white font-mono underline decoration-white/40">{{ filteredBookmarks.length }}</b> 个相关网址
            </span>
            <span v-else class="flex items-center space-x-1.5">
              <Lock v-if="isInVault" class="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                {{ isInVault ? '个人空间共有 ' : '共有 ' }}
                <b class="text-white/80 font-mono">{{ searchableBookmarks.length }}</b> 个添加的网址
              </span>
            </span>

            <span class="flex items-center space-x-1 text-[10px] text-white/40">
              <span>按 <kbd class="px-1 py-0.2 rounded bg-white/10 font-mono text-white/60">↑</kbd><kbd class="px-1 py-0.2 rounded bg-white/10 font-mono text-white/60">↓</kbd> 切换，<kbd class="px-1 py-0.2 rounded bg-white/10 font-mono text-white/60">回车</kbd> 定位</span>
            </span>
          </div>
        </div>

        <!-- Search Results List Area -->
        <div
          ref="listContainerRef"
          class="flex-1 overflow-y-auto p-2 space-y-1 max-h-[380px] custom-scrollbar"
        >
          <!-- Empty State: No results found -->
          <div
            v-if="searchQuery.trim() && filteredBookmarks.length === 0"
            class="py-10 flex flex-col items-center justify-center text-center px-4"
          >
            <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
              <SearchX class="w-6 h-6 text-slate-400" />
            </div>
            <p class="text-xs text-white/80 font-medium">
              未找到名称包含 “<span class="text-white font-bold underline decoration-white/40">{{ searchQuery }}</span>” 的网址
            </p>
            <p class="text-[11px] text-white/40 mt-1">
              {{ isInVault ? '未在个人空间找到匹配网址' : '请检查关键词拼写，或直接点击桌面「+」号添加新网址' }}
            </p>
          </div>

          <!-- Default State: When query is empty, show recent/all bookmarks with a nice hint -->
          <div
            v-else-if="!searchQuery.trim() && filteredBookmarks.length === 0"
            class="py-8 flex flex-col items-center justify-center text-center px-4 text-white/40"
          >
            <Compass class="w-8 h-8 text-white/50 mb-2 animate-pulse" />
            <p class="text-xs text-white/70 font-medium">
              {{ isInVault ? '请输入私密网址名称开始搜索' : '请输入网址名称开始搜索' }}
            </p>
            <p class="text-[11px] text-white/40 mt-1">
              支持快速定位图标位置，自动切换分类并翻页高亮显示
            </p>
          </div>

          <!-- Result Items -->
          <div
            v-for="(bm, index) in filteredBookmarks"
            :key="bm.id"
            :ref="el => setItemRef(el, index)"
            @click="handleLocate(bm)"
            @mouseenter="selectedIndex = index"
            :class="[
              'group relative flex items-center justify-between p-2 rounded-xl transition-all duration-150 cursor-pointer border',
              selectedIndex === index
                ? 'bg-white/20 border-white/30 shadow-md ring-1 ring-white/20 backdrop-blur-md'
                : 'hover:bg-white/10 border-transparent hover:border-white/10'
            ]"
            :title="`点击定位到「${getCategoryName(bm.categoryId)}」分类图标`"
          >
            <!-- Left: Bookmark Icon & Title & Category Pill -->
            <div class="flex items-center space-x-3 overflow-hidden flex-1 min-w-0 pr-2">
              <!-- Squircle Icon -->
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden border border-white/15 shadow-sm"
                :style="bm.bgColor && bm.bgColor !== 'transparent' ? { backgroundColor: bm.bgColor } : { backgroundColor: 'rgba(255, 255, 255, 0.12)' }"
              >
                <img
                  v-if="bm.icon"
                  :src="bm.icon"
                  :alt="bm.title"
                  class="w-5 h-5 object-contain"
                  @error="bm.icon = undefined"
                />
                <span v-else class="text-xs font-bold text-white uppercase font-mono">
                  {{ bm.title ? bm.title.slice(0, 1) : 'W' }}
                </span>
              </div>

              <!-- Title, Subtitle (URL) & Category Tag -->
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <div class="flex items-center space-x-1.5">
                  <span
                    class="text-xs font-semibold text-white truncate"
                    v-html="highlightKeyword(bm.title, searchQuery)"
                  ></span>

                  <!-- Incognito Badge -->
                  <span
                    v-if="bm.openInIncognito || isPrivateCategory(bm.categoryId)"
                    class="px-1 py-0.2 rounded bg-purple-900/80 border border-purple-400/30 text-[9px] text-purple-200 shrink-0"
                  >
                    无痕
                  </span>
                </div>

                <div class="flex items-center space-x-2 mt-0.5 text-[11px] text-white/50">
                  <!-- Category Pill -->
                  <span class="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-white/10 text-white/70 shrink-0">
                    <component :is="getCategoryIcon(bm.categoryId)" class="w-2.5 h-2.5 text-white/70" />
                    <span class="truncate max-w-[80px]">{{ getCategoryName(bm.categoryId) }}</span>
                  </span>

                  <!-- URL Domain -->
                  <span class="truncate text-white/40 font-mono text-[10px]">
                    {{ formatUrl(bm.url) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Action Buttons -->
            <div class="flex items-center space-x-1 shrink-0">
              <!-- Locate Icon Button (Core Feature) -->
              <button
                @click.stop="handleLocate(bm)"
                title="定位到桌面图标"
                class="px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all"
                :class="[
                  selectedIndex === index
                    ? 'bg-white/25 text-white shadow-sm hover:bg-white/35 border border-white/25'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                ]"
              >
                <MapPin class="w-3.5 h-3.5" />
                <span class="hidden sm:inline text-[11px]">定位</span>
              </button>

              <!-- Directly Open Link Button -->
              <button
                @click.stop="handleOpenDirectly(bm)"
                title="在新标签页直接打开"
                class="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/15 transition-colors"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Panel Footer -->
        <div class="px-3 py-2 border-t border-white/10 bg-white/5 flex items-center justify-between text-[11px] text-white/40">
          <div class="flex items-center space-x-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>点击任意结果自动跳转分类与翻页定位</span>
          </div>

          <button
            @click="closeSearch"
            class="text-[10px] text-white/50 hover:text-white hover:underline"
          >
            关闭 (Esc)
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import {
  Search, X, MapPin, ExternalLink, SearchX, Compass,
  Folder, Lock
} from 'lucide-vue-next'
import type { BookmarkItem, CategoryItem } from '../../shared/types'

const props = defineProps<{
  bookmarks: BookmarkItem[]
  categories: CategoryItem[]
  activeCategoryId?: string
  isVaultUnlocked?: boolean
}>()

const emit = defineEmits<{
  (e: 'locate', bm: BookmarkItem): void
  (e: 'open', bm: BookmarkItem): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const flyoutRef = ref<HTMLDivElement | null>(null)
const searchTriggerBtnRef = ref<HTMLButtonElement | null>(null)
const listContainerRef = ref<HTMLDivElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])

function setItemRef(el: any, index: number) {
  if (el) {
    itemRefs.value[index] = el
  }
}

// Whether current view is in 个人空间 / Vault
const isInVault = computed(() => {
  if (props.activeCategoryId === 'cat-vault') return true
  const currentCat = (props.categories || []).find(c => c.id === props.activeCategoryId)
  return !!currentCat?.isPrivate
})

// Filter bookmarks strictly scoped to current context:
// In 个人空间: ONLY show private bookmarks, completely hiding public bookmarks
// In regular space: ONLY show public bookmarks, completely hiding private bookmarks
const searchableBookmarks = computed(() => {
  const privateCatIds = new Set(
    (props.categories || [])
      .filter(c => c.isPrivate || c.id === 'cat-vault')
      .map(c => c.id)
  )

  return (props.bookmarks || []).filter((bm) => {
    const isPrivate = bm.categoryId === 'cat-vault' || bm.isPrivate === true || privateCatIds.has(bm.categoryId)
    // When inside personal space (Vault), strictly only show private bookmarks!
    if (isInVault.value) {
      return isPrivate
    }
    // When outside personal space, strictly never show private bookmarks
    return !isPrivate
  })
})

// Filter bookmarks matching title or url
const filteredBookmarks = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = searchableBookmarks.value

  if (!q) {
    // When no query is entered, show first 30 bookmarks (or recently added) for quick picking
    return list.slice(0, 25)
  }

  return list
    .filter((bm) => {
      const matchTitle = (bm.title || '').toLowerCase().includes(q)
      const matchUrl = (bm.url || '').toLowerCase().includes(q)
      return matchTitle || matchUrl
    })
    .sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase()
      const bTitle = (b.title || '').toLowerCase()
      const aTitleExact = aTitle === q
      const bTitleExact = bTitle === q
      if (aTitleExact && !bTitleExact) return -1
      if (!aTitleExact && bTitleExact) return 1

      const aTitleStarts = aTitle.startsWith(q)
      const bTitleStarts = bTitle.startsWith(q)
      if (aTitleStarts && !bTitleStarts) return -1
      if (!aTitleStarts && bTitleStarts) return 1

      return 0
    })
})

// Reset selectedIndex when results change
watch(filteredBookmarks, () => {
  selectedIndex.value = 0
  itemRefs.value = []
})

function toggleSearch() {
  if (isOpen.value) {
    closeSearch()
  } else {
    openSearch()
  }
}

function openSearch() {
  isOpen.value = true
  selectedIndex.value = 0
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function closeSearch() {
  isOpen.value = false
  searchQuery.value = ''
  selectedIndex.value = 0
}

function clearQuery() {
  searchQuery.value = ''
  inputRef.value?.focus()
}

function handleLocate(bm: BookmarkItem) {
  emit('locate', bm)
  closeSearch()
}

function handleOpenDirectly(bm: BookmarkItem) {
  emit('open', bm)
  closeSearch()
}

function handleKeydownDown() {
  if (filteredBookmarks.value.length === 0) return
  if (selectedIndex.value < filteredBookmarks.value.length - 1) {
    selectedIndex.value++
    scrollToItem(selectedIndex.value)
  }
}

function handleKeydownUp() {
  if (filteredBookmarks.value.length === 0) return
  if (selectedIndex.value > 0) {
    selectedIndex.value--
    scrollToItem(selectedIndex.value)
  }
}

function handleKeydownEnter() {
  if (filteredBookmarks.value.length > 0 && selectedIndex.value >= 0 && selectedIndex.value < filteredBookmarks.value.length) {
    const selected = filteredBookmarks.value[selectedIndex.value]
    handleLocate(selected)
  }
}

function scrollToItem(index: number) {
  nextTick(() => {
    const el = itemRefs.value[index]
    if (el && listContainerRef.value) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

function getCategoryName(catId: string): string {
  const cat = (props.categories || []).find(c => c.id === catId)
  return cat ? cat.name : '未分类'
}

function isPrivateCategory(catId: string): boolean {
  if (catId === 'cat-vault') return true
  const cat = (props.categories || []).find(c => c.id === catId)
  return !!cat?.isPrivate
}

function getCategoryIcon(catId: string) {
  if (isPrivateCategory(catId)) return Lock
  return Folder
}

function formatUrl(url?: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

// Highlight keyword in title safely
function highlightKeyword(text: string, query: string): string {
  if (!query || !query.trim() || !text) return text
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<span class="text-white font-bold bg-white/25 px-1 py-0.5 rounded border border-white/20">$1</span>')
}

// Global click-outside handler to close flyout
function handleDocumentClick(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  if (flyoutRef.value && !flyoutRef.value.contains(target) &&
      searchTriggerBtnRef.value && !searchTriggerBtnRef.value.contains(target)) {
    closeSearch()
  }
}

// Global keyboard shortcuts (Ctrl+F / Ctrl+K to trigger taskbar bookmark search)
function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'k')) {
    // If user is inside an input in settings or other modal, do not intercept
    const active = document.activeElement
    const isInsideOtherInput = active && active !== inputRef.value &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)

    if (isInsideOtherInput) return

    e.preventDefault()
    if (isOpen.value) {
      inputRef.value?.focus()
      inputRef.value?.select()
    } else {
      openSearch()
    }
  } else if (e.key === 'Escape' && isOpen.value) {
    closeSearch()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('keydown', handleGlobalKeydown)
})

defineExpose({
  openSearch,
  closeSearch
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
