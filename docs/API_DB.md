# BACKEND_DB_API_SPEC.md
> Database + API spec for the iOS-first expansion.
> This is written to be implemented quickly (Supabase/Postgres + thin REST API), and to support:
> - iOS manual save (MKLocalSearch → upsert place → save to list)
> - iOS map/list views
> - Import drafts (IG URL + screenshot OCR) with user-confirmed venue resolution

---

## 1) Scope (MVP)
### Supports
- Authenticated users
- Default lists (`Want to Try`, `Been`)
- User-created lists (private/unlisted/public)
- Saving places into lists
- Private notes + ratings + status (`want` vs `been`)
- Imports:
  - instagram URL draft (manual resolve)
  - screenshot OCR text draft (candidate resolve)

### Defers
- Public reviews + moderation
- Social graph + feed
- Full server-side “place search provider” (MVP can use MapKit on device)

---

## 2) Recommended stack (fastest path)
- **DB:** Postgres + PostGIS (+ pg_trgm)
- **Auth:** Supabase Auth (Sign in with Apple), or Clerk (either works)
- **API:** Thin REST layer (Next.js route handlers / Express / Fastify / Hono / etc.)
- **Storage (optional):** S3/R2 if you store screenshots (MVP can avoid by sending only OCR text)

---

## 3) Database setup
### Extensions
```sql
create extension if not exists postgis;
create extension if not exists pg_trgm;
Key enums
visibility: private | unlisted | public

save_status: want | been

import_source: instagram_url | tiktok_url | google_maps_url | screenshot

import_status: pending | processing | needs_user_input | resolved | failed

4) Database schema (Postgres)
Use the SQL below as your backend/db/schema.sql (or split into migrations).
UUID generation: use gen_random_uuid() (requires pgcrypto); Supabase supports it by default.
If needed: create extension if not exists pgcrypto;

4.1 Tables + relationships overview
app_users (1) — owns — (N) lists

lists (1) — contains — (N) list_items

places (1) — referenced by — (N) list_items

tags (1) — per-user — (N) list_item_tags

imports (N) — per-user — (1) resolved places (optional)

4.2 Full schema (MVP)
-- Extensions
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- Enums
do $$ begin
  create type visibility as enum ('private', 'unlisted', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type save_status as enum ('want', 'been');
exception when duplicate_object then null; end $$;

do $$ begin
  create type import_source as enum ('instagram_url', 'tiktok_url', 'google_maps_url', 'screenshot');
exception when duplicate_object then null; end $$;

do $$ begin
  create type import_status as enum ('pending', 'processing', 'needs_user_input', 'resolved', 'failed');
exception when duplicate_object then null; end $$;

-- Users (auth provider owns identities; keep app profile here)
create table if not exists app_users (
  id uuid primary key,
  handle text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists user_settings (
  user_id uuid primary key references app_users(id) on delete cascade,
  home_city text,
  home_country text,
  default_visibility visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Canonical places
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_norm text not null,          -- normalized for dedupe/search
  address_line1 text,
  city text,
  region text,
  country text,
  postal_code text,
  lat double precision not null,
  lng double precision not null,
  geo geography(Point, 4326) not null,
  phone text,
  website_url text,

  -- best-effort dedupe key (computed server-side)
  dedupe_key text unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists places_geo_gix on places using gist (geo);
create index if not exists places_name_trgm on places using gin (name gin_trgm_ops);
create index if not exists places_city_trgm on places using gin (city gin_trgm_ops);

-- Place provenance (optional but recommended)
create table if not exists place_sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  source_type text not null,   -- e.g. 'apple_maps', 'osm', 'google_places', 'manual'
  source_id text,              -- provider id if available
  url text,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);

-- Lists
create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references app_users(id) on delete cascade,
  title text not null,
  description text,
  visibility visibility not null default 'private',
  slug text, -- set when sharing (unlisted/public)
  is_featured boolean not null default false, -- for Sami’s Guide featured lists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, slug)
);

create index if not exists lists_owner_idx on lists(owner_user_id);

-- Items saved in lists
create table if not exists list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  added_by_user_id uuid not null references app_users(id) on delete cascade,

  status save_status not null default 'want',
  position int,
  note text,
  rating smallint, -- 1..5
  visited_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (list_id, place_id)
);

create index if not exists list_items_list_idx on list_items(list_id);
create index if not exists list_items_place_idx on list_items(place_id);

-- Tags
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  name_norm text not null,
  created_at timestamptz not null default now(),
  unique (owner_user_id, name_norm)
);

create table if not exists list_item_tags (
  list_item_id uuid not null references list_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (list_item_id, tag_id)
);

-- Imports
create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,

  source import_source not null,
  source_url text,
  screenshot_storage_path text,
  ocr_text text,

  status import_status not null default 'pending',
  resolved_place_id uuid references places(id),

  debug jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists imports_user_idx on imports(user_id);
create index if not exists imports_status_idx on imports(status);
5) Dedupe strategy (MVP)
Goal
Avoid creating duplicates when different users save the same place.

dedupe_key (server-computed)
Compute from normalized fields:

name_norm (lowercase, remove punctuation, collapse whitespace)

city_norm (lowercase)

rounded coordinates (e.g. 4 decimals ≈ 11m)

Example:

dedupe_key = `${name_norm}|${city_norm}|${round(lat,4)}|${round(lng,4)}`
Upsert rules
If place_sources (source_type, source_id) exists → return that place

Else if places.dedupe_key exists → return that place

Else create a new place

6) API conventions
Base URL + versioning
/v1/... for authenticated APIs

/public/... for shareable/public content

Auth
Authorization: Bearer <token>

Backend verifies token and sets req.user_id

Response envelope
Use plain JSON objects; keep it simple.

Error format (standardize this)
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "rating must be between 1 and 5",
    "details": { "field": "rating" }
  }
}
Common HTTP codes
200 success

201 created

400 validation

401 unauthenticated

403 forbidden (not owner)

404 not found

409 conflict (duplicate/unique constraint)

429 rate limited

500 server error

Rate limiting (MVP)
Apply per-user and/or per-IP:

POST /v1/places/upsert (protect from abuse)

POST /v1/imports (protect spam)

7) API endpoints (MVP)
7.1 Health
GET /health
Response

{ "ok": true }
7.2 User bootstrap
POST /v1/me/bootstrap
Creates the app_users row if missing and ensures default lists exist.

Response

{
  "user": {
    "id": "uuid",
    "handle": "sami",
    "display_name": "Sami"
  },
  "default_lists": {
    "want": "uuid",
    "been": "uuid"
  },
  "settings": {
    "home_city": "Madrid",
    "home_country": "ES",
    "default_visibility": "private"
  }
}
Server behavior

app_users.id = auth_user_id

If missing: create app_users

If missing: create default lists titled Want to Try and Been

7.3 Lists
GET /v1/lists
Returns user’s lists (default first).

Response

{
  "lists": [
    {
      "id": "uuid",
      "title": "Want to Try",
      "visibility": "private",
      "item_count": 12,
      "updated_at": "2026-02-09T10:00:00Z"
    }
  ]
}
POST /v1/lists
Body

{
  "title": "Rooftops",
  "description": "Best rooftops in the city",
  "visibility": "private"
}
Response

{ "id": "uuid" }
GET /v1/lists/:id
Response

{
  "list": {
    "id": "uuid",
    "title": "Want to Try",
    "visibility": "private"
  },
  "items": [
    {
      "list_item_id": "uuid",
      "status": "want",
      "note": "",
      "rating": null,
      "visited_at": null,
      "place": {
        "id": "uuid",
        "name": "Bar X",
        "address_line1": "Calle ...",
        "city": "Madrid",
        "lat": 40.41,
        "lng": -3.70
      },
      "tags": ["cocktails", "date night"]
    }
  ]
}
PATCH /v1/lists/:id
Update title/description/visibility (owner only).

DELETE /v1/lists/:id
Deletes list and its items (owner only).

7.4 Places
POST /v1/places/upsert
Used after a user selects an MKMapItem in iOS.

Body

{
  "name": "Bar X",
  "address_line1": "Calle Example 1",
  "city": "Madrid",
  "region": "MD",
  "country": "ES",
  "postal_code": "28001",
  "lat": 40.4167,
  "lng": -3.7033,
  "phone": "+34...",
  "website_url": "https://...",
  "source": {
    "source_type": "apple_maps",
    "source_id": null,
    "url": "https://maps.apple.com/?address=..."
  }
}
Response

{ "place_id": "uuid" }
Server validation

name required

lat/lng within valid range

truncate overly long strings (protect DB)

GET /v1/places/search (optional for MVP)
Only needed if you want server-side search. Otherwise iOS uses MapKit search.

Query:

q required

lat/lng/radius_m optional for relevance

Response

{
  "results": [
    { "id": "uuid", "name": "Bar X", "city": "Madrid", "lat": 40.41, "lng": -3.70 }
  ]
}
7.5 Saving items
POST /v1/lists/:id/items
Save a place into a list, plus optional tags.

Body

{
  "place_id": "uuid",
  "status": "want",
  "note": "",
  "tags": ["cocktails", "date night"]
}
Response

{ "list_item_id": "uuid" }
Behavior

Enforces (list_id, place_id) uniqueness

Upserts tags by (owner_user_id, name_norm)

Creates rows in list_item_tags

PATCH /v1/list-items/:id
Update status + review fields.

Body

{
  "status": "been",
  "rating": 5,
  "note": "Amazing martini",
  "visited_at": "2026-02-08"
}
Response

{ "ok": true }
DELETE /v1/list-items/:id
Remove saved place from the list.

7.6 Imports (IG URL + OCR text)
POST /v1/imports
Creates an import draft.

Body

{
  "source": "instagram_url",
  "source_url": "https://www.instagram.com/reel/..."
}
Response

{ "import_id": "uuid", "status": "needs_user_input" }
GET /v1/imports/:id
Returns draft state for resuming.

Response

{
  "import": {
    "id": "uuid",
    "source": "instagram_url",
    "source_url": "https://...",
    "ocr_text": null,
    "status": "needs_user_input",
    "resolved_place_id": null
  }
}
POST /v1/imports/:id/ocr
Attach OCR text from on-device Vision.

Body

{ "ocr_text": "BAR X\nMadrid\n..." }
Response

{
  "status": "needs_user_input",
  "suggested_queries": ["Bar X Madrid", "Bar X"]
}
POST /v1/imports/:id/resolve
User confirms the venue and where to save it.

Body

{
  "place_id": "uuid",
  "save_to_list_id": "uuid"
}
Response

{ "status": "resolved", "saved_list_item_id": "uuid" }
Behavior

Validates import belongs to user

Saves the place into the chosen list

Sets imports.status=resolved and resolved_place_id

7.7 Public endpoints (for guide + sharing)
GET /public/featured
Return featured lists (Sami’s Guide)

Response

{
  "lists": [
    {
      "title": "Best Tapas",
      "slug": "best-tapas",
      "owner_handle": "sami"
    }
  ]
}
GET /public/lists/:owner_handle/:slug
Return a shareable list page data.

Response

{
  "list": {
    "title": "Best Tapas",
    "description": "",
    "owner_handle": "sami",
    "visibility": "public"
  },
  "items": [
    { "place": { "name": "Casa X", "city": "Madrid", "lat": 40.4, "lng": -3.7 } }
  ]
}
8) Authorization rules (must enforce)
A user can only CRUD:

their own lists

their own list_items

their own imports

their own tags

places are canonical and shared; users can upsert, but cannot delete.

Public list endpoints only return lists where visibility != private.

9) If using Supabase: suggested RLS (optional)
If you implement the API server-side and don’t expose direct DB access to clients, you can skip RLS initially.
If you plan to query Supabase directly from iOS/web, implement RLS early.

Example policies (sketch):

lists: owner_user_id = auth.uid()

list_items: join to lists where owner_user_id = auth.uid()

imports: user_id = auth.uid()

tags: owner_user_id = auth.uid()

places: read allowed to authenticated; inserts allowed; updates restricted to service role only

10) Environment variables (backend)
DATABASE_URL

AUTH_JWKS_URL (or provider-specific)

AUTH_ISSUER

AUTH_AUDIENCE

RATE_LIMIT_REDIS_URL (optional)

STORAGE_BUCKET + credentials (only if storing screenshots)

11) Minimal test plan (API)
Smoke tests (Postman/curl)
POST /v1/me/bootstrap returns default list IDs

POST /v1/places/upsert returns place_id

POST /v1/lists/:id/items returns list_item_id

GET /v1/lists/:id returns the saved item with place lat/lng

PATCH /v1/list-items/:id sets status=been and rating

POST /v1/imports creates draft

POST /v1/imports/:id/ocr sets text

POST /v1/imports/:id/resolve saves to list and resolves import

12) Implementation notes (to avoid common traps)
Always normalize strings server-side (name_norm, name_norm for tags)

Enforce rating bounds (1..5)

Enforce max length on notes (e.g. 2,000 chars)

Don’t store screenshots in MVP unless you truly need them; OCR on-device is faster and safer

Keep import “resolution” explicitly user-confirmed to avoid wrong saves

