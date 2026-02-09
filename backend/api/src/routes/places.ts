import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { apiError } from "../lib/errors.js";
import { normalizeText, computeDedupeKey, truncate, MAX } from "../lib/strings.js";
import { isValidLat, isValidLng } from "../lib/validation.js";

const router = Router();
router.use(authMiddleware);

// POST /v1/places/upsert — create or return a canonical place
router.post("/upsert", async (req, res) => {
  try {
    const {
      name, address_line1, city, region, country, postal_code,
      lat, lng, phone, website_url, source,
    } = req.body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(apiError("VALIDATION_ERROR", "name is required", { field: "name" }));
      return;
    }
    if (!isValidLat(lat)) {
      res.status(400).json(apiError("VALIDATION_ERROR", "lat must be a number between -90 and 90", { field: "lat" }));
      return;
    }
    if (!isValidLng(lng)) {
      res.status(400).json(apiError("VALIDATION_ERROR", "lng must be a number between -180 and 180", { field: "lng" }));
      return;
    }

    const nameNorm = normalizeText(name);
    const placeCity = city?.trim() || null;
    const dedupeKey = computeDedupeKey(name, placeCity || "", lat, lng);

    // 1) Check place_sources if source provided
    let existingPlaceId: string | null = null;

    if (source?.source_type && source?.source_id) {
      const r = await pool.query(
        "SELECT place_id FROM place_sources WHERE source_type = $1 AND source_id = $2",
        [source.source_type, source.source_id]
      );
      if (r.rows.length > 0) existingPlaceId = r.rows[0].place_id;
    }

    // 2) Check dedupe_key
    if (!existingPlaceId) {
      const r = await pool.query("SELECT id FROM places WHERE dedupe_key = $1", [dedupeKey]);
      if (r.rows.length > 0) existingPlaceId = r.rows[0].id;
    }

    if (existingPlaceId) {
      // Update with any new info
      await pool.query(
        `UPDATE places SET
           name = COALESCE($2, name),
           name_norm = COALESCE($3, name_norm),
           address_line1 = COALESCE($4, address_line1),
           city = COALESCE($5, city),
           region = COALESCE($6, region),
           country = COALESCE($7, country),
           postal_code = COALESCE($8, postal_code),
           lat = $9, lng = $10,
           phone = COALESCE($11, phone),
           website_url = COALESCE($12, website_url)
         WHERE id = $1`,
        [existingPlaceId, truncate(name.trim(), MAX.NAME), nameNorm, truncate(address_line1, MAX.ADDRESS),
         truncate(placeCity, MAX.CITY), truncate(region, MAX.REGION), truncate(country, MAX.COUNTRY), truncate(postal_code, MAX.POSTAL),
         lat, lng, truncate(phone, MAX.PHONE), truncate(website_url, MAX.URL)]
      );
      res.json({ place_id: existingPlaceId });
      return;
    }

    // 3) Create new place
    const { rows } = await pool.query(
      `INSERT INTO places (name, name_norm, address_line1, city, region, country, postal_code, lat, lng, phone, website_url, dedupe_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [truncate(name.trim(), MAX.NAME), nameNorm, truncate(address_line1, MAX.ADDRESS), truncate(placeCity, MAX.CITY),
       truncate(region, MAX.REGION), truncate(country, MAX.COUNTRY), truncate(postal_code, MAX.POSTAL),
       lat, lng, truncate(phone, MAX.PHONE), truncate(website_url, MAX.URL), dedupeKey]
    );

    const placeId = rows[0].id;

    // 4) Insert source provenance if provided
    if (source?.source_type) {
      await pool.query(
        `INSERT INTO place_sources (place_id, source_type, source_id, url, raw)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (source_type, source_id) DO NOTHING`,
        [placeId, source.source_type, source.source_id || null,
         source.url || null, source.raw ? JSON.stringify(source.raw) : null]
      );
    }

    res.status(201).json({ place_id: placeId });
  } catch (err) {
    console.error("[POST /v1/places/upsert]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// GET /v1/places/search?q=...&lat=...&lng=...&radius_m=...
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusM = parseFloat(req.query.radius_m as string) || 15000;

    if (!q) {
      res.status(400).json(apiError("VALIDATION_ERROR", "q is required", { field: "q" }));
      return;
    }

    let query: string;
    let params: (string | number)[];

    if (!isNaN(lat) && !isNaN(lng)) {
      query = `
        SELECT id, name, address_line1, city, lat, lng,
               similarity(name, $1) AS sim,
               ST_Distance(geo, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography) AS dist_m
        FROM places
        WHERE (name % $1 OR name ILIKE $4)
          AND ST_DWithin(geo, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography, $5)
        ORDER BY sim DESC, dist_m ASC NULLS LAST
        LIMIT 20`;
      params = [q, lat, lng, `%${q}%`, radiusM];
    } else {
      query = `
        SELECT id, name, address_line1, city, lat, lng,
               similarity(name, $1) AS sim
        FROM places
        WHERE name % $1 OR name ILIKE $2
        ORDER BY sim DESC
        LIMIT 20`;
      params = [q, `%${q}%`];
    }

    const { rows } = await pool.query(query, params);
    res.json({ results: rows });
  } catch (err) {
    console.error("[GET /v1/places/search]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

export default router;
