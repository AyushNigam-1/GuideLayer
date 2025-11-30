import "lucide-react"
import { ChevronLeft, Play } from "lucide-react";
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
    const data = state as { id: number; title: string; description: string } | null

    const handleStartTour = async () => {
        // console.log(data?.id)
        setLoading(true)
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tab?.id) {
                return
            }
            await chrome.tabs.sendMessage(tab.id, {
                action: "startTour",
                courseId: data!.id,
            })
            // console.log("working")
        } catch (err) {
            console.error("Direct message failed:", err)
        }
        finally {
            setLoading(false)
        }
    }
    return (
        <div className="space-y-4" >
            <div className="flex items-center gap-2">
                <button onClick={() => nav(-1)} className="p-1 bg-gray-800 rounded-md flex items-center gap-3 hover:bg-gray-700 transition-colors" >
                    <ChevronLeft size="16" />
                </button>
                <h3 className="text-xl font-semibold">Course Details</h3>
            </div>
            <div className="space-y-2 ">
                {/* <img src="https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/youtube-app-icon-hd.png" className="size-12" alt="" /> */}
                <div className="">
                    <h3 className="text-lg font-bold">
                        {data?.title}
                    </h3>
                    <h4>
                        by Ayush Nigam
                    </h4>
                </div>
            </div>
            <h4 className="text-sm">
                {data?.description}
            </h4>
            <button className="w-full py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-500 transition-colors " onClick={handleStartTour} >
                {
                    isLoading ?
                        <Loading />
                        :
                        <span className="flex items-center gap-2 justify-center ">
                            <Play size={16} />
                            Start Guide
                        </span>}
            </button>
        </div>
    )
}

export default Course