import type { PlasmoCSConfig } from "plasmo"
import Shepherd from "shepherd.js"
import type { Tour, StepOptions, Step } from "shepherd.js"
import { offset } from "@floating-ui/dom"
import type { Placement } from "@floating-ui/dom"
// import { toggleSidebar } from "./sidebar"
import '../public/beautiful-tour.css'; // <-- Import your custom CSS
import "../css/pro-theme.css"
import 'shepherd.js/dist/css/shepherd.css';
// import "shepherd.js/dist/css/shepherd.css" // Main CSS (includes default theme)
// import "shepherd.js/dist/css/shepherd-theme-arrows.css" // Optional: Add arrows theme if needed

export const config: PlasmoCSConfig = {
    matches: ["https://chatgpt.com/*"],
    run_at: "document_idle"
}


// Toggle sidebar
// const toggleSidebar = (show: boolean): void => {
//     let sidebar = document.getElementById('creator-sidebar')
//     if (show && !sidebar) {
//         sidebar = document.createElement('div')
//         sidebar.innerHTML = sidebarHTML
//         document.body.appendChild(sidebar)
//         document.getElementById('close-sidebar')?.addEventListener('click', () => toggleSidebar(false))
//         document.getElementById('pick-button')?.addEventListener('click', startPickMode)
//         document.getElementById('creator-form')?.addEventListener('submit', handleCreate)
//     } else if (sidebar) {
//         sidebar.remove()
//     }
// }

// const startPickMode = (): void => {
//     const input = document.getElementById('element-selector') as HTMLInputElement
//     const pickListener = (e: MouseEvent): void => {
//         e.preventDefault()
//         e.stopPropagation()
//         const target = e.target as HTMLElement
//         const id = target.id
//         const selector = id ? `#${id}` : target.tagName.toLowerCase()
//         input.value = selector
//         document.removeEventListener('click', pickListener)
//         document.body.style.cursor = 'default'
//     }
//     document.addEventListener('click', pickListener, true)
//     document.body.style.cursor = 'crosshair'
// }
// type Message = { action: "startTour" | "openCreator" } // 🛑 Update Message type
// In onMessage listener
// if (message.action === "openCreator") {
//     toggleSidebar(true)
// }

// Handle form submit (save to storage)
// const handleCreate = (e: Event): void => {
//     e.preventDefault()
//     const name = (document.getElementById('course-name') as HTMLInputElement).value
//     const desc = (document.getElementById('course-desc') as HTMLTextAreaElement).value
//     const selector = (document.getElementById('element-selector') as HTMLInputElement).value
//     // Save to storage
//     chrome.storage.local.get('courses', (result) => {
//         const courses = [...(result.courses || []), { id: Date.now().toString(), name, desc, selector }]
//         chrome.storage.local.set({ courses })
//         toggleSidebar(false)
//     })
// }
// Custom interface for step data
interface StepData extends Partial<StepOptions> {
    id: string
    text: [string] | string
    attachTo?: {
        element?: string | HTMLElement
        on?: Placement
    }
    buttonText?: string
}
const getAssetUrl = (path: string): string => {
    // This function must be used to correctly load resources bundled with the extension.
    return chrome.runtime.getURL(path);
};
const inputPromptImageUrl = getAssetUrl('assets/icon.png'); // <-- UPDATE PATH HERE
// Data-driven steps array - easy to extend/add new steps
const tourSteps: StepData[] = [
    {
        id: 'welcome',
        text: [
            '<div class="custom-content-box">' +
            '<h4>This is the custom HTML title!</h4>' +
            '<p>The content, including <b>bold text</b>, is rendered.</p>' +
            `<img src="${inputPromptImageUrl}" style="max-width: 100px; display: block; margin-top: 10px;"/>` +
            '</div>'
        ],
        // text: 'Welcome. Let"s start',

        attachTo: undefined, // No attachment → Shepherd auto-centers the step
        buttonText: 'Start'
    },
    {
        id: 'input-prompt',
        text: 'Click here to type your message. Try: "Tell me a joke!"',
        attachTo: {
            element: '#prompt-textarea', // Selector string
            on: 'top'
        },
        // buttonText: 'Next'/
    },
    {
        id: 'submit-response',
        text: 'Hit Enter or click Send to generate a response. Watch the magic!',
        attachTo: {
            element: '#composer-submit-button', // Send button (adjust if class changes)
            on: 'left'
        },
        buttonText: 'Done!'
    }
    // Add more steps easily here
]
// type Message = { action: "startTour" }
// type SendResponse = (response?: { success: boolean; error?: string }) => void

// Voice narration helper (Web Speech API)
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

type Message = { action: "startTour" | "openCreator" } // 🛑 Update Message type
type SendResponse = (response?: { success: boolean; error?: string }) => void

chrome.runtime.onMessage.addListener((message: Message, sender: chrome.runtime.MessageSender, sendResponse: SendResponse) => {
    // if (message.action === "openCreator") {
    //     console.log("[Sidebar Injector] Trigger received to open creator.");
    //     toggleSidebar(true); // Call the exported function
    //     sendResponse({ success: true });
    // }
    if (message.action === "startTour") {
        console.log("[Shepherd Injector] Trigger received in content script.")

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
                tourSteps.forEach((stepData: StepData) => {
                    try {
                        let element: HTMLElement | null = null
                        let on: Placement | undefined = undefined

                        if (stepData.attachTo) {
                            // Resolve element if it's a selector string
                            if (typeof stepData.attachTo.element === 'string') {
                                element = document.querySelector(stepData.attachTo.element) as HTMLElement
                            } else if (stepData.attachTo.element) {
                                element = stepData.attachTo.element as HTMLElement
                            }

                            on = stepData.attachTo.on

                            // ChatGPT-specific fallback for input
                            if (!element && stepData.id === 'input-prompt') {
                                const hiddenTextarea = document.querySelector("textarea") as HTMLTextAreaElement
                                if (hiddenTextarea) {
                                    element = hiddenTextarea.closest("div.relative") || hiddenTextarea.parentElement
                                    console.log("[Shepherd Injector] Using fallback for input:", element)
                                }
                            }
                        }

                        if (stepData.attachTo && (!element || !element.offsetParent)) {
                            console.warn(`[Shepherd Injector] Skipping step ${stepData.id}: Element not found/visible`)
                            return
                        }

                        // Build buttons
                        const buttons = []
                        if (stepData.id !== 'welcome') {
                            buttons.push({ text: 'Back', action: tour.back, classes: 'shepherd-button-secondary' })
                        }
                        buttons.push({
                            text: stepData.buttonText || 'Next',
                            action: stepData.id === 'submit-response' ? tour.complete : tour.next,
                            classes: stepData.id === 'submit-response' ? 'shepherd-button-primary' : ''
                        })

                        // Build step options
                        const stepWithOffset: Partial<StepOptions> = {
                            ...stepData,
                            attachTo: stepData.attachTo ? { element: element!, on } : undefined,
                            buttons
                        }

                        // Add offset only for attached steps (not centered welcome)
                        if (stepData.attachTo) {
                            ; (stepWithOffset as any).floatingUIOptions = {
                                middleware: [offset(12)]
                            }
                        }

                        tour.addStep(stepWithOffset as StepOptions)
                        addedSteps++
                        console.log(`[Shepherd Injector] Added step: ${stepData.id}`)
                    } catch (stepError) {
                        console.error(`[Shepherd Injector] Failed to add step ${stepData.id}:`, stepError)
                    }
                })

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
                        sendResponse({ success: true })
                    } catch (e) {
                        const error = e as Error
                        console.error("[Shepherd Injector] tour.start() error:", error)
                        sendResponse({ success: false, error: error.message })
                    }
                }, 500)

            } catch (error) {
                const err = error as Error
                console.error("[Shepherd Injector] Tour creation failed:", err)
                sendResponse({ success: false, error: err.message })
            }
        }

        checkPageReady()
    }

    return true // Async response
})