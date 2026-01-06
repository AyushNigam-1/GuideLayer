import "lucide-react"
import { ChevronLeft, Pencil, Play, Trash2 } from "lucide-react";
import { PlasmoCSConfig } from "plasmo";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import Loading from "../components/Loading";
import { supabase } from "../config/supabase";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

const Course = () => {
    const nav = useNavigate()
    const [isLoading, setLoading] = useState<boolean>(false)
    const [isDeleting, setDeleting] = useState(false)
    const { state } = useLocation()
    const data = state as { id: number; title: string; description: string; icon: string, baseUrl: string } | null

    const handleStartTour = async () => {
        console.log(data?.baseUrl)
        setLoading(true)
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tab?.id) {
                return
            }
            await chrome.tabs.sendMessage(tab.id, {
                action: "startTour",
                courseId: data!.id,
                baseUrl: data!.baseUrl
            })
            window.close() // Optional: close popup immediately after sending message
        } catch (err) {
            console.error("Direct message failed:", err)
        }
        finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!chrome.sidePanel) {
            return
        }
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tab?.id) {
                return
            }
            // Save course details to session storage so the side panel can load it
            await chrome.storage.session.set({
                sidebarProps: data
            });
            await chrome.sidePanel.open({ tabId: tab.id })
            setTimeout(() => {
                window.close()
            }, 500)

        } catch (error: any) {
        }
    }

    const handleDelete = async () => {
        if (!data?.id) return
        setLoading(true)
        setDeleting(true) // <--- Changed
        try {
            // 2. Perform Delete (Uncomment your actual DB logic below)
            const { error } = await supabase
                .from("courses")
                .delete()
                .eq("id", data.id)

            if (error) throw error
            console.log("Deleting course...", data.id)
            // 3. Navigate back on success
            nav(-1)

        } catch (err) {
            console.error("Delete failed:", err)
            // alert("Failed to delete guide.")
        } finally {
            setLoading(false)
            setDeleting(false) // <--- Changed
        }
    }
    // Default to light theme background and text, then explicitly override for dark mode
    return (
        <div className="space-y-4 p-3 bg-white text-gray-900 dark:bg-gray-900 dark:text-white min-w-[300px]" >

            {/* Header and Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => nav(-1)}
                        // Light default (bg-gray-100), Dark override (dark:bg-gray-800)
                        className="p-1 bg-gray-100 rounded-md flex items-center gap-3 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft size="16" />
                    </button>
                    <h3 className="text-xl font-semibold">Guide Details</h3>
                </div>
                <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="p-1 rounded-full flex items-center gap-3 hover:bg-gray-200 hover:text-red-400 dark:hover:bg-gray-700 transition-colors"
                    title="Delete Guide"
                >
                    {(isLoading && isDeleting) ? <Loading /> : <Trash2 size={18} />}
                </button>
            </div>

            {/* Course Summary Block */}
            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                    {/* Course Icon */}
                    <img
                        src={`https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${data?.icon}`}
                        alt=""
                        className="w-10 rounded-md"
                    />
                    {/* Title and Author */}
                    <div className="text-left">
                        <h3 className="text-lg font-bold">
                            {data?.title}
                        </h3>
                        <h4 className="text-sm text-gray-500 dark:text-gray-400">
                            by Ayush Nigam
                        </h4>
                    </div>
                </div>
            </div>

            {/* Description */}
            <h4 className="text-sm text-gray-700 dark:text-gray-300 p-1">
                {data?.description}
            </h4>

            {/* Edit Guide Button */}
            <button
                onClick={handleUpdate}
                className="w-full py-2 flex items-center gap-2 justify-center bg-indigo-500 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-600 transition-colors"
            >
                <span className="flex items-center gap-2 justify-center">
                    <Pencil size={16} />
                    Edit Guide
                </span>
            </button>

            {/* Start Guide Button */}
            <button
                onClick={handleStartTour}
                className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-colors"
                disabled={isLoading!}
            >
                {
                    (isLoading && !isDeleting) ?
                        <Loading />
                        :
                        <span className="flex items-center gap-2 justify-center">
                            <Play size={16} />
                            Start Guide
                        </span>}
            </button>
        </div>
    )
}

export default Course