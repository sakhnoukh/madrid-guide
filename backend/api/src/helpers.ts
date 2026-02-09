/**
 * Compute a simple dedupe key for a place.
 * Format: lowercase name | city | rounded lat,lng (3 decimal places ≈ 110m)
 */
export function computeDedupeKey(
  name: string,
  city: string,
  lat?: number | null,
  lng?: number | null
): string {
  const n = name.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "");
  const c = city.toLowerCase().trim();
  const latR = typeof lat === "number" ? lat.toFixed(3) : "0";
  const lngR = typeof lng === "number" ? lng.toFixed(3) : "0";
  return `${n}|${c}|${latR},${lngR}`;
}
