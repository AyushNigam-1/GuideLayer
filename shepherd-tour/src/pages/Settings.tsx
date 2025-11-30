// src/components/SettingsPanel.tsx
import React, { useState, useEffect } from "react"
import { Moon, Sun, LogOut, User, Palette, Monitor } from "lucide-react"
import { supabase } from "../config/supabase"

interface UserProfile {
    name: string
    email: string
    avatar?: string
}

export default function Settings() {
    const [popupTheme, setPopupTheme] = useState<"dark" | "light">("dark")
    const [uiTheme, setUiTheme] = useState<"dark" | "light">("dark")
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // Load session + saved themes
    useEffect(() => {
        const loadUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setUser({
                    name: session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "User",
                    email: session.user.email || "",
                    avatar: session.user.user_metadata.avatar_url
                })
            }
            setLoading(false)
        }

        // Load saved themes from chrome.storage
        chrome.storage.sync.get(["popupTheme", "uiTheme"], (result) => {
            if (result.popupTheme) setPopupTheme(result.popupTheme)
            if (result.uiTheme) setUiTheme(result.uiTheme)
        })

        loadUser()
    }, [])

    // Save theme changes
    const saveTheme = (key: string, value: "dark" | "light") => {
        chrome.storage.sync.set({ [key]: value })
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.close() // Close popup after logout
    }

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>
    }

    return (
        <div className="bg-gray-900 text-white flex flex-col scrollbar-thumb-gray-600 scrollbar-track-gray-200 space-y-4">
            {/* User Profile */}
            <div className="p-4 border-b border-gray-800 bg-white/5 flex gap-2 rounded-lg">
                <div className="w-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-3xl font-bold shadow-lg">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <User className="w-12 " />
                    )}
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-bold">{user?.name || "Guest"}</h2>
                    <p className="text-sm text-gray-400">{user?.email || "Not logged in"}</p>
                </div>
            </div>
            <div className="h-0.5 w-full bg-white/5" />
            <div className="flex flex-col justify-between p-2 bg-white/5 rounded-xl gap-2">
                <div>
                    <p className="font-medium text-lg">Extension UI Theme</p>
                    <p className=" text-gray-400">Changes extension popup background</p>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => {
                            setPopupTheme("light")
                            saveTheme("popupTheme", "light")
                        }}
                        className={`p-3 w-full rounded-lg transition-all flex items-center justify-center  ${popupTheme === "light"
                            ? "bg-white text-black ring-4 ring-green-500 shadow-lg"
                            : "bg-gray-700 hover:bg-gray-600"
                            }`}
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setPopupTheme("dark")
                            saveTheme("popupTheme", "dark")
                        }}
                        className={`p-3 w-full rounded-lg transition-all flex items-center justify-center  ${popupTheme === "light"
                            ? "bg-white text-black ring-4 ring-green-500 shadow-lg"
                            : "bg-gray-700 hover:bg-gray-600"
                            }`}
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setPopupTheme("dark")
                            saveTheme("popupTheme", "dark")
                        }}
                        className={`p-3 w-full rounded-lg transition-all flex items-center justify-center  ${popupTheme === "light"
                            ? "bg-white text-black ring-4 ring-green-500 shadow-lg"
                            : "bg-gray-700 hover:bg-gray-600"
                            }`}
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* UI Theme (for your tours) */}
            <div className="flex flex-col justify-between p-2 bg-white/5 rounded-xl gap-2">
                <div>
                    <p className="font-medium text-lg">Guide UI Theme</p>
                    <p className="text-gray-400">Changes tour popup appearance</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setPopupTheme("light")
                            saveTheme("popupTheme", "light")
                        }}
                        className={`p-3 w-full rounded-lg transition-all flex items-center justify-center  ${popupTheme === "light"
                            ? "bg-white text-black ring-4 ring-green-500 shadow-lg"
                            : "bg-gray-700 hover:bg-gray-600"
                            }`}
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setPopupTheme("dark")
                            saveTheme("popupTheme", "dark")
                        }}
                        className={`p-3 w-full rounded-lg transition-all flex items-center justify-center  ${popupTheme === "light"
                            ? "bg-white text-black ring-4 ring-green-500 shadow-lg"
                            : "bg-gray-700 hover:bg-gray-600"
                            }`}
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setPopupTheme("dark")
                            saveTheme("popupTheme", "dark")
                        }}
                        className={`p-3 w-full rounded-lg transition-all flex items-center justify-center  ${popupTheme === "light"
                            ? "bg-white text-black ring-4 ring-green-500 shadow-lg"
                            : "bg-gray-700 hover:bg-gray-600"
                            }`}
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="h-0.5 w-full bg-white/5" />

            {/* Logout Button */}
            <div className="border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    )
}


// const Button = () => {

// }