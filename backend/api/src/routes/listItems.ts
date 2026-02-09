import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { apiError } from "../lib/errors.js";
import { truncate, MAX } from "../lib/strings.js";
import { isValidRating, isValidStatus } from "../lib/validation.js";

const router = Router();
router.use(authMiddleware);

// PATCH /v1/list-items/:id — update status, rating, note, visited_at
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rating, note, visited_at } = req.body;

    // Verify ownership via join to lists.owner_user_id
    const check = await pool.query(
      `SELECT li.id FROM list_items li
       JOIN lists l ON l.id = li.list_id
       WHERE li.id = $1 AND l.owner_user_id = $2`,
      [id, req.userId]
    );
    if (check.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "List item not found"));
      return;
    }

    // Validate rating
    if (rating !== undefined && rating !== null) {
      if (!isValidRating(rating)) {
        res.status(400).json(apiError("VALIDATION_ERROR", "rating must be between 1 and 5", { field: "rating" }));
        return;
      }
    }

    // Validate status
    if (status !== undefined && !isValidStatus(status)) {
      res.status(400).json(apiError("VALIDATION_ERROR", "status must be 'want' or 'been'", { field: "status" }));
      return;
    }

    await pool.query(
      `UPDATE list_items SET
         status     = COALESCE($2, status),
         rating     = COALESCE($3, rating),
         note       = COALESCE($4, note),
         visited_at = COALESCE($5, visited_at)
       WHERE id = $1`,
      [id, status, rating, truncate(note, MAX.NOTE), visited_at]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /v1/list-items/:id]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// DELETE /v1/list-items/:id — remove saved place from list
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership via join to lists.owner_user_id
    const result = await pool.query(
      `DELETE FROM list_items li
       USING lists l
       WHERE li.list_id = l.id AND li.id = $1 AND l.owner_user_id = $2
       RETURNING li.id`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "List item not found"));
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /v1/list-items/:id]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

export default router;
