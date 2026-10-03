# Audio-First Language Learning App — Build Plan

Oct 3, 2026 · @Artur

The plan builds a working voice loop first, then adds memory, then scheduling, then placement, so every phase ends with something you can talk to.

## Approach

The riskiest part is the live voice loop, so it gets built and tested first. Everything else depends on it working well.

- **Talk before you track.** A session you can hold, with transcripts, comes before any learner history.
- **Log raw, interpret later.** Store transcripts and tool events from day one, even before the analyst exists. Every later phase can be tested by replaying real sessions.
- **Placement comes after practice.** Placement reuses the session machinery, so it is cheaper to build last. Until then, new learners self-report a level.
- **Off-the-shelf where proven.** Use an FSRS library unmodified, official Docker images (MongoDB, nginx), and the Live API's built-in transcription and session resumption.
- **Screen-on only.** No background-audio work in this plan.

## Roadmap

&#91;embedded content: Build roadmap · 6 phases, each with an exit gate\]

Each phase starts only when the previous gate passes. No dates are set yet; Phase 1 carries the most risk and deserves the most time.

## Phase tasks

### Phase 0 — Foundation

- [x] Create the repo (`frontend/`, `api/`, `docker-compose.yml`, `.env.example`) and connect it to the AI Studio project
- [x] Write Dockerfiles: `frontend` (build, then serve with nginx and proxy `/api`) and `api`; use the official `mongo` image for `db`
- [x] Write `docker-compose.yml` with a named volume for MongoDB and only the frontend port exposed
- [x] Put the Gemini key and session secret in a git-ignored `.env`; commit `.env.example`
- [x] Backend auth: sign-up, login, logout, hashed passwords, httpOnly session cookie
- [x] Every API route checks the session and filters data by `userId`
- [x] Build the login screen and an empty dashboard
- [x] Set up hot reload for development (mounted source folders or a `docker-compose.override.yml`)

**Gate:** a fresh clone starts with one docker compose up, and a user can sign up, log in, and see their dashboard.

### Phase 1 — Voice loop

- [x] Backend endpoint: check the login session, return an ephemeral Live API token
- [x] Language picker on the dashboard (native and target), saved as profile defaults
- [x] Open a Live session from the browser with gemini-3.8-live; mic capture and audio playback
- [x] Hand-written system instruction: two languages, switching rule, a fixed CEFR level, a topic
- [x] Show input and output transcripts live, labeled by speaker
- [x] Save each session's transcript to MongoDB at the end
- [x] Handle session resumption and context compression; test a 20-minute session

**Gate:** a 20-minute conversation runs without breaking, native-language questions are answered in the native language, and the transcript is saved.

### Phase 2 — Memory

- [x] Create the MongoDB collections and indexes from the overview's data model
- [x] Define agent tools: `log_item_event` and `log_error`; store calls in `session.toolEvents`
- [x] Build the analyst: transcript + plan + tool events in, validated JSON out
- [x] Write analyst output to items, topics, and notes
- [x] Build the planner: profile + history in, plan + system instruction out
- [x] Session summary on the dashboard
- [x] Self-reported level on first login as a stopgap for placement

**Gate:** session two clearly builds on session one: it reuses earlier vocabulary and addresses a logged weak spot.

### Phase 3 — Spaced repetition

- [x] Add an FSRS library; create recognition cards when items are introduced
- [x] Map analyst outcomes to FSRS grades using the overview's grading table
- [x] Enforce one graded review per item, per skill, per session
- [x] Graduation rule: two Good-or-better recognition reviews in separate sessions create a production card
- [x] Planner selects due items and new items within session and daily caps
- [x] Session-length picker (5 / 10 / 15 / 20 min); agent offers to wrap up or continue at the goal
- [x] Free-conversation mode: no planned new items, unplanned words logged as candidates

**Gate:** over a week of daily use, due items reappear on schedule and new items stay under the daily cap.

### Phase 4 — Placement

- [x] Placement system instruction following the OPI phases: self-report, warm-up, level checks, probes, wind-down
- [x] Task ladder per CEFR level (A1 to C1) in the instruction
- [x] Agent tool `log_level_signal(level, sustained | breakdown)`
- [x] Analyst variant that outputs a CEFR level, confidence, and starter items
- [x] Confidence rises over the first three practice sessions; level can adjust

**Gate:** testers of known levels are placed within one CEFR level of their real level.

### Phase 5 — Polish

- [x] Learner-facing settings: speech rate, native-language support amount, interests
- [x] Error and retry handling for dropped connections and failed analyst runs
- [x] Cost and latency monitoring per session
- [x] Backup script (`mongodump`) and a tested restore
- [x] HTTPS reverse proxy (e.g. Caddy) so phones on the local network can use the mic
- [x] Small pilot with real learners

## Testing and evaluation

The AI parts need checks beyond normal unit tests, because their output varies run to run.

| Part | What to check | How |
| --- | --- | --- |
| Voice agent | Stays at the learner's level; switches languages correctly; weaves in planned items | Scripted test conversations at A1, B1, and C1; count planned items actually used |
| Error logging | Catches errors the transcript hides | Speak known mistakes on purpose; compare tool events against what was said |
| Analyst | Correct grades and skill tags | A small set of saved sessions with hand-labeled answers; rerun after every prompt change |
| Planner | Respects caps; picks due items; matches level | Unit tests on plan JSON against fixture learner data |
| FSRS integration | Grades map correctly; one review per item per skill per session | Ordinary unit tests |
| Placement | Places testers within one level | Testers with known CEFR certificates or teacher assessments |
| Session limits | Long sessions survive reconnects | 20- and 30-minute soak tests |
| Local stack | Starts from a clean clone; data survives restarts | docker compose up on a clean machine; docker compose down and up, then confirm learner data is still there |

Save the hand-labeled sessions in the repo as fixtures. They become the regression suite for every prompt change.

## Open questions

- [ ] Which target and native languages ship first? This sets the test languages and CEFR item lists.
- [ ] Backend language: Node.js (TypeScript) or Python (FastAPI)? Decide in Phase 0; both have an FSRS library.
- [ ] What are the current Live API session duration and context limits for gemini-3.8-live? Confirm before Phase 1.
- [ ] Should the analyst also receive session audio, or are tool events plus transcript enough? Decide after Phase 2 testing.
- [ ] Where do starter vocabulary lists per CEFR level come from? Options: an open CEFR-tagged list, or generated by the planner.
- [ ] Exact new-item caps (proposed: 1 per 4 minutes, max 5 per session, 10–15 per day). Tune during Phase 3.
- [ ] When to run the FSRS parameter optimizer per learner (proposed: after a few hundred reviews).
- [ ] Where will the containers eventually be hosted for other users? Not needed until after the pilot.
- [ ] Pricing model and per-session cost ceiling, once Phase 5 monitoring shows real costs.
