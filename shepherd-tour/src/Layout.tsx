import { useEffect } from "react"
import { Outlet } from "react-router-dom"

const Layout = () => {
    type ThemeValue = "light" | "dark" | "system"

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
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        root.classList.toggle("dark", prefersDark)
    }
    useEffect(() => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(["popupTheme", "uiTheme"], (result) => {
                if (result.popupTheme) applyTheme(result.popupTheme)
            })
        }
    }, [])
    return (
        <div
            className="min-w-[320px] dark:text-gray-900 text-white shadow-xl border-0 overflow-hidden  "
        >
            <Outlet />
        </div>
    )
}

export default Layout