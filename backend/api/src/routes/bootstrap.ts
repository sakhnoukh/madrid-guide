import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { apiError } from "../lib/errors.js";
import { truncate, MAX } from "../lib/strings.js";

const router = Router();
router.use(authMiddleware);

// POST /v1/me/bootstrap — create user + default lists if missing
// Accepts optional body: { display_name?, handle?, home_city?, home_country? }
// Apple only provides the full name on first sign-in, so iOS sends it here.
router.post("/bootstrap", async (req, res) => {
  try {
    const userId = req.userId!;
    const { display_name, handle, home_city, home_country } = req.body ?? {};

    // Upsert app_users
    await pool.query(
      `INSERT INTO app_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
      [userId]
    );

    // If display_name or handle provided and current value is null, update
    if (display_name || handle) {
      await pool.query(
        `UPDATE app_users SET
           display_name = COALESCE(NULLIF(app_users.display_name, ''), $2),
           handle       = COALESCE(app_users.handle, $3)
         WHERE id = $1`,
        [userId, truncate(display_name?.trim(), MAX.NAME) || null, truncate(handle?.trim(), MAX.NAME) || null]
      );
    }

    // Upsert user_settings (with optional home_city/country on first call)
    await pool.query(
      `INSERT INTO user_settings (user_id, home_city, home_country)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
         home_city    = COALESCE(NULLIF(user_settings.home_city, ''), EXCLUDED.home_city),
         home_country = COALESCE(NULLIF(user_settings.home_country, ''), EXCLUDED.home_country)`,
      [userId, truncate(home_city?.trim(), MAX.CITY) || null, truncate(home_country?.trim(), MAX.COUNTRY) || null]
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
