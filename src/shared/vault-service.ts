import { generateSalt, createVaultVerifier, verifyVaultPassword, encryptText, decryptText } from './crypto'
import type { BookmarkItem } from './types'

export async function changeVaultPasswordService(
  oldPassword: string,
  newPassword: string,
  currentSalt: string,
  currentVerifier: string,
  bookmarks: BookmarkItem[]
): Promise<{
  success: boolean
  error?: string
  newSalt?: string
  newVerifier?: string
  updatedBookmarks?: BookmarkItem[]
}> {
  // 1. Verify old password
  const isValid = await verifyVaultPassword(oldPassword, currentSalt, currentVerifier)
  if (!isValid) {
    return { success: false, error: '原密码输入不正确' }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: '新密码至少需要 6 个字符' }
  }

  // 2. Generate new salt and verifier
  const newSalt = generateSalt()
  const newVerifier = await createVaultVerifier(newPassword, newSalt)

  // 3. Re-encrypt all private bookmarks if they have encrypted payload
  const updatedBookmarks: BookmarkItem[] = []
  for (const bm of bookmarks) {
    if (bm.isPrivate && bm.encryptedData) {
      try {
        const decryptedJson = await decryptText(bm.encryptedData, oldPassword, currentSalt)
        const reEncrypted = await encryptText(decryptedJson, newPassword, newSalt)
        updatedBookmarks.push({
          ...bm,
          encryptedData: reEncrypted
        })
      } catch {
        updatedBookmarks.push({ ...bm })
      }
    } else {
      updatedBookmarks.push({ ...bm })
    }
  }

  return {
    success: true,
    newSalt,
    newVerifier,
    updatedBookmarks
  }
}
