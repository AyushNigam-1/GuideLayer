(function () {
    const scriptTag = document.currentScript;
    if (!scriptTag) return;
    const courseId = scriptTag.getAttribute('data-course-id');
    if (!courseId) return console.error("[GuideLayer] No course ID provided.");

    const ThemeManager = {
        init() {
            // Check system preference
            this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Listen for OS-level theme changes
            this.mediaQuery.addEventListener('change', (e) => this.applyTheme(e.matches ? 'dark' : 'light'));

            // Listen for class changes on the <html> or <body> tags (e.g., Tailwind's 'dark' class)
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        this.autoDetect();
                    }
                });
            });
            this.observer.observe(document.documentElement, { attributes: true });
            this.observer.observe(document.body, { attributes: true });

            // Initial detection
            this.autoDetect();
        },

        autoDetect() {
            const hasDarkClass = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
            const isSystemDark = this.mediaQuery.matches;

            this.applyTheme(hasDarkClass || isSystemDark ? 'dark' : 'light');
        },

        applyTheme(theme) {
            if (theme === 'dark') {
                document.body.classList.add('guidelayer-theme-dark');
                document.body.classList.remove('guidelayer-theme-light');
            } else {
                document.body.classList.add('guidelayer-theme-light');
                document.body.classList.remove('guidelayer-theme-dark');
            }
        }
    };

    window.GuideLayer = {
        setTheme: (theme) => ThemeManager.applyTheme(theme),
        start: () => initGuideLayer() // Allows them to trigger the tour on a button click
    };

    ThemeManager.init();

    const driverCss = document.createElement('link');
    driverCss.rel = 'stylesheet';
    driverCss.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css';
    document.head.appendChild(driverCss);

    const customCss = document.createElement('link');
    customCss.rel = 'stylesheet';
    customCss.href = 'https://your-dashboard-domain.com/pro-theme.css';
    document.head.appendChild(customCss);

    const driverScript = document.createElement('script');
    driverScript.src = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js';

    document.head.appendChild(driverScript);

    const STORAGE_KEY = "GUIDELAYER_TOUR_STATE";

    const clearTourState = () => localStorage.removeItem(STORAGE_KEY);

    let driverObj = null;

    const html = (text, filename) => {
        const BASE_URL = 'https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images';
        let mediaHtml = '';
        if (filename) {
            const mediaUrl = `${BASE_URL}/${filename}`;
            const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(filename);
            mediaHtml = isVideo
                ? `<div class="driver-media-wrapper"><video controls class="driver-media-element"><source src="${mediaUrl}" type="video/mp4"></video></div>`
                : `<div class="driver-media-wrapper"><img src="${mediaUrl}" class="driver-media-element" /></div>`;
        }
        return `<div class="driver-custom-body"><button class="driver-close-btn">×</button>${mediaHtml}<div class="driver-custom-text">${text}</div></div>`;
    };

    const closeTourWithAnimation = () => {
        const popover = document.querySelector(".driver-popover");
        if (popover) {
            popover.classList.add("driver-popover-fade-out");
            setTimeout(() => { driverObj?.destroy(); clearTourState(); }, 300);
        } else {
            driverObj?.destroy(); clearTourState();
        }
    };

    const waitForElement = (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) { observer.disconnect(); resolve(el); }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { observer.disconnect(); reject(); }, timeout);
        });
    };

    const startOrResumeTour = async (steps, startIndex = 0, courseId) => {
        const driverSteps = steps.map((step, index) => {
            const isFirstStep = index === 0;
            const isLastStep = index === steps.length - 1;
            const classList = [];
            let visibleButtons = ["next", "previous"];

            if (isFirstStep) { visibleButtons = ["next"]; classList.push("driver-popover-first-step"); }
            if (isLastStep) classList.push("driver-popover-last-step");
            if (step.click_required || step.input_required) classList.push("driver-step-action-required");

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
                    onNextClick: isLastStep ? () => { driverObj?.destroy(); closeTourWithAnimation(); } : () => driverObj?.moveNext()
                },
            };
        });

        driverObj = window.driver.js.driver({
            showProgress: false,
            animate: true,
            disableActiveInteraction: false,
            allowClose: false,
            steps: driverSteps,
            onPopoverRender: (popover) => {
                const closeBtn = document.querySelector(".driver-close-btn");
                if (closeBtn) closeBtn.addEventListener("click", closeTourWithAnimation);
            }
        });

        try {
            await waitForElement(steps[startIndex].element);
            driverObj.drive(startIndex);
        } catch (e) {
            console.error("Could not find start element:", e);
            clearTourState();
        }
    };

    async function initGuideLayer() {
        try {
            const SUPABASE_URL = "https://jyvyidejcnalevvtoxeg.supabase.co";
            const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

            const response = await fetch(`${SUPABASE_URL}/rest/v1/steps?course_id=eq.${courseId}&order=order_index.asc`, {
                headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
            });

            if (!response.ok) throw new Error("Failed to fetch tour steps");
            const steps = await response.json();

            if (steps && steps.length > 0) {
                clearTourState();
                startOrResumeTour(steps, 0, courseId);
            }
        } catch (error) {
            console.error("[GuideLayer] Error initializing tour:", error);
        }
    }
})();