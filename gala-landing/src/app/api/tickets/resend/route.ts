import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { participantsParticipant, ticketsTicket } from "@/db/schema";
import { emailTicket } from "@/lib/tickets/email-ticket";
import { corsPreflight, corsReply, requireHrAdmin } from "@/lib/security/hr-auth";

/** HR dashboard "Resend ticket email". POST { ticketId }  Authorization: Bearer <HR token> */

export async function OPTIONS(req: NextRequest) {
  return corsPreflight(req);
}

export async function POST(req: NextRequest) {
  const check = await requireHrAdmin(req);
  if ("error" in check) return corsReply(req, { error: check.error }, check.status);

  let ticketId: number;
  try {
    ticketId = Number((await req.json()).ticketId);
  } catch {
    return corsReply(req, { error: "Invalid JSON body." }, 400);
  }
  const ticket = await db.query.ticketsTicket.findFirst({ where: eq(ticketsTicket.id, ticketId) });
  if (!ticket) return corsReply(req, { error: "Ticket not found." }, 404);
  if (!ticket.participantId) return corsReply(req, { error: "This ticket is not assigned to anyone." }, 400);
  if (ticket.status === "cancelled") return corsReply(req, { error: "This ticket is cancelled." }, 400);
  const participant = await db.query.participantsParticipant.findFirst({
    where: eq(participantsParticipant.id, ticket.participantId),
  });
  if (!participant) return corsReply(req, { error: "Ticket holder not found." }, 404);

  const sent = await emailTicket(participant, ticket);
  if (!sent) {
    return corsReply(req, { error: "The email could not be sent. Check the landing site's MAIL_* settings.", email_sent: false }, 502);
  }
  return corsReply(req, { message: `Ticket ${ticket.serialNumber} emailed to ${participant.email}.`, email_sent: true });
}
