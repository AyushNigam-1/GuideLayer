console.log('[Shepherd Injector] Script has been injected into the page.');

const checkElement = () => {
  const inputBox = document.querySelector('textarea');
  if (!inputBox) {
    console.log('[Shepherd Injector] Waiting for input box...');
    setTimeout(checkElement, 1000);
    return;
  }

  console.log('[Shepherd Injector] Found input box. Starting Shepherd tour...');

  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      scrollTo: true,
      cancelIcon: { enabled: true }
    }
  });

  tour.addStep({
    id: 'chatgpt-input',
    text: 'This is the input box. Type your prompt here.',
    attachTo: {
      element: 'textarea',
      on: 'top'
    },
    buttons: [
      { text: 'Next', action: tour.next }
    ]
  });

  tour.start();
};

checkElement();
