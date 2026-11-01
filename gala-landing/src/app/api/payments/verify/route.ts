import { db } from "@/db/client";
import { fulfillPayment } from "@/lib/payments/fulfill";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { payments, ticketsTicket } from "@/db/schema";
import { findParticipantByRef, isLegacyNumericId } from "@/lib/participants/lookup";

import QRCode from "qrcode";

const chargilyBaseUrl = () =>
  process.env.CHARGILY_API_URL ||
  (process.env.CHARGILY_API_KEY?.startsWith("test_")
    ? "https://pay.chargily.net/test/api/v2"
    : "https://pay.chargily.net/api/v2");

async function chargily(path: string) {
  const res = await fetch(`${chargilyBaseUrl()}${path}`, {
    headers: { Authorization: `Bearer ${process.env.CHARGILY_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Chargily ${path} -> ${res.status}`);
  return res.json();
}

/** Find a paid checkout for this participant: the stored one first, then the
 *  recent list (covers checkouts created before the id was stored). */
async function findPaidCheckout(participantId: number, storedCheckoutId?: string | null) {
  if (storedCheckoutId) {
    const checkout = await chargily(`/checkouts/${storedCheckoutId}`);
    if (checkout?.status === "paid") return checkout;
  }
  const list = await chargily(`/checkouts?per_page=50`);
  return (list.data || []).find(
    (c: any) => c.status === "paid" && String(c.metadata?.participantId) === String(participantId)
  );
}

async function ticketPayload(participant: any, serialNumber: string, token: string) {
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      lastName: participant.lastName || "",
      firstName: participant.firstName || "",
      serialNumber,
      email: participant.email || "",
    }),
    { width: 350, margin: 1, color: { dark: "#1A1A1A", light: "#FFFFFF" } }
  );
  return {
    qrDataUrl,
    downloadUrl: `/api/tickets/download?token=${encodeURIComponent(token)}`,
    participant: {
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      university: participant.university,
      fieldOfStudy: participant.fieldOfStudy,
    },
  };
}

/**
 * Called by the payment success page.
 * - `?token=<public token>` (new links): full ticket view (QR, download, name).
 * - `?participant_id=<id>` (checkouts started before the fix): the payment is
 *   still confirmed, but no personal data or ticket is returned; the ticket
 *   arrives by email.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const legacyId = searchParams.get("participant_id");
    const ref = token || legacyId || "";
    const limited = !token;

    if (!ref || (token && isLegacyNumericId(token)) || (limited && !isLegacyNumericId(ref))) {
      return NextResponse.json({ success: false, message: "Lien de paiement invalide." }, { status: 400 });
    }

    const participant = await findParticipantByRef(ref);
    if (!participant) {
      return NextResponse.json({ success: false, message: "Participant introuvable." }, { status: 404 });
    }

    let ticket = await db.query.ticketsTicket.findFirst({
      where: eq(ticketsTicket.participantId, participant.id),
    });
    let emailSent = ticket?.emailSent ?? false;

    if (!(participant.paymentStatus === "paid" && ticket)) {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.participantId, participant.id),
      });
      const paidCheckout = await findPaidCheckout(participant.id, payment?.chargilyCheckoutId);
      if (!paidCheckout) {
        return NextResponse.json({
          success: false,
          message: "Paiement en cours de vérification auprès de Chargily. Veuillez patienter.",
        });
      }
      const result = await fulfillPayment({
        participantId: participant.id,
        paymentId: paidCheckout.metadata?.paymentId,
        chargilyCheckoutId: paidCheckout.id,
        amount: paidCheckout.amount,
      });
      if (result.needsReview || !result.ticketSerial) {
        return NextResponse.json({
          success: false,
          message: "Paiement reçu. Notre équipe vous contactera par e-mail au sujet de votre inscription.",
        });
      }
      emailSent = result.emailSent;
      ticket = await db.query.ticketsTicket.findFirst({
        where: eq(ticketsTicket.participantId, participant.id),
      });
    }

    if (limited || !ticket) {
      return NextResponse.json({
        success: true,
        emailSent,
        message: "Paiement confirmé. Votre billet vous a été envoyé par e-mail.",
      });
    }

    return NextResponse.json({
      success: true,
      ticketSerial: ticket.serialNumber,
      ticketStatus: ticket.status,
      emailSent,
      ...(await ticketPayload(participant, ticket.serialNumber, participant.publicToken)),
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { success: false, message: "Impossible de vérifier le paiement pour le moment. Réessayez dans un instant." },
      { status: 500 }
    );
  }
}
