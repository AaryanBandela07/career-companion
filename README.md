# AI Career & Learning Companion

A React (Vite + Tailwind) frontend with a Python (Flask) backend.

The backend does two things the browser can't safely do on its own:

1. **Proxies calls to Claude** (`/api/claude/message`) — your real
   Anthropic API key lives only in `backend/.env` and is never sent to
   the browser.
2. **Persists data** (`/api/storage/...`) — a small SQLite key-value
   store that replaces the `window.storage` global the app used when it
   ran only inside Claude.ai. Accounts, profiles, and progress now
   survive page reloads and browser restarts.

## 1. Run the backend

```
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
copy .env.example .env       # Windows — use `cp` on macOS/Linux
```

Open `backend/.env` and paste in a real key from
https://console.anthropic.com/settings/keys:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then start it:

```
python app.py
```

It runs on **http://localhost:5000** and creates `backend/storage.db`
(SQLite) automatically on first run.

## 2. Run the frontend

In a second terminal, from the project root:

```
npm install
npm run dev
```

Open the URL it prints — usually **http://localhost:5173**. During
development, Vite proxies any `/api/...` request straight to the Flask
server on port 5000 (see `vite.config.js`), so no CORS setup is needed.

Both terminals need to stay running (backend on 5000, frontend on 5173)
while you use the app.

## What each feature needs

- **Login / signup, dashboard, roadmap, assignments, quizzes,
  analytics, settings** — work fully once the backend is running,
  since account/profile data is now saved to SQLite via the backend.
- **AI Chatbot, photo analysis, certificate analysis** — need a real,
  valid `ANTHROPIC_API_KEY` in `backend/.env`. Without one, these
  features will show a friendly error instead of a response.

## Project structure

```
career-companion/
├── backend/
│   ├── app.py            Flask app: storage API + Claude proxy
│   ├── requirements.txt
│   ├── .env.example      copy to .env and add your API key
│   └── storage.db         created automatically (SQLite, git-ignored)
├── src/
│   ├── AICareerCompanion.jsx   main app component
│   ├── main.jsx
│   └── index.css
├── vite.config.js
└── package.json
```
