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
        @mouseenter="showSubmenu = true"
        @mouseleave="showSubmenu = false"
      >
        <button
          @click.stop="showSubmenu = !showSubmenu"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium hover:bg-white/10 hover:text-white transition-all text-left group"
        >
          <div class="flex items-center space-x-2.5">
            <FolderInput class="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <span>移动到分类</span>
          </div>
          <ChevronRight class="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
        </button>

        <!-- Category Submenu -->
        <div
          v-if="showSubmenu"
          :class="[
            'absolute top-0 w-36 rounded-2xl p-1.5 shadow-2xl border border-white/15 backdrop-blur-2xl text-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5',
            submenuOnLeft ? 'right-full mr-1.5' : 'left-full ml-1.5'
          ]"
          style="background: rgba(18, 24, 38, 0.98); box-shadow: 0 10px 35px -5px rgba(0, 0, 0, 0.85);"
        >
          <div class="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            选择目标分类
          </div>
          <button
            v-for="cat in targetCategories"
            :key="cat.id"
            @click="handleMoveToCategory(cat.id)"
            class="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs hover:bg-emerald-500/20 hover:text-emerald-300 transition-all text-left truncate"
          >
            <Folder class="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0" />
            <span class="truncate">{{ cat.name }}</span>
          </button>
          <div v-if="targetCategories.length === 0" class="px-2.5 py-1 text-[11px] text-slate-400">
            暂无其他分类
          </div>
        </div>
      </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Pencil, FileEdit, Trash2, FolderInput, Folder, ChevronRight } from 'lucide-vue-next'
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
}>()

const showSubmenu = ref(false)

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
  return props.x + 180 + 150 > window.innerWidth - 12
})

// Directly and reactively compute the style whenever props.x and props.y change
const menuStyle = computed(() => {
  const menuWidth = 180
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

let timer: any = null

onMounted(() => {
  timer = setTimeout(() => {
    window.addEventListener('click', onGlobalClick)
    window.addEventListener('contextmenu', onGlobalContextMenu)
  }, 50)
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  clearTimeout(timer)
  window.removeEventListener('click', onGlobalClick)
  window.removeEventListener('contextmenu', onGlobalContextMenu)
  window.removeEventListener('keydown', onKeyDown)
})

function onGlobalClick() {
  if (props.visible) {
    emit('close')
  }
}

function onGlobalContextMenu() {
  if (props.visible) {
    emit('close')
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    emit('close')
  }
}

function handleMoveToCategory(targetCatId: string) {
  if (!props.bookmark) return
  emit('close')
  emit('move-to-category', props.bookmark, targetCatId)
}

function onAction(action: 'edit-icon' | 'edit-bookmark' | 'delete') {
  if (!props.bookmark) return
  emit('close')
  if (action === 'edit-icon') {
    emit('edit-icon', props.bookmark)
  } else if (action === 'edit-bookmark') {
    emit('edit-bookmark', props.bookmark)
  } else if (action === 'delete') {
    emit('delete', props.bookmark)
  }
}
</script>
