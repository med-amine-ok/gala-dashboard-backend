/**
 * Branded HTML email layout for the Engineers' Gala.
 *
 * Built for email clients (Gmail, Outlook, Apple Mail, mobile apps):
 * - 600px table layout, inline styles only, no external CSS;
 * - "bulletproof" button (coloured table cell, works with images off);
 * - web fonts with safe fallbacks (Cinzel -> Georgia, Plus Jakarta Sans -> Arial);
 * - hidden preheader, light colour scheme (no muddy dark-mode inversion);
 * - every dynamic value is HTML-escaped.
 *
 * The same design exists in the Django backend (gala_event/notifications/email_layout.py):
 * keep both in sync when changing colours or structure.
 */

export const BRAND = {
  plum: "#2E061E",
  maroon: "#5D0D3D",
  magenta: "#8E1B60",
  silver: "#C0C0C0",
  silverLight: "#E5E5E5",
  cream: "#F2E8D8",
  creamSoft: "#FAF7F2",
  creamMuted: "#EADDC8",
  text: "#4B1A38",
  textMuted: "#75325A",
};

export const EVENT = {
  name: "Engineers' Gala 2026",
  date: "8 November 2026",
  venue: "Hotel Mercure, Bab Ezzouar · Algiers",
  price: "1,000 DA",
  organiser: "Vision & Innovation Club · École Nationale Polytechnique",
};

const SERIF = "Cinzel, 'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Plus Jakarta Sans', 'Segoe UI', Helvetica, Arial, sans-serif";

export function siteUrl() {
  return (process.env.EMAIL_ASSET_BASE_URL || process.env.PAYMENT_LINK_BASE_URL || "https://gala.vic-enp.com").replace(/\/$/, "");
}

export const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export type EmailContent = {
  /** Shown in the inbox list next to the subject (hidden in the email). */
  preheader: string;
  /** Small spaced capitals above the title, e.g. "REGISTRATION APPROVED". */
  eyebrow: string;
  title: string;
  /** Greeting line, e.g. "Dear Yasmine,". */
  greeting?: string;
  /** Paragraphs of plain text (escaped automatically). */
  paragraphs: string[];
  /** Big highlighted value, e.g. a ticket number or an activation code. */
  highlight?: { label: string; value: string; monospace?: boolean; large?: boolean };
  cta?: { label: string; url: string };
  /** Small label/value rows in a card (date, venue, ...). */
  details?: { label: string; value: string }[];
  /** Small print under the button. */
  footnote?: string;
};

function paragraph(text: string) {
  return `<p style="margin:0 0 16px 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${BRAND.text};">${esc(text)}</p>`;
}

function button({ label, url }: { label: string; url: string }) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 8px auto;">
  <tr>
    <td align="center" bgcolor="${BRAND.magenta}" style="border-radius:999px;background:${BRAND.magenta};background-image:linear-gradient(135deg,${BRAND.magenta},${BRAND.maroon});">
      <a href="${esc(url)}" target="_blank"
         style="display:inline-block;padding:15px 38px;font-family:${SANS};font-size:15px;font-weight:700;letter-spacing:0.4px;color:#FFFFFF;text-decoration:none;border-radius:999px;">
        ${esc(label)}&nbsp;&rarr;
      </a>
    </td>
  </tr>
</table>
<p style="margin:10px 0 0 0;text-align:center;font-family:${SANS};font-size:11px;line-height:1.5;color:${BRAND.textMuted};">
  Button not working? Copy this link:<br>
  <a href="${esc(url)}" style="color:${BRAND.magenta};word-break:break-all;">${esc(url)}</a>
</p>`;
}

function highlight({ label, value, monospace, large }: NonNullable<EmailContent["highlight"]>) {
  const font = monospace ? "'SFMono-Regular', Consolas, 'Courier New', monospace" : SERIF;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;">
  <tr>
    <td align="center" bgcolor="${BRAND.plum}" style="background:${BRAND.plum};background-image:linear-gradient(135deg,${BRAND.plum},${BRAND.maroon});border-radius:14px;padding:22px 16px;">
      <div style="font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.silver};">${esc(label)}</div>
      <div class="${large ? "" : "gala-code"}" style="margin-top:8px;font-family:${font};font-size:${large ? "38px" : "24px"};line-height:1.3;letter-spacing:${large ? "10px" : monospace ? "3px" : "1px"};font-weight:700;color:#FFFFFF;word-break:break-all;">${esc(value)}</div>
    </td>
  </tr>
</table>`;
}

function details(rows: NonNullable<EmailContent["details"]>) {
  const cells = rows
    .map(
      (r, i) => `
  <tr>
    <td style="padding:12px 18px;${i ? `border-top:1px solid ${BRAND.creamMuted};` : ""}font-family:${SANS};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textMuted};width:34%;">${esc(r.label)}</td>
    <td style="padding:12px 18px;${i ? `border-top:1px solid ${BRAND.creamMuted};` : ""}font-family:${SANS};font-size:14px;font-weight:600;color:${BRAND.plum};">${esc(r.value)}</td>
  </tr>`
    )
    .join("");
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="margin:24px 0 4px 0;background:${BRAND.creamSoft};border:1px solid ${BRAND.creamMuted};border-radius:12px;border-collapse:separate;">
  ${cells}
</table>`;
}

export function renderEmailHtml(c: EmailContent) {
  const logo = `${siteUrl()}/GALA-silver.png`;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(c.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; }
  a { color:${BRAND.magenta}; }
  @media (max-width:620px) {
    .gala-card { width:100% !important; border-radius:0 !important; }
    .gala-pad { padding-left:24px !important; padding-right:24px !important; }
    .gala-title { font-size:24px !important; }
    .gala-code { font-size:17px !important; letter-spacing:1px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(c.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.cream}" style="background:${BRAND.cream};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="gala-card" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:600px;max-width:600px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid ${BRAND.creamMuted};">
        <!-- Header -->
        <tr>
          <td align="center" bgcolor="${BRAND.plum}"
              style="background:${BRAND.plum};background-image:radial-gradient(circle at 50% 0%,${BRAND.magenta} 0%,${BRAND.maroon} 45%,${BRAND.plum} 100%);padding:38px 24px 30px 24px;">
            <img src="${logo}" width="220" alt="Engineers' Gala" style="display:block;width:220px;max-width:70%;height:auto;border:0;outline:none;">
            <div style="margin-top:14px;font-family:${SANS};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${BRAND.silver};">Algiers &middot; ${esc(EVENT.date)}</div>
          </td>
        </tr>
        <tr><td style="height:3px;line-height:3px;font-size:0;background:${BRAND.silver};background-image:linear-gradient(90deg,${BRAND.plum},${BRAND.silver},${BRAND.plum});">&nbsp;</td></tr>
        <!-- Body -->
        <tr>
          <td class="gala-pad" style="padding:40px 48px 36px 48px;">
            <div style="font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${BRAND.magenta};">${esc(c.eyebrow)}</div>
            <h1 class="gala-title" style="margin:10px 0 22px 0;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:700;color:${BRAND.plum};">${esc(c.title)}</h1>
            ${c.greeting ? paragraph(c.greeting) : ""}
            ${c.paragraphs.map(paragraph).join("")}
            ${c.highlight ? highlight(c.highlight) : ""}
            ${c.cta ? button(c.cta) : ""}
            ${c.details?.length ? details(c.details) : ""}
            ${c.footnote ? `<p style="margin:22px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${BRAND.textMuted};">${esc(c.footnote)}</p>` : ""}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td align="center" bgcolor="${BRAND.creamSoft}" style="background:${BRAND.creamSoft};border-top:1px solid ${BRAND.creamMuted};padding:26px 32px;">
            <div style="font-family:${SERIF};font-size:14px;letter-spacing:2px;color:${BRAND.plum};">ENGINEERS&rsquo; GALA</div>
            <div style="margin-top:6px;font-family:${SANS};font-size:11px;line-height:1.6;color:${BRAND.textMuted};">
              ${esc(EVENT.organiser)}<br>
              <a href="${siteUrl()}" style="color:${BRAND.magenta};text-decoration:none;">${esc(siteUrl().replace(/^https?:\/\//, ""))}</a>
            </div>
            <div style="margin-top:12px;font-family:${SANS};font-size:10px;line-height:1.5;color:#9C7A8C;">
              You receive this email because you registered for the ${esc(EVENT.name)}.
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Plain-text version (shown by clients that don't display HTML, and used by spam filters). */
export function renderEmailText(c: EmailContent) {
  const lines = [`${c.eyebrow.toUpperCase()}`, c.title, ""];
  if (c.greeting) lines.push(c.greeting, "");
  for (const p of c.paragraphs) lines.push(p, "");
  if (c.highlight) lines.push(`${c.highlight.label}: ${c.highlight.value}`, "");
  if (c.cta) lines.push(`${c.cta.label}: ${c.cta.url}`, "");
  for (const d of c.details || []) lines.push(`${d.label}: ${d.value}`);
  if (c.details?.length) lines.push("");
  if (c.footnote) lines.push(c.footnote, "");
  lines.push(`— ${EVENT.name}`, EVENT.organiser, siteUrl());
  return lines.join("\n");
}

export function renderEmail(c: EmailContent) {
  return { html: renderEmailHtml(c), text: renderEmailText(c) };
}
