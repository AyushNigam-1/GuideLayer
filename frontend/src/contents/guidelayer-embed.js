// guidelayer-embed.js
(function () {
    const scriptTag = document.currentScript;
    if (!scriptTag) return;

    const courseId = scriptTag.getAttribute('data-course-id');
    if (!courseId) {
        console.error("[GuideLayer] No course ID provided.");
        return;
    }

    const ThemeManager = {
        currentTheme: null,
        init() {
            this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.mediaQuery.addEventListener('change', (e) => this.applyTheme(e.matches ? 'dark' : 'light'));
            this.observer = new MutationObserver(() => this.autoDetect());
            this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            this.autoDetect();
        },
        autoDetect() {
            const isDark = document.documentElement.classList.contains('dark') || this.mediaQuery.matches;
            const newTheme = isDark ? 'dark' : 'light';
            if (this.currentTheme === newTheme) return;
            this.applyTheme(newTheme);
        },
        applyTheme(theme) {
            this.currentTheme = theme;
            const body = document.body;
            if (!body) return;
            body.classList.remove('guidelayer-theme-dark', 'guidelayer-theme-light');
            body.classList.add(theme === 'dark' ? 'guidelayer-theme-dark' : 'guidelayer-theme-light');
        }
    };
    ThemeManager.init();

    window.GuideLayer = {
        setTheme: (theme) => ThemeManager.applyTheme(theme),
        start: () => initGuideLayer()
    };

    const injectCSS = (href) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    };

    injectCSS('https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.css');
    injectCSS('https://cdn.jsdelivr.net/gh/AyushNigam-1/GuideLayer@master/frontend/css/theme.css');

    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    };

    /* ---------------- STATE MANAGEMENT ---------------- */
    const STORAGE_KEY = "GUIDELAYER_TOUR_STATE";
    const getTourState = () => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
    };
    const saveTourState = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const clearTourState = () => localStorage.removeItem(STORAGE_KEY);

    let driverObj = null;

    /* ---------------- HTML FORMATTER ---------------- */
    const html = (text, filename, audioFilename) => {
        const BASE_URL = 'https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images';
        let visualHtml = '';
        let audioHtml = '';

        if (filename) {
            const visualUrl = `${BASE_URL}/${filename}`;
            const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(filename);

            if (isVideo) {
                visualHtml = `
                <div class="driver-media-wrapper">
                    <video controls class="driver-media-element" style="width: 100%;">
                        <source src="${visualUrl}">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
            } else {
                visualHtml = `
                <div class="driver-media-wrapper">
                    <img src="${visualUrl}" alt="Step Media" class="driver-media-element" />
                </div>
            `;
            }
        }

        if (audioFilename) {
            const audioUrl = `${BASE_URL}/${audioFilename}`;
            audioHtml = `
           <div class="driver-audio-wrapper">
                <audio controls class="driver-audio-element">
                    <source src="${audioUrl}">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `;
        }

        return `
        <div class="driver-custom-body">
            <button class="driver-close-btn" aria-label="Close tour">×</button>
            ${visualHtml}
            ${audioHtml}
            <div class="driver-custom-text">
                ${text}
            </div>
        </div>
    `;
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
            setTimeout(() => { observer.disconnect(); reject(new Error(`Element ${selector} not found within ${timeout}ms`)); }, timeout);
        });
    };

    /* ---------------- INPUT & CLICK HANDLERS ---------------- */
    const setupInputRequiredHandler = (element, expectedText, currentIndex, steps, cId) => {
        const inputHandler = (e) => {
            if (e.target.value === expectedText) {
                console.log("[GuideLayer] Input matched! Moving to next step...");
                element.style.borderColor = "#4ade80";
                element.style.transition = "border-color 0.3s ease";

                const nextIndex = currentIndex + 1;
                if (nextIndex < steps.length) {
                    saveTourState({ courseId: cId, nextIndex, steps, isPendingResume: false });
                }

                element.removeEventListener("input", inputHandler);

                setTimeout(() => {
                    if (nextIndex >= steps.length) { driverObj?.destroy(); clearTourState(); }
                    else { driverObj?.moveNext(); }
                }, 500);
            }
        };

        if (element.value === expectedText) {
            inputHandler({ target: element });
        } else {
            element.addEventListener("input", inputHandler);
        }
    };

    const setupClickRequiredHandler = (element, currentIndex, steps, cId) => {
        const clickHandler = () => {
            const nextIndex = currentIndex + 1;
            if (nextIndex >= steps.length) {
                clearTourState();
                driverObj?.destroy();
                return;
            }
            console.log("[GuideLayer] Click detected. Saving state for Step:", nextIndex);
            saveTourState({ courseId: cId, nextIndex, steps, isPendingResume: true });
            driverObj?.destroy();

            // SPA Resume delay
            setTimeout(() => {
                const state = getTourState();
                if (state && state.isPendingResume) {
                    startOrResumeTour(state.steps, state.nextIndex, state.courseId);
                }
            }, 2000);
        };
        element.addEventListener("click", clickHandler, { once: true, capture: true });
    };

    /* ---------------- CORE ENGINE ---------------- */
    const startOrResumeTour = async (steps, startIndex = 0, cId) => {
        if (!window.driver || !window.driver.js) {
            console.error("[GuideLayer] driver.js not loaded");
            return;
        }

        const driverSteps = steps.map((step, index) => {
            const isFirstStep = index === 0;
            const isLastStep = index === steps.length - 1;
            const isActionRequired = step.click_required || step.input_required;
            const classList = [];

            // FIX: Hidden previous button on first step
            let visibleButtons = ["next", "previous"];
            if (isFirstStep) {
                visibleButtons = ["next"];
                classList.push("driver-popover-first-step");
            }

            if (isLastStep) classList.push("driver-popover-last-step");
            if (isActionRequired) classList.push("driver-step-action-required");

            return {
                element: step.element,
                popover: {
                    title: `Step ${step.order_index + 1}`,
                    description: html(step.text, step.file, step.audio),
                    side: step.on || "bottom",
                    align: 'start',
                    popoverClass: classList.join(" "),
                    doneBtnText: isLastStep ? "Done" : "Next",
                    showButtons: visibleButtons,
                    onNextClick: isLastStep
                        ? () => { driverObj?.destroy(); closeTourWithAnimation(); }
                        : () => driverObj?.moveNext()
                },
                // FIX: Attach Event Handlers
                onHighlightStarted: (element) => {
                    if (!element) return;
                    if (step.click_required) {
                        setupClickRequiredHandler(element, index, steps, cId);
                    } else if (step.input_required && step.input) {
                        setupInputRequiredHandler(element, step.input, index, steps, cId);
                    }
                }
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

                // FIX: Disable NEXT button on input/click required steps
                if (popover.wrapper.classList.contains("driver-step-action-required")) {
                    const nextBtn = document.querySelector(".driver-popover-next-btn");
                    if (nextBtn) {
                        nextBtn.classList.add("driver-btn-disabled");
                        nextBtn.setAttribute("disabled", "true");
                    }
                }

                // SAFE THEME DETECTION
                const isHostDark = document.documentElement.classList.contains('dark') ||
                    document.body.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isHostDark) popover.wrapper.classList.add('guidelayer-dark-mode');
            },
            onDestroyStarted: () => {
                const state = getTourState();
                if (!state?.isPendingResume) {
                    clearTourState();
                    setTimeout(() => document.getElementById("driver-page-overlay")?.remove(), 100);
                }
            }
        });

        try {
            console.log(`[GuideLayer] Waiting for element: ${steps[startIndex].element}`);
            await waitForElement(steps[startIndex].element);
            driverObj.drive(startIndex);

            const currentState = getTourState();
            if (currentState) saveTourState({ ...currentState, isPendingResume: false });
        } catch (e) {
            console.error("[GuideLayer] Could not find start element:", e);
            clearTourState();
        }
    };

    /* ---------------- AUTO-RESUME LOGIC ---------------- */
    const checkAndResumeTour = () => {
        const state = getTourState();
        // Only resume if it's pending AND it matches the current page's courseId
        if (state && state.isPendingResume && state.courseId === courseId) {
            console.log(`[GuideLayer] Auto-resuming tour ${state.courseId} at step ${state.nextIndex}`);
            loadScript('https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js')
                .then(() => startOrResumeTour(state.steps, state.nextIndex, state.courseId))
                .catch(err => console.error("[GuideLayer] Failed to load driver for resume", err));
        }
    };

    checkAndResumeTour();

    async function initGuideLayer() {
        try {
            await loadScript('https://cdn.jsdelivr.net/npm/driver.js@1.3.1/dist/driver.js.iife.js');

            const SUPABASE_URL = "https://jyvyidejcnalevvtoxeg.supabase.co";
            const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dnlpZGVqY25hbGV2dnRveGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzgzODcsImV4cCI6MjA3ODg1NDM4N30.R4zCOC9jOrAnKibPGhvbmBrZOpuWPBoj_5yQ5Qncm0w";

            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/steps?course_id=eq.${courseId}&order=order_index.asc`,
                { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
            );

            if (!res.ok) throw new Error("Fetch failed");
            const steps = await res.json();

            if (!steps || steps.length === 0) return;

            clearTourState();
            startOrResumeTour(steps, 0, courseId);

        } catch (err) {
            console.error("[GuideLayer] Init error:", err);
        }
    }
})();