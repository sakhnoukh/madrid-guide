# STEP_11 – Production Hardening: Health Checks, Rate Limits, Logging, Backups, and Bot Reliability

Goal:
- Make sure your live site + bot are stable, secure, and debuggable.
- Prevent spam / accidental key leakage / runaway API costs.
- Add basic monitoring so you know when something breaks.

---

## 1) Add a Health Endpoint (web)

Create: `app/api/health/route.ts`

```ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // simple DB check
    await prisma.place.count();
    return Response.json({ ok: true });
  } catch (e: any) {
    return new Response(`unhealthy: ${e?.message ?? "unknown"}`, { status: 500 });
  }
}
Check in browser:

https://YOUR_VERCEL_DOMAIN/api/health → should return { ok: true }

2) Add Rate Limiting to /api/ingest (anti-spam + cost control)
Install Upstash Redis (quick + works well with Vercel):

Create Upstash Redis database

Add to Vercel env:

UPSTASH_REDIS_REST_URL

UPSTASH_REDIS_REST_TOKEN

Install:

npm i @upstash/redis
Create lib/ratelimit.ts:

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(key: string, limit = 10, windowSeconds = 60) {
  const nowBucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const redisKey = `rl:${key}:${nowBucket}`;

  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  return count <= limit;
}
Then in app/api/ingest/route.ts, near the top of POST, add:

import { rateLimit } from "@/lib/ratelimit";

const allowed = await rateLimit("ingest", 30, 60); // 30/min total
if (!allowed) return new Response("Too many requests", { status: 429 });
Optional: key by telegram user id later.

3) Tighten Secrets and Access
3.1 Make sure these are set ONLY in server env (never in client)
GOOGLE_MAPS_API_KEY

INGEST_SECRET

ADMIN_SECRET

Nothing should start with NEXT_PUBLIC_ for these.

3.2 Ensure bot service has only what it needs
Bot (Railway) should have:

TELEGRAM_BOT_TOKEN

TELEGRAM_ALLOWED_USER_IDS

INGEST_SECRET

BASE_URL

Bot does NOT need Google API key or DB creds.

4) Add structured logging for ingest
In /api/ingest, add logs that won’t leak secrets:

console.log("[INGEST]", {
  ok: true,
  expandedUrl: expanded,
  googlePlaceId: placeId,
  savedId: saved.id,
});
And on error:

console.error("[INGEST_ERROR]", { message: String(e) });
This makes Vercel logs actually useful.

5) Bot reliability (polling vs webhook)
Option A (keep polling, easiest)
Keep bot on Railway with polling: true.

Confirm it restarts automatically.

Add a simple “/ping” command in bot to confirm it’s alive.

Option B (recommended long-term): switch to webhook
Create a Vercel route: /api/telegram-webhook

Set Telegram webhook to that URL

Then bot becomes stateless and you can remove the Railway bot service.

If you want, I’ll give you a STEP_12 that migrates to webhook cleanly.

6) Database backups
If your Postgres is on Railway:

Railway has snapshot/backup options depending on plan.

Minimum: enable automated backups OR schedule exports.

Simple manual backup habit:

Once a week: export places as JSON or CSV.

Add GET /api/admin/export (protected by ADMIN_SECRET) later if you want a one-click dump.

7) Verify Google Places API cost protection
Ensure you’re not calling Places API on every page view.

You currently call it only during ingest → good.

Confirm photo proxy /api/photos/... is cached:

You already set cache-control: public, max-age=86400 in Step 9. Good.

8) Done Criteria for STEP_11
 /api/health returns { ok: true } in prod

 /api/ingest rate limited and returns 429 when spammed

 Vercel logs show structured ingest events

 Bot is stable on Railway (or webhook plan chosen)

 Secrets are not exposed to client

 You have a backup plan (at least manual export)

