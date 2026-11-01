import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { participantsParticipant, ticketsTicket } from "@/db/schema";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";

/**
 * Download the PDF ticket. Only with the participant's secret token
 * (`?token=`), never with the numeric id or the serial number, because the
 * PDF's QR code is the entry pass.
 */
export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    if (!token || /^\d+$/.test(token)) {
      return NextResponse.json({ error: "Ticket or participant not found" }, { status: 404 });
    }

    const participant = await db.query.participantsParticipant.findFirst({
      where: eq(participantsParticipant.publicToken, token),
    });
    const ticket = participant
      ? await db.query.ticketsTicket.findFirst({ where: eq(ticketsTicket.participantId, participant.id) })
      : undefined;

    if (!ticket || !participant || ticket.status === "cancelled") {
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

    const qrDataUrl = await QRCode.toDataURL(
      JSON.stringify({
        lastName: participant.lastName || "",
        firstName: participant.firstName || "",
        serialNumber: ticket.serialNumber,
        email: participant.email || "",
      })
    );
    const qrImage = await pdfDoc.embedPng(
      Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );

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
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Download ticket error:", err);
    return NextResponse.json({ error: "Failed to generate ticket PDF" }, { status: 500 });
  }
}
