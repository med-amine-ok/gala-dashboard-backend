import { NextResponse } from "next/server";

import { participantsParticipant } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import inngest from "@/lib/inngest/inngest-client";
import { isInternalRequest } from "@/lib/security/internal-auth";
import { appUrl } from "@/lib/participants/lookup";

/**
 * INTERNAL: email the payment link to approved, unpaid participants.
 * Requires `Authorization: Bearer <INTERNAL_API_TOKEN>`.
 * (HR can also do this from the Django API: POST /api/participants/view/send_payment_links/)
 */
export async function POST(req: Request) {
  if (!isInternalRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { emails } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0 || emails.length > 500) {
      return NextResponse.json(
        { ok: false, error: "emails must be a non-empty array (max 500)" },
        { status: 400 },
      );
    }

    const results: { email: string; status: string }[] = [];

    for (const raw of emails) {
      const email = String(raw).trim().toLowerCase();
      const participant = await db.query.participantsParticipant.findFirst({
        where: eq(participantsParticipant.email, email),
      });

      if (!participant) {
        results.push({ email, status: "not found" });
        continue;
      }
      if (participant.status !== "APPROVED" || participant.paymentStatus === "paid") {
        results.push({ email, status: "skipped (not approved or already paid)" });
        continue;
      }

      await inngest.send({
        name: "test/email.sent",
        data: {
          to: [email],
          subject: "Secure Your Spot – Engineers Gala 2026 Payment Link",
          text: `Hello ${participant.firstName || ""},

We’re thrilled to have you joining us for the Engineers Gala 2026!

To confirm your participation, please complete your payment at the link below:
${appUrl()}/payment/${participant.publicToken}

Once your payment is received, your place will be officially reserved.

See you soon at Engineers Gala!`,
        },
      });
      results.push({ email, status: "queued" });
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("Error notifying participants:", error);
    return NextResponse.json({ ok: false, error: "Failed to queue emails" }, { status: 500 });
  }
}
