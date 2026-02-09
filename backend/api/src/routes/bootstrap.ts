import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { apiError } from "../helpers.js";

const router = Router();
router.use(authMiddleware);

// POST /v1/me/bootstrap — create user + default lists if missing
router.post("/bootstrap", async (req, res) => {
  try {
    const userId = req.userId!;

    // Upsert app_users
    await pool.query(
      `INSERT INTO app_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
      [userId]
    );

    // Upsert user_settings
    await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Ensure default lists exist
    const wantResult = await pool.query(
      `INSERT INTO lists (owner_user_id, title, slug)
       VALUES ($1, 'Want to Try', 'want-to-try')
       ON CONFLICT (owner_user_id, slug) DO UPDATE SET title = lists.title
       RETURNING id`,
      [userId]
    );
    const beenResult = await pool.query(
      `INSERT INTO lists (owner_user_id, title, slug)
       VALUES ($1, 'Been', 'been')
       ON CONFLICT (owner_user_id, slug) DO UPDATE SET title = lists.title
       RETURNING id`,
      [userId]
    );

    // Fetch user + settings
    const userRow = (await pool.query(
      `SELECT id, handle, display_name, avatar_url FROM app_users WHERE id = $1`, [userId]
    )).rows[0];

    const settingsRow = (await pool.query(
      `SELECT home_city, home_country, default_visibility FROM user_settings WHERE user_id = $1`, [userId]
    )).rows[0];

    res.json({
      user: {
        id: userRow.id,
        handle: userRow.handle,
        display_name: userRow.display_name,
      },
      default_lists: {
        want: wantResult.rows[0].id,
        been: beenResult.rows[0].id,
      },
      settings: {
        home_city: settingsRow?.home_city ?? null,
        home_country: settingsRow?.home_country ?? null,
        default_visibility: settingsRow?.default_visibility ?? "private",
      },
    });
  } catch (err) {
    console.error("[POST /v1/me/bootstrap]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

export default router;
