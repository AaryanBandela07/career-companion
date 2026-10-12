# AI Career & Learning Companion

> Discover your path. Build your skills. Achieve your future.

A personalized career-coaching web app. Choose a dream job, tell the app which skills you already have, and it shows your skill gap, builds a phased learning roadmap, assigns practice tasks with quizzes, and tracks your weekly progress. It runs in the browser and can be packaged as an Android app.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3-000000?logo=flask&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)

## Table of contents

- [Features](#features)
- [Feature status](#feature-status)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Building the Android app](#building-the-android-app)
- [How data is stored](#how-data-is-stored)
- [Offline-first design](#offline-first-design)
- [Design system](#design-system)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)

## Features

The app has nine pages:

| Page | What it does |
|---|---|
| **Login / Sign up** | Email or username with password. Includes a one-click **Demo Mode** that loads a sample Data Analyst profile. |
| **Onboarding** | Step 1: pick a dream job (or type any custom role). Step 2: select the skills you already have from categorized tiles, or add your own. |
| **Dashboard** | Time-of-day greeting, motivational quote, six stat cards (goal, progress, skills completed, skill gap, certificates, weekly hours), a Foundation → Intermediate → Advanced → Job Ready progress level, your next recommended skill, and quick links. |
| **Profile** | Emoji avatar picker or photo upload, your current skills, and the skills your target job requires. |
| **Career Roadmap** | Five phases (Foundation → Core Skills → Applied Projects → Advanced Skills → Career Ready) with expandable skills showing why each matters, an estimated duration, and a recommended resource type. Skills can be marked complete. |
| **Assignments** | One task card per skill with **Easy / Medium / Hard** variants. Each opens a 5-question multiple-choice quiz; scoring 60% or more marks it Completed. |
| **Weekly Analytics** | Charts for weekly learning hours, quiz accuracy, a skill radar, and assignment completion, built with Recharts. |
| **AI Chatbot** | Chat interface with suggested prompts, photo upload, and certificate upload. Aware of your dream job and skills. |
| **Certificates** | Upload a certificate (JPG, PNG, WEBP, or PDF) to see detected skills, related career roles, and which skills you still need for your target job. |
| **Resources** | Recommended resource types per skill gap. |
| **Settings** | Edit your display name, notification preferences, and log out. |

**Supported careers:** Software Developer, Data Analyst, AI Engineer, Cybersecurity Analyst, Cloud Engineer, UI/UX Designer, Business Analyst, Data Scientist. Any other role can be typed in during onboarding.

## Feature status

The app currently works fully **offline, without calling an AI model**. The Claude integration exists on the backend but is not yet connected to the interface.

| Feature | How it works today |
|---|---|
| Skill gap, readiness %, roadmap | Real logic based on built-in skill lists for the eight careers above |
| Accounts and progress | Saved to SQLite when the backend is reachable, otherwise to browser `localStorage` |
| Chatbot | Pre-written replies chosen by keyword matching against your profile |
| Certificate and photo analysis | Skills and roles inferred by matching the **file name** against a 14-category keyword knowledge base (Python, ML, cloud, cybersecurity, and more). The image or PDF content is not read. |
| Quizzes | A shuffled local bank of generic questions, 5 per attempt |
| Analytics | Weekly hours come from the profile; quiz-accuracy, assignment-completion and summary figures are sample data |
| Claude API proxy | Implemented in `backend/app.py` (`POST /api/claude/message`), not yet used by the frontend |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 4 |
| Charts and icons | Recharts, Lucide React |
| Backend | Python, Flask, flask-cors, SQLite |
| AI (backend proxy, not yet wired up) | Anthropic Claude API, model set by `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`) |
| Android | Capacitor 8 (main), Flutter WebView wrapper (optional) |
| Fonts | Fraunces and Plus Jakarta Sans (Google Fonts) |

## Project structure

```
career-companion/
├── src/
│   ├── AICareerCompanion.jsx   Entire frontend: all pages and logic in one file
│   ├── main.jsx
│   └── index.css
├── backend/
│   ├── app.py                  Flask server: SQLite key-value store + Claude proxy
│   ├── requirements.txt
│   └── .env.example            Copy to .env and add your API key
├── android/                    Capacitor Android project
├── my_app/                     Optional Flutter WebView wrapper
├── capacitor.config.json
├── vite.config.js
└── package.json
```

The backend does two things:

1. **Persists data**: a SQLite key-value table (`kv_store`) holds accounts, profiles, and progress.
2. **Proxies Claude API calls**: the real `ANTHROPIC_API_KEY` stays on the server and is never sent to the browser.

## Getting started

**Requirements:** Node.js 18+ and Python 3.10+.

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
copy .env.example .env         # Windows (use cp on macOS / Linux)
python app.py
```

It runs on **http://localhost:5000** and creates `backend/storage.db` on first run. Add your key to `backend/.env` only if you plan to use the Claude proxy:

```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6
PORT=5000
```

### 2. Frontend

In a second terminal, from the project root:

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. During development, Vite forwards `/api/...` requests to the Flask server, so no CORS setup is needed.

## Building the Android app

### Option A: Capacitor (recommended)

Requires Android Studio and the Android SDK.

```bash
npm install
npm run cap:sync       # build the web app and sync it into android/
npm run cap:build      # also assemble a debug APK (Windows)
```

The APK is created under `android/app/build/outputs/apk/debug/`. You can also open `android/` in Android Studio and run it from there.

### Option B: Flutter WebView wrapper

`my_app/` is a small Flutter app with no screens of its own. It serves the built React site from a local HTTP server inside the app and shows it in a WebView.

```bash
npm run build
# copy the contents of dist/ into my_app/assets/web/
cd my_app
flutter pub get
flutter run            # or: flutter build apk
```

You only need one of the two options.

## How data is stored

- **Backend reachable (desktop development):** accounts and profiles are stored in SQLite through the `/api/storage/...` endpoints.
- **Backend not reachable (mobile app):** the app falls back to the browser's `localStorage`, so data stays on the device.

## Offline-first design

The app is built to work with no backend and no API key:

- Certificate and photo analysis use local keyword matching.
- Quizzes use a local question bank.
- Storage falls back to `localStorage`.
- A `backendAvailable()` probe runs once per page load and caches its result, so individual reads and writes don't each pay for a failed request.

## Design system

| | |
|---|---|
| **Colors** | Violet `#7C3AED`, Emerald `#10B981`, Amber `#F59E0B`, Sky `#38BDF8` |
| **Background** | Animated watercolor wash (blush, peach, sage, cream) with floating radial blobs |
| **Cards** | Glassmorphism: `rgba(255,255,255,0.72)` with backdrop blur |
| **Typography** | Fraunces (display serif) and Plus Jakarta Sans (body) |
| **Layout** | Collapsible desktop sidebar, mobile bottom navigation, and a hamburger drawer |

## Known limitations

- **Passwords are stored in plain text.** Fine for a local demo, not for real users. Hash them (for example with `werkzeug.security.generate_password_hash`) and add authentication before any public deployment.
- **Backend detection mismatch:** the frontend probes `/api/ping`, but the backend exposes `/api/health`, so the app may use `localStorage` even when the backend is running.
- **Development-only server settings:** `app.py` runs with `debug=True` on `0.0.0.0` with open CORS. Change these before deploying.
- **Flutter wrapper:** its local server picks a random port on each launch, so saved data may not persist between launches. Use the Capacitor build if persistence matters.

## Roadmap

- [ ] Connect the chatbot, quiz generation, and certificate reading to Claude through the backend proxy
- [ ] Hash passwords and add real authentication
- [ ] Replace sample analytics with tracked data
- [ ] Feed quiz results back into skills and the roadmap
- [ ] Add a skill-gap table with have / improve / missing status to the dashboard

## Security note

Never commit `backend/.env`. It holds your real API key and must be listed in `.gitignore`.
