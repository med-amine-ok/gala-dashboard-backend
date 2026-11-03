import { NextRequest } from "next/server";
import { and, asc, eq, gt, inArray, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { participantsParticipant, payments, ticketsTicket } from "@/db/schema";
import { fulfillPayment } from "@/lib/payments/fulfill";
import { CheckoutIndex, ChargilyError } from "@/lib/payments/chargily";
import { emailTicket } from "@/lib/tickets/email-ticket";
import { corsPreflight, corsReply, requireHrAdmin } from "@/lib/security/hr-auth";

/**
 * HR dashboard "Check payment" / "Sync payments".
 *
 * POST { participantIds: number[] }   -> check those participants
 * POST { afterId?: number }           -> next batch of approved participants
 *                                        that aren't fully done; call again
 *                                        with nextAfterId until it is null
 * Authorization: Bearer <HR dashboard token>
 *
 * For each participant: ask Chargily whether they paid; if so run the same
 * fulfilment as the webhook (paid + ticket + PDF email). Also repairs "paid
 * but no ticket" and "ticket never emailed".
 */

const BATCH = 5;

type Outcome = {
  id: number;
  name: string;
  result: "ticket_issued" | "email_resent" | "email_failed" | "up_to_date" | "not_paid" | "needs_review" | "error";
  ticketNumber?: string;
  emailSent?: boolean;
  detail?: string;
};

const MESSAGES: Record<Outcome["result"], string> = {
  ticket_issued: "Payment confirmed: ticket issued and emailed.",
  email_resent: "Ticket email sent (it had never been delivered).",
  email_failed: "Paid and ticket issued, but the email could not be sent.",
  up_to_date: "Already paid, ticket issued and emailed.",
  not_paid: "No completed payment found on Chargily for this participant.",
  needs_review: "Paid on Chargily but not approved: approve them, then check again (or refund).",
  error: "Could not check with Chargily.",
};

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

async function syncOne(p: typeof participantsParticipant.$inferSelect, index: CheckoutIndex): Promise<Outcome> {
  const base = { id: p.id, name: `${p.firstName || ""} ${p.lastName || ""}`.trim() };
  const ticket = await db.query.ticketsTicket.findFirst({
    where: and(eq(ticketsTicket.participantId, p.id), ne(ticketsTicket.status, "cancelled")),
  });

  if (p.paymentStatus === "paid" && ticket) {
    if (ticket.emailSent) return { ...base, result: "up_to_date", ticketNumber: ticket.serialNumber };
    const sent = await emailTicket(p, ticket);
    return { ...base, result: sent ? "email_resent" : "email_failed", ticketNumber: ticket.serialNumber, emailSent: sent };
  }

  let checkout: any = null;
  if (p.paymentStatus !== "paid") {
    const payment = await db.query.payments.findFirst({ where: eq(payments.participantId, p.id) });
    try {
      checkout = await index.paidCheckout(p.id, payment?.chargilyCheckoutId);
    } catch (err) {
      return { ...base, result: "error", detail: err instanceof ChargilyError ? err.message : String(err) };
    }
    if (!checkout) return { ...base, result: "not_paid" };
  }

  // Paid (per Chargily, or already marked paid without a ticket): same fulfilment as the webhook
  const result = await fulfillPayment({
    participantId: p.id,
    paymentId: checkout?.metadata?.paymentId,
    chargilyCheckoutId: checkout?.id,
    amount: checkout?.amount,
  });
  if (result.needsReview) return { ...base, result: "needs_review" };
  return {
    ...base,
    result: result.emailSent ? "ticket_issued" : "email_failed",
    ticketNumber: result.ticketSerial,
    emailSent: result.emailSent,
  };
}

export async function POST(req: NextRequest) {
  const check = await requireHrAdmin(req);
  if ("error" in check) return corsReply(req, { error: check.error }, check.status);

  let body: { participantIds?: number[]; afterId?: number | null } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body = first batch */
  }

  let rows: (typeof participantsParticipant.$inferSelect)[];
  let more = false;
  if (body.participantIds?.length) {
    rows = await db.query.participantsParticipant.findMany({
      where: inArray(participantsParticipant.id, body.participantIds.map(Number).slice(0, BATCH * 4)),
    });
  } else {
    // Approved participants, in id order, that are not fully done
    const candidates = await db
      .select({ p: participantsParticipant, ticket: ticketsTicket })
      .from(participantsParticipant)
      .leftJoin(ticketsTicket, eq(ticketsTicket.participantId, participantsParticipant.id))
      .where(and(eq(participantsParticipant.status, "APPROVED"), gt(participantsParticipant.id, Number(body.afterId) || 0)))
      .orderBy(asc(participantsParticipant.id));
    const pending = candidates
      .filter(({ p, ticket }) => p.paymentStatus !== "paid" || !ticket || (!ticket.emailSent && ticket.status !== "cancelled"))
      .map(({ p }) => p);
    more = pending.length > BATCH;
    rows = pending.slice(0, BATCH);
  }

  const index = new CheckoutIndex();
  const results: Outcome[] = [];
  for (const p of rows) {
    const outcome = await syncOne(p, index);
    results.push(outcome);
    if (outcome.result === "error") break; // Chargily unreachable / not configured
  }

  const single = body.participantIds?.length === 1 ? results[0] : undefined;
  const lastOk = results.length && results[results.length - 1].result !== "error";
  return corsReply(req, {
    results: results.map((r) => ({ ...r, message: MESSAGES[r.result] })),
    ...(single ? { ...single, message: single.detail || MESSAGES[single.result] } : {}),
    nextAfterId: more && lastOk ? rows[rows.length - 1].id : null,
  }, single?.result === "error" ? 502 : 200);
}
