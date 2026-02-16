import { useState } from "react"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import cssText from "data-text:../index.css"
import { sendToBackground } from "@plasmohq/messaging" // Import this

// import "../style.css"
export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

export default function AIInjector() {
    const [input, setInput] = useState("")
    const [response, setResponse] = useState("")
    const [loading, setLoading] = useState(false)
    console.log("working")
    const askAI = async () => {
        if (!input.trim()) return

        setLoading(true)

        try {
            // Send message to the 'askAi' background handler we created
            const data = await sendToBackground({
                name: "askAi",
                body: { message: input }
            })
            if (data.error) {
                setResponse(data.error)
            } else {
                setResponse(data.result)
            }

        } catch (e) {
            console.log("error", e)
            setResponse("Extension messaging failed")
        }

        setLoading(false)
    }

    return (
        <div className="fixed bottom-48 left-1/2 -translate-x-1/2 z-[999999] w-[420px] rounded-xl bg-zinc-900 shadow-2xl p-3 font-mono">

            {response && (
                <div className="text-sm text-zinc-200 mb-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {response}
                </div>
            )}

            <div className="flex gap-2">
                <input
                    className="flex-1 rounded-lg bg-zinc-800 text-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ask AI... lol"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && askAI()}
                />

                <button
                    onClick={askAI}
                    className="rounded-lg bg-indigo-600 px-4 text-white hover:bg-indigo-700 transition"
                >
                    {loading ? "..." : "Send"}
                </button>
            </div>

        </div>
    )
}
