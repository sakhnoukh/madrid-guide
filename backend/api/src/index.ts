import "dotenv/config";
import express from "express";
import cors from "cors";
import bootstrapRouter from "./routes/bootstrap.js";
import listsRouter from "./routes/lists.js";
import placesRouter from "./routes/places.js";
import listItemsRouter from "./routes/listItems.js";
import importsRouter from "./routes/imports.js";
import publicRouter from "./routes/public.js";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

app.use(cors());
app.use(express.json());

// Health check (no auth)
app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// v1 API routes (authenticated)
app.use("/v1/me", bootstrapRouter);
app.use("/v1/lists", listsRouter);
app.use("/v1/places", placesRouter);
app.use("/v1/list-items", listItemsRouter);
app.use("/v1/imports", importsRouter);

// Public routes (no auth)
app.use("/public", publicRouter);

app.listen(PORT, () => {
  console.log(`[API] Server listening on http://localhost:${PORT}`);
  console.log(`[API] Health check: http://localhost:${PORT}/health`);
});

export default app;
