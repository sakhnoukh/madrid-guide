module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        "error"
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/lib/googlePlaces.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/googlePlaces.ts
__turbopack_context__.s([
    "expandGoogleMapsUrl",
    ()=>expandGoogleMapsUrl,
    "extractPlaceIdFromUrl",
    ()=>extractPlaceIdFromUrl,
    "extractTextQueryFromUrl",
    ()=>extractTextQueryFromUrl,
    "getPlaceDetails",
    ()=>getPlaceDetails,
    "searchPlaceIdByText",
    ()=>searchPlaceIdByText
]);
const MADRID_CENTER = {
    lat: 40.4168,
    lng: -3.7038
};
function mustEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}
async function expandGoogleMapsUrl(url) {
    // Handles maps.app.goo.gl short links by following redirects.
    const res = await fetch(url, {
        redirect: "follow"
    });
    return res.url || url;
}
function extractPlaceIdFromUrl(url) {
    try {
        const u = new URL(url);
        // Common: .../place/?q=place_id:ChI...
        const q = u.searchParams.get("q");
        if (q && q.includes("place_id:")) {
            const id = q.split("place_id:")[1]?.trim();
            if (id) return id;
        }
        // Sometimes: place_id=ChI... or query_place_id=ChI...
        const pid = u.searchParams.get("place_id") || u.searchParams.get("query_place_id") || u.searchParams.get("ftid");
        if (pid && pid.startsWith("ChI")) return pid;
        // Some URLs include "ChI..." somewhere in the path/data:
        const match = url.match(/(ChI[a-zA-Z0-9_-]{10,})/);
        if (match?.[1]) return match[1];
        return null;
    } catch  {
        return null;
    }
}
function extractTextQueryFromUrl(url) {
    // Fallback: derive a text query from /maps/place/<NAME>/
    try {
        const u = new URL(url);
        const parts = u.pathname.split("/").filter(Boolean);
        const placeIdx = parts.findIndex((p)=>p === "place");
        if (placeIdx >= 0 && parts[placeIdx + 1]) {
            const raw = parts[placeIdx + 1];
            const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
            return decoded;
        }
        return null;
    } catch  {
        return null;
    }
}
async function placesFetch(input, init = {}) {
    const apiKey = mustEnv("GOOGLE_MAPS_API_KEY");
    const fieldMask = init.fieldMask;
    const headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey
    };
    if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;
    const res = await fetch(input, {
        ...init,
        headers: {
            ...headers,
            ...init.headers || {}
        }
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Places API error ${res.status}: ${text}`);
    }
    return res.json();
}
async function searchPlaceIdByText(textQuery) {
    // Places API (New): POST https://places.googleapis.com/v1/places:searchText
    const body = {
        textQuery,
        locationBias: {
            circle: {
                center: {
                    latitude: MADRID_CENTER.lat,
                    longitude: MADRID_CENTER.lng
                },
                radius: 15000
            }
        },
        maxResultCount: 1
    };
    const data = await placesFetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        body: JSON.stringify(body),
        fieldMask: "places.id,places.displayName,places.formattedAddress"
    });
    const id = data?.places?.[0]?.id;
    return typeof id === "string" ? id : null;
}
async function getPlaceDetails(placeId) {
    // Places API (New): GET https://places.googleapis.com/v1/places/{placeId}
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const data = await placesFetch(url, {
        method: "GET",
        fieldMask: "id,displayName,formattedAddress,location,googleMapsUri,priceLevel"
    });
    return {
        placeId: data?.id,
        name: data?.displayName?.text || "Unknown place",
        address: data?.formattedAddress,
        lat: data?.location?.latitude,
        lng: data?.location?.longitude,
        googleMapsUri: data?.googleMapsUri,
        priceLevel: typeof data?.priceLevel === "number" ? data.priceLevel : undefined
    };
}
}),
"[project]/app/api/ingest/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
// app/api/ingest/route.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$googlePlaces$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/googlePlaces.ts [app-route] (ecmascript)");
;
;
function isValidIngestSecret(secret) {
    const expected = process.env.INGEST_SECRET;
    return !!expected && secret === expected;
}
function slugify(input) {
    return input.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function normalizeCategory(input) {
    if (!input) return undefined;
    const v = input.toLowerCase();
    if (v === "coffee" || v === "cafe" || v === "café") return "coffee";
    if (v === "restaurant" || v === "food") return "restaurant";
    if (v === "bar" || v === "drinks") return "bar";
    return undefined;
}
function clampRating(input) {
    if (typeof input !== "number") return undefined;
    if (Number.isNaN(input)) return undefined;
    return Math.min(5, Math.max(1, input));
}
function normalizeTags(tags) {
    if (!Array.isArray(tags)) return undefined;
    const cleaned = tags.map((t)=>t.toLowerCase().trim().replace(/^#/, "")).filter(Boolean);
    return Array.from(new Set(cleaned));
}
function normalizeGoodFor(g) {
    if (!Array.isArray(g)) return undefined;
    const cleaned = g.map((x)=>x.toLowerCase().trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
}
async function ensureUniqueSlug(base) {
    let slug = base;
    let i = 1;
    while(true){
        const exists = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].place.findUnique({
            where: {
                id: slug
            }
        });
        if (!exists) return slug;
        i += 1;
        slug = `${base}-${i}`;
    }
}
async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch  {
        return new Response("Invalid JSON", {
            status: 400
        });
    }
    if (!isValidIngestSecret(body.ingestSecret)) {
        return new Response("Unauthorized", {
            status: 401
        });
    }
    if (!body.mapsUrl) {
        return new Response("Missing mapsUrl", {
            status: 400
        });
    }
    // 1) Expand short links
    const expanded = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$googlePlaces$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["expandGoogleMapsUrl"])(body.mapsUrl);
    // 2) Try extract Place ID
    let placeId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$googlePlaces$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractPlaceIdFromUrl"])(expanded);
    // 3) Fallback: Text Search using name derived from URL
    if (!placeId) {
        const query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$googlePlaces$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractTextQueryFromUrl"])(expanded);
        if (query) {
            placeId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$googlePlaces$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["searchPlaceIdByText"])(`${query} Madrid`);
        }
    }
    if (!placeId) {
        return new Response("Could not determine Google Place ID from URL. Try using a full Google Maps share link.", {
            status: 400
        });
    }
    // 4) Fetch details
    const details = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$googlePlaces$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPlaceDetails"])(placeId);
    // 5) Choose defaults (your manual overrides win)
    const category = normalizeCategory(body.category) ?? "coffee";
    const neighborhood = body.neighborhood?.trim() || "Madrid";
    const rating = clampRating(body.rating) ?? 4.0;
    const tags = normalizeTags(body.tags) ?? [];
    const goodFor = normalizeGoodFor(body.goodFor) ?? [];
    const shortBlurb = body.shortBlurb?.trim() || `Added from Google Maps. I'll write a real note later.`;
    // Create a slug (id) based on name + neighborhood
    const baseSlug = slugify(`${details.name}-${neighborhood}`);
    const id = await ensureUniqueSlug(baseSlug);
    // 6) Upsert by googlePlaceId (so same place updates)
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].place.findFirst({
        where: {
            googlePlaceId: placeId
        }
    });
    const saved = existing ? await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].place.update({
        where: {
            id: existing.id
        },
        data: {
            name: details.name,
            address: details.address,
            lat: details.lat,
            lng: details.lng,
            googleMapsUri: details.googleMapsUri,
            googleMapsUrl: body.mapsUrl,
            category: body.category ?? existing.category,
            neighborhood: body.neighborhood ?? existing.neighborhood,
            rating: body.rating ?? existing.rating,
            tags: body.tags ? JSON.stringify(tags) : existing.tags,
            goodFor: body.goodFor ? JSON.stringify(goodFor) : existing.goodFor,
            shortBlurb: body.shortBlurb ? shortBlurb : existing.shortBlurb,
            longReview: body.longReview ? body.longReview : existing.longReview,
            priceLevel: typeof details.priceLevel === "number" ? details.priceLevel : existing.priceLevel
        }
    }) : await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].place.create({
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
            googleMapsUri: details.googleMapsUri
        }
    });
    return Response.json({
        ok: true,
        place: {
            id: saved.id,
            name: saved.name,
            neighborhood: saved.neighborhood,
            url: `/places/${saved.id}`
        },
        meta: {
            expandedUrl: expanded,
            googlePlaceId: placeId
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__90248403._.js.map