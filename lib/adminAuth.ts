export function isValidAdminSecret(secret: string | null | undefined) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  return secret === expected;
}
