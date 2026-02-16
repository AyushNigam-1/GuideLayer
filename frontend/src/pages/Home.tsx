import { useEffect, useState } from "react"
import { Search, Plus, Settings } from "lucide-react"
import { motion } from "framer-motion"
import type { PlasmoCSConfig } from "plasmo"
import '../index.css'
import { supabase } from "../config/supabase"
import { useNavigate } from "react-router-dom"
import Loading from "../components/Loading"
import type { Course } from "../types" // Assuming types are exported here

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

export default function Popup() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setLoading] = useState(false)
    const [courses, setCourses] = useState<Course[]>([])

    const filteredCourses = courses.filter(course =>
        course?.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.id) {
                fetchCourses(session.user.id)
            }
        })()
    }, [])

    const fetchCourses = async (userId: string): Promise<void> => {
        setLoading(true)
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
        } catch (error: any) { }
    }

    return (
        // CHANGE 1: Used 'flex flex-col' and 'gap-4' instead of space-y-4
        // 'h-[500px]' fixes the height, flex manages the internal layout
        <div className="flex flex-col h-[500px] p-3 gap-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">

            {/* Header Section (Static) */}
            <div className="flex-none">
                <div className="flex items-center justify-between text-gray-900 dark:text-white mb-4">
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
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-900 rounded-md focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:focus:border-green-500"
                    />
                </div>
            </div>

            {/* CHANGE 2: Scrollable List Area 
                - flex-1: Takes up all remaining space
                - overflow-y-auto: Adds scrollbar if content overflows
                - min-h-0: Prevents flex items from overflowing their container
            */}
            <ul className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
                {isLoading ? (
                    <Loading />
                ) : filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                        <motion.li
                            key={course.id}
                            whileHover={{ scale: 1.02 }}
                            className="cursor-pointer"
                            onClick={() => navigate("/course", { state: course })}
                        >
                            <div className="p-2 bg-gray-100 rounded-md flex items-center gap-3 hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700">
                                <img
                                    src={`https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${course.icon}`}
                                    alt=""
                                    className="w-16 rounded-md object-cover"
                                />
                                <div>
                                    <h4 className="font-medium text-lg text-gray-900 dark:text-white">
                                        {course.title}
                                    </h4>
                                    <p className="text-gray-500 line-clamp-2 dark:text-gray-400 text-sm">
                                        {course.description}
                                    </p>
                                </div>
                            </div>
                        </motion.li>
                    ))
                ) : (
                    <li className="text-center text-gray-500 dark:text-gray-400 py-4">
                        {courses.length === 0 ? "No guides found." : "No guides found. Try searching again"}
                    </li>
                )}
            </ul>

            {/* CHANGE 3: Footer Button (Static at bottom) 
                Since the UL above has flex-1, this stays anchored at the bottom
            */}
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