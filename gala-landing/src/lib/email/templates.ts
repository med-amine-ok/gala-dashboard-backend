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
        { label: "Date", value: EVENT.dateLong },
        { label: "Venue", value: EVENT.venue, url: EVENT.mapUrl },
        { label: "Entrance", value: EVENT.price },
      ],
      footnote: "This link is personal: please don't share it. Payments are processed securely by Chargily Pay (Edahabia / CIB).",
    }),
  };
}

// The ticket email itself (the email is the pass): see ./ticket.ts
