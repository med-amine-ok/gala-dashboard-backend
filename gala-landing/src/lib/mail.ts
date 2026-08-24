import nodemailer from "nodemailer";

export const mailService = nodemailer.createTransport({
  // host: "sandbox.smtp.mailtrap.io",
  // host: "mail.vic-polymaze.com",

  host: "live.smtp.mailtrap.io", // bulk.smtp.mailtrap.io
  port: 587,

  // host: "bulk.smtp.mailtrap.io",
  // port: 587,

  // port: 2525,

  // port: 465,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});
