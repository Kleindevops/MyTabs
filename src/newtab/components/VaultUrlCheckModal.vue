<template>
  <div data-no-selection-translate="true" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
    <div
      class="w-full max-w-xl max-h-[85vh] rounded-3xl modal-surface shadow-2xl flex flex-col overflow-hidden border border-white/15 animate-in fade-in zoom-in-95 duration-200"
      style="background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);"
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
            <Activity class="w-4 h-4 animate-pulse" />
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
              {{ isVaultMode ? '检测个人空间私密网址可用性，排查 404 死链与故障并支持一键清理' : '检测已添加的公共网址是否还能正常打开，一键排查并清理失效死链' }}
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

      <!-- Top Status & Progress Bar -->
      <div class="px-6 py-3 bg-white/[0.02] border-b border-white/10 shrink-0">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2">
            <span v-if="isChecking" class="flex items-center text-amber-300 font-medium">
              <Loader2 class="w-3.5 h-3.5 animate-spin mr-1.5" />
              正在检查 ({{ progress.checked }} / {{ progress.total }})...
            </span>
            <span v-else-if="failedResults.length > 0" class="flex items-center text-rose-400 font-medium">
              <AlertCircle class="w-3.5 h-3.5 mr-1.5 shrink-0" />
              发现 {{ failedResults.length }} 个无法正常打开的失效网址
            </span>
            <span v-else-if="progress.total === 0" class="text-slate-400">
              {{ isVaultMode ? '个人空间内暂无可检测的网址' : '当前暂无可检测的公共网址' }}
            </span>
            <span v-else class="flex items-center text-emerald-400 font-medium">
              <CheckCircle2 class="w-3.5 h-3.5 mr-1.5 shrink-0" />
              检查完成，全部 {{ progress.total }} 个网址均能正常打开
            </span>
          </div>

          <!-- Scope Selector (Strictly isolated by current mode) -->
          <div class="flex items-center space-x-1.5 p-0.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
            <!-- 1. All Bookmarks in Current Mode -->
            <button
              @click="setScope('all')"
              :class="[
                'px-2 py-0.5 rounded-lg transition-all',
                currentScope === 'all'
                  ? (isVaultMode ? 'bg-amber-500/30 text-amber-200 font-medium' : 'bg-blue-600/40 text-blue-200 font-medium')
                  : 'text-slate-400 hover:text-white'
              ]"
            >
              {{ isVaultMode ? '个人空间全部' : '全部公共网址' }}
            </button>

            <!-- 2. Active Category (Only if named and in current mode) -->
            <button
              v-if="activeCategoryName"
              @click="setScope('current')"
              :class="[
                'px-2 py-0.5 rounded-lg transition-all',
                currentScope === 'current'
                  ? 'bg-emerald-600/40 text-emerald-200 font-medium'
                  : 'text-slate-400 hover:text-white'
              ]"
            >
              {{ activeCategoryName }}
            </button>
          </div>

          <!-- Filter Pills -->
          <div v-if="progress.total > 0" class="flex items-center space-x-1">
            <button
              @click="activeFilter = 'failed'"
              :class="[
                'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1',
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
                'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1',
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

        <!-- Progress Track -->
        <div v-if="isChecking" class="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            class="bg-gradient-to-r from-amber-500 to-rose-500 h-1.5 rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Main Body: Results List -->
      <div class="flex-1 overflow-y-auto p-6 space-y-3 min-h-[220px]">
        <!-- 1. Empty Bookmarks Prompt -->
        <div v-if="targetBookmarks.length === 0" class="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
            <Lock v-if="isVaultMode" class="w-6 h-6" />
            <Activity v-else class="w-6 h-6" />
          </div>
          <div class="text-xs text-slate-400">
            {{ isVaultMode ? '个人空间内当前暂无网址，请先添加网址后再进行检查' : '当前分类下暂无可检测的公共网址，请先添加网址后再进行检查' }}
          </div>
        </div>

        <!-- 2. Checking Spinner (Initial state) -->
        <div v-else-if="isChecking && checkResults.length === 0" class="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <Loader2 class="w-8 h-8 text-amber-400 animate-spin" />
          <div class="text-xs text-slate-300 font-medium">正在建立网络连通性探测...</div>
          <div class="text-[11px] text-slate-500">将实时排查 404 死链、服务器故障及连接超时</div>
        </div>

        <!-- 3. All OK Prompt (No dead links found) -->
        <div
          v-else-if="!isChecking && failedResults.length === 0 && activeFilter === 'failed'"
          class="flex flex-col items-center justify-center py-10 text-center space-y-3 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
        >
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <div class="text-sm font-semibold text-emerald-300">
            {{ isVaultMode ? '个人空间所有网址均可正常打开！' : '所有检测网址均可正常打开！' }}
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

        <!-- 4. Result Items List -->
        <div v-else class="space-y-2">
          <div
            v-for="item in displayedResults"
            :key="item.bookmarkId"
            class="group flex items-center justify-between p-3 rounded-2xl border transition-all duration-200"
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
          <span v-else>
            共排查 {{ checkResults.length }} 个网址
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

          <!-- Recheck All Button -->
          <button
            @click="startFullCheck"
            :disabled="isChecking || targetBookmarks.length === 0"
            class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-slate-200 text-xs font-medium border border-white/15 transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isChecking }" />
            <span>重新检查</span>
          </button>

          <!-- Done / Close Button -->
          <button
            @click="$emit('close')"
            class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/30 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Activity,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Trash2,
  Lock
} from 'lucide-vue-next'
import type { BookmarkItem, CategoryItem } from '../../shared/types'
import { checkBookmarkList, checkSingleUrl, type UrlCheckResult } from '../../shared/url-checker'

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
const checkingSingleId = ref<string | null>(null)
const checkResults = ref<UrlCheckResult[]>([])
const activeFilter = ref<'failed' | 'all'>('failed')

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

const activeCategoryName = computed(() => {
  return props.categories?.find(c => c.id === props.activeCategoryId)?.name || ''
})

// Scope is strictly either 'all' or 'current'
const currentScope = ref<'all' | 'current'>('all')

function setScope(scope: 'all' | 'current') {
  currentScope.value = scope
  startFullCheck()
}

// Filter targets strictly based on mode: in default mode, strictly NEVER touch vault bookmarks
const targetBookmarks = computed(() => {
  const source = props.bookmarks || []
  if (!isVaultMode.value) {
    // Default mode: strictly ONLY regular public bookmarks (physical isolation guarantee)
    const publicOnly = source.filter(bm => {
      if (bm.isPrivate || bm.categoryId === 'cat-vault') return false
      const parentCat = props.categories?.find(c => c.id === bm.categoryId)
      return !parentCat?.isPrivate
    })
    if (currentScope.value === 'current' && props.activeCategoryId) {
      return publicOnly.filter(bm => bm.categoryId === props.activeCategoryId)
    }
    return publicOnly
  } else {
    // Vault mode: strictly ONLY personal space bookmarks
    const vaultOnly = source.filter(bm => {
      if (bm.isPrivate || bm.categoryId === 'cat-vault') return true
      const parentCat = props.categories?.find(c => c.id === bm.categoryId)
      return !!parentCat?.isPrivate
    })
    if (currentScope.value === 'current' && props.activeCategoryId && props.activeCategoryId !== 'cat-vault') {
      return vaultOnly.filter(bm => bm.categoryId === props.activeCategoryId)
    }
    return vaultOnly
  }
})

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
 * 启动全量检查
 */
async function startFullCheck() {
  if (targetBookmarks.value.length === 0) {
    progress.value = { checked: 0, total: 0 }
    checkResults.value = []
    return
  }

  isChecking.value = true
  checkResults.value = []
  progress.value = { checked: 0, total: targetBookmarks.value.length }

  try {
    const results = await checkBookmarkList(
      targetBookmarks.value,
      4,
      (p) => {
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
      }
    )
    checkResults.value = results

    // 如果检查完毕且发现有失效网址，默认筛选到 'failed'；若全部正常，则切换到 'all'
    const hasFailed = results.some(r => r.status === 'failed')
    if (hasFailed) {
      activeFilter.value = 'failed'
    } else {
      activeFilter.value = 'all'
    }
  } catch (err) {
    console.warn('URL check error:', err)
  } finally {
    isChecking.value = false
  }
}

/**
 * 单项重新测试
 */
async function recheckSingle(item: UrlCheckResult) {
  checkingSingleId.value = item.bookmarkId
  try {
    const res = await checkSingleUrl(item.url)
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
  startFullCheck()
})
</script>