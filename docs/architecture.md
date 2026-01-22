# Readr — System Architecture

## 1. Architecture Goals
Readr must be:
- **Finite by design** (editions end, sessions end)
- **Calm and deterministic** (no surprise feeds, no auto-expansion)
- **Scalable** (clear separation of UI, API, and background intelligence)
- **Auditable** (AI outputs are bounded and reviewable)

---

## 2. High-Level System Layers

### A) Client Layer (apps/web)
**Next.js (TypeScript)** UI that renders Screen Cards and enforces session boundaries.
- Renders: Welcome, Home, News, End-of-Edition, Extended Edition, Final Completion
- Fetches edition content via API
- Holds **minimal state** (current card index, session completion state)
- **Never runs ingestion or AI**

### B) Product API Layer (apps/api)
**NestJS (TypeScript)** serves user-facing app requests.
- Session state (completed vs active, 12-hour reset)
- Returns the current edition (finite list of cards)
- Provides story details (future)
- Simple, stable endpoints
- No heavy LLM work here (keep API fast + predictable)

### C) Background Intelligence Layer (workers)
Async services that prepare the edition.
- Ingest sources
- Deduplicate stories
- Rank/select finite set for edition
- LLM summarization into News Card structure
- Store finalized edition in DB + cache

---

## 3. Core Data Flow (End-to-End)

1. **Ingestion**
   - Worker pulls from trusted sources (RSS/APIs)
   - Normalizes raw items into a standard “RawStory” format

2. **Deduplication**
   - Remove near-duplicates across sources
   - Store “StoryCluster” with references to original sources

3. **Ranking & Selection**
   - Choose a finite set per category (ex: Top 6–12)
   - Apply “edition rules” (no overload, balanced topics)

4. **Summarization**
   - LLM converts cluster into strict News Card anatomy:
     - Headline
     - What Happened
     - Why It Matters
     - What’s Next (optional)

5. **Edition Assembly**
   - Create an Edition object:
     - metadata (time window, edition id)
     - ordered list of News Cards per category

6. **Serve to User**
   - API returns the Edition
   - UI presents cards in calm, linear flow
   - Completion is enforced (hard stop)

---

## 4. Session & Completion Model (Non-Negotiable)

Readr operates on a **12-hour session reset** model.

### Key rules:
- Once a user completes today’s edition, the app stays in a **completed state** until the session resets.
- No punitive lock: users can open the app, but it should clearly show completion.
- Optional “Extended Edition” exists, but must also end with a hard stop.

### Recommended session record fields:
- `session_id`
- `user_id` (optional early, anonymous supported)
- `window_start`
- `window_end`
- `completed_at`
- `extended_completed_at` (optional)

---

## 5. Data Model (Conceptual)

### Core entities
- **Source**
  - `id`, `name`, `url`, `trust_level`

- **RawStory**
  - `id`, `source_id`, `title`, `url`, `published_at`, `raw_content`, `category`

- **StoryCluster**
  - `id`, `canonical_title`, `category`, `created_at`
  - `raw_story_ids[]`

- **NewsCard**
  - `id`, `cluster_id`
  - `headline`
  - `what_happened`
  - `why_it_matters`
  - `whats_next` (nullable)
  - `confidence_score` (optional)
  - `created_at`

- **Edition**
  - `id`, `window_start`, `window_end`
  - `cards[]` (ordered list)
  - `categories[]` (optional grouping)

- **UserSession**
  - `id`, `window_start`, `window_end`
  - `completed_at`, `extended_completed_at`

---

## 6. API Responsibilities (Strict Boundaries)

### API MUST:
- Return edition content quickly and consistently
- Enforce session completion state
- Provide stable endpoints for UI rendering

### API MUST NOT:
- Trigger ingestion
- Run LLM calls during user request
- Auto-refresh content in ways that feel infinite

---

## 7. Worker Responsibilities (Strict Boundaries)

### Workers MUST:
- Generate editions on a schedule
- Produce bounded summaries
- Log inputs/outputs for auditability
- Store final editions in DB and cache

### Workers MUST NOT:
- Personalize toward engagement
- Generate infinite or open-ended content streams

---

## 8. Caching Strategy (Simple & Safe)
- **Redis** caches “current edition” by time window:
  - key: `edition:{window_start}`
- Cache invalidation is tied to edition generation schedule (not user actions).
- UI should show skeleton/loading states without layout shifts.

---

## 9. Reliability & Observability (Later Phases)
Add in later phases:
- Structured logs for workers + API
- Metrics: edition generation time, summarization error rate
- Retry strategy for ingestion and LLM failures
- Dead-letter queues for persistent failures

---

## 10. Security & Privacy (Principles)
- Use only trusted sources
- Do not store unnecessary personal data
- Keep user identity optional for MVP
- Never train models on user behavior for engagement loops

---

## 11. Architectural “Red Lines”
If any change introduces these, it must be rejected:
- Infinite scroll or auto-loading feeds
- Endless recommendations
- Always-on refresh loops
- LLM-driven engagement optimization
- UI coupled to ingestion/LLM generation
