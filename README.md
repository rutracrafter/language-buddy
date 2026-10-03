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

## Native Mobile App (Expo SDK 57 / React Native)

A native mobile client built with **Expo Router** and **React Native**:

1. **Navigate to the mobile directory and start Expo:**
   ```bash
   cd mobile
   npx expo start
   ```

2. **Run on your device:**
   - **Physical iPhone / Android**: Install the free **Expo Go** app from the App Store / Play Store. Open your camera (iOS) or the Expo Go app (Android) and scan the QR code displayed in your terminal.
   - **iOS Simulator**: Press `i` in the terminal.
   - **Android Emulator**: Press `a` in the terminal.

3. **Connecting to the Backend from a Physical Phone**:
   - In the mobile app's **Settings** tab, update the **Backend Server Address** to your laptop's local Wi-Fi IP (e.g. `http://192.168.1.50:8081`).

---

## Architecture & Services

The application consists of the following components:

| Layer | Technology | Port / Platform | Description |
|---|---|---|---|
| `api` | Node.js, Express, TypeScript | Internal (`3000`) | Auth, ephemeral Live tokens, planner/analyst, FSRS scheduling |
| `frontend` | React 19, Vite, Tailwind CSS, Nginx | Exposed (`8080` / `8081`) | Responsive web dashboard, mic audio & live transcripts |
| `mobile` | Expo SDK 57, Expo Router, React Native | iOS / Android / Web | Native mobile app with Voice Orb, slide-up transcript sheet, and offline-ready FSRS |
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
- **Mobile:** `cd mobile && npx expo start`

---

## Implementation Roadmap

- [x] **Phase 0 — Foundation**: Docker Compose, MongoDB, TypeScript backend auth (httpOnly cookie, bcrypt), React dashboard & language selector.
- [x] **Phase 1 — Voice Loop**: Ephemeral Live API tokens, Web Audio PCM stream, Gemini 3.8 Live WebSocket connection, real-time transcripts, Acoustic Echo Guard.
- [x] **Phase 2 — Memory**: Collections & indexes, agent tools (`log_item_event`, `log_error`), analyst & planner prompts with Gemini 3.8 Flash, history updates.
- [x] **Phase 3 — Spaced Repetition**: FSRS algorithm integration (`ts-fsrs`), recognition to production graduation, item caps, session-length picker & free conversation mode.
- [x] **Phase 4 — Placement**: ACTFL OPI-style placement interview conversation, task ladder, `log_level_signal`, placement analyst & starter items.
- [x] **Phase 5 — Polish**: Voice settings, Caddy HTTPS proxy for mobile microphone access, backups script (`mongodump` & `mongorestore`).
- [x] **Mobile App**: Dedicated Expo SDK 57 / React Native mobile layer with Expo Router, Voice Orb, slide-up transcript sheet, and mobile auth.
