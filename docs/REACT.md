# PIVOT_TO_REACT.md
> Pivot plan: SwiftUI iOS app → React (React Native) app, iOS-first.
> Objective: keep momentum, avoid rework, and preserve the backend/API spec we already planned.

---

## 1) What “React” means here (the right choice)
For an iOS-first mobile app, “React” should be:

✅ **React Native + Expo (managed workflow)**  
Why: fastest iteration, great developer experience, strong ecosystem.

Avoid (for now):
- PWA as the primary “app” (doesn’t give you iOS-native share sheet / map UX reliably)
- Bare React Native from day 1 (slower setup + native config overhead)

**Decision:** Expo-managed now. If/when we need deep native features (Share Extension), we can move to Expo Dev Client / prebuild (still not a rewrite).

---

## 2) What stays the same (no rework)
### Keep:
- **Backend DB schema** (Postgres/PostGIS enums, name_norm, geo, place_sources, imports)
- **API endpoints** (the 18 endpoints across 6 route files)
- **Core UX flows** (lists, save, map, been/rating, imports draft)

### Replace:
- SwiftUI views / MVVM → React Navigation + React state management
- Swift-only MapKit Local Search → move search to backend or a provider

---

## 3) Repo structure after pivot (recommended)
/samis-guide
├── apps/
│ ├── web/ # existing Next.js guide
│ └── mobile/ # NEW: Expo React Native app (replaces apps/ios)
├── backend/
│ ├── api/
│ └── db/
└── docs/
└── PIVOT_TO_REACT.md


What to do with the Swift project:
- Keep it in `apps/ios-archive/` OR delete it.
- If we later build an iOS Share Extension, having native Xcode context can help, but it’s optional.

---

## 4) The only real “new problem” created by pivot
### Place search
In SwiftUI, we used `MKLocalSearch` easily.
In React Native, you don’t get MapKit LocalSearch out of the box.

So we choose ONE of these:

**Option A (recommended MVP): server-side search**
- Implement `GET /v1/places/search?q=...&lat=...&lng=...`
- Back it with a geocoder / POI provider
- Mobile app uses the API for search results

**Option B: native module bridging MapKit search**
- More work + platform specific
- Only worth it if you really want Apple’s local search quality without a paid API

**MVP recommendation:** Option A.
We can start with a low-cost provider and swap later without touching the app UI.

---

## 5) Pivot milestones (exact build plan)

### Milestone A — Expo app boot + navigation (Day 1)
Goal: app runs + screens exist.

- Set up Expo project under `apps/mobile`
- Add navigation:
  - Home
  - Map
  - Lists
  - Profile
- Add a shared API client wrapper with:
  - base URL
  - token injection
  - standardized error handling: `{ error: { code, message, details } }`

Deliverable:
- You can click through tabs and see placeholder content.

---

### Milestone B — Temporary auth (Dev Auth Bridge) (Day 1–2)
Goal: unblock all app development even if Apple dev program is down.

- Dev login screen:
  - “Continue (Dev)”
  - stores a UUID locally
- Every API request sends:
  - `Authorization: Bearer dev:<uuid>`
- Backend supports:
  - `AUTH_MODE=dev` which accepts `dev:<uuid>` tokens

Deliverable:
- You can call `POST /v1/me/bootstrap` from the mobile app successfully.

---

### Milestone C — Lists + saving loop (Day 2–3)
Goal: core product loop working end-to-end.

Implement screens:
- Lists screen (GET /v1/lists)
- List detail (GET /v1/lists/:id)
- Add place:
  - Search screen calling `GET /v1/places/search`
  - Select result → `POST /v1/places/upsert`
  - Save → `POST /v1/lists/:id/items`

Deliverable:
- Add 5 places, relaunch app, still there.

---

### Milestone D — Map view (Day 3–4)
Goal: saved places show on a map with filters.

- Use `react-native-maps` (Apple Maps on iOS)
- Map tab:
  - list selector
  - pins from selected list items
  - tap pin → open place detail sheet

Deliverable:
- Switching lists updates pins fast.

---

### Milestone E — “Been” + rating + note (Day 4–5)
Goal: complete the visit loop.

- Place detail:
  - toggle want/been
  - rating 1–5
  - note
  - visited date
- Persist via:
  - `PATCH /v1/list-items/:id`

Deliverable:
- updates persist and reflect in UI everywhere.

---

## 6) Instagram import after pivot (important reality check)

### Share Extension
Expo-managed apps do **not** support iOS Share Extensions “for free”.
To do “Share from Instagram → open app”, we will eventually need:
- Expo prebuild + native iOS target OR
- a small native extension project that deep-links into the RN app

### MVP import plan in React Native (no native extension yet)
We still build the feature, but with:
- “Paste IG link” input
- “Upload screenshot” input (from Photos)
- Import draft screen (same flow):
  - create import (`POST /v1/imports`)
  - attach OCR text (`POST /v1/imports/:id/ocr`) when OCR exists
  - resolve (`POST /v1/imports/:id/resolve`)

OCR options:
- MVP: no OCR (manual resolve) → still valuable
- Later: on-device OCR via native module or 3rd party SDK

Deliverable:
- Import pipeline exists and works even if “magic extraction” is deferred.

---

## 7) When Apple Dev Program returns (real PR2)
Once provisioning is back:
- Implement Supabase Auth + Sign in with Apple in React Native:
  - use Apple sign-in module
  - exchange for Supabase session
- Backend switches from `AUTH_MODE=dev` to `AUTH_MODE=supabase`
- App swaps token source

This is a **clean swap** because our API client already supports “token provider”.

---

## 8) What we do today (action list)
1) Create `apps/mobile` Expo app and commit the skeleton
2) Implement navigation + placeholder screens
3) Add Dev Auth Bridge (mobile + backend)
4) Wire bootstrap endpoint
5) Start Lists → List Detail UI

---

## 9) Success criteria for the pivot
Pivot is “successful” when:
- app runs smoothly in simulator
- user can save places and see them in lists + map
- backend persistence works
- auth can be swapped later without rewriting screens

---