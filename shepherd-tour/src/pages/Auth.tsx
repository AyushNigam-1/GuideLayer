import { useEffect, useState } from "react"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase, supabaseUrl } from "../config/supabase"
import { LogOut, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
// import (useNavigation)
export default function Popup() {
    const nav = useNavigate()
    // const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    async function signInWithGoogle() {
        setLoading(true)
        const authUrl =
            `${supabaseUrl}/auth/v1/authorize?provider=google`
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
                const urlObj = new URL(callbackUrl)
                const hashParams = new URLSearchParams(urlObj.hash.slice(1))
                const accessToken = hashParams.get("access_token")
                const refreshToken = hashParams.get("refresh_token")

                if (accessToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken!
                    })
                    if (error) {
                        setError("Supabase session error: " + error.message)
                        return
                    }
                    nav("/home")
                } else {
                    setError("No access token found in redirect.")
                }
            }
        )
    }
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setLoading(false)
            if (data.session) {
                nav("/home")
            }
        })
    }, [])

    // const handleLogout = async () => {
    //     setLoading(true)
    //     await supabase.auth.signOut()
    //     setLoading(false)
    // }

    if (loading) {
        return (
            <div className="w-80 h-96 flex items-center justify-center bg-gray-900">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="w-80 bg-gray-900 text-white min-h-96 flex flex-col">
            {/* Header */}
            <div className="p-6 text-center border-b border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    GuideLayer
                </h1>
                <p className="text-gray-400 text-sm mt-2">Sign in to create your tour</p>
            </div>

            {/* Auth UI */}
            <button
                onClick={signInWithGoogle}
                // style={{ padding: 12, fontSize: 16 }}
                disabled={loading}
                className="w-full justify-center py-3 text-sm font-medium rounded-lg transition-all bg-white/5 "
            >
                {loading ? "Signing in..." : <span>
                    Sign in with Google
                </span>}
            </button>
            <div className="flex-1">
                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: "#10b981",
                                    brandAccent: "#059669",
                                    inputBackground: "#1f2937",
                                    inputBorder: "#374151",
                                    inputText: "#f3f4f6",
                                },
                            },
                        },
                        className: {
                            container: "space-y-2",
                            button: "w-full justify-center py-3 text-sm font-medium rounded-lg transition-all",
                            input: "w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20",
                            label: "text-sm font-medium text-gray-300",
                            anchor: "text-green-400 hover:text-green-300 text-sm",
                        },
                    }}
                    providers={[]}
                    redirectTo={chrome.runtime.getURL("popup.html")}
                    onlyThirdPartyProviders={false}
                    view="sign_in"
                    showLinks={true}
                />
            </div>
        </div>
    )

}