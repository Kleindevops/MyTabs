<template>
  <div
    class="relative h-screen w-screen overflow-hidden flex flex-col font-sans select-none text-slate-100"
    :class="{ 'modal-active': hasActiveModal }"
  >
    <!-- Dynamic Wallpaper Layer -->
    <div
      class="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none -z-20"
      :style="wallpaperStyle"
    ></div>

    <!-- Wallpaper Dark Mask Overlay -->
    <div
      class="fixed inset-0 pointer-events-none -z-10 transition-colors duration-500"
      :style="{ backgroundColor: `rgba(0, 0, 0, ${(settings.wallpaper?.mask ?? 30) / 100})` }"
    ></div>

    <!-- Main Workspace Content (Centered & Immersive Desktop) -->
    <main class="flex-1 flex flex-col items-center justify-center max-w-5xl w-full mx-auto px-4 z-10 pb-20">
      <!-- Minimalist Clock & Date (Center Aligned, Elegant Balance) -->
      <ClockWidget @enter-vault="handleClockDoubleClicked" />

      <!-- Centered Multi-Engine Search Bar -->
      <div class="w-full my-3 md:my-5 max-w-2xl">
        <SearchBar />
      </div>

      <!-- Desktop Bookmarks Grid (Interactive desktop icons with labels, matching iTab) -->
      <div class="w-full mt-1 max-w-4xl">
        <BookmarkGrid
          :bookmarks="displayedBookmarks"
          :categories="settings.categories || []"
          @add-bookmark="showAddBookmark = true"
          @contextmenu="handleBookmarkContextMenu"
        />
      </div>
    </main>

    <!-- Windows Style Bottom Taskbar with Pagination -->
    <WindowsTaskbar
      :categories="settings.categories || []"
      :activeCategoryId="activeCategoryId"
      :bookmarks="settings.bookmarks || []"
      :settings="settings"
      @select-category="handleCategorySelect"
      @add-category="handleAddCategory"
      @add-bookmark="showAddBookmark = true"
      @delete-bookmark="handleDeleteBookmark"
      @contextmenu="handleBookmarkContextMenu"
      @open-settings="showSettings = true"
      @open-sidepanel="openSidePanel"
      @open-onedrive="openSettingsTab('onedrive')"
    />

    <!-- Floating Draggable & Collapsible Hot News Widget -->
    <HotNewsWidget
      v-if="settings.showHotNews !== false"
      @close="handleCloseHotNews"
    />

    <!-- Custom Right-Click Context Menu for Bookmarks -->
    <BookmarkContextMenu
      v-if="contextMenuVisible"
      :visible="contextMenuVisible"
      :x="contextMenuPos.x"
      :y="contextMenuPos.y"
      :bookmark="selectedBookmark"
      @close="contextMenuVisible = false"
      @edit-icon="onContextEditIcon"
      @edit-bookmark="onContextEditBookmark"
      @delete="onContextDelete"
    />

    <!-- Modals -->
    <!-- 1. Settings Modal -->
    <SettingsModal
      v-if="showSettings"
      :settings="settings"
      :initialTab="settingsInitialTab"
      :currentCategoryId="activeCategoryId"
      @close="showSettings = false"
      @update-settings="onSettingsUpdated"
      @open-vault-setup="handleOpenVaultSetup"
      @open-change-password="handleOpenChangePassword"
      @clear-vault-password="handleClearVaultPassword"
      @lock-vault="handleLockVault"
    />
    <VaultLockModal
      ref="vaultModalRef"
      v-if="showVaultModal"
      :isFirstTime="!settings.vaultVerifier"
      @unlock="handleVaultUnlock"
      @cancel="handleVaultCancel"
    />

    <!-- 3. Change Password Modal -->
    <ChangePasswordModal
      ref="changePasswordModalRef"
      v-if="showChangePasswordModal"
      @change-password="handleChangePassword"
      @cancel="showChangePasswordModal = false"
    />

    <!-- 4. Add Bookmark Modal -->
    <AddBookmarkModal
      v-if="showAddBookmark"
      :categories="settings.categories || []"
      :defaultCategoryId="activeCategoryId"
      @save="handleAddBookmarkSave"
      @cancel="showAddBookmark = false"
    />

    <!-- 5. Edit Icon Modal (Pencil / 编辑图标) -->
    <EditIconModal
      v-if="showEditIconModal && selectedBookmark"
      :bookmark="selectedBookmark"
      @save="handleSaveEditIcon"
      @cancel="showEditIconModal = false"
    />

    <!-- 6. Edit Bookmark Modal (Document / 编辑主页) -->
    <EditBookmarkModal
      v-if="showEditBookmarkModal && selectedBookmark"
      :bookmark="selectedBookmark"
      :categories="settings.categories || []"
      @save="handleSaveEditBookmark"
      @cancel="showEditBookmarkModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ClockWidget from './components/ClockWidget.vue'
import HotNewsWidget from './components/HotNewsWidget.vue'
import SearchBar from './components/SearchBar.vue'
import BookmarkGrid from './components/BookmarkGrid.vue'
import WindowsTaskbar from './components/WindowsTaskbar.vue'
import BookmarkContextMenu from './components/BookmarkContextMenu.vue'
import EditIconModal from './components/EditIconModal.vue'
import EditBookmarkModal from './components/EditBookmarkModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import VaultLockModal from './components/VaultLockModal.vue'
import ChangePasswordModal from './components/ChangePasswordModal.vue'
import AddBookmarkModal from './components/AddBookmarkModal.vue'

import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../shared/storage'
import { generateSalt, createVaultVerifier, verifyVaultPassword } from '../shared/crypto'
import { changeVaultPasswordService } from '../shared/vault-service'
import type { AppSettings, CategoryItem, BookmarkItem } from '../shared/types'

// Handle bfcache back-navigation restoration: force clean refresh if restored from cache
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.location.reload()
    }
  })
}

const settings = ref<AppSettings>(DEFAULT_SETTINGS)
const activeCategoryId = ref<string>('cat-common')
const isVaultUnlocked = ref<boolean>(false)

// Modals & Context Menu State
const showSettings = ref(false)
const settingsInitialTab = ref('guide')
const showVaultModal = ref(false)
const showChangePasswordModal = ref(false)
const showAddBookmark = ref(false)
const showEditIconModal = ref(false)
const showEditBookmarkModal = ref(false)

const hasActiveModal = computed(() => {
  return showSettings.value ||
    showVaultModal.value ||
    showChangePasswordModal.value ||
    showAddBookmark.value ||
    showEditIconModal.value ||
    showEditBookmarkModal.value
})

const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const selectedBookmark = ref<BookmarkItem | null>(null)

const vaultModalRef = ref<any>(null)
const changePasswordModalRef = ref<any>(null)
let pendingCategoryId: string | null = null

const wallpaperStyle = computed(() => {
  const wp = settings.value?.wallpaper || DEFAULT_SETTINGS.wallpaper
  const blurVal = wp.blur ?? 0
  const blurStyle = blurVal > 0 ? `blur(${blurVal}px)` : 'none'
  const scaleStyle = blurVal > 0 ? 'scale(1.04)' : 'none'

  if (wp.type === 'color' || !wp.value) {
    return {
      background: wp.value?.startsWith('#') || wp.value?.startsWith('linear-gradient')
        ? wp.value
        : 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0f172a 100%)',
      filter: blurStyle,
      transform: scaleStyle
    }
  }

  return {
    backgroundImage: `url(${wp.value})`,
    filter: blurStyle,
    transform: scaleStyle
  }
})

const displayedBookmarks = computed(() => {
  const list = settings.value?.bookmarks || []
  return list.filter((bm) => bm.categoryId === activeCategoryId.value)
})

onMounted(async () => {
  try {
    const loaded = await loadSettings()
    if (loaded && loaded.categories && loaded.categories.length > 0) {
      settings.value = loaded
      activeCategoryId.value = loaded.categories[0].id
      // Ensure any migrated category names or enriched icons are saved
      await saveSettings(loaded, false)
    }
  } catch (err) {
    console.error('Error loading settings:', err)
  }
})

function handleBookmarkContextMenu(ev: MouseEvent, bm: BookmarkItem) {
  ev.preventDefault()
  ev.stopPropagation()
  selectedBookmark.value = bm
  contextMenuPos.value = { x: ev.clientX, y: ev.clientY }
  contextMenuVisible.value = true
}

function onContextEditIcon(bm: BookmarkItem) {
  selectedBookmark.value = bm
  showEditIconModal.value = true
}

function onContextEditBookmark(bm: BookmarkItem) {
  selectedBookmark.value = bm
  showEditBookmarkModal.value = true
}

function onContextDelete(bm: BookmarkItem) {
  handleDeleteBookmark(bm.id)
}

function handleSaveEditIcon(payload: { id: string; icon?: string; bgColor?: string }) {
  if (!settings.value.bookmarks) return
  const idx = settings.value.bookmarks.findIndex(b => b.id === payload.id)
  if (idx !== -1) {
    const nextBgColor = payload.bgColor !== undefined && payload.bgColor !== ''
      ? payload.bgColor
      : 'transparent'
    settings.value.bookmarks[idx] = {
      ...settings.value.bookmarks[idx],
      icon: payload.icon,
      bgColor: nextBgColor
    }
    saveSettings(settings.value)
  }
  showEditIconModal.value = false
}

function handleSaveEditBookmark(updatedBm: BookmarkItem) {
  if (!settings.value.bookmarks) return
  const idx = settings.value.bookmarks.findIndex(b => b.id === updatedBm.id)
  if (idx !== -1) {
    settings.value.bookmarks[idx] = {
      ...updatedBm,
      bgColor: updatedBm.bgColor || 'transparent'
    }
    saveSettings(settings.value)
  }
  showEditBookmarkModal.value = false
}

let vaultAutoLockTimer: number | null = null

function startVaultAutoLockTimer() {
  stopVaultAutoLockTimer()
  const minutes = settings.value?.vaultAutoLockMinutes ?? 5
  if (minutes <= 0) {
    return
  }

  let remaining = minutes * 60
  vaultAutoLockTimer = window.setInterval(() => {
    if (remaining > 1) {
      remaining--
    } else {
      // Auto-lock when countdown expires
      stopVaultAutoLockTimer()
      handleLockVault()
    }
  }, 1000)
}

function stopVaultAutoLockTimer() {
  if (vaultAutoLockTimer) {
    clearInterval(vaultAutoLockTimer)
    vaultAutoLockTimer = null
  }
}

onUnmounted(() => {
  stopVaultAutoLockTimer()
})

function handleCloseHotNews() {
  settings.value.showHotNews = false
  saveSettings(settings.value)
}

function handleCategorySelect(cat: CategoryItem) {
  if (cat.isPrivate && !isVaultUnlocked.value) {
    if (!settings.value.vaultVerifier) {
      isVaultUnlocked.value = true
      activeCategoryId.value = cat.id
      startVaultAutoLockTimer()
      return
    }
    pendingCategoryId = cat.id
    showVaultModal.value = true
    return
  }
  activeCategoryId.value = cat.id
}

function handleClockDoubleClicked() {
  // If currently inside vault, double-clicking toggles back to normal first category
  if (activeCategoryId.value === 'cat-vault') {
    if (settings.value.categories && settings.value.categories.length > 0) {
      activeCategoryId.value = settings.value.categories[0].id
    }
    return
  }

  // If already unlocked, navigate directly
  if (isVaultUnlocked.value) {
    activeCategoryId.value = 'cat-vault'
    startVaultAutoLockTimer()
    return
  }

  // If initial password is empty (no verifier set), open directly
  if (!settings.value.vaultVerifier) {
    isVaultUnlocked.value = true
    activeCategoryId.value = 'cat-vault'
    startVaultAutoLockTimer()
    return
  }

  // Password configured and locked: show unlock modal
  pendingCategoryId = 'cat-vault'
  showVaultModal.value = true
}

async function handleClearVaultPassword() {
  if (confirm('确定要清除个人空间密码吗？清除后将恢复为空密码，双击时间即可直接进入。')) {
    settings.value.vaultVerifier = undefined
    settings.value.salt = undefined
    await saveSettings(settings.value)
  }
}

async function handleVaultUnlock(password: string) {
  if (!settings.value.vaultVerifier) {
    // First time setup
    const salt = generateSalt()
    const verifier = await createVaultVerifier(password, salt)
    settings.value.salt = salt
    settings.value.vaultVerifier = verifier
    await saveSettings(settings.value)
    isVaultUnlocked.value = true
    showVaultModal.value = false
    startVaultAutoLockTimer()
    if (pendingCategoryId) {
      activeCategoryId.value = pendingCategoryId
      pendingCategoryId = null
    }
    return
  }

  // Verification
  const valid = await verifyVaultPassword(password, settings.value.salt!, settings.value.vaultVerifier)
  if (valid) {
    isVaultUnlocked.value = true
    showVaultModal.value = false
    startVaultAutoLockTimer()
    if (pendingCategoryId) {
      activeCategoryId.value = pendingCategoryId
      pendingCategoryId = null
    }
  } else {
    vaultModalRef.value?.showError('密码错误，请重新输入')
  }
}

function handleVaultCancel() {
  showVaultModal.value = false
  pendingCategoryId = null
}

function handleOpenVaultSetup() {
  showSettings.value = false
  showVaultModal.value = true
}

function handleOpenChangePassword() {
  showSettings.value = false
  showChangePasswordModal.value = true
}

async function handleChangePassword(payload: { oldPwd: string; newPwd: string }) {
  if (!settings.value.salt || !settings.value.vaultVerifier) {
    changePasswordModalRef.value?.showError('未设置初始密码，请先设置密码')
    return
  }

  changePasswordModalRef.value?.setSubmitting(true)

  const result = await changeVaultPasswordService(
    payload.oldPwd,
    payload.newPwd,
    settings.value.salt,
    settings.value.vaultVerifier,
    settings.value.bookmarks || []
  )

  changePasswordModalRef.value?.setSubmitting(false)

  if (result.success && result.newSalt && result.newVerifier) {
    settings.value.salt = result.newSalt
    settings.value.vaultVerifier = result.newVerifier
    if (result.updatedBookmarks) {
      settings.value.bookmarks = result.updatedBookmarks
    }
    await saveSettings(settings.value)
    showChangePasswordModal.value = false
    alert('个人空间密码已成功修改！')
  } else {
    changePasswordModalRef.value?.showError(result.error || '原密码错误，修改失败')
  }
}

function handleLockVault() {
  stopVaultAutoLockTimer()
  isVaultUnlocked.value = false
  // If user is currently looking at private category, navigate back to first category
  const currentCat = settings.value.categories.find(c => c.id === activeCategoryId.value)
  if (currentCat?.isPrivate && settings.value.categories.length > 0) {
    activeCategoryId.value = settings.value.categories[0].id
  }
  showSettings.value = false
}

function handleAddCategory() {
  const name = prompt('请输入新分类名称：')
  if (!name?.trim()) return

  const isPrivate = confirm('是否将此分类设为带密码保护的私密分类？')
  const newCat: CategoryItem = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    icon: isPrivate ? 'Lock' : 'Folder',
    isPrivate,
    isLocked: isPrivate
  }

  if (!settings.value.categories) {
    settings.value.categories = []
  }
  settings.value.categories.push(newCat)
  saveSettings(settings.value)
  handleCategorySelect(newCat)
}

function handleAddBookmarkSave(bmData: Omit<BookmarkItem, 'id'>) {
  const newBm: BookmarkItem = {
    id: `bm-${Date.now()}`,
    ...bmData
  }
  if (!settings.value.bookmarks) {
    settings.value.bookmarks = []
  }
  settings.value.bookmarks.push(newBm)
  saveSettings(settings.value)
  showAddBookmark.value = false
}

function handleDeleteBookmark(id: string) {
  const bm = settings.value.bookmarks?.find(b => b.id === id)
  const title = bm?.title || '此书签'
  if (!confirm(`确定删除书签 "${title}" 吗？`)) return
  settings.value.bookmarks = (settings.value.bookmarks || []).filter((b) => b.id !== id)
  saveSettings(settings.value)
}

function onSettingsUpdated(newSettings: AppSettings) {
  settings.value = { ...newSettings }
}

function onSettingsUpdatedAndSaved(newSettings: AppSettings) {
  settings.value = { ...newSettings }
  saveSettings(newSettings)
}

function openSettingsTab(tabId: string) {
  settingsInitialTab.value = tabId
  showSettings.value = true
}

function openSidePanel() {
  if (typeof chrome !== 'undefined' && (chrome.sidePanel as any)?.open) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        (chrome.sidePanel as any).open({ tabId: tab.id }).catch(() => {})
      }
    })
  } else {
    window.open('/sidepanel.html', '_blank', 'width=420,height=700')
  }
}
</script>
