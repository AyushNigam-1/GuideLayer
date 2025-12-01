// src/components/SettingsPanel.tsx
import { useState, useEffect } from "react"
import { Moon, Sun, LogOut, User, Monitor, ChevronLeft, LucideIcon } from "lucide-react"
import { supabase } from "../config/supabase"
import { useNavigate } from "react-router-dom"

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
    const nav = useNavigate()

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
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <button onClick={() => nav(-1)} className="p-1 bg-gray-800 rounded-md flex items-center gap-3 hover:bg-gray-700 transition-colors" >
                    <ChevronLeft size="16" />
                </button>
                <h3 className="text-xl font-semibold">Profile</h3>
            </div>
            {/* User Profile */}
            <div className="p-4 border-b border-gray-800 bg-white/5 flex gap-2 rounded-lg">
                <div className="w-12 rounded-full  flex items-center justify-center text-3xl font-bold shadow-lg">
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
            <div className="flex flex-col justify-between rounded-xl gap-2">
                <div>
                    <p className="font-medium text-lg">Extension UI Theme</p>
                    <p className=" text-gray-400">Changes extension popup background</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <Button Icon={Sun
                    } onClick={() => "lol"} popupTheme={popupTheme} />
                    <Button Icon={Monitor
                    } onClick={() => "lol"} popupTheme={popupTheme} />
                    <Button Icon={Moon
                    } onClick={() => "lol"} popupTheme={popupTheme} />
                </div>
            </div>

            {/* UI Theme (for your tours) */}
            <div className="flex flex-col justify-between  rounded-xl gap-2">
                <div>
                    <p className="font-medium text-lg">Guide UI Theme</p>
                    <p className="text-gray-400">Changes tour popup appearance</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button Icon={Sun
                    } onClick={() => "lol"} popupTheme={popupTheme} />
                    <Button Icon={Monitor
                    } onClick={() => "lol"} popupTheme={popupTheme} />
                    <Button Icon={Moon
                    } onClick={() => "lol"} popupTheme={popupTheme} />
                </div>
            </div>
            <div className="h-0.5 w-full bg-white/5" />

            {/* Logout Button */}
            <div className="border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-red-400 hover:bg-red-500 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                >
                    <LogOut className="size-4" />
                    Logout
                </button>
            </div>
        </div>
    )
}

interface ButtonProps {
    Icon: LucideIcon;           // ← This is the correct type
    onClick?: () => void;
    popupTheme?: "light" | "dark";
    children?: React.ReactNode; // optional text
}

const Button: React.FC<ButtonProps> = ({ Icon, onClick, popupTheme }) => {
    return (
        <button
            onClick={onClick}
            className={`p-3 w-full rounded-lg transition-all flex items-center justify-center  ${popupTheme === "light"
                ? "bg-white text-black ring-4 ring-green-500 shadow-lg"
                : "bg-white/5 hover:bg-white/10"
                }`}
        >
            <Icon className="w-5 h-5" />
            {/* {<icon>} */}
        </button>
    )
}