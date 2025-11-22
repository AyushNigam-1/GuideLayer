import "lucide-react"
import { Play } from "lucide-react";
import { PlasmoCSConfig } from "plasmo";
import { useState } from "react";
import { useLocation } from "react-router-dom"
import Loading from "./components/Loading";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

const Course = () => {
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
            <h3 className="text-lg font-semibold">Course Details</h3>
            <div className="space-y-2 ">
                {/* <img src="https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/youtube-app-icon-hd.png" className="size-12" alt="" /> */}
                <div className="">
                    <h3 className="text-lg">
                        {data?.title}
                    </h3>
                    <h4>
                        by Ayush Nigam
                    </h4>
                </div>
            </div>
            <h4 className="">
                {data?.description}
            </h4>
            <button className="w-full py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white " onClick={handleStartTour} >
                {
                    isLoading ?
                        <Loading />
                        :
                        <>
                            <Play size={16} />
                            Start Guide
                        </>}
            </button>
        </div>
    )
}

export default Course