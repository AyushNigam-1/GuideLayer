import Shepherd from "shepherd.js"
import type { Tour, StepOptions, Step } from "shepherd.js"
import { offset } from "@floating-ui/dom"
import type { Placement } from "@floating-ui/dom"
import { supabase } from './config/supabase'
import "../css/pro-theme.css"
import 'shepherd.js/dist/css/shepherd.css';
import { Message, StepData } from "./types"


let tourSteps: StepData[] = []
let speechUtterance: SpeechSynthesisUtterance | null = null
let isSpeaking: boolean = false
let currentAudio: HTMLAudioElement | null = null

const playStepAudio = (audioUrl: string): void => {
    // Stop any previous audio
    if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
        currentAudio = null
    }

    if (!audioUrl) {
        console.log("[Tour] No audio URL for this step")
        return
    }

    const fullUrl = `https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${audioUrl}`
    console.log("[Tour] Playing audio:", fullUrl)

    currentAudio = new Audio(fullUrl)
    currentAudio.volume = 0.9

    currentAudio.play().catch(err => {
        console.error("[Tour] Audio playback failed:", err)
    })

    currentAudio.onended = () => {
        console.log("[Tour] Audio finished")
        currentAudio = null
    }
}

const stopAudio = (): void => {
    if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
        currentAudio = null
    }
}
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

const popupHtml = (text: string, filename?: string): string => {
    const BASE_URL = 'https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images';
    let mediaHtml = '';
    if (filename) {
        const mediaUrl = `${BASE_URL}/${filename}`;
        const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(filename);
        if (isVideo) {
            mediaHtml = `
                <video controls class="t3-media-element">
                    <source src="${mediaUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        } else {
            mediaHtml = `
                <img src="${mediaUrl}" alt="Media content" class="t3-media-element">
            `;
        }
    }
    return `
        <div class="t3-card">
            <div class="t3-card-body">
                <!-- Media Element (Image or Video) -->
                ${mediaHtml}
                <div class="t3-card-title">
                    A Comprehensive Guide to Modern Web Development
                </div>
                <div class="t3-card-text">
                    ${text}
                </div>
            </div>
        </div>
    `;
};
const handleStartTour = async (courseId: string, sendResponse: SendResponse) => {
    try {
        const { data: steps, error } = await supabase
            .from("steps")
            .select("*")
            .eq("course_id", courseId)
            .order("order_index")
        tourSteps = steps as StepData[]
        console.log("tourSteps", tourSteps[0].file)
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
        // Extract baseUrl from message (e.g. "https://chat.openai.com")
        const expectedBaseUrl = message.baseUrl
        console.log(message)
        const currentUrl = window.location.href
        const currentBase = new URL(currentUrl).origin
        console.log(currentBase !== expectedBaseUrl, currentBase, expectedBaseUrl)
        // Check if current site matches expected base URL
        if (currentBase !== expectedBaseUrl) {
            console.log("wrong url")
            showWrongSiteWarning(expectedBaseUrl)
            sendResponse({ success: false, error: "Wrong website" })
            return true
        }

        // If correct site → start tour
        handleStartTour(message.courseId!, sendResponse)
        return true
        // handleStartTour(message.courseId!, sendResponse)
        // return true
    }
})

function showWrongSiteWarning(correctUrl: string) {
    // Remove any existing warning
    document.querySelector("#guide-layer-wrong-site")?.remove()

    const warning = document.createElement("div")
    warning.id = "guide-layer-wrong-site"
    warning.innerHTML = `
   <div class="custom-popup" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%); /* Perfect Center */
      z-index: 999999;
      background: rgb(17 24 39); /* Reverted to Dark Background */
      color: white; /* Reverted to White Text */
      padding: 30px 24px 24px 24px;
      border-radius: 16px;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5); /* Darker shadow for dark mode */
      font-family: 'Inter', system-ui, sans-serif;
      max-width: 400px;
      width: 90%;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    ">
      <div style="
        color: #ef4444; /* Tailwind red-500 */
        font-size: 40px;
        line-height: 1;
        margin-bottom: 10px;
      ">
        &#9888; </div>
      
      <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: white;">
        Wrong Website Detected!
      </div>
      
      <p style="margin: 12px 0 20px 0; font-size: 15px; line-height: 1.5; color: #d1d5db;">
        This guide is intended for:
        <strong style="color: white; font-weight: 600;">${correctUrl}</strong><br>
        You're currently on: 
        <strong style="color: #ef4444; font-weight: 600;">${window.location.hostname}</strong>
      </p>
      
      <button id="guide-layer-redirect-btn" style="
        width: 100%;
        background: rgb(37 99 235); /* High-contrast red for the primary action */
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s;
      " onmouseover="this.style.background='#b91c1c'; this.style.boxShadow='0 6px 8px rgba(185, 28, 28, 0.3)';"
         onmouseout="this.style.background='#ef4444'; this.style.boxShadow='0 4px 6px rgba(239, 68, 68, 0.2)';">
        Go to Correct Site
      </button>
      
      <button onclick="/* Add your dismiss function here */" style="
        background: transparent;
        border: none;
        color: #9ca3af; /* Soft gray for secondary action */
        margin-top: 10px;
        padding: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: color 0.2s;
      " onmouseover="this.style.color='white'" onmouseout="this.style.color='#9ca3af'">
        Continue Anyway (Not Recommended)
      </button>

    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -60%); }
        to { opacity: 1; transform: translate(-50%, -50%); }
      }
    </style>
  `

    document.body.appendChild(warning)

    // Redirect button
    document.getElementById("guide-layer-redirect-btn")?.addEventListener("click", () => {
        window.location.replace(correctUrl); // Use replace() instead of setting href directly 
    })

    // Auto-remove after 10 seconds (optional)
    setTimeout(() => {
        warning.style.transition = "all 0.5s"
        warning.style.transform = "translateX(-50%) translateY(-20px)"
        warning.style.opacity = "0"
        setTimeout(() => warning.remove(), 500)
    }, 10000)
}

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
                    text: popupHtml(stepData.text, stepData.file),
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
            const stepData = event.step.options as any
            const stepId = stepData.id

            // Find the step in tourSteps array
            const currentStep = tourSteps.find(s => s._id === stepId)

            // Stop any previous audio/voice
            stopSpeech()
            stopAudio()
            console.log(currentStep?.audio, " audio file ")
            // Play audio file if exists
            if (currentStep?.audio) {

                playStepAudio(currentStep.audio)
            } else {
                // Fallback to voice if no audio
                const stepText: string = event.step.options.text as string
                speakText(stepText)
            }
            // const closeBtn = document.querySelector('.close-btn')
            // if (closeBtn) {
            //     tour.on('show', (event: { step: Step }) => {
            //         // const stepText: string = event.step.options.text as string
            //         // speakText(stepText) // Narrate on show

            //         // CRITICAL: Add click handler to close button
            //         const closeBtn = document.querySelector('.close-btn')
            //         if (closeBtn) {
            //             // Remove old listener to prevent duplicates
            //             closeBtn.replaceWith(closeBtn.cloneNode(true))
            //             const newCloseBtn = document.querySelector('.close-btn')
            //             newCloseBtn?.addEventListener('click', () => {
            //                 tour.cancel()
            //                 stopSpeech()
            //                 console.log("[Tour] User closed the tour")
            //             })
            //         }
            //     })
            // }
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
