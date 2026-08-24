import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { payments, ticketsTicket } from "../../../../../drizzle/schema";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const url = "https://pay.chargily.net/api/v2/checkouts";

  try {
    const now = new Date().toISOString();

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
        success_url: "https://gala.vic-enp.com/",
        failure_url: "https://gala.vic-enp.com/",
        webhook_endpoint: "https://gala.vic-enp.com/api/webhook",
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

    // Trigger Inngest event for notification or further automation

    console.log("Chargily checkout created:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Payment creation failed:", error);
    return NextResponse.json(
      { error: "Payment creation failed" },
      { status: 500 }
    );
  }
}
