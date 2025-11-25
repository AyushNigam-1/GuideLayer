import { useEffect, useState } from "react"
import { Search, Plus } from "lucide-react"
import { motion } from "framer-motion"
import type { PlasmoCSConfig } from "plasmo"
import './index.css'  // Tailwind import
import { supabase } from "./config/supabase"
import { useNavigate } from "react-router-dom"
import Loading from "./components/Loading"
import { Course } from "./types"

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
        fetchCourses()
        console.log("use effect")
    }, [])

    const fetchCourses = async (): Promise<void> => {
        setLoading(true)
        try {
            const { data } = await supabase
                .from("courses")
                .select("id, title , description")
            console.log(data)
            setCourses(data!)
        } catch (error) {
            console.error('Error fetching courses:', error)
        }
        setLoading(false)
    }

    const handleCreateNew = async () => {
        if (!chrome.sidePanel) {
            return
        }
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tab?.id) {
                return
            }
            await chrome.sidePanel.open({ tabId: tab.id })
            setTimeout(() => {
                window.close()
            }, 500)

        } catch (error: any) {
        }
    }
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                {/* <BookOpen className="w-6 h-6 text-green-500" /> */}
                <h3 className="text-lg font-semibold">Guides</h3>
            </div>

            <div className="relative ">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:border-green-500 focus:outline-none"
                />
            </div>
            <ul className="space-y-2 ">
                {
                    isLoading ?
                        <Loading />
                        : filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <motion.li
                                    whileHover={{ scale: 1.02 }}
                                    className="cursor-pointer"
                                    // onClick={() => handleStartTour(course.id)}
                                    onClick={() => navigate("/course", {
                                        state: course
                                    })}
                                >
                                    <div className="p-2 bg-gray-800 rounded-md flex items-center gap-3 hover:bg-gray-700 transition-colors">
                                        <div>
                                            <h4 className="font-medium">{course.title}</h4>
                                            <p className=" text-gray-400">{course.description}</p>
                                        </div>
                                    </div>
                                </motion.li>
                            ))
                        ) : (
                            <li className="text-center text-gray-400 py-4">
                                No courses found. Try searching again.
                            </li>
                        )}
            </ul>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNew}
                className="w-full py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white "
            >
                <Plus className="w-4 h-4" />
                Create New Guide
            </motion.button>
        </div>
    )
}