import type { PlasmoCSConfig } from "plasmo"

/* -------------------------------------------------------
   CONTENT SCRIPT CONFIG
------------------------------------------------------- */
export const config: PlasmoCSConfig = {
    matches: ["https://chatgpt.com/*"],
    run_at: "document_idle"
}

/* -------------------------------------------------------
   INJECTION CONFIRMATION
------------------------------------------------------- */
console.info(
    "%c[Creator Picker] Injected successfully on chatgpt.com",
    "color: #4ade80; font-weight: bold; font-size: 14px"
)
console.log(localStorage.getItem(
    "courseCreatorSteps"
))
/* -------------------------------------------------------
   STATE
------------------------------------------------------- */
let picking = false
let lastChosen: HTMLElement | null = null
let lastHover: HTMLElement | null = null

/* -------------------------------------------------------
   STYLES (injected automatically)
------------------------------------------------------- */
const style = document.createElement("style")
style.textContent = `
  .picker-hover {
    outline: 2px dashed #4f8cff !important;
    cursor: crosshair !important;
  }
  .picker-chosen {
    outline: 3px solid #ffb400 !important;
  }
  .picker-active-cursor {
    cursor: crosshair !important;
  }
`
document.head.appendChild(style)

/* -------------------------------------------------------
   SELECTOR BUILDER (simple but stable)
------------------------------------------------------- */
function buildSelector(el: HTMLElement): string {
    if (el.id) return `#${el.id}`

    const cls = [...el.classList].map((c) => `.${c}`).join("")
    const base = el.tagName.toLowerCase() + cls

    let parent = el.parentElement
    let depth = 0

    while (parent && depth < 8) {
        if (parent.id) return `#${parent.id} ${base}`
        parent = parent.parentElement
        depth++
    }

    return base
}

/* -------------------------------------------------------
   EVENT LISTENERS
------------------------------------------------------- */
const hoverHandler = (e: MouseEvent) => {
    if (!picking) return

    const target = e.target as HTMLElement
    if (!target) return

    if (lastHover && lastHover !== lastChosen) {
        lastHover.classList.remove("picker-hover")
    }

    lastHover = target
    if (lastHover !== lastChosen) {
        lastHover.classList.add("picker-hover")
    }
}

const clickHandler = (e: MouseEvent) => {
    if (!picking) return

    e.preventDefault()
    e.stopImmediatePropagation()

    const target = e.target as HTMLElement
    if (!target) return

    // Remove previous highlight
    if (lastChosen) lastChosen.classList.remove("picker-chosen")

    lastChosen = target
    lastChosen.classList.remove("picker-hover")
    lastChosen.classList.add("picker-chosen")

    const selector = buildSelector(target)

    stopPicker()

    // SEND RESULT TO SIDEPANEL
    chrome.runtime.sendMessage(
        { action: "ELEMENT_SELECTED", selector },
        () => {
            if (chrome.runtime.lastError) {
                console.error(
                    "[Creator Picker] sendMessage failed:",
                    chrome.runtime.lastError.message
                )
            }

        }
    )
}

/* -------------------------------------------------------
   START / STOP PICKING
------------------------------------------------------- */
function startPicker() {
    if (picking) return

    picking = true
    console.log("[Creator Picker] Picking started")

    document.body.classList.add("picker-active-cursor")
    document.addEventListener("mousemove", hoverHandler, true)
    document.addEventListener("click", clickHandler, true)
}

function stopPicker() {
    picking = false
    console.log("[Creator Picker] Picking stopped")

    document.body.classList.remove("picker-active-cursor")

    document.removeEventListener("mousemove", hoverHandler, true)
    document.removeEventListener("click", clickHandler, true)

    if (lastHover) lastHover.classList.remove("picker-hover")
    lastHover = null
}

/* -------------------------------------------------------
   MESSAGE LISTENER (from sidepanel)
------------------------------------------------------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "START_ELEMENT_PICKER") {
        startPicker()
        sendResponse({ ok: true })
        return true
    }
})
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "STOP_ELEMENT_PICKER") {
        startPicker()
        sendResponse({ ok: true })
        return true
    }
})
