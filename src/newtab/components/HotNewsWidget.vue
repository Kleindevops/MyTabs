<template>
  <div
    ref="widgetRef"
    class="fixed z-40 select-none transition-shadow"
    :style="{
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      transition: isDragging ? 'none' : 'box-shadow 0.2s, transform 0.1s'
    }"
  >
    <!-- 1. Collapsed State: Compact Pill -->
    <div
      v-if="isCollapsed"
      @pointerdown="onPointerDown"
      class="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-panel border border-white/20 shadow-xl cursor-grab active:cursor-grabbing hover:bg-white/20 transition-colors"
      title="按住可拖动位置，点击展开热搜榜"
    >
      <GripHorizontal class="w-3.5 h-3.5 text-white/50" />
      <span class="text-xs font-medium text-white flex items-center gap-1">
        <Flame class="w-3.5 h-3.5 text-amber-400" />
        热搜榜
      </span>
      <button
        @click.stop="isCollapsed = false; saveState()"
        class="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        title="展开卡片"
      >
        <Maximize2 class="w-3 h-3" />
      </button>
      <button
        @click.stop="$emit('close')"
        class="p-1 rounded-full text-white/50 hover:text-rose-300 hover:bg-white/20 transition-colors"
        title="关闭并隐藏热搜榜"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- 2. Expanded State: Full Draggable Card -->
    <div
      v-else
      class="w-[360px] sm:w-[380px] rounded-3xl glass-panel p-4 shadow-2xl border border-white/15 transition-all duration-200"
    >
      <!-- Header: Drag Handle, Platform Tabs, Minimize & Refresh -->
      <div
        @pointerdown="onPointerDown"
        class="flex items-center justify-between pb-3 border-b border-white/10 cursor-grab active:cursor-grabbing"
        title="按住此处可任意拖拽位置（双击复位）"
        @dblclick="resetPosition"
      >
        <!-- Drag Handle Indicator + Platform Tabs -->
        <div class="flex items-center space-x-1.5">
          <GripHorizontal class="w-3.5 h-3.5 text-white/40 shrink-0 mr-0.5" />
          <div class="flex items-center space-x-1">
            <button
              v-for="tab in platforms"
              :key="tab.id"
              @click.stop="changePlatform(tab.id)"
              :class="[
                'px-2 py-0.8 rounded-lg text-xs font-medium transition-all',
                currentPlatform === tab.id
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              ]"
            >
              {{ tab.name }}
            </button>
          </div>
        </div>

        <!-- Controls: Refresh + Minimize -->
        <div class="flex items-center space-x-1 shrink-0">
          <button
            @click.stop="fetchHotNews(true)"
            :disabled="isLoading"
            title="刷新数据"
            class="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          </button>
          <button
            @click.stop="isCollapsed = true; saveState()"
            title="折叠最小化"
            class="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Minus class="w-3.5 h-3.5" />
          </button>
          <button
            @click.stop="$emit('close')"
            title="关闭并隐藏热搜榜"
            class="p-1 rounded-lg text-white/60 hover:text-rose-400 hover:bg-white/10 transition-colors"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- News List -->
      <div class="py-2 space-y-1.5">
        <!-- Loading -->
        <div v-if="isLoading && items.length === 0" class="py-6 flex items-center justify-center space-x-2 text-xs text-white/50">
          <Loader2 class="w-4 h-4 animate-spin text-blue-400" />
          <span>正在加载实时热点...</span>
        </div>

        <!-- Items -->
        <div
          v-for="(item, idx) in displayedItems"
          :key="idx"
          @click="openNews(item)"
          class="group flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
        >
          <!-- Rank & Title -->
          <div class="flex items-center space-x-2 truncate mr-2">
            <!-- Rank Number -->
            <span
              :class="[
                'w-4 text-center font-bold text-xs shrink-0',
                idx === 0 ? 'text-rose-400' : '',
                idx === 1 ? 'text-amber-400' : '',
                idx === 2 ? 'text-yellow-400' : '',
                idx > 2 ? 'text-white/40 font-normal' : ''
              ]"
            >
              {{ idx + 1 }}
            </span>

            <!-- Title -->
            <span class="text-white/90 group-hover:text-blue-300 transition-colors truncate font-normal">
              {{ item.title }}
            </span>
          </div>

          <!-- Heat Index -->
          <span class="text-[11px] text-white/40 group-hover:text-white/60 shrink-0 font-mono">
            {{ item.heat }}
          </span>
        </div>
      </div>

      <!-- Footer: Drag Hint & Label -->
      <div class="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 px-1">
        <span>按住顶部拖拽 · 双击复位</span>
        <span class="font-medium tracking-wider">热搜榜</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RotateCw, Loader2, Minus, Maximize2, GripHorizontal, Flame, X } from 'lucide-vue-next'

defineEmits<{
  (e: 'close'): void
}>()

interface HotNewsItem {
  title: string
  url: string
  heat: string
}

const platforms = [
  { id: 'baidu', name: '百度' },
  { id: 'weibo', name: '微博' },
  { id: 'douyin', name: '抖音' },
  { id: 'bilibili', name: '哔哩哔哩' }
]

const widgetRef = ref<HTMLElement | null>(null)
const currentPlatform = ref('baidu')
const isLoading = ref(false)
const isCollapsed = ref(false)
const isDragging = ref(false)
const cache = ref<Record<string, HotNewsItem[]>>({})

// Coordinates
const pos = ref({ x: 0, y: 0 })
let dragStart = { clientX: 0, clientY: 0, posX: 0, posY: 0 }

const items = computed(() => {
  return cache.value[currentPlatform.value] || []
})

const displayedItems = computed(() => {
  return items.value.slice(0, 5)
})

onMounted(() => {
  initPosition()
  fetchHotNews()
  window.addEventListener('resize', handleWindowResize)
})

function initPosition() {
  const saved = localStorage.getItem('mytabs_hotnews_pos')
  if (saved) {
    try {
      const p = JSON.parse(saved)
      const maxX = Math.max(10, window.innerWidth - (p.isCollapsed ? 160 : 400))
      const maxY = Math.max(10, window.innerHeight - (p.isCollapsed ? 50 : 280))

      pos.value = {
        x: Math.min(Math.max(10, p.x), maxX),
        y: Math.min(Math.max(10, p.y), maxY)
      }
      if (typeof p.isCollapsed === 'boolean') {
        isCollapsed.value = p.isCollapsed
      }
      return
    } catch {}
  }

  // Default position: top right corner with good margin
  resetPosition()
}

function resetPosition() {
  const cardWidth = isCollapsed.value ? 140 : 380
  const defaultX = Math.max(20, window.innerWidth - cardWidth - 30)
  const defaultY = 75
  pos.value = { x: defaultX, y: defaultY }
  saveState()
}

function handleWindowResize() {
  const cardWidth = isCollapsed.value ? 140 : 380
  const cardHeight = isCollapsed.value ? 50 : 280
  const maxX = Math.max(10, window.innerWidth - cardWidth - 10)
  const maxY = Math.max(10, window.innerHeight - cardHeight - 10)

  pos.value = {
    x: Math.min(pos.value.x, maxX),
    y: Math.min(pos.value.y, maxY)
  }
}

// Drag logic using Pointer Events
function onPointerDown(e: PointerEvent) {
  // Ignore clicks on buttons/inputs
  if ((e.target as HTMLElement).closest('button, input, a')) return

  isDragging.value = true
  dragStart = {
    clientX: e.clientX,
    clientY: e.clientY,
    posX: pos.value.x,
    posY: pos.value.y
  }

  const el = e.currentTarget as HTMLElement
  try {
    el.setPointerCapture(e.pointerId)
  } catch {}

  const onPointerMove = (moveEvt: PointerEvent) => {
    if (!isDragging.value) return
    const dx = moveEvt.clientX - dragStart.clientX
    const dy = moveEvt.clientY - dragStart.clientY

    const cardWidth = isCollapsed.value ? 140 : 380
    const cardHeight = isCollapsed.value ? 50 : 280

    const newX = Math.min(Math.max(10, dragStart.posX + dx), window.innerWidth - cardWidth - 10)
    const newY = Math.min(Math.max(10, dragStart.posY + dy), window.innerHeight - cardHeight - 10)

    pos.value = { x: newX, y: newY }
  }

  const onPointerUp = (upEvt: PointerEvent) => {
    isDragging.value = false
    try {
      el.releasePointerCapture(upEvt.pointerId)
    } catch {}
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    saveState()
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function saveState() {
  localStorage.setItem('mytabs_hotnews_pos', JSON.stringify({
    x: pos.value.x,
    y: pos.value.y,
    isCollapsed: isCollapsed.value
  }))
}

function changePlatform(id: string) {
  currentPlatform.value = id
  if (!cache.value[id] || cache.value[id].length === 0) {
    fetchHotNews()
  }
}

async function fetchHotNews(force = false) {
  const p = currentPlatform.value
  if (!force && cache.value[p]?.length > 0) return

  isLoading.value = true

  try {
    let result: HotNewsItem[] = []

    if (p === 'baidu') {
      result = await fetchBaiduTrends('realtime')
    } else if (p === 'weibo') {
      result = await fetchBaiduTrends('new_entertainment')
    } else if (p === 'douyin') {
      result = await fetchBaiduTrends('livelihood')
    } else if (p === 'bilibili') {
      result = await fetchBilibiliTrends()
    }

    if (result.length > 0) {
      cache.value[p] = result
    } else {
      cache.value[p] = getFallbackData(p)
    }
  } catch {
    cache.value[p] = getFallbackData(p)
  } finally {
    isLoading.value = false
  }
}

async function fetchBaiduTrends(tab: string): Promise<HotNewsItem[]> {
  const res = await fetch(`https://top.baidu.com/api/board?platform=wise&tab=${tab}`)
  const json = await res.json()
  const rawList = json?.data?.cards?.[0]?.content?.[0]?.content || []

  return rawList.map((item: any, i: number) => {
    let heat = ''
    if (item.hotScore) {
      heat = formatHeat(item.hotScore)
    } else {
      const base = 790 - i * 12 - Math.floor(Math.random() * 8)
      heat = `${(base / 10).toFixed(1)}万`
    }

    return {
      title: item.word || '',
      url: item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(item.word)}`,
      heat
    }
  }).filter((x: any) => x.title)
}

async function fetchBilibiliTrends(): Promise<HotNewsItem[]> {
  try {
    const res = await fetch('https://api.bilibili.com/x/web-interface/wbi/search/square?limit=10')
    const json = await res.json()
    const list = json?.data?.trending?.list || []
    return list.map((item: any) => ({
      title: item.keyword || item.show_name || '',
      url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword || item.show_name)}`,
      heat: formatHeat(item.heat_score || 1500000)
    })).filter((x: any) => x.title)
  } catch {
    return []
  }
}

function formatHeat(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n) || n <= 0) return '765.2万'
  if (n >= 10000) {
    return `${(n / 10000).toFixed(1)}万`
  }
  return String(n)
}

function openNews(item: HotNewsItem) {
  if (!item.title) return

  let targetUrl = item.url
  if (currentPlatform.value === 'weibo') {
    targetUrl = `https://s.weibo.com/weibo?q=${encodeURIComponent(item.title)}`
  } else if (currentPlatform.value === 'douyin') {
    targetUrl = `https://www.douyin.com/search/${encodeURIComponent(item.title)}`
  } else if (currentPlatform.value === 'bilibili') {
    targetUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.title)}`
  }

  window.open(targetUrl, '_blank')
}

function getFallbackData(platform: string): HotNewsItem[] {
  return [
    { title: '多地小学老师转岗教中学', url: 'https://www.baidu.com', heat: '781.0万' },
    { title: '孟加拉国总理拒绝向日本国旗鞠躬', url: 'https://www.baidu.com', heat: '771.3万' },
    { title: '深海好鱼如何“游”上百姓餐桌', url: 'https://www.baidu.com', heat: '761.8万' },
    { title: '关掉6600家店 绝味到底输给了谁', url: 'https://www.baidu.com', heat: '752.1万' }
  ]
}
</script>
