<template>
  <div class="flex items-center justify-center py-4 px-2 select-none overflow-x-auto">
    <div class="flex items-center space-x-1.5 p-1 rounded-2xl glass-panel-light max-w-full">
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="$emit('select-category', cat)"
        :class="[
          'relative px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center space-x-1.5 shrink-0',
          activeCategoryId === cat.id
            ? 'bg-white/25 text-white shadow-md shadow-black/10 backdrop-blur-md'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        ]"
      >
        <span>{{ cat.name }}</span>
      </button>

      <!-- Add category button -->
      <button
        @click="$emit('add-category')"
        title="新建分类"
        class="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
      >
        <Plus class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { CategoryItem } from '../../shared/types'

defineProps<{
  categories: CategoryItem[]
  activeCategoryId: string
}>()

defineEmits<{
  (e: 'select-category', cat: CategoryItem): void
  (e: 'add-category'): void
}>()
</script>
