import { db } from "@/db/client";
import { participantsParticipant } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Public links carry the participant's secret token. Old emails still carry
 *  the numeric id: those are accepted only where no personal data is returned. */
export function isLegacyNumericId(ref: string) {
  return /^\d+$/.test(ref);
}

export async function findParticipantByRef(ref: string) {
  if (!ref) return undefined;
  if (isLegacyNumericId(ref)) {
    return db.query.participantsParticipant.findFirst({
      where: eq(participantsParticipant.id, Number(ref)),
    });
  }
  return db.query.participantsParticipant.findFirst({
    where: eq(participantsParticipant.publicToken, ref),
  });
}

// Public site (used when NEXT_PUBLIC_APP_URL is not set and there is no request)
const DEFAULT_APP_URL = "https://gala.vic-enp.com";

/** Addresses that only work on a developer's machine. */
export function isDevOnlyUrl(url: string) {
  return /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)|\.loca\.lt|ngrok|trycloudflare\.com/i.test(url);
}

export function isProductionDeployment() {
  return process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === "production"
    : process.env.NODE_ENV === "production";
}

function usable(url: string | undefined, name: string) {
  const value = (url || "").trim().replace(/\/$/, "");
  if (!value) return "";
  if (isProductionDeployment() && isDevOnlyUrl(value)) {
    // A localhost / tunnel value copied from .env.local would send payers and
    // Chargily's webhook to a machine that isn't there: ignore it loudly.
    console.error(`${name}=${value} points to a development address; ignoring it in production.`);
    return "";
  }
  return value;
}

/**
 * Public base URL of this site, used in links given to Chargily and in emails.
 * Pass the incoming request to use the site the visitor is actually on (its
 * Host, set by Vercel, not the spoofable Origin header) when no URL is configured:
 * that is the deployment that will receive the webhook and the payer's return.
 */
export function appUrl(req?: Request) {
  const configured = usable(process.env.NEXT_PUBLIC_APP_URL, "NEXT_PUBLIC_APP_URL");
  if (configured) return configured;
  if (req) {
    const own = new URL(req.url).origin;
    if (!(isProductionDeployment() && isDevOnlyUrl(own))) return own;
  }
  return DEFAULT_APP_URL;
}

/** Where Chargily must POST payment events. */
export function webhookUrl(req?: Request) {
  return usable(process.env.WEBHOOK_URL, "WEBHOOK_URL") || `${appUrl(req)}/api/webhook`;
}
