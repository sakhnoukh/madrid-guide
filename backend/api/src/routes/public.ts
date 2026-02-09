import { Router } from "express";
import { pool } from "../db.js";
import { apiError } from "../lib/errors.js";

const router = Router();

// GET /public/featured — return featured lists (Sami's Guide)
router.get("/featured", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.title, l.slug, l.description, l.created_at,
              u.handle AS owner_handle, u.display_name AS owner_name,
              (SELECT count(*) FROM list_items li WHERE li.list_id = l.id)::int AS item_count
       FROM lists l
       JOIN app_users u ON u.id = l.owner_user_id
       WHERE l.is_featured = true AND l.visibility != 'private'
       ORDER BY l.created_at DESC`
    );
    res.json({ lists: rows });
  } catch (err) {
    console.error("[GET /public/featured]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// GET /public/lists/:owner_handle/:slug — shareable list page
router.get("/lists/:owner_handle/:slug", async (req, res) => {
  try {
    const { owner_handle, slug } = req.params;

    const listResult = await pool.query(
      `SELECT l.id, l.title, l.description, l.visibility, l.slug,
              u.handle AS owner_handle, u.display_name AS owner_name
       FROM lists l
       JOIN app_users u ON u.id = l.owner_user_id
       WHERE u.handle = $1 AND l.slug = $2 AND l.visibility != 'private'`,
      [owner_handle, slug]
    );

    if (listResult.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "List not found"));
      return;
    }

    const list = listResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT li.id AS list_item_id, li.status,
              jsonb_build_object(
                'id', p.id, 'name', p.name, 'address_line1', p.address_line1,
                'city', p.city, 'lat', p.lat, 'lng', p.lng
              ) AS place
       FROM list_items li
       JOIN places p ON p.id = li.place_id
       WHERE li.list_id = $1
       ORDER BY li.position ASC NULLS LAST, li.created_at DESC`,
      [list.id]
    );

    res.json({
      list: {
        title: list.title,
        description: list.description,
        owner_handle: list.owner_handle,
        visibility: list.visibility,
      },
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error("[GET /public/lists/:handle/:slug]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

export default router;
