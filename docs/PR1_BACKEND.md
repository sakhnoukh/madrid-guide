# PR1_BACKEND_IMPLEMENTATION.md
> Implements Windsurf’s PR1: schema + API endpoints (auth can be mocked).
> PR2 (real Supabase Auth / Sign in with Apple) comes after these endpoints work end-to-end.

---

## A) Database (backend/db/schema.sql)

### A1) Required extensions
```sql
create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;
A2) Enums
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
A3) Normalization helper (name_norm)
Goal: consistent dedupe + search for places/tags.

create or replace function normalize_text(input text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', ' ', 'g'));
$$;
A4) updated_at trigger (shared)
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
A5) Tables
app_users
create table if not exists app_users (
  id uuid primary key,
  handle text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
user_settings
create table if not exists user_settings (
  user_id uuid primary key references app_users(id) on delete cascade,
  home_city text,
  home_country text,
  default_visibility visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_settings_updated_at on user_settings;
create trigger user_settings_updated_at
before update on user_settings
for each row execute function set_updated_at();
places (with geo + auto trigger + name_norm)
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_norm text not null,
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
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists places_geo_gix on places using gist (geo);
create index if not exists places_name_trgm on places using gin (name gin_trgm_ops);
create index if not exists places_city_trgm on places using gin (city gin_trgm_ops);

-- Auto-set name_norm + geo from lat/lng
create or replace function places_set_derived_fields()
returns trigger
language plpgsql
as $$
begin
  new.name_norm := normalize_text(new.name);
  new.geo := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

drop trigger if exists places_derived_fields on places;
create trigger places_derived_fields
before insert or update of name, lat, lng on places
for each row execute function places_set_derived_fields();

drop trigger if exists places_updated_at on places;
create trigger places_updated_at
before update on places
for each row execute function set_updated_at();
place_sources (provenance)
create table if not exists place_sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  source_type text not null,   -- 'apple_maps', 'osm', 'google_places', 'manual'
  source_id text,
  url text,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)
);
lists
create table if not exists lists (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references app_users(id) on delete cascade,
  title text not null,
  description text,
  visibility visibility not null default 'private',
  slug text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, slug)
);

create index if not exists lists_owner_idx on lists(owner_user_id);

drop trigger if exists lists_updated_at on lists;
create trigger lists_updated_at
before update on lists
for each row execute function set_updated_at();
list_items
create table if not exists list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  added_by_user_id uuid not null references app_users(id) on delete cascade,
  status save_status not null default 'want',
  position int,
  note text,
  rating smallint,
  visited_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, place_id)
);

create index if not exists list_items_list_idx on list_items(list_id);
create index if not exists list_items_place_idx on list_items(place_id);

drop trigger if exists list_items_updated_at on list_items;
create trigger list_items_updated_at
before update on list_items
for each row execute function set_updated_at();
tags + list_item_tags (per-user tags with name_norm)
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  name_norm text not null,
  created_at timestamptz not null default now(),
  unique (owner_user_id, name_norm)
);

create or replace function tags_set_name_norm()
returns trigger
language plpgsql
as $$
begin
  new.name_norm := normalize_text(new.name);
  return new;
end;
$$;

drop trigger if exists tags_name_norm on tags;
create trigger tags_name_norm
before insert or update of name on tags
for each row execute function tags_set_name_norm();

create table if not exists list_item_tags (
  list_item_id uuid not null references list_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (list_item_id, tag_id)
);
imports
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

drop trigger if exists imports_updated_at on imports;
create trigger imports_updated_at
before update on imports
for each row execute function set_updated_at();
B) API (18 endpoints across 6 route files)
B1) Shared utilities (required)
Create:

backend/api/src/lib/errors.ts

backend/api/src/lib/strings.ts

backend/api/src/lib/validation.ts

Standard error shape

return res.status(code).json({
  error: { code: "VALIDATION_ERROR", message: "…", details: { field: "…" } }
})
String truncation rules (MVP)

name/title: 120

address/city/region/country/postal: 120

phone/url: 250

note: 2000

ocr_text: 20000
Always truncate server-side before insert/update.

Normalization

Use DB normalize_text() for triggers

In app logic also normalize when computing dedupe_key (see below)

B2) Auth in PR1 (mock OK)
Until PR2, implement a temp middleware:

If Authorization present → set req.userId = <fixed uuid or header value>

Else return 401

You just need consistency so smoke tests pass.

C) Route files + endpoint behavior
C1) bootstrap.ts
POST /v1/me/bootstrap
Behavior

Ensure app_users row exists for req.userId

Ensure user_settings row exists

Ensure default lists exist (Want to Try, Been)

Return user + default list IDs + settings

Idempotent (calling twice should not create duplicates)

C2) lists.ts
GET /v1/lists
Return user’s lists, with item_count and updated_at.

POST /v1/lists
Create list (owner = user).

GET /v1/lists/:id
Return list + items:

join list_items → places

include tags for each item

PATCH /v1/lists/:id
Update title/description/visibility/slug (owner only).

DELETE /v1/lists/:id
Delete list (owner only).

POST /v1/lists/:id/items
Save a place into the list:

Validate list belongs to user

Insert list_items (unique list_id+place_id)

Upsert tags (owner_user_id + name_norm)

Insert list_item_tags

C3) places.ts
POST /v1/places/upsert
Input: place fields + optional source.
Behavior

Compute dedupe_key:
normalize(name) | normalize(city) | round(lat,4) | round(lng,4)

If source_type+source_id exists in place_sources → return that place_id

Else if dedupe_key exists in places → return that place_id

Else insert into places (trigger sets geo + name_norm)

If source provided → insert place_sources row

GET /v1/places/search
Optional server-side search (you can ship but iOS can rely on MapKit).
Use trigram search on places.name and filter by proximity if lat/lng provided.

C4) listItems.ts
PATCH /v1/list-items/:id
Owner check via join list_items → lists.owner_user_id.
Update: status, rating (1..5), note, visited_at.

DELETE /v1/list-items/:id
Owner check, then delete.

C5) imports.ts
POST /v1/imports
Create import row:

status = needs_user_input (for url)

status = pending (for screenshot) if you want, but simplest: needs_user_input always

GET /v1/imports/:id
Return import (must belong to user).

POST /v1/imports/:id/ocr
Set ocr_text, set status=needs_user_input.
Return suggested_queries (simple heuristic):

take top lines/words, or just return [ocr_text.slice(0,60)] for MVP.

POST /v1/imports/:id/resolve
Validate import belongs to user.

Save place to chosen list (re-use lists/:id/items logic)

Set import status=resolved, resolved_place_id

Return saved_list_item_id

C6) public.ts
GET /public/featured
Return lists where is_featured=true and visibility != private.

GET /public/lists/:handle/:slug
Return list + items for a user handle and slug, only if visibility != private.

D) Smoke tests (must pass before PR2)
You should be able to:

bootstrap → get default list IDs

upsert place → get place_id

save to list → get list_item_id

GET list detail → see place + tags

PATCH list item → mark been + rating

create import → attach ocr → resolve import → item saved

E) What PR2 adds (later)
Real JWT verification (Supabase Auth)

RLS if you query Supabase directly from clients

Remove mock user middleware


---

### So, what’s the immediate next step *right now*?

**Implement the schema triggers (places geo + name_norm) and the first 3 endpoints:**
- `POST /v1/me/bootstrap`
- `POST /v1/places/upsert`
- `POST /v1/lists/:id/items`
