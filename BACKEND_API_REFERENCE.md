# BACKEND_API_REFERENCE.md
This is the single source of truth for the frontend integration with the GALA Event Management System Django REST Framework backend.

## Authentication Overview
- **Type**: SimpleJWT JSON Web Token & Django Session authentication.
- **Header format**: `Authorization: Bearer <access_token>`
- **Token endpoints**: `/api/token/` (obtain), `/api/token/refresh/` (refresh).

---

## 1. Authentication & Accounts
| Endpoint | Method | Auth | Request Body Shape | Response Body Shape | Notes |
|---|---|---|---|---|---|
| `POST /api/accounts/login/` | POST | Public | `{"email": "string", "password": "string"}` | `{"message": "Login successful", "data": {"id": 1, "email": "admin@example.com", "first_name": "Admin", "last_name": "User", "role": "HR", "role_display": "HR Admin", "access_token": "...", "refresh_token": "..."}}` | Authenticates HR admins, participants, and company accounts. Normalizes email to lowercase. |
| `POST /api/accounts/logout/` | POST | Authenticated | `{"refresh_token": "string"}` | `{"message": "Logout successful"}` | Blacklists the refresh token. |
| `GET /api/accounts/current_user/` | GET | Authenticated | None | `{"user": {"id": 1, "username": "admin@example.com", "email": "admin@example.com", "first_name": "Admin", "last_name": "User", "role_display": "HR Admin", "is_active": true, ...}, "role": "HR", "is_participant": false, "is_hr_admin": true, "is_company": false}` | Returns current user details and role flags. |
| `GET /api/accounts/check_auth/` | GET | Authenticated | None | `{"isAuthenticated": true, "user": {...}}` | Used by frontend middleware to check credentials. |
| `POST /api/accounts/set-password/` | POST | Public | `{"email": "string", "password": "string"}` or `{"uid": "string", "token": "string", "password": "string"}` | `{"success": true, "message": "Password set successfully.", "access_token": "...", "refresh_token": "...", "user": {...}}` | Set password for newly approved participant or via token reset link. |
| `GET /api/accounts/csrf_token/` | GET | Public | None | `{"csrfToken": "string"}` | Returns the CSRF token for session integration. |

---

## 2. Participant Management
| Endpoint | Method | Auth | Request Body Shape | Response Body Shape | Notes |
|---|---|---|---|---|---|
| `GET /api/participants/view/` | GET | HR Admin | None | `{"count": 1000, "next": "url", "previous": "url", "results": [ParticipantSerializer]}` | List all participants. Supports pagination, search (`search=`), filtering (`status`, `payment_status`, `participant_type`). |
| `GET /api/participants/view/{id}/` | GET | HR Admin | None | `ParticipantWithTicketSerializer` | Details of a specific participant including their ticket number, ticket status, and ticket issued date. |
| `DELETE /api/participants/view/{id}/` | DELETE | HR Admin | None | `{"message": "Participant and associated user deleted successfully"}` | Deletes participant profile and associated user. |
| `POST /api/participants/view/{id}/approve_reject/` | POST | HR Admin | `{"action": "approved"\|"rejected"\|"pending", "rejection_reason": "string"}` | `{"message": "Participant approved successfully", "participant_id": 10283, "new_status": "APPROVED", ...}` | Approves, rejects, or resets participant status. |
| `POST /api/participants/view/bulk_approve_reject/` | POST | HR Admin | `{"participant_ids": [10283, ...], "action": "approved"\|"rejected"\|"pending", "rejection_reason": "string"}` | `{"message": "Bulk approved operation completed successfully", "affected_count": 5}` | Bulk approve or reject participants. |
| `GET /api/participants/view/statistics/` | GET | HR Admin | None | Dashboard stats breakdown (total participants, payment statuses, etc.) | High-performance statistics for the main dashboard dashboard. |
| `GET /api/participants/view/pending/` | GET | HR Admin | None | `{"count": 10, "results": [...]}` | Access the queue of pending participant approvals. |
| `GET /api/participants/view/approved/` | GET | HR Admin | None | `{"count": 150, "results": [...]}` | List approved participants. |
| `GET /api/participants/view/rejected/` | GET | HR Admin | None | `{"count": 5, "results": [...]}` | List rejected participants. |
| `POST /api/participants/manual-register/` | POST | HR Admin | `ParticipantRegistrationSerializer` | `{"message": "Participant registered successfully.", "participant_id": ..., "email": ...}` | Registers a participant manually and automatically marks them as Approved. |

---

## 3. Companies Management
| Endpoint | Method | Auth | Request Body Shape | Response Body Shape | Notes |
|---|---|---|---|---|---|
| `GET /api/companies/companies/` | GET | Read-Only | None | `[CompanySerializer]` | Lists all companies. |
| `POST /api/companies/companies/` | POST | HR Admin | `CompanySerializer` | `CompanySerializer` | Creates a company and its linked User credentials. |
| `PUT/PATCH /api/companies/companies/{id}/` | PUT/PATCH| HR Admin | `CompanySerializer` (partial allowed) | `CompanySerializer` | Updates company details. |
| `DELETE /api/companies/companies/{id}/` | DELETE | HR Admin | None | Empty response (204) | Deletes a company profile. |
| `GET /api/companies/companies/statistics/` | GET | HR Admin | None | Company metrics (total count, participant link details, etc.) | Statistics for the companies section of the dashboard. |

---

## 4. Agenda Management
| Endpoint | Method | Auth | Request Body Shape | Response Body Shape | Notes |
|---|---|---|---|---|---|
| `GET /api/agenda/agenda/` | GET | HR Admin | None | `[AgendaSerializer]` | Lists all scheduled agenda items. Filter by `start_date`, `end_date`, and `show_cancelled`. |
| `POST /api/agenda/agenda/` | POST | HR Admin | `AgendaSerializer` | `AgendaSerializer` | Creates a session. Validates overlaps in same venue. |
| `PUT/PATCH /api/agenda/agenda/{id}/` | PUT/PATCH| HR Admin | `AgendaSerializer` | `AgendaSerializer` | Edits session. Validates overlaps. |
| `DELETE /api/agenda/agenda/{id}/` | DELETE | HR Admin | None | Empty response (204) | Deletes a session. |
| `POST /api/agenda/agenda/{id}/cancel_event/` | POST | HR Admin | None | `{"message": "Event 'Session' has been cancelled"}` | Cancels a session. |
| `POST /api/agenda/agenda/{id}/activate_event/` | POST | HR Admin | None | `{"message": "Event 'Session' has been activated"}` | Activates/reactivates a session. |

---

## 5. Tickets & Check-In Station
| Endpoint | Method | Auth | Request Body Shape | Response Body Shape | Notes |
|---|---|---|---|---|---|
| `GET /api/tickets/` | GET | HR Admin | None | `{"count": 100, "results": [TicketSerializer]}` | List tickets. Support filters: `status`, `participant_status`, `checked_in` (true/false). |
| `POST /api/tickets/generate_unassigned_tickets/` | POST | HR Admin | `{"count": 10}` | `{"success": true, "message": "Generated 10 unassigned tickets", "tickets": [...]}` | Pre-generates unassigned tickets for manual distribution. |
| `POST /api/tickets/assign_ticket/` | POST | HR Admin | `{"participant_id": 1234, "ticket_serial": "GT...", "reference": "Manual Payment"}` | `{"success": true, "message": "Ticket assigned...", "data": {...}}` | Assigns an unassigned ticket to a participant and updates their payment status to `paid`. |
| `GET /api/tickets/unassigned_tickets/` | GET | HR Admin | None | `{"success": true, "count": 5, "tickets": [...]}` | Lists all unassigned tickets. |
| `POST /api/tickets/checkin/` | POST | Authenticated | `{"serial_number": "GT...", "action": "check_in"\|"check_out"}` | `{"message": "Successfully checked in", "status": "checked_in", ...}` | Handles check-in scans. Validates state constraints. |
| `GET /api/tickets/scan-history/` | GET | Authenticated | None | `{"scans": [...], "total_scans": 25}` | Fetch logs of ticket scans. |
| `POST /api/payments/manual/` | POST | HR Admin | `{"participant_id": 123, "reference": "string"}` | `{"success": true, "message": "Payment processed..."}` | Simulates payment success, creates ticket, and sends credentials setup email. |

---

## 6. Email / Notifications Logs
| Endpoint | Method | Auth | Request Body Shape | Response Body Shape | Notes |
|---|---|---|---|---|---|
| `GET /api/notifications/email-logs/` | GET | HR Admin | None | `{"count": 50, "results": [EmailLogListSerializer]}` | Exposes logs of emails sent by the system (sent/failed, templates used). |
| `GET /api/notifications/notifications/` | GET | Authenticated | None | `{"count": 5, "results": [NotificationListSerializer]}` | Exposes admin in-app notification logs. |
| `POST /api/notifications/notifications/{id}/mark_read/` | POST | Authenticated | None | `{"message": "Notification marked as read", ...}` | Marks an in-app notification as read. |
| `POST /api/notifications/notifications/mark_all_read/` | POST | Authenticated | None | `{"message": "Successfully marked 5 notifications...", "affected_count": 5}` | Marks all in-app notifications as read. |
