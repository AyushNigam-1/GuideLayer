const startButton = document.getElementById('startTour');
const statusDiv = document.getElementById('status');

startButton.addEventListener('click', async () => {
    startButton.disabled = true;
    statusDiv.textContent = 'Checking tab...';

    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url || !tab.url.startsWith('https://chatgpt.com/')) {
            statusDiv.textContent = 'Please open ChatGPT.com first!';
            startButton.disabled = false;
            return;
        }

        statusDiv.textContent = 'Injecting tour...';

        // Send message to background for injection
        const response = await chrome.runtime.sendMessage({ action: 'startTour' });

        if (response && response.success) {
            statusDiv.textContent = 'Tour started! 🎉';
            startButton.textContent = 'Tour Active';
            startButton.disabled = true;
        } else {
            const errorMsg = response?.error || 'Failed to start tour. Check console.';
            statusDiv.textContent = errorMsg;
            startButton.disabled = false;
        }
    } catch (error) {
        statusDiv.textContent = 'Error: ' + error.message;
        startButton.disabled = false;
    }
});