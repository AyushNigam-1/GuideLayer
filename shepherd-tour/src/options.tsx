import React, { useState, useEffect } from "react"
import { Plus, Save, X, Target } from "lucide-react"
import type { PlasmoCSConfig } from "plasmo"
import './index.css'  // Tailwind (if set up)
import { motion } from "framer-motion"
export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]  // For options page
}

export default function Options() {
    const [courseName, setCourseName] = useState("")
    const [description, setDescription] = useState("")
    const [elementSelector, setElementSelector] = useState("")  // Auto-filled on pick
    const [status, setStatus] = useState("")
    const [isPicking, setIsPicking] = useState(false)  // Pick mode toggle
    const [windowId, setWindowId] = useState<number | null>(null)

    useEffect(() => {
        // Get current window ID
        chrome.windows.getCurrent((win) => setWindowId(win.id))
    }, [])

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!courseName.trim()) {
            setStatus("Course name is required!")
            return
        }

        try {
            setStatus("Creating course...")
            const courses = await chrome.storage.local.get('courses') as { courses: any[] }
            const newCourses = [...(courses.courses || []), {
                id: Date.now().toString(),
                name: courseName,
                description,
                selector: elementSelector  // Save picked selector
            }]
            await chrome.storage.local.set({ courses: newCourses })
            setStatus("Course created! Refresh popup to see it.")
            setCourseName("")
            setDescription("")
            setElementSelector("")
            setTimeout(() => setStatus(""), 3000)
        } catch (error: unknown) {
            setStatus("Error creating course: " + (error as Error).message)
        }
    }

    const togglePickMode = async (): Promise<void> => {
        const newPicking = !isPicking
        setIsPicking(newPicking)

        if (windowId) {
            if (newPicking) {
                // Background mode for persistence
                chrome.windows.update(windowId, {
                    focused: false,  // Unfocus to allow background clicks
                    drawAttention: true  // Flash if needed
                })
                chrome.runtime.sendMessage({
                    action: "togglePickMode",
                    enabled: true
                })
                setStatus("Pick mode active—click an element in the background tab. Window stays open.")
            } else {
                // Refocus
                chrome.windows.update(windowId, {
                    focused: true
                })
                chrome.runtime.sendMessage({
                    action: "togglePickMode",
                    enabled: false
                })
                setStatus("Pick mode stopped.")
            }
        }
    }

    // Listen for captured element (refocuses window)
    useEffect(() => {
        const listener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
            if (message.action === "elementPicked" && isPicking) {
                setElementSelector(message.selector || message.id || '')  // Fill input
                setStatus("Element picked! Selector: " + (message.selector || message.id || 'Captured'))
                setIsPicking(false)  // Exit mode
                if (windowId) {
                    chrome.windows.update(windowId, { focused: true })  // Refocus without closing
                }
                chrome.tabs.sendMessage(message.tabId, { action: "exitPickMode" })
            }
        }
        chrome.runtime.onMessage.addListener(listener)
        return () => chrome.runtime.onMessage.removeListener(listener)
    }, [isPicking, windowId])

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-6 h-6 text-green-500" />
                    Create New Course
                </h1>

                <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Course Name</label>
                        <input
                            type="text"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            placeholder="e.g., Figma Basics"
                            className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 focus:border-green-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description..."
                            rows={3}
                            className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 focus:border-green-500 focus:outline-none"
                        />
                    </div>

                    {/* Element Selector Input */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Element Selector (for attachTo)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={elementSelector}
                                onChange={(e) => setElementSelector(e.target.value)}
                                placeholder="e.g., #prompt-textarea"
                                className="w-full p-3 bg-gray-800 rounded-md border border-gray-700 focus:border-green-500 focus:outline-none pr-32"
                            />
                            <motion.button
                                type="button"
                                onClick={togglePickMode}
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded-md text-xs font-medium transition-all ${isPicking ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Target className="w-4 h-4 inline" />
                                {isPicking ? 'Stop' : 'Pick'}
                            </motion.button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {isPicking ? 'Click an element in the background tab. Window persists.' : 'Click "Pick" to select an element from the page.'}
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Create Course
                    </button>
                </form>

                {status && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${status.includes('created') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                        }`}>
                        {status}
                    </div>
                )}

                <button
                    onClick={() => window.close()}
                    className="w-full mt-4 py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md text-white flex items-center justify-center gap-2 transition-colors"
                >
                    <X className="w-4 h-4" />
                    Close
                </button>
            </div>
        </div>
    )
}