import { EVENT, renderEmail } from "./layout";

const greet = (firstName?: string | null) => (firstName?.trim() ? `Dear ${firstName.trim()},` : "Hello,");

/** "Your registration is approved, pay to confirm your seat." */
export function paymentLinkEmail(firstName: string | null | undefined, paymentUrl: string) {
  return {
    subject: `Your seat at the ${EVENT.name} is waiting`,
    ...renderEmail({
      preheader: `Your registration is approved. Confirm your seat with a ${EVENT.price} payment.`,
      eyebrow: "Registration approved",
      title: "Your seat is waiting",
      greeting: greet(firstName),
      paragraphs: [
        `Good news: our committee has approved your registration for the ${EVENT.name}.`,
        `To confirm your seat, complete your payment of ${EVENT.price} using the secure link below. As soon as it is received, your official ticket will be emailed to you.`,
      ],
      cta: { label: `Pay ${EVENT.price} & confirm my seat`, url: paymentUrl },
      details: [
        { label: "Date", value: EVENT.date },
        { label: "Venue", value: EVENT.venue },
        { label: "Entrance", value: EVENT.price },
      ],
      footnote: "This link is personal: please don't share it. Payments are processed securely by Chargily Pay (Edahabia / CIB).",
    }),
  };
}

/** "Payment received, here is your ticket." (the PDF ticket is attached) */
export function ticketEmail(firstName: string | null | undefined, serialNumber: string) {
  return {
    subject: `Your ticket for the ${EVENT.name}`,
    ...renderEmail({
      preheader: `Payment received. Your ticket ${serialNumber} is attached.`,
      eyebrow: "Payment confirmed",
      title: "Your ticket is ready",
      greeting: greet(firstName),
      paragraphs: [
        "Thank you, your payment has been received and your seat is officially confirmed.",
        "Your personal ticket is attached to this email as a PDF. Show its QR code at the entrance, printed or on your phone.",
      ],
      highlight: { label: "Ticket number", value: serialNumber, monospace: true },
      details: [
        { label: "Date", value: EVENT.date },
        { label: "Venue", value: EVENT.venue },
      ],
      footnote: "Each ticket admits one person and can be scanned only once. Keep it to yourself until the event.",
    }),
  };
}
