import { toast } from 'sonner';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
// The landing site (gala-landing) owns payments: payment-link emails are sent by it
export const LANDING_URL = (process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3001').replace(/\/$/, '');

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_display: string;
  role?: string;
  is_hr_admin?: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: number;
  user: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  field_of_study: string;
  field_of_study_other: string;
  university: string;
  university_other: string;
  academic_level: string;
  academic_level_other: string;
  graduation_year: string;
  graduation_year_other: string;
  participant_type: 'ST' | 'G';
  plans_next_year: string;
  personal_description: string;
  perspective_gala: string;
  benefit_from_event: string;
  attended_before: boolean;
  heard_about: string;
  heard_about_other: string;
  additional_comments: string;
  linkedin_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payment_status: 'pending' | 'paid' | 'failed';
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string;
  registered_at: string;
  updated_at: string;
  full_name: string;
  is_approved: boolean;
  is_paid: boolean;
  ticket_serial_number?: string | null;
  ticket_status?: string | null;
  ticket_issued_at?: string | null;
  ticket_email_sent?: boolean | null;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  email: string;
  website: string;
  field: string;
  contact_person: string;
  phone: string;
  address: string;
  logo: string;
  created_at: string;
  updated_at: string;
  user?: number;
}

export interface AgendaItem {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  place: string;
  speakers: Array<{ name: string; title?: string; company?: string; avatar?: string }>;
  duration_minutes: number;
  is_past: boolean;
  is_ongoing: boolean;
  speakers_names: string;
  registrations_count: number | null;
  capacity?: number;
  event_type?: string;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  serial_number: string;
  participant: number | null;
  participant_name: string | null;
  participant_email: string | null;
  status: 'active' | 'assigned' | 'cancelled' | 'checked_in';
  issued_at: string;
  assigned_at: string | null;
  checked_in_at: string | null;
  checked_in_by: number | null;
  checked_in_by_name: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  is_valid: boolean;
  is_assigned: boolean;
}

export interface TicketScan {
  id: number;
  ticket: number;
  serial_number: string;
  participant_name: string;
  scanned_by: number;
  scanned_by_name: string;
  scan_datetime: string;
  scan_location: string | null;
  scan_result: 'valid' | 'invalid' | 'already_assigned' | 'cancelled';
}

export interface EmailLog {
  id: number;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  template_used: number | null;
  template_name: string | null;
  body_html: string | null;
  body_text: string | null;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sent_at: string | null;
  delivery_status: string | null;
  error_message: string | null;
  participant: number | null;
  participant_name: string | null;
  sent_by: number | null;
  sent_by_name: string | null;
  is_delivered: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemNotification {
  id: number;
  recipient: number;
  recipient_name: string;
  notification_type: 'payment_received' | 'ticket_scanned' | 'system_alert';
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  participant: number | null;
  participant_name: string | null;
  created_at: string;
}

// Endpoints used to obtain tokens: never send (possibly stale) tokens to them,
// and never try a token refresh when they answer 401 (wrong password).
const PUBLIC_AUTH_ENDPOINTS = ['/api/accounts/login/', '/api/token/', '/api/token/refresh/', '/api/accounts/set-password/'];

class ApiClient {
  // One refresh at a time: the dashboard fires several requests at once, and
  // the backend rotates + blacklists refresh tokens, so parallel refreshes with
  // the same token would make all but the first one fail and log the user out.
  private refreshInFlight: Promise<string | null> | null = null;
  private sessionEnded = false;

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  private setTokens(access: string, refresh: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
  }

  /** Forget saved tokens (e.g. before a fresh login). */
  clearSession() {
    this.clearTokens();
    this.sessionEnded = false;
  }

  /** The session can't be recovered: forget everything (tokens AND the
   *  `gala_auth_active` cookie the route guard trusts) and go to the login page.
   *  Without clearing the cookie the guard would send /login straight back to
   *  an empty /dashboard. */
  private endSession() {
    this.clearTokens();
    if (typeof window === 'undefined' || this.sessionEnded) return;
    this.sessionEnded = true;
    document.cookie = 'gala_auth_active=; path=/; max-age=0; SameSite=Lax';
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?expired=true';
    }
  }

  /** Get a new access token, sharing a single refresh call between concurrent requests. */
  private refreshAccessToken(): Promise<string | null> {
    if (!this.refreshInFlight) {
      const refresh = this.getRefreshToken();
      this.refreshInFlight = (async () => {
        if (!refresh) return null;
        try {
          const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
          });
          if (!res.ok) return null;
          const tokens = await res.json();
          this.setTokens(tokens.access, tokens.refresh || refresh);
          return tokens.access as string;
        } catch (err) {
          console.error('Failed to refresh token', err);
          return null;
        }
      })().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  private clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Set headers
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const path = endpoint.split('?')[0];
    const isAuthEndpoint = PUBLIC_AUTH_ENDPOINTS.some((p) => path === p || path === p.replace(/\/$/, ''));
    const token = isAuthEndpoint ? null : this.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    let response = await fetch(url, config);

    // Expired / rejected access token: refresh once (shared), then retry
    if (response.status === 401 && !isAuthEndpoint) {
      // Another request may already have refreshed while this one was in flight
      const current = this.getAccessToken();
      const newAccess = current && current !== token ? current : await this.refreshAccessToken();
      if (newAccess) {
        headers.set('Authorization', `Bearer ${newAccess}`);
        response = await fetch(url, { ...config, headers });
      }
      if (response.status === 401) {
        // No valid token and no way to get one: back to the login page
        this.endSession();
      }
    }

    if (!response.ok) {
      let errPayload: any = null;
      try {
        errPayload = await response.json();
      } catch (_) {}

      
      // Prefer the server's own message; a non-JSON answer (e.g. Django's HTML
      // 404 page when the backend doesn't have this endpoint yet) must not
      // turn into the text "null"
      const fieldErrors = errPayload && typeof errPayload === 'object'
        ? Object.entries(errPayload)
            .filter(([, v]) => Array.isArray(v))
            .map(([k, v]) => `${k}: ${(v as unknown[]).join(' ')}`)
            .join(' · ')
        : '';
      const errorMsg =
        errPayload?.detail || errPayload?.error || errPayload?.message || fieldErrors ||
        (response.status === 404
          ? `Server error 404: ${path} does not exist on the backend (is the latest backend deployed?)`
          : `Server error ${response.status}${response.statusText ? ` (${response.statusText})` : ''}`);
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return null as unknown as T;
    }

    return response.json();
  }

  /** POST to the landing site (it owns payments and tickets). It checks our
   *  HR token with the backend, so first make sure the token is fresh (the
   *  backend call refreshes it if needed). */
  async landingPost<T = any>(path: string, body: unknown, { acceptStatuses = [] as number[] } = {}): Promise<T> {
    await this.get('/api/accounts/current_user/');
    let response: Response;
    try {
      response = await fetch(`${LANDING_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getAccessToken()}` },
        body: JSON.stringify(body)
      });
    } catch {
      throw new Error(`Could not reach the landing site at ${LANDING_URL} (is it running / is NEXT_PUBLIC_LANDING_URL right?)`);
    }
    let payload: any = null;
    try {
      payload = await response.json();
    } catch (_) {}
    if (!response.ok && !acceptStatuses.includes(response.status)) {
      throw new Error(payload?.error || payload?.message ||
        (response.status === 404
          ? `The landing site at ${LANDING_URL} has no ${path} route (is the latest landing code running?)`
          : `Landing site error ${response.status}`));
    }
    return payload as T;
  }

  /** Email payment links (landing: /api/payments/send-link). */
  sendPaymentLinks(participantIds: number[]) {
    return this.landingPost<{
      message: string;
      sent: { id: number; email: string; paymentUrl: string }[];
      skipped: { id: number; reason: string; paymentUrl?: string }[];
    }>('/api/payments/send-link', { participantIds }, { acceptStatuses: [422] });
  }

  // HTTP Helper Methods
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      ...options
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
      ...options
    });
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
      ...options
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
