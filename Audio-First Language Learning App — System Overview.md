# Audio-First Language Learning App — System Overview

Oct 3, 2026 · @Artur

## Purpose and goals

The app teaches a language through spoken conversation with an AI voice agent that adapts every session to the learner's level and history. Speaking and listening come first; an on-screen transcript supports reading along.

What makes it different: most conversation apps run the same scripted dialogues for everyone. This app plans each conversation from the learner's own record of covered topics, known vocabulary and grammar, review schedule, and open weak spots.

Goals for the first working version:

- A new learner can log in, finish a short placement conversation, and receive a CEFR level (A1–C2).
- A returning learner can start a session that reviews due items, introduces a few new ones, and stays on a fitting topic.
- The learner can ask a question in their native language, hear the answer in it, and return to the target language without friction.
- Every session updates the learner's history automatically, with no manual input from the learner.
- Live transcripts of both sides appear on screen during the session.

Non-goals for now: background or screen-off audio, native mobile apps, vocabulary import/export, and teacher or social features.

## Core functionality

The app is one basic dashboard plus a live session view. The learner never manages flashcards or lesson lists; the system handles that behind the conversation.

**Login and dashboard.** The backend's own email-and-password login identifies the learner so the right history loads. The dashboard shows the current level, a start button, and the session-length choice.

**Language selection.** Before each session the learner confirms two languages: their native (support) language and the target language. Only these two are passed to the agent. Limiting the options this way reduces wrong-language detection and makes code-switching predictable.

**Placement conversation (new learners).** A 5–10 minute conversation modeled on the ACTFL Oral Proficiency Interview:

1. Self-report: one or two questions about prior study, used as a starting estimate.
2. Warm-up: a greeting in the target language. No comprehension means a fast drop to A1/pre-A1 with native-language support.
3. Level checks: tasks rise in difficulty to find the *floor*, the highest level sustained comfortably.
4. Probes: tasks one level higher to find the *ceiling*, where speech breaks down.
5. Wind-down: an easy topic so the learner ends on a success.

Task ladder: A1 personal information, A2 routines and past events, B1 storytelling and opinions, B2 hypotheticals and arguing a position, C1 abstract topics. Two consistent breakdowns at a level mark the ceiling. The result is stored as a CEFR level with low confidence, refined over the first three practice sessions.

**Practice sessions (returning learners).** Each session has a topic, a goal, and a target length chosen by the learner. The agent weaves due review items and a small number of new items into the conversation. When the goal is met, the agent offers to wrap up or continue in free conversation (see Learning engine).

**Native-language questions.** The learner can ask anything in their native language at any time, such as "what does that word mean?" The agent answers in the native language, then returns to the target language.

**Live transcript.** Both sides of the conversation appear on screen as they happen, labeled by speaker. For this version the screen is assumed to stay on.

**Session summary.** After the session, the dashboard shows what was reviewed, what was new, and one or two things to work on next.

## Tech stack

Everything runs locally in three Docker containers started with Docker Compose. Code is built in Google AI Studio and pushed to a Git repository; the only external service is the Gemini API.

| Layer | Choice | Where it runs | Role |
| --- | --- | --- | --- |
| Build environment | Google AI Studio | Dev tool only | Prototyping and code generation; code pushed to the repo |
| Source control | Git repository (e.g. GitHub) | — | Source of truth, including the compose file |
| Orchestration | Docker Compose | Local machine | One command starts all containers on a shared network |
| Frontend | Web app built to static files, served by nginx | `frontend` container | Dashboard, language picker, mic, audio playback, live transcript; proxies `/api` to the backend |
| Backend API | Node.js (TypeScript) or Python (FastAPI) | `api` container | Auth, ephemeral Live tokens, planner and analyst calls, FSRS updates, database access |
| Database | MongoDB | `db` container, named volume | Profiles, items, reviews, topics, notes, sessions |
| Auth | Built into the backend: passwords hashed with argon2 or bcrypt, httpOnly session cookie | `api` container | Login; identifies whose data to load |
| Voice agent | Gemini Live API, current model gemini-3.8-live | Google (external) | Real-time speech, multilingual switching, transcription, tool calls, custom vocabulary |
| Planner and analyst | Gemini text model with JSON output | Google (external), called by `api` | Session plans before; structured history updates after |
| Scheduling | FSRS library (e.g. ts-fsrs or py-fsrs) | `api` container | Spaced-repetition scheduling, unmodified |

MongoDB keeps the document model from the original NoSQL plan and runs from an official Docker image. A minimal compose file looks like this:

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["8080:80"]      # the only port exposed to the host
    depends_on: [api]
  api:
    build: ./api
    env_file: .env          # GEMINI_API_KEY, SESSION_SECRET, MONGO_URL
    depends_on: [db]
  db:
    image: mongo:8
    volumes: [mongo-data:/data/db]
volumes:
  mongo-data:
```

The Gemini API key lives only in the `api` container's `.env` file, which is git-ignored. The backend checks the session cookie, then mints a short-lived ephemeral token that the browser uses to open the Live session directly. The `api` and `db` containers are reachable only inside the Compose network.

## Architecture

Three roles split the work so no single model has to talk and keep score at the same time.

&#91;embedded content: System architecture · three roles across one session\]

Only the voice agent runs in real time; the planner and analyst are ordinary text-model calls on the backend.

### Session lifecycle

1. **Start.** The learner logs in, confirms native and target languages, and picks a session length.
2. **Plan.** The backend runs the planner on the learner's MongoDB data. The plan lists the topic, goal, due items, new items, and build-on notes.
3. **Connect.** The backend mints an ephemeral token. The browser opens the Live session with the plan as the system instruction and the session's target words as custom vocabulary.
4. **Converse.** The agent talks and calls tools such as `log_item_event(itemId, skill, outcome, evidence)` and `log_error(text, note)`. The browser shows both transcripts and streams them to the backend.
5. **Reconnect if needed.** On a Live API time or context limit, the session resumes using session resumption; the learner should barely notice.
6. **Analyze.** At session end, the analyst reads the plan, transcript, and tool events, and returns structured JSON.
7. **Record.** The backend writes review events, updates FSRS cards, topic depth, notes, and level, then shows the summary.

### System instruction essentials

Every session's instruction states: the learner's native and target languages and that no others will be used; the switching rule (answer native-language questions in the native language, then return); the CEFR level and how to speak at it; the topic, goal, and items to weave in; and when to call each logging tool.

## Data model

MongoDB holds seven collections. Every learner-owned document carries a `userId`, and each collection is indexed on it. Vocabulary and grammar share one `items` collection, so one SRS engine handles both and the vocabulary list is simply a query on `type`.

```typescript
// users — login accounts, managed by the api container
User {
  _id, email,              // unique index on email
  passwordHash,            // argon2 or bcrypt, never the password
  createdAt
}

// profiles — one per user; unique index on userId
LearnerProfile {
  userId,
  nativeLanguage, targetLanguage,          // defaults for the session picker
  level: { overall, speaking, listening }, // CEFR: "A1" … "C2"
  levelConfidence,                         // 0–1; low after placement
  placementCompletedAt,
  interests: string[],
  preferences: { speechRate, nativeLangSupport: "low" | "med" | "high",
                 defaultSessionMinutes }
}

// items — indexes: { userId, "recognition.due" }, { userId, "production.due" }
LearningItem {
  userId,
  type: "vocab" | "phrase" | "grammar",
  text,                    // "la cuenta" or "preterite vs imperfect"
  gloss, cefrLevel, topicTags[],
  firstSeenExample,        // the real sentence from the session
  stage: "recognition" | "production",
  recognition: FsrsCard,   // created when the item is introduced
  production: FsrsCard | null, // created when the item graduates
  createdAt
}

// reviews — append-only log; index: { userId, itemId, at }
ReviewEvent {
  userId, itemId, sessionId,
  skill: "recognition" | "production",
  outcome: "again" | "hard" | "good" | "easy",
  evidence,                // short quote or agent note
  source: "agent_tool" | "analyst",
  at
}

// topics — index: { userId, name }
TopicCoverage {
  userId,
  name,                    // "ordering food"
  cefrLevel,
  depth: 0 | 1 | 2 | 3,    // introduced / practiced / comfortable / mastered
  sessionsCount, lastCoveredAt, notes
}

// notes — index: { userId, status }
BuildOnNote {
  userId,
  kind: "error_pattern" | "next_step" | "interest",
  text,                    // "mixes up ser/estar with emotions"
  priority, status: "open" | "addressed",
  sourceSessionId, createdAt
}

// sessions — index: { userId, startedAt }
Session {
  userId,
  type: "placement" | "practice",
  languages: { native, target },
  targetMinutes, startedAt, endedAt,
  plan,                    // the planner's output, stored as-is
  transcript: [{ speaker, text, lang, at }],
  toolEvents: [...],       // raw tool calls from the agent
  summary, itemsReviewed[], itemsIntroduced[],
  analysisStatus: "pending" | "done" | "failed"
}
```

The `reviews` log is the source of truth for scheduling. Keeping it separate means FSRS parameters can be re-optimized later from real history, and a buggy analyst run can be replayed. MongoDB's 16 MB document limit leaves plenty of room for long transcripts; if sessions ever outgrow it, move transcript lines into a `sessionLines` collection. Only the `api` container talks to the database; every query filters on the logged-in user's `userId`.

## Learning engine

### Levels: CEFR

All levels, items, and topics are tagged A1–C2. This keeps placement, item selection, and future vocabulary import/export on one shared scale.

### FSRS: use the scheduler as-is, adapt the input

Decision: do not modify the FSRS algorithm. Adapt only the layer that turns conversation into review grades.

- **Why not modify it.** FSRS's memory model is fitted on hundreds of millions of real reviews. Hand-tuning its formulas would likely make scheduling worse, and we would have no data to prove otherwise.
- **Personalization is built in.** FSRS has trainable parameters. Start with the library defaults; once a learner has a few hundred logged reviews, run the official optimizer on their `reviews` log.
- **Off-schedule reviews are fine.** Conversation won't hit items exactly on their due date. FSRS already uses actual elapsed time, so early and late reviews are handled correctly.
- **Where we adapt.** The grading rules below, and one rule for incidental use: an item that comes up when not due still gets graded, but at most one graded review per item, per skill, per session. The first meaningful use counts.

### Grading from conversation

| What happened | Skill | Grade |
| --- | --- | --- |
| Learner used the item correctly, unprompted, fluently | Production | Easy |
| Learner used it correctly, unprompted | Production | Good |
| Learner used it after a hint or rephrase | Production | Hard |
| Learner tried and got it wrong, or couldn't produce it | Production | Again |
| Learner responded appropriately when the agent used it | Recognition | Good |
| Learner asked what it meant, or clearly misunderstood | Recognition | Again |

### Recognition and production, kept simple

Each item has one `stage` field and at most two FSRS cards. No other state is tracked.

1. When an item is introduced, it gets a recognition card and `stage: "recognition"`. The agent uses it; the learner just has to understand it.
2. After two Good-or-better recognition reviews in separate sessions, the item graduates: it gets a production card and `stage: "production"`.
3. From then on, the planner schedules it for production (the agent sets up chances for the learner to say it). Recognition reviews still log if they happen, but the planner no longer targets them.

The analyst only answers one question per event: did the learner say it, or hear it? That keeps the tagging reliable.

### Session scope

Decision: every session has a topic, a goal, and a soft time target, but the learner may keep going after the goal is met.

- **Before starting**, the learner picks a length: 5, 10, 15, or 20 minutes. The planner sizes the plan to it.
- **The core segment** delivers the plan: due reviews plus new items, front-loaded so new material lands while the learner is fresh. Roughly 1 new item per 4 minutes, max 5 per session.
- **At the goal**, the agent wraps up the topic and offers to stop or continue.
- **Free conversation** after that introduces no planned new items. It still grades due items that come up, and logs unplanned new words as candidates for future sessions.
- **A daily cap** of about 10–15 new items across all sessions protects the learner from a review backlog. This cap, not session length, is what actually limits SRS load.

This answers the open-ended-session problem: new-item budgets are tied to the planned core, not to how long the learner talks.

## Known constraints and deferred concerns

| Concern | Status | Approach |
| --- | --- | --- |
| Transcripts hide learner errors | Must handle now | Speech-to-text tends to write the correct form, not what was said. The agent hears real audio, so it logs errors via tool calls during the session; the analyst treats those as primary evidence. |
| Live API session limits | Must handle now | Sessions have duration and context limits. Use session resumption and context-window compression; design long sessions as reconnectable segments. Verify current limits in the Live API docs. |
| Wrong-language detection | Handled | The learner picks exactly two languages; the system instruction names them and the switching rule. |
| API key exposure | Handled | Backend-issued ephemeral tokens only; the key sits in a git-ignored .env file. |
| Background / screen-off audio | Deferred | First version assumes the screen stays on. Revisit with a PWA or native wrapper. |
| Vocabulary import/export | Deferred | CEFR tagging keeps this straightforward later. |
| Placement accuracy | Accepted | One short conversation is a rough estimate; confidence rises over the first three sessions. |
| Microphone needs a secure context | Must handle now | Browsers allow mic access on http://localhost. Testing from a phone on the local network needs HTTPS, e.g. a Caddy reverse-proxy container with a local certificate. |
| Local data loss | Must handle now | MongoDB data lives in a named Docker volume that survives container rebuilds. Add a mongodump backup script; never run docker compose down -v on real data. |
| Hosting beyond one machine | Deferred | The same containers can later run on any server or cloud that runs Docker, with HTTPS in front. |
