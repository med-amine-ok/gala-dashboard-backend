# Engineers' Gala: backend fixes (Nov 2026)

This file explains what changed after the audit in [BACKEND_AUDIT.md](BACKEND_AUDIT.md): the new rules, every changed file, and how to deploy. The first round of fixes is in commit `b9c1f80`. The **3 November update** (section 0) is not committed yet.

---

## ✅ Go-live checklist (public site = https://gala.vic-enp.com)

**1. Vercel → landing project (the one serving gala.vic-enp.com) → Settings → Environment Variables (Production), then Redeploy:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://gala.vic-enp.com` |
| `WEBHOOK_URL` | **delete it** (the webhook is then `https://gala.vic-enp.com/api/webhook`) |
| `PAYMENT_LINK_BASE_URL` | `https://gala.vic-enp.com` |
| `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` | `https://gala-dashboard-backend.onrender.com` |
| `DATABASE_URL` | the **same** Neon database as Render |
| `CHARGILY_API_KEY` (+ `CHARGILY_API_URL`) | test key + `https://pay.chargily.net/test/api/v2` for tests; live key + `https://pay.chargily.net/api/v2` for real payments |
| `MAIL_HOST` `MAIL_PORT` `MAIL_USER` `MAIL_PASS` `MAIL_FROM` | your SMTP (for Gmail, an app password) |
| `DASHBOARD_ORIGINS` | where the dashboard runs, e.g. `http://localhost:3000` (add the dashboard's deployed URL if it has one) |
| `INTERNAL_API_TOKEN` | a long random string (diagnostics + internal routes) |

**2. Render → backend → Environment:**
* `LANDING_URL` = `https://gala.vic-enp.com`.
* `CORS_ALLOWED_ORIGINS` must include `https://gala.vic-enp.com` and the dashboard's URL.
* `DATABASE_URL`: the same Neon database as Vercel.
* `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` / `DEFAULT_FROM_EMAIL`.
* `CHARGILY_API_KEY`: same key as Vercel.
* `SECRET_KEY` (keep the current one), `DEBUG=False`.

**3. Dashboard:** `NEXT_PUBLIC_LANDING_URL` = `https://gala.vic-enp.com` once the code is pushed (until then `http://localhost:3001`, your local landing).

**4. Push the code** (Vercel and Render redeploy). Then:
* Open `https://gala.vic-enp.com/api/internal/diagnostics` with header `Authorization: Bearer <INTERNAL_API_TOKEN>`; `"ok": true` means the payment chain is configured.
* Dashboard → Participants → **Sync payments** recovers everyone who paid while it was broken.

**5. Refunds:** participant 3762051899 paid 3 times on 3 Nov (20:12, 20:57, 21:07). Keep one, refund two in Chargily.

---

## 0. Update 3 Nov 2026: "they paid, but no ticket and no email"

### What was wrong

| # | Cause | Effect |
|---|---|---|
| 1 | The ticket was only issued when Chargily's **webhook** reached the landing site, or when the payer's **success page** caught the payment. The success page asked Chargily **once**, right after the redirect, when the checkout is often still `pending`, and never asked again. | If the webhook didn't arrive, the payment was never recorded: no ticket, no email |
| 2 | The webhook and return addresses came from `WEBHOOK_URL` / `NEXT_PUBLIC_APP_URL`. The local `.env.local` has a dead tunnel (`…loca.lt`) and `http://localhost:3000`; if Vercel has the same values, Chargily posts to a machine that isn't there. | Webhook lost |
| 3 | Emails need SMTP settings: `MAIL_*` on Vercel for the landing site, `EMAIL_*` on Render for Django. If they're missing, sending fails quietly. | No email |
| 4 | Nothing in the dashboard could look a payment up again, or re-send a ticket. | People who already paid stayed stuck |
| 5 | (found while testing) The backend's calls to Chargily were refused by Cloudflare (**HTTP 403**, error 1010), because Python's default user agent is blocked. | Any server-side check from Django failed |

### What changed

**Django is now the safety net.** It asks Chargily directly, so a ticket no longer depends on the webhook or on the payer's browser:

* **"Check payment"** (↻ icon on each approved participant): asks Chargily for that participant's checkout. If it's paid, it marks them paid, assigns a ticket (a free pre-generated one first), emails it, and syncs the landing site's `payments` row. It also repairs "paid but no ticket" and "ticket never emailed".
* **"Sync payments"** (button at the top of Participants): the same for every approved participant who isn't completely done, 5 per request and looping automatically. The summary looks like *"3 ticket(s) issued & emailed · 1 ticket email(s) sent · 12 not paid yet"*. **Run it once after deploying: it recovers everyone who already paid.**
* If Chargily says paid but the participant isn't approved, it records the payment but issues no ticket, and reports *needs review* (approve, then check again, or refund).

**One ticket email for every path** (online payment recovered by sync, cash payment, manual assignment, resend):

* Attachments: the **official PDF ticket**, fetched from the landing site so it's the same design, plus the **QR code image**. If the landing site can't be reached, the email contains a download link instead of the PDF.
* `ticket.email_sent` is set only when SMTP really accepted the email. Every attempt is recorded in *Communications → email logs* with the error.

**New dashboard buttons:**

| Where | Button | What it does |
|---|---|---|
| Participants, row (approved + unpaid) | 💳 **Send payment link** | Emails the link `/payment/<secret token>`. If the email fails, the response still contains the link so you can share it another way |
| Participants, selection bar | **Send Payment Links** | Same for all selected people; not-approved or already-paid ones are skipped and counted |
| Participants, row (approved) | ↻ **Check payment** | See above |
| Participants, header | **Sync payments** | See above |
| Participants, payment column | `GT2026… ✓ emailed` / `• not emailed` | Ticket number and whether it was emailed |
| Tickets, assign modal | (existing) **Issue & Confirm Payment** | Now **emails the ticket** to the participant, and the toast warns if the email failed |
| Tickets, row | ✉ **Resend ticket email** | Gold = never emailed, green = already emailed |

**Landing site:**

* The success page now re-checks every 4 s for up to 2 minutes, and tells the payer the ticket will arrive by email if it's still pending after that.
* In production, a localhost or tunnel value in `NEXT_PUBLIC_APP_URL` / `WEBHOOK_URL` is ignored (and logged). The site then uses its real address (`VERCEL_PROJECT_PRODUCTION_URL`, or `https://gala.vic-enp.com`).
* A forged webhook signature now gets 401 instead of 500.
* **New diagnostics endpoint** `GET /api/internal/diagnostics` (header `Authorization: Bearer <INTERNAL_API_TOKEN>`). It reports, without showing any secret: missing env vars, the URLs given to Chargily, whether Chargily answers (and test vs live key), whether the DB has the latest columns, how many people are *paid without ticket* / *ticket not emailed*, and whether the SMTP login works.

### New / changed endpoints (all HR-only)

| Method & path | Purpose |
|---|---|
| `POST /api/participants/view/{id}/send_payment_link/` | Email the payment link; returns `payment_url` |
| `POST /api/participants/view/send_payment_links/` | Bulk version (`participant_ids`), now with a `message` |
| `POST /api/participants/view/{id}/sync_payment/` | Check Chargily → ticket + email. `result`: `ticket_issued`, `email_resent`, `email_failed`, `up_to_date`, `not_paid`, `needs_review`, `error` |
| `POST /api/participants/view/sync_payments/` | Batch version; send back `after_id` = `next_after_id` until it is `null` |
| `POST /api/tickets/{id}/resend_email/` | Email the ticket again |
| `POST /api/tickets/assign_ticket/`, `POST /api/payments/manual/` | Now email the ticket and return `email_sent` |
| `GET /api/participants/view/` | Rows now include `ticket_email_sent` |

### Files changed in this update

* **Django:**
  * `tickets/chargily.py` (new): Chargily client, user agent fixed, reads the stored checkout id or scans the list once.
  * `tickets/payment_handlers.py`: `sync_payment`, `email_ticket`, emails on every ticket path.
  * `notifications/emails.py`: attachments, plus `send_ticket_email` (PDF + QR, sets `email_sent`).
  * `participants/views.py`: `send_payment_link`, `sync_payment`, `sync_payments`.
  * `participants/serializers.py`: `ticket_email_sent`.
  * `tickets/views.py`: `resend_email`, `email_sent` in responses.
  * `gala_event/settings.py`: `CHARGILY_API_KEY`, `CHARGILY_API_URL`.
  * `tickets/test_payment_sync.py` (new, 11 tests) and `tickets/tests.py` (no network in tests).
* **Landing:**
  * `src/lib/participants/lookup.ts`: `appUrl()` / `webhookUrl()` reject dev addresses in production.
  * `src/app/api/payments/[id]/route.ts`: uses `webhookUrl()`; `params` typed as Next 15 expects.
  * `src/app/api/payments/verify/route.ts`: `pending` flag.
  * `src/app/payment/success/page.tsx`: polling.
  * `src/app/api/webhook/route.ts`: 401 on a bad signature.
  * `src/app/api/internal/diagnostics/route.ts` (new).
* **Dashboard:**
  * `src/app/dashboard/participants/page.tsx`: new buttons and ticket/email state.
  * `src/app/dashboard/tickets/page.tsx`: resend button, email-aware toast.
  * `src/lib/apiClient.ts`: `ticket_email_sent`.

### ⚠️ Settings to check before/after deploying

**Render (Django):**
* `CHARGILY_API_KEY` (**new**, same secret key as the landing site; test or live, matching the landing site).
* `CHARGILY_API_URL` (optional; it's inferred from the key).
* `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USE_TLS` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` / `DEFAULT_FROM_EMAIL`: without these, every Django email (approval, payment link, ticket) fails.
* `LANDING_URL`: the real landing address; payment links and the PDF fetch use it.

**Vercel (landing):**
* `NEXT_PUBLIC_APP_URL` = the real public address (not localhost).
* `WEBHOOK_URL`: **delete it**, or set it to `<real address>/api/webhook`.
* `MAIL_HOST` / `MAIL_PORT` / `MAIL_USER` / `MAIL_PASS` / `MAIL_FROM`. For Gmail, `MAIL_PASS` must be an *app password*.
* `INTERNAL_API_TOKEN` (any long random string), so you can open the diagnostics.
* The **live** `CHARGILY_API_KEY` and the live API URL when you leave test mode. The diagnostics flags a test/live mismatch.

In the **Chargily dashboard**, check the webhook URL there too if you set one.

**After deploying:**
1. Open the diagnostics:
   ```bash
   curl -H "Authorization: Bearer $INTERNAL_API_TOKEN" https://<landing>/api/internal/diagnostics
   ```
   `"ok": true` means the whole chain is configured.
2. In the dashboard, Participants → **Sync payments**.

### Dashboard login error "Given token not valid for any token type"

* **Cause:** the dashboard sent the token saved in the browser on **every** request, including the login request itself. The backend's login view still checked that token first. So an old token (from before a deploy, a `SECRET_KEY` change, or another backend) made **logging in** fail with 401.
* **Fix (dashboard)**, in `src/lib/apiClient.ts` and `src/app/providers.tsx`:
  * Login, token refresh and set-password requests never carry a token.
  * Logging in clears any old session first.
  * A token the server rejects (`token_not_valid`) is deleted.
* **Fix (backend):** login, set-password, CSRF, the public agenda and the public company lists ignore the `Authorization` header (`authentication_classes = []`).
* **Also fixed:** `/api/agenda/public/` was unreachable (the agenda router swallowed it, like check-in before). The explicit route now comes first.
* **If you still see the error before deploying:** log out, or clear the site data for the dashboard (DevTools → Application → Local storage → delete `access_token` / `refresh_token`).

### Dashboard shows everything empty after a while (all API calls 401)

* **Cause:** the access token now lives 60 min. When it expired, the dashboard's parallel requests **all** refreshed at the same moment with the same refresh token. The backend rotates and blacklists refresh tokens, so 1 refresh succeeded and the others failed. The failures wiped the tokens, but the `gala_auth_active` cookie stayed. The route guard (`middleware.ts`) trusts that cookie, so it kept sending `/login` back to `/dashboard`, where every call had no token → 401 → empty lists.
  * Reproduced with the old client code: 6 refreshes, 5 rejected, tokens gone, cookie kept.
* **Fix** (`src/lib/apiClient.ts`, `src/app/providers.tsx`):
  * One shared refresh for all concurrent requests (now: 1 refresh, all 6 requests succeed).
  * When the session really can't be recovered, the tokens **and** the cookie are cleared and you're taken to `/login?expired=true`.
  * On page load, a cookie without a token is cleared too.

### Dashboard shows 0 everywhere and the sidebar says "Company"

* **Cause:** the logged-in account has the **Company** role, not HR Admin, and all dashboard statistics are HR-only. Only "Corporate Partners" loads, because any logged-in user may read companies.
  * The old company-creation code (before commit `b9c1f80`) turned an *existing* account into a Company account (and reset its password) when a company was created with that email. That is how an HR account ends up as "Company". The new code refuses an email that is already used.
* **Restore the HR role.** Pick one:
  1. Neon console → SQL editor:
     ```sql
     UPDATE accounts_customuser SET role = 'HR', is_staff = true, is_active = true WHERE lower(email) = lower('<your email>');
     ```
  2. Django admin `https://gala-dashboard-backend.onrender.com/admin/` → Users → your account → *Role & HR* → **HR Admin** → Save.
  3. After deploying this update, on Render's shell:
     ```bash
     python manage.py set_hr_admin <your email>
     ```
     This also detaches the account from the company profile it was wrongly linked to.

  Then log out and log in again.
* **Dashboard guard:** Company / Participant accounts now get a clear message at login (and an already-open non-HR session is closed) instead of a page of zeros.
* **Superusers always count as HR admins.** A new `CustomUser.is_hr_admin` property (HR role **or** `is_superuser`) is used by every permission check, and is sent to the dashboard (`is_hr_admin` in the login, `current_user` and `check_auth` responses). So an HR account created with `createsuperuser`, whose role field was overwritten to Company, works again **once this backend update is deployed**, with no database edit. Until then, use the SQL fix above.

### "Send payment link" now goes through the landing site

The payment code lives in **gala-landing**, so the dashboard's payment-link buttons (single and bulk) now call the landing route **`POST /api/payments/send-link`** (`src/app/api/payments/send-link/route.ts`).

* **Who can call it:** the route checks the caller's dashboard token with Django (`GET /api/accounts/current_user/`, already on Render), so only HR admins can send. It answers CORS only for the origins in `DASHBOARD_ORIGINS` (default `http://localhost:3000`).
* **Who gets the email:** only APPROVED, unpaid participants with an email. It's sent directly with the landing's SMTP (`MAIL_*`), with the link `PAYMENT_LINK_BASE_URL/payment/<secret token>`.
* **No localhost links:** it **refuses to send** if that base is a localhost address. `PAYMENT_LINK_BASE_URL=https://gala-vic.vercel.app` was added to `gala-landing/.env.local`. On Vercel, set it to your public landing domain.
* **Dashboard setting:** `NEXT_PUBLIC_LANDING_URL` = where the landing runs (default `http://localhost:3001`). On a deployed dashboard, set it to the landing's URL, and add the dashboard's origin to the landing's `DASHBOARD_ORIGINS`.
* **Error messages:** the dashboard shows real errors instead of "null" (for example "Server error 404: … is the latest backend deployed?").

### Paid on Chargily, but nothing in the DB, dashboard or mailbox (3 Nov)

* **Found by reading the checkouts on Chargily:** the paid checkouts of 3 Nov (11:52, 20:12, 20:57) were created with `webhook_endpoint` **and** `success_url` on **`gala.vic-enp.com`**, the domain that still serves an **old build**. That old site didn't record anything in the database. October's checkouts correctly used `gala-vic.vercel.app`.
* **Cause:** since the security round, checkout URLs come from `NEXT_PUBLIC_APP_URL`, with a fallback of `https://gala.vic-enp.com`. Vercel apparently has no (or this) `NEXT_PUBLIC_APP_URL`, so the fallback sent Chargily to the old build.
* **Fix** (`src/lib/participants/lookup.ts`, `src/app/api/payments/[id]/route.ts`): when `NEXT_PUBLIC_APP_URL` is not set, the checkout uses **the deployment the payer is on**. That's the request's own host, not the spoofable `Origin` header, and it is the deployment that receives the webhook and the payer's return. The fallback is now `https://gala-vic.vercel.app`, and Django's `LANDING_URL` default is too.
* **Recover the people who already paid:** dashboard → Participants → **Sync payments** (or ↻ on the person). It asks Chargily, then marks them paid, assigns a ticket and emails the PDF.
* **On Vercel (gala-vic project):** set `NEXT_PUBLIC_APP_URL=https://gala-vic.vercel.app`, or remove it, then redeploy. Later, point the `gala.vic-enp.com` domain at this project (Vercel → Settings → Domains) and switch the URL to it.

### All ticket actions now run in gala-landing

Payments **and** tickets are handled by the landing site's payment code. The dashboard calls these landing routes, all HR-only (the caller's token is checked with Django, as for `send-link`):

| Dashboard button | Landing route | What it does |
|---|---|---|
| ↻ **Check payment** (participant row) | `POST /api/payments/sync` `{participantIds:[id]}` | Asks Chargily (stored checkout id, else the checkout list). If paid → the same `fulfillPayment` as the webhook: marks paid, assigns a ticket (free one first, row-locked), emails the PDF. Also repairs "paid but no ticket" and "ticket never emailed" |
| **Sync payments** (header) | `POST /api/payments/sync` `{afterId}` | Same for every approved participant who isn't completely done, 5 per call, until `nextAfterId` is null |
| **Assign ticket** (Tickets page) | `POST /api/tickets/assign` `{participantId, ticketSerial}` | Row-locked assignment, marks paid, records the `payments` row, emails the PDF ticket |
| ✉ **Resend ticket email** | `POST /api/tickets/resend` `{ticketId}` | Emails the PDF again |
| 💳 **Send payment link** | `POST /api/payments/send-link` | See above |

* **New shared helpers:** `src/lib/security/hr-auth.ts` (HR check + CORS), `src/lib/payments/chargily.ts` (checkout lookup), `src/lib/tickets/email-ticket.ts` (PDF email + `email_sent`).
* **Tested** on an isolated copy of the landing site (throw-away Postgres, fake mail server, real Chargily test API):
  * "Paid but no ticket" → ticket + PDF email.
  * Real unpaid checkout → "not paid", nothing changed.
  * Manual assignment → paid + ticket + `payments` row + PDF email; assigning the same ticket twice is refused.
  * Resend → PDF email.
  * Bulk sync worked; no token → 401.
* ⚠️ **Same Chargily mode:** the landing that runs "Check payment" must use the **same Chargily key and mode** (test vs live) as the site where people paid. Otherwise Chargily simply doesn't show the payment.

### How it was tested

Everything ran locally against a throw-away Postgres (PGlite, Postgres 18), a fake mail server that captures messages, and the real **Chargily test API**:

* 47 Django tests pass; `makemigrations --check` is clean; landing and dashboard type-check.
* All migrations, including the one that adds a column to `payments`, ran on that Postgres.
* The real flow:
  * Approved participant → payment page → **real Chargily test checkout created** (checkout id stored).
  * Webhook pointed at an unreachable address, as in the bug.
  * "Check payment" → real Chargily lookup → correctly "not paid" while unpaid. This is where the Cloudflare 403 was found and fixed.
* A correctly signed `checkout.paid` webhook → the landing site assigned a free pre-generated ticket and emailed the PDF.
* Manual assignment in the dashboard → ticket email with PDF + QR.
* Resend button worked.
* **Sync payments** repaired "paid, no ticket" and "ticket never emailed" in one click, and left the unpaid person alone.
* Send payment link (single + bulk with a pending person skipped).
* PDF download: 200 with the token, 404 with a numeric id. Forged webhook: 401.
* **Not yet done:** completing a real test-mode payment on Chargily's checkout page, then pressing "Check payment" (it needs ticking Chargily's terms checkbox). The same path is covered by tests with Chargily's response simulated.

**Verified:**
* 36 new Django tests pass (`python manage.py test`).
* `makemigrations --check` reports no missing migrations.
* The new migrations were run on a copy of the old schema with existing rows (tokens filled, emails lower-cased, duplicates reported).
* The landing site type-checks (`tsc --noEmit`).
* The Flutter auth screens pass `dart analyze` with no errors.

**Not verified:**
* No real browser or phone run.
* No real Chargily or SMTP call.
* Nothing has been run against the production database.

---

## 1. What's new, in one minute

| Before | Now |
|---|---|
| Anyone who knew an approved participant's email could set their password and log in as them | Creating an account needs a **6-digit code sent to that email** (expires after 15 min, max 5 tries, one new code per minute) |
| Participants could set themselves `APPROVED` / `paid` through their profile | A participant can only edit name, phone, LinkedIn and description |
| `/api/send-email` on the landing site sent any email to anyone | **Removed.** `send-ticket` and `send-emails` now need a secret token and take their data from the database only |
| `DEBUG=True` hard-coded, `ALLOWED_HOSTS=*`, public default `SECRET_KEY` | Everything comes from env vars. The app **refuses to start without `SECRET_KEY`**. HTTPS hardening is on when `DEBUG=False` |
| Payment, ticket and QR pages worked with the participant's number, so anyone could open anyone's ticket | Links use a secret **`public_token`** per participant. Old numeric links still confirm a payment, but show no personal data and no ticket |
| Paying approved you automatically, even after a rejection | Payment **never** changes the review status. Only `APPROVED` participants can pay or get a ticket |
| Two payments at the same moment could receive the same ticket | Free tickets are taken with a row lock (`FOR UPDATE SKIP LOCKED`), and fulfilment is idempotent |
| Check-in and scan history were unreachable (router bug), and any logged-in user could use them | Both work, are **HR-only**, and check-in is locked against double scans and refuses unassigned, cancelled or non-approved tickets |
| Deleting a participant crashed in production (missing migration) | Migration added |
| Dashboard counters always 0; search returned 500 | Fixed |
| Three approval endpoints with different side effects; no emails | One **approval service** used everywhere, which sends the approval email (with payment link) or the rejection email |
| Several crashes (company profile, long phone numbers, duplicate-case emails, unassigned tickets…) | Fixed; they now return proper 400/404 responses |

---

## 2. The new logic

### 2.1 Participant lifecycle

```
register (landing form) ──► PENDING  (account inactive, no password)
        HR approves ───────► APPROVED (account active) ──► email: "approved" + payment link /payment/<public_token>
        HR rejects ────────► REJECTED (account inactive, reason required) ──► email: "not this time"
        HR resets ─────────► PENDING  (account inactive again)
APPROVED + pays (Chargily) ► payment_status=paid + ticket assigned + PDF ticket emailed
APPROVED + creates account in app ► email code ──► code + password ──► logged in
```

* **One place changes status:** `participants/services.py → set_status()`. The participant view-set (single and bulk) and the dashboard table actions all call it. It locks the rows, sets `is_active`, `approved_by`, `approved_at` and `rejection_reason` consistently, and sends emails **only after the database commit**, and only for participants whose status really changed.
* `PAYMENT_LINK_IN_APPROVAL_EMAIL=True` (the default) puts the payment link in the approval email. Set it to `False` to send links separately: HR can call `POST /api/participants/view/send_payment_links/ {"participant_ids":[…]}`, or use the protected landing route `/api/send-emails`.
* Email templates: if HR creates an active `EmailTemplate` of type `approval_notification`, `rejection_notification`, `payment_reminder` or `payment_confirmation`, it replaces the built-in text. Placeholders: `{{first_name}}`, `{{payment_url}}`, `{{ticket_serial}}`, `{{rejection_reason}}`.

### 2.2 Creating an account in the app (replaces the insecure "email + password" flow)

`POST /api/accounts/set-password/`

1. `{ "email": "…" }` → **202** `{"code_required": true, "detail": "We sent a 6-digit code to …"}`
   * Only for participants who are `APPROVED` and have no password yet.
   * A new code at most once a minute (**429** otherwise).
   * Only a hash of the code is stored, never the code itself. The email body is redacted in `EmailLog`.
2. `{ "email", "code", "password" }` → **200** `{access_token, refresh_token, user}`
   * The password goes through Django's password validators.
   * Each code works once, and stops working after 5 wrong tries.
3. The old `uid + token + password` link flow still works, and is now also validated.

**The Flutter app is updated** (`gala_app/lib/auth/…`): "Send me a code" → enter code + password → "Create Account". ⚠️ **Old app builds can no longer create accounts.** They get the 202 and stop. Publish the new build before telling participants to sign up. Logging in with an existing password is unchanged.

### 2.3 Payment and ticket rules (Django **and** landing site)

* A checkout can only start for `APPROVED`, unpaid participants without a ticket (`/api/payments/[id]` → 403 otherwise).
* `fulfillPayment` (landing) locks the participant row and records the payment and `paid`, but **does not touch `status`**.
  * If the participant is not `APPROVED` (for example, rejected after getting a link), no ticket is issued. The success page says the team will get in touch, and the log line tells HR to refund or decide.
  * Otherwise it reuses the participant's ticket, or takes the oldest free non-cancelled ticket with `SKIP LOCKED`, or creates a new one. The PDF is emailed once.
* A `checkout.failed`, `checkout.expired` or `checkout.canceled` webhook never downgrades a payment that already succeeded.
* The Chargily checkout id is stored on the `payments` row. Verification fetches that checkout directly and falls back to the last 50 checkouts for older payments.
* In Django, `POST /api/payments/manual/` (cash or transfer) and `POST /api/tickets/assign_ticket/` follow the same rules: approved only, atomic, a confirmation email with the ticket number, and an invitation to create the app account.
* New ticket serials are `GT<year>` + 16 hex characters (64 random bits). Existing 8-hex serials stay valid.

### 2.4 Check-in (dashboard)

* `POST /api/tickets/checkin/ {serial_number, action: "check_in"|"check_out"}` is HR-only.
  * `serial_number` can be the plain serial **or the JSON printed in the ticket QR**.
  * The ticket row is locked, so two scanners can't both admit the same person.
  * Refused: unknown, cancelled, unassigned, holder not approved, already checked in (the error includes the time of the first check-in).
  * Every attempt, including refusals, is logged in `TicketScan`, with the new results `checked_out` and `already_checked_in`.
* `GET /api/tickets/scan-history/[?ticket_id=]` is HR-only, and now returns `participant_name` as the dashboard expects.
* `GET /api/tickets/verify/<serial>/` is public and rate-limited. It returns validity and status only, no name.

### 2.5 Registration contract (landing form → `POST /api/participants/register/`)

* Accepts exactly what the form sends. **`current_year` is now stored** (new column).
* Emails are lower-cased and compared case-insensitively. A duplicate (even with different capitals), or two simultaneous submissions, gives `400 {"email": ["This email is already registered."]}`.
* Every field has the database's length limit, so too long means a 400 field error, never a 500. Phone numbers are validated (digits, spaces, `+`, `-`, `(`, `)`, `.`; 6–20 characters).
* Choosing **OTHER** requires the matching `*_other` text (`400 {"university_other": ["Please specify."]}`).
* Guests (`participant_type: "G"`) no longer have to give university, field, level or graduation year. Students still do.
* The landing proxy (`/api/participants/register`) turns any non-email field error into one readable `error` line, which the form already displays. **The form page itself was not modified.**

---

## 3. Everything that changed, file by file

### Django: `gala_event/`

| File | Change |
|---|---|
| `gala_event/settings.py` | `DEBUG`, `ALLOWED_HOSTS` (+ Render hostname), `CSRF_TRUSTED_ORIGINS` from env; `SECRET_KEY` required (no default); HTTPS settings when not DEBUG; DRF scoped throttles (`login`, `register`, `set_password`, `feedback`, `ticket_verify`) + `NUM_PROXIES`; JWT access 60 min / refresh 30 days; in-memory cache unless `CACHE_URL`; `LOGGING` to stdout; `LANDING_URL`, activation-code settings, `PAYMENT_LINK_IN_APPROVAL_EMAIL`, `API_DOCS_PUBLIC`; removed `print()`s, dead `DEFAULT_FILE_STORAGE`, placeholder `FRONTEND_URL` |
| `gala_event/urls.py` | Swagger/ReDoc public only if `API_DOCS_PUBLIC`, otherwise staff-only; `/api/token/` rate-limited like login |
| `gala_event/celery.py` | Removed the debug task |
| `accounts/models.py` | Emails lower-cased on creation; new `ActivationCode` model |
| `accounts/services.py` (new) | Case-insensitive user lookup (detects duplicates); issue / check activation codes (HMAC-hashed, TTL, attempts, cooldown) |
| `accounts/views.py` | Rewritten `SetPasswordView` (code flow, password validation, token flow kept); login throttled, no PII in logs; logout simplified; removed dead participant-profile views and `get_csrf_token` |
| `accounts/serializers.py` | Login: case-insensitive, no `check_password` bypass, clear message for duplicate emails, status messages only after a correct password; `CompanyProfileSerializer` fixed (was always 500); removed dead `ParticipantProfileSerializer` |
| `accounts/management/commands/find_duplicate_emails.py` (new) | Lists accounts whose emails differ only by case |
| `participants/models.py` | `current_year`, `public_token` (unique, random), indexes on status / payment_status / registered_at / email; removed duplicate `field_of_study` definition |
| `participants/services.py` (new) | `set_status()`, the single approval / rejection / reset logic with emails |
| `participants/serializers.py` | Registration: lengths, phone check, OTHER → `*_other` required, guests optional, lower-case email, `current_year`; `ParticipantSerializer` fully read-only, with real `is_approved`/`is_paid`; new `ParticipantSelfUpdateSerializer` (whitelist); feedback participant is read-only; removed dead serializers |
| `participants/views.py` | Registration throttled, IntegrityError → 400, no raw errors; view-set search fixed, N+1 fixed, approve/bulk via `set_status`, new `send_payment_links` action, aggregated statistics; manual registration approves through the service; feedback requires a logged-in participant; images: participant-only, row-locked limit, random Cloudinary names; links: approved targets only, no self-link, safe when the profile is missing; removed duplicated permission classes and the unrouted `ParticipantDetailView` |
| `participants/urls.py`, `participants/admin.py` | Cleaned up; models registered in the Django admin |
| `tickets/models.py` | 64-bit serials (`max_length=32`); `__str__` safe for unassigned tickets; `mark_as_assigned` no longer writes `checked_in_by`; new scan results |
| `tickets/payment_handlers.py` | Rewritten: `handle_payment_success` / `assign_ticket_with_payment`, approved-only, atomic + row locks, free ticket with `skip_locked`, confirmation email after commit, no reset links |
| `tickets/views.py` | Check-in rewritten (HR-only, locked, QR JSON accepted, all refusals logged); verify without PII + throttled; scan history HR-only + `participant_name`; view-set `select_related`, fixed search/ordering, aggregated statistics; `assign_ticket` uses the payment rules |
| `tickets/urls.py` | Explicit routes **before** the router (fixes the unreachable check-in and scan history) |
| `tickets/serializers.py` | `participant` and check-in fields read-only; removed dead serializers |
| `dashboard/views.py`, `dashboard/serializers.py` | Correct status values, aggregated counts, working check-in activity feed, safe `limit`; table approve/reject via `set_status` |
| `companies/views.py`, `companies/serializers.py` | Company creation always makes a **new** account (an existing email is refused), password validated, atomic; `user` not writable; name uniqueness on create and update; links only to approved participants; removed debug prints |
| `notifications/emails.py` (new) | All outgoing emails (approval, rejection, payment link, payment confirmation, activation code), each logged in `EmailLog`, secrets redacted, SMTP failures never crash a request |
| `notifications/views.py`, `notifications/serializers.py` | Notifications are read-only for API users (no more fake alerts to HR) |
| `agenda/models.py`, `agenda/serializers.py`, `agenda/views.py` | `AgendaRegistration.participant` nullable + migration; start/end check on partial updates; bad date filter → 400 |
| Migrations | `accounts/0006` (ActivationCode), `participants/0017` (current_year, public_token in 3 safe steps, lower-cases emails where no collision, indexes), `agenda/0005` (missing column), `tickets/0006` (serial length, scan choices), `tickets/0007` (adds `payments.chargily_checkout_id` only if that table exists) |
| Tests | `accounts/tests.py`, `participants/tests.py`, `tickets/tests.py`, `companies/tests.py`: 36 tests covering every fix above |
| `build.sh` | Fails the deploy if a migration is missing (`makemigrations --check`) |
| `requirements.txt` | Converted from UTF-16 to UTF-8; removed dev-only packages (black, django-erd, …); pinned `setuptools<81` (drf-yasg needs `pkg_resources`) |
| `.env.example` (new) | Every environment variable, documented |
| Deleted | `schema.sql` (stray `inspectdb` dump), `templates/emails/set_password.*` (links to a page that never existed) |

### Landing site: `gala-landing/`

| File | Change |
|---|---|
| `src/app/api/send-email/route.ts` | **Deleted** (open mail relay, unused) |
| `src/app/api/send-ticket/route.ts` | Needs `Authorization: Bearer $INTERNAL_API_TOKEN`; body `{serialNumbers:[…]}`; names, emails and serials are read from the DB |
| `src/app/api/send-emails/route.ts` | Needs the internal token; only approved + unpaid participants; link uses `public_token`; no PII in logs |
| `src/lib/security/internal-auth.ts` (new) | Constant-time token check; refuses everything if the token isn't configured |
| `src/lib/participants/lookup.ts` (new) | Find a participant by token (or legacy numeric id); `appUrl()` from env |
| `src/app/api/payments/[id]/route.ts` | Accepts token or legacy id; approved-only; URLs from env only (not the `Origin` header); stores the Chargily checkout id; success URL uses `?token=`; no raw errors |
| `src/app/api/payments/verify/route.ts` | `?token=`: full ticket view (no phone number any more). `?participant_id=` (old checkouts): confirmation only. Looks up the stored checkout first; French messages |
| `src/app/api/tickets/download/route.ts` | Token only (no id or serial lookup); `no-store` |
| `src/app/api/webhook/route.ts` | Failed, expired or cancelled checkouts can't undo a successful payment |
| `src/lib/payments/fulfill.ts` | Rewritten: row lock, no auto-approval, `SKIP LOCKED` free ticket, idempotent, email once, 64-bit serials, recipient email not returned |
| `src/lib/mail.ts` | Hard-coded Mailtrap credentials removed; env only |
| `src/app/api/participants/register/route.ts` | Readable `error` for field errors; no raw exception text |
| `src/app/api/inngest/route.ts`, `src/lib/inngest/functions.ts` | Removed the always-failing `helloWorld` function |
| `src/app/payment/success/page.tsx` | Reads `?token=` (falls back to the old `?participant_id=`); shows the message card when no ticket view is returned |
| `drizzle/schema.ts` | `current_year`, `public_token`, `payments.chargily_checkout_id`, serial length 32 |

### Dashboard: `gala-dashboard/`

* `src/app/dashboard/tickets/page.tsx`: the cancel button called a URL that doesn't exist. It now calls `/api/tickets/{id}/cancel_ticket/`.

### Mobile app: `gala_app/`

* `lib/auth/auth_provider.dart`: new `requestActivationCode(email)`; `createAccount(email, password, code)`.
* `lib/auth/create_account.dart`: two steps (send code → code + password), plus a "send a new code" link.
* `lib/core/failure.dart`: shows the server's message for any status (404, 429, 503…), not only 400/401/403.

---

## 4. Deploying: do it in this order

1. **Render (Django) environment variables.** See `gala_event/.env.example`.
   * Required: `SECRET_KEY` (keep the current production value, or every user is logged out), `DATABASE_URL`, `CLOUDINARY_*`, `DEBUG=False`.
   * Check `ALLOWED_HOSTS` (the Render hostname is added automatically), `CORS_ALLOWED_ORIGINS` (must include the landing domain), `EMAIL_*` and `LANDING_URL`.
2. **Deploy Django first.** `build.sh` runs the migrations, which add `public_token`, `current_year` and `payments.chargily_checkout_id`. The new landing code reads those columns, so it must not go live before them.
3. Run `python manage.py find_duplicate_emails` on Render's shell. Keep one account per listed email and delete the others (those people can't log in until you do).
4. **Vercel (landing) environment variables:**
   * `INTERNAL_API_TOKEN`: a long random string, only if you still use `send-emails` / `send-ticket`.
   * `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`: required now, there are no built-in credentials any more.
   * `NEXT_PUBLIC_APP_URL=https://gala.vic-enp.com`, `WEBHOOK_URL` (optional), `CHARGILY_API_KEY`, optional `TICKET_PRICE_DZD` (default 1000).
   * `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY`, `DATABASE_URL`.

   Then deploy the landing site.
5. **Deploy the dashboard** (one-line fix).
6. **Build and publish the Flutter app** before asking participants to create accounts (see §2.2).

### Manual actions only you can do

* **Rotate the Mailtrap credentials** that were committed in `gala-landing/src/lib/mail.ts`. They are still in git history.
* **Stop using the production database from your laptop.** `gala_event/gala_event/.env` still has the Neon production `DATABASE_URL`; I didn't touch your local secrets. Use SQLite or a local Postgres for development.
* Payment links already emailed with a **numeric id** keep working for paying, but the success page then only confirms the payment (the ticket arrives by email). To give people the new secure links, re-send them with `send_payment_links`.
* If any participant appears as "paid" but not approved (the server logs mention `needs HR review`), decide whether to refund or approve them. Approving doesn't issue a ticket automatically; use `assign_ticket` or `payments/manual` afterwards.

---

## 5. Running the tests

```bash
cd gala_event
DATABASE_URL=sqlite:///:memory: SECRET_KEY=dev-only-key-0123456789abcdefghijklmnop CLOUDINARY_CLOUD_NAME=x CLOUDINARY_API_KEY=x CLOUDINARY_API_SECRET=x SECURE_SSL_REDIRECT=False python manage.py test
```

Override `DATABASE_URL` as above so the tests never touch the database in your `.env`.

---

## 6. Left as is, on purpose (and why)

* **No database-level case-insensitive unique constraint on emails.** If production already has case-duplicates, adding one would fail the deploy during the event week. The code now prevents new duplicates, and `find_duplicate_emails` finds the old ones. Add the constraint after the clean-up if you want it.
* **Companies still see the email of participants they scan.** That is the point of the career-fair feature. Scanning now only works for approved participants.
* **The ticket QR is not cryptographically signed.** Serials are now 64-bit random and the public lookup reveals nothing, which is enough for the event. Signing the QR would also require changing the PDF generator and the scanner.
* **`gala_app` still calls `/tickets/me`**, which doesn't exist. The function is never used in the app.
* **Rate limits** are per IP and in-memory, so per server process. Set `CACHE_URL` to a Redis instance if you run several instances. Registrations all come through the landing proxy's IP, so that limit is generous (120/hour).
