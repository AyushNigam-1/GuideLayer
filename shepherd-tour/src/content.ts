// import Shepherd from "shepherd.js"
// import type { Tour, StepOptions, Step } from "shepherd.js"
// import { offset } from "@floating-ui/dom"
// import type { Placement } from "@floating-ui/dom"
// import { supabase } from './config/supabase'
// import "../css/pro-theme.css"
// import 'shepherd.js/dist/css/shepherd.css';
// import { DbStep, Message, StepData, ThemeValue } from "./types"
// import { data } from "react-router-dom"

// declare global {
//     interface Window {
//         __shepherdTour?: any
//     }
// }
// // ---------- TOUR STATE (GLOBAL, SINGLE SOURCE OF TRUTH) ----------

// let currentStepId: string | null = null

// // FIXED: Defined structure to allow string indexing
// let STEP_MAP: Record<string, {
//     next?: string
//     prev?: string
//     click_required?: boolean
//     element?: string
// }> = {}
// let tourSteps: StepData[] = []
// let speechUtterance: SpeechSynthesisUtterance | null = null
// let isSpeaking: boolean = false
// let currentAudio: HTMLAudioElement | null = null
// let theme = ""

// chrome.storage.sync.get("uiTheme", (result) => {
//     const storedTheme = result.uiTheme as ThemeValue;
//     console.log("storedTheme", storedTheme)
//     theme = storedTheme
// })
// const handleStorageChange = (
//     changes: { [key: string]: chrome.storage.StorageChange },
//     areaName: string
// ) => {
//     console.log("theme")
//     if (areaName === "sync" && changes.uiTheme) {
//         console.log("theme changed", changes.uiTheme.newValue)
//         theme = changes.uiTheme.newValue
//         // applyTheme(changes.popupTheme.newValue as ThemeValue);
//     }
// };

// function buildStepMap(steps: StepData[]) {
//     STEP_MAP = {}

//     // Ensure correct order
//     const sorted = [...steps].sort((a, b) => a.order_index - b.order_index)

//     for (let i = 0; i < sorted.length; i++) {
//         const step = sorted[i]

//         // FIXED: Changed from step.id to step._id to match the tour config
//         STEP_MAP[step._id] = {
//             element: step.element as string,
//             click_required: step.click_required,
//             prev: sorted[i - 1]?._id, // FIXED: Use _id
//             next: sorted[i + 1]?._id  // FIXED: Use _id
//         }
//     }
// }

// chrome.storage.onChanged.addListener(handleStorageChange);
// const playStepAudio = (audioUrl: string): void => {
//     // Stop any previous audio
//     if (currentAudio) {
//         currentAudio.pause()
//         currentAudio.currentTime = 0
//         currentAudio = null
//     }

//     if (!audioUrl) {
//         console.log("[Tour] No audio URL for this step")
//         return
//     }

//     const fullUrl = `https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${audioUrl}`
//     console.log("[Tour] Playing audio:", fullUrl)

//     currentAudio = new Audio(fullUrl)
//     currentAudio.volume = 0.9

//     currentAudio.play().catch(err => {
//         console.error("[Tour] Audio playback failed:", err)
//     })

//     currentAudio.onended = () => {
//         console.log("[Tour] Audio finished")
//         currentAudio = null
//     }
// }

// const stopAudio = (): void => {
//     if (currentAudio) {
//         currentAudio.pause()
//         currentAudio.currentTime = 0
//         currentAudio = null
//     }
// }
// const speakText = (text: string): void => {
//     if ('speechSynthesis' in window && !isSpeaking) {
//         speechUtterance = new SpeechSynthesisUtterance(text)
//         speechUtterance.rate = 0.9 // Slightly slower for clarity (0.1-10 range)
//         speechUtterance.pitch = 1.0 // Natural pitch (0.1-2)
//         speechUtterance.volume = 0.8 // Volume (0-1)

//         const voices: SpeechSynthesisVoice[] = speechSynthesis.getVoices()
//         const englishVoice: SpeechSynthesisVoice | undefined = voices.find((voice: SpeechSynthesisVoice) => voice.lang.startsWith('en') && voice.name.includes('Male'))
//         if (englishVoice) speechUtterance.voice = englishVoice

//         speechUtterance.onend = () => { isSpeaking = false }
//         speechUtterance.onerror = (e: SpeechSynthesisErrorEvent) => {
//             console.error('[Shepherd Injector] Speech error:', e)
//             isSpeaking = false
//         }

//         speechSynthesis.speak(speechUtterance)
//         isSpeaking = true
//         console.log('[Shepherd Injector] Narrating:', text)
//     } else {
//         console.warn('[Shepherd Injector] Speech API not supported or already speaking')
//     }
// }

// const stopSpeech = (): void => {
//     if (speechUtterance && isSpeaking) {
//         speechSynthesis.cancel()
//         isSpeaking = false
//         console.log('[Shepherd Injector] Speech stopped')
//     }
// }

// const popupHtml = (text: string, filename?: string): string => {
//     const BASE_URL = 'https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images';
//     let mediaHtml = '';
//     const themeClass = theme === 'light' ? 't3-theme-light' : 't3-theme-dark';

//     if (filename) {
//         const mediaUrl = `${BASE_URL}/${filename}`;
//         const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(filename);
//         if (isVideo) {
//             mediaHtml = `
//                 <video controls class="t3-media-element">
//                     <source src="${mediaUrl}" type="video/mp4">
//                     Your browser does not support the video tag.
//                 </video>
//             `;
//         } else {
//             mediaHtml = `
//                 <img src="${mediaUrl}" alt="Media content" class="t3-media-element">
//             `;
//         }
//     }

//     return `
//         <div class="t3-card ${themeClass}">
//             <div class="t3-card-body">
//                 ${mediaHtml}
//                 <div class="t3-card-title">
//                     A Comprehensive Guide to Modern Web Development
//                 </div>
//                 <div class="t3-card-text">
//                     ${text}
//                 </div>
//             </div>
//         </div>
//     `;
// };

// const handleStartTour = async (courseId: string, sendResponse: SendResponse) => {
//     try {
//         const { data: steps, error } = await supabase
//             .from("steps")
//             .select("*")
//             .eq("course_id", courseId)
//             .order("order_index")
//         tourSteps = steps as StepData[]
//         console.log("data", steps)
//         if (tourSteps && tourSteps.length > 0) {
//             console.log("tourSteps", tourSteps[0].file)
//             buildStepMap(tourSteps)
//             checkPageReady()
//         }

//         if (error) {
//             console.error("Supabase error:", error)
//             sendResponse({ success: false })
//             return
//         }
//         sendResponse({ success: true })
//     } catch (err) {
//         console.error("[Content Script] Unexpected error:", err)
//         sendResponse({ success: false })
//     }
// }

// type SendResponse = (response?: { success: boolean; error?: string, data?: any }) => void

// chrome.runtime.onMessage.addListener((message: Message, _: chrome.runtime.MessageSender, sendResponse: SendResponse) => {
//     if (message.action === "startTour") {
//         console.log("working lol")
//         console.log(window.location.href, message.baseUrl)
//         // if (window.location.href != message.baseUrl) {
//         //     console.log("wrong url")
//         //     showWrongSiteWarning(message.baseUrl)
//         //     sendResponse({ success: false, error: "Wrong website" })
//         //     return true
//         // }
//         handleStartTour(message.courseId!, sendResponse)
//         return true
//     }
// })

// function waitForUIIdle(idleMs = 300, timeout = 5000) {
//     return new Promise<void>((resolve, reject) => {
//         let lastMutation = Date.now()
//         const start = Date.now()

//         const observer = new MutationObserver(() => {
//             lastMutation = Date.now()
//         })

//         observer.observe(document.body, {
//             childList: true,
//             subtree: true,
//             attributes: true
//         })

//         const check = () => {
//             // console.log("working") // Reduced spam
//             if (Date.now() - lastMutation >= idleMs) {
//                 observer.disconnect()
//                 resolve()
//             } else if (Date.now() - start > timeout) {
//                 observer.disconnect()
//                 reject("UI did not become idle")
//             } else {
//                 requestAnimationFrame(check)
//             }
//         }

//         check()
//     })
// }


// function showWrongSiteWarning(correctUrl: string) {
//     document.querySelector("#guide-layer-wrong-site")?.remove()
//     const warning = document.createElement("div")
//     warning.id = "guide-layer-wrong-site"
//     warning.innerHTML = `
//    <div class="custom-popup" style="
//       position: fixed;
//       top: 50%;
//       left: 50%;
//       transform: translate(-50%, -50%); /* Perfect Center */
//       z-index: 999999;
//       background: rgb(17 24 39); /* Reverted to Dark Background */
//       color: white; /* Reverted to White Text */
//       padding: 30px 24px 24px 24px;
//       border-radius: 16px;
//       box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5); /* Darker shadow for dark mode */
//       font-family: 'Inter', system-ui, sans-serif;
//       max-width: 400px;
//       width: 90%;
//       text-align: center;
//       animation: fadeIn 0.3s ease-out;
//     ">
//       <div style="
//         color: #ef4444; /* Tailwind red-500 */
//         font-size: 40px;
//         line-height: 1;
//         margin-bottom: 10px;
//       ">
//         &#9888; </div>
      
//       <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: white;">
//         Wrong Website!
//       </div>
      
//       <p style="margin: 12px 0 20px 0; font-size: 15px; line-height: 1.5; color: #d1d5db;">
//         This guide is intended for:
//         <strong style="color: white; font-weight: 600;">${correctUrl}</strong><br>
//         You're currently on: 
//         <strong style="color: #ef4444; font-weight: 600;">${window.location.hostname}</strong>
//       </p>
      
//       <button id="guide-layer-redirect-btn" style="
//         width: 100%;
//         background: rgb(37 99 235); /* High-contrast red for the primary action */
//         color: white;
//         border: none;
//         padding: 12px 20px;
//         border-radius: 8px;
//         font-size: 16px;
//         font-weight: 600;
//         cursor: pointer;
//         display:flex;
//         justify-content:center;
//         gap:6px;
//         transition: background 0.2s, box-shadow 0.2s;">
//         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" style="width:20px">
//         <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
//         </svg>

//         Go to Correct Site
//       </button>
      
//       <button id="guide-layer-continue-anyway" style="
//         background: transparent;
//         border: none;
//         color: #9ca3af; /* Soft gray for secondary action */
//         margin-top: 10px;
//         padding: 5px;
//         cursor: pointer;
//         font-size: 14px;
//         transition: color 0.2s;">
//         Continue Anyway 
//       </button>
//     </div>
//     <style>
//       @keyframes fadeIn {
//         from { opacity: 0; transform: translate(-50%, -60%); }
//         to { opacity: 1; transform: translate(-50%, -50%); }
//       }
//     </style>
//   `

//     document.body.appendChild(warning)

//     document.getElementById("guide-layer-redirect-btn")?.addEventListener("click", () => {
//         window.location.replace(correctUrl);
//     })
//     document.getElementById("guide-layer-continue-anyway")?.addEventListener("click", () => {
//         warning.remove()
//     })

//     setTimeout(() => {
//         warning.style.transition = "all 0.5s"
//         warning.style.transform = "translateX(-50%) translateY(-20px)"
//         warning.style.opacity = "0"
//         setTimeout(() => warning.remove(), 500)
//     }, 10000)
// }

// const checkPageReady = (): void => {
//     if (!document.body) {
//         console.log("[Shepherd Injector] Waiting for page load...")
//         setTimeout(checkPageReady, 1000)
//         return
//     }
//     // async function goToStep(tour: Tour, stepId: string) {
//     async function goToStep(tour: Tour, stepId: string) {
//         currentStepId = stepId
//         console.log("Going to step:", currentStepId)

//         try {
//             // Wait for UI, but don't crash if it times out
//             await waitForUIIdle(300, 2000) // Reduced timeout to 2s for snappier feel
//         } catch (e) {
//             console.warn("[Tour] UI Idle timeout - forcing navigation:", e)
//         }

//         // Small safety buffer
//         await new Promise(r => requestAnimationFrame(r))

//         // Check if step actually exists before showing to prevent internal Shepherd errors
//         if (tour.getById(stepId)) {
//             tour.show(stepId)
//         } else {
//             console.error(`[Tour] Critical: Step ${stepId} not registered in Shepherd.`)
//         }
//     }

//     console.log("[Shepherd Injector] Page ready - building multi-step tour...")

//     try {
//         if (!window.__shepherdTour) {
//             window.__shepherdTour = new Shepherd.Tour({
//                 defaultStepOptions: {
//                     classes: theme,
//                     scrollTo: true,
//                     cancelIcon: { enabled: true }
//                 }
//             })
//         }

//         const tour = window.__shepherdTour


//         let addedSteps = 0

//         tourSteps.forEach((stepData: any) => {
//             try {
//                 let element: HTMLElement | null = null;
//                 const selector = stepData.element?.trim();
//                 const placement = stepData.on || 'right';

//                 if (selector) {
//                     element = document.querySelector(selector) as HTMLElement;
//                     if (!element && stepData._id === 'input-prompt') {
//                         const textarea = document.querySelector('textarea');
//                         if (textarea?.parentElement) {
//                             element = textarea.parentElement.closest('div') || textarea.parentElement;
//                         }
//                     }

//                     if (!element) {
//                         console.warn(`[Tour] Element not found for selector: ${selector} (step: ${stepData._id})`);
//                     }
//                 }

//                 const buttons: any[] = [];
//                 if (stepData._id !== 'welcome') {
//                     buttons.push({
//                         text: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
//                                     stroke-width="2" stroke="currentColor" width="24" height="24">
//                                     <path stroke-linecap="round" stroke-linejoin="round"  d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
//                                 </svg>`,
//                         action: () => {
//                             // FIXED: Use local stepData._id instead of global currentStepId
//                             const prev = STEP_MAP[stepData._id]?.prev
//                             if (prev) goToStep(tour, prev)
//                         },
//                         classes: 'shepherd-button'
//                     })
//                 }

//                 buttons.push({
//                     text: stepData.buttonText || `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
//                                         stroke-width="2" stroke="currentColor" width="24" height="24">
//                                         <path stroke-linecap="round" stroke-linejoin="round" 
//                                             d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
//                                     </svg>`,
//                     action: () => {
//                         console.log("Next Clicked. Step:", stepData._id)
//                         if (stepData._id === 'submit-response') {
//                             tour.complete()
//                             return
//                         }

//                         // FIXED: Use local stepData._id instead of global currentStepId
//                         // This ensures we always get the 'next' value associated with THIS specific step.
//                         const next = STEP_MAP[stepData._id]?.next

//                         console.log("Calculated Next:", next)

//                         if (next) {
//                             goToStep(tour, next)
//                         } else {
//                             console.warn("No next step found for", stepData._id)
//                             // Optional: tour.complete() or stay on page
//                         }
//                     },
//                     classes: stepData._id === 'submit-response' ? 'shepherd-button' : ''
//                 })

//                 // Correct attachTo structure
//                 const stepConfig: Partial<StepOptions> = {
//                     id: stepData._id,
//                     text: popupHtml(stepData.text, stepData.file),
//                     buttons,
//                     beforeShowPromise: () => {
//                         return new Promise<void>(async (resolve, reject) => {
//                             console.log("detecting...")
//                             if (stepData.site_url) {
//                                 const expected = new URL(stepData.site_url).origin
//                                 const current = window.location.origin
//                                 if (current !== expected) {
//                                     showWrongSiteWarning(stepData.site_url)
//                                     reject()
//                                     return
//                                 }
//                             }
//                             resolve()
//                         })
//                     }
//                 };

//                 if (element && element.offsetParent) {
//                     stepConfig.attachTo = { element, on: placement as Placement };
//                     stepConfig.floatingUIOptions = { middleware: [offset(12)] };
//                 } else if (stepData._id === 'welcome') {
//                     stepConfig.attachTo = undefined;
//                 } else {
//                     console.warn(`[Tour] Step skipped due to missing element: ${stepData._id}`);
//                     return;
//                 }
//                 tour.addStep(stepConfig as StepOptions);
//                 addedSteps++;
//                 console.log(`[Tour] Added step: ${stepData._id} → ${selector || 'centered'}`);
//             } catch (err) {
//                 console.error("Error adding step:", stepData._id, err);
//             }
//         });

//         if (addedSteps === 0) {
//             throw new Error('No valid steps could be added')
//         }

//         tour.on('show', (event: { step: Step }) => {
//             const stepData = event.step.options as any
//             const stepId = stepData.id
//             const currentStep = tourSteps.find(s => s._id === stepId)

//             // Safe assignment
//             if (currentStep) {
//                 currentStepId = currentStep._id
//                 console.log("Show Step:", currentStepId, "Click Required:", currentStep.click_required)

//                 if (currentStep.click_required) {
//                     const target = document.querySelector(currentStep.element as string) as HTMLElement;
//                     if (target) {
//                         console.log(`[Tour] Step ${stepId} requires click on target.`);
//                         const handleProceed = async () => {
//                             target.removeEventListener('click', handleProceed);
//                             await waitForUIIdle()

//                             // FIXED: Use map with local ID
//                             const next = STEP_MAP[currentStepId!]?.next
//                             console.log("Click Event Next:", next)
//                             if (next) goToStep(tour, next)
//                         };
//                         target.addEventListener('click', handleProceed);

//                         const cleanup = () => {
//                             target.removeEventListener('click', handleProceed);
//                             tour.off('hide', cleanup);
//                             tour.off('cancel', cleanup);
//                         };
//                         tour.once('hide', cleanup);
//                         tour.once('cancel', cleanup);
//                     }
//                 }
//             }
//         })

//         tour.on('hide', () => {
//             // stopSpeech() // Pause on next/back
//         })

//         tour.on('complete', () => {
//             // stopSpeech() // Stop on finish
//         })

//         console.log(`[Shepherd Injector] Tour configured with ${addedSteps} steps, starting in 500ms...`)

//         setTimeout(() => {
//             try {
//                 tour.start()
//                 console.log("[Shepherd Injector] Multi-step tour started successfully!")
//             } catch (e) {
//                 const error = e as Error
//                 console.error("[Shepherd Injector] tour.start() error:", error)
//             }
//         }, 500)

//     } catch (error) {
//         const err = error as Error
//         console.error("[Shepherd Injector] Tour creation failed:", err)
//     }
// }