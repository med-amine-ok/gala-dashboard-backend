import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db/client";
import { accountsCustomuser, participantsParticipant, payments, ticketsTicket } from "@/db/schema";
import { emailTicket } from "@/lib/tickets/email-ticket";
import { corsPreflight, corsReply, requireHrAdmin } from "@/lib/security/hr-auth";

/**
 * HR dashboard "Assign ticket & record payment" (cash / transfer).
 * POST { participantId, ticketSerial, reference? }  Authorization: Bearer <HR token>
 *
 * Gives a pre-generated ticket to an APPROVED participant, marks them paid and
 * emails the official PDF ticket. Row locks prevent double assignment.
 */

class AssignError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const check = await requireHrAdmin(req);
  if ("error" in check) return corsReply(req, { error: check.error }, check.status);

  let body: { participantId?: number | string; ticketSerial?: string; reference?: string };
  try {
    body = await req.json();
  } catch {
    return corsReply(req, { error: "Invalid JSON body." }, 400);
  }
  const participantId = Number(body.participantId);
  const ticketSerial = String(body.ticketSerial || "").trim().toUpperCase();
  if (!Number.isFinite(participantId) || !ticketSerial) {
    return corsReply(req, { error: "participantId and ticketSerial are required." }, 400);
  }

  const now = new Date().toISOString();
  let assigned: { participant: typeof participantsParticipant.$inferSelect; ticket: typeof ticketsTicket.$inferSelect };
  try {
    assigned = await db.transaction(async (tx) => {
      const [participant] = await tx
        .select().from(participantsParticipant)
        .where(eq(participantsParticipant.id, participantId))
        .for("update");
      if (!participant) throw new AssignError(`Participant ${participantId} not found`, 404);
      if (participant.status !== "APPROVED") throw new AssignError("Only approved participants can get a ticket.");

      const existing = await tx.query.ticketsTicket.findFirst({ where: eq(ticketsTicket.participantId, participantId) });
      if (existing) throw new AssignError(`Participant already has ticket ${existing.serialNumber}`);

      const [ticket] = await tx
        .select().from(ticketsTicket)
        .where(eq(ticketsTicket.serialNumber, ticketSerial))
        .for("update");
      if (!ticket) throw new AssignError(`Ticket ${ticketSerial} not found`, 404);
      if (ticket.participantId) throw new AssignError(`Ticket ${ticketSerial} is already assigned`);
      if (ticket.status === "cancelled") throw new AssignError(`Ticket ${ticketSerial} is cancelled`);

      const [updatedTicket] = await tx
        .update(ticketsTicket)
        .set({ participantId, status: "assigned", assignedAt: now, issuedAt: now, updatedAt: now })
        .where(eq(ticketsTicket.id, ticket.id))
        .returning();

      await tx.update(participantsParticipant)
        .set({ paymentStatus: "paid", updatedAt: now })
        .where(eq(participantsParticipant.id, participantId));
      if (participant.userId) {
        await tx.update(accountsCustomuser).set({ isActive: true, updatedAt: now }).where(eq(accountsCustomuser.id, participant.userId));
      }

      // Keep the payments table in line (manual payment)
      const payment = await tx.query.payments.findFirst({ where: eq(payments.participantId, participantId) });
      if (payment) {
        await tx.update(payments).set({ status: "succeeded", updatedAt: now }).where(eq(payments.id, payment.id));
      } else {
        await tx.insert(payments).values({
          id: crypto.randomUUID(), participantId, amount: Number(process.env.TICKET_PRICE_DZD) || 100,
          status: "succeeded", createdAt: now, updatedAt: now,
        });
      }
      return { participant, ticket: updatedTicket };
    });
  } catch (err) {
    if (err instanceof AssignError) return corsReply(req, { error: err.message }, err.status);
    console.error("Ticket assignment failed:", err);
    return corsReply(req, { error: "Ticket assignment failed." }, 500);
  }

  const emailSent = await emailTicket(assigned.participant, assigned.ticket);
  return corsReply(req, {
    success: true,
    email_sent: emailSent,
    message: emailSent
      ? `Ticket ${assigned.ticket.serialNumber} assigned and emailed to ${assigned.participant.email}.`
      : `Ticket ${assigned.ticket.serialNumber} assigned, but the email could not be sent. Use "Resend ticket email" after checking MAIL_* settings.`,
    data: {
      participant_id: participantId,
      ticket_serial: assigned.ticket.serialNumber,
      payment_reference: body.reference || null,
    },
  });
}
