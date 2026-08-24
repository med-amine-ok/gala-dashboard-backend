import { db } from "@/db/client";
import { generateAndSendTicket } from "@/lib/tickets/tickets";
import { verifySignature } from "@chargily/chargily-pay";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  participantsParticipant,
  payments,
  ticketsTicket,
} from "../../../../drizzle/schema";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const chargilySecretKey = process.env.CHARGILY_API_KEY!;
    const valid = verifySignature(
      Buffer.from(rawBody, "utf-8"),
      signature,
      chargilySecretKey
    );

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { participantId, paymentId } = event.data.metadata;

    switch (event.type) {
      case "checkout.paid": {
        // check if payment exists
        const payment = await db.query.payments.findFirst({
          where: eq(payments.participantId, participantId),
        });

        if (!payment) {
          return NextResponse.json(
            { error: "Payment not found" },
            { status: 404 }
          );
        }

        // check if payment is already processed

        if (payment.status === "succeeded") {
          return NextResponse.json({ message: "Already processed" });
        }

        if (payment.amount !== event.data.amount) {
          return NextResponse.json(
            { error: "Amount mismatch" },
            { status: 400 }
          );
        }

        const now = new Date().toISOString();
        let unassignedTicket = null;

        await db.transaction(async (tx) => {
          // update payment
          await tx
            .update(payments)
            .set({
              status: "succeeded",
              updatedAt: now,
            })
            .where(eq(payments.id, payment.id));

          // create ticket
          unassignedTicket = await tx
            .select()
            .from(ticketsTicket)
            .where(sql`${ticketsTicket.participantId} IS NULL`)
            .limit(1);

          if (unassignedTicket.length > 0) {
            // 2. Update it to assign to this participant
            await tx
              .update(ticketsTicket)
              .set({
                participantId,
                status: "assigned",
                issuedAt: now,
                emailSent: false,
                updatedAt: now,
              })
              .where(eq(ticketsTicket.id, unassignedTicket[0].id));
          }
        });

        // ticket status active inactive

        // get participant

        const participant = await db.query.participantsParticipant.findFirst({
          where: eq(participantsParticipant.id, participantId),
        });

        if (!participant) {
          throw new Error(`Participant ${participantId} not found`);
        }

        // update emailSent flag
        await generateAndSendTicket({
          firstName: participant!.firstName!,
          lastName: participant!.lastName!,
          email: participant!.email!,
          ticketId: unassignedTicket![0].serialNumber,
        });
        // try to send email
        try {
        } catch (err) {
          console.error("Email failed, will retry later:", err);
        }

        break;
      }

      case "checkout.failed": {
        await db
          .update(payments)
          .set({ status: "failed" })
          .where(eq(payments.id, paymentId));
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ message: "Webhook handled successfully" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
