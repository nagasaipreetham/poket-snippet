# Poket Snippet

**Try it out:** [https://poket-snippet.onrender.com/](https://poket-snippet.onrender.com/)

Welcome to **Poket Snippet**, an advanced, AI-powered code snippet and developer productivity platform. Poket Snippet serves as a centralized hub to write, manage, organize, and execute your code right within the browser, integrated with cutting-edge AI and visual tools.

## 🚀 What We Built

Poket Snippet is not just a standard snippet manager. It is a complete lightweight IDE accessible in your browser. Key features include:

- **Smart Code Management:** Organize your code using folders, snippets, favorites, and miscellaneous tags with an intuitive file system interface.
- **Compiler:** Integrated Monaco Editor (the same tech behind VS Code) with syntax highlighting, autocomplete, and theme support across 35+ programming languages.
- **AI-Powered Coding Assistant:** 
  - **Auto-Complete:** Get instant AI-driven code completion and suggestion based on your current snippet.
  - **Code Converter:** Instantly translate working code from one programming language to another using our robust AI engine.
- **In-Browser Execution:** Compile and run your code on the fly. View real-time terminal output, error logs, and execution time directly from the bottom panel.
- **Pocket Canvas:** A fully integrated whiteboarding functionality (powered by Excalidraw) directly in your workspace. Build flowcharts, system architecture diagrams, and sketch out algorithms while you code.
- **Leetcode Recommendations:** Access tailored algorithmic challenges to hone your problem-solving skills without leaving the environment.
- **Authentication & Secure Storage:** Personalized accounts, secure credential management (JWT), and persistent cloud storage (MongoDB).

---

## 🛠️ Tech Stack & Technologies

We have leveraged a modern and scalable stack to ensure high performance and an exceptional developer experience:

### Frontend
- **React (v19) & Vite:** Ultra-fast development server, optimized builds, and a responsive component-based UI architecture.
- **Tailwind CSS:** For rapid, utility-first UI styling with custom dark-mode aesthetics.
- **Framer Motion:** High-performance, declarative animations to provide a dynamic and fluid user experience.
- **Monaco Editor:** Industry-standard code editor implementation (`@monaco-editor/react`).
- **Excalidraw:** Embedded drawing, whiteboarding, and flowcharting.
- **State Management:** Utilized **Jotai** for lightweight, decentralized state control (e.g., FileSystem logic, Editor state).
- **Routing:** React Router v7 (`react-router-dom`) with lazy loading for optimized code splitting.
- **Radix UI:** For accessible, unstyled UI primitives.

### Backend & API Integrations
- **Node.js & Express:** Scalable runtime environment and RESTful API architecture.
- **MongoDB & Mongoose:** NoSQL database for flexible data schemas, storing user profiles, code snippets, folders, and canvas data.
- **NVIDIA Qwen API (`integrations.api.nvidia.com`):** Serving high-performance LLMs (`qwen2.5-coder-32b-instruct`) for powerful AI Auto-Completion and Code Translation.
- **Cloudflare R2 (via `@aws-sdk/client-s3`):** Secure, cost-effective, and scalable object storage for large static assets and user data.
- **Authentication:** JWT (JSON Web Tokens) for secure, stateless session handling.
