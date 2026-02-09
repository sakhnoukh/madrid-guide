# Backend

REST API for the multi-user version of Sami's Guide.

## Stack
- **Node.js + Express + TypeScript** API server
- **Postgres + PostGIS** for geo-aware queries
- **pg** driver (raw SQL, no ORM)
- Auth: Bearer token (stub in PR1, real JWT in PR2)

## Structure
```
backend/
├── api/
│   ├── src/
│   │   ├── index.ts          # Express entry point
│   │   ├── db.ts             # Postgres pool
│   │   ├── helpers.ts        # dedupe key, utils
│   │   ├── middleware/
│   │   │   └── auth.ts       # Auth middleware (stub)
│   │   └── routes/
│   │       ├── lists.ts      # /v1/lists + /v1/lists/:id/items
│   │       ├── places.ts     # /v1/places/upsert + /v1/places/search
│   │       └── listItems.ts  # /v1/list-items/:id
│   ├── package.json
│   └── tsconfig.json
├── db/
│   ├── schema.sql            # Full v1 schema
│   └── migrations/
├── jobs/
└── README.md
```

## Quick start

```bash
cd backend/api
cp .env.example .env   # set DATABASE_URL
npm install
npm run dev            # starts on :4000
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/v1/me/bootstrap` | Yes | Create user + default lists |
| GET | `/v1/lists` | Yes | User's lists (with item_count) |
| POST | `/v1/lists` | Yes | Create list |
| GET | `/v1/lists/:id` | Yes | List with items + tags |
| PATCH | `/v1/lists/:id` | Yes | Update title/description/visibility |
| DELETE | `/v1/lists/:id` | Yes | Delete list |
| POST | `/v1/lists/:id/items` | Yes | Save place to list (+ tags) |
| POST | `/v1/places/upsert` | Yes | Create/return canonical place (dedupe) |
| GET | `/v1/places/search` | Yes | Search places by name + geo |
| PATCH | `/v1/list-items/:id` | Yes | Update status/rating/note |
| DELETE | `/v1/list-items/:id` | Yes | Remove saved place |
| POST | `/v1/imports` | Yes | Create import draft |
| GET | `/v1/imports/:id` | Yes | Get import state |
| POST | `/v1/imports/:id/ocr` | Yes | Attach OCR text |
| POST | `/v1/imports/:id/resolve` | Yes | Confirm venue + save |
| GET | `/public/featured` | No | Featured lists |
| GET | `/public/lists/:handle/:slug` | No | Shareable list page |

## Database

Schema uses Postgres enums (`visibility`, `save_status`, `import_source`, `import_status`),
PostGIS geography, pg_trgm for fuzzy search, and auto-triggers for `updated_at` + geo computation.

Apply schema to a fresh Postgres database:
```bash
psql $DATABASE_URL -f ../db/schema.sql
```

Full spec: `docs/API_DB.md`
