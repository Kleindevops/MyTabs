import { get, set, del } from 'idb-keyval'
import type { AppSettings } from './types'

const ONEDRIVE_HANDLE_KEY = 'mytabs_onedrive_dir_handle'
export const DEFAULT_BACKUP_FILENAME = 'mytabs_backup.json'

export function getEffectiveFileName(fileName?: string): string {
  const name = fileName?.trim()
  if (!name) return DEFAULT_BACKUP_FILENAME
  return name.endsWith('.json') ? name : `${name}.json`
}

export interface BackupFileInfo {
  exists: boolean
  fileName: string
  lastModified?: number
  size?: number
  bookmarkCount?: number
  categoryCount?: number
  data?: AppSettings
  error?: string
}

export async function inspectBackupFile(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<BackupFileInfo> {
  const effectiveName = getEffectiveFileName(fileName)
  try {
    const fileHandle = await (dirHandle as any).getFileHandle(effectiveName, { create: false })
    const file = await fileHandle.getFile()
    const text = await file.text()
    let data: AppSettings | undefined
    try {
      data = JSON.parse(text)
    } catch {
      // JSON parse error
    }

    return {
      exists: true,
      fileName: effectiveName,
      lastModified: file.lastModified,
      size: file.size,
      bookmarkCount: Array.isArray(data?.bookmarks) ? data.bookmarks.length : undefined,
      categoryCount: Array.isArray(data?.categories) ? data.categories.length : undefined,
      data
    }
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { exists: false, fileName: effectiveName }
    }
    return { exists: false, fileName: effectiveName, error: err.message }
  }
}

export async function pickOneDriveDirectory(
  targetFileName?: string
): Promise<{ success: boolean; dirName?: string; fileInfo?: BackupFileInfo; error?: string }> {
  try {
    if (!('showDirectoryPicker' in window)) {
      return { success: false, error: '您的浏览器不支持文件系统访问 API' }
    }

    const dirHandle = await (window as any).showDirectoryPicker({
      id: 'mytabs_sync_dir',
      mode: 'readwrite',
      startIn: 'documents'
    })

    // Verify write permission
    const options = { mode: 'readwrite' }
    if ((await dirHandle.queryPermission(options)) !== 'granted') {
      const status = await dirHandle.requestPermission(options)
      if (status !== 'granted') {
        return { success: false, error: '未授予目录读写权限' }
      }
    }

    await set(ONEDRIVE_HANDLE_KEY, dirHandle)

    // Inspect if backup file exists in the directory
    const effectiveName = getEffectiveFileName(targetFileName)
    const fileInfo = await inspectBackupFile(dirHandle, effectiveName)

    return { success: true, dirName: dirHandle.name, fileInfo }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: '用户取消了选择' }
    }
    return { success: false, error: err.message || '选择文件夹失败' }
  }
}

export async function getOneDriveDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await get<FileSystemDirectoryHandle>(ONEDRIVE_HANDLE_KEY)
    if (!handle) return null

    // Check if permission still valid
    const status = await (handle as any).queryPermission({ mode: 'readwrite' })
    if (status === 'granted') {
      return handle
    }
    return handle // Return handle, may require user click to requestPermission
  } catch {
    return null
  }
}

export async function writeBackupToOneDrive(
  settings: AppSettings,
  customFileName?: string
): Promise<{ success: boolean; error?: string; timestamp?: number }> {
  try {
    const dirHandle = await getOneDriveDirectoryHandle()
    if (!dirHandle) {
      return { success: false, error: '未授权同步与备份目录' }
    }

    const status = await (dirHandle as any).queryPermission({ mode: 'readwrite' })
    if (status !== 'granted') {
      const reqStatus = await (dirHandle as any).requestPermission({ mode: 'readwrite' })
      if (reqStatus !== 'granted') {
        return { success: false, error: '未授予写入权限，请重新授权' }
      }
    }

    const effectiveName = getEffectiveFileName(customFileName || settings.oneDrive?.backupFileName)
    const fileHandle = await (dirHandle as any).getFileHandle(effectiveName, { create: true })
    const writable = await fileHandle.createWritable()

    // Stamp current sync time into the payload so backups carry metadata
    const payload = {
      ...settings,
      oneDrive: {
        ...settings.oneDrive,
        lastSyncTime: Date.now()
      }
    }

    const content = JSON.stringify(payload, null, 2)
    await writable.write(content)
    await writable.close()

    const timestamp = Date.now()
    return { success: true, timestamp }
  } catch (err: any) {
    return { success: false, error: err.message || '写入备份文件失败' }
  }
}

export async function readBackupFromOneDrive(
  customFileName?: string
): Promise<{ success: boolean; data?: AppSettings; lastModified?: number; error?: string }> {
  try {
    const dirHandle = await getOneDriveDirectoryHandle()
    if (!dirHandle) {
      return { success: false, error: '未授权同步与备份目录' }
    }

    const effectiveName = getEffectiveFileName(customFileName)
    const fileInfo = await inspectBackupFile(dirHandle, effectiveName)
    if (!fileInfo.exists || !fileInfo.data) {
      return { success: false, error: fileInfo.error || `未在目录中找到备份文件 ${effectiveName}` }
    }

    return {
      success: true,
      data: fileInfo.data,
      lastModified: fileInfo.lastModified
    }
  } catch (err: any) {
    return { success: false, error: err.message || '读取备份文件失败' }
  }
}

export async function checkExternalUpdate(
  lastSyncTime?: number,
  customFileName?: string
): Promise<{ hasUpdate: boolean; remoteModified?: number; bookmarkCount?: number }> {
  try {
    const dirHandle = await getOneDriveDirectoryHandle()
    if (!dirHandle) return { hasUpdate: false }

    const effectiveName = getEffectiveFileName(customFileName)
    const fileInfo = await inspectBackupFile(dirHandle, effectiveName)
    if (!fileInfo.exists || !fileInfo.lastModified) {
      return { hasUpdate: false }
    }

    // If file on disk is at least 2 seconds newer than our last sync time
    if (fileInfo.lastModified > (lastSyncTime || 0) + 2000) {
      return {
        hasUpdate: true,
        remoteModified: fileInfo.lastModified,
        bookmarkCount: fileInfo.bookmarkCount
      }
    }
    return { hasUpdate: false }
  } catch {
    return { hasUpdate: false }
  }
}

export async function removeOneDriveBinding(): Promise<void> {
  await del(ONEDRIVE_HANDLE_KEY)
}
