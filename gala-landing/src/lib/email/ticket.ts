import QRCode from "qrcode";
import { EVENT, esc, siteUrl } from "./layout";
import { TICKET_TEMPLATE } from "./ticket-template";

/** Content-ID of the QR code image embedded in the ticket email */
export const TICKET_QR_CID = "gala-ticket-qr";

type Guest = { firstName: string; lastName: string; email: string };

/** Same JSON as the printed ticket, so the check-in scanner reads both */
export function ticketQrPayload(g: Guest, serialNumber: string) {
  return JSON.stringify({ lastName: g.lastName, firstName: g.firstName, serialNumber, email: g.email });
}

/** The QR code as a PNG: plum on white, with a quiet zone (scanners need it) */
export function ticketQrPng(g: Guest, serialNumber: string) {
  return QRCode.toBuffer(ticketQrPayload(g, serialNumber), {
    type: "png",
    width: 600,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#2E061EFF", light: "#FFFFFFFF" },
  });
}

/** Google Calendar link for the evening (all-day, since no time is announced yet) */
export function calendarUrl() {
  const day = EVENT.isoDate.replace(/-/g, "");
  const next = new Date(`${EVENT.isoDate}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replace(/-/g, "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.name,
    dates: `${day}/${end}`,
    location: `${EVENT.venueName}, ${EVENT.venueCity}`,
    details: `Your admission pass is in your ticket email. Directions: ${EVENT.mapUrl}`,
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** Fill {{placeholders}}; every value is HTML-escaped */
export function fillTicketTemplate(values: Record<string, string>) {
  const body = TICKET_TEMPLATE.replace("<!--TICKET-TEMPLATE-START-->\n", "").replace("\n<!--TICKET-TEMPLATE-END-->", "");
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Ticket template: no value for {{${key}}}`);
    return esc(values[key]);
  });
}

/**
 * The ticket email: the email itself is the admission pass (guest, date,
 * venue with a map link, and the QR code embedded as cid:gala-ticket-qr).
 */
export function ticketEmail(g: Guest, serialNumber: string) {
  const first = g.firstName.trim();
  const guestName = `${g.firstName} ${g.lastName}`.trim() || g.email;
  const site = siteUrl();
  const appTip = "Tip: in the Engineers' Gala app, choose 'Create account' with this email address to keep your pass and the programme at hand.";
  const html = fillTicketTemplate({
    preheader: `Your seat is confirmed. Pass ${serialNumber} · ${EVENT.dateLong} · ${EVENT.venueName}`,
    pattern_url: `${site}/email/plum-pattern.jpg`,
    logo_url: `${site}/GALA-silver.png`,
    greeting: first ? `Dear ${first},` : "Hello,",
    event_name: EVENT.name,
    serial: serialNumber,
    guest_name: guestName,
    date: EVENT.dateLong,
    venue_name: EVENT.venueName,
    venue_city: EVENT.venueCity,
    map_url: EVENT.mapUrl,
    calendar_url: calendarUrl(),
    price: EVENT.price,
    qr_src: `cid:${TICKET_QR_CID}`,
    app_tip: appTip,
    organiser: EVENT.organiser,
    site_url: site,
    site_label: site.replace(/^https?:\/\//, ""),
  });
  const text = [
    "PAYMENT CONFIRMED",
    "Your admission pass",
    "",
    `${first ? `Dear ${first},` : "Hello,"} your seat is confirmed. This email is your ticket: show its QR code at the entrance.`,
    "",
    `Guest: ${guestName}`,
    `Pass number: ${serialNumber}`,
    `Date: ${EVENT.dateLong}`,
    `Venue: ${EVENT.venueName}, ${EVENT.venueCity} (${EVENT.mapUrl})`,
    `Admits: one guest`,
    `Entrance: ${EVENT.price} (paid)`,
    "",
    "Keep this email until the evening and don't share the QR code: it opens the door only once.",
    appTip,
    "",
    `— ${EVENT.name}`,
    EVENT.organiser,
    site,
  ].join("\n");
  return { subject: `Your admission pass · ${EVENT.name}`, html, text };
}
