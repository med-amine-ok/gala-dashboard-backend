import nodemailer from "nodemailer";

// SMTP credentials come from the environment only (never commit them).
const port = Number(process.env.MAIL_PORT) || 587;
const host = process.env.MAIL_HOST;

if (!host || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn("MAIL_HOST / MAIL_USER / MAIL_PASS are not set: emails will fail.");
}

export const mailService = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
