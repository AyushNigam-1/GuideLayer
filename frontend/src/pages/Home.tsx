import { useEffect, useState } from "react"
import { Search, Plus, Settings, Loader2, Map } from "lucide-react"
import { motion } from "framer-motion"
import type { PlasmoCSConfig } from "plasmo"
import '../index.css'
import { supabase } from "../config/supabase"
import { useNavigate } from "react-router-dom"
import type { Course } from "../types"
import { authClient } from "../lib/auth-client"

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

export default function Popup() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setLoading] = useState(true)
    const [courses, setCourses] = useState<Course[]>([])

    const filteredCourses = courses.filter(course =>
        course?.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        const init = async () => {
            try {
                const { data } = await authClient.getSession()

                if (data?.user?.id) {
                    await fetchCourses(data.user.id)
                } else {
                    navigate("/signin")
                }
            } catch (error) {
                console.error("Session check failed:", error)
                navigate("/signin")
            }
        }
        init()
    }, [navigate])

    const fetchCourses = async (userId: string): Promise<void> => {
        try {
            const { data, error } = await supabase
                .from("courses")
                .select("id, title, description, icon, baseUrl")
                .eq("user_id", userId)

            if (error) throw error
            setCourses(data || [])
        } catch (error) {
            console.error('Error fetching courses:', error)
            setCourses([])
        } finally {
            setLoading(false)
        }
    }

    const handleCreateNew = async () => {
        if (!chrome.sidePanel) return
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tab?.id) return
            await chrome.sidePanel.open({ tabId: tab.id })
            setTimeout(() => {
                window.close()
            }, 500)
        } catch (error: any) {
            console.error(error)
        }
    }

    if (isLoading) {
        return (
            <div className="h-[500px] flex items-center justify-center bg-white dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[500px] p-3 gap-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-white min-w-[300px]">

            <div className="flex-none">
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-200 mb-4">
                    <h3 className="text-xl font-semibold">Guides</h3>
                    <button
                        className="p-1 rounded-full flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => navigate("/settings")}
                    >
                        <Settings size="20" />
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Guides..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-900 rounded-md focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Added custom scrollbar classes here and bumped pr-1 to pr-2 so it doesn't overlap the scrollbar */}
            <ul className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded-full">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                        <motion.li
                            key={course.id}
                            className="cursor-pointer"
                            onClick={() => navigate("/course", { state: course })}
                        >
                            <div className="p-2 flex items-center gap-3 rounded-lg border border-transparent bg-gray-100 dark:bg-gray-800  hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200 active:scale-[0.99] cursor-pointer group">

                                {course.icon ? (
                                    <img
                                        src={`https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${course.icon}`}
                                        alt=""
                                        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                        <Map className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-lg text-gray-600 dark:text-gray-200 truncate">
                                        {course.title}
                                    </h4>
                                    <p className="text-gray-500 truncate dark:text-gray-400 text-xs">
                                        {course.baseUrl}
                                    </p>
                                </div>
                            </div>
                        </motion.li>
                    ))
                ) : (
                    <li className="text-center text-gray-500 dark:text-gray-400 h-full my-auto mx-auto">
                        {courses.length === 0 ? "No guides found." : "No guides found. Try searching again"}
                    </li>
                )}
            </ul>

            <div className="flex-none pt-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateNew}
                    className="w-full py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                    <Plus className="w-4 h-4" />
                    Create New Guide
                </motion.button>
            </div>
        </div>
    )
}