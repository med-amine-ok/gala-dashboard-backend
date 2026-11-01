import { serve } from "inngest/next";
import { inngestSendEmail } from "@/lib/inngest/functions";
import inngest from "@/lib/inngest/inngest-client";

// Inngest calls this endpoint; in production it only accepts requests signed
// with INNGEST_SIGNING_KEY (set it in Vercel).
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [inngestSendEmail],
});
