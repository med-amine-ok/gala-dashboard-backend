import { db } from "@/db/client";
import { generateAndSendTicket } from "@/lib/tickets/tickets";
import { and, eq, isNull, ne } from "drizzle-orm";
import crypto from "crypto";
import {
  accountsCustomuser,
  participantsParticipant,
  payments,
  ticketsTicket,
} from "@/db/schema";

interface FulfillPaymentParams {
  participantId: number;
  paymentId?: string;
  chargilyCheckoutId?: string;
  amount?: number;
}

/**
 * Record a successful Chargily payment. Safe to call several times for the
 * same participant (webhook + success-page check): the participant row is
 * locked, so calls run one after the other and only the first one assigns a
 * ticket and sends the email.
 *
 * Rules (same as the Django backend):
 * - paying never changes the review status (no auto-approval),
 * - only APPROVED participants get a ticket; a payment from anyone else is
 *   recorded and flagged for HR (refund / manual decision),
 * - a free pre-generated ticket is taken with FOR UPDATE SKIP LOCKED, so two
 *   simultaneous payments can never receive the same ticket.
 */
export async function fulfillPayment({
  participantId,
  paymentId,
  chargilyCheckoutId,
  amount = 1000,
}: FulfillPaymentParams) {
  const pId = Number(participantId);
  const now = new Date().toISOString();

  let ticketSerial = "";
  let ticketId: number | null = null;
  let isNewTicket = false;
  let needsReview = false;

  const participant = await db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(participantsParticipant)
      .where(eq(participantsParticipant.id, pId))
      .for("update");
    if (!locked) {
      throw new Error(`Participant ${pId} not found`);
    }

    // Payment record: create or mark succeeded
    const existingPayment = await tx.query.payments.findFirst({
      where: eq(payments.participantId, pId),
    });
    if (existingPayment) {
      await tx
        .update(payments)
        .set({
          status: "succeeded",
          updatedAt: now,
          ...(chargilyCheckoutId ? { chargilyCheckoutId } : {}),
        })
        .where(eq(payments.id, existingPayment.id));
    } else {
      await tx.insert(payments).values({
        id: paymentId || crypto.randomUUID(),
        participantId: pId,
        amount,
        status: "succeeded",
        chargilyCheckoutId: chargilyCheckoutId || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    await tx
      .update(participantsParticipant)
      .set({ paymentStatus: "paid", updatedAt: now })
      .where(eq(participantsParticipant.id, pId));

    if (locked.status !== "APPROVED") {
      // Paid without being approved (e.g. rejected after receiving a link):
      // no ticket, HR decides (refund or approve, then issue the ticket).
      needsReview = true;
      console.warn(`Participant ${pId} paid while status=${locked.status}: no ticket issued, needs HR review`);
      return locked;
    }

    if (locked.userId) {
      await tx
        .update(accountsCustomuser)
        .set({ isActive: true, updatedAt: now })
        .where(eq(accountsCustomuser.id, locked.userId));
    }

    const existingTicket = await tx.query.ticketsTicket.findFirst({
      where: eq(ticketsTicket.participantId, pId),
    });

    if (existingTicket) {
      ticketSerial = existingTicket.serialNumber;
      ticketId = existingTicket.id;
      isNewTicket = !existingTicket.emailSent;
      if (existingTicket.status === "active") {
        await tx
          .update(ticketsTicket)
          .set({ status: "assigned", assignedAt: existingTicket.assignedAt || now, updatedAt: now })
          .where(eq(ticketsTicket.id, existingTicket.id));
      }
      return locked;
    }

    const [free] = await tx
      .select()
      .from(ticketsTicket)
      .where(and(isNull(ticketsTicket.participantId), ne(ticketsTicket.status, "cancelled")))
      .orderBy(ticketsTicket.createdAt)
      .limit(1)
      .for("update", { skipLocked: true });

    if (free) {
      await tx
        .update(ticketsTicket)
        .set({ participantId: pId, status: "assigned", assignedAt: now, issuedAt: now, updatedAt: now })
        .where(eq(ticketsTicket.id, free.id));
      ticketSerial = free.serialNumber;
      ticketId = free.id;
    } else {
      // Same format as Django: GT<YEAR> + 64 random bits
      const serialNumber = `GT${new Date().getFullYear()}${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      const [created] = await tx
        .insert(ticketsTicket)
        .values({
          serialNumber,
          status: "assigned",
          participantId: pId,
          issuedAt: now,
          assignedAt: now,
          emailSent: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      ticketSerial = created.serialNumber;
      ticketId = created.id;
    }
    isNewTicket = true;
    return locked;
  });

  // Email the PDF ticket once (outside the transaction)
  let recipientEmail = participant.email || "";
  if (!recipientEmail && participant.userId) {
    const user = await db.query.accountsCustomuser.findFirst({
      where: eq(accountsCustomuser.id, participant.userId),
    });
    if (user?.email) recipientEmail = user.email;
  }

  let emailSent = false;
  if (isNewTicket && ticketSerial && ticketId && recipientEmail) {
    try {
      const ticketResult = await generateAndSendTicket({
        firstName: participant.firstName || "",
        lastName: participant.lastName || "",
        email: recipientEmail,
        ticketId: ticketSerial,
      });
      if (ticketResult?.ok) {
        emailSent = true;
        await db
          .update(ticketsTicket)
          .set({ emailSent: true, emailSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
          .where(eq(ticketsTicket.id, ticketId));
      } else {
        console.error(`Ticket email failed for participant ${pId}`);
      }
    } catch (err) {
      console.error(`Ticket email error for participant ${pId}:`, err);
    }
  }

  return {
    success: true,
    participantId: pId,
    ticketSerial,
    ticketId,
    emailSent,
    needsReview,
  };
}
