import nodemailer from "nodemailer";

const port = Number(process.env.MAIL_PORT) || 2525;
const host = process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io";

export const mailService = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user: process.env.MAIL_USER || process.env.MAILTRAP_USER || "c6a3766cb9d0ea",
    pass: process.env.MAIL_PASS || process.env.MAILTRAP_PASS || "a43a10d571528f",
  },
});
