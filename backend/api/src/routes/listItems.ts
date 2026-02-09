import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { apiError, truncate } from "../helpers.js";

const router = Router();
router.use(authMiddleware);

// PATCH /v1/list-items/:id — update status, rating, note, visited_at
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rating, note, visited_at } = req.body;

    // Verify ownership
    const check = await pool.query(
      "SELECT id FROM list_items WHERE id = $1 AND added_by_user_id = $2",
      [id, req.userId]
    );
    if (check.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "List item not found"));
      return;
    }

    // Validate rating
    if (rating !== undefined && rating !== null) {
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        res.status(400).json(apiError("VALIDATION_ERROR", "rating must be between 1 and 5", { field: "rating" }));
        return;
      }
    }

    // Validate status
    if (status !== undefined && !["want", "been"].includes(status)) {
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
      [id, status, rating, truncate(note, 2000), visited_at]
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

    const result = await pool.query(
      "DELETE FROM list_items WHERE id = $1 AND added_by_user_id = $2 RETURNING id",
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
