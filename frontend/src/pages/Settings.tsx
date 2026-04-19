import React, { useState, useEffect } from "react"
import { Moon, Sun, LogOut, User, Monitor, ChevronLeft, LucideIcon, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { authClient } from "../lib/auth-client"

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
            className={`p-3 w-full rounded-lg transition-all flex items-center justify-center border-2 
                ${isActive
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
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
            await authClient.signOut()
            nav("/")
        } catch (e) {
            console.error("Logout failed:", e)
        }
    }

    // Load saved themes + user
    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data, error } = await authClient.getSession()

                if (data?.user) {
                    setUser({
                        name: data.user.name || data.user.email.split("@")[0] || "User",
                        email: data.user.email,
                        avatar: data.user.image || undefined
                    })
                } else if (error) {
                    console.error("Session error:", error)
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
        return (
            <div className="h-[500px] flex items-center justify-center bg-white dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-3 space-y-3 h-[500px] bg-white text-gray-900 dark:bg-gray-900 dark:text-white min-w-[300px]">

            <div className="flex items-center justify-between text-gray-900 dark:text-white ">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => nav(-1)}
                        className="p-1 bg-gray-100 rounded-md flex items-center gap-3 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft size="16" />
                    </button>
                    <h3 className="text-xl font-semibold">Settings</h3>
                </div>
                <button
                    className="rounded-full flex items-center gap-3 font-semibold transition-colors text-red-500"
                    onClick={handleLogout}
                >
                    <LogOut size="16" />
                </button>
            </div>

            {/* User Profile */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800 flex gap-4 rounded-lg items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold bg-white dark:bg-gray-700 shadow-sm">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                    )}
                </div>
                <div className="space-y-1 text-left overflow-hidden">
                    <h2 className="text-lg font-bold truncate">{user?.name || "Guest User"}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email || "Not logged in"}</p>
                </div>
            </div>

            <div className="flex flex-col rounded-xl gap-2 p-4 bg-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
                <div className="mb-2">
                    <p className="font-medium text-lg">Extension Theme</p>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Changes extension popup appearance</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <Button Icon={Sun} label="light" active={popupTheme} onClick={handleSetPopupTheme} />
                    <Button Icon={Monitor} label="system" active={popupTheme} onClick={handleSetPopupTheme} />
                    <Button Icon={Moon} label="dark" active={popupTheme} onClick={handleSetPopupTheme} />
                </div>
            </div>

            <div className="flex flex-col rounded-xl gap-2 p-4 bg-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
                <div className="mb-2">
                    <p className="font-medium text-lg">Guide Theme</p>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Changes guides popups appearance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button Icon={Sun} label="light" active={uiTheme} onClick={handleSetUiTheme} />
                    <Button Icon={Monitor} label="system" active={uiTheme} onClick={handleSetUiTheme} />
                    <Button Icon={Moon} label="dark" active={uiTheme} onClick={handleSetUiTheme} />
                </div>
            </div>
        </div>
    )
}