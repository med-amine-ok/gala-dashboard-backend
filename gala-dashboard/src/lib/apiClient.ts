import { toast } from 'sonner';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_display: string;
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

class ApiClient {
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

    const token = this.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    let response = await fetch(url, config);

    // Handle Token Expiration and Refresh
    if (response.status === 401 && this.getRefreshToken()) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: this.getRefreshToken() })
        });

        if (refreshRes.ok) {
          const tokens = await refreshRes.json();
          this.setTokens(tokens.access, tokens.refresh || this.getRefreshToken());
          
          // Retry original request with new token
          headers.set('Authorization', `Bearer ${tokens.access}`);
          response = await fetch(url, { ...config, headers });
        } else {
          // Refresh token also invalid, force logout
          this.clearTokens();
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
        }
      } catch (err) {
        console.error('Failed to refresh token', err);
      }
    }

    if (!response.ok) {
      let errPayload: any = null;
      try {
        errPayload = await response.json();
      } catch (_) {}
      
      const errorMsg = errPayload?.detail || errPayload?.error || JSON.stringify(errPayload) || 'Request failed';
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return null as unknown as T;
    }

    return response.json();
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
