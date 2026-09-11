import { db } from "@/db/client";
import { fulfillPayment } from "@/lib/payments/fulfill";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { participantsParticipant, ticketsTicket } from "@/db/schema";

import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participant_id");

    if (!participantId) {
      return NextResponse.json({ error: "Missing participant_id" }, { status: 400 });
    }

    const pId = Number(participantId);

    // 1. Check if participant is already paid
    const participant = await db.query.participantsParticipant.findFirst({
      where: eq(participantsParticipant.id, pId),
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const ticket = await db.query.ticketsTicket.findFirst({
      where: eq(ticketsTicket.participantId, pId),
    });

    if (participant.paymentStatus === "paid" && ticket) {
      const qrData = JSON.stringify({
        lastName: participant.lastName || "",
        firstName: participant.firstName || "",
        serialNumber: ticket.serialNumber,
        email: participant.email || "",
      });
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 350,
        margin: 1,
        color: {
          dark: "#1A1A1A",
          light: "#FFFFFF",
        },
      });

      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        ticketSerial: ticket.serialNumber,
        ticketStatus: ticket.status,
        emailSent: ticket.emailSent,
        qrDataUrl,
        downloadUrl: `/api/tickets/download?serial_number=${ticket.serialNumber}`,
        participant: {
          id: participant.id,
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email,
          phone: participant.phone,
          university: participant.university,
          fieldOfStudy: participant.fieldOfStudy,
        },
      });
    }

    // 2. Query Chargily API for this participant's checkouts
    const chargilyBaseUrl =
      process.env.CHARGILY_API_URL || "https://pay.chargily.net/test/api/v2";

    const chargilyRes = await fetch(`${chargilyBaseUrl}/checkouts?per_page=10`, {
      headers: {
        Authorization: `Bearer ${process.env.CHARGILY_API_KEY}`,
      },
    });

    if (!chargilyRes.ok) {
      return NextResponse.json(
        { error: "Failed to check payment status with Chargily" },
        { status: 502 }
      );
    }

    const chargilyData = await chargilyRes.json();
    const checkouts = chargilyData.data || [];

    // Find paid checkout matching this participant
    const paidCheckout = checkouts.find(
      (c: any) =>
        c.status === "paid" &&
        String(c.metadata?.participantId) === String(pId)
    );

    if (!paidCheckout) {
      return NextResponse.json({
        success: false,
        paymentStatus: participant.paymentStatus,
        message: "Payment is still pending on Chargily",
      });
    }

    // 3. Fulfill the payment immediately!
    const result = await fulfillPayment({
      participantId: pId,
      paymentId: paidCheckout.metadata?.paymentId,
      chargilyCheckoutId: paidCheckout.id,
      amount: paidCheckout.amount,
    });

    const qrData = JSON.stringify({
      lastName: participant.lastName || "",
      firstName: participant.firstName || "",
      serialNumber: result.ticketSerial,
      email: participant.email || "",
    });
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 350,
      margin: 1,
      color: {
        dark: "#1A1A1A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      ...result,
      qrDataUrl,
      downloadUrl: `/api/tickets/download?serial_number=${result.ticketSerial}`,
      participant: {
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        phone: participant.phone,
        university: participant.university,
        fieldOfStudy: participant.fieldOfStudy,
      },
    });
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
