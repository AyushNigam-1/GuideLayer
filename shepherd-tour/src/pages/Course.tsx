import "lucide-react"
import { ChevronLeft, Pencil, Play } from "lucide-react";
import { PlasmoCSConfig } from "plasmo";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import Loading from "../components/Loading";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

const Course = () => {
    const nav = useNavigate()
    const [isLoading, setLoading] = useState<Boolean>(false)
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
            // console.log("working")
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
    return (
        <div className="space-y-4" >
            <div className="flex items-center gap-2">
                <button onClick={() => nav(-1)} className="p-1 bg-gray-800 rounded-md flex items-center gap-3 hover:bg-gray-700 transition-colors" >
                    <ChevronLeft size="16" />
                </button>
                <h3 className="text-xl font-semibold">Guide Details</h3>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={`https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${data?.icon}`} alt="" className="w-10 rounded-md" />
                    <div>
                        <h3 className="text-lg font-bold">
                            {data?.title}
                        </h3>
                        <h4>
                            by Ayush Nigam
                        </h4>
                    </div>
                </div>
                {/* <button className="p-2 bg-gray-800 rounded-md flex items-center gap-3 hover:bg-gray-700 transition-colors" onClick={() => handleUpdate()} >
                    <Edit size="20" />
                </button> */}
            </div>
            <h4 className="text-sm">
                {data?.description}
            </h4>
            <button className="w-full py-2 flex items-center gap-2 justify-center   bg-indigo-400 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-500 transition-colors " onClick={handleUpdate} >
                <span className="flex items-center gap-2 justify-center">
                    <Pencil size={16} />
                    Edit Guide
                </span>
            </button>
            <button className="w-full py-2  bg-indigo-400 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-500 transition-colors " onClick={handleStartTour} >
                {
                    isLoading ?
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