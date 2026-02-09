/**
 * Normalize a name: lowercase, strip non-alphanumeric, collapse whitespace.
 * Mirrors the DB normalize_text() function.
 */
export function normalizeText(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Compute a dedupe key for a place.
 * Format: normalize(name)|normalize(city)|round(lat,4)|round(lng,4)
 */
export function computeDedupeKey(
  name: string,
  city: string,
  lat: number,
  lng: number
): string {
  const n = normalizeText(name);
  const c = normalizeText(city || "");
  return `${n}|${c}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
}

/**
 * Truncate a string to a max length. Returns null for falsy input.
 */
export function truncate(s: string | undefined | null, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

/** MVP truncation limits */
export const MAX = {
  NAME: 120,
  TITLE: 120,
  ADDRESS: 120,
  CITY: 120,
  REGION: 120,
  COUNTRY: 120,
  POSTAL: 120,
  PHONE: 250,
  URL: 250,
  NOTE: 2000,
  DESCRIPTION: 2000,
  OCR_TEXT: 20000,
} as const;
