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

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function expandGoogleMapsUrl(url: string): Promise<string> {
  // Handles maps.app.goo.gl and goo.gl short links by following redirects.
  // Some short links require browser-like headers to expand properly.
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    // If redirect worked, res.url is the final URL
    if (res.url && res.url !== url) {
      console.log("[expandGoogleMapsUrl] expanded:", url, "->", res.url);
      return res.url;
    }

    // Some redirects embed the final URL in the HTML body (JavaScript redirect)
    // Try to extract it from the response body
    const html = await res.text();
    const match = html.match(/window\.location\.replace\(['"]([^'"]+)['"]\)/);
    if (match?.[1]) {
      const decoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
      console.log("[expandGoogleMapsUrl] extracted from JS:", decoded);
      return decoded;
    }

    // Also check for meta refresh or canonical link
    const metaMatch = html.match(/<meta[^>]+url=([^">\s]+)/i);
    if (metaMatch?.[1]) {
      console.log("[expandGoogleMapsUrl] extracted from meta:", metaMatch[1]);
      return metaMatch[1];
    }

    return res.url || url;
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
