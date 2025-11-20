import type { PlasmoCSConfig } from "plasmo"
import { getCssSelector } from "css-selector-generator";

// export const config: PlasmoCSConfig = {
//     matches: ["<all_urls>"],
//     run_at: "document_idle"
// }

console.info(
    "%c[Creator Picker] Injected successfully on chatgpt.com",
    "color: #4ade80; font-weight: bold; font-size: 14px"
)

let picking = false

const style = document.createElement("style")
style.textContent = `
  .picker-active-cursor {
    cursor: crosshair !important;
  }
`
document.head.appendChild(style)

const clickHandler = (e: MouseEvent) => {
    if (!picking) return

    e.preventDefault()
    e.stopImmediatePropagation()

    const target = e.target as HTMLElement
    if (!target) return

    const selector = getCssSelector(target)
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

function startPicker() {
    if (picking) return

    picking = true
    console.log("[Creator Picker] Picking started")

    document.body.classList.add("picker-active-cursor")
    document.addEventListener("click", clickHandler, true)
}

function stopPicker() {
    picking = false
    console.log("[Creator Picker] Picking stopped")

    document.body.classList.remove("picker-active-cursor")

    document.removeEventListener("click", clickHandler, true)

}

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.action === "START_ELEMENT_PICKER") {
        startPicker()
        sendResponse({ ok: true })
        return true
    }
})
chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.action === "STOP_ELEMENT_PICKER") {
        startPicker()
        sendResponse({ ok: true })
        return true
    }
})
