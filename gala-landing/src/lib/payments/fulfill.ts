import { db } from "@/db/client";
import { generateAndSendTicket } from "@/lib/tickets/tickets";
import { eq, sql } from "drizzle-orm";
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

export async function fulfillPayment({
  participantId,
  paymentId,
  chargilyCheckoutId,
  amount = 1000,
}: FulfillPaymentParams) {
  const pId = Number(participantId);
  const now = new Date().toISOString();

  // 1. Fetch participant
  const participant = await db.query.participantsParticipant.findFirst({
    where: eq(participantsParticipant.id, pId),
  });

  if (!participant) {
    throw new Error(`Participant ${pId} not found`);
  }

  // 2. Check or create payment record
  let paymentRecord = await db.query.payments.findFirst({
    where: eq(payments.participantId, pId),
  });

  if (!paymentRecord) {
    const [newPayment] = await db
      .insert(payments)
      .values({
        id: paymentId || crypto.randomUUID(),
        participantId: pId,
        amount,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    paymentRecord = newPayment;
  }

  let assignedSerialNumber = "";
  let assignedTicketId: number | null = null;

  // 3. Database Transaction: Update Payment, Participant, and Ticket
  await db.transaction(async (tx) => {
    // a. Update payment status to succeeded
    await tx
      .update(payments)
      .set({
        status: "succeeded",
        updatedAt: now,
      })
      .where(eq(payments.id, paymentRecord!.id));

    // b. Update participant in participants_participant table
    await tx
      .update(participantsParticipant)
      .set({
        paymentStatus: "paid",
        status: "APPROVED",
        approvedAt: now,
        updatedAt: now,
      })
      .where(eq(participantsParticipant.id, pId));

    // c. Activate user account in accounts_customuser
    if (participant.userId) {
      await tx
        .update(accountsCustomuser)
        .set({
          isActive: true,
          updatedAt: now,
        })
        .where(eq(accountsCustomuser.id, participant.userId));
    }

    // d. Check if participant already has a ticket
    const existingTicket = await tx.query.ticketsTicket.findFirst({
      where: eq(ticketsTicket.participantId, pId),
    });

    if (existingTicket) {
      assignedSerialNumber = existingTicket.serialNumber;
      assignedTicketId = existingTicket.id;

      if (existingTicket.status !== "assigned") {
        await tx
          .update(ticketsTicket)
          .set({
            status: "assigned",
            assignedAt: existingTicket.assignedAt || now,
            updatedAt: now,
          })
          .where(eq(ticketsTicket.id, existingTicket.id));
      }
    } else {
      // Find an unassigned ticket
      const unassigned = await tx
        .select()
        .from(ticketsTicket)
        .where(sql`${ticketsTicket.participantId} IS NULL`)
        .limit(1);

      if (unassigned && unassigned.length > 0) {
        await tx
          .update(ticketsTicket)
          .set({
            participantId: pId,
            status: "assigned",
            assignedAt: now,
            issuedAt: now,
            updatedAt: now,
          })
          .where(eq(ticketsTicket.id, unassigned[0].id));

        assignedSerialNumber = unassigned[0].serialNumber;
        assignedTicketId = unassigned[0].id;
      } else {
        // Generate new ticket following GT<YEAR><HEX> format
        const year = new Date().getFullYear();
        const hex = crypto
          .randomUUID()
          .replace(/-/g, "")
          .substring(0, 8)
          .toUpperCase();
        const serialNumber = `GT${year}${hex}`;

        const [createdTicket] = await tx
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

        assignedSerialNumber = createdTicket.serialNumber;
        assignedTicketId = createdTicket.id;
      }
    }
  });

  // 4. Send personalized PDF ticket via Mailtrap
  let recipientEmail = participant.email || "";
  if (!recipientEmail && participant.userId) {
    const user = await db.query.accountsCustomuser.findFirst({
      where: eq(accountsCustomuser.id, participant.userId),
    });
    if (user?.email) recipientEmail = user.email;
  }

  let emailSent = false;
  if (assignedSerialNumber && assignedTicketId && recipientEmail) {
    try {
      console.log(`Sending ticket ${assignedSerialNumber} to ${recipientEmail}...`);
      const ticketResult = await generateAndSendTicket({
        firstName: participant.firstName || "",
        lastName: participant.lastName || "",
        email: recipientEmail,
        ticketId: assignedSerialNumber,
      });

      if (ticketResult?.ok) {
        emailSent = true;
        await db
          .update(ticketsTicket)
          .set({
            emailSent: true,
            emailSentAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(ticketsTicket.id, assignedTicketId));
        console.log(`✅ Ticket ${assignedSerialNumber} email marked as sent in DB.`);
      } else {
        console.error("❌ generateAndSendTicket returned error:", ticketResult?.error);
      }
    } catch (err) {
      console.error("❌ Email dispatch error:", err);
    }
  }

  return {
    success: true,
    participantId: pId,
    ticketSerial: assignedSerialNumber,
    ticketId: assignedTicketId,
    emailSent,
    recipientEmail,
  };
}
