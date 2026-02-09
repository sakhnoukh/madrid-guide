import { Router } from "express";
import { pool } from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { apiError, normalizeName } from "../helpers.js";

const router = Router();
router.use(authMiddleware);

const VALID_SOURCES = ["instagram_url", "tiktok_url", "google_maps_url", "screenshot"];

// POST /v1/imports — create an import draft
router.post("/", async (req, res) => {
  try {
    const { source, source_url } = req.body;

    if (!source || !VALID_SOURCES.includes(source)) {
      res.status(400).json(apiError("VALIDATION_ERROR", `source must be one of: ${VALID_SOURCES.join(", ")}`, { field: "source" }));
      return;
    }

    const initialStatus = source === "screenshot" ? "pending" : "needs_user_input";

    const { rows } = await pool.query(
      `INSERT INTO imports (user_id, source, source_url, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status`,
      [req.userId, source, source_url || null, initialStatus]
    );

    res.status(201).json({
      import_id: rows[0].id,
      status: rows[0].status,
    });
  } catch (err) {
    console.error("[POST /v1/imports]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// GET /v1/imports/:id — get import draft state
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT id, source, source_url, ocr_text, status, resolved_place_id, created_at, updated_at
       FROM imports
       WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    if (rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "Import not found"));
      return;
    }

    res.json({ import: rows[0] });
  } catch (err) {
    console.error("[GET /v1/imports/:id]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// POST /v1/imports/:id/ocr — attach OCR text from on-device Vision
router.post("/:id/ocr", async (req, res) => {
  try {
    const { id } = req.params;
    const { ocr_text } = req.body;

    if (!ocr_text || typeof ocr_text !== "string") {
      res.status(400).json(apiError("VALIDATION_ERROR", "ocr_text is required", { field: "ocr_text" }));
      return;
    }

    // Verify ownership and status
    const check = await pool.query(
      "SELECT id, status FROM imports WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    if (check.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "Import not found"));
      return;
    }

    // Update with OCR text
    await pool.query(
      `UPDATE imports SET ocr_text = $2, status = 'needs_user_input' WHERE id = $1`,
      [id, ocr_text]
    );

    // Generate suggested search queries from OCR text
    const lines = ocr_text
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 2 && l.length < 60);

    const suggestedQueries = lines.slice(0, 3).map((l: string) => `${l} Madrid`);

    res.json({
      status: "needs_user_input",
      suggested_queries: suggestedQueries,
    });
  } catch (err) {
    console.error("[POST /v1/imports/:id/ocr]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

// POST /v1/imports/:id/resolve — user confirms venue and saves
router.post("/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { place_id, save_to_list_id } = req.body;

    if (!place_id) {
      res.status(400).json(apiError("VALIDATION_ERROR", "place_id is required", { field: "place_id" }));
      return;
    }
    if (!save_to_list_id) {
      res.status(400).json(apiError("VALIDATION_ERROR", "save_to_list_id is required", { field: "save_to_list_id" }));
      return;
    }

    // Verify import belongs to user
    const importCheck = await pool.query(
      "SELECT id, status FROM imports WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    if (importCheck.rows.length === 0) {
      res.status(404).json(apiError("NOT_FOUND", "Import not found"));
      return;
    }

    // Verify list belongs to user
    const listCheck = await pool.query(
      "SELECT id FROM lists WHERE id = $1 AND owner_user_id = $2",
      [save_to_list_id, req.userId]
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

    // Save place to list
    const { rows: itemRows } = await pool.query(
      `INSERT INTO list_items (list_id, place_id, added_by_user_id, status)
       VALUES ($1, $2, $3, 'want')
       ON CONFLICT (list_id, place_id) DO UPDATE SET updated_at = now()
       RETURNING id`,
      [save_to_list_id, place_id, req.userId]
    );

    // Mark import as resolved
    await pool.query(
      `UPDATE imports SET status = 'resolved', resolved_place_id = $2 WHERE id = $1`,
      [id, place_id]
    );

    res.json({
      status: "resolved",
      saved_list_item_id: itemRows[0].id,
    });
  } catch (err) {
    console.error("[POST /v1/imports/:id/resolve]", err);
    res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
  }
});

export default router;
