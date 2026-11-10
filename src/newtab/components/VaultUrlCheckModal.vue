<template>
  <div data-no-selection-translate="true" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div
      class="w-full max-w-xl max-h-[85vh] rounded-3xl modal-surface shadow-2xl flex flex-col overflow-hidden border border-white/15 animate-in fade-in zoom-in-95 duration-150"
      style="contain: paint;"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
        <div class="flex items-center space-x-2.5">
          <div
            class="w-8 h-8 rounded-xl flex items-center justify-center border"
            :class="[
              isVaultMode
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
            ]"
          >
            <Activity class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white flex items-center gap-2">
              <span>网址可用性检查</span>
              <!-- Strict Mode Capsule: Vault vs Public (Never leaked in default mode) -->
              <span
                v-if="isVaultMode"
                class="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30"
              >
                个人空间专属
              </span>
              <span
                v-else
                class="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
              >
                常规主页
              </span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">
              {{ isVaultMode ? '可指定分类排查个人空间私密网址可用性，检测 404 死链与故障并一键清理' : '可指定分类排查已添加网址是否能正常打开，排查并清理失效死链' }}
            </p>
          </div>
        </div>

        <button
          @click="$emit('close')"
          class="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="关闭窗口 (Esc)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Controls & Scope Toolbar -->
      <div class="px-6 py-3 bg-white/[0.02] border-b border-white/10 shrink-0 space-y-2.5">
        <!-- Row 1: Category Selector + Check Switch -->
        <div class="flex items-center justify-between gap-3">
          <!-- Category Selector -->
          <div class="flex items-center space-x-2 min-w-0">
            <span class="text-xs text-slate-400 shrink-0 font-medium">指定分类:</span>
            <div class="relative min-w-0">
              <select
                v-model="selectedCategoryId"
                :disabled="isChecking"
                @change="handleCategoryChange"
                class="appearance-none bg-slate-800 hover:bg-slate-700/80 text-white text-xs rounded-xl pl-3 pr-8 py-1.5 border border-white/15 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed max-w-[210px] truncate"
              >
                <option value="all" class="bg-slate-900 text-white">
                  {{ isVaultMode ? '个人空间全部' : '全部分类' }} ({{ targetSourceBookmarks.length }})
                </option>
                <option
                  v-for="cat in availableCategories"
                  :key="cat.id"
                  :value="cat.id"
                  class="bg-slate-900 text-white"
                >
                  {{ cat.name }} ({{ getCategoryBookmarkCount(cat.id) }})
                </option>
              </select>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <!-- Inspection Switch -->
          <div class="flex items-center space-x-2 shrink-0">
            <span class="text-xs text-slate-300 font-medium">检查开关</span>
            <button
              type="button"
              role="switch"
              :aria-checked="isChecking"
              @click="toggleChecking"
              :disabled="targetBookmarks.length === 0"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              :class="isChecking ? 'bg-emerald-500' : 'bg-slate-700'"
              :title="isChecking ? '点击停止检查' : '点击开启检查'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
                :class="isChecking ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
            <span class="text-[11px] font-medium" :class="isChecking ? 'text-emerald-400' : 'text-slate-400'">
              {{ isChecking ? '正在检查' : '已停止' }}
            </span>
          </div>
        </div>

        <!-- Row 2: Status Line & Filter Pills -->
        <div class="flex items-center justify-between text-xs pt-1">
          <!-- Status text -->
          <div class="flex items-center space-x-2 min-w-0">
            <span v-if="isChecking" class="flex items-center text-amber-300 font-medium truncate">
              <Loader2 class="w-3.5 h-3.5 animate-spin mr-1.5 shrink-0" style="transform: translateZ(0); will-change: transform;" />
              正在检查 ({{ progress.checked }} / {{ progress.total }})...
            </span>
            <span v-else-if="!hasChecked" class="text-slate-400 truncate">
              {{ targetBookmarks.length === 0 ? '当前分类下暂无网址' : `待检查：共 ${targetBookmarks.length} 个网址，开启开关即可开始检查` }}
            </span>
            <span v-else-if="failedResults.length > 0" class="flex items-center text-rose-400 font-medium truncate">
              <AlertCircle class="w-3.5 h-3.5 mr-1.5 shrink-0" />
              发现 {{ failedResults.length }} 个无法正常打开的失效网址
            </span>
            <span v-else class="flex items-center text-emerald-400 font-medium truncate">
              <CheckCircle2 class="w-3.5 h-3.5 mr-1.5 shrink-0" />
              全部 {{ progress.total }} 个网址均能正常打开
            </span>
          </div>

          <!-- Filter Pills -->
          <div v-if="hasChecked || isChecking" class="flex items-center space-x-1 shrink-0">
            <button
              @click="activeFilter = 'failed'"
              :class="[
                'px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1',
                activeFilter === 'failed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              ]"
            >
              <span>无法打开</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-200">
                {{ failedResults.length }}
              </span>
            </button>
            <button
              @click="activeFilter = 'all'"
              :class="[
                'px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1',
                activeFilter === 'all'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              ]"
            >
              <span>全部</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
                {{ checkResults.length }}
              </span>
            </button>
          </div>
        </div>

        <!-- Progress Track (Hardware-accelerated scaleX, 0 Layout Reflow) -->
        <div v-if="isChecking" class="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
          <div
            class="bg-gradient-to-r from-amber-500 to-rose-500 h-1.5 rounded-full transition-transform duration-200 ease-out origin-left will-change-transform"
            :style="{ transform: `scaleX(${progressPercent / 100})` }"
          ></div>
        </div>
      </div>

      <!-- Main Body: Results / Bookmarks List -->
      <div class="flex-1 overflow-y-auto p-6 space-y-3 min-h-[240px]" style="contain: content;">
        <!-- 1. Empty State (No Bookmarks in Selected Category) -->
        <div v-if="targetBookmarks.length === 0" class="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <Lock v-if="isVaultMode" class="w-6 h-6" />
            <Activity v-else class="w-6 h-6" />
          </div>
          <div class="text-xs text-slate-400">
            {{ isVaultMode ? '所选分类内当前暂无私密网址，请切换分类或添加网址' : '所选分类下当前暂无可检测的网址，请切换分类或添加网址' }}
          </div>
        </div>

        <!-- 2. Idle State Before Checking: Preview Bookmarks In Target Scope -->
        <div v-else-if="!hasChecked && !isChecking" class="space-y-2">
          <div class="text-[11px] text-slate-400 pb-1 flex items-center justify-between">
            <span>当前分类待检测清单 (共 {{ targetBookmarks.length }} 项)</span>
            <span class="text-blue-400 font-medium">点击右上角开关或底部按钮开始检测</span>
          </div>
          <div
            v-for="item in targetBookmarks"
            :key="item.id"
            class="flex items-center justify-between p-3 rounded-2xl border border-white/10 bg-white/5 transition-colors"
          >
            <div class="flex items-center space-x-3 min-w-0 pr-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 border-white/10 text-slate-400">
                <Globe class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                    {{ item.title || '未命名网址' }}
                  </span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-400 border border-white/10 shrink-0">
                    待检查
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                  {{ item.url }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Checking Spinner (Initial connection state when no result ready yet) -->
        <div v-else-if="isChecking && checkResults.length === 0" class="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <Loader2 class="w-8 h-8 text-amber-400 animate-spin" style="transform: translateZ(0); will-change: transform;" />
          <div class="text-xs text-slate-300 font-medium">正在建立后台无头网络连通性探测...</div>
          <div class="text-[11px] text-slate-500">超轻量 1 字节分片嗅探，实时排查 404 死链与故障</div>
        </div>

        <!-- 4. Checking in Failed filter, but no dead links found yet -->
        <div
          v-else-if="isChecking && activeFilter === 'failed' && failedResults.length === 0"
          class="flex flex-col items-center justify-center py-12 text-center space-y-3"
        >
          <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div class="text-xs text-slate-300 font-medium">目前已检测 {{ progress.checked }} / {{ progress.total }} 项，暂未发现失效死链</div>
          <div class="text-[11px] text-slate-500">若排查到无法打开的网址将实时显示在此处</div>
        </div>

        <!-- 5. All OK Prompt (Finished checking & no dead links found in failed filter) -->
        <div
          v-else-if="!isChecking && failedResults.length === 0 && activeFilter === 'failed'"
          class="flex flex-col items-center justify-center py-10 text-center space-y-3 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
        >
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <div class="text-sm font-semibold text-emerald-300">
            {{ isVaultMode ? '所选分类下的所有网址均可正常打开！' : '所选分类下的所有网址均可正常打开！' }}
          </div>
          <div class="text-xs text-slate-400 max-w-sm">
            未检测到任何 404 失效页面、服务器宕机或域名解析异常。
          </div>
          <button
            @click="activeFilter = 'all'"
            class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
          >
            查看所有正常网址 ({{ checkResults.length }})
          </button>
        </div>

        <!-- 6. Result Items List -->
        <div v-else class="space-y-2">
          <div
            v-for="item in displayedResults"
            :key="item.bookmarkId"
            class="group flex items-center justify-between p-3 rounded-2xl border transition-all duration-150"
            :class="[
              item.status === 'failed'
                ? 'bg-rose-500/10 border-rose-500/25 hover:border-rose-500/40 hover:bg-rose-500/15'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
            ]"
          >
            <!-- Bookmark Info -->
            <div class="flex items-center space-x-3 min-w-0 pr-3">
              <div
                class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                :class="[
                  item.status === 'failed'
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
                ]"
              >
                <AlertCircle v-if="item.status === 'failed'" class="w-4 h-4" />
                <CheckCircle2 v-else class="w-4 h-4" />
              </div>

              <div class="min-w-0">
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                    {{ item.title || '未命名网址' }}
                  </span>
                  <!-- Status Capsule -->
                  <span
                    v-if="item.status === 'failed'"
                    class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-200 border border-rose-500/40 shrink-0"
                  >
                    {{ item.reason || '无法打开' }}
                  </span>
                  <span
                    v-else
                    class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0"
                  >
                    {{ item.statusCode ? `HTTP ${item.statusCode} 正常` : '可正常打开' }}
                  </span>
                </div>

                <div class="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                  {{ item.url }}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-1.5 shrink-0">
              <!-- Re-test single URL button -->
              <button
                @click="recheckSingle(item)"
                title="重新测试此网址"
                class="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': checkingSingleId === item.bookmarkId }" />
              </button>

              <!-- Delete Bookmark X Button -->
              <button
                @click="handleDeleteItem(item)"
                :title="isVaultMode ? '把这个无法打开的网址从个人空间删除' : '删除此失效网址'"
                class="p-1.5 rounded-xl bg-white/5 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 border border-transparent hover:border-rose-500/40 transition-all flex items-center justify-center"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
        <div class="text-xs text-slate-400">
          <span v-if="failedResults.length > 0">
            点击右侧 <b class="text-rose-400">✕</b> 按钮即可立即删除对应的失效网址
          </span>
          <span v-else-if="hasChecked">
            共排查 {{ checkResults.length }} 个网址
          </span>
          <span v-else>
            已就绪，当前分类共 {{ targetBookmarks.length }} 个网址
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Batch Delete All Dead Links Button -->
          <button
            v-if="failedResults.length > 1"
            @click="handleDeleteAllFailed"
            class="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors flex items-center space-x-1"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>一键清理全部失效 ({{ failedResults.length }})</span>
          </button>

          <!-- Start / Stop Checking Button -->
          <button
            v-if="isChecking"
            @click="stopCheck"
            class="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors flex items-center space-x-1.5"
          >
            <Square class="w-3.5 h-3.5 fill-current" />
            <span>停止检查</span>
          </button>
          <button
            v-else
            @click="startFullCheck"
            :disabled="targetBookmarks.length === 0"
            class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium shadow-md shadow-blue-600/30 transition-colors flex items-center space-x-1.5"
          >
            <Play class="w-3.5 h-3.5 fill-current" />
            <span>{{ hasChecked ? '重新检查' : '开始检查' }}</span>
          </button>

          <!-- Close Button -->
          <button
            @click="$emit('close')"
            class="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium border border-white/10 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Activity,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  Lock,
  Play,
  Square,
  ChevronDown,
  Globe
} from 'lucide-vue-next'
import type { BookmarkItem, CategoryItem } from '../../shared/types'
import { checkBookmarkList, checkUrlViaBackground, type UrlCheckResult } from '../../shared/url-checker'

const props = withDefaults(
  defineProps<{
    bookmarks: BookmarkItem[]
    categories: CategoryItem[]
    activeCategoryId?: string
    isInVault?: boolean
  }>(),
  {
    isInVault: false
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete-bookmark', bookmarkId: string): void
  (e: 'delete-multiple-bookmarks', bookmarkIds: string[]): void
  (e: 'delete-multiple', bookmarkIds: string[]): void
}>()

const isChecking = ref(false)
const hasChecked = ref(false)
const checkingSingleId = ref<string | null>(null)
const checkResults = ref<UrlCheckResult[]>([])
const activeFilter = ref<'failed' | 'all'>('failed')
const selectedCategoryId = ref<string>('all')

let checkAbortController: AbortController | null = null

const progress = ref({
  checked: 0,
  total: 0
})

const progressPercent = computed(() => {
  if (progress.value.total === 0) return 0
  return Math.min(100, Math.round((progress.value.checked / progress.value.total) * 100))
})

// Determine whether currently in Vault (Personal Space) mode
const isVaultMode = computed(() => {
  if (props.isInVault) return true
  if (props.activeCategoryId === 'cat-vault') return true
  const curCat = props.categories?.find(c => c.id === props.activeCategoryId)
  return !!curCat?.isPrivate
})

// Filter available categories based on Vault/Public isolation
const availableCategories = computed(() => {
  const cats = props.categories || []
  if (!isVaultMode.value) {
    return cats.filter(c => !c.isPrivate && c.id !== 'cat-vault')
  } else {
    return cats.filter(c => c.isPrivate || c.id === 'cat-vault')
  }
})

// Filter source bookmarks strictly based on mode
const targetSourceBookmarks = computed(() => {
  const source = props.bookmarks || []
  if (!isVaultMode.value) {
    // Default mode: strictly ONLY regular public bookmarks (physical isolation guarantee)
    return source.filter(bm => {
      if (bm.isPrivate || bm.categoryId === 'cat-vault') return false
      const parentCat = props.categories?.find(c => c.id === bm.categoryId)
      return !parentCat?.isPrivate
    })
  } else {
    // Vault mode: strictly ONLY personal space bookmarks
    return source.filter(bm => {
      if (bm.isPrivate || bm.categoryId === 'cat-vault') return true
      const parentCat = props.categories?.find(c => c.id === bm.categoryId)
      return !!parentCat?.isPrivate
    })
  }
})

// Specific category filter
const targetBookmarks = computed(() => {
  if (selectedCategoryId.value === 'all') {
    return targetSourceBookmarks.value
  }
  return targetSourceBookmarks.value.filter(bm => bm.categoryId === selectedCategoryId.value)
})

function getCategoryBookmarkCount(categoryId: string): number {
  return targetSourceBookmarks.value.filter(bm => bm.categoryId === categoryId).length
}

const failedResults = computed(() => {
  return checkResults.value.filter((r) => r.status === 'failed')
})

const displayedResults = computed(() => {
  if (activeFilter.value === 'failed') {
    return failedResults.value
  }
  return checkResults.value
})

/**
 * 切换检查分类
 */
function handleCategoryChange() {
  if (isChecking.value) {
    stopCheck()
  }
  hasChecked.value = false
  checkResults.value = []
  progress.value = { checked: 0, total: targetBookmarks.value.length }
}

/**
 * 检查开关切换
 */
function toggleChecking() {
  if (isChecking.value) {
    stopCheck()
  } else {
    startFullCheck()
  }
}

/**
 * 停止正在进行的检查并立刻中止网络连接
 */
function stopCheck() {
  if (checkAbortController) {
    checkAbortController.abort()
    checkAbortController = null
  }
  isChecking.value = false
}

/**
 * 启动全量检查
 */
async function startFullCheck() {
  if (targetBookmarks.value.length === 0) {
    progress.value = { checked: 0, total: 0 }
    checkResults.value = []
    return
  }

  stopCheck() // 终止前一次未完成的检查

  checkAbortController = new AbortController()
  const signal = checkAbortController.signal

  isChecking.value = true
  hasChecked.value = false
  checkResults.value = []
  progress.value = { checked: 0, total: targetBookmarks.value.length }

  try {
    const results = await checkBookmarkList(
      targetBookmarks.value,
      2,
      (p) => {
        if (signal.aborted) return
        progress.value.checked = p.checked
        progress.value.total = p.total
        if (p.latestResult) {
          const existingIdx = checkResults.value.findIndex(r => r.bookmarkId === p.latestResult!.bookmarkId)
          if (existingIdx !== -1) {
            checkResults.value[existingIdx] = p.latestResult
          } else {
            checkResults.value.push(p.latestResult)
          }
        }
      },
      signal
    )

    if (!signal.aborted) {
      checkResults.value = results
      hasChecked.value = true

      // 如果检查完毕且发现有失效网址，默认筛选到 'failed'；若全部正常，则切换到 'all'
      const hasFailed = results.some(r => r.status === 'failed')
      activeFilter.value = hasFailed ? 'failed' : 'all'
    }
  } catch (err) {
    console.warn('URL check error:', err)
  } finally {
    if (!signal.aborted) {
      isChecking.value = false
    }
  }
}

/**
 * 单项重新测试
 */
async function recheckSingle(item: UrlCheckResult) {
  checkingSingleId.value = item.bookmarkId
  try {
    const res = await checkUrlViaBackground(item.url)
    const updated: UrlCheckResult = {
      ...item,
      status: res.ok ? 'ok' : 'failed',
      statusCode: res.statusCode,
      reason: res.reason,
      checkedAt: Date.now()
    }
    const idx = checkResults.value.findIndex(r => r.bookmarkId === item.bookmarkId)
    if (idx !== -1) {
      checkResults.value[idx] = updated
    }
  } finally {
    checkingSingleId.value = null
  }
}

/**
 * 点击 X 按钮删除单个失效网址
 */
function handleDeleteItem(item: UrlCheckResult) {
  const confirmMsg = isVaultMode.value
    ? `确定将无法打开的网址 "${item.title || item.url}" 从个人空间删除吗？`
    : `确定删除无法打开的网址 "${item.title || item.url}" 吗？`
  if (!confirm(confirmMsg)) return

  // 从当前检测结果数组中移除
  checkResults.value = checkResults.value.filter(r => r.bookmarkId !== item.bookmarkId)
  progress.value.total = Math.max(0, progress.value.total - 1)
  progress.value.checked = Math.max(0, progress.value.checked - 1)

  // 触发父级删除事件
  emit('delete-bookmark', item.bookmarkId)
}

/**
 * 一键清理全部失效网址
 */
function handleDeleteAllFailed() {
  const failedList = failedResults.value
  if (failedList.length === 0) return

  const confirmMsg = isVaultMode.value
    ? `确定一键删除个人空间全部 ${failedList.length} 个无法打开的失效网址吗？此操作不可撤销。`
    : `确定一键删除全部 ${failedList.length} 个无法打开的失效网址吗？此操作不可撤销。`
  if (!confirm(confirmMsg)) return

  const idsToDelete = failedList.map(r => r.bookmarkId)
  checkResults.value = checkResults.value.filter(r => r.status !== 'failed')
  progress.value.total = Math.max(0, progress.value.total - idsToDelete.length)
  progress.value.checked = Math.max(0, progress.value.checked - idsToDelete.length)

  emit('delete-multiple-bookmarks', idsToDelete)
  emit('delete-multiple', idsToDelete)
}

onMounted(() => {
  if (props.activeCategoryId && availableCategories.value.some(c => c.id === props.activeCategoryId)) {
    selectedCategoryId.value = props.activeCategoryId
  } else {
    selectedCategoryId.value = 'all'
  }
})

onUnmounted(() => {
  stopCheck()
})
</script>
