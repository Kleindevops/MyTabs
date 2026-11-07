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
          :title="`当前: ${currentEngine.name} (点击切换或在设置中自定义)`"
        >
          <Search class="w-3.5 h-3.5 text-white/80" />
          <span>{{ currentEngine.name }}</span>
          <ChevronDown class="w-3 h-3 text-white/60 transition-transform duration-200" :class="{ 'rotate-180': showEngineMenu }" />
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showEngineMenu"
          class="absolute left-0 top-full mt-2 w-52 rounded-2xl glass-acrylic p-1.5 space-y-1 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto"
        >
          <button
            v-for="engine in availableEngines"
            :key="engine.id"
            @click="selectEngine(engine)"
            :class="[
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left',
              engine.id === currentEngine.id
                ? 'bg-white/20 text-white font-semibold shadow-[inset_1px_1px_0_rgba(255,255,255,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            ]"
          >
            <span class="truncate">{{ engine.name }}</span>
            <Check v-if="engine.id === currentEngine.id" class="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />
          </button>

          <!-- Shortcut to search engine settings -->
          <div class="pt-1 mt-1 border-t border-white/10">
            <button
              @mousedown.prevent="handleOpenSettings"
              class="w-full flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 transition-colors text-left"
            >
              <Settings class="w-3.5 h-3.5 shrink-0" />
              <span>管理与添加搜索引擎...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Input box -->
      <input
        ref="searchInputRef"
        type="text"
        v-model="query"
        :placeholder="currentEngine.placeholder || `在 ${currentEngine.name} 中搜索...`"
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
import { ref, computed, watch } from 'vue'
import { Search, ChevronDown, Check, X, ArrowRight, Settings } from 'lucide-vue-next'
import { DEFAULT_SEARCH_ENGINES } from '../../shared/storage'
import type { SearchEngine } from '../../shared/types'

const props = withDefaults(
  defineProps<{
    engines?: SearchEngine[]
    defaultEngineId?: string
  }>(),
  {
    engines: () => DEFAULT_SEARCH_ENGINES,
    defaultEngineId: 'bing'
  }
)

const emit = defineEmits<{
  (e: 'open-settings'): void
}>()

const availableEngines = computed<SearchEngine[]>(() => {
  return props.engines && props.engines.length > 0 ? props.engines : DEFAULT_SEARCH_ENGINES
})

function getInitialEngine(): SearchEngine {
  const targetId = props.defaultEngineId || 'bing'
  const found = availableEngines.value.find(e => e.id === targetId)
  return found || availableEngines.value[0] || DEFAULT_SEARCH_ENGINES[0]
}

const currentEngine = ref<SearchEngine>(getInitialEngine())
const query = ref('')
const isFocused = ref(false)
const showEngineMenu = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Keep currentEngine valid if engines list or defaultEngine changes
watch(
  () => [props.engines, props.defaultEngineId],
  () => {
    const exists = availableEngines.value.some(e => e.id === currentEngine.value.id)
    if (!exists) {
      currentEngine.value = getInitialEngine()
    }
  },
  { deep: true }
)

function selectEngine(engine: SearchEngine) {
  currentEngine.value = engine
  showEngineMenu.value = false
  searchInputRef.value?.focus()
}

function cycleEngine() {
  const list = availableEngines.value
  const curIdx = list.findIndex((e) => e.id === currentEngine.value.id)
  const nextIdx = (curIdx + 1) % list.length
  currentEngine.value = list[nextIdx]
}

function handleBlur() {
  setTimeout(() => {
    isFocused.value = false
    showEngineMenu.value = false
  }, 200)
}

function handleOpenSettings() {
  showEngineMenu.value = false
  emit('open-settings')
}

function performSearch() {
  const text = query.value.trim()
  if (!text) return

  let targetUrl = ''
  // Check if it's already a URL
  if (/^https?:\/\//i.test(text) || (text.includes('.') && !text.includes(' '))) {
    targetUrl = text.startsWith('http') ? text : `https://${text}`
  } else {
    const rawUrl = currentEngine.value.url || 'https://www.bing.com/search?q=%s'
    const encodedText = encodeURIComponent(text)
    if (rawUrl.includes('%s')) {
      targetUrl = rawUrl.replace(/%s/g, encodedText)
    } else {
      targetUrl = `${rawUrl}${encodedText}`
    }
  }

  // Open in new tab so user never loses their workspace
  window.open(targetUrl, '_blank')
}
</script>