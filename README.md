
# GuideLayer 🧭
**An enterprise-grade, no-code product tour infrastructure built for modern web applications.**

GuideLayer bridges the gap between complex web platforms and seamless user onboarding. It provides a full-stack infrastructure consisting of a Chrome Extension builder, a secure backend, and a lightweight, framework-agnostic embed script. 

Designed for product teams, it allows non-technical users to build deeply interactive, media-rich product tours directly on top of their live applications without writing a single line of code.

## 🚀 Core Capabilities

* **No-Code Visual Builder:** Construct complex, multi-step tours directly in the browser using an intuitive Chrome Extension overlay.
* **Action-Gated Progression:** Go beyond passive tooltips. GuideLayer can strictly enforce user interaction by requiring a specific DOM click or exact text input before unlocking the next step. 
* **Rich Media Injection:** Natively attach and render high-fidelity media within steps, including Images, GIFs, Videos, and Audio guides.
* **Asynchronous DOM Polling:** Modern SPAs load elements asynchronously. GuideLayer natively observes DOM mutations and waits for target elements to render before attaching tooltips, eliminating race conditions.
* **Universal Compatibility:** A lightweight, vanilla JavaScript embed script ensures flawless integration across React, Vue, Angular, Next.js, or plain HTML.
* **Adaptive Theming:** First-class support for Light and Dark modes. The embed automatically detects host OS/browser preferences or can be explicitly overridden via the Developer API.

## 🛠 Technical Architecture & Stack

GuideLayer is architected for scale, utilizing a decoupled infrastructure:

* **Extension Layer:** Built with **Plasmo** and **React** for a robust, cross-browser extension development experience.
* **Frontend Engine:** **Driver.js** serves as the foundational highlighting engine, heavily extended with custom logic for action-gating, media rendering, and SPA auto-resume capabilities.
* **Backend & Database:** Powered by **Supabase** (PostgreSQL) for relational data storage, Row Level Security (RLS), and Edge Storage for media assets.
* **Authentication:** Secured via **Better Auth** for seamless session management across the extension and the dashboard.
* **API Layer:** **Node.js** & **Express** backend handling secure routing and business logic.
* **Styling:** **Tailwind CSS** integrated deeply into the extension for conflict-free rendering.