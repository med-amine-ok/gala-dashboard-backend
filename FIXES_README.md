# Engineers' Gala: backend fixes (Nov 2026)

This file explains what changed after the audit in [BACKEND_AUDIT.md](BACKEND_AUDIT.md): the new rules, every changed file, and how to deploy. Nothing is committed yet; all changes are in the working tree.

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
