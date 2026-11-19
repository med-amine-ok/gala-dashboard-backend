/**
 * The evening's public calendar, in one place.
 * Registration opens at REGISTRATION_OPENS and closes at REGISTRATION_CLOSES
 * (Algiers time, UTC+1). The backend enforces the same closing time
 * (REGISTRATION_CLOSES_AT in gala_event settings): keep both in sync.
 */
export const REGISTRATION_OPENS = new Date("2026-11-11T00:00:00+01:00");

/** Midnight at the end of Thursday 19 November 2026, Algiers time. */
export const REGISTRATION_CLOSES = new Date("2026-11-20T00:00:00+01:00");

export type RegistrationPhase = "upcoming" | "open" | "closed";

export const registrationPhase = (now = Date.now()): RegistrationPhase =>
  now < REGISTRATION_OPENS.getTime() ? "upcoming" : now < REGISTRATION_CLOSES.getTime() ? "open" : "closed";

export const registrationIsOpen = (now = Date.now()) => registrationPhase(now) === "open";
