import { driver, type DriveStep, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import type { PlasmoCSConfig } from "plasmo"
import { supabase } from "../config/supabase"
import { Step } from "../types"

// 1. PLASMO CONFIG
export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    run_at: "document_idle" // Wait for page to be ready
}
const injectCustomStyles = () => {
    const style = document.createElement('style')
    style.textContent = `
    /* 1. The Main Box */
    .driver-popover {
      background-color: #1e1e2e !important; /* Dark mode bg */
      color: #ffffff !important;
      border-radius: 12px !important;
      padding: 15px !important;
      font-family: 'Inter', sans-serif !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
    }

    /* 2. Title & Description */
    .driver-popover-title {
      font-size: 18px !important;
      font-weight: 700 !important;
      color: #a6e3a1 !important; /* Green accent */
    }
    
    .driver-popover-description {
      font-size: 14px !important;
      line-height: 1.6 !important;
      color: #cdd6f4 !important;
    }

    /* 3. The Buttons */
    .driver-popover-footer button {
      border-radius: 6px !important;
      padding: 8px 16px !important;
      font-size: 12px !important;
      text-transform: uppercase !important;
      font-weight: bold !important;
    }

    /* Next / Done Button */
    .driver-popover-next-btn {
      background-color: #89b4fa !important; /* Blue */
      color: #1e1e2e !important;
      border: none !important;
      text-shadow: none !important;
    }
    
    /* Previous Button */
    .driver-popover-prev-btn {
      background-color: transparent !important;
      border: 1px solid #45475a !important;
      color: #bac2de !important;
    }
    
    .driver-popover-prev-btn:hover {
      background-color: #313244 !important;
    }
  `
    document.head.appendChild(style)
}
injectCustomStyles()


interface TourState {
    courseId: string
    nextIndex: number
    steps: Step[]
    isPendingResume: boolean
}

// 3. STORAGE UTILS (Uses localStorage to persist data across reloads)
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

// 4. UTILITY: WAIT FOR ELEMENT
// This waits for the element to actually exist in the DOM before showing the step
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

// 5. GLOBAL DRIVER INSTANCE
let driverObj: Driver | null = null

// 6. MAIN FUNCTION: START OR RESUME TOUR
const startOrResumeTour = async (
    steps: Step[],
    startIndex: number = 0,
    courseId: string
) => {

    const driverSteps: DriveStep[] = steps.map((step, index) => {
        const isLastStep = index === steps.length - 1
        const isActionRequired = step.click_required || step.input_required
        return {
            element: step.element,
            popover: {
                title: `Step ${step.order_index + 1}`,
                description: `
                    <div class="my-custom-body">
                    <p>${step.text}</p>
                    </div>
                `,
                side: step.on || "bottom",
                align: 'start',

                doneBtnText: isLastStep ? "Done" : "Next",

                showButtons: isActionRequired ? ["previous"] : ["next", "previous"],
                onNextClick: isLastStep
                    ? () => {
                        console.log("Force closing tour...")
                        driverObj?.destroy()
                        // Double safety: clear state immediately
                        clearTourState()
                    }
                    : () => driverObj?.moveNext() // Default behavior for other steps
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
        showProgress: true,
        animate: true,
        // isableActiveInteraction: false,
        disableActiveInteraction: false,
        // 2. Prevent the tour from closing if they click the background (since they will be clicking it now!)
        allowClose: false,
        steps: driverSteps,
        // allowClose: true,
        onDestroyStarted: () => {
            const state = getTourState()
            if (!state?.isPendingResume) {
                console.log("Tour ended by user.")
                clearTourState()

                // BRUTE FORCE CLEANUP: Manually remove the overlay if Driver.js misses it
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

// Execute auto-resume immediately
checkAndResumeTour()

// 9. MESSAGE LISTENER (Entry point from Popup)
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.action === "startTour" && request.courseId) {

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