import { NextResponse } from "next/server";

import { participantsParticipant } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import inngest from "@/lib/inngest/inngest-client";

export async function POST(req: Request) {
  try {
    const { emails } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Emails must be a non-empty array" },
        { status: 400 }
      );
    }

    const results = [];

    console.log("Notifying participants:", emails);

    for (const email of emails) {
      // Find participant by email
      const participant = await db.query.participantsParticipant.findFirst({
        where: eq(participantsParticipant.email, email),
      });

      console.log("Participant:", participant);

      if (!participant) {
        results.push({ email, status: "not found" });
        continue;
      }
      //  Send Inngest event (each participant → separate queue)
      await inngest.send({
        name: "test/email.sent",
        data: {
          to: [email],
          subject: "Secure Your Spot – Engineers Gala 2025 Payment Link",
          text: `Hello ${participant.firstName},

We’re thrilled to have you joining us for the Engineers Gala 2025!

To confirm your participation, please complete your payment at the link below:
https://gala.vic-enp.com/payment/${participant.id}

Once your payment is received, your place will be officially reserved.

See you soon at Engineers Gala!`,
        },
      });
    }
    return NextResponse.json({
      ok: true,
      status: "All participants queued",
      // results,
    });
  } catch (error: any) {
    console.error("Error notifying participants:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
