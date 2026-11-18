<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    @click.self="$emit('close')"
    @keydown.esc="$emit('close')"
  >
    <!-- Modal Container: Acrylic Glass Window -->
    <div
      class="relative w-full max-w-5xl h-[88vh] max-h-[760px] min-h-[480px] rounded-3xl glass-panel-light flex flex-col overflow-hidden border border-amber-500/30 shadow-[0_24px_70px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200"
      style="background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);"
    >
      <!-- Top Titlebar Header -->
      <div class="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.03] select-none shrink-0">
        <!-- Left: Logo & Security Badge -->
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/30 to-amber-400/10 border border-amber-400/40 flex items-center justify-center shadow-inner">
            <NotebookPen class="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-sm font-semibold text-white tracking-wide">个人私密记事本</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center space-x-1">
                <Lock class="w-2.5 h-2.5" />
                <span>绝密空间专属</span>
              </span>
            </div>
            <p class="text-[11px] text-white/50">仅在个人空间解锁时可见 · 备份文件独立区域存储</p>
          </div>
        </div>

        <!-- Right: Actions (Export All, Quick Lock, Close) -->
        <div class="flex items-center space-x-2">
          <!-- Export All Button -->
          <button
            @click="exportAllNotes"
            title="导出全部记事为文本文件"
            class="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <Download class="w-3.5 h-3.5" />
            <span>导出全部</span>
          </button>

          <!-- Quick Exit & Lock Vault Button -->
          <button
            @click="handleLockAndExit"
            title="退出并锁定个人空间"
            class="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-colors"
          >
            <ShieldCheck class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">锁定空间</span>
          </button>

          <!-- Close Modal X -->
          <button
            @click="$emit('close')"
            title="关闭 (Esc)"
            class="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Main Body: Two Columns (Notes List + Active Note Editor) -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Sidebar: Note List & Search Filter -->
        <div class="w-72 sm:w-80 border-r border-white/10 flex flex-col bg-white/[0.015] shrink-0 select-none">
          <!-- Search & Create Button Bar -->
          <div class="p-3 border-b border-white/10 space-y-2">
            <div class="flex items-center space-x-2">
              <div class="relative flex-1">
                <Search class="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索记事内容..."
                  class="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                />
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>

              <!-- Create Note Button -->
              <button
                @click="createNewNote"
                title="新建便签 (Ctrl+N)"
                class="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center space-x-1 shadow-md shadow-amber-950/40 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>新建</span>
              </button>
            </div>

            <!-- Category Filter Pills -->
            <div class="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                v-for="cat in availableFilterCategories"
                :key="cat"
                @click="selectedFilterCategory = cat"
                :class="[
                  'px-2 py-0.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0',
                  selectedFilterCategory === cat
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                ]"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- Notes List Scroll Area -->
          <div class="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            <!-- Empty State for List -->
            <div
              v-if="filteredNotes.length === 0"
              class="h-48 flex flex-col items-center justify-center text-center p-4 text-white/40 space-y-2"
            >
              <FileQuestion class="w-8 h-8 opacity-40 text-amber-300" />
              <p class="text-xs">{{ searchQuery ? '未找到符合条件的记事' : '暂无便签，点击右上角新建' }}</p>
            </div>

            <!-- Note Card Item -->
            <div
              v-for="note in filteredNotes"
              :key="note.id"
              @click="selectNote(note.id)"
              :class="[
                'group relative p-2.5 rounded-2xl cursor-pointer transition-all duration-150 border text-left',
                currentNoteId === note.id
                  ? 'bg-white/15 border-amber-400/40 shadow-md backdrop-blur-md ring-1 ring-amber-400/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/15'
              ]"
            >
              <!-- Color Indicator Bar on Left -->
              <span
                class="absolute left-1.5 top-3 bottom-3 w-1 rounded-full opacity-80"
                :style="{ backgroundColor: note.color || '#f59e0b' }"
              ></span>

              <div class="pl-2.5 space-y-1">
                <!-- Title & Pin Icon -->
                <div class="flex items-center justify-between space-x-1">
                  <h3
                    class="text-xs font-semibold truncate flex-1"
                    :class="currentNoteId === note.id ? 'text-white' : 'text-white/90 group-hover:text-white'"
                  >
                    {{ note.title.trim() || '（无标题记事）' }}
                  </h3>
                  <div class="flex items-center space-x-1 shrink-0">
                    <Pin
                      v-if="note.isPinned"
                      class="w-3 h-3 text-amber-300 fill-amber-300 shrink-0"
                      title="已置顶"
                    />
                  </div>
                </div>

                <!-- Preview Content snippet -->
                <p class="text-[11px] text-white/60 line-clamp-2 leading-relaxed break-all">
                  {{ getPreviewText(note.content) || '空正文内容' }}
                </p>

                <!-- Footer: Category Badge & Update Time -->
                <div class="flex items-center justify-between text-[10px] text-white/40 pt-0.5">
                  <span
                    v-if="note.category"
                    class="px-1.5 py-0.2 rounded bg-white/10 text-white/70"
                  >
                    {{ note.category }}
                  </span>
                  <span v-else></span>
                  <span>{{ formatRelativeTime(note.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Main: Active Note Editor -->
        <div class="flex-1 flex flex-col bg-slate-950/40 overflow-hidden relative">
          <!-- Active Note Loaded -->
          <template v-if="activeNote">
            <!-- Top Toolbar for Current Note -->
            <div class="px-5 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-white/[0.02] select-none shrink-0">
              <!-- Left: Category Picker & Color Palette -->
              <div class="flex items-center space-x-2.5">
                <!-- Category Select / Tag -->
                <div class="relative flex items-center">
                  <Tag class="w-3.5 h-3.5 text-white/40 absolute left-2.5 pointer-events-none" />
                  <select
                    v-model="activeNote.category"
                    @change="onNoteFieldChanged"
                    class="pl-7 pr-4 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 hover:text-white focus:outline-none focus:ring-1 focus:ring-amber-400/40 cursor-pointer appearance-none"
                  >
                    <option v-for="cat in PRESET_CATEGORIES" :key="cat" :value="cat" class="bg-slate-900 text-white">
                      {{ cat }}
                    </option>
                  </select>
                </div>

                <!-- Color Palette Dots -->
                <div class="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    v-for="color in PRESET_COLORS"
                    :key="color"
                    @click="setNoteColor(color)"
                    class="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 focus:outline-none"
                    :class="activeNote.color === color ? 'ring-2 ring-white scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'"
                    :style="{ backgroundColor: color }"
                    :title="`设置颜色`"
                  ></button>
                </div>

                <!-- Pin Toggle Button -->
                <button
                  @click="togglePinCurrentNote"
                  :title="activeNote.isPinned ? '取消置顶' : '置顶此记事'"
                  :class="[
                    'p-1.5 rounded-xl border text-xs flex items-center space-x-1 transition-all',
                    activeNote.isPinned
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-sm'
                      : 'bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10'
                  ]"
                >
                  <Pin class="w-3.5 h-3.5" :class="{ 'fill-amber-300': activeNote.isPinned }" />
                  <span class="text-[11px] hidden md:inline">{{ activeNote.isPinned ? '已置顶' : '置顶' }}</span>
                </button>
              </div>

              <!-- Right: Copy, Export Single, Delete -->
              <div class="flex items-center space-x-2">
                <!-- Auto-saved Indicator -->
                <span class="text-[11px] text-white/40 hidden sm:inline select-none">
                  {{ isAutoSaved ? '已自动保存' : '保存中...' }}
                </span>

                <!-- Copy Note Content -->
                <button
                  @click="copyCurrentNote"
                  title="一键复制全部正文"
                  class="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors flex items-center space-x-1 text-xs"
                >
                  <Copy class="w-3.5 h-3.5 text-sky-300" />
                  <span class="text-[11px] hidden md:inline">复制</span>
                </button>

                <!-- Export Single Note -->
                <button
                  @click="exportCurrentNote"
                  title="导出单条记事为文本文件"
                  class="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors flex items-center space-x-1 text-xs"
                >
                  <FileDown class="w-3.5 h-3.5 text-emerald-300" />
                  <span class="text-[11px] hidden md:inline">导出</span>
                </button>

                <!-- Delete Note -->
                <button
                  @click="confirmDeleteCurrentNote"
                  title="删除当前记事"
                  class="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 border border-red-500/20 hover:border-red-500/40 transition-colors flex items-center space-x-1 text-xs"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span class="text-[11px] hidden md:inline">删除</span>
                </button>
              </div>
            </div>

            <!-- Title Input Area -->
            <div class="px-6 pt-4 pb-2 shrink-0">
              <input
                v-model="activeNote.title"
                @input="onNoteContentInput"
                type="text"
                placeholder="在此输入记事标题..."
                class="w-full bg-transparent text-lg sm:text-xl font-bold text-white placeholder-white/30 focus:outline-none border-b border-white/10 pb-2 focus:border-amber-400/50 transition-colors"
              />
            </div>

            <!-- Note Content Textarea -->
            <div class="flex-1 px-6 py-2 flex flex-col min-h-0">
              <textarea
                v-model="activeNote.content"
                @input="onNoteContentInput"
                placeholder="在这里记录你的私人笔记、重要备忘、账号信息或灵感草稿...（支持自由换行与长篇记录，内容实时自动加密持久化）"
                class="w-full flex-1 bg-transparent text-sm leading-relaxed text-slate-100 placeholder-white/30 focus:outline-none resize-none font-mono selection:bg-amber-500/30 overflow-y-auto custom-scrollbar"
              ></textarea>
            </div>

            <!-- Bottom Status Footer -->
            <div class="px-6 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40 select-none shrink-0">
              <div class="flex items-center space-x-3">
                <span>字数：{{ (activeNote.content || '').length }} 字符</span>
                <span class="hidden sm:inline">行数：{{ (activeNote.content || '').split('\n').length }} 行</span>
              </div>
              <div class="flex items-center space-x-2">
                <span>更新于：{{ formatDetailedDate(activeNote.updatedAt) }}</span>
              </div>
            </div>
          </template>

          <!-- No Note Selected Empty State -->
          <div
            v-else
            class="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/50 space-y-4 select-none"
          >
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg">
              <StickyNote class="w-8 h-8 text-amber-300 opacity-80" />
            </div>
            <div class="max-w-sm space-y-1">
              <h3 class="text-base font-semibold text-white">个人私密记事本</h3>
              <p class="text-xs text-white/50 leading-relaxed">
                记录只有你自己可见的敏感信息、私密备忘与工作灵感。在左侧选择一条记事，或立即新建。
              </p>
            </div>
            <button
              @click="createNewNote"
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-950/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus class="w-4 h-4" />
              <span>新建第一条私密便签</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  NotebookPen, Lock, Download, ShieldCheck, X, Search, Plus,
  FileQuestion, Pin, Tag, Copy, FileDown, Trash2, StickyNote
} from 'lucide-vue-next'
import type { VaultNoteItem } from '../../shared/types'

const props = defineProps<{
  notes: VaultNoteItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save-notes', updated: VaultNoteItem[]): void
  (e: 'toast', message: string): void
  (e: 'lock-vault'): void
}>()

// Preset classification categories
const PRESET_CATEGORIES = ['便签', '私密', '工作', '凭据', '灵感', '待办', '账号']

// Preset morandi / translucent acrylic theme colors
const PRESET_COLORS = [
  '#f59e0b', // Amber / Gold
  '#8b5cf6', // Violet / Purple
  '#10b981', // Emerald / Green
  '#3b82f6', // Sky Blue
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#64748b'  // Slate Gray
]

// Local reactive notes clone
const localNotes = ref<VaultNoteItem[]>([])
const currentNoteId = ref<string | null>(null)
const searchQuery = ref('')
const selectedFilterCategory = ref('全部')
const isAutoSaved = ref(true)

let autoSaveTimer: any = null

onMounted(() => {
  // Deep clone to prevent direct reactive mutation before debounced save
  localNotes.value = JSON.parse(JSON.stringify(props.notes || []))
  if (localNotes.value.length > 0) {
    // Select the first pinned or first newest note
    const sorted = getSortedNotes(localNotes.value)
    currentNoteId.value = sorted[0].id
  }
})

// Sync if props.notes changes externally (e.g. from sync or storage)
watch(
  () => props.notes,
  (newNotes) => {
    if (!newNotes) return
    // Only update if difference in length or ids to avoid disrupting current typing
    const currentIds = localNotes.value.map(n => n.id).join(',')
    const incomingIds = newNotes.map(n => n.id).join(',')
    if (currentIds !== incomingIds) {
      localNotes.value = JSON.parse(JSON.stringify(newNotes))
      if (!currentNoteId.value && localNotes.value.length > 0) {
        currentNoteId.value = localNotes.value[0].id
      }
    }
  },
  { deep: true }
)

const activeNote = computed(() => {
  if (!currentNoteId.value) return null
  return localNotes.value.find(n => n.id === currentNoteId.value) || null
})

// Filter categories
const availableFilterCategories = computed(() => {
  const cats = new Set<string>()
  cats.add('全部')
  localNotes.value.forEach(n => {
    if (n.category) cats.add(n.category)
  })
  return Array.from(cats)
})

function getSortedNotes(list: VaultNoteItem[]): VaultNoteItem[] {
  return [...list].sort((a, b) => {
    // Pinned notes always come first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    // Sort descending by updatedAt
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  })
}

const filteredNotes = computed(() => {
  let list = localNotes.value

  // 1. Category filter
  if (selectedFilterCategory.value !== '全部') {
    list = list.filter(n => n.category === selectedFilterCategory.value)
  }

  // 2. Keyword search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(n => {
      const titleMatch = (n.title || '').toLowerCase().includes(q)
      const contentMatch = (n.content || '').toLowerCase().includes(q)
      const catMatch = (n.category || '').toLowerCase().includes(q)
      return titleMatch || contentMatch || catMatch
    })
  }

  return getSortedNotes(list)
})

function selectNote(id: string) {
  currentNoteId.value = id
}

function createNewNote() {
  const newNote: VaultNoteItem = {
    id: `vnote-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    content: '',
    category: selectedFilterCategory.value !== '全部' ? selectedFilterCategory.value : '便签',
    color: PRESET_COLORS[0],
    isPinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  localNotes.value.unshift(newNote)
  currentNoteId.value = newNote.id
  triggerAutoSave()
  emit('toast', '已创建新记事')
}

function triggerAutoSave() {
  isAutoSaved.value = false
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    emit('save-notes', JSON.parse(JSON.stringify(localNotes.value)))
    isAutoSaved.value = true
  }, 350)
}

function onNoteContentInput() {
  if (!activeNote.value) return
  activeNote.value.updatedAt = Date.now()
  triggerAutoSave()
}

function onNoteFieldChanged() {
  if (!activeNote.value) return
  activeNote.value.updatedAt = Date.now()
  triggerAutoSave()
}

function setNoteColor(color: string) {
  if (!activeNote.value) return
  activeNote.value.color = color
  activeNote.value.updatedAt = Date.now()
  triggerAutoSave()
}

function togglePinCurrentNote() {
  if (!activeNote.value) return
  activeNote.value.isPinned = !activeNote.value.isPinned
  activeNote.value.updatedAt = Date.now()
  triggerAutoSave()
  emit('toast', activeNote.value.isPinned ? '已置顶该记事' : '已取消置顶')
}

function confirmDeleteCurrentNote() {
  if (!activeNote.value) return
  const title = activeNote.value.title.trim() || '无标题记事'
  if (!confirm(`确定要删除记事「${title}」吗？此操作不可逆。`)) return

  const targetId = activeNote.value.id
  localNotes.value = localNotes.value.filter(n => n.id !== targetId)

  // Select next available
  if (localNotes.value.length > 0) {
    currentNoteId.value = localNotes.value[0].id
  } else {
    currentNoteId.value = null
  }

  triggerAutoSave()
  emit('toast', `已删除记事「${title}」`)
}

async function copyCurrentNote() {
  if (!activeNote.value) return
  const text = `${activeNote.value.title ? activeNote.value.title + '\n\n' : ''}${activeNote.value.content || ''}`
  try {
    await navigator.clipboard.writeText(text)
    emit('toast', '记事内容已成功复制到剪贴板')
  } catch {
    emit('toast', '复制失败，请手动划选复制')
  }
}

function exportCurrentNote() {
  if (!activeNote.value) return
  const note = activeNote.value
  const filename = `${note.title.trim() || '记事备忘'}_${new Date().toISOString().slice(0, 10)}.txt`
  const content = `# ${note.title || '无标题记事'}\n分类: ${note.category || '便签'} | 更新于: ${formatDetailedDate(note.updatedAt)}\n\n${note.content || ''}`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  emit('toast', `已导出便签「${filename}」`)
}

function exportAllNotes() {
  if (localNotes.value.length === 0) {
    emit('toast', '暂无记事可导出')
    return
  }

  let text = `# MyTabs 个人私密记事本备份导出\n导出时间: ${new Date().toLocaleString()}\n记事总数: ${localNotes.value.length} 条\n\n`
  localNotes.value.forEach((note, index) => {
    text += `--------------------------------------------------\n`
    text += `【${index + 1}】${note.title || '（无标题记事）'}\n`
    text += `分类: ${note.category || '便签'} | 状态: ${note.isPinned ? '已置顶' : '常规'} | 更新于: ${formatDetailedDate(note.updatedAt)}\n\n`
    text += `${note.content || '（空内容）'}\n\n`
  })

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mytabs_vault_notes_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
  emit('toast', '已成功导出全部个人私密记事本')
}

function handleLockAndExit() {
  emit('close')
  emit('lock-vault')
}

function getPreviewText(content?: string): string {
  if (!content) return ''
  return content.replace(/\s+/g, ' ').trim()
}

function formatRelativeTime(ts?: number): string {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  const d = new Date(ts)
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function formatDetailedDate(ts?: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
}
</style>
