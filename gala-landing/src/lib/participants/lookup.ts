import { db } from "@/db/client";
import { participantsParticipant } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Public links carry the participant's secret token. Old emails still carry
 *  the numeric id: those are accepted only where no personal data is returned. */
export function isLegacyNumericId(ref: string) {
  return /^\d+$/.test(ref);
}

export async function findParticipantByRef(ref: string) {
  if (!ref) return undefined;
  if (isLegacyNumericId(ref)) {
    return db.query.participantsParticipant.findFirst({
      where: eq(participantsParticipant.id, Number(ref)),
    });
  }
  return db.query.participantsParticipant.findFirst({
    where: eq(participantsParticipant.publicToken, ref),
  });
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://gala.vic-enp.com").replace(/\/$/, "");
}
