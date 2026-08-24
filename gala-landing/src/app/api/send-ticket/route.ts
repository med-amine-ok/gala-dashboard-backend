import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import inngest from "@/lib/inngest/inngest-client";

type TicketData = {
  firstName: string;
  lastName: string;
  email: string;
  serialNumber: string | number;
};

export async function POST(req: Request) {
  try {
    const { tickets }: { tickets: TicketData[] } = await req.json();

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { ok: false, error: "tickets must be a non-empty array" },
        { status: 400 }
      );
    }

    // Load your existing PDF ticket template once
    const existingPdfBytes = fs.readFileSync("public/tickets.pdf");

    for (const ticket of tickets) {
      const { firstName, lastName, email, serialNumber } = ticket;

      if (!email || !firstName || !lastName || !serialNumber) {
        console.warn(`Invalid ticket data for ${email}`);
        continue;
      }

      // Load PDF for this participant
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPage(0);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // 1️⃣ Add participant name to PDF
      page.drawText(`${firstName} ${lastName}`, {
        x: 50,
        y: 500,
        size: 18,
        color: rgb(0, 0, 0),
        font,
      });

      // 2️⃣ Generate QR code
      const qrData = JSON.stringify({
        firstName,
        lastName,
        serialNumber,
        email,
      });

      const qrDataUrl = await QRCode.toDataURL(qrData);
      const qrImageBytes = Buffer.from(
        qrDataUrl.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      // 3️⃣ Draw QR code on PDF
      page.drawImage(qrImage, {
        x: 400, // adjust as needed
        y: 100,
        width: 150,
        height: 150,
      });

      // 4️⃣ Save PDF
      const pdfBytes = await pdfDoc.save();

      // 5️⃣ Send email via Inngest
      await inngest.send({
        name: "test/email.sent",
        data: {
          to: [email],
          subject: "Your Engineers Gala 2026 Ticket",
          text: `Hello ${firstName},

Your ticket is attached. Please present this ticket at the event.

See you soon!`,
          attachments: [
            {
              filename: `ticket-${serialNumber}.pdf`,
              content: Buffer.from(pdfBytes).toString("base64"),
              encoding: "base64",
            },
          ],
        },
      });
    }

    return NextResponse.json({ ok: true, status: "All tickets processed" });
  } catch (error: any) {
    console.error("Error generating or sending tickets:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
