import { timingSafeEqual } from "crypto";

/**
 * Internal routes (bulk emails, ticket re-sends) are not for the public.
 * Callers must send `Authorization: Bearer <INTERNAL_API_TOKEN>`.
 * When INTERNAL_API_TOKEN is not configured, every call is refused.
 */
export function isInternalRequest(req: Request): boolean {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected) return false;
  const header = req.headers.get("authorization") || "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
