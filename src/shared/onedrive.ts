import { get, set, del } from 'idb-keyval'
import type { AppSettings } from './types'

const ONEDRIVE_HANDLE_KEY = 'mytabs_onedrive_dir_handle'
const BACKUP_FILENAME = 'mytabs_backup.json'

export async function pickOneDriveDirectory(): Promise<{ success: boolean; dirName?: string; error?: string }> {
  try {
    if (!('showDirectoryPicker' in window)) {
      return { success: false, error: '您的浏览器不支持文件系统访问 API' }
    }

    const dirHandle = await (window as any).showDirectoryPicker({
      id: 'mytabs_onedrive_dir',
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
    return { success: true, dirName: dirHandle.name }
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

export async function writeBackupToOneDrive(settings: AppSettings): Promise<{ success: boolean; error?: string; timestamp?: number }> {
  try {
    const dirHandle = await getOneDriveDirectoryHandle()
    if (!dirHandle) {
      return { success: false, error: '未授权 OneDrive 备份目录' }
    }

    const status = await (dirHandle as any).queryPermission({ mode: 'readwrite' })
    if (status !== 'granted') {
      const reqStatus = await (dirHandle as any).requestPermission({ mode: 'readwrite' })
      if (reqStatus !== 'granted') {
        return { success: false, error: '未授予写入权限，请重新授权' }
      }
    }

    const fileHandle = await (dirHandle as any).getFileHandle(BACKUP_FILENAME, { create: true })
    const writable = await fileHandle.createWritable()
    const content = JSON.stringify(settings, null, 2)
    await writable.write(content)
    await writable.close()

    const timestamp = Date.now()
    return { success: true, timestamp }
  } catch (err: any) {
    return { success: false, error: err.message || '写入备份文件失败' }
  }
}

export async function readBackupFromOneDrive(): Promise<{ success: boolean; data?: AppSettings; error?: string }> {
  try {
    const dirHandle = await getOneDriveDirectoryHandle()
    if (!dirHandle) {
      return { success: false, error: '未授权 OneDrive 备份目录' }
    }

    const fileHandle = await (dirHandle as any).getFileHandle(BACKUP_FILENAME, { create: false })
    const file = await fileHandle.getFile()
    const text = await file.text()
    const data = JSON.parse(text) as AppSettings
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || '读取备份文件失败' }
  }
}

export async function removeOneDriveBinding(): Promise<void> {
  await del(ONEDRIVE_HANDLE_KEY)
}
