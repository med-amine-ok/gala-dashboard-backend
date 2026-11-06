import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { payments, ticketsTicket } from "@/db/schema";
import { appUrl, findParticipantByRef, webhookUrl } from "@/lib/participants/lookup";

const AMOUNT_DZD = Number(process.env.TICKET_PRICE_DZD) || 100;

/**
 * Start a Chargily checkout for a participant.
 * `id` is the participant's public token (links sent since the security fix)
 * or, for links emailed before it, the numeric id. Starting a checkout reveals
 * nothing about the participant, so both are accepted here.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chargilyBaseUrl =
    process.env.CHARGILY_API_URL ||
    (process.env.CHARGILY_API_KEY?.startsWith("test_")
      ? "https://pay.chargily.net/test/api/v2"
      : "https://pay.chargily.net/api/v2");

  try {
    const now = new Date().toISOString();
    const participant = await findParticipantByRef(id);

    if (!participant) {
      return NextResponse.json({ message: "Participant not found" }, { status: 404 });
    }
    if (participant.status !== "APPROVED") {
      return NextResponse.json(
        { message: "Your registration has not been approved, so payment is not open for you." },
        { status: 403 }
      );
    }
    if (participant.paymentStatus === "paid") {
      return NextResponse.json({ message: "Payment already completed" }, { status: 400 });
    }

    const ticket = await db.query.ticketsTicket.findFirst({
      where: eq(ticketsTicket.participantId, participant.id),
    });
    if (ticket) {
      return NextResponse.json({ message: "Ticket already issued for this participant" }, { status: 400 });
    }

    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.participantId, participant.id),
    });
    if (existingPayment?.status === "succeeded") {
      return NextResponse.json({ message: "Payment already completed" }, { status: 400 });
    }

    let paymentRecord = existingPayment;
    if (!paymentRecord) {
      const [newPayment] = await db
        .insert(payments)
        .values({
          id: crypto.randomUUID(),
          participantId: participant.id,
          amount: AMOUNT_DZD,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      paymentRecord = newPayment;
    }

    // Never build these from request headers: they come from configuration only
    const origin = appUrl(request);
    const webhookEndpoint = webhookUrl(request);

    const response = await fetch(`${chargilyBaseUrl}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHARGILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: AMOUNT_DZD,
        currency: "dzd",
        success_url: `${origin}/payment/success?token=${participant.publicToken}`,
        failure_url: `${origin}/payment/${participant.publicToken}?failed=true`,
        webhook_endpoint: webhookEndpoint,
        metadata: {
          participantId: String(participant.id),
          paymentId: paymentRecord.id,
        },
      }),
    });

    if (!response.ok) {
      console.error("Chargily checkout creation failed:", response.status, await response.text());
      return NextResponse.json({ message: "Payment provider error. Please try again." }, { status: 502 });
    }

    const data = await response.json();

    // Remember the checkout so verification can fetch exactly this one
    if (data.id) {
      await db
        .update(payments)
        .set({ chargilyCheckoutId: data.id, status: "pending", updatedAt: now })
        .where(eq(payments.id, paymentRecord.id));
    }

    return NextResponse.json({ checkout_url: data.checkout_url });
  } catch (error) {
    console.error("Payment creation failed:", error);
    return NextResponse.json({ message: "Payment creation failed" }, { status: 500 });
  }
}
