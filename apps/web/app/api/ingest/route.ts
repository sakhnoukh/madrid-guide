// app/api/ingest/route.ts
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";
import {
  expandGoogleMapsUrl,
  extractCidFromUrl,
  extractLatLngFromUrl,
  extractPlaceIdFromUrl,
  extractTextQueryFromUrl,
  getPlaceDetails,
  searchPlaceIdByLatLng,
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
  review?: string;
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

  // 2) Extract Place ID/CID/lat-lng/query from both original + expanded URL.
  // Some full Google Maps links lose rich identifiers after redirect canonicalization.
  const rawPlaceId = extractPlaceIdFromUrl(body.mapsUrl);
  const expandedPlaceId = extractPlaceIdFromUrl(expanded);
  let placeId = rawPlaceId || expandedPlaceId;

  const rawCid = extractCidFromUrl(body.mapsUrl);
  const expandedCid = extractCidFromUrl(expanded);
  const cid = rawCid || expandedCid;

  const rawLatLng = extractLatLngFromUrl(body.mapsUrl);
  const expandedLatLng = extractLatLngFromUrl(expanded);
  const latLngFromUrl = expandedLatLng || rawLatLng;

  const rawQuery = extractTextQueryFromUrl(body.mapsUrl);
  const expandedQuery = extractTextQueryFromUrl(expanded);
  const query = expandedQuery || rawQuery;
  const hasUrlSignal = /^https?:\/\//i.test(expanded) || /^https?:\/\//i.test(body.mapsUrl);

  // 3) Enrichment fallback: Text Search using name derived from URL
  if (!placeId && query) {
    try {
      placeId = await searchPlaceIdByText(`${query} Madrid`);
    } catch (err) {
      console.log("[INGEST_WARN]", { reqId, message: "Text search failed", query, err });
    }
  }

  if (!placeId && latLngFromUrl) {
    try {
      placeId = await searchPlaceIdByLatLng(latLngFromUrl.lat, latLngFromUrl.lng);
    } catch (err) {
      console.log("[INGEST_WARN]", {
        reqId,
        message: "Lat/lng search failed",
        lat: latLngFromUrl.lat,
        lng: latLngFromUrl.lng,
        err,
      });
    }
  }

  // We can ingest even without Place ID as long as we have another signal.
  if (!placeId && !cid && !latLngFromUrl && !query && !hasUrlSignal) {
    console.log("[INGEST_ERROR]", {
      reqId,
      message: "Could not determine Place ID/CID/lat-lng/query",
      url: expanded,
    });
    return new Response(
      "Could not determine useful place data from URL. Try another Google Maps share link.",
      { status: 400 }
    );
  }

  console.log("[INGEST]", {
    reqId,
    step: "resolved-signals",
    googlePlaceId: placeId,
    cid,
    latLng: latLngFromUrl,
    query,
  });

  // 4) Enrich with Place Details when we have a Place ID
  let details:
    | {
        name: string;
        address?: string;
        lat?: number;
        lng?: number;
        googleMapsUri?: string;
        priceLevel?: number;
        primaryPhotoName?: string;
      }
    | null = null;

  if (placeId) {
    try {
      details = await getPlaceDetails(placeId);
    } catch (err) {
      console.log("[INGEST_WARN]", {
        reqId,
        message: "Place details fetch failed; continuing with URL-derived data",
        placeId,
        err,
      });
    }
  }

  // 5) Choose defaults (your manual overrides win)
  const category = normalizeCategory(body.category) ?? "Other";
  const neighborhood = body.neighborhood?.trim() || "Madrid";
  const rating = clampRating(body.rating) ?? 4.0;

  const tags = normalizeTags(body.tags) ?? [];
  const goodFor = normalizeGoodFor(body.goodFor) ?? [];

  const review =
    body.review?.trim() ||
    `Added from Google Maps. I'll write a real note later.`;

  const inferredName =
    details?.name ||
    query ||
    (latLngFromUrl
      ? `Pinned place (${latLngFromUrl.lat.toFixed(5)}, ${latLngFromUrl.lng.toFixed(5)})`
      : "Google Maps place");

  const inferredLat = details?.lat ?? latLngFromUrl?.lat;
  const inferredLng = details?.lng ?? latLngFromUrl?.lng;
  const inferredMapsUri = details?.googleMapsUri || expanded || body.mapsUrl;

  // store CID as synthetic identifier when Place ID is unavailable
  const identityKey = placeId || (cid ? `cid:${cid}` : undefined);

  // Create a slug (id) based on name + neighborhood
  const baseSlug = slugify(`${inferredName}-${neighborhood}`);
  const id = await ensureUniqueSlug(baseSlug);

  // 6) Upsert by identity (Place ID or CID fallback). If none, fallback to raw URL.
  const existing =
    (identityKey
      ? await prisma.place.findFirst({
          where: { googlePlaceId: identityKey },
        })
      : null) ||
    (await prisma.place.findFirst({
      where: {
        OR: [{ googleMapsUrl: body.mapsUrl }, { googleMapsUrl: inferredMapsUri }],
      },
    }));

  const photoUrl = details?.primaryPhotoName
    ? `/api/photos/${encodeURIComponent(details.primaryPhotoName)}`
    : undefined;

  const saved = existing
    ? await prisma.place.update({
        where: { id: existing.id },
        data: {
          name: inferredName,
          address: details?.address ?? existing.address,
          lat: inferredLat ?? existing.lat,
          lng: inferredLng ?? existing.lng,
          googleMapsUri: inferredMapsUri,
          googleMapsUrl: inferredMapsUri,
          googlePlaceId: identityKey ?? existing.googlePlaceId,
          category: normalizeCategory(body.category) ?? existing.category,
          neighborhood: body.neighborhood ?? existing.neighborhood,
          rating: body.rating ?? existing.rating,
          tags: body.tags ? JSON.stringify(tags) : existing.tags,
          goodFor: body.goodFor ? JSON.stringify(goodFor) : existing.goodFor,
          review: body.review ? review : existing.review,
          priceLevel:
            typeof details?.priceLevel === "number" ? details.priceLevel : existing.priceLevel,
          primaryPhotoName: details?.primaryPhotoName ?? existing.primaryPhotoName,
          primaryPhotoUrl: photoUrl ?? existing.primaryPhotoUrl,
        },
      })
    : await prisma.place.create({
        data: {
          id,
          name: inferredName,
          neighborhood,
          category,
          rating,
          tags: JSON.stringify(tags),
          goodFor: goodFor.length ? JSON.stringify(goodFor) : undefined,
          review,
          priceLevel: typeof details?.priceLevel === "number" ? details.priceLevel : undefined,
          googleMapsUrl: inferredMapsUri,
          googlePlaceId: identityKey,
          address: details?.address,
          lat: inferredLat,
          lng: inferredLng,
          googleMapsUri: inferredMapsUri,
          primaryPhotoName: details?.primaryPhotoName,
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
    meta: {
      expandedUrl: expanded,
      googlePlaceId: placeId,
      cid,
      lat: inferredLat,
      lng: inferredLng,
      query,
    },
  });
}
