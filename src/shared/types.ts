export interface BookmarkItem {
  id: string
  title: string
  url: string
  icon?: string
  bgColor?: string
  categoryId: string
  isPrivate?: boolean
  encryptedData?: string // Ciphertext if sensitive
  openInIncognito?: boolean // Open in private incognito window
}

export interface CategoryItem {
  id: string
  name: string
  icon?: string
  isPrivate?: boolean
  isLocked?: boolean
}

export interface SearchEngine {
  id: string
  name: string
  url: string
  icon: string
  placeholder: string
}

export interface WallpaperConfig {
  type: 'bing' | 'color' | 'unsplash' | 'custom'
  value: string
  blur: number
  mask: number
  isPinned?: boolean
  pinnedTitle?: string
  pinnedDate?: string
  pinnedUrl?: string
}

export interface AISettings {
  provider: 'deepseek' | 'openai' | 'moonshot' | 'zhipu' | 'siliconflow' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
}

export interface PrivacyRule {
  id: string
  pattern: string
  action: 'delete_history' | 'incognito'
  enabled: boolean
}

export interface SniffedResource {
  id: string
  url: string
  tabId: number
  filename: string
  title?: string
  type: 'video' | 'audio' | 'image' | 'm3u8' | 'other'
  size?: number
  sizeFormatted?: string
  mime?: string
  timestamp: number
  isChunk?: boolean
}

export interface OneDriveSyncConfig {
  hasDirectory: boolean
  directoryName?: string
  backupFileName?: string // 自定义备份文件名，默认 'mytabs_backup.json'
  lastSyncTime?: number   // 上次同步/备份落盘时间
  lastModifiedTime?: number // 本地配置最后修改时间
  autoSync: boolean
}

export type PetSkin = 'cat' | 'shiba' | 'rabbit' | 'robot'
export type PetStatus = 'idle' | 'focus' | 'reminding' | 'resting' | 'celebrating'

export interface ScheduleItem {
  id: string
  title: string
  startTime: string // "HH:mm" (24-hour format e.g. "09:00")
  endTime: string   // "HH:mm" (24-hour format e.g. "11:30")
  tag?: string      // "专注" | "工作" | "学习" | "休息" | "生活" | "规划" | etc.
  color?: string    // Hex code, e.g. "#6366f1"
  promptMessage?: string // 宠物询问提醒词
  enabled: boolean
  sound?: boolean
  remindMinutesBefore?: number // 0 = 准时, 5 = 提前5分钟
  completedDates?: string[]    // YYYY-MM-DD
}

export interface PetConfig {
  enabled: boolean
  visible: boolean             // 随时显示/隐藏宠物
  name: string                 // 宠物昵称，如 "小布丁"
  skin: PetSkin                // 皮肤外观
  soundEnabled: boolean        // 是否播放提示音
  soundVolume: number          // 音量 0 ~ 100
  notificationEnabled: boolean // 是否发送系统通知（跨标签页提醒）
  position: { x: number; y: number } // 屏幕拖拽坐标
  size: 'small' | 'medium' | 'large' // 尺寸
}

export type FixedReminderRepeat = 'none' | 'half_year' | 'yearly' | 'quarterly' | 'monthly'

export interface FixedReminderItem {
  id: string
  title: string
  targetDate: string // "YYYY-MM-DD"
  repeat: FixedReminderRepeat
  promptMessage?: string // 宠物提醒词
  url?: string // 相关快捷网址（可选，例如域名管理控制台）
  enabled: boolean
  lastNotifiedDate?: string // 上次提醒日期 "YYYY-MM-DD"，防止同一天内打开多个标签页反复弹窗打扰
  completedAt?: string // 上次标记完成时间
}

export interface AppSettings {
  version: string
  categories: CategoryItem[]
  bookmarks: BookmarkItem[]
  wallpaper: WallpaperConfig
  ai: AISettings
  privacyRules: PrivacyRule[]
  oneDrive: OneDriveSyncConfig
  showHotNews?: boolean
  salt?: string // PBKDF2 salt for private vault
  vaultVerifier?: string // Encrypted test string to verify unlock password
  vaultAutoLockMinutes?: number // 个人空间解开后再次自动锁上的时间限制 (分钟，0为不自动上锁)
  pet?: PetConfig
  schedules?: ScheduleItem[]
  fixedReminders?: FixedReminderItem[]
}
