-- v1 schema for Sami's Guide multi-user backend
-- Requires: Postgres 15+ with PostGIS, pg_trgm, pgcrypto
-- Reference: docs/PR1_BACKEND.md

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Enums
-- ============================================================
DO $$ BEGIN
  CREATE TYPE visibility AS ENUM ('private', 'unlisted', 'public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE save_status AS ENUM ('want', 'been');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE import_source AS ENUM ('instagram_url', 'tiktok_url', 'google_maps_url', 'screenshot');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE import_status AS ENUM ('pending', 'processing', 'needs_user_input', 'resolved', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Shared helpers
-- ============================================================
CREATE OR REPLACE FUNCTION normalize_text(input TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT trim(regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS app_users (
  id            UUID PRIMARY KEY,           -- = auth provider user id
  handle        TEXT UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id             UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  home_city           TEXT,
  home_country        TEXT,
  default_visibility  visibility NOT NULL DEFAULT 'private',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PLACES  (canonical venue record, deduplicated)
-- ============================================================
CREATE TABLE IF NOT EXISTS places (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  name_norm       TEXT NOT NULL,
  address_line1   TEXT,
  city            TEXT,
  region          TEXT,
  country         TEXT,
  postal_code     TEXT,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  geo             GEOGRAPHY(Point, 4326) NOT NULL,
  phone           TEXT,
  website_url     TEXT,
  dedupe_key      TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS places_geo_gix ON places USING GIST (geo);
CREATE INDEX IF NOT EXISTS places_name_trgm ON places USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS places_city_trgm ON places USING GIN (city gin_trgm_ops);

-- Auto-set name_norm + geo from lat/lng
CREATE OR REPLACE FUNCTION places_set_derived_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name_norm := normalize_text(NEW.name);
  NEW.geo := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS places_derived_fields ON places;
CREATE TRIGGER places_derived_fields
  BEFORE INSERT OR UPDATE OF name, lat, lng ON places
  FOR EACH ROW EXECUTE FUNCTION places_set_derived_fields();

DROP TRIGGER IF EXISTS places_updated_at ON places;
CREATE TRIGGER places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Place provenance (track where a place record came from)
CREATE TABLE IF NOT EXISTS place_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  source_type   TEXT NOT NULL,            -- 'apple_maps', 'osm', 'google_places', 'manual'
  source_id     TEXT,                     -- provider id if available
  url           TEXT,
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id)
);

-- ============================================================
-- LISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS lists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  visibility      visibility NOT NULL DEFAULT 'private',
  slug            TEXT,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, slug)
);

CREATE INDEX IF NOT EXISTS lists_owner_idx ON lists(owner_user_id);

DROP TRIGGER IF EXISTS lists_updated_at ON lists;
CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- LIST ITEMS  (user's save of a place into a list)
-- ============================================================
CREATE TABLE IF NOT EXISTS list_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id          UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  place_id         UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status           save_status NOT NULL DEFAULT 'want',
  position         INT,
  note             TEXT,
  rating           SMALLINT,
  visited_at       DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, place_id)
);

CREATE INDEX IF NOT EXISTS list_items_list_idx ON list_items(list_id);
CREATE INDEX IF NOT EXISTS list_items_place_idx ON list_items(place_id);

DROP TRIGGER IF EXISTS list_items_updated_at ON list_items;
CREATE TRIGGER list_items_updated_at
  BEFORE UPDATE ON list_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TAGS  (per-user, with auto name_norm)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  name_norm       TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, name_norm)
);

CREATE OR REPLACE FUNCTION tags_set_name_norm()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name_norm := normalize_text(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tags_name_norm ON tags;
CREATE TRIGGER tags_name_norm
  BEFORE INSERT OR UPDATE OF name ON tags
  FOR EACH ROW EXECUTE FUNCTION tags_set_name_norm();

CREATE TABLE IF NOT EXISTS list_item_tags (
  list_item_id UUID NOT NULL REFERENCES list_items(id) ON DELETE CASCADE,
  tag_id       UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (list_item_id, tag_id)
);

-- ============================================================
-- IMPORTS  (state machine for IG / screenshot intake)
-- ============================================================
CREATE TABLE IF NOT EXISTS imports (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source                  import_source NOT NULL,
  source_url              TEXT,
  screenshot_storage_path TEXT,
  ocr_text                TEXT,
  status                  import_status NOT NULL DEFAULT 'pending',
  resolved_place_id       UUID REFERENCES places(id),
  debug                   JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS imports_user_idx ON imports(user_id);
CREATE INDEX IF NOT EXISTS imports_status_idx ON imports(status);

DROP TRIGGER IF EXISTS imports_updated_at ON imports;
CREATE TRIGGER imports_updated_at
  BEFORE UPDATE ON imports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
