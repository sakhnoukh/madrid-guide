// app/api/ingest/route.ts
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";
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

function normalizeCategory(input?: string): "Restaurant" | "Bar" | "Café" | "Club" | "Brunch" | "Other" | undefined {
  if (!input) return undefined;
  const v = input.toLowerCase();
  if (v === "coffee" || v === "cafe" || v === "café") return "Café";
  if (v === "restaurant" || v === "food") return "Restaurant";
  if (v === "bar" || v === "drinks") return "Bar";
  if (v === "club" || v === "nightclub") return "Club";
  if (v === "brunch" || v === "breakfast") return "Brunch";
  return "Other";
}

function clampRating(input?: number): number | undefined {
  if (typeof input !== "number") return undefined;
  if (Number.isNaN(input)) return undefined;
  return Math.min(5, Math.max(1, input));
}

function normalizeTags(tags?: string[]): string[] | undefined {
  if (!Array.isArray(tags)) return undefined;
  const cleaned = tags
    .map((t) => t.toLowerCase().trim().replace(/^#/, ""))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function normalizeGoodFor(g?: string[]): string[] | undefined {
  if (!Array.isArray(g)) return undefined;
  const cleaned = g.map((x) => x.toLowerCase().trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
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
  category?: string;
  neighborhood?: string;
  rating?: number;
  tags?: string[];
  goodFor?: string[];
  shortBlurb?: string;
  longReview?: string;
};

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  const startedAt = Date.now();

  let body: IngestBody;
  try {
    body = await req.json();
  } catch {
    console.log("[INGEST_ERROR]", { reqId, message: "Invalid JSON" });
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!isValidIngestSecret(body.ingestSecret)) {
    console.log("[INGEST_ERROR]", { reqId, message: "Unauthorized request" });
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit: 30 requests per minute
  const allowed = await rateLimit("ingest", 30, 60);
  if (!allowed) {
    console.log("[INGEST_ERROR]", { reqId, message: "Rate limit exceeded" });
    return new Response("Too many requests", { status: 429 });
  }

  if (!body.mapsUrl) {
    console.log("[INGEST_ERROR]", { reqId, message: "Missing mapsUrl" });
    return new Response("Missing mapsUrl", { status: 400 });
  }

  // 1) Expand short links
  const expanded = await expandGoogleMapsUrl(body.mapsUrl);
  console.log("[INGEST]", { reqId, step: "expanded", inputUrl: body.mapsUrl, expandedUrl: expanded });

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
    console.log("[INGEST_ERROR]", { reqId, message: "Could not determine Place ID", url: expanded });
    return new Response(
      "Could not determine Google Place ID from URL. Try using a full Google Maps share link.",
      { status: 400 }
    );
  }

  console.log("[INGEST]", { reqId, step: "placeId", googlePlaceId: placeId });

  // 4) Fetch details
  const details = await getPlaceDetails(placeId);

  // 5) Choose defaults (your manual overrides win)
  const category = normalizeCategory(body.category) ?? "Other";
  const neighborhood = body.neighborhood?.trim() || "Madrid";
  const rating = clampRating(body.rating) ?? 4.0;

  const tags = normalizeTags(body.tags) ?? [];
  const goodFor = normalizeGoodFor(body.goodFor) ?? [];

  const shortBlurb =
    body.shortBlurb?.trim() ||
    `Added from Google Maps. I'll write a real note later.`;

  // Create a slug (id) based on name + neighborhood
  const baseSlug = slugify(`${details.name}-${neighborhood}`);
  const id = await ensureUniqueSlug(baseSlug);

  // 6) Upsert by googlePlaceId (so same place updates)
  const existing = await prisma.place.findFirst({
    where: { googlePlaceId: placeId },
  });

  const photoUrl = details.primaryPhotoName
    ? `/api/photos/${encodeURIComponent(details.primaryPhotoName)}`
    : undefined;

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
          category: normalizeCategory(body.category) ?? existing.category,
          neighborhood: body.neighborhood ?? existing.neighborhood,
          rating: body.rating ?? existing.rating,
          tags: body.tags ? JSON.stringify(tags) : existing.tags,
          goodFor: body.goodFor ? JSON.stringify(goodFor) : existing.goodFor,
          shortBlurb: body.shortBlurb ? shortBlurb : existing.shortBlurb,
          longReview: body.longReview ? body.longReview : existing.longReview,
          priceLevel:
            typeof details.priceLevel === "number" ? details.priceLevel : existing.priceLevel,
          primaryPhotoName: details.primaryPhotoName ?? existing.primaryPhotoName,
          primaryPhotoUrl: photoUrl ?? existing.primaryPhotoUrl,
        },
      })
    : await prisma.place.create({
        data: {
          id,
          name: details.name,
          neighborhood,
          category,
          rating,
          tags: JSON.stringify(tags),
          goodFor: goodFor.length ? JSON.stringify(goodFor) : undefined,
          shortBlurb,
          longReview: body.longReview?.trim() || undefined,
          priceLevel: typeof details.priceLevel === "number" ? details.priceLevel : undefined,
          googleMapsUrl: body.mapsUrl,
          googlePlaceId: placeId,
          address: details.address,
          lat: details.lat,
          lng: details.lng,
          googleMapsUri: details.googleMapsUri,
          primaryPhotoName: details.primaryPhotoName,
          primaryPhotoUrl: photoUrl,
          published: false,
          featured: false,
        },
      });

  console.log("[INGEST]", {
    reqId,
    step: "saved",
    savedId: saved.id,
    name: saved.name,
    published: saved.published,
    isUpdate: !!existing,
    ms: Date.now() - startedAt,
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
