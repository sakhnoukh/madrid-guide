/**
 * Validate latitude is in range [-90, 90].
 */
export function isValidLat(lat: unknown): lat is number {
  return typeof lat === "number" && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude is in range [-180, 180].
 */
export function isValidLng(lng: unknown): lng is number {
  return typeof lng === "number" && lng >= -180 && lng <= 180;
}

/**
 * Validate rating is an integer between 1 and 5.
 */
export function isValidRating(rating: unknown): rating is number {
  return typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Validate save_status enum value.
 */
export function isValidStatus(status: unknown): status is "want" | "been" {
  return status === "want" || status === "been";
}

/**
 * Validate visibility enum value.
 */
export function isValidVisibility(v: unknown): v is "private" | "unlisted" | "public" {
  return v === "private" || v === "unlisted" || v === "public";
}

/**
 * Validate import_source enum value.
 */
const VALID_IMPORT_SOURCES = ["instagram_url", "tiktok_url", "google_maps_url", "screenshot"] as const;
export type ImportSource = (typeof VALID_IMPORT_SOURCES)[number];

export function isValidImportSource(s: unknown): s is ImportSource {
  return typeof s === "string" && (VALID_IMPORT_SOURCES as readonly string[]).includes(s);
}
