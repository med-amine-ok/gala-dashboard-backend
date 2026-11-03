import { fulfillPayment } from "@/lib/payments/fulfill";
import { verifySignature } from "@chargily/chargily-pay";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  participantsParticipant,
  payments,
} from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const chargilySecretKey = process.env.CHARGILY_API_KEY!;
    let valid = false;
    try {
      valid = verifySignature(Buffer.from(rawBody, "utf-8"), signature, chargilySecretKey);
    } catch {
      // Malformed signature (wrong length / not hex): treat as invalid
      valid = false;
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { participantId, paymentId } = event.data?.metadata || {};
    const pId = Number(participantId);

    switch (event.type) {
      case "checkout.paid": {
        const result = await fulfillPayment({
          participantId: pId,
          paymentId,
          chargilyCheckoutId: event.data?.id,
          amount: event.data?.amount,
        });

        return NextResponse.json({
          message: "Payment fulfilled successfully",
          ticketIssued: Boolean(result.ticketSerial),
          needsReview: result.needsReview,
        });
      }

      case "checkout.failed":
      case "checkout.expired":
      case "checkout.canceled": {
        const now = new Date().toISOString();

        // A failed or abandoned checkout must never undo a payment that
        // already succeeded (e.g. through a second checkout).
        await db.transaction(async (tx) => {
          if (paymentId) {
            await tx
              .update(payments)
              .set({ status: "failed", updatedAt: now })
              .where(and(eq(payments.id, paymentId), ne(payments.status, "succeeded")));
          }

          if (pId) {
            await tx
              .update(participantsParticipant)
              .set({
                paymentStatus: "failed",
                updatedAt: now,
              })
              .where(and(eq(participantsParticipant.id, pId), ne(participantsParticipant.paymentStatus, "paid")));
          }
        });
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ message: "Webhook handled successfully" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
