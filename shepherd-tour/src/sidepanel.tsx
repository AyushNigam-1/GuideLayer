import { useState, useEffect, useCallback, ChangeEvent } from "react"
import { Wand2, X, Plus, Trash2, CheckSquare, Save } from "lucide-react"
import "./index.css"
import { MediaType, Step } from "./types"
import { supabase } from "./config/supabase"
import Input from "./components/Input"
import Loading from "./components/Loading"
import FileUpload from "./components/FileUpload"

// interface Metadata { id: string, title: string, description: string }

const SidePanel = () => {
    // --- Application State Management ---
    const [isPicking, setIsPicking] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [isUploading, setIsUploading] = useState<MediaType | null>(); // New state for image upload status
    const [userId, setUserId] = useState("")
    const [metadata, setMetadata] = useState<{ title: string, description: string, baseUrl: string, icon: string }>({ title: "", description: "", baseUrl: "", icon: "" })
    const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
    const [courseId, setCourseId] = useState<string>()
    const [isDeleting, setDeleting] = useState<MediaType | null>()

    const [steps, setSteps] = useState<Step[]>([{
        _id: 'step-1',
        text: 'Welcome! Start adding steps and saving your tour to your browser storage.',
        file: '',
        element: '',
        on: 'right',  // Set default placement
        order_index: 0,
        audio: ""
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
        (async () => {
            const { data: { session } } = await supabase.auth.getSession()
            console.log("session", session)
            setUserId(session?.user?.id!)
        })()
    }, [])

    const handleSaveCourse = async () => {
        if (!userId) {
            alert("Please login first");
            return;
        }
        setLoading(true);
        try {
            const cleanSteps = steps
                .map((step, index) => ({
                    _id: step._id,
                    text: step.text.trim(),
                    file: step.file || "",
                    element: step.element || "",
                    audio: step.audio || "",
                    on: step.on || "right",
                    order_index: index,
                    course_id: courseId || "", // temporary
                }))
                .filter(step => step.text !== "");
            if (courseId) {
                // UPDATE MODE — course already exists
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

                // Delete old steps
                await supabase.from("steps").delete().eq("course_id", courseId);

                // Insert new steps
                const stepsToInsert = cleanSteps.map(step => ({
                    ...step,
                    course_id: courseId,
                }));

                const { error } = await supabase
                    .from("steps")
                    .insert(stepsToInsert)

                if (error) throw error;

                alert("Course updated successfully!");
            } else {
                // CREATE MODE — same as your old function
                console.log("Creating new course");

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

                const stepsToInsert = cleanSteps.map(step => ({
                    ...step,
                    course_id: courseData.id,
                }));

                const { error: stepsError } = await supabase
                    .from("steps")
                    .insert(stepsToInsert);

                if (stepsError) throw stepsError;

                setCourseId(courseData.id);
                alert("Course created successfully!");
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
            audio: ""
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
    const updateStep = useCallback((index: number, field: any, value: string) => {
        setSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[index] = {
                ...newSteps[index],
                [field]: value
            };
            return newSteps;
        });
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

    // Function to trigger element picking (Mocked)
    const startElementPicker = async () => {
        if (activeStepIndex === null) {
            alert("Please select a step to assign an element.");
            return;
        }
        setIsPicking(true);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) return
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "START_ELEMENT_PICKER" },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error:", chrome.runtime.lastError.message)
                    } else {
                        console.log("Picker started")
                    }
                }
            )
        })
    };

    const handleAbortPicking = async () => {
        setIsPicking(false);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) return
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "STOP_ELEMENT_PICKER" },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error("Error:", chrome.runtime.lastError.message)
                    } else {
                        console.log("Picker Stopped")
                    }
                }
            )
        })
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
    if (steps.length === 0) {
        return (
            <div className="p-4 flex flex-col h-full bg-gray-50 font-inter items-center justify-center">
                <p className="text-gray-500">Loading tour data...</p>
            </div>
        );
    }


    return (
        <div className="p-4 flex flex-col h-full bg-gray-900 text-white font-mono space-y-4">
            <h3 className="text-lg font-bold"> {courseId ? "Update" : "New"} Guide</h3>
            <hr className="border-gray-700" />
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
            <Input
                label="Description"
                placeholder="e.g Course Description here"
                value={metadata.description}
                onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))}
                isTextArea={true}
            />
            <FileUpload file={metadata.icon} isDeleting={isDeleting!} handleDeleteFile={handleDeleteFile} handleFileChange={handleFileChange} isUploading={isUploading!} label="Icon" type="icon" />
            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Steps </h2>
                <div className="max-h-32 overflow-y-auto space-y-2 p-2 border border-gray-700 rounded-lg bg-gray-800 shadow-inner custom-scrollbar">
                    {steps.map((step, index) => (
                        <div
                            key={step._id}
                            className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${index === activeStepIndex
                                ? 'bg-indigo-900/40 border-indigo-500 border'
                                : 'bg-white/5 hover:bg-gray-600 border border-transparent'
                                }`}
                            onClick={() => { setActiveStep(index); console.log("index", index) }}
                        >
                            <span className="truncate text-sm font-medium text-gray-200">
                                {index + 1}. {step.text.substring(0, 30) || "New Step"}
                            </span>
                            <div className="flex items-center space-x-2">
                                {step.element && <CheckSquare className="w-4 h-4 text-green-400" />}
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteStep(index); }}
                                    className="p-1 text-red-400 hover:text-red-300 transition-colors rounded-full hover:bg-gray-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {activeStep && (
                <div className="flex flex-col space-y-3 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-md mb-4">
                    <Input
                        label="Text"
                        value={activeStep.text}
                        onChange={(e: any) => updateStep(activeStepIndex, 'text', e.target.value)}
                        placeholder="Write Guide text here"
                        isTextArea={true}
                    />
                    <FileUpload file={activeStep.file} isDeleting={isDeleting!} handleDeleteFile={handleDeleteFile} handleFileChange={handleFileChange} isUploading={isUploading!} label="Attach Image/Video (Optional)" type="file" />
                    <FileUpload file={activeStep.audio} isDeleting={isDeleting!} handleDeleteFile={handleDeleteFile} handleFileChange={handleFileChange} isUploading={isUploading!} label="Attach Audio (Optional)" type="audio" />
                    <Input
                        label="Element Selector"
                        value={activeStep.element}
                        onChange={(e: any) => updateStep(activeStepIndex, 'element', e.target.value)}
                        placeholder="e.g #centeredDiv"
                        disabled={true}
                    />
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
                    <p className="mt-2 text-xs text-gray-400 italic">
                        {isPicking
                            ? "Click to select, or press Cancel."
                            : "Click to assign a target element."
                        }
                    </p>
                    <div>
                        <label htmlFor="step-placement" className="block text-sm font-medium text-gray-300 mb-1">
                            Guide Alignment
                        </label>
                        <select
                            id="step-placement"
                            value={currentPlacement}
                            onChange={(e) => updateStep(activeStepIndex, 'on', e.target.value)}
                            className="w-full p-2 border border-gray-600 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-600 bg-white/5 text-white"
                        >
                            <option value="right">Right (Default)</option>
                            <option value="left">Left</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                        </select>
                    </div>

                </div>
            )}
            {/* <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-md mb-4">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <label className="text-xs font-medium cursor-pointer flex items-center">
                    <input
                        type="checkbox"
                        checked={enableVoice}
                        onChange={(e) => setEnableVoice(e.target.checked)}
                        className="mr-1 rounded"
                    />
                    Enable Voice Narration
                </label>
            </div> */}
            {/* Footer / Save Button */}
            <div className="mt-auto pt-4 border-t border-gray-700 space-y-2">
                <button
                    onClick={addStep}
                    className=" w-full text-sm py-2 bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                >
                    <Plus size={15} />
                    New Step
                </button>
                <button
                    onClick={handleSaveCourse}
                    className="w-full py-2 text-sm bg-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={steps.length === 0}
                >
                    {
                        isLoading ?
                            <Loading />
                            :
                            <span className="flex items-center gap-2 justify-center ">
                                <Save size={16} />
                                {courseId ? "Update" : "Save"} Guide
                            </span>
                    }
                </button>
            </div >
        </div >
    )
}

export default SidePanel

