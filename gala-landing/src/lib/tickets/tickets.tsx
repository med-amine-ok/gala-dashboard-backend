import { sendEmail } from "./send-email";
import { TICKET_QR_CID, ticketEmail, ticketQrPng } from "@/lib/email/ticket";

type TicketData = {
  firstName: string;
  lastName: string;
  email: string;
  ticketId: number | string;
};

/**
 * Email the guest their ticket. The email itself is the admission pass (no
 * PDF attached): the QR code is embedded in it (cid:), so it shows in the
 * ticket even offline. The printable PDF stays available from
 * /api/tickets/download for whoever wants one.
 */
export async function generateAndSendTicket(p: TicketData) {
  try {
    if (!p) {
      throw new Error("Participant data is required");
    }
    const serial = String(p.ticketId);
    const guest = { firstName: p.firstName, lastName: p.lastName, email: p.email };
    const mail = ticketEmail(guest, serial);
    await sendEmail({
      to: p.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: [
        {
          filename: `pass-${serial}.png`,
          content: await ticketQrPng(guest, serial),
          contentType: "image/png",
          cid: TICKET_QR_CID,
          contentDisposition: "inline",
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
