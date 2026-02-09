import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// GET /v1/lists — all lists for the authenticated user
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, slug, is_default, is_public, position, created_at, updated_at
       FROM lists
       WHERE user_id = $1
       ORDER BY is_default DESC, position ASC, created_at ASC`,
      [req.userId]
    );
    res.json({ lists: rows });
  } catch (err) {
    console.error("[GET /v1/lists]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /v1/lists — create a new list
router.post("/", async (req, res) => {
  try {
    const { name, is_public } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { rows } = await pool.query(
      `INSERT INTO lists (user_id, name, slug, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, slug, is_default, is_public, position, created_at`,
      [req.userId, name.trim(), slug, is_public ?? false]
    );

    res.status(201).json({ list: rows[0] });
  } catch (err) {
    console.error("[POST /v1/lists]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /v1/lists/:id — single list with its items
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const listResult = await pool.query(
      `SELECT id, name, slug, is_default, is_public, position, created_at, updated_at
       FROM lists
       WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    if (listResult.rows.length === 0) {
      res.status(404).json({ error: "List not found" });
      return;
    }

    const itemsResult = await pool.query(
      `SELECT li.id, li.place_id, li.status, li.rating, li.note, li.visited_at,
              li.position, li.created_at,
              p.name AS place_name, p.address, p.lat, p.lng, p.photo_url, p.price_level
       FROM list_items li
       JOIN places p ON p.id = li.place_id
       WHERE li.list_id = $1
       ORDER BY li.position ASC, li.created_at DESC`,
      [id]
    );

    res.json({
      list: listResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error("[GET /v1/lists/:id]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /v1/lists/:id/items — save a place into a list
router.post("/:id/items", async (req, res) => {
  try {
    const { id: listId } = req.params;
    const { place_id, status, note, tags } = req.body;

    if (!place_id) {
      res.status(400).json({ error: "place_id is required" });
      return;
    }

    // Verify list belongs to user
    const listCheck = await pool.query(
      "SELECT id FROM lists WHERE id = $1 AND user_id = $2",
      [listId, req.userId]
    );
    if (listCheck.rows.length === 0) {
      res.status(404).json({ error: "List not found" });
      return;
    }

    // Verify place exists
    const placeCheck = await pool.query("SELECT id FROM places WHERE id = $1", [place_id]);
    if (placeCheck.rows.length === 0) {
      res.status(404).json({ error: "Place not found" });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO list_items (list_id, place_id, user_id, status, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (list_id, place_id) DO UPDATE SET
         status = COALESCE(EXCLUDED.status, list_items.status),
         note = COALESCE(EXCLUDED.note, list_items.note),
         updated_at = now()
       RETURNING id, list_id, place_id, status, rating, note, position, created_at`,
      [listId, place_id, req.userId, status || "want", note || null]
    );

    // Handle tags if provided
    if (Array.isArray(tags) && tags.length > 0) {
      const listItemId = rows[0].id;
      for (const tagName of tags) {
        const cleaned = tagName.toLowerCase().trim();
        if (!cleaned) continue;
        // Upsert tag
        const tagResult = await pool.query(
          `INSERT INTO tags (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [cleaned]
        );
        // Link tag to list item
        await pool.query(
          `INSERT INTO list_item_tags (list_item_id, tag_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [listItemId, tagResult.rows[0].id]
        );
      }
    }

    res.status(201).json({ item: rows[0] });
  } catch (err) {
    console.error("[POST /v1/lists/:id/items]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
