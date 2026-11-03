import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { mailService } from "@/lib/mail";
import { isInternalRequest } from "@/lib/security/internal-auth";
import { appUrl, isDevOnlyUrl, isProductionDeployment, webhookUrl } from "@/lib/participants/lookup";

export const dynamic = "force-dynamic";

/**
 * INTERNAL: checks everything the payment -> ticket -> email chain needs.
 * GET with `Authorization: Bearer <INTERNAL_API_TOKEN>`. Never returns secrets.
 */
export async function GET(req: Request) {
  if (!isInternalRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problems: string[] = [];
  const set = (name: string) => Boolean(process.env[name]);

  const env = Object.fromEntries(
    [
      "DATABASE_URL", "CHARGILY_API_KEY", "CHARGILY_API_URL", "NEXT_PUBLIC_APP_URL", "WEBHOOK_URL",
      "MAIL_HOST", "MAIL_PORT", "MAIL_USER", "MAIL_PASS", "MAIL_FROM",
      "INNGEST_SIGNING_KEY", "INNGEST_EVENT_KEY", "INTERNAL_API_TOKEN",
    ].map((name) => [name, set(name)])
  );
  for (const name of ["DATABASE_URL", "CHARGILY_API_KEY", "MAIL_HOST", "MAIL_USER", "MAIL_PASS"]) {
    if (!env[name]) problems.push(`${name} is not set.`);
  }

  // URLs given to Chargily
  const urls = { appUrl: appUrl(), webhookUrl: webhookUrl() };
  for (const name of ["NEXT_PUBLIC_APP_URL", "WEBHOOK_URL"]) {
    const value = process.env[name];
    if (value && isProductionDeployment() && isDevOnlyUrl(value)) {
      problems.push(`${name} points to a development address (${value}); it is ignored, fix or remove it.`);
    }
  }

  // Chargily
  const chargilyKey = process.env.CHARGILY_API_KEY || "";
  const chargilyBase =
    process.env.CHARGILY_API_URL ||
    (chargilyKey.startsWith("test_") ? "https://pay.chargily.net/test/api/v2" : "https://pay.chargily.net/api/v2");
  const chargily: Record<string, unknown> = {
    mode: chargilyKey.startsWith("test_") ? "test" : chargilyKey ? "live" : "missing",
    baseUrl: chargilyBase,
  };
  if (chargilyKey.startsWith("test_") && !chargilyBase.includes("/test/")) {
    problems.push("CHARGILY_API_KEY is a test key but CHARGILY_API_URL is the live API.");
  }
  if (chargilyKey && !chargilyKey.startsWith("test_") && chargilyBase.includes("/test/")) {
    problems.push("CHARGILY_API_KEY is a live key but CHARGILY_API_URL is the test API.");
  }
  if (chargilyKey) {
    try {
      const res = await fetch(`${chargilyBase}/checkouts?per_page=1`, {
        headers: { Authorization: `Bearer ${chargilyKey}` },
        cache: "no-store",
      });
      chargily.reachable = res.ok;
      chargily.httpStatus = res.status;
      if (!res.ok) problems.push(`Chargily answered HTTP ${res.status} (wrong key or URL?).`);
    } catch (err) {
      chargily.reachable = false;
      problems.push(`Chargily unreachable: ${String(err)}`);
    }
  }

  // Database schema the payment code relies on (added by the Django migrations)
  const database: Record<string, unknown> = {};
  try {
    const result = await db.execute(sql`
      select table_name, column_name, character_maximum_length
      from information_schema.columns
      where (table_name = 'participants_participant' and column_name in ('public_token', 'current_year'))
         or (table_name = 'payments' and column_name = 'chargily_checkout_id')
         or (table_name = 'tickets_ticket' and column_name = 'serial_number')`);
    const rows = result.rows as { table_name: string; column_name: string; character_maximum_length: number | null }[];
    const has = (t: string, c: string) => rows.some((r) => r.table_name === t && r.column_name === c);
    const serial = rows.find((r) => r.table_name === "tickets_ticket");
    database.connected = true;
    database.publicTokenColumn = has("participants_participant", "public_token");
    database.checkoutIdColumn = has("payments", "chargily_checkout_id");
    database.serialLength = serial?.character_maximum_length ?? null;
    if (!database.publicTokenColumn || !database.checkoutIdColumn || (serial?.character_maximum_length ?? 0) < 32) {
      problems.push("Database is missing the latest Django migrations: deploy the backend (it runs migrate).");
    }
    const idType = await db.execute(sql`
      select data_type from information_schema.columns where table_name = 'payments' and column_name = 'participant_id'`);
    database.paymentsParticipantIdType = (idType.rows[0] as { data_type?: string } | undefined)?.data_type ?? null;
    if (database.paymentsParticipantIdType && database.paymentsParticipantIdType !== "bigint") {
      problems.push(
        `payments.participant_id is ${database.paymentsParticipantIdType}: participant ids have 10 digits, it must be bigint ` +
        `(ALTER TABLE payments ALTER COLUMN participant_id TYPE bigint).`
      );
    }
    const stuck = await db.execute(sql`
      select count(*)::int as n from participants_participant p
      left join tickets_ticket t on t.participant_id = p.id
      where p.payment_status = 'paid' and t.id is null`);
    database.paidWithoutTicket = (stuck.rows[0] as { n: number }).n;
    const unsent = await db.execute(sql`
      select count(*)::int as n from tickets_ticket where participant_id is not null and email_sent = false and status <> 'cancelled'`);
    database.ticketsNotEmailed = (unsent.rows[0] as { n: number }).n;
  } catch (err) {
    database.connected = false;
    problems.push(`Database error: ${String(err)}`);
  }

  // SMTP login (no email is sent)
  const smtp: Record<string, unknown> = { host: process.env.MAIL_HOST || null, port: process.env.MAIL_PORT || null };
  try {
    await mailService.verify();
    smtp.ok = true;
  } catch (err) {
    smtp.ok = false;
    problems.push(`SMTP login failed: ${String(err)}`);
  }

  return NextResponse.json({ ok: problems.length === 0, problems, urls, env, chargily, database, smtp });
}
