import React, { useState, useEffect } from "react"
import { Moon, Sun, LogOut, User, Monitor, ChevronLeft, LucideIcon } from "lucide-react"
import { supabase } from "../config/supabase"
import { useNavigate } from "react-router-dom"

interface UserProfile {
    name: string
    email: string
    avatar?: string
}

type ThemeValue = "light" | "dark" | "system"

// ---------- THEME STORAGE ----------
const saveTheme = (key: string, value: ThemeValue) => {
    if (typeof chrome !== "undefined" && chrome.storage?.sync) {
        chrome.storage.sync.set({ [key]: value }, () =>
            console.log(`Saved ${key}:`, value)
        )
    } else {
        console.warn("chrome.storage unavailable; state only")
    }
}

// ---------- APPLY TAILWIND THEME ----------
const applyTheme = (theme: ThemeValue) => {
    const root = document.documentElement

    if (theme === "light") {
        root.classList.remove("dark")
        return
    }

    if (theme === "dark") {
        root.classList.add("dark")
        return
    }

    // system mode
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", prefersDark)
}

// ---------- BUTTON ----------
interface ButtonProps {
    Icon: LucideIcon
    label: ThemeValue
    active: ThemeValue
    onClick: (theme: ThemeValue) => void
}

const Button: React.FC<ButtonProps> = ({ Icon, label, active, onClick }) => {
    const isActive = label === active

    return (
        <button
            onClick={() => onClick(label)}
            // Inactive state uses explicit light (default) and dark variants
            className={`p-3 w-full rounded-lg transition-all flex items-center justify-center border-2 
                ${isActive
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-md" // Active state
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600" // Inactive state
                }`}
        >
            <Icon className="w-5 h-5" />
        </button>
    )
}

// ---------- MAIN COMPONENT ----------
export default function Settings() {
    const [popupTheme, setPopupTheme] = useState<ThemeValue>("dark")
    const [uiTheme, setUiTheme] = useState<ThemeValue>("dark")
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const nav = useNavigate()

    const handleSetPopupTheme = (theme: ThemeValue) => {
        setPopupTheme(theme)
        saveTheme("popupTheme", theme)
        applyTheme(theme)
    }

    const handleSetUiTheme = (theme: ThemeValue) => {
        setUiTheme(theme)
        saveTheme("uiTheme", theme)
    }

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            window.close()
        } catch (e) {
            console.error("Logout failed:", e)
        }
    }

    // Load saved themes + user
    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    setUser({
                        name: session.user.user_metadata.full_name ||
                            session.user.email?.split("@")[0] ||
                            "User",
                        email: session.user.email || "",
                        avatar: session.user.user_metadata.avatar_url
                    })
                }
            } catch (e) {
                console.error("Failed to load session:", e)
            }
            setLoading(false)
        }

        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(["popupTheme", "uiTheme"], (result) => {
                if (result.popupTheme) setPopupTheme(result.popupTheme)
                if (result.uiTheme) setUiTheme(result.uiTheme)

                // Apply stored theme on load
                if (result.popupTheme) applyTheme(result.popupTheme)
            })
        } else {
            applyTheme(popupTheme)
        }

        loadUser()
    }, [])

    // Live system-theme reactivity
    useEffect(() => {
        if (popupTheme !== "system") return

        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const listener = () => applyTheme("system")

        mq.addEventListener("change", listener)
        return () => mq.removeEventListener("change", listener)
    }, [popupTheme])

    if (loading) {
        // Loading state respects the dark/light class on the root element
        return <div className="p-8 text-center bg-white text-gray-900 dark:bg-gray-900 dark:text-white">Loading...</div>
    }

    return (
        // Main container sets the default light theme and dark variant overrides
        <div className="p-3 space-y-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-white min-w-[300px]">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => nav(-1)}
                    // Button styling: Light default, Dark overrides
                    className="p-1 bg-gray-100 rounded-md flex items-center gap-3 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                >
                    <ChevronLeft size="16" />
                </button>
                <h3 className="text-xl font-semibold">Profile & Settings</h3>
            </div>

            {/* User Profile */}
            <div
                // Light default, Dark override for background and text
                className="p-4 bg-gray-100 dark:bg-gray-800  flex gap-4 rounded-lg"
            >
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                    )}
                </div>
                <div className="space-y-1 text-left">
                    <h2 className="text-xl font-bold">{user?.name || "Guest User"}</h2>
                    {/* Text color adjusted for both modes */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email || "Not logged in"}</p>
                </div>
            </div>

            {/* Divider */}
            {/* <div className="h-0.5 w-full bg-gray-200 dark:bg-white/5" /> */}

            {/* Popup Theme */}
            <div
                // Container background and border adjusted for both modes
                className="flex flex-col rounded-xl gap-2 p-3 bg-gray-100 dark:bg-gray-800/50 dark:border-gray-700"
            >
                <div className="mb-2">
                    <p className="font-medium text-lg">Extension UI Theme</p>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Changes extension popup appearance</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <Button Icon={Sun} label="light" active={popupTheme} onClick={handleSetPopupTheme} />
                    <Button Icon={Monitor} label="system" active={popupTheme} onClick={handleSetPopupTheme} />
                    <Button Icon={Moon} label="dark" active={popupTheme} onClick={handleSetPopupTheme} />
                </div>
            </div>

            {/* UI Theme */}
            <div
                // Container background and border adjusted for both modes
                className="flex flex-col rounded-xl gap-2 p-3 bg-gray-100 dark:bg-gray-800/50  dark:border-gray-700"
            >
                <div className="mb-2">
                    <p className="font-medium text-lg">Guide UI Theme</p>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Changes guide popup appearance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button Icon={Sun} label="light" active={uiTheme} onClick={handleSetUiTheme} />
                    <Button Icon={Monitor} label="system" active={uiTheme} onClick={handleSetUiTheme} />
                    <Button Icon={Moon} label="dark" active={uiTheme} onClick={handleSetUiTheme} />
                </div>
            </div>

            {/* Divider */}
            {/* <div className="h-0.5 w-full bg-gray-200 dark:bg-white/5" /> */}

            {/* Logout */}
            <div>
                <button
                    onClick={handleLogout}
                    // Retains solid red for both themes, uses white text
                    className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-all text-white"
                >
                    <LogOut className="size-4" />
                    Logout
                </button>
            </div>
        </div>
    )
}