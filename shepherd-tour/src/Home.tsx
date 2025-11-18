import { useEffect, useState } from "react"
import { Play, Square, Volume2, Search, BookOpen, Plus } from "lucide-react"
import { motion } from "framer-motion"
import type { PlasmoCSConfig } from "plasmo"
import './index.css'  // Tailwind import
import { supabase } from "./config/supabase"
import { Message } from "./types"

export const config: PlasmoCSConfig = {
    matches: ["https://chatgpt.com/*"]
}

export default function Popup() {
    const [status, setStatus] = useState("")
    const [isDisabled, setIsDisabled] = useState(false)
    const [buttonText, setButtonText] = useState("Start Tour")
    const [enableVoice, setEnableVoice] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [courses, setCourses] = useState([])
    // Sample courses list (expand as needed)
    // const courses = [
    //     { id: 'chatgpt', name: 'ChatGPT', icon: Play, description: 'Interactive tour for ChatGPT prompts' },
    //     { id: 'figma', name: 'Figma', icon: Square, description: 'Design workflow guide' }
    // ]

    // Filtered list based on search
    const filteredCourses = courses.filter(course =>
        course?.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    useEffect(() => {
        fetchCourses()
        console.log("use effect")
    }, [])

    const fetchCourses = async (): Promise<void> => {
        try {
            const { data, error } = await supabase
                .from("courses")
                .select("id, title , description")
            console.log(data)
            setCourses(data)
            // console.log('Fetched courses:', data)
            // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            //     if (!tabs[0]?.id) return

            //     chrome.tabs.sendMessage(
            //         tabs[0].id,
            //         {
            //             action: "COURSES_LIST",
            //             payload: data
            //         },
            //         () => {
            //             if (chrome.runtime.lastError) {
            //                 console.error("Messaging error:", chrome.runtime.lastError.message)
            //             }
            //         }
            //     )
            // })
            // sendResponse({ success: true, courses })  // Send back to popup/background
        } catch (error) {
            console.error('Error fetching courses:', error)
        }
    }
    const handleStartTour = async (courseId: string) => {
        setIsDisabled(true)
        setStatus("Starting course...")
        try {
            // 1. Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tab?.id) {
                setStatus("No active tab found")
                return
            }
            // 2. Send DIRECTLY to content script — full object preserved!
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: "startTour",
                courseId,
                enableVoice
            })
            // response comes back from content script
            if (response?.success) {
                setStatus("Tour started! 🎉")
            }
        } catch (err) {
            console.error("Direct message failed:", err)
        }
    }
    const handleCreateNew = async () => {
        if (!chrome.sidePanel) {
            setStatus("Side Panel API not available (requires Chrome 114+).")
            return
        }

        try {
            // Get the ID of the currently active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

            if (!tab?.id) {
                setStatus("No active tab found.")
                return
            }

            // Open the Side Panel for the active tab
            await chrome.sidePanel.open({ tabId: tab.id })

            setStatus("Opening Course Creator Sidebar... 👋")
            // Optionally, close the Popup after opening the Side Panel
            setTimeout(() => {
                window.close()
            }, 500)

        } catch (error: any) {
            setStatus(`Error opening Side Panel: ${error.message}`)
        }
    }
    return (
        // Root: Rounded, no white strips
        <motion.div
            // initial={{ opacity: 0 }}
            // animate={{ opacity: 1 }}
            className="min-w-[320px] bg-gray-900 text-white rounded-2xl shadow-xl border-0 overflow-hidden"
            style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: 'none',
                backgroundColor: '#1f2937'
            }}
        >
            <div className="p-4">
                {/* Short Title */}
                <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-6 h-6 text-green-500" />
                    <h3 className="text-lg font-semibold">Courses</h3>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:border-green-500 focus:outline-none"
                    />
                </div>

                {/* Courses List */}
                <ul className="space-y-2 mb-4">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                            <motion.li
                                // key={course.id}
                                whileHover={{ scale: 1.02 }}
                                className="cursor-pointer"
                                onClick={() => handleStartTour(course.id)}
                            >
                                <div className="p-3 bg-gray-800 rounded-md flex items-center gap-3 hover:bg-gray-700 transition-colors">
                                    {/* <course.icon className="w-5 h-5 text-green-500" /> */}
                                    <div>
                                        <h4 className="font-medium">{course.title}</h4>
                                        <p className="text-xs text-gray-400">{course.description}</p>
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

                {/* Voice Toggle (below list) */}
                <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-md mb-4">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <label className="text-xs font-medium cursor-pointer flex items-center">
                        <input
                            type="checkbox"
                            checked={enableVoice}
                            onChange={(e) => setEnableVoice(e.target.checked)}
                            className="mr-1 rounded"
                        />
                        Enable Voice Narration
                    </label>
                </div>

                {/* Global Start Button (for quick access) */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    // onClick={() => handleStartTour()}
                    disabled={isDisabled}
                    className={`w-full py-3 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isDisabled
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
                        }`}
                >
                    {isDisabled ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Play className="w-4 h-4" />
                    )}
                    {buttonText}
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateNew} // 👈 ATTACHED HERE
                    className="w-full py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white mb-4"
                >
                    <Plus className="w-4 h-4" />
                    Create New Guide
                </motion.button>
                {/* Status */}
                {status && (
                    <motion.div
                        // initial={{ opacity: 0, y: -10 }}
                        // animate={{ opacity: 1, y: 0 }}
                        className={`mt-3 p-2 rounded-md text-sm ${status.includes('started') || status.includes('🎉')
                            ? 'bg-green-900 text-green-300'
                            : status.includes('Error') || status.includes('Failed')
                                ? 'bg-red-900 text-red-300'
                                : 'bg-blue-900 text-blue-300'
                            }`}
                    >
                        {status}
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}