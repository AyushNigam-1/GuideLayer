import type { PlasmoCSConfig } from "plasmo"
import Shepherd from "shepherd.js"
import type { Tour, StepOptions, Step } from "shepherd.js"
import { offset } from "@floating-ui/dom"
import type { Placement } from "@floating-ui/dom"
import { supabase } from './config/supabase'
// import { toggleSidebar } from "./sidebar"
import '../public/beautiful-tour.css'; // <-- Import your custom CSS
import "../css/pro-theme.css"
import 'shepherd.js/dist/css/shepherd.css';
import { Message } from "./types"
// import "shepherd.js/dist/css/shepherd.css" // Main CSS (includes default theme)
// import "shepherd.js/dist/css/shepherd-theme-arrows.css" // Optional: Add arrows theme if needed

export const config: PlasmoCSConfig = {
    matches: ["https://chatgpt.com/*"],
    run_at: "document_idle"
}

console.log("injected content")

// Custom interface for step data
interface StepData extends Partial<StepOptions> {
    _id: string
    text: [string] | string

    element?: string | HTMLElement
    on?: Placement

    buttonText?: string
}
const getAssetUrl = (path: string): string => {
    // This function must be used to correctly load resources bundled with the extension.
    return chrome.runtime.getURL(path);
};
const inputPromptImageUrl = getAssetUrl('assets/icon.png'); // <-- UPDATE PATH HERE
// Data-driven steps array - easy to extend/add new steps
let tourSteps: StepData[] = []
// const tourSteps: StepData[] = [
//     {
//         _id: 'welcome',
//         text: [
//             '<div class="custom-content-box">' +
//             '<h4>This is the custom HTML title!</h4>' +
//             '<p>The content, including <b>bold text</b>, is rendered.</p>' +
//             `<img src="${inputPromptImageUrl}" style="max-width: 100px; display: block; margin-top: 10px;"/>` +
//             '</div>'
//         ],
//         // text: 'Welcome. Let"s start',

//         attachTo: undefined, // No attachment → Shepherd auto-centers the step
//         buttonText: 'Start'
//     },
//     {
//         _id: 'input-prompt',
//         text: 'Click here to type your message. Try: "Tell me a joke!"',
//         attachTo: {
//             element: '#prompt-textarea', // Selector string
//             on: 'top'
//         },
//         // buttonText: 'Next'/
//     },
//     {
//         _id: 'submit-response',
//         text: 'Hit Enter or click Send to generate a response. Watch the magic!',
//         attachTo: {
//             element: '#composer-submit-button', // Send button (adjust if class changes)
//             on: 'left'
//         },
//         buttonText: 'Done!'
//     }
//     // Add more steps easily here
// ]

let speechUtterance: SpeechSynthesisUtterance | null = null
let isSpeaking: boolean = false

const speakText = (text: string): void => {
    if ('speechSynthesis' in window && !isSpeaking) {
        speechUtterance = new SpeechSynthesisUtterance(text)
        speechUtterance.rate = 0.9 // Slightly slower for clarity (0.1-10 range)
        speechUtterance.pitch = 1.0 // Natural pitch (0.1-2)
        speechUtterance.volume = 0.8 // Volume (0-1)

        // Optional: Select voice (e.g., first English female)
        const voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices()
        // console.log(voices)
        const englishVoice: SpeechSynthesisVoice | undefined = voices.find((voice: SpeechSynthesisVoice) => voice.lang.startsWith('en') && voice.name.includes('Male'))
        if (englishVoice) speechUtterance.voice = englishVoice

        speechUtterance.onend = () => { isSpeaking = false }
        speechUtterance.onerror = (e: SpeechSynthesisErrorEvent) => {
            console.error('[Shepherd Injector] Speech error:', e)
            isSpeaking = false
        }

        speechSynthesis.speak(speechUtterance)
        isSpeaking = true
        console.log('[Shepherd Injector] Narrating:', text)
    } else {
        console.warn('[Shepherd Injector] Speech API not supported or already speaking')
    }
}

const stopSpeech = (): void => {
    if (speechUtterance && isSpeaking) {
        speechSynthesis.cancel()
        isSpeaking = false
        console.log('[Shepherd Injector] Speech stopped')
    }
}


const handleStartTour = async (courseId: string, sendResponse: SendResponse) => {
    try {
        const { data: steps, error } = await supabase
            .from("steps")
            .select("*")
            .eq("course_id", courseId)
            .order("order_index")
        console.log(steps)
        tourSteps = steps as StepData[]

        checkPageReady()
        if (error) {
            console.error("Supabase error:", error)
            sendResponse({ success: false })
            return
        }
        // console.log("[Shepherd Injector] Steps:", steps)
        sendResponse({ success: true })
    } catch (err) {
        console.error("[Content Script] Unexpected error:", err)
        sendResponse({ success: false })
    }
}

type SendResponse = (response?: { success: boolean; error?: string, data?: any }) => void

chrome.runtime.onMessage.addListener((message: Message, sender: chrome.runtime.MessageSender, sendResponse: SendResponse) => {
    if (message.action === "startTour") {
        handleStartTour(message.courseId!, sendResponse)
        return true // Async response
    }

})

const checkPageReady = (): void => {
    if (!document.body) {
        console.log("[Shepherd Injector] Waiting for page load...")
        setTimeout(checkPageReady, 1000)
        return
    }

    const hasKeyElements = document.querySelector('[contenteditable="true"]') || document.querySelector('.btn-primary')
    if (!hasKeyElements) {
        console.log("[Shepherd Injector] Waiting for ChatGPT elements...")
        setTimeout(checkPageReady, 1000)
        return
    }

    console.log("[Shepherd Injector] Page ready - building multi-step tour...")

    try {
        const tour: Tour = new Shepherd.Tour({
            // useDefaultLook: false,
            defaultStepOptions: {
                classes: "pro-theme",
                scrollTo: true,
                cancelIcon: { enabled: true },
                // classes: "shepherd-theme-arrows",
                // showProgress: true  // Built-in bar
            }
        })

        let addedSteps = 0

        tourSteps.forEach((stepData: any) => {
            try {
                let element: HTMLElement | null = null;
                let attachToOn: Placement = 'right'; // default

                // Use the correct fields from your DB structure
                const selector = stepData.element?.trim();
                const placement = stepData.on || 'right';

                if (selector) {
                    element = document.querySelector(selector) as HTMLElement;

                    // Fallback for ChatGPT-specific cases
                    if (!element && stepData._id === 'input-prompt') {
                        const textarea = document.querySelector('textarea');
                        if (textarea?.parentElement) {
                            element = textarea.parentElement.closest('div') || textarea.parentElement;
                        }
                    }

                    if (!element) {
                        console.warn(`[Tour] Element not found for selector: ${selector} (step: ${stepData._id})`);
                    }
                }

                // Build buttons
                const buttons: any[] = [];
                if (stepData._id !== 'welcome') {
                    buttons.push({ text: 'Back', action: tour.back, classes: 'shepherd-button-secondary' });
                }
                buttons.push({
                    text: stepData.buttonText || 'Next',
                    action: stepData._id === 'submit-response' ? tour.complete : tour.next,
                    classes: stepData._id === 'submit-response' ? 'shepherd-button-primary' : ''
                });

                // Correct attachTo structure
                const stepConfig: Partial<StepOptions> = {
                    id: stepData._id,
                    text: stepData.text,
                    buttons
                };

                if (element && element.offsetParent) {
                    stepConfig.attachTo = { element, on: placement as Placement };
                    stepConfig.floatingUIOptions = { middleware: [offset(12)] };
                } else if (stepData._id === 'welcome') {
                    // Welcome step — centered
                    stepConfig.attachTo = undefined;
                } else {
                    console.warn(`[Tour] Step skipped due to missing element: ${stepData._id}`);
                    return; // skip this step
                }

                tour.addStep(stepConfig as StepOptions);
                addedSteps++;
                console.log(`[Tour] Added step: ${stepData._id} → ${selector || 'centered'}`);
            } catch (err) {
                console.error("Error adding step:", stepData._id, err);
            }
        });

        if (addedSteps === 0) {
            throw new Error('No valid steps could be added')
        }
        tour.on('show', (event: { step: Step }) => {  // Fixed: Now uses imported Event type
            const stepText: string = event.step.options.text as string
            speakText(stepText) // Narrate on show
        })

        tour.on('hide', () => {
            stopSpeech() // Pause on next/back
        })

        tour.on('complete', () => {
            stopSpeech() // Stop on finish
        })

        console.log(`[Shepherd Injector] Tour configured with ${addedSteps} steps, starting in 500ms...`)

        setTimeout(() => {
            try {
                tour.start()
                console.log("[Shepherd Injector] Multi-step tour started successfully!")
                // sendResponse({ success: true })
            } catch (e) {
                const error = e as Error
                console.error("[Shepherd Injector] tour.start() error:", error)
                // sendResponse({ success: false, error: error.message })
            }
        }, 500)

    } catch (error) {
        const err = error as Error
        console.error("[Shepherd Injector] Tour creation failed:", err)
        // sendResponse({ success: false, error: err.message })
    }
}
