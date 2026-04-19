import { ChevronLeft, Pencil, Play, Trash2, Loader2, Map, Copy, Check, Braces, Code2 } from "lucide-react";
import { PlasmoCSConfig } from "plasmo";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { supabase } from "../config/supabase";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"]
}

const Course = () => {
    const nav = useNavigate()
    const [isLoading, setLoading] = useState<boolean>(false)
    const [isDeleting, setDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const { state } = useLocation()
    const data = state as { id: number; title: string; description: string; icon: string, baseUrl: string } | null
    const cssLink = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/AyushNigam-1/GuideLayer@main/pro-theme.css" />`;
    const jsScript = `<script src="https://cdn.jsdelivr.net/gh/AyushNigam-1/GuideLayer@main/guidelayer-embed.js" data-course-id="${data?.id}" defer></script>`;

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

            {/* Header and Back Button */}
            <div className="flex-none flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => nav(-1)}
                        className="p-1 bg-gray-100 rounded-md flex items-center gap-3 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft size="16" />
                    </button>
                    <h3 className="text-xl font-semibold">Guide Overview</h3>
                </div>
                <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="p-1 rounded-full flex items-center justify-center w-8 h-8 hover:bg-gray-200 hover:text-red-400 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
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
                        <h3 className="text-lg font-bold truncate">
                            {data?.title}
                        </h3>
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {data?.baseUrl}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Scrollable Main Area (Description + Embed) */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-5 custom-scrollbar">

                {/* Description Area */}
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

                {/* Embed Area */}
                <div className="space-y-2.5">
                    {/* Section heading */}
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                        Embed on your site
                    </h4>

                    {/* CSS row */}
                    <EmbedRow
                        label="CSS"
                        icon={<Code2 size={11} strokeWidth={2.5} />}
                        code={cssLink}
                        accent="sky"
                    />

                    {/* JS row */}
                    <EmbedRow
                        label="JavaScript"
                        icon={<Braces size={11} strokeWidth={2.5} />}
                        code={jsScript}
                        accent="amber"
                    />

                    {/* Footer hint */}
                    <p className="text-[10.5px] text-gray-500 leading-relaxed pt-0.5">
                        Paste both before your closing{" "}
                        <code className="rounded bg-gray-800 px-1 py-0.5 font-mono text-gray-400">
                            &lt;/head&gt;
                        </code>{" "}
                        tag.
                    </p>
                </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex-none flex flex-col gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                    onClick={handleUpdate}
                    disabled={isLoading}
                    className="w-full flex items-center py-2 justify-center bg-indigo-500 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                    {(isLoading && isEditing) ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
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
                        <Loader2 className="w-5 h-5 animate-spin" />
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

export default Course

interface EmbedRowProps {
    label: string;
    icon: React.ReactNode;
    code: string;
    accent: string; // tailwind color name, e.g. "sky" | "violet"
}

// ── sub-component ──────────────────────────────────────────────────────────
function EmbedRow({ label, icon, code, accent }: EmbedRowProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const accentMap: Record<string, { ring: string; bg: string; text: string; dot: string }> = {
        sky: {
            ring: "focus-within:ring-sky-500/40 bg-white/5 focus-within:border-sky-500/60",
            bg: "bg-sky-500/10",
            text: "text-sky-400",
            dot: "bg-sky-400",
        },
        amber: {
            ring: "focus-within:ring-amber-500/40 bg-white/5 focus-within:border-amber-500/60",
            bg: "bg-amber-500/10",
            text: "text-amber-400",
            dot: "bg-amber-400",
        },
    };

    const c = accentMap[accent] ?? accentMap.sky;

    return (
        <div className="space-y-1.5">
            {/* Label row */}
            <div className="flex items-center gap-1.5">
                <span className={`${c.text} flex items-center`}>{icon}</span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    {label}
                </span>
                <span className={`ml-auto h-1.5 w-1.5 rounded-full ${c.dot} opacity-70`} />
            </div>

            {/* Input row */}
            <div
                className={`
          group flex items-center gap-0
          rounded-lg border border-gray-700/60 bg-gray-900/70
          ring-2 ring-transparent transition-all duration-200
          ${c.ring}
          overflow-hidden
        `}
            >
                {/* Monospace read-only input */}
                <input
                    readOnly
                    value={code}
                    className="
            flex-1 min-w-0 px-3 py-2.5
            bg-transparent text-[11.5px] font-mono text-gray-300
            placeholder-gray-600 outline-none
            select-all cursor-text
          "
                    onFocus={(e) => e.target.select()}
                    aria-label={`${label} embed snippet`}
                />

                {/* Divider */}
                <span className="h-5 w-px bg-gray-700/60 shrink-0" />

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className={`
            flex items-center gap-1.5 px-3 py-2.5 shrink-0
            text-[11px] font-medium
            transition-all duration-150
            ${copied
                            ? "text-green-400 bg-green-500/10"
                            : `text-gray-400 hover:${c.text} hover:${c.bg}`
                        }
          `}
                    title={`Copy ${label} snippet`}
                >
                    {copied ? (
                        <>
                            <Check size={12} strokeWidth={2.5} />
                        </>
                    ) : (
                        <>
                            <Copy size={12} strokeWidth={2} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}