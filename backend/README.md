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

## Endpoints (PR1)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/v1/lists` | Yes | User's lists |
| POST | `/v1/lists` | Yes | Create list |
| GET | `/v1/lists/:id` | Yes | List with items |
| POST | `/v1/lists/:id/items` | Yes | Save place to list |
| POST | `/v1/places/upsert` | Yes | Create/return canonical place |
| GET | `/v1/places/search` | Yes | Search places by name |
| PATCH | `/v1/list-items/:id` | Yes | Update status/rating/note |

## Database

Apply schema to a fresh Postgres database:
```bash
psql $DATABASE_URL -f ../db/schema.sql
```
