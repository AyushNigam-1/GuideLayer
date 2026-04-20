import { useState, useEffect, useCallback, ChangeEvent } from "react"
import { Wand2, X, Plus, Trash2, CheckSquare, Save, Loader2, CheckCircle2 } from "lucide-react"
import "./index.css"
import { CourseMetadata, MediaType, Step, ThemeValue } from "./types"
import { supabase } from "./config/supabase"
import Input from "./components/Input"
import FileUpload from "./components/FileUpload"
import { authClient } from "./lib/auth-client"

const SidePanel = () => {
    const [isPicking, setIsPicking] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState<MediaType | null>();
    const [userId, setUserId] = useState("")
    const [metadata, setMetadata] = useState<CourseMetadata>({ title: "", description: "", baseUrl: "", icon: "" })
    const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
    const [courseId, setCourseId] = useState<string>()
    const [isDeleting, setDeleting] = useState<MediaType | null>()

    const [steps, setSteps] = useState<Step[]>([{
        _id: 'step-1',
        text: 'Welcome! Start adding steps and saving your tour to your browser storage.',
        file: '',
        element: '',
        on: 'right',
        order_index: 0,
        audio: "",
        site_url: "",
        click_required: false,
        input_required: false,
        input: ""
    }]);

    useEffect(() => {
        chrome.storage.session.get("sidebarProps", (result) => {
            if (result.sidebarProps) {
                setMetadata(result.sidebarProps);
                chrome.storage.session.remove("sidebarProps");
                setCourseId(result.sidebarProps.id)
                fetchSteps(result.sidebarProps.id)
            }
        });
    }, []);

    const fetchSteps = async (id: string) => {
        try {
            const { data: steps, error } = await supabase
                .from("steps")
                .select("*")
                .eq("course_id", id)
                .order("order_index")
            console.log("steps", steps)
            setSteps(steps as Step[])
            if (error) {
                console.error("Supabase error:", error)
                return
            }
        } catch (err) {
            console.error("[Content Script] Unexpected error:", err)
            // sendResponse({ success: false })
        }
    }

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data, error } = await authClient.getSession()
                if (data?.user) {
                    console.log("session", data)
                    setUserId(data.user.id)
                } else if (error) {
                    console.error("Session error:", error)
                }
            } catch (err) {
                console.error("Failed to fetch session:", err)
            }
        }
        fetchUser()
    }, [])

    const handleSaveCourse = async () => {
        if (!userId) {
            alert("Please login first");
            return;
        }
        setLoading(true);

        try {
            const stepsWithIds = steps
                .map((step, index) => ({
                    text: step.text.trim(),
                    file: step.file || "",
                    element: step.element || "",
                    audio: step.audio || "",
                    on: step.on || "right",
                    order_index: index,
                    site_url: step.site_url,
                    click_required: step.click_required,
                    input_required: step.input_required,
                    input: step.input
                    // Removed vector_id generation
                }))
                .filter(step => step.text !== "");

            let activeCourseId = courseId;

            if (courseId) {
                console.log("Updating existing course:", courseId);

                // Update course metadata
                const { error: courseError } = await supabase
                    .from("courses")
                    .update({
                        title: metadata.title,
                        description: metadata.description,
                        icon: metadata.icon,
                        baseUrl: metadata.baseUrl
                    })
                    .eq("id", courseId);

                if (courseError) throw courseError;

                // Delete old steps and insert new ones
                await supabase.from("steps").delete().eq("course_id", courseId);

                const stepsToInsert = stepsWithIds.map(step => ({
                    ...step,
                    course_id: courseId,
                }));

                const { error } = await supabase.from("steps").insert(stepsToInsert);
                if (error) throw error;

                setIsSuccess(true);

            } else {
                console.log("Creating new course");

                // Insert new course metadata
                const { data: courseData, error: courseError } = await supabase
                    .from("courses")
                    .insert({
                        user_id: userId,
                        title: metadata.title,
                        description: metadata.description,
                        icon: metadata.icon,
                        baseUrl: metadata.baseUrl
                    })
                    .select("id")
                    .single();

                if (courseError) throw courseError;

                activeCourseId = courseData.id;

                // Insert steps mapped to the new course
                const stepsToInsert = stepsWithIds.map(step => ({
                    ...step,
                    course_id: activeCourseId,
                }));

                const { error: stepsError } = await supabase.from("steps").insert(stepsToInsert);
                if (stepsError) throw stepsError;

                setCourseId(activeCourseId);
                setIsSuccess(true); // Replaced alert
            }

        } catch (error: any) {
            console.error("Save failed:", error);
            alert("Failed to save: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const addStep = () => {
        const newId = `step-${Date.now()}`;
        const newStep: Step = {
            _id: newId,
            text: `Step ${steps.length + 1} instructions.`,
            file: '',
            element: '',
            on: 'right', // Set default placement
            order_index: steps.length,
            audio: "",
            site_url: "",
            click_required: false,
            input_required: false,
            input: ""
        };
        setSteps(prevSteps => [...prevSteps, newStep]);
        setActiveStepIndex(steps.length);
    };

    const deleteStep = (index: number) => {
        if (steps.length === 1) {
            alert("Cannot delete the last step.");
            return;
        }
        const newSteps = steps.filter((_, i) => i !== index);
        setSteps(newSteps);
        if (activeStepIndex === index) {
            setActiveStepIndex(0); // Default to the first step
        } else if (activeStepIndex > index) {
            setActiveStepIndex(activeStepIndex - 1);
        }
    };

    const setActiveStep = (index: number) => {
        setActiveStepIndex(index);
    };

    // Handler for updating top-level fields like text and image
    const updateStep = useCallback((index: number, field: any, value: string | boolean) => {
        console.log(field, value)
        setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[index] = {
                ...newSteps[index],
                [field]: value
            };
            return newSteps;
        });
        console.log(steps)
    }, []);

    const handleElementSelection = useCallback((selector: string) => {
        if (activeStepIndex !== null) {
            updateStep(activeStepIndex, 'element', selector);
        }
        setIsPicking(false);
        console.log(`[Picker] Selector assigned: ${selector} to index ${activeStepIndex}`);
    }, [activeStepIndex, updateStep, steps.length]);

    useEffect(() => {
        const listener = (message: any) => {
            if (message.action === "ELEMENT_SELECTED") {
                handleElementSelection(message.selector);
            } else if (message.action === "PICKER_ABORTED") {
                setIsPicking(false);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, [handleElementSelection]);

    const startElementPicker = async () => {
        if (activeStepIndex === null) {
            alert("Please select a step to assign an element.");
            return;
        }
        setIsPicking(true);

        chrome.tabs.query({ active: true }, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: "START_ELEMENT_PICKER" }, () => chrome.runtime.lastError);
                }
            });
        });
    };

    const handleAbortPicking = async () => {
        setIsPicking(false);

        chrome.tabs.query({ active: true }, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: "STOP_ELEMENT_PICKER" }, () => chrome.runtime.lastError);
                }
            });
        });
    };

    const handleDeleteFile = async (folderPath: string, type: MediaType) => {
        setDeleting(type)
        if (!folderPath) return;
        console.log(folderPath)
        try {
            const bucket = supabase.storage.from("images");
            const { data, error } = await bucket.remove([folderPath]);
            if (error) {
                console.error('Supabase Deletion Error:', error);
            } else if (data && data.length > 0) {
                if (type == "icon") {
                    console.log("removed Icon")
                    setMetadata((prev) => ({ ...prev, icon: "" }))
                }
                else {
                    updateStep(activeStepIndex, type, "");
                }
                console.log("wokring delete", data)
            } else {
                console.log(data, error)
                console.log("lol")
            }
        } catch (e) {
            console.error('Unexpected Deletion Error:', e);
            // setStatus(`An unexpected error occurred: ${(e as Error).message}`);
        } finally {
            setDeleting(null)
            // setIsLoading(false);
        }
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, type: MediaType) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(type);
        const folderPath = `${crypto.randomUUID()}-${file.name}`;
        try {
            const { error } = await supabase.storage
                .from('images') // Use a suitable bucket name, 'images' is a common default
                .upload(folderPath, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            if (error) {
                throw error;
            }
            if (type == "icon") {
                setMetadata((prev) => ({ ...prev, icon: folderPath }))
            }
            if (activeStepIndex !== null) {
                updateStep(activeStepIndex, type, folderPath);
            }

        }
        catch (error: any) {
            console.error(`Image upload failed: ${error.message || 'Unknown error'}`);
        }
        finally {
            setIsUploading(null);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const activeStep = steps[activeStepIndex];
    const currentPlacement = activeStep?.on || "right";

    if (steps.length === 0 || (steps.length === 1 && steps[0]._id === 'step-1' && !courseId && !metadata.title)) {
        if (isLoading) {
            return (
                <div className="p-4 flex flex-col h-full bg-gray-900 text-white items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
            );
        }
    }

    const applyTheme = (theme: ThemeValue) => {
        const root = document.documentElement
        if (theme === "light") {
            root.classList.remove("dark")
            return
        }
        if (theme === "dark") {
            root.classList.add("dark")
            return
        }
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        root.classList.toggle("dark", prefersDark)
    }

    useEffect(() => {
        if (chrome?.storage?.sync) {
            chrome.storage.sync.get(["popupTheme", "uiTheme"], (result) => applyTheme(result.popupTheme))
        }
        const handleStorageChange = (
            changes: { [key: string]: chrome.storage.StorageChange },
            areaName: string
        ) => {
            if (areaName === "sync" && changes.popupTheme) {
                applyTheme(changes.popupTheme.newValue as ThemeValue);
            }
        };
        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, [])
    if (isSuccess) {
        return (
            <div className="p-4 flex flex-col h-screen bg-white dark:bg-gray-900 font-mono items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Guide Saved!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm px-2">
                    Your guide has been successfully {courseId ? "updated" : "created"}. You can now close this panel and view it in your main extension menu.
                </p>

                <div className="w-full space-y-3 mt-10">
                    <button
                        onClick={async () => {
                            try {
                                if (chrome.action && chrome.action.openPopup) {
                                    await chrome.action.openPopup();
                                } else {
                                    console.warn("Please update your Chrome browser to support auto-opening popups.");
                                }
                            } catch (error) {
                                console.error("Could not open popup:", error);
                            } finally {
                                window.close();
                            }
                        }}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-600 transition-colors"
                    >
                        <CheckCircle2 size={16} />
                        Close Panel & Open App
                    </button>
                    <button
                        onClick={() => setIsSuccess(false)}
                        className="w-full py-3 bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Continue Editing
                    </button>
                </div>
            </div>
        )
    }
    return (
        <div className="p-4 flex flex-col h-full bg-white  dark:bg-gray-900 dark:text-white font-mono space-y-6">
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300"> {courseId ? "Update" : "New"} Guide</h3>
            <Input
                label="Title"
                value={metadata.title}
                onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g Chatgpt or Youtube etc"
            />
            <Input
                label="Site Base Url"
                value={metadata.baseUrl}
                onChange={(e) => setMetadata((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="e.g chatgpt.com"
            />
            <FileUpload file={metadata.icon} isDeleting={isDeleting!} handleDeleteFile={handleDeleteFile} handleFileChange={handleFileChange} isUploading={isUploading!} label="Icon" type="icon" />
            <Input
                label="Description"
                placeholder="e.g Course Description here"
                value={metadata.description}
                onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))}
                isTextArea={true}
            />

            <hr className="border-gray-300 dark:border-gray-700" />

            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Steps </h2>
                <div
                    className="max-h-32 overflow-y-auto space-y-2 p-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-inner 
    scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 
    hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 scrollbar-thumb-rounded-full"
                >
                    {steps.map((step, index) => (
                        <div
                            key={step._id}
                            className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all outline-none focus:outline-none select-none border border-transparent
        ${index === activeStepIndex
                                    ? 'bg-indigo-100/40 dark:bg-indigo-900/40'
                                    : 'bg-white hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-gray-600'
                                }`}
                            onClick={() => { setActiveStep(index); console.log("index", index) }}
                        >
                            <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-200">
                                {index + 1}. {step.text.substring(0, 30) || "New Step"}
                            </span>
                            <div className="flex items-center space-x-2">
                                {step.element && <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />}
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteStep(index); }}
                                    className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Step Editor */}
            {activeStep && (
                <div
                    className="flex flex-col space-y-6 rounded-lg "
                >
                    <Input
                        label="Text"
                        value={activeStep.text}
                        onChange={(e: any) => updateStep(activeStepIndex, 'text', e.target.value)}
                        placeholder="Write Guide text here"
                        isTextArea={true}
                    />
                    <Input
                        label="Site Url"
                        value={activeStep.site_url}
                        onChange={(e) => updateStep(activeStepIndex, 'site_url', e.target.value)}
                        placeholder="e.g chatgpt.com/settings"
                    />
                    <FileUpload file={activeStep.file} isDeleting={isDeleting!} handleDeleteFile={handleDeleteFile} handleFileChange={handleFileChange} isUploading={isUploading!} label="Attach Image/Video (Optional)" type="file" />
                    <FileUpload file={activeStep.audio} isDeleting={isDeleting!} handleDeleteFile={handleDeleteFile} handleFileChange={handleFileChange} isUploading={isUploading!} label="Attach Audio (Optional)" type="audio" />

                    <Input
                        label="Attach UI Element"
                        value={activeStep.element}
                        onChange={(e: any) => updateStep(activeStepIndex, 'element', e.target.value)}
                        placeholder="e.g #centeredDiv"
                        disabled={true}
                    />

                    {/* Element Picker Buttons */}
                    {isPicking ? (
                        <button
                            onClick={handleAbortPicking}
                            className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                        >
                            <X size={15} />
                            Cancel Picking...
                        </button>
                    ) : (
                        <button
                            onClick={startElementPicker}
                            className="w-full py-2 bg-indigo-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
                            disabled={isPicking || activeStepIndex === null}
                        >
                            <Wand2 size={15} />
                            Pick Element
                        </button>
                    )}

                    {/* Picker Info */}
                    {/* <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                        {isPicking
                            ? "Click to select, or press Cancel."
                            : "Click to assign a target element."
                        }
                    </p> */}
                    <div>
                        <label htmlFor="" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Actions</label>
                        <div className="flex gap-2 items-center" >
                            <input
                                type="checkbox"
                                defaultChecked={false}
                                checked={activeStep.click_required}
                                onChange={(e) => updateStep(activeStepIndex, 'click_required', e.target.checked)}
                                className="w-4 h-4 accent-indigo-600 rounded border-gray-300 focus:ring-indigo-500 focus:ring-2"
                            />
                            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 ">Click Required</p>
                            <input
                                type="checkbox"
                                defaultChecked={false}
                                checked={activeStep.input_required}
                                onChange={(e) => updateStep(activeStepIndex, 'input_required', e.target.checked)}
                                className="w-4 h-4 accent-indigo-600 rounded border-gray-300 focus:ring-indigo-500 focus:ring-2"

                            />
                            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 ">Input Required</p>
                        </div>
                    </div>
                    {
                        activeStep.input_required && <Input
                            label="Enter Required Text"
                            value={activeStep.input}
                            onChange={(e: any) => updateStep(activeStepIndex, 'input', e.target.value)}
                            placeholder=""
                        />
                    }
                    <div>
                        <label htmlFor="step-placement" className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">
                            Guide Position
                        </label>
                        <select
                            id="step-placement"
                            value={currentPlacement}
                            onChange={(e) => updateStep(activeStepIndex, 'on', e.target.value)}
                            className="bg-gray-200 text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:text-white  dark:placeholder-gray-400 w-full p-2 rounded-lg text-sm transition-colors 
                            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                            focus:border-indigo-500 "
                        >
                            <option value="right">Right</option>
                            <option value="left">Left</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="mt-auto pt-4 border-t border-gray-300 dark:border-gray-700 space-y-4">
                <button
                    onClick={addStep}
                    className="w-full py-2 text-sm flex items-center gap-2 justify-center  bg-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={15} />
                    New Step
                </button>
                <button
                    onClick={handleSaveCourse}
                    className="w-full py-2 text-sm flex items-center justify-center bg-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={steps.length === 0 || isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                        <span className="flex items-center gap-2 justify-center">
                            <Save size={16} />
                            {courseId ? "Update" : "Save"} Guide
                        </span>
                    )}
                </button>
            </div >
        </div >
    )
}

export default SidePanel