# YelpCamp-Project
    A modern full-stack camping review platform built with TypeScript, the MERN stack. Features secure HttpOnly JWT auth, interactive cluster maps (MapTiler), drag-n-drop uploads (UploadThing), optimistic state management (Zustand), and a cozy Dark/Light theme.
# ⛺ YelpCamp

A modern, full-stack application for sharing and reviewing campgrounds. Built with a focus on security, performance, and a cozy user experience. Based on Colt Steele's YelpCamp but with a completely different stack.

![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)

## ✨ Features

*   **🔐 Robust Security:** HttpOnly Cookie Authentication with JWT (Access + Refresh tokens).
*   **🗺️ Interactive Maps:** Custom Cluster Maps and Geocoding powered by MapTiler.
*   **📸 Media Management:** Drag & drop multi-image uploads via UploadThing.
*   **🌗 Theming:** Responsive UI with persistent "Forest" Dark/Light modes.
*   **⚡ State Management:** Optimistic UI updates using Zustand.
*   **🛡️ Protection:** NoSQL Injection prevention, Rate Limiting, and Author Permissions.

## 🛠️ Tech Stack

*   **Frontend:** React (Vite), Bootstrap 5, Zustand, React Map GL.
*   **Backend:** Node.js, Express 5, Mongoose, Joi Validation.
*   **Services:** MongoDB Atlas, MapTiler, UploadThing.

## 🚀 Getting Started

This project uses **Bun** for fast package management.

### 1. Clone & Install
```bash
git clone https://github.com/Gravyon/YelpCamp-Project

#Open two terminals.
#Terminal 1 (Backend)
#Install dependendecies
cd backend/src
bun i
#Run the backend.
bun run dev (or bun dev)

#Terminal 2 (Frontend)
#Install dependendecies
bun i
#Run the frontend.
cd frontend/src
bun run dev

#Create a .env file in both directories.
#backend
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRY=your_refresh_secret
SECRET=...
UPLOADTHING_TOKEN=...
MAPTILER_KEY=...
NODE_ENV=development
FRONTEND_URL=

#frontend
VITE_MAPTILER_KEY=your_maptiler_key

Visit http://localhost:5173 and start camping! 🏕️
