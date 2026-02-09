# Backend

REST API for the multi-user version of Sami's Guide.

## Stack (planned)
- **Postgres + PostGIS** for geo-aware queries
- **Supabase Auth** or **Clerk** for authentication
- **REST JSON** endpoints with Bearer token auth

## Structure
```
backend/
├── api/          # REST endpoint handlers
├── db/
│   ├── schema.sql
│   └── migrations/
├── jobs/         # Async import processing (optional in MVP)
└── README.md
```

## Status
Scaffold only — implementation follows Milestone 1 in `docs/EXPANSION.md`.
