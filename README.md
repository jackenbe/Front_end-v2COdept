# CodePT: AI-Powered Code Editor and Tutor

CodePT is a single-page, real-time code editing and AI tutoring environment. It allows users to write, save, and execute code snippets while receiving contextual advice, hints, and code improvements from a dedicated AI assistant based on the code they are currently working on.

## ✨ Key Features

* **Persistent Code Storage:** Scripts are saved to a Django backend (and implicitly, a database) via REST API endpoints (`/api/create-script/` and `/api/update/`).

* **Real-time Code Execution:** Code can be run directly from the editor using an external execution service (Piston API).

* **Integrated AI Chat:** A dedicated AI Tutor Assistant provides immediate, context-aware feedback on the current code snippet.

* **Responsive UI:** Built with React and Tailwind CSS for a modern, clean, and fully responsive user experience across desktop and mobile devices.

* **Smart Chat Flow:** Automatically creates and saves a new script upon the first message sent, ensuring chat history persistence.

* **Markdown Parsing:** AI responses, which are structured using markdown (headers, lists, code blocks), are parsed and rendered cleanly in the chat interface.

## 🛠️ Technology Stack

This project is primarily a **React Frontend** application that relies heavily on a Python/Django Backend for persistence and AI logic.

| Category | Technology | Purpose |
| ----- | ----- | ----- |
| **Frontend** | React, Functional Components, Hooks | Building the component-based UI and state management. |
| **Styling** | Tailwind CSS | Utility-first CSS framework for rapid, responsive design. |
| **Routing** | `react-router-dom` | Managing dynamic routes for individual scripts (`/script/:id`). |
| **API Client** | `axios` | Handling all HTTP requests to the Django backend and external services. |
| **Code Execution** | Piston API (`emkc.org`) | External service used to securely execute user code. |
| **Backend API** | Django / Django REST Framework (DRF) | (External to this README) Provides authentication, database persistence, and hosts the Gemini AI logic. |

## 🚀 Setup and Installation

This repository contains the frontend code. To run the full application, you must have the corresponding Django backend running and accessible on the same origin (or with proper CORS configuration).

### Prerequisites

* Node.js and npm (or yarn)

* A running Django backend API instance (assumed to be on the same host).

### Frontend Setup

1. **Clone the repository (or extract the file into your project):**

   ```bash
   git clone [your-repo-link]
   cd codept-frontend
Install dependencies:
(If using a full React project structure)

Bash

npm install
# or
yarn install
Ensure Axios Base URL:
The current code uses relative paths (e.g., /api/ai-advice/). Ensure your development proxy (if using one) or host configuration correctly directs these requests to your running Django backend.

Run the application:

Bash

npm start
# or
yarn start
💻 Usage
The CodePT editor is designed for a seamless development and learning workflow.

Code Editor
Write Code: Enter your code in the large code editor pane (default language is Python).

Change Language: Select your desired programming language (Python, JavaScript, Java, etc.) from the dropdown menu in the top right.

Standard Input: Use the Standard Input (stdin) text area to provide inputs for your running code.

Run Code: Click the "Run Code" button to execute the code and view the results in the Execution Output area.

Script Persistence
Create: If you are on the /script/new path, clicking "Create Script" will save your code and generate a unique URL, automatically navigating you to the new script ID.

Save: If you are editing an existing script, the button changes to "Save Changes".

Rename: Click the script name at the top to quickly edit the title.

AI Tutor Assistant
The AI Chat is context-aware and uses your currently displayed code, language selection, and previous chat history.

Start Chat: If you are working on an unsaved script, you must click "Create Script" (or "Save Changes") before the chat input becomes active.

Ask for Advice: Type a question (e.g., "How can I optimize this loop?", "Why is this code failing?") and click "Send".

Review Response: The AI provides a structured response including:

Explanation: A breakdown of your code or answer to your question.

Hints: Specific suggestions for improvement.

Improvements: Example code or direct fixes.

Skill Level: A dynamically calculated skill level for the current language.
