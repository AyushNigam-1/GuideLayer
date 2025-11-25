import { useState, useEffect, useCallback, ChangeEvent } from "react"
import { Wand2, X, Plus, Trash2, CheckSquare, ArrowDownToLine, LinkIcon, Upload } from "lucide-react"
import "./index.css"
import { Step } from "./types"
import { supabase } from "./config/supabase"
import Input from "./components/Input"
import ImagePreview from "./components/InputPreview"
// import { }

const SidePanel = () => {
    // --- Application State Management ---
    const [isPicking, setIsPicking] = useState(false)
    const [isLoading, setLoading] = useState(false)
    const [isUploadingImage, setIsUploadingImage] = useState(false); // New state for image upload status
    const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url'); // New state to switch between URL and File upload

    const [steps, setSteps] = useState<Step[]>([{
        _id: 'step-1',
        text: 'Welcome! Start adding steps and saving your tour to your browser storage.',
        image: '',
        element: '',
        on: 'right',  // Set default placement
        order_index: 0
    }]);
    const [metadata, setMetadata] = useState<{ title: string, description: string }>({ title: "", description: "" })
    const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

    const handleCreateCourse = async (steps: Step[]) => {
        setLoading(true)
        try {
            const { data } = await supabase
                .from("courses")
                .insert({
                    user_id: crypto.randomUUID(),
                    title: metadata.title,
                    description: metadata.description,
                }).select("id")
                .single()
            steps = steps.map((step) => ({ ...step, course_id: data?.id }))
            await supabase.from("steps").insert(
                steps
            ).select("")
            console.log(data)
        } catch (error) {
            console.error('Error adding course:', error)
        }
        finally {
            setLoading(false)
        }
    }

    const addStep = () => {
        const newId = `step-${Date.now()}`;
        const newStep: Step = {
            _id: newId,
            text: `Step ${steps.length + 1} instructions.`,
            image: '',
            element: '',
            on: 'right', // Set default placement
            order_index: steps.length
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
    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        // Create a unique path for the file in storage
        const folderPath = `public/steps/${crypto.randomUUID()}-${file.name}`;

        try {
            // 1. Upload file to Supabase Storage
            // Assuming a storage bucket named 'images' is configured
            const { data, error } = await supabase.storage
                .from('images') // Use a suitable bucket name, 'images' is a common default
                .upload(folderPath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                throw error;
            }

            // 2. Get the public URL for the uploaded file
            const { data: publicUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(folderPath);

            const publicUrl = publicUrlData.publicUrl;

            // 3. Update the active step's image field with the public URL
            if (activeStepIndex !== null) {
                updateStep(activeStepIndex, 'image', publicUrl);
            }
            console.log("Image uploaded and step updated with URL:", publicUrl);

        } catch (error: any) {
            console.error('Error uploading file:', error.message || error);
            // Using console.error instead of alert as per general instructions
            console.error(`Image upload failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploadingImage(false);
            // Reset the file input value to allow uploading the same file again
            if (event.target) {
                event.target.value = '';
            }
        }
    };
    const saveSteps = () => {
        try {
            const cleanSteps = steps.map((step) => {
                let stepToSave: Step = { ...step };
                return stepToSave;
            }).filter(step => step.text.trim() !== '' || step.element); // Final filter to remove empty 
            handleCreateCourse(cleanSteps)
        } catch (error) {
            console.error("Error saving steps to Local Storage:", error);
            alert("Failed to save steps. Check the console for details.");
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
        <div className="p-4 flex flex-col h-full bg-gray-50 font-mono space-y-4">
            <h3 className="text-lg font-bold ">New Guide</h3>
            <hr />
            <Input label="Course Title" value={metadata.title} onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))} placeholder="e.g Chatgpt or Youtube etc" />
            <Input label="Course Title" placeholder="e.g Course Description here" value={metadata.description} onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))} isTextArea={true} />
            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Steps </h2>
                <div className="max-h-32 overflow-y-auto space-y-2 p-2 border rounded-lg bg-white shadow-inner">
                    {steps.map((step, index) => (
                        <div
                            key={step._id}
                            className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${index === activeStepIndex
                                ? 'bg-blue-100 border-blue-500 border-2'
                                : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                                }`}
                            onClick={() => { setActiveStep(index); console.log("index", index) }}
                        >
                            <span className="truncate text-sm font-medium">
                                {index + 1}. {step.text.substring(0, 30) || "New Step"}
                            </span>
                            <div className="flex items-center space-x-2">
                                {step.element && <CheckSquare className="w-4 h-4 text-green-600" />}
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteStep(index); }}
                                    className="p-1 text-red-500 hover:text-red-700 transition-colors rounded-full hover:bg-red-200"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {activeStep && (
                <div className="flex flex-col space-y-3 p-4 bg-white border border-gray-200 rounded-lg shadow-md mb-4">
                    <h3 className="text-md font-bold text-blue-600">Editing Step {activeStepIndex + 1}</h3>
                    <Input label="Text" value={activeStep.text}
                        onChange={(e: any) => updateStep(activeStepIndex, 'text', e.target.value)} placeholder="Write Guide text here" isTextArea={true} />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Step Visual (Optional)</label>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setImageUploadType('url')}
                                className={`w-full py-1  rounded-lg font-semibold flex items-center justify-center gap-2  transition-colors ${imageUploadType === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                disabled={isUploadingImage}
                            >
                                <LinkIcon className="w-4" /> File URL
                            </button>
                            <button
                                onClick={() => setImageUploadType('file')}
                                className={`w-full py-1 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors ${imageUploadType === 'file' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                disabled={isUploadingImage}
                            >
                                <Upload className="w-4" /> Upload File
                            </button>
                        </div>

                        {imageUploadType === 'url' ? (
                            <Input
                                value={activeStep.image}
                                onChange={(e: any) => updateStep(activeStepIndex, 'image', e.target.value)}
                                placeholder="Paste image URL here"
                            />
                        ) : (
                            <div className="flex items-center space-x-2">
                                <label className="flex-1 w-full bg-gray-100 text-gray-700 py-2  rounded-lg border border-dashed border-gray-400 cursor-pointer hover:bg-gray-200 text-sm flex items-center justify-center relative transition-colors">
                                    <input
                                        type="file"
                                        // accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        disabled={isUploadingImage}
                                    />
                                    {isUploadingImage ? (
                                        <span className="flex items-center gap-2 text-blue-600">
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Uploading...
                                        </span>
                                    ) : (
                                        <span className="truncate">
                                            {activeStep.image ? `File Attached (URL: ${activeStep.image.substring(0, 20)}...)` : "Click to select image file"}
                                        </span>
                                    )}
                                </label>
                            </div>
                        )}
                        <ImagePreview url={activeStep.image} />
                    </div>

                    <Input label="Element Selector" value={activeStep.element} onChange={(e: any) => updateStep(activeStepIndex, 'element', e.target.value)} placeholder="" />
                    {isPicking ? (
                        <button
                            onClick={handleAbortPicking}
                            className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                        >
                            <X className="w-5" />
                            Cancel Picking...
                        </button>
                    ) : (
                        <button
                            onClick={startElementPicker}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                            disabled={isPicking || activeStepIndex === null}
                        >
                            <Wand2 size={15} />
                            Pick Element for Step {activeStepIndex + 1}
                        </button>
                    )}
                    <p className="mt-2 text-xs text-gray-500 italic">
                        {isPicking
                            ? "Hover to highlight, click to select, or press Cancel."
                            : "Click the button to assign a target element to this step."
                        }
                    </p>
                    <div>
                        <label htmlFor="step-placement" className="block text-sm font-medium text-gray-700 mb-1">
                            Guide Alignment
                        </label>
                        <select
                            id="step-placement"
                            value={currentPlacement}
                            onChange={(e) => updateStep(activeStepIndex, 'on', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
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
            <div className="mt-auto pt-4 border-t space-y-2">
                <button
                    onClick={addStep}
                    className=" w-full text-sm py-2 bg-green-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                >
                    <Plus size={15} />
                    New Step
                </button>
                <button
                    onClick={saveSteps}
                    className="w-full py-2 text-sm bg-purple-600 text-white rounded-lg font-semibold shadow-lg hover:bg-purple-700 transition-colors "
                    disabled={steps.length === 0}
                >
                    {
                        isLoading ?
                            <div className='flex justify-center col-span-4 items-center '>
                                <svg className="animate-spin  w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            :
                            <span className="flex items-center gap-2 justify-center">
                                <ArrowDownToLine size={15} />  Save
                            </span>
                    }
                </button>
            </div >
        </div >
    )
}

export default SidePanel

