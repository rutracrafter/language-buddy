# Language Buddy 🎙️

An audio-first (speaking and listening) language learning application powered by the Gemini Live API. Conversational AI adapts every session to the learner's CEFR level, memory, and spaced repetition schedule.

## Quick Start (Production / Docker Compose)

1. **Clone the repository and prepare environment variables:**
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key to `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_PORT=8080 # or 8081 if 8080 is in use
   ```

2. **Start the containers:**
   ```bash
   docker compose up -d
   ```

3. **Open the web application:**
   Visit [http://localhost:8080](http://localhost:8080) (or `http://localhost:8081` if using port 8081).

4. **Stop the containers:**
   ```bash
   docker compose down
   # Note: Never run 'docker compose down -v' on real data to preserve MongoDB volume
   ```

---

## Mobile Experience (PWA / Add to Home Screen)

The web application is built with a responsive, mobile-first design and configured as a standalone **Progressive Web App (PWA)**:

1. **Open on your phone**:
   Connect your phone to the same Wi-Fi network and open `http://<your-computer-ip>:8088` (or use the local HTTPS proxy at `https://<your-computer-ip>:8443` via Caddy).
2. **Add to Home Screen**:
   - **iOS (Safari)**: Tap the **Share** button $\to$ tap **Add to Home Screen** $\to$ tap **Add**.
   - **Android (Chrome)**: Tap the **three dots menu** $\to$ tap **Install app** or **Add to Home screen**.
3. **Launch like a native app**:
   Launches full-screen with its own app icon, without browser navigation bars, with hardware-accelerated audio streaming, Voice Orb, and live transcription.

---

## Architecture & Services

The application consists of the following components:

| Layer | Technology | Port / Platform | Description |
|---|---|---|---|
| `api` | Node.js, Express, TypeScript | Internal (`3000`) | Auth, ephemeral Live tokens, planner/analyst, FSRS scheduling |
| `frontend` | React 19, Vite, Tailwind CSS, Nginx | Exposed (`8088`) | Responsive mobile & desktop UI, Web Audio mic streaming, live transcripts, PWA |
| `db` | MongoDB 7 (`mongo:7`) | Internal (`27017`) | Persistent storage for users, profiles, items, reviews, sessions |

---

## Local Development (Hot Reload)

To develop with live hot-reloading:

1. Copy the override example:
   ```bash
   cp docker-compose.override.yml.example docker-compose.override.yml
   ```
2. Run Docker Compose:
   ```bash
   docker compose up
   ```

Alternatively, run locally without Docker (requires a running MongoDB instance):
- **Backend:** `cd api && npm install && npm run dev` (runs on `http://localhost:3000`)
- **Frontend:** `cd frontend && npm install && npm run dev` (runs on `http://localhost:5173`)

---

## Implementation Roadmap

- [x] **Phase 0 — Foundation**: Docker Compose, MongoDB, TypeScript backend auth (httpOnly cookie, bcrypt), React dashboard & language selector.
- [x] **Phase 1 — Voice Loop**: Ephemeral Live API tokens, Web Audio PCM stream, Gemini 3.8 Live WebSocket connection, real-time transcripts, Acoustic Echo Guard.
- [x] **Phase 2 — Memory**: Collections & indexes, agent tools (`log_item_event`, `log_error`), analyst & planner prompts with Gemini 3.8 Flash, history updates.
- [x] **Phase 3 — Spaced Repetition**: FSRS algorithm integration (`ts-fsrs`), recognition to production graduation, item caps, session-length picker & free conversation mode.
- [x] **Phase 4 — Placement**: ACTFL OPI-style placement interview conversation, task ladder, `log_level_signal`, placement analyst & starter items.
- [x] **Phase 5 — Polish**: Voice settings, Caddy HTTPS proxy for mobile microphone access, backups script (`mongodump` & `mongorestore`).
- [x] **Mobile PWA & Responsive UI**: Mobile-first responsive touch layout, full-screen standalone PWA support, iOS safe-area insets, and drawer transcript controls.
