import { serve } from "inngest/next";
import { helloWorld, inngestSendEmail } from "@/lib/inngest/functions";
import inngest from "@/lib/inngest/inngest-client";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, inngestSendEmail],
});
