# IMPLEMENTATION_CHECKLIST.md
> Step-by-step build checklist for the iOS-first expansion.
> This is optimized to ship Milestone 1 fast, then add Instagram import safely.

---

## Guiding rule
**Baseline app loop must be rock-solid before import magic.**  
Manual search/save/map/list must work perfectly first.

---

# PR PLAN (recommended)
Ship in small PRs that each compile + run.

- PR0: Repo scaffolding + docs
- PR1: DB + API skeleton
- PR2: Auth + user bootstrap
- PR3: Lists + manual save loop
- PR4: Map view
- PR5: Place detail + “Been” + private note/rating
- PR6: Share Extension (screenshot) + OCR draft
- PR7: Share Extension (IG URL) + manual resolve
- PR8: Import hardening + analytics

---

# PR0 — Repo scaffolding (no product logic)
**Goal:** structure is ready; docs live in one place.

## Tasks
- [ ] Create `/docs/IMPLEMENTATION_CHECKLIST.md` (this file)
- [ ] Ensure `/docs/EXPANSION_PLAN.md` exists
- [ ] Add `/apps/ios/` directory (empty placeholder)
- [ ] Add `/backend/` directory (placeholder if needed)
- [ ] Update root `README.md` with:
  - project structure
  - how to run web
  - how to run backend
  - how to open iOS project

**Done when:** repo tree matches plan; CI still green.

---

# PR1 — Database + API skeleton
**Goal:** persistent storage + basic REST API running.

## Backend folder layout
/backend
├── api/
│ ├── src/
│ │ ├── index.ts (or main.py/etc)
│ │ ├── routes/
│ │ ├── middleware/
│ │ └── services/
│ └── package.json (or requirements)
└── db/
├── schema.sql
└── migrations/


## DB tasks (Postgres + PostGIS)
- [ ] Create Postgres project (Supabase recommended for speed)
- [ ] Enable extensions:
  - `postgis`
  - `pg_trgm`
- [ ] Apply schema (from `DB_SCHEMA_V1.sql`)
- [ ] Add migration workflow (Supabase migrations or prisma/drizzle)

## API tasks
- [ ] Create basic server (health endpoint)
  - `GET /health` → `{ ok: true }`
- [ ] Add auth middleware stub (accept bearer token, placeholder verify)

## Endpoints to implement in PR1 (no auth required yet; can be mocked)
- [ ] `GET /v1/lists` (return empty until auth)
- [ ] `POST /v1/lists`
- [ ] `GET /v1/lists/:id`
- [ ] `POST /v1/places/upsert`
- [ ] `POST /v1/lists/:id/items`
- [ ] `PATCH /v1/list-items/:id`

**Done when:**
- You can run DB locally/hosted
- You can hit `/health`
- Endpoints return valid JSON (even if auth mocked)

---

# PR2 — Auth + user bootstrap
**Goal:** iOS can authenticate and backend associates a stable `app_users` record.

## Auth decision (pick one)
### Option A (fastest): Supabase Auth
- [ ] Configure Sign in with Apple on Supabase
- [ ] iOS gets Supabase session token (JWT)
- [ ] backend verifies JWT using Supabase JWKS

### Option B: Clerk
- [ ] Configure Apple login
- [ ] backend verifies Clerk JWT

## Backend tasks
- [ ] Implement auth middleware:
  - verify bearer token
  - extract `user_id` (uuid)
- [ ] `POST /v1/me/bootstrap`
  - creates `app_users` row if missing
  - returns user profile + default lists

### Default lists creation
On first bootstrap:
- Create “Want to Try”
- Create “Been”
- Mark them private
- Return their IDs

**Done when:**
- A real user logs in and gets stable IDs
- A second login does not create duplicates

---

# PR3 — iOS app foundation + manual save loop
**Goal:** user can sign in, search for a place manually, and save it to a list.

## iOS folder layout
/apps/ios/SamisGuideApp
├── SamisGuideApp.xcodeproj
├── Sources/
│ ├── App/
│ ├── Auth/
│ ├── Networking/
│ ├── Models/
│ ├── Views/
│ │ ├── Home/
│ │ ├── Lists/
│ │ ├── Map/
│ │ ├── Profile/
│ │ └── Import/
│ └── ViewModels/
└── Resources/


## Tasks (in order)
### Auth
- [ ] Implement Sign in with Apple
- [ ] Store session token securely (Keychain)
- [ ] Call `POST /v1/me/bootstrap` after login

### UI shell
- [ ] Tab bar with 4 tabs:
  - Home, Map, Lists, Profile
- [ ] Basic loading/empty states

### Lists screen
- [ ] Fetch `GET /v1/lists`
- [ ] Display default lists first
- [ ] Create list flow → `POST /v1/lists`

### Manual place search
**Use MKLocalSearch in-app (fastest MVP).**
- [ ] `PlaceSearchView` with search field
- [ ] Use `MKLocalSearch` to show results
- [ ] User selects result → call backend:
  1) `POST /v1/places/upsert` (with name/address/lat/lng + source=apple_maps)
  2) `POST /v1/lists/:id/items` to save it

**Done when:**
- You can save 5 places manually
- They appear in list detail view after refresh

---

# PR4 — Map view (saved places)
**Goal:** show saved places as pins; filter by list.

## Tasks
- [ ] `GET /v1/lists/:id` returns list items with lat/lng + place name
- [ ] iOS `MapView`:
  - list picker (default Want to Try)
  - pins for items
  - tap pin opens `PlaceDetailView`

### Optional (but valuable)
- [ ] Add simple clustering later; for MVP, normal pins are fine

**Done when:**
- switching lists updates pins
- tapping a pin opens correct place detail

---

# PR5 — Place detail + “Been” + private note/rating
**Goal:** close the “after I went” loop.

## Backend
- [ ] `PATCH /v1/list-items/:id` supports:
  - status `want` ↔ `been`
  - rating 1–5
  - note
  - visited_at

## iOS
- [ ] `PlaceDetailView` shows:
  - place name + address
  - which lists it’s in
  - status toggle: Want/Been
  - rating control
  - note editor
  - visited date (optional)
- [ ] Save updates immediately to backend

**Done when:**
- you can mark a place Been, add rating/note, and it persists

---

# PR6 — Share Extension (screenshot) + OCR import draft
**Goal:** implement the “magic” import path reliably.

## Share extension
- [ ] Add Share Extension target
- [ ] Accept types:
  - URL
  - Image
- [ ] Write draft payload to App Group container:
  - `draft_id`
  - `type: screenshot`
  - path to stored image
  - created_at
- [ ] Deep link open host app:
  - `samisguide://import?draft_id=...`

## Host app import
- [ ] `ImportDraftView` loads draft by `draft_id`
- [ ] Run Vision OCR on-device
- [ ] POST OCR text to backend:
  - `POST /v1/imports`
  - `POST /v1/imports/:id/ocr`

## Candidate search (MVP)
- [ ] Extract candidate phrases (simple heuristics)
- [ ] Use `MKLocalSearch` with:
  - `"${candidate} ${home_city}"`
- [ ] Show top 5 candidates
- [ ] User selects candidate:
  1) upsert place
  2) resolve import + save to list

**Done when:**
- sharing a screenshot leads to a saved place with user confirmation

---

# PR7 — Share Extension (IG URL) + manual resolve
**Goal:** URL share never dead-ends, even if extraction is weak.

## Extension
- [ ] If URL shared: create draft with `type=url` + URL stored
- [ ] open app to ImportDraftView

## App
- [ ] Create import with source `instagram_url`
- [ ] Show:
  - Search input (manual)
  - “Share screenshot for faster import” hint
- [ ] Resolve via manual search → save

**Done when:**
- sharing any IG URL can result in a saved place via manual search

---

# PR8 — Hardening + analytics
**Goal:** improve reliability and measure what matters.

## Analytics events (minimum)
- [ ] `import_created` (source)
- [ ] `import_candidates_shown` (count)
- [ ] `import_resolved` (candidate_pick vs manual_search)
- [ ] `import_failed` (reason)
- [ ] `place_saved`
- [ ] `place_marked_been`

## Quality improvements
- [ ] Better OCR phrase filtering (remove usernames/UI strings)
- [ ] Home city setting required (improves search relevance)
- [ ] Dedupe_key tuning (reduce duplicates)
- [ ] Rate limiting on place upsert
- [ ] Graceful empty states everywhere

**Done when:**
- import resolution rate is measurable
- you can identify top failure reasons quickly

---

# Backend: endpoint checklists (copy/paste)

## `POST /v1/me/bootstrap`
- [ ] Creates `app_users` if missing
- [ ] Creates default lists if missing
- [ ] Returns:
```json
{
  "user": { "id": "...", "display_name": "...", "handle": "..." },
  "default_lists": { "want": "uuid", "been": "uuid" }
}
POST /v1/places/upsert
 Accepts place payload from MKLocalSearch

 Computes dedupe_key

 Returns canonical place_id

POST /v1/lists/:id/items
 Saves place into list

 Upserts tags

 Returns saved list_item_id

PATCH /v1/list-items/:id
 Updates note/rating/status/visited_at

Imports
 POST /v1/imports

 POST /v1/imports/:id/ocr

 POST /v1/imports/:id/resolve

