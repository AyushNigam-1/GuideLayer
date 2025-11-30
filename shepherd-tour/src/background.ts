import { supabase } from "./config/supabase";

// Polyfill for Chrome/Firefox - declare browser for TS
declare const browser: typeof chrome;

// Inline types (renamed to avoid conflict with global Response)
type StartTourMessage = { action: "startTour" }
type StartTourResponse = { success: boolean; error?: string }

const browserAPI = typeof browser !== "undefined" ? browser : chrome

chrome.tabs.onUpdated.addListener((_, changeInfo) => {
    const redirectUrl = chrome.identity.getRedirectURL()

    if (changeInfo.url && changeInfo.url.startsWith(redirectUrl)) {
        finishUserOAuth(changeInfo.url)
    }
})

async function finishUserOAuth(url: string) {
    try {
        console.log("Handling Supabase OAuth callback...")

        const hashMap = parseUrlHash(url)

        const access_token = hashMap.get("access_token")
        const refresh_token = hashMap.get("refresh_token")

        if (!access_token || !refresh_token) {
            throw new Error("No Supabase tokens found in URL hash")
        }

        const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
        })

        if (error) throw error

        // Persist session for popup / content scripts
        await chrome.storage.local.set({ supabaseSession: data.session })

        console.log("Supabase session stored")
    } catch (e) {
        console.error(e)
    }
}

function parseUrlHash(url: string) {
    const hash = new URL(url).hash.slice(1) // strip leading '#'
    const hashParts = hash.split("&").filter(Boolean)

    return new Map(
        hashParts.map((part) => {
            const [name, value] = part.split("=")
            return [name, decodeURIComponent(value)]
        })
    )
}


// Listen for messages from popup
browserAPI.runtime.onMessage.addListener(
    (message: StartTourMessage, _: chrome.runtime.MessageSender, sendResponse: (response?: StartTourResponse) => void) => {
        if (message.action === "startTour") {
            browserAPI.tabs
                .query({ active: true, currentWindow: true })
                .then((tabs: chrome.tabs.Tab[]) => {
                    const tab = tabs[0]
                    if (tab.url) {
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
    if (tab.url) {
        browserAPI.tabs.sendMessage(tab.id!, { action: "startTour" })
    }
})