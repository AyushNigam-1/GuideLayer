import { useEffect, useState } from "react"
import { supabase, supabaseUrl } from "./config/supabase"

// const supabaseUrl = "https://YOUR_PROJECT_REF.supabase.co"

export default function Popup() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => sub?.subscription?.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    setError("")
    setLoading(true)
    const authUrl =
      `${supabaseUrl}/auth/v1/authorize?provider=google`
    const redirectUrl =
      `${supabaseUrl}/auth/v1/callback`

    // Open the Chrome identity OAuth window
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true
      },
      async (callbackUrl) => {
        setLoading(false)
        if (!callbackUrl) {
          setError("Authentication canceled or failed.")
          return
        }
        // The callback URL contains the access_token/refresh_token in hash, like:
        // https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback#access_token=...&refresh_token=...&expires_in=...&token_type=bearer&provider_token=...&provider_refresh_token=...
        // Parse the tokens from the callback URL and use as needed

        const urlObj = new URL(callbackUrl)
        const hashParams = new URLSearchParams(urlObj.hash.slice(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        if (accessToken) {
          // Set session in Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          if (error) {
            setError("Supabase session error: " + error.message)
            return
          }
          setSession(data.session)
        } else {
          setError("No access token found in redirect.")
        }
      }
    )
  }

  if (!session) {
    return (
      <div style={{ minWidth: 300, padding: 20 }}>
        <button
          onClick={signInWithGoogle}
          style={{ padding: 12, fontSize: 16 }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div style={{ minWidth: 300, padding: 20 }}>
      <div>Logged in as <b>{session.user.email}</b></div>
      <button style={{ marginTop: 18 }}
        onClick={async () => {
          await supabase.auth.signOut()
          setSession(null)
        }}>
        Log out
      </button>
    </div>
  )
}