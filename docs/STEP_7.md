# STEP_7 – Telegram “Send Link → Add Place” + Google Places API Enrichment

Goal of this step:
- You send a **Google Maps link** to a Telegram bot
- Bot calls your backend `/api/ingest`
- Backend:
  1) expands short links
  2) extracts or finds the **Google Place ID**
  3) calls **Places API (New)** to fetch details
  4) **creates** a new Place in your DB (or updates if it already exists)

This is the “real workflow” step.

Docs reference (FYI): Places API (New) uses `places.googleapis.com/v1/...` and requires `X-Goog-FieldMask`.  
(You’ll implement it below; Google docs confirm the endpoints and field masks.) :contentReference[oaicite:0]{index=0}

---

## 0) Google Cloud setup (one-time)

1) Create a Google Cloud project
2) Enable **Places API**
3) Create an API key
4) Restrict it later (HTTP referrers / IP) once deployed

Add to `.env`:

```env
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
INGEST_SECRET="change-this-to-a-long-random-string"
BASE_URL="http://localhost:3000"

TELEGRAM_BOT_TOKEN="123456:abc..."
TELEGRAM_ALLOWED_USER_IDS="123456789"  # your Telegram numeric user id, comma-separated if multiple
Keep your existing DATABASE_URL and ADMIN_SECRET from Step 6.

1) Update Prisma schema to store Google Place metadata
Right now your schema only stores your review fields. Add:

googlePlaceId (unique)

address

lat, lng

googleMapsUri (nice canonical link)

1.1 Edit prisma/schema.prisma
Add these fields to Place:

prisma
Copy code
model Place {
  id            String   @id
  name          String
  neighborhood  String
  category      PlaceCategory

  tags          Json
  goodFor       Json?
  rating        Float
  shortBlurb    String
  longReview    String?
  priceLevel    Int?
  googleMapsUrl String?

  // NEW: enrichment fields
  googlePlaceId String?  @unique
  address       String?
  lat           Float?
  lng           Float?
  googleMapsUri String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
1.2 Run migration
bash
Copy code
npx prisma migrate dev --name add_place_enrichment
2) Create Google Places helper (server-side)
Create lib/googlePlaces.ts:

ts
Copy code
// lib/googlePlaces.ts

type PlaceDetails = {
  placeId: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  googleMapsUri?: string;
  priceLevel?: number; // 1..4 sometimes (depends on API field returned)
};

const MADRID_CENTER = { lat: 40.4168, lng: -3.7038 };

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function expandGoogleMapsUrl(url: string): Promise<string> {
  // Handles maps.app.goo.gl short links by following redirects.
  // fetch() in Node follows redirects by default; response.url is final.
  const res = await fetch(url, { redirect: "follow" });
  return res.url || url;
}

export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // Common: .../place/?q=place_id:ChI...
    const q = u.searchParams.get("q");
    if (q && q.includes("place_id:")) {
      const id = q.split("place_id:")[1]?.trim();
      if (id) return id;
    }

    // Sometimes: place_id=ChI... or query_place_id=ChI...
    const pid =
      u.searchParams.get("place_id") ||
      u.searchParams.get("query_place_id") ||
      u.searchParams.get("ftid"); // not always a real Places ID, but keep as last-resort
    if (pid && pid.startsWith("ChI")) return pid;

    // Some URLs include "ChI..." somewhere in the path/data:
    const match = url.match(/(ChI[a-zA-Z0-9_-]{10,})/);
    if (match?.[1]) return match[1];

    return null;
  } catch {
    return null;
  }
}

export function extractTextQueryFromUrl(url: string): string | null {
  // Fallback: derive a text query from /maps/place/<NAME>/
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const placeIdx = parts.findIndex((p) => p === "place");
    if (placeIdx >= 0 && parts[placeIdx + 1]) {
      const raw = parts[placeIdx + 1];
      const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

async function placesFetch(
  input: RequestInfo,
  init: RequestInit & { fieldMask?: string } = {}
) {
  const apiKey = mustEnv("GOOGLE_MAPS_API_KEY");
  const fieldMask = init.fieldMask;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
  };
  if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;

  const res = await fetch(input, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function searchPlaceIdByText(textQuery: string): Promise<string | null> {
  // Places API (New): POST https://places.googleapis.com/v1/places:searchText
  const body = {
    textQuery,
    // Bias results toward Madrid so "Acid Café" doesn’t match another city.
    locationBias: {
      circle: {
        center: { latitude: MADRID_CENTER.lat, longitude: MADRID_CENTER.lng },
        radius: 15000,
      },
    },
    maxResultCount: 1,
  };

  const data = await placesFetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      body: JSON.stringify(body),
      fieldMask: "places.id,places.displayName,places.formattedAddress",
    }
  );

  const id = data?.places?.[0]?.id;
  return typeof id === "string" ? id : null;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  // Places API (New): GET https://places.googleapis.com/v1/places/{placeId}
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;

  const data = await placesFetch(url, {
    method: "GET",
    fieldMask:
      "id,displayName,formattedAddress,location,googleMapsUri,priceLevel",
  });

  return {
    placeId: data?.id,
    name: data?.displayName?.text || "Unknown place",
    address: data?.formattedAddress,
    lat: data?.location?.latitude,
    lng: data?.location?.longitude,
    googleMapsUri: data?.googleMapsUri,
    // priceLevel values differ depending on API surface; keep it nullable and don’t assume.
    priceLevel:
      typeof data?.priceLevel === "number" ? data.priceLevel : undefined,
  };
}
3) Add an ingest API route: POST /api/ingest
Create app/api/ingest/route.ts:

ts
Copy code
// app/api/ingest/route.ts
import { prisma } from "@/lib/prisma";
import {
  expandGoogleMapsUrl,
  extractPlaceIdFromUrl,
  extractTextQueryFromUrl,
  getPlaceDetails,
  searchPlaceIdByText,
} from "@/lib/googlePlaces";

function isValidIngestSecret(secret: string | undefined) {
  const expected = process.env.INGEST_SECRET;
  return !!expected && secret === expected;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureUniqueSlug(base: string) {
  let slug = base;
  let i = 1;
  while (true) {
    const exists = await prisma.place.findUnique({ where: { id: slug } });
    if (!exists) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

type IngestBody = {
  ingestSecret?: string;
  mapsUrl: string;

  // Optional overrides you can send from Telegram
  category?: "coffee" | "restaurant" | "bar";
  neighborhood?: string;
  rating?: number;
  tags?: string[];
  goodFor?: string[];
  shortBlurb?: string;
  longReview?: string;
};

export async function POST(req: Request) {
  let body: IngestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!isValidIngestSecret(body.ingestSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!body.mapsUrl) {
    return new Response("Missing mapsUrl", { status: 400 });
  }

  // 1) Expand short links
  const expanded = await expandGoogleMapsUrl(body.mapsUrl);

  // 2) Try extract Place ID
  let placeId = extractPlaceIdFromUrl(expanded);

  // 3) Fallback: Text Search using name derived from URL
  if (!placeId) {
    const query = extractTextQueryFromUrl(expanded);
    if (query) {
      placeId = await searchPlaceIdByText(`${query} Madrid`);
    }
  }

  if (!placeId) {
    return new Response(
      "Could not determine Google Place ID from URL. Try using a full Google Maps share link.",
      { status: 400 }
    );
  }

  // 4) Fetch details
  const details = await getPlaceDetails(placeId);

  // 5) Choose defaults (your manual overrides win)
  const category = body.category ?? "coffee";
  const neighborhood = body.neighborhood ?? "Madrid";
  const rating =
    typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
      ? body.rating
      : 4.0;

  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => t.trim()).filter(Boolean)
    : [];

  const goodFor = Array.isArray(body.goodFor)
    ? body.goodFor.map((g) => g.trim()).filter(Boolean)
    : [];

  const shortBlurb =
    body.shortBlurb?.trim() ||
    `Added from Google Maps. I’ll write a real note later.`;

  // Create a slug (id) based on name + neighborhood
  const baseSlug = slugify(`${details.name}-${neighborhood}`);
  const id = await ensureUniqueSlug(baseSlug);

  // 6) Upsert by googlePlaceId (so same place updates)
  const existing = await prisma.place.findFirst({
    where: { googlePlaceId: placeId },
  });

  const saved = existing
    ? await prisma.place.update({
        where: { id: existing.id },
        data: {
          name: details.name,
          address: details.address,
          lat: details.lat,
          lng: details.lng,
          googleMapsUri: details.googleMapsUri,
          googleMapsUrl: body.mapsUrl,
          // Only update these if explicitly sent, otherwise keep your existing opinions
          category: body.category ?? existing.category,
          neighborhood: body.neighborhood ?? existing.neighborhood,
          rating: body.rating ?? existing.rating,
          tags: body.tags ? tags : (existing.tags as any),
          goodFor: body.goodFor ? goodFor : (existing.goodFor as any),
          shortBlurb: body.shortBlurb ? shortBlurb : existing.shortBlurb,
          longReview: body.longReview ? body.longReview : existing.longReview,
          priceLevel:
            typeof details.priceLevel === "number" ? details.priceLevel : existing.priceLevel,
        },
      })
    : await prisma.place.create({
        data: {
          id,
          name: details.name,
          neighborhood,
          category,
          rating,
          tags,
          goodFor: goodFor.length ? goodFor : undefined,
          shortBlurb,
          longReview: body.longReview?.trim() || undefined,
          priceLevel: typeof details.priceLevel === "number" ? details.priceLevel : undefined,
          googleMapsUrl: body.mapsUrl,
          googlePlaceId: placeId,
          address: details.address,
          lat: details.lat,
          lng: details.lng,
          googleMapsUri: details.googleMapsUri,
        },
      });

  return Response.json({
    ok: true,
    place: {
      id: saved.id,
      name: saved.name,
      neighborhood: saved.neighborhood,
      url: `/places/${saved.id}`,
    },
    meta: { expandedUrl: expanded, googlePlaceId: placeId },
  });
}
4) Update your UI to optionally display address + canonical Maps link
4.1 Update /places/[id] detail page
In your app/places/[id]/page.tsx (server component), when you fetch the place from Prisma, you now have:

place.address

place.googleMapsUri

place.lat, place.lng

Show address under the title (optional):

tsx
Copy code
{place.address && (
  <p className="text-sm text-textMuted">{place.address}</p>
)}
And for the Maps button prefer googleMapsUri if present:

tsx
Copy code
const mapsHref = place.googleMapsUri || place.googleMapsUrl;
Use mapsHref for the “Open in Google Maps →” button.

5) Create the Telegram bot
Install bot library:

bash
Copy code
npm i node-telegram-bot-api
Create bot/index.ts:

ts
Copy code
import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const ingestSecret = process.env.INGEST_SECRET;
const allowed = (process.env.TELEGRAM_ALLOWED_USER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN");
if (!ingestSecret) throw new Error("Missing INGEST_SECRET");

const bot = new TelegramBot(token, { polling: true });

function isAllowed(userId?: number) {
  if (!userId) return false;
  if (allowed.length === 0) return true; // allow all if not set (not recommended)
  return allowed.includes(String(userId));
}

function extractUrl(text?: string) {
  if (!text) return null;
  const match = text.match(/https?:\/\/\S+/);
  return match?.[0] ?? null;
}

bot.on("message", async (msg) => {
  const userId = msg.from?.id;
  if (!isAllowed(userId)) {
    return bot.sendMessage(msg.chat.id, "Not authorized.");
  }

  const text = msg.text || "";
  if (text.startsWith("/start")) {
    return bot.sendMessage(
      msg.chat.id,
      "Send me a Google Maps link and I’ll add it to your site."
    );
  }

  const url = extractUrl(text);
  if (!url) {
    return bot.sendMessage(
      msg.chat.id,
      "Send a Google Maps link (a URL). Example: paste the Share link from Google Maps."
    );
  }

  try {
    const res = await fetch(`${baseUrl}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingestSecret,
        mapsUrl: url,
        // Optional: you can later parse message text for tags/rating/category
      }),
    });

    const body = await res.text();
    if (!res.ok) {
      return bot.sendMessage(msg.chat.id, `Failed (${res.status}): ${body}`);
    }

    const json = JSON.parse(body);
    const placeUrl = `${baseUrl}${json.place.url}`;
    return bot.sendMessage(
      msg.chat.id,
      `Added ✅ ${json.place.name} (${json.place.neighborhood})\n${placeUrl}`
    );
  } catch (e: any) {
    return bot.sendMessage(msg.chat.id, `Error: ${e?.message ?? String(e)}`);
  }
});
Add scripts to package.json:

json
Copy code
{
  "scripts": {
    "bot": "node -r dotenv/config bot/index.ts"
  }
}
Install a TS runner for the bot if you don’t already have one:

bash
Copy code
npm i -D tsx
Then set the script to use it:

json
Copy code
{
  "scripts": {
    "bot": "tsx -r dotenv/config bot/index.ts"
  }
}
Run both:

Next dev server:

bash
Copy code
npm run dev
Bot:

bash
Copy code
npm run bot
Now send a Google Maps share link to your bot → it should appear on /places.

6) Testing checklist (do this in order)
Confirm /api/ingest auth works:

POST without ingestSecret → 401

POST with wrong ingestSecret → 401

Confirm ingest works:

POST { ingestSecret, mapsUrl } → returns { ok: true, place: ... }

Confirm DB has the record:

Check /places → new place appears

Open its detail page → address and maps button should exist if returned

Telegram path:

Bot responds “Added ✅ …”

Link it returns loads correctly

Notes / limitations (realistic expectations)
Some Google Maps share URLs do not expose a Places ID cleanly; we try:

expand short links

parse place_id

fallback to text search (biased to Madrid)

In rare cases, Text Search may match the wrong place if the name is too generic.

You can fix by later letting the bot accept “name + neighborhood” or asking for confirmation.

