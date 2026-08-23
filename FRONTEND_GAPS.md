# FRONTEND_GAPS.md
This document lists the technical gaps and schema decisions identified during the mandatory Phase 0 backend audit, along with details of how the frontend dashboard resolves them.

## 1. Authentication Token Storage Trade-off
- **Backend implementation**: The login endpoint `/api/accounts/login/` returns the access and refresh tokens directly in the JSON response payload. There is no server-side secure cookie path configured for simpleJWT.
- **Security Trade-off**: Storing the JWT refresh token in `localStorage` exposing it to potential XSS attacks.
- **Frontend Mitigation**: Auth headers are managed in-memory in the API client state. The refresh token is saved in `localStorage` for session persistence. To secure edge endpoints, the frontend synchronizes authentication status to a short-lived `gala_auth_active=true` cookie so that Next.js middleware routing is protected.

## 2. Participant Deletions
- **Backend implementation**: The participant management viewset (`ParticipantViewSet` under `/api/participants/view/`) originally inherited from `ReadOnlyModelViewSet`, meaning no delete endpoint existed.
- **Frontend Mitigation**: We resolved this by directly implementing the `destroy` method on the backend `ParticipantViewSet` class, mapping the `DELETE /api/participants/view/{id}/` endpoint. This deletes both the Participant profile row and its associated CustomUser model safely within an atomic transaction.

## 3. Agenda Overlap Warning
- **Backend implementation**: The backend viewset (`AgendaViewSet`) validates overlaps during session creation and edits but does not have database unique constraint validation.
- **Frontend Mitigation**: When editing or adding sessions, the scheduler form performs a client-side date-overlap scan for the selected location, alerting the administrator *before* they click save with an inline warning box.

## 4. HR Admin Profile password changes
- **Backend implementation**: There is no dedicated endpoint for changing the password of an existing HR Admin account. The password-setting endpoint is restricted to approved participants during their initial onboarding.
- **Frontend Mitigation**: Password updates for administrators must be processed through the standard Django Admin control panel (`/admin/`). We provide a link and info card in the settings view.
