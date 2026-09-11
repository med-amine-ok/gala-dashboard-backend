import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { participantsParticipant, ticketsTicket } from "../../../../../drizzle/schema";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participant_id");
    const serialNumber = searchParams.get("serial_number");

    let ticket;
    let participant;

    if (serialNumber) {
      ticket = await db.query.ticketsTicket.findFirst({
        where: eq(ticketsTicket.serialNumber, serialNumber),
      });
      if (ticket?.participantId) {
        participant = await db.query.participantsParticipant.findFirst({
          where: eq(participantsParticipant.id, ticket.participantId),
        });
      }
    } else if (participantId) {
      const pId = Number(participantId);
      participant = await db.query.participantsParticipant.findFirst({
        where: eq(participantsParticipant.id, pId),
      });
      ticket = await db.query.ticketsTicket.findFirst({
        where: eq(ticketsTicket.participantId, pId),
      });
    }

    if (!ticket || !participant) {
      return NextResponse.json({ error: "Ticket or participant not found" }, { status: 404 });
    }

    // Load ticket template PDF
    let pdfPath = path.join(process.cwd(), "public", "tickets.pdf");
    if (!fs.existsSync(pdfPath)) {
      pdfPath = path.resolve(process.cwd(), "gala-landing", "public", "tickets.pdf");
    }
    if (!fs.existsSync(pdfPath)) {
      pdfPath = "public/tickets.pdf";
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPage(0);

    // Generate QR code data
    const qrData = JSON.stringify({
      lastName: participant.lastName || "",
      firstName: participant.firstName || "",
      serialNumber: ticket.serialNumber,
      email: participant.email || "",
    });

    const qrDataUrl = await QRCode.toDataURL(qrData);
    const qrImageBytes = Buffer.from(
      qrDataUrl.replace(/^data:image\/png;base64,/, ""),
      "base64"
    );
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    // Draw QR code onto template
    page.drawImage(qrImage, {
      x: 944.49,
      y: 113.49,
      width: 193.02,
      height: 193.02,
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${ticket.serialNumber}.pdf"`,
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (err: any) {
    console.error("Download ticket error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate ticket PDF" },
      { status: 500 }
    );
  }
}
