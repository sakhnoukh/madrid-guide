import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { apiError } from "../lib/errors.js";
import { truncate, normalizeText, MAX } from "../lib/strings.js";
import { isValidStatus, isValidVisibility } from "../lib/validation.js";

const router = Router();
router.use(authMiddleware);

// GET /v1/lists — all lists for the authenticated user
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.title, l.description, l.visibility, l.slug, l.is_featured,
              l.created_at, l.updated_at,
              (SELECT count(*) FROM list_items li WHERE li.list_id = l.id)::int AS item_count
       FROM lists l
       WHERE l.owner_user_id = $1
       ORDER BY l.created_at ASC`,
      [req.userId]
    );
    res.json({ lists: rows });
  } catch (err) {
    console.error("[GET /v1/lists]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// POST /v1/lists — create a new list
router.post("/", async (req, res) => {
  try {
    const { title, description, visibility } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json(apiError("VALIDATION_ERROR", "title is required", { field: "title" }));
      return;
    }

    const vis = isValidVisibility(visibility) ? visibility : "private";

    const { rows } = await pool.query(
      `INSERT INTO lists (owner_user_id, title, description, visibility)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [req.userId, truncate(title.trim(), MAX.TITLE), truncate(description, MAX.DESCRIPTION), vis]
    );

    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    console.error("[POST /v1/lists]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// GET /v1/lists/:id — single list with its items + tags
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const listResult = await pool.query(
      `SELECT id, title, description, visibility, slug, is_featured, created_at, updated_at
       FROM lists
       WHERE id = $1 AND owner_user_id = $2`,
      [id, req.userId]
    );

    if (listResult.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "List not found"));
      return;
    }

    const itemsResult = await pool.query(
      `SELECT li.id AS list_item_id, li.status, li.note, li.rating, li.visited_at,
              li.position, li.created_at,
              jsonb_build_object(
                'id', p.id, 'name', p.name, 'address_line1', p.address_line1,
                'city', p.city, 'lat', p.lat, 'lng', p.lng
              ) AS place,
              COALESCE(
                (SELECT jsonb_agg(t.name ORDER BY t.name)
                 FROM list_item_tags lit JOIN tags t ON t.id = lit.tag_id
                 WHERE lit.list_item_id = li.id),
                '[]'::jsonb
              ) AS tags
       FROM list_items li
       JOIN places p ON p.id = li.place_id
       WHERE li.list_id = $1
       ORDER BY li.position ASC NULLS LAST, li.created_at DESC`,
      [id]
    );

    res.json({
      list: listResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error("[GET /v1/lists/:id]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// PATCH /v1/lists/:id — update title/description/visibility
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, visibility } = req.body;

    const check = await pool.query(
      "SELECT id FROM lists WHERE id = $1 AND owner_user_id = $2",
      [id, req.userId]
    );
    if (check.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "List not found"));
      return;
    }

    if (visibility && !isValidVisibility(visibility)) {
      res.status(400).json(apiError("VALIDATION_ERROR", "Invalid visibility", { field: "visibility" }));
      return;
    }

    await pool.query(
      `UPDATE lists SET
         title       = COALESCE($2, title),
         description = COALESCE($3, description),
         visibility  = COALESCE($4, visibility)
       WHERE id = $1`,
      [id, title?.trim() ? truncate(title.trim(), MAX.TITLE) : null, description !== undefined ? truncate(description, MAX.DESCRIPTION) : null, visibility || null]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /v1/lists/:id]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// DELETE /v1/lists/:id — delete list and its items
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM lists WHERE id = $1 AND owner_user_id = $2 RETURNING id",
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "List not found"));
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /v1/lists/:id]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// POST /v1/lists/:id/items — save a place into a list + optional tags
router.post("/:id/items", async (req, res) => {
  try {
    const { id: listId } = req.params;
    const { place_id, status, note, tags } = req.body;

    if (!place_id) {
      res.status(400).json(apiError("VALIDATION_ERROR", "place_id is required", { field: "place_id" }));
      return;
    }

    if (status && !isValidStatus(status)) {
      res.status(400).json(apiError("VALIDATION_ERROR", "status must be 'want' or 'been'", { field: "status" }));
      return;
    }

    // Verify list belongs to user
    const listCheck = await pool.query(
      "SELECT id FROM lists WHERE id = $1 AND owner_user_id = $2",
      [listId, req.userId]
    );
    if (listCheck.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "List not found"));
      return;
    }

    // Verify place exists
    const placeCheck = await pool.query("SELECT id FROM places WHERE id = $1", [place_id]);
    if (placeCheck.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "Place not found"));
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO list_items (list_id, place_id, added_by_user_id, status, note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (list_id, place_id) DO UPDATE SET
         status = COALESCE(EXCLUDED.status, list_items.status),
         note = COALESCE(EXCLUDED.note, list_items.note),
         updated_at = now()
       RETURNING id`,
      [listId, place_id, req.userId, status || "want", truncate(note, MAX.NOTE)]
    );

    const listItemId = rows[0].id;

    // Handle per-user tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const name = tagName.trim();
        if (!name) continue;
        const nameNorm = normalizeText(name);
        // Upsert tag (per-user)
        const tagResult = await pool.query(
          `INSERT INTO tags (owner_user_id, name, name_norm)
           VALUES ($1, $2, $3)
           ON CONFLICT (owner_user_id, name_norm) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [req.userId, name, nameNorm]
        );
        // Link tag to list item
        await pool.query(
          `INSERT INTO list_item_tags (list_item_id, tag_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [listItemId, tagResult.rows[0].id]
        );
      }
    }

    res.status(201).json({ list_item_id: listItemId });
  } catch (err) {
    console.error("[POST /v1/lists/:id/items]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

export default router;
