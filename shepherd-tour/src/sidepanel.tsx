import { useState, useEffect, useCallback } from "react"
import { Wand2, X, Plus, Trash2, CheckSquare } from "lucide-react"
import "./index.css"
// import { collection, addDoc } from 'firebase/firestore'
import { Placement, Step } from "./types"
import { supabase } from "./config/supabase"


// Key for localStorage
const LOCAL_STORAGE_KEY = 'courseCreatorSteps';

const SidePanel = () => {
    // --- Application State Management ---
    const [isPicking, setIsPicking] = useState(false)
    const [steps, setSteps] = useState<Step[]>([]);
    const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

    // chosenSelector is primarily for display/temporary feedback

    const handleCreateCourse = async (title: string, steps: Step[]) => {
        console.log("got steps ")
        try {
            const { data, error } = await supabase
                .from("courses")
                .insert({
                    user_id: crypto.randomUUID(),
                    title,
                    description: "testing"
                }).select("id")  // 👈 RETURN THE ID
                .single()
            steps = steps.map((step) => ({ ...step, course_id: data?.id }))
            console.log(steps)
            const { data: data2, error: error2 } = await supabase.from("steps").insert(
                steps
            ).select("")
            // con
            console.log("data", data)
            console.log("data", data2)
            console.log(error2)
            // const docRef = await addDoc(collection(db, 'courses'), {
            //     title,
            //     steps
            // })
            console.log("error", error)

            console.log('Course added with ID:', data)
            // setStatus('Course created in Firestore!')
        } catch (error) {
            console.error('Error adding course:', error)
            // setStatus('Failed to create course')
        }
    }
    // --- Local Storage Data Loader ---
    useEffect(() => {
        try {
            const storedStepsJson = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedStepsJson) {
                const loadedSteps = JSON.parse(storedStepsJson) as Step[];
                if (loadedSteps && loadedSteps.length > 0) {
                    setSteps(loadedSteps);
                    setActiveStepIndex(0);
                    console.log("Tour steps loaded from Local Storage.");
                    return;
                }
            }
        } catch (error) {
            console.error("Failed to load steps from Local Storage:", error);
        }

        // Default initialization if no data found
        const defaultStep: Step = {
            _id: 'step-1',
            text: 'Welcome! Start adding steps and saving your tour to your browser storage.',
            image: '',
            element: '',
            on: 'right',  // Set default placement
            order_index: steps.length
        };
        setSteps([defaultStep]);
        setActiveStepIndex(0);
        // setChosenSelector(defaultStep.attachTo?.element || "");

    }, []);

    // --- Handlers for Step Management ---

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

    // Handler for updating nested fields within attachTo
    // const updateStepAttachment = useCallback((index: number, field: 'element' | 'on', value: string) => {
    //     console.log("update", activeStepIndex, field, value)
    //     setSteps(prevSteps => {
    //         const newSteps = [...prevSteps];
    //         // Ensure attachTo structure exists or initialize it with defaults if not
    //         const currentAttachTo = newSteps[index].attachTo || { element: '', on: 'right' as Placement };

    //         newSteps[index] = {
    //             ...newSteps[index],
    //             attachTo: {
    //                 ...currentAttachTo,
    //                 // Use type assertion for 'on' field since 'value' comes as a string
    //                 [field]: field === 'on' ? value as Placement : value,
    //             }
    //         };
    //         return newSteps;
    //     });
    // }, []);

    const handleElementSelection = useCallback((selector: string) => {
        console.log("SELECTOR RECEIVED:", selector);

        // This log will now be correct because activeStepIndex is a dependency of this useCallback
        console.log("Stale Check (Should be correct): activeStepIndex:", activeStepIndex, "Current Steps Count:", steps.length);

        // We use the activeStepIndex captured by this useCallback
        if (activeStepIndex !== null) {
            updateStep(activeStepIndex, 'element', selector);
        }
        setIsPicking(false);
        console.log(`[Picker] Selector assigned: ${selector} to index ${activeStepIndex}`);
    }, [activeStepIndex, updateStep, steps.length]); // FIX 2: Added dependencies

    // Listener for messages coming back from creator-picker.ts
    useEffect(() => {
        const listener = (message: any) => {
            if (message.action === "ELEMENT_SELECTED") {
                // Delegate to the useCallback hook, which has fresh state values
                handleElementSelection(message.selector);
            } else if (message.action === "PICKER_ABORTED") {
                // Handle case where user hits ESC or we abort externally
                setIsPicking(false);
                console.log("[Picker] Picking mode confirmed aborted by content script.");
            }
        };
        // Add message listener for selection result
        chrome.runtime.onMessage.addListener(listener);
        // Cleanup listener
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, [handleElementSelection]); // FIX 3: Dependency is the callback function itself, which guarantees freshness

    // Function to trigger element picking (Mocked)
    const startElementPicker = async () => {
        if (activeStepIndex === null) {
            alert("Please select a step to assign an element.");
            return;
        }
        setIsPicking(true);
        // setChosenSelector("Click on the main page to select...");
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

    // Function to abort picking and send cleanup message (Mocked)
    const handleAbortPicking = async () => {
        setIsPicking(false);
        // setChosenSelector(steps[activeStepIndex]?.attachTo?.element || "");
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


    // --- Local Storage Save Logic ---

    const saveStepsToLocalStorage = () => {
        console.log("saving steps ")
        try {
            // Filter out steps that are completely empty
            const cleanSteps = steps.map((step) => {
                // IMPORTANT FIX: Use a copy and delete the optional property 
                // to avoid TypeScript errors related to destructuring optional fields.
                let stepToSave: Step = { ...step };
                return stepToSave;
            }).filter(step => step.text.trim() !== '' || step.element); // Final filter to remove empty steps

            // const jsonOutput = JSON.stringify(cleanSteps, null, 2);
            // console.log(cleanSteps)
            handleCreateCourse("Chatgpt5", cleanSteps)
            // localStorage.setItem(LOCAL_STORAGE_KEY, jsonOutput);
            alert("Tour steps saved successfully to your browser's local storage!");
            console.log("Steps saved to Local Storage under key:", LOCAL_STORAGE_KEY);

        } catch (error) {
            console.error("Error saving steps to Local Storage:", error);
            alert("Failed to save steps. Check the console for details.");
        }
    };

    const activeStep = steps[activeStepIndex];
    const currentElement = activeStep?.element || "";
    const currentPlacement = activeStep?.on || "right";


    // Only render the panel content after the initial steps are loaded
    if (steps.length === 0) {
        return (
            <div className="p-4 flex flex-col h-full bg-gray-50 font-inter items-center justify-center">
                <p className="text-gray-500">Loading tour data...</p>
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col h-full bg-gray-50 font-inter">
            <h1 className="text-xl font-bold mb-4 flex items-center justify-between border-b pb-2">
                Course Creator
                <button onClick={handleAbortPicking} className="text-gray-500 hover:text-red-500 transition-colors" disabled={!isPicking}>
                    <X className="w-5 h-5" />
                </button>
            </h1>

            {/* Step Management List */}
            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Steps ({steps.length})</h2>
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
                <button
                    onClick={addStep}
                    className="mt-3 w-full py-2 bg-green-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Step
                </button>
            </div>

            {/* Active Step Editor */}
            {activeStep && (
                <div className="flex flex-col space-y-3 p-4 bg-white border border-gray-200 rounded-lg shadow-md mb-4">
                    <h3 className="text-md font-bold text-blue-600">Editing Step {activeStepIndex + 1}</h3>
                    {/* Step Text Input */}
                    <div>
                        <label htmlFor="step-text" className="block text-sm font-medium text-gray-700 mb-1">
                            Instruction Text
                        </label>
                        <textarea
                            id="step-text"
                            rows={3}
                            value={activeStep.text}
                            onChange={(e) => updateStep(activeStepIndex, 'text', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Enter the guiding text for this step..."
                        />
                    </div>

                    {/* Step Image Input */}
                    <div>
                        <label htmlFor="step-image" className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL (Optional)
                        </label>
                        <input
                            id="step-image"
                            type="text"
                            value={activeStep.image}
                            onChange={(e) => updateStep(activeStepIndex, 'image', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="e.g., https://placehold.co/300x150"
                        />
                    </div>

                    {/* Element Selector Display & Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Element Selector (attachTo.element)
                        </label>
                        <input
                            type="text"
                            readOnly
                            value={activeStep.element}
                            onChange={(e) => updateStep(activeStepIndex, 'element', e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="e.g., #prompt-textarea"
                        />

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
                                <Wand2 className="w-5 h-5" />
                                Pick Element for Step {activeStepIndex + 1}
                            </button>
                        )}
                        <p className="mt-2 text-xs text-gray-500 italic">
                            {isPicking
                                ? "Hover to highlight, click to select, or press Cancel."
                                : "Click the button to assign a target element to this step."
                            }
                        </p>
                    </div>

                    {/* Placement Selector */}
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

            {/* Footer / Save Button */}
            <div className="mt-auto pt-4 border-t">
                <button
                    onClick={saveStepsToLocalStorage}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold shadow-lg hover:bg-purple-700 transition-colors"
                    disabled={steps.length === 0}
                >
                    Save Steps to Local Storage
                </button>
            </div>
        </div>
    )
}

export default SidePanel