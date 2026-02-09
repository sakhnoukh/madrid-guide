# STEP_13 – Rate Limit Ingest + Better Logs + Admin Export Backup

Goal:
1) Protect `/api/ingest` from spam + accidental cost blowups (rate limiting)
2) Make production debugging easy (structured logs)
3) Add a one-click-ish backup (admin export endpoint)

This is “make it stable and maintainable” step.

---

## 1) Add Upstash Redis for rate limiting

### 1.1 Create Upstash Redis
- Create an Upstash Redis database (free tier is fine).
- Get:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

Add these to **Vercel env vars** (Production + Preview if you want):
```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
Bot does NOT need these; only the Vercel app does.

1.2 Install the Upstash client
npm i @upstash/redis
1.3 Create a tiny rate limit helper
Create lib/ratelimit.ts:

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

export async function rateLimitFixedWindow(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = opts;

  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const redisKey = `rl:${key}:${bucket}`;

  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}
2) Add rate limiting to /api/ingest
Open app/api/ingest/route.ts.

2.1 Import rate limiter
At top:

import { rateLimitFixedWindow } from "@/lib/ratelimit";
2.2 Rate limit early (before Places API calls)
Inside POST, after parsing JSON but before expanding URLs:

// Basic global rate limit: 30/min
const rl = await rateLimitFixedWindow({
  key: "ingest",
  limit: 30,
  windowSeconds: 60,
});

if (!rl.allowed) {
  return new Response("Too many ingest requests. Try again in a minute.", {
    status: 429,
    headers: {
      "x-ratelimit-remaining": String(rl.remaining),
    },
  });
}
Optional (better): rate limit per Telegram user
If you want per-user, make the bot include sourceUserId in the ingest body.
Then:

const key = body.sourceUserId ? `ingest:${body.sourceUserId}` : "ingest";
(We can add that later if needed.)

3) Add structured logs to /api/ingest (so you can debug fast)
In app/api/ingest/route.ts, add a request id:

Near top of POST:

const reqId = crypto.randomUUID();
const startedAt = Date.now();
Then add logs at key points:

3.1 After expand
console.log("[INGEST]", {
  reqId,
  step: "expanded",
  inputUrl: body.mapsUrl,
  expandedUrl: expanded,
});
3.2 After placeId resolution
console.log("[INGEST]", {
  reqId,
  step: "placeId",
  googlePlaceId: placeId,
});
3.3 After save
Right before return Response.json(...):

console.log("[INGEST]", {
  reqId,
  step: "saved",
  savedId: saved.id,
  name: saved.name,
  published: saved.published,
  ms: Date.now() - startedAt,
});
3.4 In catch blocks
Wrap Places calls and Prisma calls with try/catch and log:

console.error("[INGEST_ERROR]", {
  reqId,
  message: e?.message ?? String(e),
});
Important: do NOT log secrets.

4) Add an Admin Export endpoint (backup)
This gives you an easy way to dump all places as JSON anytime.

Create app/api/admin/export/route.ts:

import { prisma } from "@/lib/prisma";
import { isValidAdminSecret } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const adminSecret = url.searchParams.get("adminSecret");

  if (!isValidAdminSecret(adminSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const places = await prisma.place.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(
    {
      exportedAt: new Date().toISOString(),
      count: places.length,
      places,
    },
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    }
  );
}
Usage
In a browser:

https://YOUR_DOMAIN/api/admin/export?adminSecret=YOUR_ADMIN_SECRET

Save the JSON somewhere safe (or commit to a private backup repo).

5) Optional: bot-side better error visibility (highly recommended)
Open bot/index.ts.

Where you handle non-OK ingest responses, ensure you log status + body:

if (!res.ok) {
  const text = await res.text();
  console.error("[BOT] ingest failed", { status: res.status, body: text });
  return bot.sendMessage(msg.chat.id, `Failed (${res.status}): ${text}`);
}
And in your catch:

console.error("[BOT] error", e);
This makes Railway logs immediately useful.

6) Verification checklist (do this now)
6.1 Rate limit works
Run ingest repeatedly (or just trigger the bot many times). After ~30 requests in a minute:

/api/ingest returns 429

Vercel logs show Too many ingest requests...

6.2 Logs are readable
Trigger ingest once and confirm Vercel logs show:

expanded

placeId

saved

6.3 Export works
Open export URL with correct adminSecret → 200 + JSON

Wrong/missing secret → 401

Done criteria for STEP_13
 /api/ingest rate-limited (429 works)

 /api/ingest logs show reqId + steps

 Bot logs show useful error details on failures

 Admin export endpoint works for backups