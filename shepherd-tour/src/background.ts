// Polyfill for Chrome/Firefox - declare browser for TS
declare const browser: typeof chrome;

// Inline types (renamed to avoid conflict with global Response)
type StartTourMessage = { action: "startTour" }
type StartTourResponse = { success: boolean; error?: string }

const browserAPI = typeof browser !== "undefined" ? browser : chrome

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener(
    (message: StartTourMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: StartTourResponse) => void) => {
        if (message.action === "startTour") {
            browserAPI.tabs
                .query({ active: true, currentWindow: true })
                .then((tabs: chrome.tabs.Tab[]) => {
                    const tab = tabs[0]
                    if (tab.url && tab.url.startsWith("https://chatgpt.com/")) {
                        // Send to content script
                        browserAPI.tabs
                            .sendMessage(tab.id!, { action: "startTour" })
                            .then((response: StartTourResponse | undefined) => sendResponse(response || { success: true }))
                            .catch((err: unknown) => {
                                console.error("[Shepherd Injector] Send message failed:", err)
                                sendResponse({ success: false, error: (err as Error).message })
                            })
                    } else {
                        sendResponse({ success: false, error: "Not on ChatGPT page" })
                    }
                })
            return true // Async
        }
    }
)

// Icon click fallback
browserAPI.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
    if (tab.url && tab.url.startsWith("https://chatgpt.com/")) {
        browserAPI.tabs.sendMessage(tab.id!, { action: "startTour" })
    }
})