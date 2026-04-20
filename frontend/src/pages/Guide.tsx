import { ChevronLeft, Pencil, Play, Trash2, Loader2, Map, Copy, Check } from "lucide-react";
import { PlasmoCSConfig } from "plasmo";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../config/supabase";
import { CourseMetadata } from "../types";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

const Guide = () => {
    const nav = useNavigate()
    const [isLoading, setLoading] = useState<boolean>(false)
    const [isDeleting, setDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [copied, setCopied] = useState(false);

    const { state } = useLocation()
    const data = state as CourseMetadata | null
    const jsScript = `<script src="https://cdn.jsdelivr.net/gh/AyushNigam-1/GuideLayer@master/frontend/src/contents/guidelayer-embed.js" data-course-id="${data?.id}" defer></script>`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(jsScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
        setLoading(true)
        setIsEditing(true)
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
            console.error(error);
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
        <div className="flex flex-col h-[500px] p-3 gap-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-white min-w-[300px]" >

            <div className="flex-none flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => nav(-1)}
                        className="p-1 bg-gray-100 rounded-md flex items-center gap-3 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors "
                    >
                        <ChevronLeft size="16" />
                    </button>
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-200">Overview</h3>
                </div>
                <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="p-1 rounded-full flex items-center justify-center w-8 h-8 hover:bg-gray-200 hover:text-red-400 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-200"
                    title="Delete Guide"
                >
                    {(isLoading && isDeleting) ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 size={18} />}
                </button>
            </div>

            <div className="flex-none flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3 w-full">
                    {data?.icon ? (
                        <img
                            src={`https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${data.icon}`}
                            alt=""
                            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <Map className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                    )}

                    <div className="text-left flex-1 min-w-0">
                        <h3 className="text-lg font-bold truncate text-gray-600 dark:text-gray-200">
                            {data?.title}
                        </h3>
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {data?.baseUrl}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded-full">
                {data?.description && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                            Description
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {data.description}
                        </p>
                    </div>
                )}

                <div className="space-y-2.5">
                    <div className="space-y-1.5">
                        <div className="group flex items-stretch gap-0 rounded-lg border border-gray-200 dark:border-gray-700/60 bg-gray-100 dark:bg-gray-900/70 focus-within:ring-2 focus-within:ring-amber-500/40 focus-within:border-amber-500/60 overflow-hidden ring-2 ring-transparent transition-all duration-200">
                            <input
                                readOnly
                                value={jsScript}
                                className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-xs font-mono text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 dark:bg-white/5 outline-none select-all cursor-text"
                                onFocus={(e) => e.target.select()}
                                aria-label="JavaScript embed snippet"
                            />
                            <span className="self-center h-5 w-px bg-gray-200 dark:bg-gray-700/60 shrink-0" />
                            <button
                                onClick={handleCopy}
                                className={`flex items-center justify-center gap-1.5 px-3 shrink-0 text-[11px] dark:bg-white/5 font-medium transition-all duration-150 ${copied ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/10" : "text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:text-amber-400 dark:hover:bg-amber-500/10"}`}
                                title="Copy JavaScript snippet"
                            >
                                {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pt-0.5">
                            - Paste this snippet right before your closing{" "}
                            <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 font-mono text-gray-600 dark:text-gray-400">
                                &lt;/body&gt;
                            </code>{" "}
                            tag.
                        </p>
                    </div>

                    <hr className="border-gray-100 dark:border-white/5" />

                    <div className="mt-5 space-y-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            The script exposes a global object. You can trigger the tour from any button click on your website using:
                        </p>
                        <code className="block w-full bg-gray-100 dark:bg-white/5 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-800 font-mono text-xs text-indigo-600 dark:text-indigo-300 select-all cursor-text">
                            window.GuideLayer.start()
                        </code>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pt-1">
                            You can also force a specific theme instead of relying on the system default:
                        </p>
                        <code className="block w-full bg-gray-100 dark:bg-white/5 px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-800 font-mono text-xs text-indigo-600 dark:text-indigo-300 select-all cursor-text">
                            window.GuideLayer.setTheme('dark')
                        </code>
                    </div>

                </div>

            </div>

            <div className="flex-none flex flex-col gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={handleUpdate}
                    disabled={isLoading}
                    className="w-full flex items-center py-2 justify-center bg-indigo-500 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                    {(isLoading && isEditing) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2 justify-center">
                            <Pencil size={16} />
                            Edit Guide
                        </span>
                    )}
                </button>

                <button
                    onClick={handleStartTour}
                    className="w-full flex items-center py-2 justify-center bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                >
                    {(isLoading && !isDeleting && !isEditing) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2 justify-center">
                            <Play size={16} />
                            Start Guide
                        </span>
                    )}
                </button>
            </div>
        </div>
    )
}

export default Guide