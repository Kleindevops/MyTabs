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
        <SearchBar
          :engines="settings.searchEngines"
          :defaultEngineId="settings.defaultSearchEngineId"
          @open-settings="openSettingsTab('search')"
        />
      </div>

      <!-- Desktop Bookmarks Grid (Interactive desktop icons with labels, matching iTab) -->
      <div class="w-full mt-2 max-w-5xl relative">
        <BookmarkGrid
          ref="bookmarkGridRef"
          :bookmarks="displayedBookmarks"
          :categories="settings.categories || []"
          :activeCategoryId="activeCategoryId"
          @add-bookmark="openAddBookmarkFromDesktop"
          @contextmenu="handleBookmarkContextMenu"
          @drag-start="handleBookmarkDragStart"
          @drag-end="handleBookmarkDragEnd"
          @reorder="handleBookmarkReorder"
        />
      </div>
    </main>

    <!-- Windows Style Bottom Taskbar with Pagination -->
    <WindowsTaskbar
      :categories="settings.categories || []"
      :activeCategoryId="activeCategoryId"
      :bookmarks="settings.bookmarks || []"
      :settings="settings"
      :isDragging="isDraggingBookmark"
      :draggedBookmark="draggedBookmarkItem"
      :isVaultUnlocked="isVaultUnlocked"
      @select-category="handleCategorySelect"
      @add-category="handleAddCategory"
      @delete-category="handleDeleteCategory"
      @add-bookmark="openAddBookmarkFromTaskbar"
      @delete-bookmark="handleDeleteBookmark"
      @contextmenu="handleBookmarkContextMenu"
      @open-settings="showSettings = true"
      @open-sidepanel="openSidePanel"
      @open-onedrive="openSettingsTab('onedrive')"
      @move-bookmark="handleMoveBookmark"
      @locate-bookmark="handleLocateBookmark"
      @pin-bookmark="handlePinBookmarkFromDrag"
      @exit-vault="handleLockVault"
    />

    <!-- Floating Draggable & Collapsible Hot News Widget -->
    <HotNewsWidget
      v-if="settings.showHotNews !== false && !isCurrentInVault"
      @close="handleCloseHotNews"
    />

    <!-- Custom Right-Click Context Menu for Bookmarks -->
    <BookmarkContextMenu
      v-if="contextMenuVisible"
      :visible="contextMenuVisible"
      :x="contextMenuPos.x"
      :y="contextMenuPos.y"
      :bookmark="selectedBookmark"
      :categories="settings.categories || []"
      @close="contextMenuVisible = false"
      @edit-icon="onContextEditIcon"
      @edit-bookmark="onContextEditBookmark"
      @delete="onContextDelete"
      @move-to-category="handleContextMenuMoveBookmark"
    />

    <!-- Toast Feedback Notification -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/95 text-white text-xs font-medium border border-white/15 shadow-2xl backdrop-blur-xl flex items-center space-x-2 pointer-events-none"
      >
        <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

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
      :salt="settings.salt"
      :verifier="settings.vaultVerifier"
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
      :defaultPinned="addBookmarkDefaultPinned"
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
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { FolderInput, CheckCircle2 } from 'lucide-vue-next'
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

import { DEFAULT_SETTINGS, loadSettings, saveSettings, STORAGE_KEY } from '../shared/storage'
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
const addBookmarkDefaultPinned = ref(false)
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

// Dragging & Moving state
const isDraggingBookmark = ref(false)
const draggedBookmarkItem = ref<BookmarkItem | null>(null)
const dragOverFloatingCatId = ref<string | null>(null)
const toastMessage = ref<string | null>(null)
let toastTimer: any = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = null
  }, 2500)
}

const isCurrentInVault = computed(() => {
  if (activeCategoryId.value === 'cat-vault') return true
  const currentCat = (settings.value.categories || []).find((c) => c.id === activeCategoryId.value)
  return !!currentCat?.isPrivate
})

const availableMoveCategories = computed(() => {
  const currentCatId = activeCategoryId.value
  const isVault = isCurrentInVault.value
  return (settings.value.categories || []).filter((c) => {
    if (c.id === currentCatId) return false
    const isTargetVault = c.isPrivate || c.id === 'cat-vault'
    return isVault ? isTargetVault : !isTargetVault
  })
})

const vaultModalRef = ref<any>(null)
const changePasswordModalRef = ref<any>(null)
const bookmarkGridRef = ref<InstanceType<typeof BookmarkGrid> | null>(null)
let pendingCategoryId: string | null = null
let pendingLocateBookmark: BookmarkItem | null = null

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

let storageListener: ((changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void) | null = null

function setupStorageSync() {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return
  if (storageListener) return // prevent duplicate binding

  storageListener = (changes, areaName) => {
    if (areaName !== 'local' || !changes[STORAGE_KEY]?.newValue) return

    const incoming = changes[STORAGE_KEY].newValue as AppSettings
    if (!incoming) return

    // Safely update settings in memory reactively across all tabs
    settings.value = incoming

    // If current activeCategoryId was deleted in another tab, fallback safely
    const hasCategory = (incoming.categories || []).some(c => c.id === activeCategoryId.value)
    if (!hasCategory && incoming.categories && incoming.categories.length > 0) {
      activeCategoryId.value = incoming.categories[0].id
    }
  }

  chrome.storage.onChanged.addListener(storageListener)
}

onMounted(async () => {
  try {
    setupStorageSync()
    const loaded = await loadSettings()
    if (loaded && loaded.categories && loaded.categories.length > 0) {
      settings.value = loaded
      activeCategoryId.value = loaded.categories[0].id
    }
  } catch (err) {
    console.warn('Loading settings:', err)
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

function openAddBookmarkFromDesktop() {
  addBookmarkDefaultPinned.value = false
  showAddBookmark.value = true
}

function openAddBookmarkFromTaskbar(payload?: { defaultPinned?: boolean }) {
  addBookmarkDefaultPinned.value = payload?.defaultPinned ?? true
  showAddBookmark.value = true
}

function handlePinBookmarkFromDrag(bookmarkId: string) {
  if (!settings.value.bookmarks) return
  const idx = settings.value.bookmarks.findIndex(b => b.id === bookmarkId)
  if (idx === -1) return
  const bm = settings.value.bookmarks[idx]
  if (bm.isPinnedToTaskbar) {
    showToast(`「${bm.title}」已固定在底部常用网站栏`)
    return
  }
  settings.value.bookmarks[idx] = {
    ...bm,
    isPinnedToTaskbar: true
  }
  saveSettings(settings.value)
  showToast(`已成功固定「${bm.title}」到底部常用网站栏`)
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

function handleBookmarkDragStart(bm: BookmarkItem) {
  isDraggingBookmark.value = true
  draggedBookmarkItem.value = bm
}

function handleBookmarkDragEnd() {
  isDraggingBookmark.value = false
  draggedBookmarkItem.value = null
  dragOverFloatingCatId.value = null
}

function handleFloatingDrop(e: DragEvent, targetCat: CategoryItem) {
  e.preventDefault()
  dragOverFloatingCatId.value = null
  isDraggingBookmark.value = false
  try {
    const raw = e.dataTransfer?.getData('application/json')
    const data = raw ? JSON.parse(raw) : null
    const bmId = data?.bookmarkId || draggedBookmarkItem.value?.id
    if (bmId) {
      handleMoveBookmark({ bookmarkId: bmId, targetCategoryId: targetCat.id })
    }
  } catch (err) {
    if (draggedBookmarkItem.value) {
      handleMoveBookmark({ bookmarkId: draggedBookmarkItem.value.id, targetCategoryId: targetCat.id })
    }
  }
}

function handleMoveBookmark(payload: { bookmarkId: string; targetCategoryId: string }) {
  if (!settings.value.bookmarks) return
  const idx = settings.value.bookmarks.findIndex(b => b.id === payload.bookmarkId)
  if (idx === -1) return

  const targetCat = settings.value.categories?.find(c => c.id === payload.targetCategoryId)
  const bm = settings.value.bookmarks[idx]
  if (bm.categoryId === payload.targetCategoryId) return

  const isTargetPrivate = targetCat?.isPrivate || payload.targetCategoryId === 'cat-vault'

  settings.value.bookmarks[idx] = {
    ...bm,
    categoryId: payload.targetCategoryId,
    isPrivate: isTargetPrivate ? true : bm.isPrivate,
    openInIncognito: isTargetPrivate ? true : bm.openInIncognito
  }

  saveSettings(settings.value)
  const catName = targetCat?.name || '目标分类'
  showToast(`已将“${bm.title}”移动到「${catName}」分类`)
}

function handleContextMenuMoveBookmark(bm: BookmarkItem, targetCatId: string) {
  handleMoveBookmark({ bookmarkId: bm.id, targetCategoryId: targetCatId })
}

function handleBookmarkReorder(payload: { fromId: string; toId: string }) {
  if (!settings.value.bookmarks) return
  const list = [...settings.value.bookmarks]
  const fromIndex = list.findIndex(b => b.id === payload.fromId)
  const toIndex = list.findIndex(b => b.id === payload.toId)
  if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    settings.value.bookmarks = list
    saveSettings(settings.value)
  }
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
  if (storageListener && typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.removeListener(storageListener)
    storageListener = null
  }
})

function handleCloseHotNews() {
  settings.value.showHotNews = false
  saveSettings(settings.value)
}

function handleCategorySelect(cat: CategoryItem) {
  const isTargetVault = cat.isPrivate || cat.id === 'cat-vault'
  if (isTargetVault && !isVaultUnlocked.value) {
    pendingCategoryId = cat.id
    showVaultModal.value = true
    return
  }
  // If leaving vault to a non-private category, lock the vault
  if (isCurrentInVault.value && !isTargetVault) {
    isVaultUnlocked.value = false
    stopVaultAutoLockTimer()
  }
  activeCategoryId.value = cat.id
}

function handleLocateBookmark(bm: BookmarkItem) {
  const targetCat = settings.value.categories?.find(c => c.id === bm.categoryId)
  const isPrivate = targetCat?.isPrivate || bm.categoryId === 'cat-vault'

  if (isPrivate && !isVaultUnlocked.value) {
    pendingCategoryId = bm.categoryId
    pendingLocateBookmark = bm
    showVaultModal.value = true
    showToast('该网址位于个人空间中，请先解锁')
    return
  }

  // Switch category if needed
  if (activeCategoryId.value !== bm.categoryId) {
    activeCategoryId.value = bm.categoryId
  }

  // Locate in BookmarkGrid on next tick after reactive update
  nextTick(() => {
    bookmarkGridRef.value?.locateBookmark(bm.id)
    const catName = targetCat?.name || '当前分类'
    showToast(`已在「${catName}」中定位到图标 “${bm.title}”`)
  })
}

function handleClockDoubleClicked() {
  // If currently inside vault, double-clicking toggles back to normal first category and locks the vault
  if (isCurrentInVault.value) {
    isVaultUnlocked.value = false
    stopVaultAutoLockTimer()
    const firstNormal = (settings.value.categories || []).find(c => !c.isPrivate && c.id !== 'cat-vault')
    if (firstNormal) {
      activeCategoryId.value = firstNormal.id
    } else if (settings.value.categories && settings.value.categories.length > 0) {
      activeCategoryId.value = settings.value.categories[0].id
    }
    return
  }

  // Double-clicking while outside vault: show transparent unlock prompt
  pendingCategoryId = 'cat-vault'
  showVaultModal.value = true
}

async function handleClearVaultPassword() {
  if (confirm('确定要清除个人空间密码吗？清除后下次双击时间可重新设置新密码。')) {
    settings.value.vaultVerifier = undefined
    settings.value.salt = undefined
    isVaultUnlocked.value = false
    stopVaultAutoLockTimer()
    await saveSettings(settings.value)
    if (activeCategoryId.value === 'cat-vault' && settings.value.categories && settings.value.categories.length > 0) {
      activeCategoryId.value = settings.value.categories[0].id
    }
    showToast('个人空间密码已重置')
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
    activeCategoryId.value = pendingCategoryId || 'cat-vault'
    pendingCategoryId = null
    return
  }

  // Verification
  const valid = await verifyVaultPassword(password, settings.value.salt!, settings.value.vaultVerifier)
  if (valid) {
    isVaultUnlocked.value = true
    showVaultModal.value = false
    startVaultAutoLockTimer()
    activeCategoryId.value = pendingCategoryId || 'cat-vault'
    pendingCategoryId = null

    if (pendingLocateBookmark) {
      const bmToLocate = pendingLocateBookmark
      pendingLocateBookmark = null
      nextTick(() => {
        bookmarkGridRef.value?.locateBookmark(bmToLocate.id)
        showToast(`已定位到网址 “${bmToLocate.title}”`)
      })
    }
  } else {
    vaultModalRef.value?.showError('密码错误，请重新输入')
  }
}

function handleVaultCancel() {
  showVaultModal.value = false
  pendingCategoryId = null
  pendingLocateBookmark = null
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
  // If user is currently looking at personal space category, navigate back to first regular category
  if (isCurrentInVault.value) {
    const firstNormal = (settings.value.categories || []).find(c => !c.isPrivate && c.id !== 'cat-vault')
    if (firstNormal) {
      activeCategoryId.value = firstNormal.id
    } else if (settings.value.categories && settings.value.categories.length > 0) {
      activeCategoryId.value = settings.value.categories[0].id
    }
  }
  showSettings.value = false
}

function handleAddCategory() {
  const name = prompt('请输入新分类名称：')
  if (!name?.trim()) return

  const currentCat = settings.value.categories?.find(c => c.id === activeCategoryId.value)
  const isPrivate = isVaultUnlocked.value && (activeCategoryId.value === 'cat-vault' || !!currentCat?.isPrivate)

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

function handleDeleteCategory(cat: CategoryItem) {
  if (cat.id === 'cat-vault') {
    alert('个人空间为内置绝密加密暗门，不可删除。')
    return
  }

  const normalCategories = (settings.value.categories || []).filter(c => !c.isPrivate && c.id !== 'cat-vault')
  if (normalCategories.length <= 1 && !cat.isPrivate) {
    alert('至少需要保留一个分类，无法删除最后一个常规分类。')
    return
  }

  const relatedBookmarks = (settings.value.bookmarks || []).filter(b => b.categoryId === cat.id)
  const confirmMsg = relatedBookmarks.length > 0
    ? `确定要删除分类「${cat.name}」吗？\n该分类下的 ${relatedBookmarks.length} 个书签网址也将一并被删除。`
    : `确定要删除分类「${cat.name}」吗？`

  if (!confirm(confirmMsg)) {
    return
  }

  // 1. 从 categories 中移除
  settings.value.categories = (settings.value.categories || []).filter(c => c.id !== cat.id)

  // 2. 级联删除该分类下的所有书签
  settings.value.bookmarks = (settings.value.bookmarks || []).filter(b => b.categoryId !== cat.id)

  // 3. 如果删除的是当前激活分类，平滑切换到第一个可用分类
  if (activeCategoryId.value === cat.id) {
    if (cat.isPrivate || cat.id === 'cat-vault') {
      const nextVaultCat = settings.value.categories.find(c => c.id === 'cat-vault' || c.isPrivate)
      if (nextVaultCat) {
        activeCategoryId.value = nextVaultCat.id
      }
    } else {
      const nextCat = settings.value.categories.find(c => !c.isPrivate && c.id !== 'cat-vault') || settings.value.categories[0]
      if (nextCat) {
        activeCategoryId.value = nextCat.id
      }
    }
  }

  // 4. 持久化存储并反馈
  saveSettings(settings.value)
  showToast(`已删除分类「${cat.name}」`)
}

async function handleAddBookmarkSave(bmData: Omit<BookmarkItem, 'id'>) {
  try {
    // 1. Fetch freshest settings from storage to avoid overwriting changes from other tabs
    const latest = await loadSettings()
    const list = Array.isArray(latest.bookmarks) ? [...latest.bookmarks] : []

    const newBm: BookmarkItem = {
      id: `bm-${Date.now()}`,
      ...bmData
    }

    list.push(newBm)
    latest.bookmarks = list
    settings.value = latest

    // 2. Await physical disk write
    await saveSettings(latest)

    // 3. Switch to the category of the new bookmark if different from current
    if (activeCategoryId.value !== newBm.categoryId) {
      activeCategoryId.value = newBm.categoryId
    }

    // 4. Auto-flip to target page and ping-highlight the new bookmark icon
    nextTick(() => {
      setTimeout(() => {
        bookmarkGridRef.value?.locateBookmark(newBm.id)
      }, 50)
    })

    showToast(`已成功添加「${newBm.title}」并定位到图标`)
  } catch (err) {
    console.warn('Failed to add bookmark:', err)
    showToast('添加书签失败，请重试')
  } finally {
    showAddBookmark.value = false
  }
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
