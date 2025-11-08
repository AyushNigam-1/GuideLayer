// Polyfill for Chrome/Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTour') {
    browserAPI.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0];
      if (tab.url && tab.url.startsWith('https://chatgpt.com/')) {
        // Send message to content script in the tab
        browserAPI.tabs.sendMessage(tab.id, { action: 'startTour' })
          .then((response) => sendResponse(response || { success: true }))
          .catch((err) => {
            console.error('[Shepherd Injector] Send message failed:', err);
            sendResponse({ success: false, error: err.message });
          });
      } else {
        sendResponse({ success: false, error: 'Not on ChatGPT page' });
      }
    });
    return true; // Async response
  }
});

// Optional: Icon click fallback (sends message directly)
browserAPI.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.startsWith('https://chatgpt.com/')) {
    browserAPI.tabs.sendMessage(tab.id, { action: 'startTour' });
  }
});