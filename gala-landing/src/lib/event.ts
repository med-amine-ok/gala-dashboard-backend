/**
 * The evening's public calendar, in one place.
 * Registration is closed until REGISTRATION_OPENS (Algiers time); the date and
 * venue of the evening are to be announced.
 */
export const REGISTRATION_OPENS = new Date("2026-11-11T00:00:00+01:00");

export const registrationIsOpen = (now = Date.now()) => now >= REGISTRATION_OPENS.getTime();
