import { useState, useEffect, useCallback } from "react"
import { Wand2, X, Plus, Trash2, CheckSquare, ArrowDownToLine } from "lucide-react"
import "./index.css"
import { Step } from "./types"
import { supabase } from "./config/supabase"

const SidePanel = () => {
    // --- Application State Management ---
    const [isPicking, setIsPicking] = useState(false)
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
        console.log("got steps ")
        try {
            const { data } = await supabase
                .from("courses")
                .insert({
                    user_id: crypto.randomUUID(),
                    title: metadata.title,
                    description: metadata.description,
                }).select("id")  // 👈 RETURN THE ID
                .single()
            steps = steps.map((step) => ({ ...step, course_id: data?.id }))
            const { data: data2, error: error2 } = await supabase.from("steps").insert(
                steps
            ).select("")
            console.log("data", data2)
            console.log(error2)
        } catch (error) {
            console.error('Error adding course:', error)
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

        console.log("before active steps", activeStepIndex)
        setActiveStepIndex(steps.length); // Set the new step as active
        console.log(steps.length)
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

    const saveSteps = () => {
        try {
            const cleanSteps = steps.map((step) => {
                let stepToSave: Step = { ...step };
                return stepToSave;
            }).filter(step => step.text.trim() !== '' || step.element); // Final filter to remove empty 
            handleCreateCourse(metadata.title, cleanSteps)
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
            <div className="text-xl font-bold  flex items-center justify-between">
                <h3 className="text-lg font-bold ">Course Details </h3>
                <button onClick={handleAbortPicking} className="text-gray-500 hover:text-red-500 transition-colors" disabled={!isPicking}>
                    <X className="w-5 h-5" />
                </button>
            </div>
            <Input label="Course Title" value={metadata.title} onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))} />
            <Input label="Course Title" value={metadata.description} onChange={(e) => setMetadata((prev) => ({ ...prev, description: e.target.value }))} isTextArea={true} />
            {/* </div> */}
            {/* Step Management List */}
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
                        onChange={(e: any) => updateStep(activeStepIndex, 'text', e.target.value)} isTextArea={true} />

                    <Input label="Image URL (Optional)" value={activeStep.image} onChange={(e: any) => updateStep(activeStepIndex, 'image', e.target.value)} />

                    <Input label="Element Selector" value={activeStep.element} onChange={(e: any) => updateStep(activeStepIndex, 'element', e.target.value)} />
                    {isPicking ? (
                        <button
                            onClick={handleAbortPicking}
                            className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
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
                    className="w-full py-2 text-sm bg-purple-600 text-white rounded-lg font-semibold shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center"
                    disabled={steps.length === 0}
                >
                    <ArrowDownToLine size={15} />                    Save
                </button>
            </div>
        </div>
    )
}

export default SidePanel



const Input = ({ label, value, onChange, isTextArea }) => {
    return <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </label>
        {isTextArea ? <textarea
            id="step-text"
            rows={3}
            value={value}
            onChange={(e) => onChange(e)}
            className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter the guiding text for this step..."
        /> : <input
            type="text"
            readOnly
            value={value}
            onChange={(e) => onChange(e)}
            className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., #prompt-textarea"
        />}

    </div>
}