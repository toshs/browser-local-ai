// Background Service Worker
// Handles Context Menus and Side Panel coordination

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "browser-local-ai-root",
        title: "Browser Local AI",
        contexts: ["all"]
    });

    chrome.contextMenus.create({
        id: "bla-summarize-page",
        parentId: "browser-local-ai-root",
        title: "Summarize this page",
        contexts: ["page", "selection"]
    });

    chrome.contextMenus.create({
        id: "bla-translate-selection",
        parentId: "browser-local-ai-root",
        title: "Translate selection",
        contexts: ["selection"]
    });

    chrome.contextMenus.create({
        id: "bla-explain-code",
        parentId: "browser-local-ai-root",
        title: "Explain code",
        contexts: ["selection"]
    });
});

async function getPageText(tabId: number): Promise<string> {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => document.body.innerText,
        });
        return results?.[0]?.result || '';
    } catch (e) {
        console.error('[Background] Failed to get page text:', e);
        return '';
    }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;

    let selectionText = info.selectionText || '';

    // For summarize-page, get the full page text if no selection
    if (info.menuItemId === 'bla-summarize-page' && !selectionText) {
        selectionText = await getPageText(tab.id);
    }

    // Open Side Panel
    chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId })
        .catch(console.error);

    const payload = {
        type: 'CONTEXT_ACTION',
        action: info.menuItemId,
        selectionText,
        pageUrl: info.pageUrl
    };

    // Try to send message directly, fallback to storage
    setTimeout(() => {
        chrome.runtime.sendMessage(payload).catch(() => {
            chrome.storage.local.set({
                pendingAction: {
                    action: info.menuItemId,
                    selectionText,
                    timestamp: Date.now()
                }
            });
        });
    }, 500);
});
