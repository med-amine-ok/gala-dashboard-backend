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
        `Congratulations! You have been selected to attend the ${EVENT.name}.`,
        `To confirm your seat, please pay the entrance fee of ${EVENT.price} within 48 hours, in one of two ways:`,
        "• Online: with the secure button below (Edahabia or CIB card).",
        `• In person: at the VIC office (${EVENT.organiser}).`,
        "As soon as your payment is received, your official ticket will be emailed to you.",
      ],
      cta: { label: `Pay ${EVENT.price} online`, url: paymentUrl },
      details: [
        { label: "Date", value: EVENT.dateLong },
        { label: "Venue", value: EVENT.venue, url: EVENT.mapUrl },
        { label: "Entrance", value: EVENT.price },
        { label: "Pay within", value: "48 hours" },
      ],
      footnote: "This link is personal: please don't share it. Online payments are processed securely by Chargily Pay.",
    }),
  };
}

/** Waiting list: sent to registrations that are pending or not retained. */
export function waitlistEmail(firstName: string | null | undefined) {
  return {
    subject: `Your registration for the Engineers' GALA: waiting list`,
    ...renderEmail({
      preheader: "Thank you for registering. You have been placed on our waiting list.",
      eyebrow: "Registration update",
      title: "You're on our waiting list",
      greeting: greet(firstName),
      paragraphs: [
        "First and foremost, we would like to sincerely thank you for your interest in the 9th edition of the Engineers' GALA and for taking the time to register.",
        "We truly appreciate your enthusiasm and the interest you've shown in being part of this special occasion.",
        "Unfortunately, due to the limited number of available places, we are unable to confirm your participation at this stage. However, we are pleased to inform you that you have been placed on our waiting list.",
        "Should any places become available, we will make sure to contact you accordingly.",
        "Thank you for your understanding, and we wish you all the best.",
        "Best regards,",
        "VICly",
      ],
    }),
  };
}

// The ticket email itself (the email is the pass): see ./ticket.ts
