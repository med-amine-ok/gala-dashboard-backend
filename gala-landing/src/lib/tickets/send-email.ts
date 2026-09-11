import { mailService } from "@/lib/mail"; // adjust import path
import type { Attachment } from "nodemailer/lib/mailer";

export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
}

export async function sendEmail({
  from = process.env.MAIL_FROM || `"Engineers Gala Team" <vic@g.enp.edu.dz>`,
  to,
  subject = "No subject",
  text = "",
  html,
  attachments,
}: SendEmailOptions) {
  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
    attachments,
    headers: {
      "List-Unsubscribe":
        "<mailto:unsubscribe@yourdomain.com>, <https://yourdomain.com/unsubscribe?email={{email}}>",
    },
  };

  await mailService.sendMail(mailOptions);
}
