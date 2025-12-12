import { useEffect, useState } from "react"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase, supabaseUrl } from "../config/supabase"
import { Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
// import (useNavigation)
export default function Popup() {
    const nav = useNavigate()
    // const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    // const [error, setError] = useState("")

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
                    // setError("Authentication canceled or failed.")
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
                        // setError("Supabase session error: " + error.message)
                        return
                    }
                    nav("/home")
                } else {
                    // setError("No access token found in redirect.")
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

    if (loading) {
        return (
            // Loading state container adjusted for consistent dark background
            <div className="w-80 h-96 flex items-center justify-center bg-white dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        )
    }

    return (
        // Main container: Light default, Dark explicit for consistency
        <div className="w-80 bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-96 flex flex-col p-3">
            {/* Header */}
            <div className="p-6 text-center border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    GuideLayer
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Sign in to create your tour</p>
            </div>

            {/* Auth UI */}
            <div className="flex-1 space-y-2">
                {/* Google Sign-in Button */}
                <button
                    onClick={signInWithGoogle}
                    disabled={loading}
                    // Light default, Dark override for background/hover
                    className="w-full flex items-center justify-center py-3 text-sm font-medium rounded-lg transition-all 
                               bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300
                               dark:bg-white/5 dark:text-white dark:border-gray-700 dark:hover:bg-white/10"
                >
                    {loading ? "Signing in..." : <span>
                        Sign in with Google
                    </span>}
                </button>

                {/* Separator for native form */}
                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                </div>

                {/* Native Supabase Auth Form */}
                <div className="flex-1">
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            // Overriding variables to force dark mode consistency
                            variables: {
                                default: {
                                    colors: {
                                        brand: "#10b981",
                                        brandAccent: "#059669",
                                        // Dark mode colors for inputs/background
                                        defaultButtonBackground: "#10b981", // Use the brand color for primary buttons
                                        defaultButtonText: "#ffffff",
                                        inputBackground: "#f3f4f6", // Light default
                                        inputBorder: "#d1d5db", // Light border
                                        inputPlaceholder: "#9ca3af", // Light placeholder

                                        // Dark variants
                                        // "dark-inputBackground": "#1f2937",
                                        // "dark-inputBorder": "#374151",
                                        // "dark-inputText": "#f3f4f6",
                                        // "dark-defaultButtonBackground": "#10b981",
                                    },
                                },
                            },
                            // Overriding CSS classes for full Tailwind control
                            className: {
                                container: "space-y-4",
                                button: "w-full justify-center py-3 text-sm font-medium rounded-lg transition-all",
                                input: "w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20",
                                label: "text-sm font-medium text-gray-700 dark:text-gray-300",
                                anchor: "text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 text-sm",

                                // Adjust specific button styles if necessary
                                // buttonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
                                // buttonSecondary: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
                                // Ensure links within the form are visible
                                // link: "text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300",
                                message: "text-red-500 dark:text-red-400 text-sm"
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
        </div>
    )
}