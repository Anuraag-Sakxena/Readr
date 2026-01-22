# Readr — Development Roadmap

## Guiding Principle
**No feature may be added unless it has a clear and intentional stopping point.**  
Completion is a first-class design requirement.

---

## Phase 0 — Product Foundation (Now)
**Goal:** Lock constraints and philosophy before writing real product logic.

### Deliverables
- `docs/vision.md` (constitution)
- `docs/architecture.md` (system boundaries + flow)
- `docs/roadmap.md` (this file)
- Repo structure created: `apps/web`, `apps/api`, `docs`

### Exit Criteria
- Non-negotiables are documented
- Architecture boundaries are explicit
- Team cannot “accidentally” build an infinite feed

---

## Phase 1 — Technical Foundation (Skeleton App)
**Goal:** End-to-end working shell with mocked data.

### Web (Next.js)
- Screen Card engine (vertical navigation)
- Smooth swipe up/down navigation
- Placeholder cards:
  - Welcome
  - Home
  - News Card (mock)
  - End of Edition
  - Extended Edition (mock)
  - Final Completion

### API (NestJS)
- Health endpoint
- Mock “current edition” endpoint
- Mock session state endpoint (completed vs active)

### Exit Criteria
- UI feels calm and complete with fake data
- User can reach a hard stop
- App has a “finished” state

---

## Phase 2 — MVP (Real Usable Product)
**Goal:** Deliver a real, usable Readr with real content + bounded intelligence.

### Backend + Data
- PostgreSQL schema for editions/cards
- Redis cache for current edition
- Worker pipeline v1:
  - Ingestion (trusted sources)
  - Deduplication
  - Ranking/selection (finite)
  - LLM summarization into card anatomy
  - Edition assembly & storage

### App Experience
- Onboarding: first name + location
- Home Card shows:
  - greeting
  - location context (later weather brief)
  - category overview
- News Cards render real stored edition
- Hard-stop completion enforced
- 12-hour reset logic implemented

### Exit Criteria
- A user can open Readr, finish, and be done
- Real edition is stored and served reliably
- Reset logic is correct and predictable

---

## Phase 3 — Experience Polish (Instagram/Uber Smoothness)
**Goal:** Make the interaction feel premium and frictionless.

### Improvements
- Gesture velocity tuning
- Interruptible animations (no jank)
- Optimistic UI patterns where safe
- Skeleton loading (no layout shift)
- Perf profiling and fixes

### Exit Criteria
- Swipe feels “native”
- Loading is calm and stable
- No UI surprises

---

## Phase 4 — Depth Without Addiction
**Goal:** Add optional depth while preserving finiteness.

### Features
- Story Detail Card (side-swipe deep dive)
- Media-rich long-form content
- Preserve navigation state on return
- Strict limits: deep dive remains bounded per story

### Exit Criteria
- Depth exists without turning into a rabbit hole
- Returning user never loses “where they were”

---

## Phase 5 — Intelligence Layer (Comprehension Enhancers)
**Goal:** Increase understanding without increasing noise.

### Features
- Explain Cards (simplified context)
- Compare Cards (multiple viewpoints)
- Timeline/background cards
- Optional audio brief cards (bounded)

### Exit Criteria
- Intelligence features remain optional and finite
- No “keep reading forever” behavior emerges

---

## Phase 6 — Reliability & Global Scale
**Goal:** Prepare Readr for worldwide adoption.

### Engineering
- CDN optimization for media/static
- Horizontal scaling for API + workers
- Queue hardening + fault tolerance
- Monitoring, tracing, alerting
- Robust retry/dead-letter strategy

### Exit Criteria
- Stable edition generation at scale
- Observability is production-grade
- Resilient to source outages and LLM failures

---

## What We Build Next (Immediate)
1. Finalize `architecture.md` (system boundaries locked)
2. Initialize Next.js in `apps/web`
3. Initialize NestJS in `apps/api`
4. Build Phase 1 skeleton with mocked edition + completion flow
