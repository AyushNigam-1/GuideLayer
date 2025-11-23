import Shepherd from "shepherd.js"
import type { Tour, StepOptions, Step } from "shepherd.js"
import { offset } from "@floating-ui/dom"
import type { Placement } from "@floating-ui/dom"
import { supabase } from './config/supabase'
// import '../public/beautiful-tour.css';
import "../css/pro-theme.css"
import 'shepherd.js/dist/css/shepherd.css';
import { Message, StepData } from "./types"


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

const popupHtml = (text: string, image?: string) => {
    return `
  <div class="t3-card">
    <svg
      class="close-btn"
      stroke="currentColor"
      fill="currentColor"
      stroke-width="0"
      viewBox="0 0 512 512"
      height="200px"
      width="200px"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path>
    </svg>
    <div class="t3-card-body">
      <svg
        class="t3-card-image"
        stroke="currentColor"
        fill="currentColor"
        stroke-width="0"
        viewBox="0 0 640 512"
        height="200px"
        width="200px"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z"></path>
      </svg>
      <div class="t3-card-title">
        A Comprehensive Guide to Modern Web Development
      </div>
      <div class="t3-card-text">
        ${text}
      </div>
    </div>
  </div>
`
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
        console.log("working lol")
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
                classes: "shepherd-theme-custom",
                scrollTo: false,

                // cancelIcon: { enabled: true },
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
                    buttons.push({
                        text: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
       stroke-width="2" stroke="currentColor" width="24" height="24">
  <path stroke-linecap="round" stroke-linejoin="round"  d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
</svg> 
`, action: tour.back, classes: 'shepherd-button'
                    });
                }
                buttons.push({
                    text: stepData.buttonText || `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
       stroke-width="2" stroke="currentColor" width="24" height="24">
    <path stroke-linecap="round" stroke-linejoin="round" 
          d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
  </svg>
`,
                    action: stepData._id === 'submit-response' ? tour.complete : tour.next,
                    classes: stepData._id === 'submit-response' ? 'shepherd-button' : ''
                });

                // Correct attachTo structure
                const stepConfig: Partial<StepOptions> = {
                    id: stepData._id,
                    text: popupHtml(stepData.text),
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
            // speakText(stepData.text) // Narrate on show
            const closeBtn = document.querySelector('.close-btn')
            if (closeBtn) {
                tour.on('show', (event: { step: Step }) => {
                    const stepText: string = event.step.options.text as string
                    speakText(stepText) // Narrate on show

                    // CRITICAL: Add click handler to close button
                    const closeBtn = document.querySelector('.close-btn')
                    if (closeBtn) {
                        // Remove old listener to prevent duplicates
                        closeBtn.replaceWith(closeBtn.cloneNode(true))
                        const newCloseBtn = document.querySelector('.close-btn')
                        newCloseBtn?.addEventListener('click', () => {
                            tour.cancel()
                            stopSpeech()
                            console.log("[Tour] User closed the tour")
                        })
                    }
                })
            }
        })

        tour.on('hide', () => {
            // stopSpeech() // Pause on next/back
        })

        tour.on('complete', () => {
            // stopSpeech() // Stop on finish
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
