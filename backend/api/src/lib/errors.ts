import type { Response } from "express";

/**
 * Standardized API error response.
 * Shape: { error: { code, message, details? } }
 */
export function apiError(
  code: string,
  message: string,
  details?: Record<string, unknown>
) {
  return { error: { code, message, ...(details ? { details } : {}) } };
}

export function sendError(res: Response, status: number, code: string, message: string, details?: Record<string, unknown>) {
  res.status(status).json(apiError(code, message, details));
}
