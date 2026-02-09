-- v1 schema for Sami's Guide multi-user backend
-- Requires: Postgres 15+ with PostGIS and pg_trgm extensions

CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE app_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider TEXT NOT NULL,            -- 'apple', 'email'
  auth_sub      TEXT NOT NULL UNIQUE,     -- provider subject ID
  display_name  TEXT,
  handle        TEXT UNIQUE,
  email         TEXT,
  home_city     TEXT DEFAULT 'Madrid',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_users_auth ON app_users (auth_provider, auth_sub);

-- ============================================================
-- PLACES  (canonical venue record, deduplicated)
-- ============================================================
CREATE TABLE places (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key      TEXT UNIQUE,                       -- normalized name+city+rounded coords
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT DEFAULT 'Madrid',
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  geom            GEOMETRY(Point, 4326),             -- PostGIS point
  google_place_id TEXT,
  apple_place_id  TEXT,
  google_maps_uri TEXT,
  photo_url       TEXT,
  price_level     INT,
  source          TEXT DEFAULT 'manual',             -- 'manual', 'google', 'apple_maps'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_places_dedupe ON places (dedupe_key);
CREATE INDEX idx_places_geom ON places USING GIST (geom);
CREATE INDEX idx_places_name_trgm ON places USING GIN (name gin_trgm_ops);

-- ============================================================
-- LISTS
-- ============================================================
CREATE TABLE lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lists_user ON lists (user_id);

-- ============================================================
-- LIST ITEMS  (user's save of a place into a list)
-- ============================================================
CREATE TABLE list_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  place_id    UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'want',     -- 'want', 'been'
  rating      INT CHECK (rating >= 1 AND rating <= 5),
  note        TEXT,
  visited_at  DATE,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (list_id, place_id)
);

CREATE INDEX idx_list_items_list ON list_items (list_id);
CREATE INDEX idx_list_items_user ON list_items (user_id);
CREATE INDEX idx_list_items_place ON list_items (place_id);

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE list_item_tags (
  list_item_id UUID NOT NULL REFERENCES list_items(id) ON DELETE CASCADE,
  tag_id       UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (list_item_id, tag_id)
);

-- ============================================================
-- IMPORTS  (state machine for IG / screenshot intake)
-- ============================================================
CREATE TABLE imports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source        TEXT NOT NULL,              -- 'instagram_url', 'screenshot'
  source_url    TEXT,
  ocr_text      TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'needs_user_input', 'resolved', 'failed'
  resolved_place_id UUID REFERENCES places(id),
  resolved_list_item_id UUID REFERENCES list_items(id),
  error_reason  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_imports_user ON imports (user_id);
CREATE INDEX idx_imports_status ON imports (status);

-- ============================================================
-- Trigger: auto-compute geom from lat/lng on places
-- ============================================================
CREATE OR REPLACE FUNCTION places_set_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_places_geom
  BEFORE INSERT OR UPDATE OF lat, lng ON places
  FOR EACH ROW EXECUTE FUNCTION places_set_geom();

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

CREATE TRIGGER trg_app_users_updated BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_places_updated BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lists_updated BEFORE UPDATE ON lists FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_list_items_updated BEFORE UPDATE ON list_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_imports_updated BEFORE UPDATE ON imports FOR EACH ROW EXECUTE FUNCTION set_updated_at();
