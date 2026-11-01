/**
 * Obsidian Dashboard (dashboard.md) Two-Way Sync Service
 * Seamlessly integrates with D:\OneDrive\obsidian\dashboard.md under ## Todo
 */
import { get, set } from 'idb-keyval'

const OBSIDIAN_HANDLE_KEY = 'mytabs_obsidian_file_handle'
const OBSIDIAN_CACHE_KEY = 'mytabs_obsidian_dashboard_cache'
const OBSIDIAN_META_KEY = 'mytabs_obsidian_meta'

export interface ObsidianTaskItem {
  id: string
  rawLine: string
  text: string
  done: boolean
  group: string
}

export interface ObsidianGroupItem {
  title: string
  id?: string
  tasks: ObsidianTaskItem[]
}

export interface ObsidianMeta {
  fileName: string
  filePath?: string
  lastSyncTime?: number
  hasHandle: boolean
}

/**
 * Pick local dashboard.md file using File System Access API
 */
export async function pickObsidianDashboardFile(): Promise<{ success: boolean; error?: string; content?: string }> {
  try {
    if (typeof window === 'undefined' || !('showOpenFilePicker' in window)) {
      return { success: false, error: '当前浏览器环境不支持本地文件授权' }
    }

    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'Obsidian Dashboard Markdown',
          accept: {
            'text/markdown': ['.md', '.markdown'],
            'text/plain': ['.txt']
          }
        }
      ],
      multiple: false
    })

    if (!handle) {
      return { success: false, error: '未选择文件' }
    }

    // Verify readwrite permission
    if (handle.requestPermission) {
      const perm = await handle.requestPermission({ mode: 'readwrite' })
      if (perm !== 'granted') {
        return { success: false, error: '未授予文件读写权限' }
      }
    }

    // Save handle to IndexedDB
    await set(OBSIDIAN_HANDLE_KEY, handle)

    // Read initial content
    const file = await handle.getFile()
    const content = await file.text()

    // Cache content & meta
    const meta: ObsidianMeta = {
      fileName: handle.name,
      filePath: 'D:\\OneDrive\\obsidian\\dashboard.md',
      lastSyncTime: Date.now(),
      hasHandle: true
    }
    await set(OBSIDIAN_META_KEY, meta)
    await set(OBSIDIAN_CACHE_KEY, content)

    return { success: true, content }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: '已取消选择文件' }
    }
    return { success: false, error: err.message || '选取文件失败' }
  }
}

/**
 * Get stored Obsidian file metadata
 */
export async function getObsidianMeta(): Promise<ObsidianMeta> {
  const meta = await get<ObsidianMeta>(OBSIDIAN_META_KEY)
  const handle = await get<any>(OBSIDIAN_HANDLE_KEY)
  return {
    fileName: meta?.fileName || 'dashboard.md',
    filePath: meta?.filePath || 'D:\\OneDrive\\obsidian\\dashboard.md',
    lastSyncTime: meta?.lastSyncTime,
    hasHandle: !!handle
  }
}

/**
 * Read content from local dashboard.md file
 */
export async function readObsidianDashboardContent(): Promise<{ content: string; fromCache: boolean; error?: string }> {
  try {
    const handle = await get<any>(OBSIDIAN_HANDLE_KEY)
    if (handle) {
      // Check permission
      let hasPerm = true
      if (handle.queryPermission) {
        const state = await handle.queryPermission({ mode: 'readwrite' })
        if (state !== 'granted') {
          hasPerm = false
        }
      }

      if (hasPerm) {
        const file = await handle.getFile()
        const text = await file.text()
        await set(OBSIDIAN_CACHE_KEY, text)
        await set(OBSIDIAN_META_KEY, {
          fileName: handle.name,
          filePath: 'D:\\OneDrive\\obsidian\\dashboard.md',
          lastSyncTime: Date.now(),
          hasHandle: true
        })
        return { content: text, fromCache: false }
      }
    }
  } catch (err) {
    console.warn('Read live obsidian handle failed, trying cache:', err)
  }

  // Fallback to cached content
  const cached = await get<string>(OBSIDIAN_CACHE_KEY)
  if (cached) {
    return { content: cached, fromCache: true }
  }

  return { content: '', fromCache: false, error: '尚未关联本地 dashboard.md 文件' }
}

/**
 * Write updated markdown back to local dashboard.md file
 */
export async function writeObsidianDashboardContent(newContent: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Update cache first
    await set(OBSIDIAN_CACHE_KEY, newContent)

    const handle = await get<any>(OBSIDIAN_HANDLE_KEY)
    if (!handle) {
      return { success: false, error: '未找到文件授权句柄，请重新关联文件' }
    }

    if (handle.requestPermission) {
      const perm = await handle.requestPermission({ mode: 'readwrite' })
      if (perm !== 'granted') {
        return { success: false, error: '没有文件写入权限' }
      }
    }

    const writable = await handle.createWritable()
    await writable.write(newContent)
    await writable.close()

    await set(OBSIDIAN_META_KEY, {
      fileName: handle.name,
      filePath: 'D:\\OneDrive\\obsidian\\dashboard.md',
      lastSyncTime: Date.now(),
      hasHandle: true
    })

    return { success: true }
  } catch (err: any) {
    console.error('Write obsidian dashboard failed:', err)
    return { success: false, error: err.message || '写入文件失败' }
  }
}

/**
 * Parse groups and tasks under ## Todo from full markdown text
 */
export function parseObsidianTodos(markdown: string): { groups: ObsidianGroupItem[]; allTasks: ObsidianTaskItem[] } {
  if (!markdown) return { groups: [], allTasks: [] }

  // 1. Locate ## Todo block
  const lines = markdown.split(/\r?\n/)
  let inTodoSection = false
  const todoLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Detect ## Todo (case-insensitive)
    if (/^##\s+Todo/i.test(trimmed)) {
      inTodoSection = true
      continue
    }

    // Next ## section ends Todo
    if (inTodoSection && /^##\s+[^\s#]/i.test(trimmed)) {
      break
    }

    if (inTodoSection) {
      todoLines.push(line)
    }
  }

  // 2. Parse groups (### <Title>) and task checkboxes (- [ ] / - [x])
  const groups: ObsidianGroupItem[] = []
  const allTasks: ObsidianTaskItem[] = []

  let currentGroup: ObsidianGroupItem = {
    title: '未分类待办',
    tasks: []
  }

  let taskCounter = 0

  for (const line of todoLines) {
    const trimmed = line.trim()

    // Subheading: ### <Group Name>
    if (/^###\s+(.*)/.test(trimmed)) {
      const titleMatch = trimmed.match(/^###\s+(.*)/)
      const groupTitle = titleMatch ? titleMatch[1].trim() : '待办'

      // If current group has tasks, push it
      if (currentGroup.tasks.length > 0) {
        groups.push(currentGroup)
      }

      currentGroup = {
        title: groupTitle,
        tasks: []
      }
      continue
    }

    // Group ID line e.g. "id: demo-todo-1"
    if (/^id:\s*([^\s]+)/.test(trimmed)) {
      currentGroup.id = trimmed.match(/^id:\s*([^\s]+)/)?.[1]
      continue
    }

    // Task checkbox: - [ ] or - [x] or - [X]
    const taskMatch = line.match(/^(\s*[-*]\s*\[([ xX])\]\s*)(.*)/)
    if (taskMatch) {
      taskCounter++
      const isDone = taskMatch[2].toLowerCase() === 'x'
      const taskText = taskMatch[3].trim()

      const taskItem: ObsidianTaskItem = {
        id: `task-${taskCounter}-${Date.now()}`,
        rawLine: line,
        text: taskText,
        done: isDone,
        group: currentGroup.title
      }

      currentGroup.tasks.push(taskItem)
      allTasks.push(taskItem)
    }
  }

  // Push last group if it has tasks
  if (currentGroup.tasks.length > 0) {
    groups.push(currentGroup)
  }

  return { groups, allTasks }
}

/**
 * Toggle task completion state (- [ ] <-> - [x]) directly in markdown
 */
export function toggleTaskInMarkdown(
  fullMarkdown: string,
  targetTask: ObsidianTaskItem
): string {
  const lines = fullMarkdown.split(/\r?\n/)
  const isTargetDone = targetTask.done
  const searchPattern = new RegExp(`[-*]\\s*\\[([ xX])\\]\\s*${escapeRegExp(targetTask.text)}`, 'i')

  let toggled = false
  const updatedLines = lines.map((line) => {
    if (!toggled && searchPattern.test(line)) {
      toggled = true
      if (isTargetDone) {
        // Toggle to uncompleted
        return line.replace(/\[[xX]\]/i, '[ ]')
      } else {
        // Toggle to completed
        return line.replace(/\[\s*\]/, '[x]')
      }
    }
    return line
  })

  return updatedLines.join('\n')
}

/**
 * Add a new task (- [ ] text) under ## Todo in the markdown
 */
export function addTaskToMarkdown(
  fullMarkdown: string,
  taskText: string,
  targetGroupName?: string
): string {
  const cleanText = taskText.trim()
  if (!cleanText) return fullMarkdown

  const lines = fullMarkdown.split(/\r?\n/)
  let todoSectionStart = -1
  let todoSectionEnd = lines.length

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (/^##\s+Todo/i.test(trimmed)) {
      todoSectionStart = i
      continue
    }
    if (todoSectionStart !== -1 && /^##\s+[^\s#]/i.test(trimmed)) {
      todoSectionEnd = i
      break
    }
  }

  const newTaskLine = `- [ ] ${cleanText}`

  // If ## Todo doesn't exist, append it
  if (todoSectionStart === -1) {
    return `${fullMarkdown}\n\n## Todo\n\n### 待办清单\nid: card-${Date.now().toString(36)}\ntype: task\n${newTaskLine}\n`
  }

  // If targetGroupName is provided, find that ### group
  let targetInsertIndex = -1
  if (targetGroupName) {
    for (let i = todoSectionStart; i < todoSectionEnd; i++) {
      if (lines[i].trim().toLowerCase() === `### ${targetGroupName.toLowerCase()}`) {
        // Find end of this subsection
        let j = i + 1
        while (j < todoSectionEnd && !/^###\s+/i.test(lines[j].trim())) {
          j++
        }
        targetInsertIndex = j
        break
      }
    }
  }

  // Fallback insert before next ## section
  if (targetInsertIndex === -1) {
    targetInsertIndex = todoSectionEnd
  }

  lines.splice(targetInsertIndex, 0, newTaskLine)
  return lines.join('\n')
}

/**
 * Delete a task line from the markdown
 */
export function deleteTaskFromMarkdown(
  fullMarkdown: string,
  targetTask: ObsidianTaskItem
): string {
  const lines = fullMarkdown.split(/\r?\n/)
  const searchPattern = new RegExp(`[-*]\\s*\\[([ xX])\\]\\s*${escapeRegExp(targetTask.text)}`, 'i')

  let deleted = false
  const filtered = lines.filter((line) => {
    if (!deleted && searchPattern.test(line)) {
      deleted = true
      return false
    }
    return true
  })

  return filtered.join('\n')
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
