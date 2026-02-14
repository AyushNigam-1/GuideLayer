import { supabase } from "./config/supabase"

declare const browser: typeof chrome
const browserAPI = typeof browser !== "undefined" ? browser : chrome

browserAPI.runtime.onMessage.addListener((msg) => {
    if (msg.action === "googleLogin") {
        startGoogleAuth()
    }
})

async function startGoogleAuth() {
    const authUrl =
        `${process.env.PLASMO_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(chrome.identity.getRedirectURL())}`

    chrome.identity.launchWebAuthFlow(
        {
            url: authUrl,
            interactive: true
        },
        async (callbackUrl) => {
            if (!callbackUrl) {
                console.log("url", chrome.identity.getRedirectURL())
                console.error("OAuth cancelled")
                return
            }

            const hash = new URL(callbackUrl).hash.slice(1)
            const params = new URLSearchParams(hash)


            const access_token = params.get("access_token")
            const refresh_token = params.get("refresh_token")

            if (!access_token || !refresh_token) {
                console.error("Missing tokens")
                return
            }

            const { data, error } = await supabase.auth.setSession({
                access_token,
                refresh_token
            })

            if (error) {
                console.error(error)
                return
            }

            await chrome.storage.local.set({
                supabaseSession: data.session
            })
            chrome.action.openPopup()
        }
    )
}
