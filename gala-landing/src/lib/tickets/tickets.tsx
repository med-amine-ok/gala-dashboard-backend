import fs from "fs";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import inngest from "@/lib/inngest/inngest-client";
import { sendEmail } from "./send-email";

type TicketData = {
  firstName: string;
  lastName: string;
  email: string;
  ticketId: number | string;
};

export async function generateAndSendTicket(p: TicketData) {
  try {
    if (!p) {
      throw new Error("Participant data is required");
    }

    // Load the ticket template
    const existingPdfBytes = fs.readFileSync("public/tickets.pdf");
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPage(0);

    // Generate QR data
    const qrData = JSON.stringify({
      lastName: p.lastName,
      firstName: p.firstName,
      serialNumber: p.ticketId,
      email: p.email,
    });

    const qrDataUrl = await QRCode.toDataURL(qrData);
    const qrImageBytes = Buffer.from(
      qrDataUrl.replace(/^data:image\/png;base64,/, ""),
      "base64"
    );
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    // Draw QR code on the template
    page.drawImage(qrImage, {
      x: 944.49,
      y: 113.49,
      width: 193.02,
      height: 193.02,
    });

    // Save the personalized ticket
    const pdfBytes = await pdfDoc.save();

    // Send ticket via Inngest
    //     await inngest.send({
    //       name: "test/email.sent",
    //       data: {
    //         to: [p.email],
    //         subject: "Your Engineers Gala 2025 Ticket",
    //         text: `Hello ${p.firstName},

    // Your ticket is attached. Please present it at the event.

    // See you soon!`,
    //         attachments: [
    //           {
    //             filename: "ticket.pdf",
    //             content: Buffer.from(pdfBytes).toString("base64"),
    //             encoding: "base64",
    //           },
    //         ],
    //       },
    //     });

    await sendEmail({
      to: p.email,
      subject: "Your Ticket – Engineers Gala 2025",
      text: `Hello ${p.firstName},

    Your ticket is attached. Please present it at the event.

    See you soon!`,

      attachments: [
        {
          filename: `ticket-${p.ticketId}.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
          encoding: "base64",
        },
      ],
    });

    console.log(`✅ Ticket sent to ${p.email}`);
    return { ok: true, email: p.email, status: "Ticket sent successfully" };
  } catch (error) {
    console.error(`❌ Failed to send ticket to ${p?.email}:`, error);
    return { ok: false, email: p?.email, error: String(error) };
  }
}
