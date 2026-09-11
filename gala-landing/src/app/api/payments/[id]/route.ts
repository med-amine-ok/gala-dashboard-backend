import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  participantsParticipant,
  payments,
  ticketsTicket,
} from "@/db/schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params);
  const chargilyBaseUrl =
    process.env.CHARGILY_API_URL ||
    (process.env.CHARGILY_API_KEY?.startsWith("test_")
      ? "https://pay.chargily.net/test/api/v2"
      : "https://pay.chargily.net/api/v2");
  const url = `${chargilyBaseUrl}/checkouts`;

  try {
    const now = new Date().toISOString();

    // Check participant
    const participant = await db.query.participantsParticipant.findFirst({
      where: eq(participantsParticipant.id, +id),
    });

    if (!participant) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 }
      );
    }

    if (participant.paymentStatus === "paid") {
      return NextResponse.json(
        { message: "Payment already completed" },
        { status: 400 }
      );
    }

    const ticket = await db.query.ticketsTicket.findFirst({
      where: eq(ticketsTicket.participantId, +id),
    });

    if (ticket) {
      return NextResponse.json(
        { message: "Ticket already issued for this participant" },
        { status: 400 }
      );
    }

    // Check if user already paid
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.participantId, +id),
    });

    if (existingPayment && existingPayment.status === "succeeded") {
      return NextResponse.json(
        { message: "Payment already completed" },
        { status: 400 }
      );
    }

    // Create a new pending payment record
    let paymentRecord = existingPayment;

    if (!paymentRecord) {
      const [newPayment] = await db
        .insert(payments)
        .values({
          id: crypto.randomUUID(),
          participantId: +id,
          amount: 1000,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      paymentRecord = newPayment;
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "https://gala.vic-enp.com";
    const webhookEndpoint =
      process.env.WEBHOOK_URL || `${origin}/api/webhook`;

    // Create a checkout on Chargily
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHARGILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 1000,
        currency: "dzd",
        success_url: `${origin}/payment/success?participant_id=${id}`,
        failure_url: `${origin}/payment/${id}?failed=true`,
        webhook_endpoint: webhookEndpoint,
        metadata: {
          participantId: id,
          paymentId: paymentRecord.id,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Chargily API request failed", {
        cause: await response.text(),
      });
    }

    const data = await response.json();

    // Save checkout_id to payment record for easy lookup
    if (data.id && paymentRecord.id) {
      await db
        .update(payments)
        .set({
          updatedAt: now,
        })
        .where(eq(payments.id, paymentRecord.id));
    }

    console.log("Chargily checkout created:", data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Payment creation failed:", error);
    return NextResponse.json(
      {
        message: error?.message || "Payment creation failed",
        cause: error?.cause || null,
      },
      { status: 500 }
    );
  }
}
