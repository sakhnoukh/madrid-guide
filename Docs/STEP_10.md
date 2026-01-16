# STEP_10 – Deploy (Vercel) + Move DB to Postgres + Harden Secrets

Goal:
- Replace SQLite with Postgres (Neon or Railway Postgres)
- Deploy Next.js app to Vercel (web + API routes)
- Deploy Telegram bot as a separate always-on process (NOT on Vercel)
- Lock down environment variables and Google API key usage

Why:
- SQLite isn’t production-safe on Vercel (serverless filesystem is not persistent). 
- Postgres is the correct move for a deployed app.

---

## 0) Choose your Postgres provider (pick one)

### Option A: Neon (recommended for “serverless-friendly”)
- Good free tier and Prisma has official guidance for Neon.

### Option B: Railway Postgres (very simple, also great)
- Easiest “one platform” setup if you also deploy your bot there.

Either works.

---

## 1) Switch Prisma from SQLite → Postgres

### 1.1 Update `prisma/schema.prisma`

Change datasource block to Postgres:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
Keep your models the same.

1.2 Install Postgres driver (if not present)
npm i pg
(Prisma uses pg in many Postgres setups.)

1.3 Update .env locally
Replace SQLite DATABASE_URL with your Postgres connection string:

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
Neon and most hosted DBs give you this string in their dashboard.

1.4 Apply migrations to the new DB
npx prisma migrate deploy
If you’re still iterating locally and want a clean push (dev only), you can do:

npx prisma migrate dev
1.5 Seed (optional)
If you have prisma/seed.ts:

npx prisma db seed
2) Deploy the Next.js app to Vercel
2.1 Push repo to GitHub (if not already)
Vercel works best from a GitHub repo.

2.2 Create Vercel project
Import the repo into Vercel

Set framework = Next.js

2.3 Set Environment Variables in Vercel
In Vercel Project → Settings → Environment Variables, add:

DATABASE_URL=...
ADMIN_SECRET=...
INGEST_SECRET=...
GOOGLE_MAPS_API_KEY=...
BASE_URL=https://your-vercel-domain.vercel.app
TELEGRAM_BOT_TOKEN=...          (optional: only needed if bot runs in same service; we won’t)
TELEGRAM_ALLOWED_USER_IDS=...   (optional)
Vercel env var management docs:

You set them in the Project Settings and choose environments (Development/Preview/Production).

2.4 Build + deploy
Vercel will deploy automatically on push.

3) IMPORTANT: Bot deployment (do NOT run Telegram polling on Vercel)
Vercel is serverless — it’s not meant for a long-running polling process.

So deploy the bot as a separate “worker” somewhere that stays on:

Railway

Fly.io

Render

Any VPS

4) Deploy the bot (recommended: Railway)
4.1 Create a Railway project
New Project → Deploy from GitHub repo

Add a Postgres DB only if you want everything in Railway; otherwise just deploy the service.

4.2 Add bot environment variables (Railway service settings)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USER_IDS=...
INGEST_SECRET=...              (same as Vercel ingest secret)
BASE_URL=https://your-vercel-domain.vercel.app
4.3 Add a bot start command
In package.json ensure:

{
  "scripts": {
    "bot": "tsx -r dotenv/config bot/index.ts"
  }
}
Railway “Start Command”:

npm run bot
5) Hardening: lock down your ingest + admin endpoints
5.1 Keep /api/ingest protected
You already have INGEST_SECRET

Confirm:

missing or wrong secret returns 401

bot always includes secret

5.2 Keep /api/places POST/PATCH/DELETE protected
You already use ADMIN_SECRET

Confirm these endpoints fail without it.

5.3 Restrict Google API key (once deployed)
In Google Cloud Console:

Restrict API key to Places API

If your Places API calls happen ONLY server-side (they do), restrict by:

your server environment if possible, or at least by API restrictions.

6) Update BASE_URL usage everywhere
6.1 In Vercel
Set:

BASE_URL=https://your-vercel-domain.vercel.app
6.2 In Railway bot
Set the same BASE_URL so it calls the right host.

7) Post-deploy smoke tests (do these in order)
Open website:

/

/places

/places/[id]

Test ingest endpoint (manually, from your machine):

POST /api/ingest with correct secret + mapsUrl

Confirm a new place appears on /places

Test Telegram:

Send a maps link to bot

Bot replies with a working link

Place appears on site

Test admin:

/admin/add create a place

/admin/edit/[id] edit + delete

8) If something breaks: common causes
DATABASE_URL not set correctly in Vercel or Railway

Prisma migrations not applied to production DB

BASE_URL wrong (bot calling localhost)

Google Places API not enabled or key restricted incorrectly

Telegram bot not running (worker crashed)

Done criteria for STEP_10
App deployed on Vercel

DB is Postgres (not SQLite)

Bot runs as a separate worker (Railway/Fly/etc.)

Sending a Telegram message adds a place to the live site

Admin add/edit/delete works in production