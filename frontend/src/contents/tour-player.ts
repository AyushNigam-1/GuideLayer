import { driver, type DriveStep, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import type { PlasmoCSConfig } from "plasmo"
import { supabase } from "../config/supabase"
import { Step } from "../types"
import "../../css/pro-theme.css"

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    run_at: "document_idle"
}


interface TourState {
    courseId: string
    nextIndex: number
    steps: Step[]
    isPendingResume: boolean
}

function showWrongSiteWarning(correctUrl: string) {
    document.querySelector("#guide-layer-wrong-site")?.remove()
    const warning = document.createElement("div")
    warning.id = "guide-layer-wrong-site"

    const redirectUrl = correctUrl.startsWith('http') ? correctUrl : `https://${correctUrl}`;

    warning.innerHTML = `
   <div class="custom-popup" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999;
      background: rgb(17 24 39);
      color: white;
      padding: 30px 24px 24px 24px;
      border-radius: 16px;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
      font-family: 'Inter', system-ui, sans-serif;
      max-width: 400px;
      width: 90%;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    ">
      <div style="color: #ef4444; font-size: 40px; line-height: 1; margin-bottom: 10px;">
        &#9888; 
      </div>
      
      <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: white;">
        Wrong Website!
      </div>
      
      <p style="margin: 12px 0 20px 0; font-size: 15px; line-height: 1.5; color: #d1d5db;">
        This guide is intended for:<br>
        <strong style="color: white; font-weight: 600;">${correctUrl}</strong><br><br>
        You're currently on: <br>
        <strong style="color: #ef4444; font-weight: 600;">${window.location.hostname}</strong>
      </p>
      
      <button id="guide-layer-redirect-btn" style="
        width: 100%;
        background: rgb(37 99 235);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display:flex;
        justify-content:center;
        gap:6px;
        transition: background 0.2s, box-shadow 0.2s;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
        Go to Correct Site
      </button>
      
      <button id="guide-layer-continue-anyway" style="
        background: transparent;
        border: none;
        color: #9ca3af;
        margin-top: 10px;
        padding: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: color 0.2s;">
        Continue Anyway 
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

    document.getElementById("guide-layer-redirect-btn")?.addEventListener("click", () => {
        window.location.href = redirectUrl;
    })
    document.getElementById("guide-layer-continue-anyway")?.addEventListener("click", () => {
        warning.remove()
    })

    setTimeout(() => {
        if (document.body.contains(warning)) {
            warning.style.transition = "all 0.5s"
            warning.style.transform = "translate(-50%, -70%)"
            warning.style.opacity = "0"
            setTimeout(() => warning.remove(), 500)
        }
    }, 10000)
}

const STORAGE_KEY = "PLASMO_TOUR_STATE"

const getTourState = (): TourState | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : null
    } catch (e) {
        console.error("Error reading tour state", e)
        return null
    }
}

const saveTourState = (state: TourState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const clearTourState = () => {
    localStorage.removeItem(STORAGE_KEY)
}

const html = (text: string, filename?: string): string => {
    const BASE_URL = 'https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images';
    let mediaHtml = '';

    if (filename) {
        const mediaUrl = `${BASE_URL}/${filename}`;
        const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(filename);
        if (isVideo) {
            mediaHtml = `
                <div class="driver-media-wrapper">
                    <video controls class="driver-media-element">
                        <source src="${mediaUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        } else {
            mediaHtml = `
                <div class="driver-media-wrapper">
                    <img src="${mediaUrl}" alt="Step Media" class="driver-media-element" />
                </div>
            `;
        }
    }

    return `
        <div class="driver-custom-body">
            <button class="driver-close-btn" aria-label="Close tour">×</button>
            ${mediaHtml}
            <div class="driver-custom-text">
                ${text}
            </div>
        </div>
    `;
};

const closeTourWithAnimation = () => {
    const popover = document.querySelector(".driver-popover");
    if (popover) {
        popover.classList.add("driver-popover-fade-out");
        setTimeout(() => {
            driverObj?.destroy();
            clearTourState();
        }, 300);
    } else {
        driverObj?.destroy();
        clearTourState();
    }
}

const waitForElement = (selector: string, timeout = 10000): Promise<Element> => {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector)
        if (el) return resolve(el)

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector)
            if (el) {
                observer.disconnect()
                resolve(el)
            }
        })

        observer.observe(document.body, { childList: true, subtree: true })

        setTimeout(() => {
            observer.disconnect()
            reject(new Error(`Element ${selector} not found within ${timeout}ms`))
        }, timeout)
    })
}

let driverObj: Driver | null = null

const startOrResumeTour = async (
    steps: Step[],
    startIndex: number = 0,
    courseId: string
) => {

    const driverSteps: DriveStep[] = steps.map((step, index) => {
        const isFirstStep = index === 0
        const isLastStep = index === steps.length - 1
        const isActionRequired = step.click_required || step.input_required
        const classList = []

        let visibleButtons: ("next" | "previous" | "close")[] = ["next", "previous"]
        if (isFirstStep) {
            visibleButtons = ["next"]
            classList.push("driver-popover-first-step")
        }

        if (isLastStep) classList.push("driver-popover-last-step")
        if (isActionRequired) classList.push("driver-step-action-required")
        return {
            element: step.element,
            popover: {
                title: `Step ${step.order_index + 1}`,
                description: html(step.text, step.file),
                side: step.on || "bottom",
                align: 'start',
                popoverClass: classList.join(" "),
                doneBtnText: isLastStep ? "Done" : "Next",

                showButtons: visibleButtons,
                onNextClick: isLastStep
                    ? () => {
                        console.log("Force closing tour...")
                        driverObj?.destroy()
                        closeTourWithAnimation()
                    }
                    : () => driverObj?.moveNext()
            },

            // ... your existing onHighlightStarted hook ...
            onHighlightStarted: (element) => {
                if (!element) return

                // 1. Handle Click Required
                if (step.click_required) {
                    setupClickRequiredHandler(element, index, steps, courseId)
                }

                // 2. Handle Input Required (New)
                else if (step.input_required && step.input) {
                    setupInputRequiredHandler(element, step.input, index, steps, courseId)
                }
            }
        }
    })

    // Initialize Driver
    driverObj = driver({
        showProgress: false,
        animate: true,
        disableActiveInteraction: false,
        allowClose: false,
        steps: driverSteps, // Your mapped steps

        // 👇 THIS IS THE CRITICAL PART YOU ARE MISSING
        onPopoverRender: (popover) => {

            // 1. Logic for the Close (Cross) Button
            const closeBtn = document.querySelector(".driver-close-btn");
            if (closeBtn) {
                closeBtn.addEventListener("click", closeTourWithAnimation);
            }

            // 2. Logic for Disabling the Next Button
            // We check if the current step wrapper has the "action-required" class
            const wrapper = popover.wrapper;
            const isActionStep = wrapper.classList.contains("driver-step-action-required");

            if (isActionStep) {
                console.log("Action required: Disabling Next button..."); // Debug log

                const nextBtn = document.querySelector(".driver-popover-next-btn");
                if (nextBtn) {
                    // Manually ADD the class that your CSS is looking for
                    nextBtn.classList.add("driver-btn-disabled");

                    // Also set the HTML attribute for good measure
                    nextBtn.setAttribute("disabled", "true");
                }
            }
        },

        onDestroyStarted: () => {
            // ... your existing cleanup logic ...
            const state = getTourState()
            if (!state?.isPendingResume) {
                console.log("Tour ended by user.")
                clearTourState()
                setTimeout(() => {
                    const overlay = document.getElementById("driver-page-overlay");
                    if (overlay) overlay.remove();
                }, 100)
            }
        }
    })

    // Wait for the target element before driving (Solves "Element not found" errors)
    try {
        const startSelector = steps[startIndex].element
        console.log(`Waiting for element: ${startSelector}`)

        await waitForElement(startSelector)

        // Drive specifically from the calculated index
        driverObj.drive(startIndex)

        // If we just resumed, clear the pending flag immediately so a crash doesn't loop
        const currentState = getTourState()
        if (currentState) {
            saveTourState({ ...currentState, isPendingResume: false })
        }

    } catch (e) {
        console.error("Could not find start element:", e)
        alert("Could not find the element for this step. Please ensure you are on the right page.")
        clearTourState() // Reset if broken
    }
}

const setupInputRequiredHandler = (
    element: Element,
    expectedText: string,
    currentIndex: number,
    steps: Step[],
    courseId: string
) => {
    // Cast element to HTMLInputElement to access .value
    const inputEl = element as HTMLInputElement

    // Clean up any old listeners to prevent duplicates
    // (We use a named function so we can remove it if needed, 
    // though 'once' isn't appropriate here since they might type wrongly first)

    const inputHandler = (e: Event) => {
        const userValue = (e.target as HTMLInputElement).value

        // Check for Exact Match
        if (userValue === expectedText) {
            console.log("Input matched! Moving to next step...")

            // A. Visual Feedback (Optional: Turn border green)
            inputEl.style.borderColor = "#4ade80"
            inputEl.style.transition = "border-color 0.3s ease"

            // B. Save State (In case page reloads immediately after input)
            const nextIndex = currentIndex + 1
            if (nextIndex < steps.length) {
                saveTourState({
                    courseId,
                    nextIndex,
                    steps,
                    isPendingResume: false // Not strictly pending a reload
                })
            }

            // C. Remove listener so it doesn't trigger again
            inputEl.removeEventListener("input", inputHandler)

            // D. Wait a tiny bit for user to see they were right, then move
            setTimeout(() => {
                // If it was the last step, destroy. Else, move next.
                if (nextIndex >= steps.length) {
                    driverObj?.destroy()
                    clearTourState()
                } else {
                    driverObj?.moveNext()
                }
            }, 500)
        }
    }

    // Check immediately in case the text is ALREADY there (e.g. autofilled)
    if (inputEl.value === expectedText) {
        // Trigger success logic immediately
        inputHandler({ target: inputEl } as any)
    } else {
        // Attach listener
        inputEl.addEventListener("input", inputHandler)
    }
}
// 7. CLICK HANDLER LOGIC
const setupClickRequiredHandler = (
    element: Element,
    currentIndex: number,
    steps: Step[],
    courseId: string
) => {

    const clickHandler = () => {
        // 1. Calculate next step index
        const nextIndex = currentIndex + 1

        // 2. If tour is done, clear everything
        if (nextIndex >= steps.length) {
            clearTourState()
            driverObj?.destroy()
            return
        }

        console.log("Click detected. Saving state for Step:", nextIndex)

        // 3. Save State: "We are pending resume at nextIndex"
        saveTourState({
            courseId,
            nextIndex,
            steps,
            isPendingResume: true
        })

        // 4. Destroy Driver so the click can actually interact with the website
        // (We rely on bubbling or simply allowing the event to pass through)
        driverObj?.destroy()

        // 5. Handling SPA (Single Page Apps) vs Reloads
        // If the page DOES reload, the script restarts and `checkAndResumeTour` picks it up.
        // If the page DOES NOT reload (SPA), we need to manually resume after a delay.
        setTimeout(() => {
            const state = getTourState()
            if (state && state.isPendingResume) {
                console.log("SPA detected or page load finished. Resuming tour...")
                startOrResumeTour(state.steps, state.nextIndex, state.courseId)
            }
        }, 2000)
    }

    element.addEventListener("click", clickHandler, { once: true, capture: true })
}

const checkAndResumeTour = async () => {
    const state = getTourState()

    if (state && state.isPendingResume) {
        console.log(`Resuming tour ${state.courseId} at step ${state.nextIndex}`)
        await startOrResumeTour(state.steps, state.nextIndex, state.courseId)
    }
}

checkAndResumeTour()

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.action === "startTour" && request.courseId) {
        if (request.baseUrl) {
            const currentHost = window.location.hostname.replace(/^www\./, '');
            const targetHost = request.baseUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

            if (currentHost !== targetHost && targetHost !== "") {
                console.warn(`[Tour Player] Wrong site. Expected: ${targetHost}, Current: ${currentHost}`);
                showWrongSiteWarning(request.baseUrl);
                sendResponse({ success: false, error: "Wrong website" });
                return true;
            }
        }
        const handleStart = async () => {
            try {
                console.log("Fetching steps for:", request.courseId)

                const { data: steps } = await supabase
                    .from("steps")
                    .select("*")
                    .eq("course_id", request.courseId)
                    .order("order_index")

                if (!steps || steps.length === 0) {
                    sendResponse({ success: false, error: "No steps found" })
                    return
                }

                clearTourState()

                await startOrResumeTour(steps, 0, request.courseId)

                sendResponse({ success: true })

            } catch (err: any) {
                console.error(err)
                sendResponse({ success: false, error: err.message })
            }
        }

        handleStart()
        return true // Keep channel open for async response
    }
})