import type { PlasmoCSConfig } from "plasmo"
import Shepherd from "shepherd.js"
import type { Tour, StepOptions, Step } from "shepherd.js"
import { offset } from "@floating-ui/dom"
import type { Placement } from "@floating-ui/dom"
import { supabase } from './config/supabase'
import '../public/beautiful-tour.css';
import "../css/pro-theme.css"
import 'shepherd.js/dist/css/shepherd.css';
import { Message, StepData } from "./types"
// import "shepherd.js/dist/css/shepherd.css" // Main CSS (includes default theme)
// import "shepherd.js/dist/css/shepherd-theme-arrows.css" // Optional: Add arrows theme if needed

// export const config: PlasmoCSConfig = {
//     matches: ["<all_urls>"],
//     run_at: "document_idle"
// }

console.log("injected content")



let tourSteps: StepData[] = []
let speechUtterance: SpeechSynthesisUtterance | null = null
let isSpeaking: boolean = false

const speakText = (text: string): void => {
    if ('speechSynthesis' in window && !isSpeaking) {
        speechUtterance = new SpeechSynthesisUtterance(text)
        speechUtterance.rate = 0.9 // Slightly slower for clarity (0.1-10 range)
        speechUtterance.pitch = 1.0 // Natural pitch (0.1-2)
        speechUtterance.volume = 0.8 // Volume (0-1)

        const voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices()
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
        tourSteps = steps as StepData[]
        checkPageReady()
        if (error) {
            console.error("Supabase error:", error)
            sendResponse({ success: false })
            return
        }
        sendResponse({ success: true })
    } catch (err) {
        console.error("[Content Script] Unexpected error:", err)
        sendResponse({ success: false })
    }
}

type SendResponse = (response?: { success: boolean; error?: string, data?: any }) => void

chrome.runtime.onMessage.addListener((message: Message, _: chrome.runtime.MessageSender, sendResponse: SendResponse) => {
    if (message.action === "startTour") {
        handleStartTour(message.courseId!, sendResponse)
        return true
    }

})

const checkPageReady = (): void => {
    if (!document.body) {
        console.log("[Shepherd Injector] Waiting for page load...")
        setTimeout(checkPageReady, 1000)
        return
    }

    // const hasKeyElements = document.querySelector('[contenteditable="true"]') || document.querySelector('.btn-primary')
    // if (!hasKeyElements) {
    //     console.log("[Shepherd Injector] Waiting for ChatGPT elements...")
    //     setTimeout(checkPageReady, 1000)
    //     return
    // }

    console.log("[Shepherd Injector] Page ready - building multi-step tour...")

    try {
        const tour: Tour = new Shepherd.Tour({
            defaultStepOptions: {
                classes: "pro-theme",
                scrollTo: false,
                cancelIcon: { enabled: true },
            }
        })

        let addedSteps = 0

        tourSteps.forEach((stepData: any) => {
            try {
                let element: HTMLElement | null = null;
                const selector = stepData.element?.trim();
                const placement = stepData.on || 'right';

                if (selector) {
                    element = document.querySelector(selector) as HTMLElement;
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
                    stepConfig.attachTo = undefined;
                } else {
                    console.warn(`[Tour] Step skipped due to missing element: ${stepData._id}`);
                    return;
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
            } catch (e) {
                const error = e as Error
                console.error("[Shepherd Injector] tour.start() error:", error)
            }
        }, 500)

    } catch (error) {
        const err = error as Error
        console.error("[Shepherd Injector] Tour creation failed:", err)
    }
}
