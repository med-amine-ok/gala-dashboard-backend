import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { accountsCustomuser, ticketsTicket } from "@/db/schema";
import { generateAndSendTicket } from "@/lib/tickets/tickets";

type ParticipantLike = { firstName: string | null; lastName: string | null; email: string | null; userId: number | null };
type TicketLike = { id: number; serialNumber: string };

/** Email the official PDF ticket and record it (`email_sent`). Returns true when SMTP accepted it. */
export async function emailTicket(participant: ParticipantLike, ticket: TicketLike) {
  let email = participant.email || "";
  if (!email && participant.userId) {
    const user = await db.query.accountsCustomuser.findFirst({ where: eq(accountsCustomuser.id, participant.userId) });
    email = user?.email || "";
  }
  if (!email) return false;
  const result = await generateAndSendTicket({
    firstName: participant.firstName || "",
    lastName: participant.lastName || "",
    email,
    ticketId: ticket.serialNumber,
  });
  if (!result?.ok) return false;
  const now = new Date().toISOString();
  await db.update(ticketsTicket).set({ emailSent: true, emailSentAt: now, updatedAt: now }).where(eq(ticketsTicket.id, ticket.id));
  return true;
}
