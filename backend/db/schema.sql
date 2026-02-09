-- v1 schema for Sami's Guide multi-user backend
-- Requires: Postgres 15+ with PostGIS and pg_trgm extensions
-- Reference: docs/API_DB.md

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

-- ============================================================
-- PLACES  (canonical venue record, deduplicated)
-- ============================================================
CREATE TABLE IF NOT EXISTS places (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  name_norm       TEXT NOT NULL,                       -- lowercase, no punctuation, for dedupe/search
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
  dedupe_key      TEXT UNIQUE,                         -- computed server-side
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS places_geo_gix ON places USING GIST (geo);
CREATE INDEX IF NOT EXISTS places_name_trgm ON places USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS places_city_trgm ON places USING GIN (city gin_trgm_ops);

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

-- ============================================================
-- LIST ITEMS  (user's save of a place into a list)
-- ============================================================
CREATE TABLE IF NOT EXISTS list_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id         UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  added_by_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status          save_status NOT NULL DEFAULT 'want',
  position        INT,
  note            TEXT,
  rating          SMALLINT CHECK (rating >= 1 AND rating <= 5),
  visited_at      DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (list_id, place_id)
);

CREATE INDEX IF NOT EXISTS list_items_list_idx ON list_items(list_id);
CREATE INDEX IF NOT EXISTS list_items_place_idx ON list_items(place_id);

-- ============================================================
-- TAGS  (per-user)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  name_norm       TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, name_norm)
);

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

-- ============================================================
-- Trigger: auto-compute geo from lat/lng on places
-- ============================================================
CREATE OR REPLACE FUNCTION places_set_geo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geo := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_places_geo
  BEFORE INSERT OR UPDATE OF lat, lng ON places
  FOR EACH ROW EXECUTE FUNCTION places_set_geo();

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_settings_updated BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_places_updated BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lists_updated BEFORE UPDATE ON lists FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_list_items_updated BEFORE UPDATE ON list_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_imports_updated BEFORE UPDATE ON imports FOR EACH ROW EXECUTE FUNCTION set_updated_at();
