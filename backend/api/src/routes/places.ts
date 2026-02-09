import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { computeDedupeKey } from "../helpers.js";

const router = Router();
router.use(authMiddleware);

// POST /v1/places/upsert — create or return a canonical place
router.post("/upsert", async (req, res) => {
  try {
    const { name, address, city, lat, lng, google_place_id, apple_place_id, google_maps_uri, photo_url, price_level, source } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const placeCity = city?.trim() || "Madrid";
    const dedupeKey = computeDedupeKey(name, placeCity, lat, lng);

    // Try to find existing by dedupe_key or provider IDs
    let existing = null;

    if (google_place_id) {
      const r = await pool.query("SELECT id FROM places WHERE google_place_id = $1", [google_place_id]);
      if (r.rows.length > 0) existing = r.rows[0];
    }

    if (!existing && apple_place_id) {
      const r = await pool.query("SELECT id FROM places WHERE apple_place_id = $1", [apple_place_id]);
      if (r.rows.length > 0) existing = r.rows[0];
    }

    if (!existing) {
      const r = await pool.query("SELECT id FROM places WHERE dedupe_key = $1", [dedupeKey]);
      if (r.rows.length > 0) existing = r.rows[0];
    }

    if (existing) {
      // Update with any new info
      const { rows } = await pool.query(
        `UPDATE places SET
           name = COALESCE($2, name),
           address = COALESCE($3, address),
           lat = COALESCE($4, lat),
           lng = COALESCE($5, lng),
           google_place_id = COALESCE($6, google_place_id),
           apple_place_id = COALESCE($7, apple_place_id),
           google_maps_uri = COALESCE($8, google_maps_uri),
           photo_url = COALESCE($9, photo_url),
           price_level = COALESCE($10, price_level)
         WHERE id = $1
         RETURNING id, name, address, city, lat, lng, dedupe_key, created_at`,
        [existing.id, name.trim(), address, lat, lng, google_place_id, apple_place_id, google_maps_uri, photo_url, price_level]
      );
      res.json({ place: rows[0], created: false });
      return;
    }

    // Create new place
    const { rows } = await pool.query(
      `INSERT INTO places (name, address, city, lat, lng, dedupe_key, google_place_id, apple_place_id, google_maps_uri, photo_url, price_level, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, name, address, city, lat, lng, dedupe_key, created_at`,
      [name.trim(), address, placeCity, lat, lng, dedupeKey, google_place_id, apple_place_id, google_maps_uri, photo_url, price_level, source || "manual"]
    );

    res.status(201).json({ place: rows[0], created: true });
  } catch (err) {
    console.error("[POST /v1/places/upsert]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /v1/places/search?q=...&lat=...&lng=...
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (!q) {
      res.status(400).json({ error: "q (search query) is required" });
      return;
    }

    let query: string;
    let params: (string | number)[];

    if (!isNaN(lat) && !isNaN(lng)) {
      // Search by name similarity + distance
      query = `
        SELECT id, name, address, city, lat, lng, photo_url, price_level,
               similarity(name, $1) AS sim,
               ST_Distance(geom, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography) AS dist_m
        FROM places
        WHERE name % $1 OR name ILIKE $4
        ORDER BY sim DESC, dist_m ASC NULLS LAST
        LIMIT 20`;
      params = [q, lat, lng, `%${q}%`];
    } else {
      query = `
        SELECT id, name, address, city, lat, lng, photo_url, price_level,
               similarity(name, $1) AS sim
        FROM places
        WHERE name % $1 OR name ILIKE $2
        ORDER BY sim DESC
        LIMIT 20`;
      params = [q, `%${q}%`];
    }

    const { rows } = await pool.query(query, params);
    res.json({ places: rows });
  } catch (err) {
    console.error("[GET /v1/places/search]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
