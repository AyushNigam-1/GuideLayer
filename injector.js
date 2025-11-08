console.log('[Shepherd Injector] Script has been injected into the page.');

const checkElement = () => {
  // 1. Try the visible contenteditable div (ChatGPT's real input)
  let inputBox = document.querySelector('[data-id="root"] [contenteditable="true"]');

  // 2. Fallback: parent container of the hidden textarea
  if (!inputBox) {
    const hiddenTextarea = document.querySelector('textarea');
    if (hiddenTextarea) {
      inputBox = hiddenTextarea.closest('div.relative') || hiddenTextarea.parentElement;
      console.log('[Shepherd Injector] Using fallback container:', inputBox);
    }
  }

  if (!inputBox || !inputBox.offsetParent) { // offsetParent = visible
    console.log('[Shepherd Injector] Waiting for visible input box...');
    setTimeout(checkElement, 1000);
    return;
  }

  console.log('[Shepherd Injector] Found VISIBLE input box:', inputBox);

  try {
    console.log('[Shepherd Injector] Creating Shepherd tour...');

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        scrollTo: true,
        cancelIcon: { enabled: true },
        classes: 'shepherd-theme-arrows' // optional: better styling
      }
    });

    tour.addStep({
      id: 'chatgpt-input',
      text: 'This is where you type your prompt. Try asking Grok something!',
      attachTo: {
        element: inputBox,
        on: 'top' // or 'bottom' if top is clipped
      },
      buttons: [
        { text: 'Got it!', action: tour.complete }
      ],
      popperOptions: {
        modifiers: [{ name: 'offset', options: { offset: [0, 12] } }]
      }
    });

    console.log('[Shepherd Injector] Tour configured, starting in 500ms...');

    setTimeout(() => {
      try {
        tour.start();
        console.log('[Shepherd Injector] Tour started successfully!');
      } catch (e) {
        console.error('[Shepherd Injector] tour.start() error:', e);
      }
    }, 500);

  } catch (error) {
    console.error('[Shepherd Injector] Tour creation failed:', error);
  }
};

checkElement();