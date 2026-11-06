<template>
  <div class="flex items-center justify-center py-2 px-2 select-none w-full">
    <!-- Category Navigation & Drag Drop Bar Container -->
    <div
      class="flex items-center space-x-1.5 p-1 rounded-2xl transition-all duration-300 max-w-full overflow-x-auto scrollbar-none"
      :class="[
        isDragging
          ? 'bg-slate-900/90 border-2 border-emerald-400/60 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl ring-2 ring-emerald-400/20'
          : 'glass-panel-light border border-white/10 shadow-lg backdrop-blur-md'
      ]"
    >
      <!-- Drag Target Guide Tag (visible when dragging) -->
      <div
        v-if="isDragging"
        class="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-400/30 shrink-0 animate-pulse"
      >
        <FolderInput class="w-3.5 h-3.5 text-emerald-300" />
        <span>拖至目标分类释放：</span>
      </div>

      <!-- Category Buttons as Interactive Tabs & Drop Targets -->
      <button
        v-for="cat in displayedCategories"
        :key="cat.id"
        @click="$emit('select-category', cat)"
        @dragover.prevent="handleDragOver($event, cat)"
        @dragenter.prevent="handleDragOver($event, cat)"
        @dragleave="handleDragLeave($event, cat)"
        @drop="handleDrop($event, cat)"
        :class="[
          'relative px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 shrink-0 select-none',
          dragOverCatId === cat.id
            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 scale-105 shadow-xl shadow-emerald-600/30'
            : activeCategoryId === cat.id
              ? 'bg-white/25 text-white shadow-md shadow-black/10 backdrop-blur-md font-semibold'
              : isDragging
                ? 'text-white/80 hover:text-white bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-400/30 border border-transparent'
                : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
        ]"
        :title="isDragging ? `释放以将图标移动至「${cat.name}」` : `切换至「${cat.name}」分类`"
      >
        <component :is="getCategoryIcon(cat)" class="w-3.5 h-3.5 opacity-80" />
        <span class="truncate max-w-[120px]">{{ cat.name }}</span>
      </button>

      <!-- Add Category Button (Hidden during drag to avoid accidental drops) -->
      <button
        v-if="!isDragging"
        @click="$emit('add-category')"
        title="新建分类"
        class="p-1.5 sm:p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Plus, Folder, Lock, FolderInput } from 'lucide-vue-next'
import type { CategoryItem, BookmarkItem } from '../../shared/types'

const props = defineProps<{
  categories: CategoryItem[]
  activeCategoryId: string
  isDragging?: boolean
  draggedBookmark?: BookmarkItem | null
  isVaultUnlocked?: boolean
}>()

const emit = defineEmits<{
  (e: 'select-category', cat: CategoryItem): void
  (e: 'add-category'): void
  (e: 'move-bookmark', payload: { bookmarkId: string; targetCategoryId: string }): void
}>()

const dragOverCatId = ref<string | null>(null)
let hoverTimer: any = null

// Filter categories: strict zero-leakage and personal space isolation
const displayedCategories = computed(() => {
  const isVault = props.activeCategoryId === 'cat-vault' || !!props.categories?.find(c => c.id === props.activeCategoryId)?.isPrivate
  return (props.categories || []).filter((c) => {
    const isVaultCat = c.isPrivate || c.id === 'cat-vault'
    if (isVault) {
      return isVaultCat && props.isVaultUnlocked === true
    } else {
      return !isVaultCat
    }
  })
})

function getCategoryIcon(cat: CategoryItem) {
  if (cat.isPrivate || cat.id === 'cat-vault') {
    return Lock
  }
  return Folder
}

function handleDragOver(e: DragEvent, cat: CategoryItem) {
  e.preventDefault()
  if (cat.id === props.activeCategoryId) {
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'none'
    }
    return
  }
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOverCatId.value = cat.id

  // Hover 450ms automatically switches to target category preview
  if (!hoverTimer) {
    hoverTimer = setTimeout(() => {
      emit('select-category', cat)
    }, 450)
  }
}

function handleDragLeave(e: DragEvent, cat: CategoryItem) {
  if (dragOverCatId.value === cat.id) {
    dragOverCatId.value = null
  }
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
}

function handleDrop(e: DragEvent, targetCat: CategoryItem) {
  e.preventDefault()
  dragOverCatId.value = null
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  if (targetCat.id === props.activeCategoryId) return

  let bmId: string | null = null
  try {
    const raw = e.dataTransfer?.getData('application/json')
    if (raw) {
      const parsed = JSON.parse(raw)
      bmId = parsed.bookmarkId
    }
  } catch {}

  if (!bmId) {
    bmId = e.dataTransfer?.getData('text/plain') || props.draggedBookmark?.id || null
  }

  if (bmId) {
    emit('move-bookmark', { bookmarkId: bmId, targetCategoryId: targetCat.id })
  }
}

onUnmounted(() => {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
})
</script>
