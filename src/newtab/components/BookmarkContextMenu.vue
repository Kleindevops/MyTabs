<template>
  <div
    v-if="visible"
    class="fixed z-50 select-none animate-in fade-in zoom-in-95 duration-150"
    :style="menuStyle"
    @click.stop
    @contextmenu.stop.prevent
  >
    <div
      class="w-44 rounded-2xl p-1.5 shadow-2xl border border-white/15 backdrop-blur-2xl text-slate-200"
      style="background: rgba(18, 24, 38, 0.95); box-shadow: 0 10px 35px -5px rgba(0, 0, 0, 0.75);"
    >
      <!-- Item 1: 移动到分类 (Move to Category Submenu) -->
      <div
        class="relative group/submenu"
        @mouseenter="openSubmenu"
        @mouseleave="scheduleCloseSubmenu"
      >
        <button
          @click.stop="toggleSubmenu"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left group"
          :class="[
            showSubmenu ? 'bg-white/15 text-white' : 'hover:bg-white/10 hover:text-white text-slate-200'
          ]"
        >
          <div class="flex items-center space-x-2.5">
            <FolderInput
              class="w-4 h-4 transition-colors"
              :class="showSubmenu ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'"
            />
            <span>移动到分类</span>
          </div>
          <ChevronRight
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="[
              showSubmenu ? 'text-emerald-300 translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
            ]"
          />
        </button>

        <!-- Category Submenu -->
        <div
          v-if="showSubmenu"
          :class="[
            'absolute top-0 w-44 rounded-2xl p-1.5 shadow-2xl border border-white/15 backdrop-blur-2xl text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col',
            submenuOnLeft
              ? 'right-full mr-2 before:absolute before:-right-4 before:top-0 before:bottom-0 before:w-5 before:content-[\'\']'
              : 'left-full ml-2 before:absolute before:-left-4 before:top-0 before:bottom-0 before:w-5 before:content-[\'\']'
          ]"
          style="background: rgba(18, 24, 38, 0.98); box-shadow: 0 10px 35px -5px rgba(0, 0, 0, 0.85);"
          @mouseenter="openSubmenu"
          @mouseleave="scheduleCloseSubmenu"
        >
          <div class="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between shrink-0">
            <span>选择目标分类</span>
            <span v-if="isSubmenuPinned" class="text-[9px] text-emerald-400 font-normal">已锁定</span>
          </div>
          
          <div class="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
            <button
              v-for="cat in targetCategories"
              :key="cat.id"
              @click.stop="handleMoveToCategory(cat.id)"
              class="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs hover:bg-emerald-500/20 hover:text-emerald-300 transition-all text-left group/item truncate"
              :title="cat.name"
            >
              <Folder class="w-3.5 h-3.5 text-slate-400 group-hover/item:text-emerald-400 shrink-0" />
              <span class="truncate flex-1">{{ cat.name }}</span>
            </button>
            <div v-if="targetCategories.length === 0" class="px-2.5 py-2 text-[11px] text-slate-400 text-center">
              暂无其他分类
            </div>
          </div>
        </div>
      </div>

      <!-- Item 1.5: 固定到任务栏 / 从任务栏取消固定 (Pin / Unpin from Taskbar) -->
      <button
        @click="onAction('toggle-pin-taskbar')"
        class="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-white/10 hover:text-white transition-all text-left group"
      >
        <component
          :is="bookmark?.isPinnedToTaskbar ? PinOff : Pin"
          class="w-4 h-4 transition-colors"
          :class="bookmark?.isPinnedToTaskbar ? 'text-amber-400 group-hover:text-amber-300' : 'text-slate-400 group-hover:text-blue-400'"
        />
        <span>{{ bookmark?.isPinnedToTaskbar ? '从底栏取消固定' : '固定到底部栏' }}</span>
      </button>

      <!-- Item 2: 编辑图标 -->
      <button
        @click="onAction('edit-icon')"
        class="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-white/10 hover:text-white transition-all text-left group"
      >
        <Pencil class="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
        <span>编辑图标</span>
      </button>

      <!-- Item 3: 编辑主页 -->
      <button
        @click="onAction('edit-bookmark')"
        class="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-white/10 hover:text-white transition-all text-left group"
      >
        <FileEdit class="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
        <span>编辑主页</span>
      </button>

      <!-- Divider -->
      <div class="h-px bg-white/10 my-1"></div>

      <!-- Item 4: 删除 -->
      <button
        @click="onAction('delete')"
        class="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all text-left group"
      >
        <Trash2 class="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
        <span>删除</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Pencil, FileEdit, Trash2, FolderInput, Folder, ChevronRight, Pin, PinOff } from 'lucide-vue-next'
import type { BookmarkItem, CategoryItem } from '../../shared/types'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  bookmark: BookmarkItem | null
  categories?: CategoryItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit-icon', bm: BookmarkItem): void
  (e: 'edit-bookmark', bm: BookmarkItem): void
  (e: 'delete', bm: BookmarkItem): void
  (e: 'move-to-category', bm: BookmarkItem, targetCategoryId: string): void
  (e: 'toggle-pin-taskbar', bm: BookmarkItem): void
}>()

const showSubmenu = ref(false)
const isSubmenuPinned = ref(false)
let submenuTimer: any = null

function openSubmenu() {
  if (submenuTimer) {
    clearTimeout(submenuTimer)
    submenuTimer = null
  }
  showSubmenu.value = true
}

function scheduleCloseSubmenu() {
  if (isSubmenuPinned.value) return
  if (submenuTimer) {
    clearTimeout(submenuTimer)
  }
  submenuTimer = setTimeout(() => {
    showSubmenu.value = false
    submenuTimer = null
  }, 280)
}

function toggleSubmenu() {
  if (showSubmenu.value && isSubmenuPinned.value) {
    showSubmenu.value = false
    isSubmenuPinned.value = false
  } else {
    showSubmenu.value = true
    isSubmenuPinned.value = true
    if (submenuTimer) {
      clearTimeout(submenuTimer)
      submenuTimer = null
    }
  }
}

function resetSubmenu() {
  if (submenuTimer) {
    clearTimeout(submenuTimer)
    submenuTimer = null
  }
  showSubmenu.value = false
  isSubmenuPinned.value = false
}

const targetCategories = computed(() => {
  if (!props.categories || !props.bookmark) return []
  const currentCatId = props.bookmark.categoryId
  return props.categories.filter((c) => {
    // Exclude current category
    if (c.id === currentCatId) return false
    // If not in vault, do not reveal secret cat-vault in regular move list
    if (c.isPrivate && currentCatId !== 'cat-vault') return false
    return true
  })
})

const submenuOnLeft = computed(() => {
  if (typeof window === 'undefined') return false
  const menuWidth = 176
  const submenuWidth = 176
  const gap = 8
  const padding = 12
  return props.x + menuWidth + submenuWidth + gap > window.innerWidth - padding
})

// Directly and reactively compute the style whenever props.x and props.y change
const menuStyle = computed(() => {
  const menuWidth = 176
  const menuHeight = 175
  let targetX = props.x
  let targetY = props.y

  if (typeof window !== 'undefined') {
    // If context menu overflows the right edge
    if (targetX + menuWidth > window.innerWidth - 12) {
      targetX = window.innerWidth - menuWidth - 12
    }
    // If context menu overflows the bottom edge (e.g. clicked at bottom row/taskbar)
    // pop the menu upwards above the cursor/icon!
    if (targetY + menuHeight > window.innerHeight - 12) {
      targetY = targetY - menuHeight
    }
  }

  return {
    left: `${Math.max(12, targetX)}px`,
    top: `${Math.max(12, targetY)}px`
  }
})

watch(() => props.visible, (val) => {
  if (!val) {
    resetSubmenu()
  }
})

let timer: any = null

onMounted(() => {
  timer = setTimeout(() => {
    window.addEventListener('click', onGlobalClick)
    window.addEventListener('contextmenu', onGlobalContextMenu)
  }, 50)
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  resetSubmenu()
  window.removeEventListener('click', onGlobalClick)
  window.removeEventListener('contextmenu', onGlobalContextMenu)
  window.removeEventListener('keydown', onKeyDown)
})

function onGlobalClick() {
  if (props.visible) {
    resetSubmenu()
    emit('close')
  }
}

function onGlobalContextMenu() {
  if (props.visible) {
    resetSubmenu()
    emit('close')
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    resetSubmenu()
    emit('close')
  }
}

function handleMoveToCategory(targetCatId: string) {
  if (!props.bookmark) return
  resetSubmenu()
  emit('close')
  emit('move-to-category', props.bookmark, targetCatId)
}

function onAction(action: 'edit-icon' | 'edit-bookmark' | 'delete' | 'toggle-pin-taskbar') {
  if (!props.bookmark) return
  resetSubmenu()
  emit('close')
  if (action === 'edit-icon') {
    emit('edit-icon', props.bookmark)
  } else if (action === 'edit-bookmark') {
    emit('edit-bookmark', props.bookmark)
  } else if (action === 'delete') {
    emit('delete', props.bookmark)
  } else if (action === 'toggle-pin-taskbar') {
    emit('toggle-pin-taskbar', props.bookmark)
  }
}
</script>
