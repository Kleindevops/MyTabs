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
  lastSyncTime?: number
  autoSync: boolean
}

export interface AppSettings {
  version: string
  categories: CategoryItem[]
  bookmarks: BookmarkItem[]
  wallpaper: WallpaperConfig
  ai: AISettings
  privacyRules: PrivacyRule[]
  oneDrive: OneDriveSyncConfig
  salt?: string // PBKDF2 salt for private vault
  vaultVerifier?: string // Encrypted test string to verify unlock password
}
