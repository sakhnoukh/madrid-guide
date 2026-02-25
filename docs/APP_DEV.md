# APP_BUILD_NEXT_STEPS.md
> Focus: start building the iOS app NOW (simulator-first) while Apple Dev Program / Sign in with Apple is blocked.
> Strategy: ship core product loop with **Dev Auth (DEBUG-only)** + local/mocked data first, then connect to backend, then swap in real Apple auth when provisioning works.

---

## 0) Current status
- Xcode project created ✅
- Sign in with Apple currently fails due to missing provisioning profiles / Apple dev services issues ✅
- Backend PR1 is specified (schema + 18 endpoints) ✅

---

## 1) Primary objective for the next sprint (1–3 days)
Get a working iOS app that supports the *core loop*:

1) user “logs in” (temporary Dev Login)
2) sees lists
3) searches for a place manually (MapKit search)
4) saves it into a list
5) can view saved places in a list detail
6) can view them on a map (pins)
7) can mark “Been” + add rating/note (private)

**This must work end-to-end in the simulator even without real auth.**

---

## 2) Tactical approach (so we don’t stall)
### Why we don’t start with PR2 right now
Real Apple auth depends on:
- Apple Developer provisioning profiles
- Xcode managed signing
- potential Apple server outages

So we proceed with:
- **Dev Auth Bridge** (DEBUG-only)
- a simple token scheme (`Authorization: Bearer dev:<uuid>`)
- backend accepts dev tokens only when `AUTH_MODE=dev`

This avoids rework: once Apple auth works, we swap the token source.

---

## 3) Milestones and deliverables

### Milestone A — App Shell + Navigation (no backend required)
**Deliverable:** the app is usable, navigation is smooth, empty states look good.

- Tab bar exists:
  - Home
  - Lists
  - Map
  - Profile

- Home shows:
  - quick actions: “Import” (disabled placeholder), “Add a place”
  - “Sami’s picks” section placeholder (static)
  - “Your recent saves” placeholder

- Lists tab:
  - default lists visible (`Want to Try`, `Been`)
  - user can create a list (local-only for now)

- Profile tab:
  - Dev user id displayed
  - “Sign out” works

**Exit criteria:**
- app compiles and runs
- no dead-end screens
- state changes update UI immediately

---

### Milestone B — Manual Save Flow (still local-first)
**Deliverable:** you can search and add places without backend.

Flow:
1) Lists → open list → “Add a place”
2) MapKit search results show
3) user selects → item saved into list
4) list detail shows place row
5) Home “Recent saves” updates

**Exit criteria:**
- user can add 5 places and see them across the app
- works in simulator every time

---

### Milestone C — Connect to Backend via Dev Auth (PR1 integration)
**Deliverable:** the same flows work but persist through backend.

**Backend pre-req:** PR1 endpoints functional with dev auth enabled.

Integration order:
1) `POST /v1/me/bootstrap`
2) `GET /v1/lists`
3) `GET /v1/lists/:id`
4) `POST /v1/places/upsert`
5) `POST /v1/lists/:id/items`
6) `PATCH /v1/list-items/:id`

**Exit criteria:**
- app can be killed/relaunched and data persists
- saving places no longer uses local mocks
- error handling is visible but non-annoying (toast/banner)

---

### Milestone D — Map Pins + Filtering
**Deliverable:** user sees saved places on map and can filter by list.

Requirements:
- Map shows pins for selected list
- list selector control in Map tab
- tapping a pin opens place detail sheet

**Exit criteria:**
- switching list changes pins quickly
- pin -> correct place detail

---

### Milestone E — “Been” + private rating/note
**Deliverable:** after the visit, users can quickly log experience.

Requirements:
- Place detail:
  - status toggle Want/Been
  - rating 1–5
  - note text
  - visited date optional
- all updates persisted via `PATCH /v1/list-items/:id`

**Exit criteria:**
- updates persist across relaunch
- validations enforced (rating bounds, note length)

---

## 4) Dev Auth Bridge (temporary auth plan)

### Goal
Keep all “auth” code cleanly isolated so it can be replaced later with Supabase Apple auth.

### iOS side
- Dev login generates a UUID (stored locally)
- Requests send:
  - `Authorization: Bearer dev:<uuid>`

### Backend side
- `AUTH_MODE=dev` enables:
  - parse `dev:<uuid>` and set `req.userId`
- `AUTH_MODE=supabase` (later) enables:
  - verify Supabase JWT via JWKS
  - set `req.userId = claims.sub`

### Rules
- Dev Auth must be **DEBUG-only**
- Production builds must NOT allow dev tokens

**Exit criteria:**
- iOS can call `/v1/me/bootstrap` and get stable default list IDs
- dev user id stays consistent across runs

---

## 5) UI/UX requirements for the MVP build
We’re not “designing” yet, but we must avoid ugly defaults.

### Standards (minimum)
- consistent spacing (12–16pt padding)
- grouped backgrounds (`systemGroupedBackground`)
- cards for key actions
- real empty states (not blank screens)
- loading states for network calls
- errors shown as:
  - inline banner on screen or
  - toast/snackbar

### Home screen must feel like it has a purpose
Home should always answer:
- “How do I save something fast?”
- “What should I look at next?”

Home modules (even as placeholders):
- Search bar
- Primary actions (Import / Add place)
- Featured (Sami’s picks)
- Recent saves

---

## 6) Backend integration contract (what the app expects)
The app expects these capabilities:
- bootstrap returns:
  - user
  - default list IDs
  - settings
- lists endpoints return:
  - list summaries + item_count
- list detail returns:
  - items joined with place info and tags
- upsert place returns:
  - canonical place_id
- list item update supports:
  - status / rating / note / visited_at

Error format:
```json
{ "error": { "code": "...", "message": "...", "details": {} } }
7) Work breakdown into tickets (copy to tracker)
Ticket Group 1 — App Shell
 Tab bar + navigation stack per tab

 Home screen layout + placeholders

 Lists screen (local mock data)

 List detail screen (local mock items)

 Profile screen (dev user id + sign out)

Ticket Group 2 — Manual Add Place (Local)
 Place search UI

 MapKit local search results

 Save selected place into list (local store)

 Update Home recent saves

Ticket Group 3 — Dev Auth Bridge
 Dev login screen and persistent UUID

 API client supports adding Bearer token

 Backend dev auth middleware (AUTH_MODE=dev)

Ticket Group 4 — Backend Integration
 Call bootstrap on app launch

 Replace mock list fetch with GET /v1/lists

 List detail uses GET /v1/lists/:id

 Save flow uses upsert + save-to-list

 Add retry + error UI (basic)

Ticket Group 5 — Map
 Map tab pin rendering

 List selector + filter

 Pin tap → place detail

Ticket Group 6 — Place Detail + Been
 Status toggle (want/been)

 Rating selector

 Note editor

 Patch updates to backend

8) Testing plan (simulator-first)
Smoke tests (every time you change something)
Login (Dev)

Create list

Add place

Confirm it shows in list detail

Confirm it shows in map

Mark Been + add rating

Kill app and relaunch (data persists once backend is connected)

Common failure states to explicitly handle
No network → show offline message, keep UI usable

Backend returns 401 → kick user to login

Backend returns validation error → show inline message

9) When Apple Dev Program is fixed (return to PR2)
Only after Milestones C/D are stable:

Swap Dev Auth → Supabase JWT auth

Replace Dev Login with Apple login button

Ensure bootstrap can accept display name on first sign in

Why we wait: real auth should be a clean swap, not a blocker for core functionality.

10) Immediate next actions (today)
Finish Milestone A (app shell + nav)

Finish Milestone B (manual save local-first)

In parallel: enable Dev Auth Bridge on backend (AUTH_MODE=dev)

Start Milestone C (backend integration) as soon as bootstrap endpoint is reachable

