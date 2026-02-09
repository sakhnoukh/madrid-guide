import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Auth middleware stub.
 * In PR2 this will verify a real JWT (Supabase/Clerk).
 * For now, accepts a Bearer token and treats it as the user ID.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = header.slice(7).trim();

  if (!token) {
    res.status(401).json({ error: "Empty bearer token" });
    return;
  }

  // STUB: treat token as user ID directly
  // TODO (PR2): verify JWT and extract real user_id
  req.userId = token;

  next();
}
