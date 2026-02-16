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
            window.close()
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
        setDeleting(true)
        try {
            const { error } = await supabase
                .from("courses")
                .delete()
                .eq("id", data.id)

            if (error) throw error
            console.log("Deleting course...", data.id)
            nav(-1)

        } catch (err) {
            console.error("Delete failed:", err)
        } finally {
            setLoading(false)
            setDeleting(false)
        }
    }

    return (
        // LAYOUT CHANGE 1: 'flex flex-col' enables vertical stacking, 'h-[500px]' fixes height
        <div className="flex flex-col h-[500px] p-3 gap-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-white min-w-[300px]" >

            {/* Header and Back Button (Static flex item) */}
            <div className="flex-none flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => nav(-1)}
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

            {/* Course Summary Block (Static flex item) */}
            <div className="flex-none flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                    <img
                        src={`https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${data?.icon}`}
                        alt=""
                        className="w-10 rounded-md"
                    />
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

            {/* LAYOUT CHANGE 2: Description Area 
               - flex-1: Takes up all remaining space
               - overflow-y-auto: Scrolls if content is too long
               - min-h-0: Prevents flex container blowout
            */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                <h4 className="text-sm text-gray-700 dark:text-gray-300 p-1 whitespace-pre-wrap">
                    {data?.description}
                </h4>
            </div>

            {/* LAYOUT CHANGE 3: Footer Buttons (Static at bottom) */}
            <div className="flex-none flex flex-col gap-3 pt-2">
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
        </div>
    )
}

export default Course