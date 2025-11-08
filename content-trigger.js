// content-trigger.js – Loads on ChatGPT pages, waits for manual trigger
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startTour') {
        try {
            console.log('[Shepherd Injector] Trigger received in content script.');

            // --------------------------------------------------------------
            // 1. Load Shepherd CSS (non-blocking, with success/failure logs)
            // --------------------------------------------------------------
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = chrome.runtime.getURL('lib/shepherd.min.css');
            console.log('[Shepherd Injector] CSS URL:', cssLink.href);
            cssLink.onload = () => console.log('[Shepherd Injector] CSS loaded successfully');
            cssLink.onerror = (err) => {
                console.error('[Shepherd Injector] CSS load failed:', err);
                // (optional) fallback: fetch the CSS text and inject it as <style>
            };
            document.head.appendChild(cssLink);

            // --------------------------------------------------------------
            // 2. Load Shepherd JS, then the tour injector
            // --------------------------------------------------------------
            const shepherdScript = document.createElement('script');
            shepherdScript.src = chrome.runtime.getURL('lib/shepherd.min.js');
            shepherdScript.onload = () => {
                console.log('[Shepherd Injector] Shepherd loaded, injecting tour...');

                const tourScript = document.createElement('script');
                tourScript.src = chrome.runtime.getURL('injector.js');
                document.head.appendChild(tourScript);
            };
            shepherdScript.onerror = (err) => {
                console.error('[Shepherd Injector] Shepherd JS load failed:', err);
                sendResponse({ success: false, error: 'Shepherd JS failed to load' });
            };
            document.head.appendChild(shepherdScript);

            // --------------------------------------------------------------
            // 3. Respond to the popup (still async – true is returned below)
            // --------------------------------------------------------------
            sendResponse({ success: true });

        } catch (error) {
            console.error('[Shepherd Injector] Content injection failed:', error);
            sendResponse({ success: false, error: error.message });
        }

        // Keep the channel open for the async onload events above
        return true;
    }
});