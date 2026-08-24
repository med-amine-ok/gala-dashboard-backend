import inngest from "@/lib/inngest/inngest-client";
import { sendEmail } from "../tickets/send-email";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    throw new Error("Something went wrong");
    return { message: `Hello ${event.data.email}!` };
  }
);

export const inngestSendEmail = inngest.createFunction(
  { id: "inngest-send-email" },
  { event: "test/email.sent" },
  async ({ event, step }) => {
    try {
      await step.run("send email", async () => {
        await sendEmail({
          to: event.data.to,
          subject: event.data.subject,
          text: event.data.text,
          html: event.data.html,
          attachments: event.data.attachments,
        });
      });
    } catch (err) {
      console.error("Email failed:", err);
      // Optionally log to your DB or send alert
      throw err; // so Inngest retries if configured
    }
  }
);

// export const inngestSendBulkEmail = inngest.createFunction(
//   {
//     id: "inngest-send-bulk-email",
//     concurrency: {
//       limit: 1, // each queue processes one job at a time
//       key: "event.data.queueKey", // separate queue per recipient or custom key
//     },
//   },
//   { event: "email/send" },
//   async ({ event }) => {
//     const emailData = {
//       to: event.data.to,
//       subject: event.data.subject,
//       text: event.data.text,
//       html: event.data.html,
//       from:
//         event.data.from ||
//         `"Abdallah Mohellebi" <registration@vic-polymaze.com>`,
//     };

//     // POST to your Next.js endpoint
//     await fetch("http://localhost:3000/api/send-email", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(emailData),
//     });

//     return { status: "queued", queueKey: event.data.queueKey };
//   }
// );
