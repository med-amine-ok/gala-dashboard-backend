import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { participantsParticipant, ticketsTicket } from "@/db/schema";
import { generateAndSendTicket } from "@/lib/tickets/tickets";
import { isInternalRequest } from "@/lib/security/internal-auth";

/**
 * INTERNAL: (re)send the official PDF ticket for existing tickets.
 * Requires `Authorization: Bearer <INTERNAL_API_TOKEN>`.
 * Body: { "serialNumbers": ["GT2026…", …] }. Names, email and serial all come
 * from the database, never from the request, so no forged ticket can be sent.
 */
export async function POST(req: Request) {
  if (!isInternalRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { serialNumbers } = await req.json();

    if (!Array.isArray(serialNumbers) || serialNumbers.length === 0 || serialNumbers.length > 200) {
      return NextResponse.json(
        { ok: false, error: "serialNumbers must be a non-empty array (max 200)" },
        { status: 400 }
      );
    }

    const results: { serialNumber: string; status: string }[] = [];
    for (const raw of serialNumbers) {
      const serialNumber = String(raw).trim().toUpperCase();
      const ticket = await db.query.ticketsTicket.findFirst({
        where: eq(ticketsTicket.serialNumber, serialNumber),
      });
      if (!ticket?.participantId || ticket.status === "cancelled") {
        results.push({ serialNumber, status: "not found, unassigned or cancelled" });
        continue;
      }
      const participant = await db.query.participantsParticipant.findFirst({
        where: eq(participantsParticipant.id, ticket.participantId),
      });
      if (!participant?.email) {
        results.push({ serialNumber, status: "participant has no email" });
        continue;
      }
      const sent = await generateAndSendTicket({
        firstName: participant.firstName || "",
        lastName: participant.lastName || "",
        email: participant.email,
        ticketId: ticket.serialNumber,
      });
      if (sent?.ok) {
        const now = new Date().toISOString();
        await db
          .update(ticketsTicket)
          .set({ emailSent: true, emailSentAt: now, updatedAt: now })
          .where(eq(ticketsTicket.id, ticket.id));
      }
      results.push({ serialNumber, status: sent?.ok ? "sent" : "failed" });
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("Error re-sending tickets:", error);
    return NextResponse.json({ ok: false, error: "Failed to send tickets" }, { status: 500 });
  }
}
