import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

// PATCH /v1/list-items/:id — update a list item (status, rating, note, visited_at)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rating, note, visited_at } = req.body;

    // Verify ownership
    const check = await pool.query(
      "SELECT id FROM list_items WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ error: "List item not found" });
      return;
    }

    // Validate rating
    if (rating !== undefined && rating !== null) {
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        res.status(400).json({ error: "rating must be 1-5" });
        return;
      }
    }

    // Validate status
    if (status !== undefined && !["want", "been"].includes(status)) {
      res.status(400).json({ error: "status must be 'want' or 'been'" });
      return;
    }

    const { rows } = await pool.query(
      `UPDATE list_items SET
         status     = COALESCE($2, status),
         rating     = COALESCE($3, rating),
         note       = COALESCE($4, note),
         visited_at = COALESCE($5, visited_at)
       WHERE id = $1
       RETURNING id, list_id, place_id, status, rating, note, visited_at, updated_at`,
      [id, status, rating, note, visited_at]
    );

    res.json({ item: rows[0] });
  } catch (err) {
    console.error("[PATCH /v1/list-items/:id]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
