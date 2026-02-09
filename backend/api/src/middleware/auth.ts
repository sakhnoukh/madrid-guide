import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { apiError } from "../lib/errors.js";

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// ── Supabase JWKS setup ──
const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://<ref>.supabase.co
const DEV_MOCK_AUTH = process.env.DEV_MOCK_AUTH === "true";

let JWKS: JWTVerifyGetKey | null = null;
let ISSUER: string | null = null;

if (SUPABASE_URL) {
  JWKS = createRemoteJWKSet(
    new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
  );
  ISSUER = `${SUPABASE_URL}/auth/v1`;
  console.log(`[Auth] JWKS verification enabled (issuer: ${ISSUER})`);
} else if (DEV_MOCK_AUTH) {
  console.log("[Auth] DEV_MOCK_AUTH=true — Bearer token treated as user UUID (no JWT verification)");
} else {
  console.warn("[Auth] WARNING: No SUPABASE_URL set and DEV_MOCK_AUTH is not true. All authenticated requests will fail.");
}

/**
 * Auth middleware.
 * - Production: verifies Supabase JWT via JWKS, checks exp + issuer, sets req.userId = sub.
 * - Dev (DEV_MOCK_AUTH=true): treats Bearer token as a raw user UUID (for smoke tests).
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json(apiError("UNAUTHORIZED", "Missing or invalid Authorization header"));
      return;
    }

    const token = header.slice(7).trim();

    if (!token) {
      res.status(401).json(apiError("UNAUTHORIZED", "Empty bearer token"));
      return;
    }

    // ── Dev mock path ──
    if (DEV_MOCK_AUTH && !JWKS) {
      req.userId = token;
      next();
      return;
    }

    // ── Production: verify JWT ──
    if (!JWKS || !ISSUER) {
      res.status(500).json(apiError("SERVER_CONFIG_ERROR", "Auth not configured — set SUPABASE_URL or DEV_MOCK_AUTH"));
      return;
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: "authenticated",
    });

    const sub = payload.sub;
    if (!sub) {
      res.status(401).json(apiError("INVALID_TOKEN", "Token missing sub claim"));
      return;
    }

    req.userId = sub;
    next();
  } catch (err: any) {
    res.status(401).json(apiError("INVALID_TOKEN", "Token verification failed", { reason: err?.message }));
  }
}
