# AI Academi Planner 🎓🤖

An advanced, AI-powered academic planner and study management platform designed to help students optimize their learning, track progress, and take auto-generated exams in a secure environment.

## 🌟 Key Features

*   **🧠 Smart Timetable Generator:** Automatically schedules study units based on subject difficulty, deadlines, and preferred study times (Morning/Evening/Night).
*   **📊 Comprehensive Dashboard & Analytics:** Tracks precise time spent on the platform, focus scores, daily streaks, XP/levels, and visualizes study trends using dynamic charts.
*   **📝 Automated Work & Test Generation:** Upload study notes as **PDFs, Word Documents (.docx), or Images**. The system uses OCR and NLP to process the text and automatically generate interactive multiple-choice exams.
*   **🛡️ AI Anti-Cheating System:** Integrates real-time webcam face and pose detection during tests using TensorFlow.js to enforce academic integrity, issuing warnings and applying automated score penalties for suspicious behavior.
*   **👨‍🏫 Advanced Admin Portal:** Allows administrators to view exact login/logout session logs, precise daily study durations per student, and test performance metrics across the entire platform.
*   **🌙 Modern UI/UX:** Built with React, Tailwind CSS, and Framer Motion for a beautiful, responsive, and interactive experience (including Dark Mode support).

---

## 🛠️ Technology Stack

**Frontend:**
*   React 18
*   TypeScript
*   Vite
*   Tailwind CSS + shadcn/ui
*   Zustand (State Management)
*   Recharts (Data Visualization)
*   TensorFlow.js / MediaPipe (Computer Vision)
*   Tesseract.js / PDF.js / Mammoth (Document Processing)

**Backend:**
*   Node.js
*   Express.js
*   MongoDB + Mongoose
*   JWT (JSON Web Tokens) Authentication
*   Bcrypt (Password Hashing)

---

## 🚀 Installation & Setup Guide

This project is split into two directories: `frontend` and `backend`. You will need to run both concurrently for the application to function.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### Phase 1: Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root of the `backend` directory and add the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_super_secret_jwt_key
   # If you are using an external AI API like Gemini for NLP, add it here:
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the backend server:**
   ```bash
   # For development with auto-reloading (if nodemon is installed in package.json)
   npm run dev
   
   # OR directly via node
   node server.js
   ```
   *The server should now be running on `http://localhost:5000`.*

### Phase 2: Frontend Setup

1. **Open a new terminal window/tab and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root of the `frontend` directory (if you need to override the default API URL):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   *The Vite server will start, typically on `http://localhost:8080`. Click the local link in your terminal to open the app.*

---

## 🔑 Default Access Details

**Student Access:**
You can register a new student account using the `/auth` page on the frontend, or click "Continue as Guest".

**Admin Access:**
To access the Admin Portal metrics, use the hardcoded demo credentials on the Admin Login page:
*   **Username:** `admin`
*   **Password:** `admin@admin`

---

## 📸 Document Upload Notes

When generating tests from notes inside the **Work & Test** tab, the system processes files entirely locally in the browser:
*   **Images:** Uses `tesseract.js` OCR.
*   **Word (.docx):** Uses `mammoth` parser.
*   **PDF (.pdf):** Uses `pdf.js` dynamically injected from a CDN to bypass Vite bundling constraints, ensuring smooth and fast text extraction.
