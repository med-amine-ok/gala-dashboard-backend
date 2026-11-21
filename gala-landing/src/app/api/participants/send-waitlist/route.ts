import { NextRequest } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { participantsParticipant } from "@/db/schema";
import { sendEmail } from "@/lib/tickets/send-email";
import { waitlistEmail } from "@/lib/email/templates";
import { corsPreflight, corsReply, requireHrAdmin } from "@/lib/security/hr-auth";

/**
 * Used by the HR dashboard's "Waiting-list email" buttons.
 *
 * POST { participantIds: number[] }
 * Authorization: Bearer <the HR user's dashboard access token>
 *
 * Sends the waiting-list email to participants whose registration is PENDING
 * or REJECTED (approved participants are skipped: they get the payment link).
 */

const MAX_PER_CALL = 50;
const WAITLIST_STATUSES = new Set(["PENDING", "REJECTED"]);

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const check = await requireHrAdmin(req);
  if ("error" in check) return corsReply(req, { error: check.error }, check.status);

  let body: { participantIds?: number[] };
  try {
    body = await req.json();
  } catch {
    return corsReply(req, { error: "Invalid JSON body." }, 400);
  }
  const ids = (body.participantIds ?? []).map(Number).filter((n) => Number.isFinite(n));
  if (ids.length === 0 || ids.length > MAX_PER_CALL) {
    return corsReply(req, { error: `Send between 1 and ${MAX_PER_CALL} participant ids.` }, 400);
  }

  const rows = await db.query.participantsParticipant.findMany({
    where: inArray(participantsParticipant.id, ids),
  });
  const byId = new Map(rows.map((p) => [p.id, p]));

  const sent: { id: number; email: string }[] = [];
  const skipped: { id: number; reason: string }[] = [];

  for (const id of ids) {
    const p = byId.get(id);
    if (!p) {
      skipped.push({ id, reason: "not found" });
      continue;
    }
    if (!WAITLIST_STATUSES.has(p.status)) {
      skipped.push({ id, reason: "approved (gets the payment link instead)" });
      continue;
    }
    if (!p.email) {
      skipped.push({ id, reason: "no email address" });
      continue;
    }
    try {
      const mail = waitlistEmail(p.firstName);
      await sendEmail({ to: p.email, subject: mail.subject, text: mail.text, html: mail.html });
      sent.push({ id, email: p.email });
    } catch (err) {
      console.error(`Waiting-list email to participant ${id} failed:`, err);
      skipped.push({ id, reason: `email failed: ${String((err as Error)?.message || err).slice(0, 160)}` });
    }
  }

  const message =
    `Waiting-list email sent to ${sent.length} participant(s).` +
    (skipped.length ? ` ${skipped.length} skipped: ${[...new Set(skipped.map((s) => s.reason))].join(", ")}.` : "");
  const status = sent.length === 0 && skipped.length > 0 ? 422 : 200;
  return corsReply(req, { message, sent, skipped }, status);
}
