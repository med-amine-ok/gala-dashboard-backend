# Engineers' Gala — Backend Audit

> **Status:** the findings below have been fixed (except the points listed as intentionally left in §6 of the fixes file). See [FIXES_README.md](FIXES_README.md) for the new logic, every change, and the deploy order. Line numbers below refer to the code *before* the fixes.

_Audit date: 2026-11-01 · Scope: `gala_event/` (Django/DRF API), the server-side routes of `gala-landing/` (Next.js API routes + Drizzle, which write to the **same** Postgres), and the places where `gala-dashboard/` and `gala_app/` call the API. Read-only: no code was changed._

**How the findings were checked:** I read all the code. `manage.py check --deploy` and `makemigrations --check` were run against a throw-away in-memory SQLite DB, **never** the Neon DB that `gala_event/gala_event/.env` points to. I also ran a probe script with DRF's `APIClient` on that throw-away DB. Findings marked **[reproduced]** were confirmed that way. The rest come from reading the code.

---

## 0. TL;DR — fix these before the gala

| # | Severity | One-liner |
|---|---|---|
| C1 | Critical | Anyone can set the password of any approved/paid participant who hasn't set one yet, knowing only their email. They get logged in as that participant **[reproduced]** |
| C2 | Critical | Participants can set their own `status=APPROVED`, `payment_status=paid` (and `approved_by`, `user`…) through `PATCH /api/participants/profile/update/` **[reproduced]** |
| C3 | Critical | The landing site exposes **unauthenticated email-sending endpoints**: `/api/send-email` is an open mail relay, and `/api/send-ticket` sends forged tickets to any address |
| C4 | Critical | `DEBUG = True` is hard-coded in production with `ALLOWED_HOSTS=['*']`. Every 500 (and there are many, below) shows a full debug page |
| H1 | High | Anyone with a participant ID can get that participant's PII and **ticket PDF/QR**, and can start payments for them (landing `payments/verify`, `tickets/download`, `payments/[id]`) |
| H2 | High | Paying skips HR approval and **overrides a rejection** (landing `fulfillPayment`, Django `assign_ticket`) |
| H3 | High | Concurrent payments can hand the **same unassigned ticket to two people** |
| H4 | High | **Check-in and scan history are unreachable**: `/api/tickets/checkin/` and `/api/tickets/scan-history/` are swallowed by the router. This blocks the event night **[reproduced]** |
| H5 | High | Missing migration (`AgendaRegistration.participant`). **Deleting a participant crashes in prod** **[reproduced]** |
| H6 | High | `SECRET_KEY` silently falls back to a public default. If the env var is missing, anyone can forge JWTs, including HR tokens |
| H7 | High | Dashboard counters (pending/approved/check-ins) are **always 0**: lowercase vs uppercase status values **[reproduced]** |
| H8 | High | Admin **search on participants and tickets returns 500** **[reproduced]** |
| H9 | High | Approval state machine is inconsistent: "pending" re-activates accounts, the dashboard "reject" leaves the account active, and no approval email is ever sent |
| H10 | High | Set-password links point to `https://your-frontend-url.com`, so the token flow can't work |

The registration contract with the landing form mostly works (the happy path returns **201** **[reproduced]**), but it has gaps: `current_year` is dropped, duplicate emails get through, and long values cause a 500 (see §3).

---

## 1. Architecture overview (as I understood it)

```
                ┌──────────────── gala-landing (Next.js on Vercel) ────────────────┐
 Visitor ──►    │ /register page ──► /api/participants/register (proxy) ───────────┼──► Django  POST /api/participants/register/
                │ /payment/[id] ──► /api/payments/[id] ──► Chargily checkout       │
                │ Chargily ──► /api/webhook (signed) ─┐                             │
                │ /payment/success ──► /api/payments/verify ─┤ fulfillPayment()     │──► writes DIRECTLY to Postgres:
                │ /api/tickets/download, /api/send-email(s), /api/send-ticket       │      participants_participant, tickets_ticket,
                │ /api/inngest (email queue) ──► Mailtrap/SMTP                      │      accounts_customuser, payments (non-Django table)
                └───────────────────────────────────────────────────────────────────┘
                ┌──── gala_event (Django 5.2 + DRF, Render) ──── Neon Postgres ─────┐
 HR dashboard ─►│ JWT (SimpleJWT) · apps: accounts, participants, tickets,         │
 (gala-dashboard)│ companies, agenda, notifications, dashboard · Cloudinary media   │
 Flutter app ──►│ (participants & companies: login, profile, link/scan, feedback)  │
                └───────────────────────────────────────────────────────────────────┘
```

* **Two backends share one database.** Django owns the schema through its migrations. The Next.js landing app reads and writes the same tables directly through Drizzle, and also owns an extra `payments` table that Django's migrations don't know about. Business rules (approval, activation, ticket assignment) are therefore implemented **twice**, and the two copies disagree (see H2, H9).
* **Roles** (`accounts.CustomUser.role`): `HR` (admin), `P` (participant), `C` (company). Login is by email and returns JWTs (30-day access tokens). `SessionAuthentication` is enabled too.
* **Unused infrastructure:** Celery and a Redis cache are configured, but there are no tasks and nothing uses the cache. Email is sent synchronously.
* **Tests:** none. Every `tests.py` is empty.

### Registration and participant lifecycle (as implemented)

1. **Register** (`POST /api/participants/register/`, public). `ParticipantRegistrationSerializer` creates `CustomUser(role=P, is_active=False, random unusable-in-practice password)` plus a `Participant(status=PENDING, payment_status=pending)` inside `transaction.atomic()`. The response is 201 `{message, next_steps, status, email}`.
2. **HR review**, through one of three different code paths with different side effects:
   * `POST /api/participants/view/{id}/approve_reject/`: approve sets the user active; reject sets them inactive; **pending sets them active** (bug).
   * `POST /api/participants/view/bulk_approve_reject/`: same behaviour (pending → active).
   * `POST /api/dashboard/participants-table/{id}/action/`: approve/reject **without touching `user.is_active`**.
   * No email is sent on approve or reject, even though the registration response promises one.
3. **Payment link:** someone calls the landing `/api/send-emails` (unauthenticated) with a list of emails. It emails `https://gala.vic-enp.com/payment/{participant.id}`.
4. **Pay:** `/api/payments/[id]` creates a Chargily checkout. Then the webhook (`checkout.paid`) or the success-page poll (`/api/payments/verify`) runs `fulfillPayment()`, which sets `paid` + `APPROVED` + user active, assigns an unassigned ticket or creates one, and emails the PDF ticket.
   *(Django has a parallel path: `ManualPaymentView` → `handle_payment_success`, which emails a set-password link, plus `assign_ticket`.)*
5. **Set password:** the Flutter app calls `/api/accounts/set-password/` with **email + password** (insecure flow, C1), or with uid + token from the email (broken link, H10).
6. **Event night:** staff check in at `/api/tickets/checkin/`, which is unreachable (H4). Companies scan participant QR codes and call `/api/companies/link-participant/{id}/`.

---

## 2. Findings

Each finding gives: **where** · **what is wrong** · **why it matters** · **fix**. Paths are relative to the repo root.

### 🔴 CRITICAL

#### C1 — Account takeover through the "email flow" of set-password **[reproduced]**
* **Where:** `gala_event/accounts/views.py:333-381` (`SetPasswordView`, `AllowAny`).
* **What:** If the body has `email` + `password` and no `uid`/`token`, the view looks the user up by email. If they are an approved participant with `password_set=False`, it sets the password, activates the account and **returns access and refresh tokens**. No secret is needed. The probe got `200` and tokens as a total stranger.
* **Why it matters:** Every approved participant who hasn't opened the app yet can be hijacked. The exposure is wide: `fulfillPayment` marks **every paying participant** `APPROVED` and active while leaving `password_set=False`. Participant emails are also easy to find (the Flutter linked-participants list, ticket QR codes, and the landing `payments/verify` response). The attacker then owns the profile, the ticket and the uploaded images, and the real owner is locked out with "Password has already been set."
* **Fix:** Delete the email flow. Keep only `uid + token`, and email that link on approval or payment (see H10). In the token flow, run `django.contrib.auth.password_validation.validate_password(password, user)` and rate-limit the endpoint (`ScopedRateThrottle`). If the app really needs an "activate by email" UX, use an emailed one-time code, not the email address alone.

#### C2 — Participants can edit their own approval and payment status **[reproduced]**
* **Where:** `gala_event/participants/views.py:100-136` (`ParticipantProfileUpdateView`) uses `ParticipantSerializer` (`gala_event/participants/serializers.py:141-183`), where `status`, `payment_status`, `approved_by`, `approved_at`, `rejection_reason` and `user` are **writable**.
* **What:** `PATCH /api/participants/profile/update/ {"status":"APPROVED","payment_status":"paid"}` returned `200` with those values saved. `user` is writable as well, so a participant can re-point their profile at another user id.
* **Why it matters:** This completely bypasses HR approval and payment. A participant who is "paid" in the DB but has no ticket will look legitimate to the dashboard, and `approved_by` can be forged.
* **Fix:** Use a dedicated `ParticipantSelfUpdateSerializer` with an explicit whitelist (`phone`, `linkedin_url`, `personal_description`, …). Make every status, approval and relation field read-only in `ParticipantSerializer`, and use the explicit approval actions to change them.

#### C3 — Unauthenticated email-sending endpoints on the landing site (open relay)
* **Where:**
  * `gala-landing/src/app/api/send-email/route.ts:31-59` takes `from`, `to`, `subject`, `html` and `attachments` from the request body and sends through the org SMTP.
  * `gala-landing/src/app/api/send-ticket/route.ts:14` builds a "ticket" PDF from **caller-supplied** names and serials and emails it to any address.
  * `gala-landing/src/app/api/send-emails/route.ts:8` mass-sends payment links to any listed participant emails, and logs full participant rows (`:29`).
* **Why it matters:** Anyone on the internet can send phishing that genuinely comes from your domain or mail provider, with attachments. That burns your sender reputation and gets the account suspended. They can also send convincing fake tickets, or spam participants with payment links.
* **Fix:** Remove `send-email` and `send-ticket` from the public app. If you need them, protect them with a server-side secret header (`Authorization: Bearer ${INTERNAL_API_TOKEN}`) or move them behind the Django HR auth. Never accept `from`/`to`/`html` from the client. `send-emails` should be an HR-only action in Django (or require the same secret), and must not log PII.

#### C4 — `DEBUG = True` hard-coded in production
* **Where:** `gala_event/gala_event/settings.py:40` (it ignores the `DEBUG` env var defined at `:23`), together with `ALLOWED_HOSTS = ['*']` (`:42`).
* **Why it matters:** Several public endpoints throw 500s (`/api/tickets/verify/<unassigned serial>/`, registration with a long phone number on Postgres, login with duplicate-case emails, …). With DEBUG on, each one renders a debug page with the stack trace, local variables, SQL, installed apps and most settings. Debug mode also keeps every SQL query in memory.
* **Fix:** `DEBUG = env('DEBUG')` (default False), and set `DEBUG=False` on Render. Set `ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['gala-dashboard-backend.onrender.com'])`. Also add `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO','https')`, `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_HSTS_SECONDS`, and `CSRF_TRUSTED_ORIGINS` (`check --deploy` flagged W004/W008/W012/W016/W018).

### 🟠 HIGH

#### H1 — Anyone with a participant ID can read PII and get the ticket
* **Where:**
  * `gala-landing/src/app/api/payments/verify/route.ts:9-66` (GET, public) returns name, email, **phone**, university, ticket serial and a **QR data-URL** when the participant has paid.
  * `gala-landing/src/app/api/tickets/download/route.ts:10-47` (GET, public) returns the **ticket PDF** by `participant_id` **or** `serial_number`.
  * `gala-landing/src/app/api/payments/[id]/route.ts` (POST, public) starts a checkout for any participant.
  * The Django `TicketVerificationView` (`gala_event/tickets/views.py:435-458`, `AllowAny`) returns the participant's name for any serial, with no throttling.
* **Why it matters:** Participant IDs are not secret. They appear in payment URLs (`/payment/{id}`, `success_url?participant_id=`), in emails, and in the IDs companies scan. The ticket QR (serial number) is the entry credential, so whoever downloads the PDF can get in. The phone and email leak is a privacy and data-protection problem in its own right.
* **Fix:** Use an unguessable token instead of the raw ID. For example, store a random `payment_token` on the participant or payment row, put **that** in links, and look up by it. Return the PII only to a JWT-authenticated owner. Drop `participant_id` lookup from `tickets/download`, or require a signed short-lived link (HMAC over serial + expiry) that is sent by email. Rate-limit `tickets/verify` and stop returning the participant name there.

#### H2 — Payment bypasses HR approval and overrides a rejection
* **Where:**
  * `gala-landing/src/lib/payments/fulfill.ts:72-80` sets `status: "APPROVED"` unconditionally, without `approved_by`.
  * `gala-landing/src/app/api/payments/[id]/route.ts:37` only rejects `paid`, not `PENDING` or `REJECTED`.
  * In Django, `gala_event/tickets/views.py:298-301` (`assign_ticket`) forces `APPROVED`, and `gala_event/tickets/payment_handlers.py:27` marks paid with no status check.
* **Why it matters:** A **rejected** participant who still has a payment link (or just their ID, see H1) can pay and becomes approved, gets a ticket and has an active account. The vetting step means nothing.
* **Fix:** Decide the rule. Normally only `APPROVED` participants can pay. Enforce it at checkout creation (`payments/[id]`) **and** in `fulfillPayment` / `assign_ticket` (don't change `status`; if somebody pays while not approved, flag it for manual refund instead). Record `approved_by` and `approved_at` only on real approvals.

#### H3 — Race: one unassigned ticket can be assigned to two participants
* **Where:** `gala-landing/src/lib/payments/fulfill.ts:113-133` runs `SELECT … WHERE participant_id IS NULL LIMIT 1` and then an `UPDATE` with no row lock. Django `assign_ticket` (`gala_event/tickets/views.py:255-301`) also has no lock or transaction.
* **What:** Two webhooks, or a webhook plus a verify poll, for **different** participants at the same time can pick the same row. The second `UPDATE` overwrites `participant_id`, so the first person is emailed a serial that now belongs to someone else. A webhook and a verify call for the **same** participant can also both run and send the ticket email twice.
* **Fix:** `SELECT … FOR UPDATE SKIP LOCKED` (Drizzle: `.for('update', { skipLocked: true })`), or a single `UPDATE tickets_ticket SET participant_id=$1 … WHERE id = (SELECT id … FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`. Make fulfilment idempotent: inside the transaction, `UPDATE payments SET status='succeeded' WHERE id=$1 AND status<>'succeeded' RETURNING`, and stop if nothing was updated. In Django, use `transaction.atomic()` + `select_for_update()`.

#### H4 — Check-in and scan history are unreachable (event-night blocker) **[reproduced]**
* **Where:** `gala_event/tickets/urls.py`. `path('', include(router.urls))` comes **before** `tickets/checkin/` and `tickets/scan-history/`, so the router's detail route `tickets/<pk>/` matches first.
* **What:** `resolve('/api/tickets/checkin/')` resolves to `TicketViewSet` with `pk='checkin'`. A POST by an HR admin returned **405**, and `/api/tickets/scan-history/` returns 404. The dashboard check-in page (`gala-dashboard/src/app/dashboard/checkin/page.tsx:44,97`) is therefore broken. The dashboard's cancel button calls `/api/tickets/tickets/{id}/cancel_ticket/` (`gala-dashboard/src/app/dashboard/tickets/page.tsx:145`), which does not exist (the real path is `/api/tickets/{id}/cancel_ticket/`).
* **Latent issues that appear once the route is fixed:**
  * `TicketCheckInView` and `TicketScanHistoryView` are only `IsAuthenticated` (`gala_event/tickets/views.py:366,463`). Any participant or company account could check people in or out and read the full scan log.
  * Check-in has no lock, so two scanners can both succeed.
  * Checking in an unassigned ticket saves `checked_in` and **then** crashes on `ticket.participant.full_name` (`:428`).
  * Unassigned tickets are not rejected at all.
* **Fix:** List the explicit paths **before** `include(router.urls)`, or turn them into router actions (`@action(detail=False, methods=['post'], url_path='checkin')`). Use `permission_classes=[IsHRAdmin]` (or a dedicated `IsCheckInStaff` role). Inside `transaction.atomic()`, `select_for_update()` the ticket, require `participant_id` and `participant.status == APPROVED`, then update. Fix the dashboard cancel URL.

#### H5 — Missing migration, so deleting a participant crashes in prod **[reproduced]**
* **Where:** `gala_event/agenda/models.py:49` (`AgendaRegistration.participant`) has no migration. `makemigrations --check` reports `agenda/0005_agendaregistration_participant` (plus a harmless `accounts/0006_alter_customuser_managers`).
* **What:** Deleting a `Participant` (`DELETE /api/participants/view/{id}/`, the dashboard delete button) cascades into `agenda_agendaregistration.participant_id`, a column that doesn't exist in the DB. The probe got a **500**.
* **Fix:** Run `python manage.py makemigrations agenda accounts`, commit the result, and let `build.sh` migrate. Add `python manage.py makemigrations --check --dry-run` to CI or the build.

#### H6 — Insecure `SECRET_KEY` fallback
* **Where:** `gala_event/gala_event/settings.py:24` sets the default `'default-secret-key-for-dev'`.
* **Why it matters:** SimpleJWT signs tokens with `SECRET_KEY`. If the Render env var is ever missing or renamed, the app keeps running on a key that is public in the repo, and anyone can mint an HR admin token.
* **Fix:** `SECRET_KEY = env('SECRET_KEY')` with **no default**, so it fails to boot. Optionally set a separate `SIMPLE_JWT['SIGNING_KEY']`. Rotate the key if there is any doubt about what production used.

#### H7 — Dashboard statistics always show 0 **[reproduced]**
* **Where:**
  * `gala_event/dashboard/views.py:30-31,40,111,175-177` filter on `status='pending'`, `'approved'` and `'rejected'`, but stored values are `PENDING`, `APPROVED` and `REJECTED`. The probe showed `0 0` with 2 pending and 1 approved in the DB.
  * `gala_event/tickets/views.py:177-180` has the same bug in `approved_participants_without_tickets`.
  * `scan_result='check_in'` (`gala_event/dashboard/views.py:45,126`) never matches; the real value is `'valid'`.
  * The check-in activity block uses `scan.scanned_at` and `scan.ticket.ticket_number` (`:133-134`), which don't exist. It would crash as soon as the filter matched anything.
  * `total_events` counts events *created* today (`:33`).
  * `limit` uses `int(...)` without validation (`:94`).
* **Fix:** Use the enums (`Participant.Status.PENDING`, …). Use `scan_result='valid'`, `scan.scan_datetime` and `scan.ticket.serial_number`. Compute the counts with one `aggregate(Count('id', filter=Q(...)))`.

#### H8 — Admin search returns 500 **[reproduced]**
* **Where:**
  * `gala_event/participants/views.py:227-228`: `search_fields`/`ordering_fields` use `user__full_name`, which isn't a DB field.
  * `gala_event/tickets/views.py:40-41`: `participant__full_name` (a Python property) and `issued_date` (doesn't exist).
* **What:** The dashboard sends `?search=` from both list pages (`gala-dashboard/src/app/dashboard/participants/page.tsx:75`, `gala-dashboard/src/app/dashboard/tickets/page.tsx:51`). The probe got a **500** each time.
* **Fix:** Participants: `search_fields = ['first_name','last_name','email','user__first_name','user__last_name','user__email','university','field_of_study','phone']`, and `ordering_fields = ['registered_at','status','last_name']`. Tickets: `['serial_number','participant__first_name','participant__last_name','participant__email']`, with ordering on `issued_at`.

#### H9 — Approval state machine is inconsistent, and no notification is sent
* **Where:**
  * `gala_event/participants/views.py:271-274` and `:387-394`: setting a participant back to **pending** sets `user.is_active=True`, so pending users can log in. In the single-item action it also leaves `approved_by` and `approved_at` set.
  * `gala_event/dashboard/views.py:213-260` (`ParticipantTableView.post`): approve doesn't activate and reject **doesn't deactivate**. A rejected participant who had an active account can still log in.
  * `approve_reject` (`:255-276`) is not atomic and has no lock.
  * Nothing sends the "approved" / "rejected" email that `next_steps` promises.
  * `EmailTemplate` types exist, but nothing uses them except `payment_confirmation`.
* **Fix:** Put the transitions in one service, e.g. `participants/services.py: set_status(participant, new_status, by, reason)`. Make it the only writer of `status`, `is_active`, `approved_by`, `approved_at` and `rejection_reason`, run it inside `atomic()` with `select_for_update()`, and have it queue the matching email. Call it from all three endpoints, and delete the duplicated dashboard action or make it delegate.

#### H10 — Set-password links point at a placeholder domain
* **Where:** `gala_event/gala_event/settings.py:247` (`FRONTEND_URL = 'https://your-frontend-url.com'`), used at `gala_event/tickets/payment_handlers.py:82`.
* **Why it matters:** The only safe password flow (the token flow) cannot be completed, which is probably why the unsafe email flow (C1) exists.
* **Fix:** `FRONTEND_URL = env('FRONTEND_URL')`, pointing at the page or app link that handles `/set-password/{uid}/{token}/`. Also fix the "expires in 24 hours" wording (`gala_event/templates/emails/set_password.txt:10`). Django's default `PASSWORD_RESET_TIMEOUT` is 3 days, so either set it or change the text.

### 🟡 MEDIUM

| ID | Where | What / why | Fix |
|---|---|---|---|
| M1 | `gala_event/participants/serializers.py:94-100`, `gala_event/accounts/serializers.py:38`, `gala_event/accounts/views.py:335` | The duplicate-email check is **case-sensitive** (`email=value`), but login and set-password use `email__iexact` with `.get()`. `Alice@x.com` and `alice@x.com` both register, and after that **login returns 500** (`MultipleObjectsReturned`) **[reproduced]** | Lower-case and strip emails in `validate_email` and in `CustomUserManager.create_user`. Check with `email__iexact`. Add a functional unique constraint `UniqueConstraint(Lower('email'), name='uniq_user_email_ci')`. Clean up existing duplicates first |
| M2 | `gala_event/participants/views.py:149-171` | A concurrent duplicate registration raises `IntegrityError` and returns a **500** with `"details": str(e)` (leaks the DB error). Any `DataError` (see M3) does the same | Catch `IntegrityError` and return `400 {"email": ["This email is already registered."]}`. Log other exceptions and return a generic error without `str(e)` |
| M3 | `gala_event/participants/serializers.py:13-90` vs `gala_event/participants/models.py:42-61` | Serializer `CharField`s have no `max_length`, but the model has `phone` 20, `graduation_year_other` 50, names 150 and `*_other` 255. On Postgres an overlong value is a `DataError` and a **500** instead of a field error. A phone like `+213 555 12 34 56 / 0666…` is realistic. Long `TextField`s are unbounded too | Add `max_length` to each serializer field matching the model, and cap the text answers (e.g. 2000). Validate `phone` with a regex |
| M4 | `gala_event/notifications/views.py:43-47` + `gala_event/notifications/serializers.py:84-92` | `NotificationViewSet` is a full `ModelViewSet` for any authenticated user, with a writable `recipient`. A participant or company can **create fake notifications for HR admins** ("payment received", "system alert") **[reproduced, 201]** | Make it `ReadOnlyModelViewSet` + `mark_read`/`mark_all_read`. Set `recipient` server-side from `request.user` only |
| M5 | `gala_event/participants/views.py:572-591` + `gala_event/participants/serializers.py:252-256` | `FeedbackView` is `AllowAny` with a writable `participant` id. Anyone can post feedback **as any participant**, with no rate limit **[reproduced, 201]** | Require `IsParticipant` and set `participant=request.user.participant_profile`. Add a throttle |
| M6 | `gala_event/companies/views.py:61-81` | Company creation does `get_or_create(email__iexact=email)` and then **overwrites the password and changes the role to Company** for an existing user. Using a participant's (or an HR admin's) email silently converts that account and resets its password **[reproduced]**. It also does this before the "already has a company profile" check. An empty email creates or reuses a user with `email=''`, and the creation steps are not atomic | Require a unique new email. If a user with that email exists, return 400. Run everything in `transaction.atomic()` through a serializer (`CompanySerializer` should not expose writable `user`, see `gala_event/companies/serializers.py:9,20-29`) |
| M7 | `gala_event/accounts/serializers.py:131` | `CompanyProfileSerializer.name` uses `source='user.name'`, which doesn't exist, so `GET /api/companies/profile/` **always returns 500** **[reproduced]** | Remove the field override (`name` is a field on `Company`) |
| M8 | `gala_event/companies/views.py:252-341`, `gala_event/participants/views.py:865-938` | Any company or participant can "link" **any** participant ID and receive their email, university and field. There is no consent, approval or check-in requirement, and self-links are allowed. These views also crash with a 500 if the participant profile is missing (`request.user.participant_profile` without a guard) | Accept only IDs from a scanned QR containing a signed token, or require the target to be APPROVED and checked in. Decide whether companies should see emails (consent). Handle a missing profile with a 404 |
| M9 | `gala_event/tickets/models.py:9`, `gala-landing/src/app/api/tickets/download/route.ts` | The ticket serial is `GT{year}` + 32 random bits, and the QR contains only name, email and serial. Check-in trusts the serial alone. Combined with H1 and the unthrottled public `tickets/verify`, tickets are clonable | Make the serial longer (`token_hex(8)`), or put a signed payload in the QR (HMAC of serial). Rate-limit the verification endpoint |
| M10 | `gala_event/tickets/payment_handlers.py:112-116` + `gala_event/notifications/serializers.py` | `EmailLog` stores the full HTML body including the **password-reset link**, readable through `/api/notifications/email-logs/`. Any HR user could use a link before the participant does | Don't store bodies that contain tokens (store the template and a redacted body). Invalidate tokens after use; Django does this automatically once the password changes |
| M11 | `gala-landing/src/app/api/webhook/route.ts:50-66` | `checkout.failed` sets `payment_status='failed'` on the participant **even if they already paid** through another checkout | Only downgrade when `paymentStatus !== 'paid'`, and track status per payment or checkout |
| M12 | `gala-landing/src/app/api/payments/verify/route.ts:73` | Verification only scans the **last 10 checkouts** account-wide. Under load, a paid participant won't be found (the webhook is the only safety net) | Store `chargily_checkout_id` on the payment row at creation (currently only `updatedAt` is written, `payments/[id]/route.ts:132-139`) and fetch `GET /checkouts/{id}` |
| M13 | `gala-landing/src/app/api/payments/[id]/route.ts:88` | `origin` falls back to the request `Origin` header to build `success_url`/`failure_url`/`webhook_endpoint` | Always use `NEXT_PUBLIC_APP_URL`/`WEBHOOK_URL` from env, and fail if they are missing |
| M14 | `gala_event/gala_event/settings.py` (REST_FRAMEWORK) | **No throttling anywhere**: login brute force, registration spam (no CAPTCHA), set-password, feedback, ticket verify. All landing registrations arrive from Vercel's IP through the proxy, so IP-based limits need `NUM_PROXIES`/X-Forwarded-For handling | `DEFAULT_THROTTLE_CLASSES` + `ScopedRateThrottle` (`login: 10/min`, `register: 20/hour`, …), using a cache that exists on Render (see L7). Consider Turnstile or hCaptcha on the register form |
| M15 | `gala_event/participants/models.py:42-44` | `Participant.first_name`, `last_name` and `email` **duplicate** the `User` fields, and nothing keeps them in sync. Different screens read different copies (`full_name` uses the user, the dashboard activity feed and the landing app use the participant). `Participant.email` is not unique or indexed, and the landing app looks participants up by it | Pick one source of truth (the user), or sync both in a single service. Add `db_index=True` on `Participant.email` |
| M16 | `gala_event/gala_event/settings.py:222` | 30-day access tokens. Logout only blacklists the refresh token, so a stolen access token stays valid for a month | Access 15–60 min, refresh about 7–14 days, keeping rotation and blacklist |
| M17 | `gala_event/tickets/views.py:33-60` | **N+1**: `TicketViewSet` has no `select_related`, and `TicketSerializer` reads `participant.full_name` → `participant.user` → `checked_in_by`. With the dashboard's `page_size=1000` that is about 2–3k queries per page. `ParticipantViewSet` misses `approved_by` (`gala_event/participants/views.py:219`) | `Ticket.objects.select_related('participant__user','checked_in_by')`, and add `'approved_by'` to the participant queryset. Lower `max_page_size` |
| M18 | `gala-landing/src/lib/mail.ts:11-12` | Hard-coded **Mailtrap SMTP credentials** committed to the repo as fallbacks (sandbox, but still secrets in git) | Remove the fallbacks, rotate those credentials, and require env vars |
| M19 | `gala_event/gala_event/.env` (local, git-ignored) | The local `.env` points to the **production Neon database**. Running `migrate`, tests or experiments locally changes production data | Use a local Postgres or SQLite for development, and keep prod credentials only in Render and Vercel |

### 🟢 LOW

* **L1 — Registration contract gaps** (details in §3): `current_year` is silently dropped; `*_other` isn't required when "OTHER" is chosen; guests (`participant_type=G`) must still give student fields; `graduation_year` is a fixed 2023–2028 list.
* **L2** `gala_event/participants/views.py:94-98,128-131,711-715,811-815,859-863`, `gala_event/companies/views.py:98-101,140-147`, `gala_event/tickets/views.py:327-334`: `str(e)` is returned to clients. Return generic messages and log the exception.
* **L3** `gala_event/tickets/views.py:449,481,428`: `participant.full_name` on unassigned tickets causes `AttributeError` and a 500 (verify, scan history, check-in) **[reproduced on verify]**. `Ticket.__str__` (`gala_event/tickets/models.py:44`) also crashes for unassigned tickets in the admin and in logs.
* **L4** `gala_event/tickets/models.py:57-63`: `mark_as_assigned` writes `checked_in_by`, which is the wrong field.
* **L5** `gala_event/participants/views.py:173-206`: `IsHRAdmin`, `IsParticipant` and `IsOwnerOrHRAdmin` are **redefined**, shadowing the imported ones. Keep a single definition in `gala_event/accounts/permissions.py`.
* **L6** `gala_event/participants/views.py:718-815`: `get_participant_images` and `delete_image` have HR branches that can never run (`IsParticipant` is required), and `delete_image` returns a body with a 204. `upload_image` builds the Cloudinary `public_id` from the user's filename and checks the 5-image limit without a lock.
* **L7** `gala_event/gala_event/settings.py:230-255`: Celery and a Redis cache are configured with `localhost` defaults, but nothing uses them. Any future cache or throttle will break on Render without Redis. Use `LocMemCache`/`DatabaseCache`, or provision Redis.
* **L8** `gala_event/gala_event/settings.py:29-30`: `print()` of the env path at import. There is no `LOGGING` config, so the `logger.info` calls go nowhere. Debug `print`s also sit in `gala_event/companies/views.py:304-315`. The login view logs the submitted email (`gala_event/accounts/views.py:71`).
* **L9** `gala_event/gala_event/urls.py:41-43`: Swagger/ReDoc are public in production and map the whole API. Hide them unless `DEBUG`, or require staff. Also, `/admin/` only registers `CustomUser`.
* **L10** `gala_event/accounts/serializers.py:51-53`: when `authenticate()` fails, the login falls back to `check_password()`. This bypasses auth backends and signals and gives a timing difference for unknown emails. Rely on `authenticate()` alone.
* **L11** `gala_event/agenda/serializers.py:34`: on PATCH, the start/end validation ignores the instance's existing value. `?start_date=` with a bad format causes a 500.
* **L12** `gala_event/participants/models.py:11-16`: the docstring says "18-digit" but the ID is 10 digits. Generating it with check-then-insert is racy (vanishingly rare).
* **L13** `gala_event/requirements.txt` and `gala_event/schema.sql` are **UTF-16** encoded. pip copes through the BOM, but other tools don't. requirements also has dev-only packages (`black`, `django-erd`, `mypy_extensions`, `click-*`). `schema.sql` is actually `inspectdb` Python output, is tracked even though `.gitignore` lists it, and leaks a local path. Convert to UTF-8 and delete `schema.sql`.
* **L14** `gala_event/gala_event/settings.py:79`: `DEFAULT_FILE_STORAGE` is ignored in Django 5.x (`STORAGES` is used). Remove it.
* **L15** `gala_app/lib`: the Flutter app calls endpoints that no longer exist (`/tickets/me`, `/participants/upload-cv/`, `/participants/$id/cv/`), and the agenda uses a mockapi.io base URL.
* **L16** `gala-landing/src/app/api/inngest/route.ts`, `gala-landing/src/lib/inngest/functions.ts:9`: the `helloWorld` function always throws. Make sure `INNGEST_SIGNING_KEY` is set in Vercel so the serve endpoint rejects unsigned calls.
* **L17** The `payments` table lives in the Django DB but isn't modelled in Django. A future `migrate`/`flush`, or the admin, won't know about it. Model it as an unmanaged model, or document it.

### 💡 Suggestions

1. **One source of business rules.** Move payment fulfilment into Django (a `/api/payments/webhook/` with Chargily signature verification) and let the landing app only proxy. If that's too much before the event, at least make the landing code call a Django internal endpoint instead of writing tables directly.
2. **Tests for the money and identity paths:** registration (happy path, duplicate, case variants, lengths), approval transitions, set-password, fulfilment idempotency, check-in double-scan. The probe script used for this audit is a ready-made starting point.
3. **CI:** run `manage.py check --deploy`, `makemigrations --check`, and `pytest`.
4. **Audit trail:** `TicketScan` exists. Add similar records for approval changes (who, when, from what to what).
5. **Indexes:** `Participant(status)`, `Participant(payment_status)`, `Participant(registered_at)`, `Participant(email)`, `Ticket(status)`.
6. **Dead code to remove:** `gala_event/accounts/views.py` `ParticipantProfileView`/`ParticipantProfileUpdateView` (not routed; their serializer also drops `last_name` updates, `gala_event/accounts/serializers.py:110-111`) and `get_csrf_token`; `ParticipantDetailView` (not routed, creates rows on GET); `ParticipantCreateSerializer` (`source='user.phone'` doesn't exist); `is_approved`/`is_paid` fields that never render; `DashboardParticipantSerializer.get_approved_by_name` (never called); the commented payment and QR views; the Celery `debug_task`.

---

## 3. Contract check: landing `/register` → `POST /api/participants/register/`

Payload built in `gala-landing/src/app/register/page.tsx:186-226`, sent through the Next proxy `gala-landing/src/app/api/participants/register/route.ts`. Validated by `ParticipantRegistrationSerializer` (`gala_event/participants/serializers.py:7-137`). The happy path returns **201** **[reproduced]**.

| Field | Landing sends | Backend | Status |
|---|---|---|---|
| `email` | zod `.email()` | `EmailField`, case-**sensitive** duplicate check | ⚠ M1 (case duplicates → login 500), M2 (race → 500 not `{email:[…]}`) |
| `first_name`, `last_name` | min 1 | `CharField`, no max | ⚠ M3 (>150 → 500 on Postgres) |
| `phone` | min 1 | `CharField`, no max / format | ⚠ M3 (>20 chars → 500 on Postgres) |
| `participant_type` | `ST`/`G` | `ChoiceField` same | ✅ (but guests still need the student fields, L1) |
| `university` (+`_other`) | enum + optional | same enum; `_other` optional | ✅ values match. ⚠ "OTHER" with blank `_other` accepted on both sides |
| `field_of_study` (+`_other`) | 16 values | same 16 | ✅ |
| `academic_level` (+`_other`) | incl. `Bachelor’s Degree` (U+2019) | identical strings | ✅ verified with the curly apostrophe |
| `graduation_year` (+`_other`) | 2023–2028/OTHER | same | ✅ (`_other` max 50 in DB, unvalidated) |
| `current_year` | `1`–`5`/`GRADUATED` | **not declared anywhere** | ❌ **silently discarded**: no model field, no error |
| `plans_next_year`, `perspective_gala`, `benefit_from_event` | required | required `CharField` | ✅ |
| `personal_description`, `additional_comments` | optional | optional | ✅ |
| `attended_before` | boolean, default false | required `BooleanField` | ✅ |
| `heard_about` (+`_other`) | enum | same enum | ✅ |
| `linkedin_url` | not sent | optional `URLField` | ✅ |

**Error shape.** Validation errors come back as DRF field maps, e.g. `{"email": ["This email is already registered."]}`, which the page handles (`:232-240`). Any other field error (`{"phone": [...]}`, `{"university": [...]}`) falls through to the generic "Failed to submit request" message, because the page only reads `email`, `error`, `detail` and `details`. Unexpected server errors return `{"error": "...", "details": "<raw exception>"}` with status 500. The page shows `error` first, which is fine, but `details` leaks internals (M2).

**Recommended contract fixes (backend):**
1. Add `current_year = CharField(max_length=10, blank=True)` to the model and serializer, or ask the landing team to stop sending it.
2. Add `max_length` to every serializer field (M3).
3. Use case-insensitive email uniqueness and return a 400 `{email:[…]}` on the race (M1/M2).
4. In `validate()`, require `*_other` when the main value is `OTHER`.
5. Decide which fields guests actually need.

---

## 4. Deployment readiness (Render)

| Item | State |
|---|---|
| `DEBUG` | ❌ hard-coded True (C4) |
| `SECRET_KEY` | ❌ public default fallback (H6) |
| `ALLOWED_HOSTS` / `CSRF_TRUSTED_ORIGINS` / HTTPS settings | ❌ `*` / unset / unset (C4) |
| Migrations in repo match the models | ❌ 2 missing (H5) |
| `FRONTEND_URL` | ❌ placeholder (H10) |
| CORS | ⚠ env-driven, fine. The `.env` origin has a trailing slash (stripped in code). The localhost regex with credentials is fine for development only |
| Static files | ✅ WhiteNoise + `collectstatic` in `gala_event/build.sh` |
| Media | ✅ Cloudinary (env required, no defaults, so the app fails fast if missing) |
| Start command / Python version | ⚠ not in the repo (no `render.yaml`/`Procfile`/`runtime.txt`). Pin them, e.g. `gunicorn gala_event.wsgi --workers 3` |
| Cache / Celery | ⚠ configured for Redis on localhost, nothing uses them (L7) |
| Logging | ⚠ no `LOGGING` config; `print`s (L8) |
| Tests / CI | ❌ none |

---

## 5. Suggested order of work

1. **Today, all small changes:** C1 (delete the email flow), C2 (read-only serializer fields), C3 (lock or remove the landing mail routes), C4 + H6 (settings), H5 (commit the migrations), H4 (URL order + `IsHRAdmin` on check-in), M18 (remove the hard-coded SMTP credentials and rotate them).
2. **Before payments open:** H1, H2, H3, H10, M11, M12, M13, M14.
3. **Before the event night:** H4 latent items (locking, unassigned tickets), H7, H8, H9, M9.
4. **Then:** the remaining medium and low items, tests and CI.
