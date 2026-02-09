# EXPANSION_PLAN.md
> iOS-first expansion plan for turning the current public “Sami’s saved spots” web app into a multi-user product.
> Goal: ship a solid TestFlight MVP that feels magical (save from IG) but stays reliable (manual save always works).

---

## 0) One-sentence product definition

A curated guide + personal map where anyone can save places (from search or Instagram), organize them into lists, and add private “after I went” notes—without the bloat of a full Yelp clone.

---

## 1) Product strategy (what we are and aren’t)

### We are
- **Personal utility first**: save → organize → retrieve → plan.
- **Curated front door**: your public guide stays the entry point and brand anchor.
- **Private-first reviews**: notes + ratings are private by default; public later.

### We are not (v1)
- A global review marketplace (moderation + spam + cold start).
- A full social network (followers/feed).
- A “perfect IG automation” product (brittle if you depend on scraping).

### V1 wedge
**“Share an IG link or screenshot → confirm venue → saved.”**  
The confirmation step is non-negotiable for reliability.

---

## 2) MVP scope (iOS-first)

### Must ship (TestFlight MVP)
1) **Accounts**
   - Sign in with Apple (primary)
   - Optional email login
2) **Lists**
   - Default lists: `Want to Try`, `Been`
   - Create list / rename / delete
3) **Saving places**
   - Manual search + save
   - Save into a list + tags + optional note
4) **Map**
   - Map view of saved places
   - Filter by list + tags
5) **Private “review after going”**
   - Mark place as `Been`
   - Add rating (1–5) + note + visited date (optional)
6) **Instagram intake (v1)**
   - Share **IG URL** to app → Import Draft → user resolves place
   - Share **screenshot** to app → OCR → candidates → user resolves place

### Nice-to-have (if MVP is stable)
- Import history screen (resume pending imports)
- Place dedupe improvements
- List sharing (unlisted link)

### Explicitly deferred
- Public reviews
- Discovery feed
- Following/friends
- Automated “extract from video” without user confirmation

---

## 3) Repo & directory structure (same repo, new dirs)

Use one repo. Add the following folders.

/samis-guide
├── apps/
│ ├── web/ # existing Next.js public guide + shareable pages
│ └── ios/ # NEW: iOS app (Xcode project)
│
├── backend/ # NEW or evolve from existing API routes
│ ├── api/ # REST endpoints
│ ├── db/
│ │ ├── schema.sql
│ │ └── migrations/
│ ├── jobs/ # async import processing (optional in MVP)
│ └── README.md
│
├── docs/
│ └── EXPANSION_PLAN.md # this file + future specs
│
└── shared/ # OPTIONAL later: types/contracts shared across web/api


---

## 4) iOS stack (recommended)

### Core
- **SwiftUI** (fast iteration)
- **MapKit** (MVP maps without extra providers)
- **Vision** (on-device OCR for screenshots)
- **Share Extension** (accepts URL + image)

### iOS architecture
- MVVM + async/await networking
- Keep local persistence minimal initially
  - optional: small local cache (UserDefaults / file cache)
  - add Core Data only if offline becomes a real requirement

---

## 5) Backend stack (recommended minimal)

### Data
- **Postgres + PostGIS** (nearby search, clustering later, geo indexing)
- Auth: **Supabase Auth** or **Clerk** (fastest, production-grade)

### API
- REST JSON
- Bearer auth token from auth provider
- Minimal endpoints: places, lists, list items, imports

### Storage (only if you accept images)
- S3-compatible object store (R2/S3)
- For MVP: screenshots can be uploaded, or kept client-side and only OCR text sent to server
  - simplest path: do OCR on-device and send only `ocr_text`

---

## 6) Data model (v1)

Entities:
- `app_users`
- `lists`
- `places` (canonical venue record)
- `list_items` (save relationship + status + note + rating)
- `tags`, `list_item_tags`
- `imports` (source link/screenshot → resolved place)

Key concepts:
- **Place is canonical** (dedupe as best-effort)
- **User’s content lives in list_items** (notes, rating, status)
- **Imports are a state machine** (pending → needs_user_input → resolved/failed)

---

## 7) API contract (v1 minimal)

### Places
- `GET /v1/places/search?q=...&lat=...&lng=...`
- `POST /v1/places/upsert` (creates/returns canonical place)

### Lists
- `GET /v1/lists`
- `POST /v1/lists`
- `GET /v1/lists/:id`
- `POST /v1/lists/:id/items`
- `PATCH /v1/list-items/:id`

### Imports
- `POST /v1/imports` (create import draft)
- `POST /v1/imports/:id/ocr` (attach OCR text)
- `POST /v1/imports/:id/resolve` (confirm place + save)

Public web (optional in MVP):
- `GET /public/featured`
- `GET /public/lists/:slug`

---

## 8) iOS UX and screen map

### Tabs
- Home
- Map
- Lists
- Profile

### Core screens
- HomeFeedView
  - search bar
  - “Import from Instagram” CTA
  - “Sami’s Guide” featured lists
  - recently saved
- MapView
  - list picker
  - tag chips
  - pins → place detail
- ListsView
  - default lists + user lists
- ListDetailView
  - places, reorder, filter, share (optional)
- PlaceDetailView
  - save / move lists / mark been / add note/rating
- ImportDraftView
  - “Finding places…” / candidate list / manual search fallback
- ProfileView
  - settings, home city, privacy defaults

---

## 9) Instagram import pipeline (v1 design)

### Principle
**User always confirms the venue.**  
No “silent save” from IG. Avoid wrong saves and duplication.

### Intake types
1) IG URL (Share Sheet)
2) Screenshot (Share Sheet)

### URL flow
- Share IG URL → create import draft → open app to ImportDraftView
- UI shows:
  - search input (“venue name or keywords”)
  - hints: “Share a screenshot for faster detection”
- User searches → selects place → saves

### Screenshot flow (the “magic”)
- Share screenshot → open app → run on-device OCR (Vision)
- Extract candidate phrases (heuristics)
- Search for venues using MapKit search (client-side) OR backend search
- Show top 5 candidates
- User selects → app upserts place → saves

### Failure handling (mandatory)
- If OCR yields junk/no candidates:
  - show “Search manually” immediately
- If user closes:
  - import stays `needs_user_input`
  - optional: resume later in Imports screen

---

## 10) Build order (do this in sequence)

### Milestone 1: Baseline product works without imports
- Auth (Sign in with Apple)
- Lists + save place manually
- Map view with filters
- Place detail actions (save/move/mark been)

**Definition of done**
- A user can sign in, create lists, save places, see them on a map, and add private notes.

---

### Milestone 2: Imports (screenshot first)
- Implement Share Extension (accept image + url)
- Implement screenshot OCR path end-to-end:
  - share screenshot → app opens → OCR → candidates → confirm → save
- Add instrumentation events

**Definition of done**
- Screenshot share consistently results in a saved place with <1 manual step in most cases.

---

### Milestone 3: Imports (IG URL path)
- Share IG URL → import draft → manual search resolve → save
- Optional: best-effort metadata fetch (non-blocking)

**Definition of done**
- URL import never dead-ends; user can always save by searching.

---

### Milestone 4: Hardening
- Dedupe improvements
- Rate limiting + validation
- Crash fixes, loading states, empty states
- Better “home city” setting to improve candidate relevance

---

## 11) Ticket-level backlog (copy into your tracker)

### iOS — Auth & Profile
- [ ] Implement Sign in with Apple
- [ ] Create user profile on first login (backend)
- [ ] Settings: home city, default list, privacy defaults

### iOS — Lists & Places
- [ ] Create/rename/delete list
- [ ] List detail: reorder, remove item
- [ ] Place detail: save, move, mark been, rate, note, visited date
- [ ] Search view: results → place detail

### iOS — Map
- [ ] Map view: pins for selected list
- [ ] Filter by list + tags
- [ ] Tap pin → place detail

### iOS — Share Extension
- [ ] Extension accepts URL
- [ ] Extension accepts Image
- [ ] App Group draft handoff + deep link open
- [ ] ImportDraftView with states

### iOS — OCR + Candidate Search
- [ ] Vision OCR on-device
- [ ] Heuristic phrase extraction (remove UI junk)
- [ ] Candidate generation using MKLocalSearch
- [ ] Ranking + top 5 candidates
- [ ] Manual search fallback

### Backend — Core
- [ ] Database schema + migrations
- [ ] Places upsert + dedupe key
- [ ] Lists CRUD
- [ ] List items CRUD
- [ ] Tags upsert
- [ ] Imports state machine endpoints

### Web — Public guide continuity
- [ ] Keep existing guide live
- [ ] Add “Get the app” CTA + deep links (later)
- [ ] (Optional) public list pages

### Analytics (minimum)
- [ ] import_created (source)
- [ ] import_candidates_shown (count)
- [ ] import_resolved (method)
- [ ] import_failed (reason)
- [ ] place_saved / place_marked_been

---

## 12) Security & privacy (don’t skip)

- Screenshots: prefer OCR on-device and send only text.
- If you store images:
  - private bucket, signed URLs, retention policy
- PII: keep minimal (email optional, Apple auth token)
- Abuse prevention:
  - rate-limit place creation/upsert per user
  - validate lat/lng bounds and text lengths
- GDPR basics:
  - delete account endpoint (hard delete user content)

---

## 13) Dedupe strategy (v1 simple, v2 better)

### v1
- Normalize place name + city + lat/lng rounding → `dedupe_key`
- If dedupe_key exists: reuse place

### v2
- Provider IDs (Apple Maps / Google / Foursquare)
- Similarity matching + distance threshold
- Background dedupe jobs

---

## 14) Release strategy (iOS-first)

### TestFlight beta
- Start with a small cohort (friends + “food IG savers”)
- Measure:
  - % imports resolved
  - time to save from share
  - duplicates per user
  - retention: saves per week

### Public launch
- Only after import flow is stable and “manual save” feels great

---

## 15) “Stop doing” list (to avoid getting stuck)
- Don’t build global public reviews in v1.
- Don’t build a feed in v1.
- Don’t depend on IG scraping to work forever.
- Don’t over-engineer offline mode early.
- Don’t add “AI recommendations” until you have real usage data.

---

## 16) Definition of Done (MVP)
MVP is “done” when:
- iOS app: user can sign in, save places manually, view on map, and add private notes/ratings.
- Import: screenshot share reliably produces candidates and saves after user confirmation.
- URL share never dead-ends; user can always resolve via manual search.
- Backend is stable, with dedupe and basic abuse prevention.
- Your web guide remains public and points users to the iOS experience.

---