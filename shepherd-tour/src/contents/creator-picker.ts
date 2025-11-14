import type { PlasmoCSConfig } from "plasmo"

// Plasmo configuration to ensure injection on the ChatGPT domain
export const config: PlasmoCSConfig = {
    matches: ["https://chatgpt.com/*"],
    // Ensures the script runs when the DOM is fully loaded and ready for interaction
    run_at: "document_idle",
    // Allows the script to run in iframes if present (safer for modern sites)
    all_frames: true
}

// 🎯 CRITICAL STARTUP LOG: If you don't see this in the main page console after reloading, 
// the file is in the wrong directory or the extension needs a full rebuild/reload.
console.info("🚨🚨🚨 [Creator Picker] Content Script Initialized and listening for commands. 🚨🚨🚨");

// --- State Variables ---
let isPickingElement = false;
let lastChosenElement: HTMLElement | null = null;

// --- Utility Functions ---

// Removes the persistent highlight from the previous element
const removeHighlight = () => {
    if (lastChosenElement) {
        lastChosenElement.classList.remove('element-picker-chosen');
        lastChosenElement.style.border = '';
        lastChosenElement.style.boxShadow = '';
        lastChosenElement = null;
    }
};

/**
 * Generates a stable CSS selector by anchoring the target element to its nearest
 * ancestor that has a unique ID.
 */
const generateStableSelector = (element: HTMLElement): string => {
    // 1. If the element itself has an ID, use it (Most unique)
    if (element.id) {
        return `#${element.id}`;
    }

    let current: HTMLElement | null = element;
    let targetSelectorPart = '';

    // Generate the specific selector part for the TARGET element (tag.class1.class2)
    const classes = element.className.trim().split(/\s+/).filter(c => c.length > 0);
    if (classes.length > 0) {
        targetSelectorPart = classes.map(c => `.${c}`).join('');
    }
    // Prepend tag name unless it is only a class selector
    targetSelectorPart = `${element.tagName.toLowerCase()}${targetSelectorPart}`;


    // 2. Search for the nearest ancestor with an ID (the stable anchor)
    let ancestorAnchor = '';
    let distance = 0;
    const maxSearchDepth = 10; // Limit search depth to prevent slow performance

    while (current && current.tagName !== 'BODY' && distance < maxSearchDepth) {
        if (current.id) {
            ancestorAnchor = `#${current.id}`;
            break; // Found the stable anchor!
        }
        current = current.parentElement;
        distance++;
    }

    // 3. Assemble the final selector

    // If a stable ancestor was found, use it as the starting anchor
    if (ancestorAnchor) {
        // Example: #main-content h3.text-title
        return `${ancestorAnchor} ${targetSelectorPart}`;
    }

    // 4. Fallback: If no ancestor ID was found (rare), just return the specific part
    return targetSelectorPart;
};


// --- Listeners for Element Picker Mode ---

// 1. Live Hover Feedback Listener (uses capture phase: true)
const hoverListener = (e: MouseEvent): void => {
    if (!isPickingElement) return;
    const target = e.target as HTMLElement;

    // Clean up previous hover highlights globally
    document.querySelectorAll('.element-picker-hover').forEach(el => {
        el.classList.remove('element-picker-hover');
    });

    // Apply temporary highlight to current target
    target.classList.add('element-picker-hover');
};

// 2. Element Selection Click Listener (uses capture phase: true)
const clickListener = (e: MouseEvent): void => {
    if (!isPickingElement) return;
    e.preventDefault(); // Prevent default browser action (like following a link)
    e.stopImmediatePropagation(); // Stop propagation to prevent site's listeners from firing

    const target = e.target as HTMLElement;

    // 1. Get STABLE Selector using the new utility function
    const selector = generateStableSelector(target);

    // 2. Apply Persistent Highlight
    removeHighlight();
    lastChosenElement = target;
    target.classList.remove('element-picker-hover');
    target.classList.add('element-picker-chosen');

    // 3. Clean up Picker State
    stopPickMode();

    // 4. SEND RESULT BACK TO SIDE PANEL
    chrome.runtime.sendMessage({
        action: "ELEMENT_SELECTED",
        selector: selector
    }).catch(err => console.error("Could not send selector back to Side Panel:", err));
};

// 3. Start/Stop Logic
const startPickMode = () => {
    if (isPickingElement) return;

    removeHighlight();
    isPickingElement = true;

    // Use class for more robust cursor change (requires CSS setup)
    document.body.classList.add('picker-active-cursor');

    // Attach CAPTURE-PHASE listeners to intercept events before the page uses them
    document.addEventListener('mouseover', hoverListener, true);
    document.addEventListener('click', clickListener, true);
    console.log('[Picker] Element picking mode STARTED. Cursor should be crosshair.');
};

const stopPickMode = () => {
    isPickingElement = false;

    // Remove cursor class
    document.body.classList.remove('picker-active-cursor');

    document.removeEventListener('mouseover', hoverListener, true);
    document.removeEventListener('click', clickListener, true);
    removeHighlight();

    // Clean up any lingering hover highlights
    document.querySelectorAll('.element-picker-hover').forEach(el => {
        el.classList.remove('element-picker-hover');
    });
    console.log('[Picker] Element picking STOPPED.');
};


// --- Message Listener (Content Script Entry Point) ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Picker] Message received:', message.action);

    if (message.action === "START_ELEMENT_PICKER") {
        startPickMode();
        sendResponse({ success: true });
        // Return true to indicate we will send an asynchronous response
        return true;
    }

    if (message.action === "ABORT_PICKER") {
        stopPickMode();
        sendResponse({ success: true });
        return true;
    }
});