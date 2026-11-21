import { EVENT, renderEmail } from "./layout";

const greet = (firstName?: string | null) => (firstName?.trim() ? `Dear ${firstName.trim()},` : "Hello,");

/** "Your registration is approved, pay to confirm your seat." */
export function paymentLinkEmail(firstName: string | null | undefined, paymentUrl: string) {
  return {
    subject: `Your seat at the ${EVENT.name} is waiting`,
    ...renderEmail({
      preheader: `Approved! Pay ${EVENT.price} within 48 hours, online or at the VIC office, to confirm your seat.`,
      eyebrow: "Registration approved",
      title: "Your seat is waiting",
      greeting: greet(firstName),
      paragraphs: [
        `Good news: Ctulations!!! You have been selected to attendn for the ${EVENT.name}.`,
        `To confirm your seat, please pay the entrance fee of ${EVENT.price} within 48 hours, in one of two ways:`,
        "• Online: with the secure button below (Edahabia or CIB card).",
        `• In person: at the VIC office (${EVENT.organiser}).`,
        "As soon as your payment is received, your official ticket will be emailed to you.",
      ],
      cta: { label: `Pay ${EVENT.price} online`, url: paymentUrl },
      details: [
        { label: "Date", value: EVENT.dateLong },
        { label: "Venue", value: "To be announced, stay tuned" },
        { label: "Entrance", value: EVENT.price },
        { label: "Pay within", value: "48 hours" },
      ],
      footnote: "This link is personal: please don't share it. Online payments are processed securely by Chargily Pay.",
    }),
  };
}

// The ticket email itself (the email is the pass): see ./ticket.ts
