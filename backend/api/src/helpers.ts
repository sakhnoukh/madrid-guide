/**
 * Normalize a name for dedupe/search: lowercase, strip punctuation, collapse whitespace.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Compute a dedupe key for a place.
 * Format: name_norm|city_norm|round(lat,4)|round(lng,4)
 * 4 decimal places ≈ 11m precision
 */
export function computeDedupeKey(
  name: string,
  city: string,
  lat: number,
  lng: number
): string {
  const n = normalizeName(name);
  const c = normalizeName(city || "");
  return `${n}|${c}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
}

/**
 * Standardized API error response.
 */
export function apiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return { error: { code, message, ...(details ? { details } : {}) } };
}

/**
 * Truncate a string to a max length.
 */
export function truncate(s: string | undefined | null, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}
