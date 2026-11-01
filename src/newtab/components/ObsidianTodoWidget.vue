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
    <!-- 1. Collapsed State: Compact Drag Pill -->
    <div
      v-if="isCollapsed"
      @pointerdown="onPointerDown"
      class="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-panel border border-white/20 shadow-xl cursor-grab active:cursor-grabbing hover:bg-white/20 transition-colors"
      title="按住可拖动位置，点击展开 Obsidian 待办"
    >
      <GripHorizontal class="w-3.5 h-3.5 text-white/50" />
      <span class="text-xs font-medium text-white flex items-center gap-1.5">
        <CheckSquare class="w-3.5 h-3.5 text-indigo-400" />
        <span>Obsidian 待办</span>
      </span>
      <span
        v-if="uncompletedCount > 0"
        class="px-1.5 py-0.2 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[10px] text-indigo-200 font-mono"
      >
        {{ uncompletedCount }}
      </span>
      <button
        @click.stop="isCollapsed = false; saveState()"
        class="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        title="展开待办卡片"
      >
        <Maximize2 class="w-3 h-3" />
      </button>
    </div>

    <!-- 2. Expanded State: Full Draggable Card -->
    <div
      v-else
      class="w-[360px] sm:w-[390px] max-h-[520px] rounded-3xl glass-panel p-4 shadow-2xl border border-white/15 flex flex-col transition-all duration-200"
    >
      <!-- Header: Drag Handle, Title, Status & Controls -->
      <div
        @pointerdown="onPointerDown"
        class="flex items-center justify-between pb-2.5 border-b border-white/10 cursor-grab active:cursor-grabbing shrink-0"
        title="按住此处可任意拖拽位置（双击复位）"
        @dblclick="resetPosition"
      >
        <!-- Drag Handle + Title -->
        <div class="flex items-center space-x-2 min-w-0">
          <GripHorizontal class="w-3.5 h-3.5 text-white/40 shrink-0" />
          <div class="flex items-center space-x-1.5 min-w-0">
            <CheckSquare class="w-4 h-4 text-indigo-400 shrink-0" />
            <span class="text-xs font-semibold text-white truncate">Obsidian 待办清单</span>
          </div>
          <!-- Live pulse dot -->
          <span
            v-if="hasBoundFile"
            class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"
            title="实时关联 dashboard.md"
          ></span>
        </div>

        <!-- Controls: Refresh, Pick File, Minimize -->
        <div class="flex items-center space-x-1 shrink-0">
          <button
            @click.stop="loadTodos"
            :disabled="isLoading"
            class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="刷新待办"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          </button>
          <button
            @click.stop="handlePickFile"
            class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            :title="hasBoundFile ? '更换关联的 dashboard.md' : '选择 dashboard.md 授权'"
          >
            <FolderOpen class="w-3.5 h-3.5 text-amber-300" />
          </button>
          <button
            @click.stop="isCollapsed = true; saveState()"
            class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="最小化"
          >
            <Minimize2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- File Path & Sync Info Banner -->
      <div class="py-1.5 px-2 mt-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <span class="font-mono truncate max-w-[220px]" :title="fileMeta.filePath">
          {{ fileMeta.filePath || 'D:\\OneDrive\\obsidian\\dashboard.md' }}
        </span>
        <span class="text-indigo-300 shrink-0">
          {{ hasBoundFile ? '已双向同步' : '未授权本地文件' }}
        </span>
      </div>

      <!-- Unauthorized State Guide Banner -->
      <div v-if="!hasBoundFile" class="my-3 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-2.5">
        <div class="w-10 h-10 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
          <FileText class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-semibold text-white">关联本地 dashboard.md</div>
          <div class="text-[11px] text-indigo-200/70 mt-0.5">
            授权一次即可在桌面直接查看、勾选与新增 Obsidian 待办
          </div>
        </div>
        <button
          @click="handlePickFile"
          class="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5"
        >
          <FolderOpen class="w-4 h-4" />
          <span>选择 D:\OneDrive\obsidian\dashboard.md</span>
        </button>
      </div>

      <!-- Group & Status Filter Tabs -->
      <div v-if="hasBoundFile" class="flex items-center space-x-1 pt-2 pb-1.5 overflow-x-auto scrollbar-none shrink-0">
        <button
          v-for="grp in groupFilters"
          :key="grp.id"
          @click="selectedGroup = grp.id"
          :class="[
            'px-2 py-0.8 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1',
            selectedGroup === grp.id
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
          ]"
        >
          <span>{{ grp.name }}</span>
          <span class="text-[9px] opacity-70">({{ grp.count }})</span>
        </button>
      </div>

      <!-- Task Items List (Scrollable) -->
      <div v-if="hasBoundFile" class="flex-1 overflow-y-auto space-y-1.5 pr-1 my-2 scrollbar-thin">
        <div
          v-for="task in displayedTasks"
          :key="task.id"
          class="group flex items-start space-x-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all text-xs"
        >
          <!-- Custom Checkbox -->
          <button
            @click.stop="toggleTask(task)"
            class="w-4 h-4 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-colors"
            :class="[
              task.done
                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                : 'border-white/30 hover:border-indigo-400 bg-black/20'
            ]"
          >
            <Check v-if="task.done" class="w-3 h-3 stroke-[3]" />
          </button>

          <!-- Task Text & Group Badge -->
          <div class="flex-1 min-w-0">
            <span
              @click="toggleTask(task)"
              :class="[
                'cursor-pointer transition-all leading-relaxed block break-words',
                task.done ? 'line-through text-slate-400' : 'text-slate-100 hover:text-white'
              ]"
            >
              {{ task.text }}
            </span>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-[9px] text-slate-400 px-1 rounded bg-white/5 border border-white/10">
                {{ task.group }}
              </span>
            </div>
          </div>

          <!-- Delete Task Button -->
          <button
            @click.stop="deleteTask(task)"
            class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-all shrink-0"
            title="从 dashboard.md 中删除"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>

        <!-- Empty state when no tasks match -->
        <div v-if="displayedTasks.length === 0" class="py-8 text-center text-xs text-slate-400">
          <span>暂无待办事项</span>
        </div>
      </div>

      <!-- Quick Add Task Input at Bottom -->
      <div v-if="hasBoundFile" class="pt-2 border-t border-white/10 shrink-0">
        <form @submit.prevent="handleAddTask" class="flex items-center space-x-1.5">
          <input
            type="text"
            v-model="newTaskText"
            placeholder="+ 添加新待办，回车同步至 dashboard.md"
            class="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            :disabled="!newTaskText.trim()"
            class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
          >
            添加
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  GripHorizontal, Maximize2, Minimize2, CheckSquare, RefreshCw,
  FolderOpen, FileText, Check, Trash2
} from 'lucide-vue-next'
import {
  readObsidianDashboardContent,
  writeObsidianDashboardContent,
  pickObsidianDashboardFile,
  getObsidianMeta,
  parseObsidianTodos,
  toggleTaskInMarkdown,
  addTaskToMarkdown,
  deleteTaskFromMarkdown,
  type ObsidianTaskItem,
  type ObsidianGroupItem,
  type ObsidianMeta
} from '../../shared/obsidian'

// 1. Draggable & Collapsible State
const pos = ref({ x: 24, y: 120 })
const isDragging = ref(false)
const isCollapsed = ref(false)
const dragStart = { x: 0, y: 0 }
const widgetStart = { x: 0, y: 0 }
const widgetRef = ref<HTMLElement | null>(null)

// 2. Data State
const rawMarkdown = ref('')
const groups = ref<ObsidianGroupItem[]>([])
const allTasks = ref<ObsidianTaskItem[]>([])
const fileMeta = ref<ObsidianMeta>({
  fileName: 'dashboard.md',
  filePath: 'D:\\OneDrive\\obsidian\\dashboard.md',
  hasHandle: false
})
const isLoading = ref(false)
const selectedGroup = ref('all')
const newTaskText = ref('')

const hasBoundFile = computed(() => {
  return fileMeta.value.hasHandle || allTasks.value.length > 0
})

const uncompletedCount = computed(() => {
  return allTasks.value.filter(t => !t.done).length
})

const groupFilters = computed(() => {
  const list = [
    { id: 'all', name: '全部', count: allTasks.value.length }
  ]
  for (const g of groups.value) {
    list.push({
      id: g.title,
      name: g.title,
      count: g.tasks.length
    })
  }
  return list
})

const displayedTasks = computed(() => {
  if (selectedGroup.value === 'all') {
    return allTasks.value
  }
  return allTasks.value.filter(t => t.group === selectedGroup.value)
})

onMounted(async () => {
  loadSavedState()
  await refreshMeta()
  await loadTodos()
})

async function refreshMeta() {
  fileMeta.value = await getObsidianMeta()
}

async function loadTodos() {
  isLoading.value = true
  try {
    const res = await readObsidianDashboardContent()
    if (res.content) {
      rawMarkdown.value = res.content
      const parsed = parseObsidianTodos(res.content)
      groups.value = parsed.groups
      allTasks.value = parsed.allTasks
    }
  } catch (err) {
    console.warn('Load obsidian todos failed:', err)
  } finally {
    isLoading.value = false
    await refreshMeta()
  }
}

async function handlePickFile() {
  const res = await pickObsidianDashboardFile()
  if (res.success && res.content) {
    rawMarkdown.value = res.content
    const parsed = parseObsidianTodos(res.content)
    groups.value = parsed.groups
    allTasks.value = parsed.allTasks
    await refreshMeta()
  } else if (res.error && res.error !== '已取消选择文件') {
    alert(res.error)
  }
}

async function toggleTask(task: ObsidianTaskItem) {
  if (!rawMarkdown.value) return

  // 1. Optimistic update
  task.done = !task.done

  // 2. Update markdown
  const updatedMarkdown = toggleTaskInMarkdown(rawMarkdown.value, { ...task, done: !task.done })
  rawMarkdown.value = updatedMarkdown

  // 3. Write back to dashboard.md
  await writeObsidianDashboardContent(updatedMarkdown)
}

async function handleAddTask() {
  const text = newTaskText.value.trim()
  if (!text || !rawMarkdown.value) return

  const targetGrp = selectedGroup.value !== 'all' ? selectedGroup.value : (groups.value[0]?.title || 'Getting Started')
  const updatedMarkdown = addTaskToMarkdown(rawMarkdown.value, text, targetGrp)
  rawMarkdown.value = updatedMarkdown
  newTaskText.value = ''

  // Refresh tasks
  const parsed = parseObsidianTodos(updatedMarkdown)
  groups.value = parsed.groups
  allTasks.value = parsed.allTasks

  // Write back to dashboard.md
  await writeObsidianDashboardContent(updatedMarkdown)
}

async function deleteTask(task: ObsidianTaskItem) {
  if (!confirm(`确定在 dashboard.md 中删除此待办？\n"${task.text}"`)) return

  const updatedMarkdown = deleteTaskFromMarkdown(rawMarkdown.value, task)
  rawMarkdown.value = updatedMarkdown

  // Refresh tasks
  const parsed = parseObsidianTodos(updatedMarkdown)
  groups.value = parsed.groups
  allTasks.value = parsed.allTasks

  // Write back to dashboard.md
  await writeObsidianDashboardContent(updatedMarkdown)
}

// Drag & Positioning
function loadSavedState() {
  try {
    const savedPos = localStorage.getItem('mytabs_obsidian_widget_pos')
    if (savedPos) {
      const parsed = JSON.parse(savedPos)
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        const maxX = Math.max(10, window.innerWidth - 100)
        const maxY = Math.max(10, window.innerHeight - 60)
        pos.value = {
          x: Math.min(Math.max(10, parsed.x), maxX),
          y: Math.min(Math.max(10, parsed.y), maxY)
        }
      }
    }
    const savedCollapsed = localStorage.getItem('mytabs_obsidian_widget_collapsed')
    if (savedCollapsed !== null) {
      isCollapsed.value = JSON.parse(savedCollapsed)
    }
  } catch {}
}

function saveState() {
  try {
    localStorage.setItem('mytabs_obsidian_widget_pos', JSON.stringify(pos.value))
    localStorage.setItem('mytabs_obsidian_widget_collapsed', JSON.stringify(isCollapsed.value))
  } catch {}
}

function resetPosition() {
  pos.value = { x: 24, y: 120 }
  saveState()
}

function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('button, input, a, select')) return
  isDragging.value = true
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  widgetStart.x = pos.value.x
  widgetStart.y = pos.value.y

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  const maxX = Math.max(10, window.innerWidth - (isCollapsed.value ? 140 : 380))
  const maxY = Math.max(10, window.innerHeight - (isCollapsed.value ? 50 : 300))
  pos.value = {
    x: Math.min(Math.max(10, widgetStart.x + dx), maxX),
    y: Math.min(Math.max(10, widgetStart.y + dy), maxY)
  }
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  saveState()
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  saveState()
}

defineExpose({
  toggleCollapse,
  isCollapsed,
  loadTodos
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}
</style>
