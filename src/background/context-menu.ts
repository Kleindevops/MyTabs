export function setupContextMenus(): void {
  chrome.runtime.onInstalled.addListener(() => {
    // Parent or standalone items
    chrome.contextMenus.create({
      id: 'mytabs_ai_explain',
      title: 'MyTabs AI: 解释选中内容',
      contexts: ['selection']
    })

    chrome.contextMenus.create({
      id: 'mytabs_ai_translate',
      title: 'MyTabs AI: 翻译选中内容',
      contexts: ['selection']
    })

    chrome.contextMenus.create({
      id: 'mytabs_ai_summary',
      title: 'MyTabs AI: 总结当前页面',
      contexts: ['page', 'action']
    })

    chrome.contextMenus.create({
      id: 'mytabs_toggle_bilingual',
      title: 'MyTabs 沉浸式: 双语对照翻译本页 (Alt+W)',
      contexts: ['page']
    })
  })

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id || !tab?.windowId) return

    // Special handling for bilingual toggle: direct trigger content script
    if (info.menuItemId === 'mytabs_toggle_bilingual') {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PAGE_BILINGUAL' }).catch(() => {})
      return
    }

    // Open side panel
    try {
      await (chrome.sidePanel as any).open({ tabId: tab.id })
    } catch {
      try {
        await (chrome.sidePanel as any).open({ windowId: tab.windowId })
      } catch (err) {
        console.warn('Failed to open sidePanel:', err)
      }
    }

    // Wait 250ms for sidepanel ready, then broadcast action
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'SIDEPANEL_TRIGGER_ACTION',
        menuId: info.menuItemId,
        selectionText: info.selectionText || '',
        pageUrl: tab.url,
        pageTitle: tab.title
      }).catch(() => {})
    }, 250)
  })
}
