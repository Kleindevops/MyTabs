<template>
  <div class="relative w-full max-w-2xl mx-auto px-4 z-20">
    <div
      :class="[
        'flex items-center w-full px-4 py-3 rounded-2xl glass-acrylic',
        isFocused && 'glass-acrylic-focus'
      ]"
    >
      <!-- Engine selector button -->
      <div class="relative shrink-0">
        <button
          @click="showEngineMenu = !showEngineMenu"
          class="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all shadow-[inset_1px_1px_0_rgba(255,255,255,0.35)] border border-white/15"
        >
          <Search class="w-3.5 h-3.5 text-white/80" />
          <span>{{ currentEngine.name }}</span>
          <ChevronDown class="w-3 h-3 text-white/60 transition-transform duration-200" :class="{ 'rotate-180': showEngineMenu }" />
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showEngineMenu"
          class="absolute left-0 top-full mt-2 w-44 rounded-2xl glass-acrylic p-1.5 space-y-1 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2"
        >
          <button
            v-for="engine in engines"
            :key="engine.id"
            @click="selectEngine(engine)"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left',
              engine.id === currentEngine.id
                ? 'bg-white/20 text-white font-semibold shadow-[inset_1px_1px_0_rgba(255,255,255,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            ]"
          >
            <span>{{ engine.name }}</span>
            <Check v-if="engine.id === currentEngine.id" class="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      <!-- Input box -->
      <input
        ref="searchInputRef"
        type="text"
        v-model="query"
        :placeholder="currentEngine.placeholder || '输入搜索内容或网址...'"
        @focus="isFocused = true"
        @blur="handleBlur"
        @keydown.enter="performSearch"
        @keydown.tab.prevent="cycleEngine"
        class="flex-1 bg-transparent border-0 px-3 text-sm md:text-base text-white font-medium subpixel-antialiased placeholder-white/60 focus:outline-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      />

      <!-- Clear button -->
      <button
        v-if="query"
        @click="query = ''"
        class="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors mr-1"
      >
        <X class="w-4 h-4" />
      </button>

      <!-- Submit search button -->
      <button
        @click="performSearch"
        class="p-2 rounded-xl bg-blue-600/90 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30 transition-all shrink-0 border border-blue-400/30 shadow-[inset_1px_1px_0_rgba(255,255,255,0.4)] active:scale-95"
      >
        <ArrowRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, ChevronDown, Check, X, ArrowRight } from 'lucide-vue-next'
import { DEFAULT_SEARCH_ENGINES } from '../../shared/storage'
import type { SearchEngine } from '../../shared/types'

const engines = ref<SearchEngine[]>(DEFAULT_SEARCH_ENGINES)
const currentEngine = ref<SearchEngine>(DEFAULT_SEARCH_ENGINES[0])
const query = ref('')
const isFocused = ref(false)
const showEngineMenu = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

function selectEngine(engine: SearchEngine) {
  currentEngine.value = engine
  showEngineMenu.value = false
  searchInputRef.value?.focus()
}

function cycleEngine() {
  const curIdx = engines.value.findIndex((e) => e.id === currentEngine.value.id)
  const nextIdx = (curIdx + 1) % engines.value.length
  currentEngine.value = engines.value[nextIdx]
}

function handleBlur() {
  setTimeout(() => {
    isFocused.value = false
    showEngineMenu.value = false
  }, 200)
}

function performSearch() {
  const text = query.value.trim()
  if (!text) return

  let targetUrl = ''
  // Check if it's already a URL
  if (/^https?:\/\//i.test(text) || (text.includes('.') && !text.includes(' '))) {
    targetUrl = text.startsWith('http') ? text : `https://${text}`
  } else {
    targetUrl = `${currentEngine.value.url}${encodeURIComponent(text)}`
  }

  // Open in new tab so user never loses their workspace
  window.open(targetUrl, '_blank')
}
</script>