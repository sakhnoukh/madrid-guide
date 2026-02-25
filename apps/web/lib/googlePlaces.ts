// lib/googlePlaces.ts

type PlaceDetails = {
  placeId: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  googleMapsUri?: string;
  priceLevel?: number;
  primaryPhotoName?: string;
};

const MADRID_CENTER = { lat: 40.4168, lng: -3.7038 };

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[),.!?]+$/, "");
}

function normalizeEscapedUrl(value: string) {
  return value
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function isGoogleMapsUrl(value: string) {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    return (
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host.startsWith("maps.google.") ||
      (host.includes("google.") && u.pathname.startsWith("/maps"))
    );
  } catch {
    return false;
  }
}

function extractGoogleMapsUrlFromParams(url: string): string | null {
  try {
    const u = new URL(url);
    const keys = ["link", "url", "q", "query", "destination", "daddr"];

    for (const key of keys) {
      const value = u.searchParams.get(key);
      if (!value) continue;

      const decoded = decodeURIComponentSafe(value.trim());
      const linkMatch = decoded.match(/https?:\/\/[^\s"'<>]+/i);
      const candidate = stripTrailingPunctuation(linkMatch ? linkMatch[0] : decoded);

      if (isGoogleMapsUrl(candidate)) return candidate;
    }

    return null;
  } catch {
    return null;
  }
}

function extractGoogleMapsUrlFromHtml(html: string): string | null {
  const normalized = normalizeEscapedUrl(html);

  const locationMatch =
    normalized.match(/window\.location\.replace\(['"]([^'"]+)['"]\)/i) ||
    normalized.match(/window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i) ||
    normalized.match(/location\.href\s*=\s*['"]([^'"]+)['"]/i);

  if (locationMatch?.[1]) {
    const candidate = stripTrailingPunctuation(locationMatch[1]);
    if (isGoogleMapsUrl(candidate)) return candidate;
  }

  const canonicalMatch = normalized.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (canonicalMatch?.[1]) {
    const candidate = stripTrailingPunctuation(canonicalMatch[1]);
    if (isGoogleMapsUrl(candidate)) return candidate;
  }

  const metaMatch = normalized.match(/<meta[^>]+url=([^">\s]+)/i);
  if (metaMatch?.[1]) {
    const candidate = stripTrailingPunctuation(metaMatch[1]);
    if (isGoogleMapsUrl(candidate)) return candidate;
  }

  const linkMatch = normalized.match(
    /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|(?:www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)\/[^\s"'<>]+/i
  );
  if (linkMatch?.[0]) {
    const candidate = stripTrailingPunctuation(linkMatch[0]);
    if (isGoogleMapsUrl(candidate)) return candidate;
  }

  return null;
}

function cleanupTitleCandidate(value: string): string | null {
  const decoded = decodeHtmlEntities(value)
    .replace(/\s+/g, " ")
    .trim();

  if (!decoded) return null;

  const withoutSuffix = decoded
    .replace(/\s*[\-|—]\s*google maps$/i, "")
    .replace(/\s*\|\s*google maps$/i, "")
    .trim();

  const primary = withoutSuffix
    .split("·")[0]
    .split("|")[0]
    .split("\n")[0]
    .trim();

  if (!primary || primary.length < 3) return null;
  if (/^google maps$/i.test(primary)) return null;
  if (/find local businesses/i.test(primary)) return null;

  return primary;
}

function extractTextQueryFromHtml(html: string): string | null {
  const normalized = normalizeEscapedUrl(html);

  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
    /"title"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const candidate = cleanupTitleCandidate(match?.[1] || "");
    if (candidate) return candidate;
  }

  return null;
}

function normalizeQueryCandidate(input?: string | null): string | null {
  if (!input) return null;
  const decoded = decodeURIComponentSafe(input.replace(/\+/g, " ")).trim();
  if (!decoded) return null;
  if (/^place_id:/i.test(decoded)) return null;
  if (/^ChI[a-zA-Z0-9_-]{10,}$/.test(decoded)) return null;
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(decoded)) return null;
  return decoded;
}

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function expandGoogleMapsUrl(url: string): Promise<string> {
  // Handles maps.app.goo.gl and goo.gl short links by following redirects.
  // Some short links require browser-like headers to expand properly.
  try {
    let current = stripTrailingPunctuation(url.trim());
    const seen = new Set<string>();

    for (let i = 0; i < 4; i += 1) {
      if (!current || seen.has(current)) break;
      seen.add(current);

      const nestedBeforeFetch = extractGoogleMapsUrlFromParams(current);
      if (nestedBeforeFetch && nestedBeforeFetch !== current) {
        current = nestedBeforeFetch;
        continue;
      }

      const res = await fetch(current, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      const finalUrl = stripTrailingPunctuation(res.url || current);

      const nestedInFinal = extractGoogleMapsUrlFromParams(finalUrl);
      if (nestedInFinal && nestedInFinal !== current) {
        current = nestedInFinal;
        continue;
      }

      const html = await res.text();
      const fromHtml = extractGoogleMapsUrlFromHtml(html);
      if (fromHtml && fromHtml !== current) {
        current = fromHtml;
        continue;
      }

      const queryFromHtml = extractTextQueryFromHtml(html);
      if (queryFromHtml) {
        const syntheticSearchUrl =
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryFromHtml)}`;
        console.log("[expandGoogleMapsUrl] built search URL from HTML title:", queryFromHtml);
        return syntheticSearchUrl;
      }

      if (finalUrl !== current) {
        console.log("[expandGoogleMapsUrl] expanded:", url, "->", finalUrl);
      }
      return finalUrl;
    }

    return current;
  } catch (err) {
    console.log("[expandGoogleMapsUrl] fetch failed, returning original URL:", err);
    return url;
  }
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

    if (q && /^ChI[a-zA-Z0-9_-]{10,}$/.test(q)) {
      return q;
    }

    // Sometimes: place_id=ChI... or query_place_id=ChI...
    const pid =
      u.searchParams.get("place_id") ||
      u.searchParams.get("query_place_id") ||
      u.searchParams.get("ftid");
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
  // Fallback: derive a text query from known maps URL shapes.
  try {
    const u = new URL(url);

    const queryParams = ["query", "q", "destination", "daddr"];
    for (const key of queryParams) {
      const candidate = normalizeQueryCandidate(u.searchParams.get(key));
      if (candidate) return candidate;
    }

    const parts = u.pathname.split("/").filter(Boolean);

    const placeIdx = parts.findIndex((p) => p === "place");
    if (placeIdx >= 0 && parts[placeIdx + 1]) {
      const candidate = normalizeQueryCandidate(parts[placeIdx + 1]);
      if (candidate) return candidate;
    }

    const searchIdx = parts.findIndex((p) => p === "search");
    if (searchIdx >= 0 && parts[searchIdx + 1]) {
      const candidate = normalizeQueryCandidate(parts[searchIdx + 1]);
      if (candidate) return candidate;
    }

    const pathMatch = u.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/i);
    if (pathMatch?.[1]) {
      const candidate = normalizeQueryCandidate(pathMatch[1]);
      if (candidate) return candidate;
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
      "id,displayName,formattedAddress,location,googleMapsUri,priceLevel,photos",
  });

  const photoName = data?.photos?.[0]?.name;

  return {
    placeId: data?.id,
    name: data?.displayName?.text || "Unknown place",
    address: data?.formattedAddress,
    lat: data?.location?.latitude,
    lng: data?.location?.longitude,
    googleMapsUri: data?.googleMapsUri,
    priceLevel:
      typeof data?.priceLevel === "number" ? data.priceLevel : undefined,
    primaryPhotoName: typeof photoName === "string" ? photoName : undefined,
  };
}
