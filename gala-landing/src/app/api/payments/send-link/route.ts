import { NextRequest } from "next/server";
import { corsPreflight, corsReply, requireHrAdmin } from "@/lib/security/hr-auth";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { participantsParticipant } from "@/db/schema";
import { sendEmail } from "@/lib/tickets/send-email";
import { paymentLinkEmail } from "@/lib/email/templates";
import { appUrl, isDevOnlyUrl } from "@/lib/participants/lookup";

/**
 * Used by the HR dashboard's "Send payment link" buttons.
 *
 * POST { participantIds: number[] }  (or { participantId })
 * Authorization: Bearer <the HR user's dashboard access token>
 *
 * The token is checked by asking the Django backend who it belongs to, so only
 * HR admins can send. Only APPROVED, unpaid participants get the email; the
 * link uses their secret public token, never the numeric id.
 */

const MAX_PER_CALL = 50;

const reply = corsReply;

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const check = await requireHrAdmin(req);
  if ("error" in check) return reply(req, { error: check.error }, check.status);

  let body: { participantId?: number; participantIds?: number[] };
  try {
    body = await req.json();
  } catch {
    return reply(req, { error: "Invalid JSON body." }, 400);
  }
  const ids = (body.participantIds ?? (body.participantId != null ? [body.participantId] : []))
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (ids.length === 0 || ids.length > MAX_PER_CALL) {
    return reply(req, { error: `Send between 1 and ${MAX_PER_CALL} participant ids.` }, 400);
  }

  // Participants open the link from their own phone: it must be the public
  // payment page, never localhost (e.g. when the landing site runs on a laptop)
  const linkBase = (process.env.PAYMENT_LINK_BASE_URL || appUrl(req)).replace(/\/$/, "");
  if (isDevOnlyUrl(linkBase)) {
    return reply(req, {
      error:
        `Payment links would point to ${linkBase}, which participants can't open. ` +
        "Set PAYMENT_LINK_BASE_URL (or NEXT_PUBLIC_APP_URL) to the public site, e.g. https://gala-vic.vercel.app, and restart.",
    }, 409);
  }

  const rows = await db.query.participantsParticipant.findMany({
    where: inArray(participantsParticipant.id, ids),
  });
  const byId = new Map(rows.map((p) => [p.id, p]));

  const sent: { id: number; email: string; paymentUrl: string }[] = [];
  const skipped: { id: number; reason: string; paymentUrl?: string }[] = [];

  for (const id of ids) {
    const p = byId.get(id);
    if (!p) {
      skipped.push({ id, reason: "not found" });
      continue;
    }
    if (p.status !== "APPROVED") {
      skipped.push({ id, reason: "not approved" });
      continue;
    }
    if (p.paymentStatus === "paid") {
      skipped.push({ id, reason: "already paid" });
      continue;
    }
    if (!p.email) {
      skipped.push({ id, reason: "no email address" });
      continue;
    }
    if (!p.publicToken) {
      skipped.push({ id, reason: "missing payment token (run the backend migrations)" });
      continue;
    }
    const paymentUrl = `${linkBase}/payment/${p.publicToken}`;
    try {
      const mail = paymentLinkEmail(p.firstName, paymentUrl);
      await sendEmail({ to: p.email, subject: mail.subject, text: mail.text, html: mail.html });
      sent.push({ id, email: p.email, paymentUrl });
    } catch (err) {
      console.error(`Payment link email to participant ${id} failed:`, err);
      skipped.push({ id, reason: `email failed: ${String((err as Error)?.message || err).slice(0, 160)}`, paymentUrl });
    }
  }

  const message =
    `Payment link sent to ${sent.length} participant(s).` +
    (skipped.length ? ` ${skipped.length} skipped: ${skipped.map((s) => s.reason).join(", ")}.` : "");
  const status = sent.length === 0 && skipped.length > 0 ? 422 : 200;
  return reply(req, { message, sent, skipped }, status);
}
