# Sami's Guide — Monorepo

A curated guide + personal map where anyone can save places, organize them into lists, and add private notes.

## Structure

```
├── apps/
│   ├── web/        # Next.js public guide (deployed on Vercel)
│   └── ios/        # SwiftUI iOS app (planned)
├── backend/        # REST API + database (planned)
│   ├── api/
│   ├── db/
│   └── jobs/
├── docs/           # Product docs & specs
└── shared/         # Shared types (later)
```

## Quick start (web)

```bash
cd apps/web
cp .env.example .env   # fill in your keys
npm install
npx prisma generate
npm run dev
```

## Docs

- [Expansion plan](docs/EXPANSION.md)
- [Map integration notes](docs/STEP_MAP.md)
