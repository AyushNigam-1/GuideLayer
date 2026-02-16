import { useEffect, useState } from "react"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "../config/supabase"
import { Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function SupabaseAuth() {
    const nav = useNavigate()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        chrome.storage.local.get(["supabaseSession"], async (res) => {
            if (res.supabaseSession) {
                await supabase.auth.setSession(res.supabaseSession)
                nav("/home")
            }
            setLoading(false)
        })
    }, [])

    function signInWithGoogle() {
        chrome.runtime.sendMessage({ action: "googleLogin" })
        // chrome.tabs.create({
        //     url: chrome.runtime.getURL("popup.html#/auth")
        // })

    }

    if (loading) {
        return (
            <div className="w-80 h-96 flex items-center justify-center bg-white dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className=" bg-white dark:bg-gray-900 text-gray-900 dark:text-white h-[500px] flex flex-col p-3">

            <div className="p-6 text-center border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gray-100">
                    GuideLayer
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                    Sign in to create your tour
                </p>
            </div>


            <div className="flex-1 space-y-2">
                <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center py-3 text-sm font-medium rounded-lg transition-all 
          bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300
          dark:bg-white/5 dark:text-white dark:border-gray-700 dark:hover:bg-white/10"
                >
                    Sign in with Google
                </button>
                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        className: {
                            container: "space-y-4",
                            button: "w-full justify-center py-3 text-sm font-medium rounded-lg",
                            input: "w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700",
                            label: "text-sm font-medium text-gray-700 dark:text-gray-300",
                            anchor: "text-green-500 text-sm",
                            message: "text-red-500 text-sm"
                        }
                    }}
                    providers={[]}
                    redirectTo={chrome.runtime.getURL("popup.html")}
                    view="sign_in"
                />

            </div>
        </div>
    )
}
