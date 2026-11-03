import { NextRequest, NextResponse } from "next/server";

/**
 * Helpers for the routes the HR dashboard calls from the browser
 * (payment links, payment sync, ticket assignment / resend).
 *
 * The dashboard sends its own Django access token; we ask the Django backend
 * who it belongs to, so only HR admins (HR role or superuser) get through.
 */

export function backendUrl() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "production" ? "https://gala-dashboard-backend.onrender.com" : "http://127.0.0.1:8000")
  ).replace(/\/$/, "");
}

/** Dashboard origins allowed to call these routes from the browser. */
function allowedOrigins() {
  return (process.env.DASHBOARD_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function withCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  if (allowedOrigins().includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }
  return res;
}

export const corsReply = (req: NextRequest, body: unknown, status = 200) =>
  withCors(req, NextResponse.json(body, { status }));

export const corsPreflight = (req: NextRequest) => withCors(req, new NextResponse(null, { status: 204 }));

export async function requireHrAdmin(req: NextRequest): Promise<{ error: string; status: number } | { me: any }> {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return { error: "Not logged in.", status: 401 };
  try {
    const res = await fetch(`${backendUrl()}/api/accounts/current_user/`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (res.status === 401) return { error: "Your session has expired. Please log in again.", status: 401 };
    if (!res.ok) return { error: `Could not verify your account (backend HTTP ${res.status}).`, status: 502 };
    const me = await res.json();
    const isHr = me.is_hr_admin ?? me.role === "HR";
    if (!isHr) return { error: "Only HR admins can do this.", status: 403 };
    return { me };
  } catch {
    return { error: "Could not reach the backend to verify your account.", status: 502 };
  }
}
