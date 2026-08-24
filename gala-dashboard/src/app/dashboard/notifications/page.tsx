'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { EmailLog, SystemNotification } from '@/lib/apiClient';
import {
  Mail,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Check,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsLogsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'emails' | 'system'>('emails');
  const [emailSearch, setEmailSearch] = useState('');
  const [emailStatusFilter, setEmailStatusFilter] = useState('');
  const [emailsPage, setEmailsPage] = useState(1);

  // Query email logs
  const { data: emailLogsData, isLoading: emailsLoading, refetch: refetchEmails } = useQuery<{
    count: number;
    results: EmailLog[];
  }>({
    queryKey: ['email-logs', emailsPage, emailSearch, emailStatusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', emailsPage.toString());
      if (emailSearch) params.append('search', emailSearch);
      if (emailStatusFilter) params.append('status', emailStatusFilter);
      return apiClient.get(`/api/notifications/email-logs/?${params.toString()}`);
    },
    enabled: tab === 'emails'
  });

  // Query system notifications
  const { data: systemNotificationsData, isLoading: systemLoading, refetch: refetchSystem } = useQuery<{
    results: SystemNotification[];
  }>({
    queryKey: ['system-notifications'],
    queryFn: () => apiClient.get('/api/notifications/notifications/'),
    enabled: tab === 'system'
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['email-logs'] });
    queryClient.invalidateQueries({ queryKey: ['system-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
  };

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.post(`/api/notifications/notifications/${id}/mark_read/`);
    },
    onSuccess: (res: any) => {
      toast.success(res.message || 'Notification marked as read.');
      invalidateQueries();
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => {
      return apiClient.post('/api/notifications/notifications/mark_all_read/');
    },
    onSuccess: (res: any) => {
      toast.success(res.message || 'All notifications marked as read.');
      invalidateQueries();
    }
  });

  const [detailedEmail, setDetailedEmail] = useState<EmailLog | null>(null);

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
              Communications
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F4EFFF] text-[#7A5F9E] border border-[#DDD0F3] text-[10px] font-semibold tracking-wider">
              Telemetry & Dispatch
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
            Communications & Alerts
          </h1>
          <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
            Review delivery status of ticket emails and in-app system notifications.
          </p>
        </div>
        
        {tab === 'system' && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs w-full sm:w-auto shrink-0 min-h-[44px]"
          >
            <Check className="h-4 w-4 text-[#6E4FA0]" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EAE3D5] overflow-x-auto">
        <button
          onClick={() => setTab('emails')}
          className={`px-4 sm:px-6 py-3.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px] ${
            tab === 'emails' ? 'border-[#6E4FA0] text-[#6E4FA0]' : 'border-transparent text-[#96928B] hover:text-[#1A1A1A]'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Email System Logs</span>
        </button>
        <button
          onClick={() => setTab('system')}
          className={`px-4 sm:px-6 py-3.5 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px] ${
            tab === 'system' ? 'border-[#6E4FA0] text-[#6E4FA0]' : 'border-transparent text-[#96928B] hover:text-[#1A1A1A]'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>System Alerts Queue</span>
        </button>
      </div>

      {/* Tab Content: Email System Logs */}
      {tab === 'emails' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#96928B]" />
              <input
                type="text"
                placeholder="Search recipient email, subject..."
                value={emailSearch}
                onChange={(e) => { setEmailSearch(e.target.value); setEmailsPage(1); }}
                className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs placeholder-[#96928B] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={emailStatusFilter}
                onChange={(e) => { setEmailStatusFilter(e.target.value); setEmailsPage(1); }}
                className="flex-1 md:flex-none px-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs font-medium text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              
              <button
                onClick={() => refetchEmails()}
                className="p-3 border border-[#EAE3D5] rounded-xl hover:bg-[#FAF8F5] text-[#96928B] cursor-pointer shadow-2xs"
                title="Refresh logs"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-[#EAE3D5] overflow-hidden shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAE3D5] bg-[#FAF8F5] text-[10px] font-semibold uppercase tracking-wider text-[#6B6862]">
                    <th className="p-4 px-6">Recipient</th>
                    <th className="p-4 px-6">Subject</th>
                    <th className="p-4 px-6">Template</th>
                    <th className="p-4 px-6">Delivery status</th>
                    <th className="p-4 px-6">Sent At</th>
                    <th className="p-4 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF8F5]">
                  {emailsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="p-4 px-6 h-12 bg-[#FAF7F2]/50" />
                      </tr>
                    ))
                  ) : !emailLogsData?.results?.length ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-[#8C8C8C]">
                        No email logs recorded.
                      </td>
                    </tr>
                  ) : (
                    emailLogsData.results.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="p-4 px-6 font-semibold text-[#1A1A1A]">{log.recipient_email}</td>
                        <td className="p-4 px-6 text-[#666666] max-w-xs truncate">{log.subject}</td>
                        <td className="p-4 px-6 text-[#8C6F45] font-semibold">{log.template_name || 'System Base'}</td>
                        <td className="p-4 px-6">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                            log.status === 'sent' ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' :
                            log.status === 'failed' ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' : 'bg-[#F7F1E6] text-[#8C6F45] border border-[#E5DAC6]'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 px-6 text-[#666666]">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 px-6 text-right">
                          <button
                            onClick={() => setDetailedEmail(log)}
                            className="p-1.5 hover:bg-[#FAF7F2] rounded-xl hover:text-[#C5A880] text-[#8C8C8C] cursor-pointer inline-block transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {emailLogsData && emailLogsData.count > 50 && (
              <div className="px-6 py-4 bg-[#FAF7F2]/70 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#666666]">
                <span>Showing page {emailsPage} of {Math.ceil(emailLogsData.count / 50)}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={emailsPage === 1}
                    onClick={() => setEmailsPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-xl border border-[#E5DAC6] bg-white disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={emailsPage >= Math.ceil(emailLogsData.count / 50)}
                    onClick={() => setEmailsPage(p => p + 1)}
                    className="p-1.5 rounded-xl border border-[#E5DAC6] bg-white disabled:opacity-50 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab Content: System alerts queue */
        <div className="space-y-4">
          {systemLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-white border border-[#EFE8DC] rounded-3xl" />
              ))}
            </div>
          ) : !systemNotificationsData?.results?.length ? (
            <div className="bg-white rounded-3xl border border-[#EFE8DC] p-12 text-center text-[#8C8C8C] shadow-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 text-[#C5A880] opacity-50" />
              <p className="text-xs">No active system alerts in queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {systemNotificationsData.results.map((n) => (
                <div
                  key={n.id}
                  className={`p-5 rounded-3xl border flex items-start justify-between gap-4 transition-all ${
                    n.is_read ? 'bg-white border-[#EFE8DC] opacity-70' : 'bg-[#FAF7F2] border-[#E5DAC6] shadow-sm'
                  }`}
                >
                  <div className="flex gap-3.5">
                    <div className="mt-0.5">
                      {n.notification_type === 'payment_received' && <CheckCircle className="h-5 w-5 text-[#2E5A36]" />}
                      {n.notification_type === 'ticket_scanned' && <Clock className="h-5 w-5 text-[#C5A880]" />}
                      {n.notification_type === 'system_alert' && <AlertCircle className="h-5 w-5 text-[#8B2635]" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#1A1A1A] font-serif">{n.title}</h4>
                      <p className="text-xs text-[#666666] mt-1">{n.message}</p>
                      <span className="text-[9px] text-[#8C8C8C] mt-1 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {!n.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="p-1.5 hover:bg-white rounded-xl text-[#8C8C8C] hover:text-[#1A1A1A] cursor-pointer transition-colors shadow-xs"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4 text-[#C5A880]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Body Detail Modal */}
      {detailedEmail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto flex flex-col animate-fade-in border border-[#EFE8DC]">
            <div className="p-6 border-b border-[#EFE8DC] bg-[#FAF7F2] flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#C5A880] font-semibold">Delivery Log Details</span>
                <h3 className="font-serif text-sm font-semibold text-[#1A1A1A] mt-0.5">{detailedEmail.recipient_email}</h3>
              </div>
              <button onClick={() => setDetailedEmail(null)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-[#FAF7F2] p-4 rounded-2xl border border-[#EFE8DC]">
                <div>
                  <span className="text-[#666666] block text-[10px] uppercase font-semibold">Template Type</span>
                  <span className="font-semibold text-[#1A1A1A] mt-0.5 block">{detailedEmail.template_name || 'Direct'}</span>
                </div>
                <div>
                  <span className="text-[#666666] block text-[10px] uppercase font-semibold">Delivery status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-semibold mt-0.5 ${
                    detailedEmail.status === 'sent' ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' : 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]'
                  }`}>{detailedEmail.status.toUpperCase()}</span>
                </div>
              </div>

              {detailedEmail.error_message && (
                <div className="p-3.5 bg-[#F9ECEF] border border-red-100 rounded-2xl text-[#8B2635] flex gap-1.5 items-start">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Delivery Failure Reason</span>
                    {detailedEmail.error_message}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 border-t border-[#EFE8DC] pt-3">
                <span className="text-[#666666] block text-[10px] uppercase font-semibold">Subject Header</span>
                <div className="p-3 border border-[#EFE8DC] rounded-xl bg-[#FAF7F2] font-medium text-[#1A1A1A]">{detailedEmail.subject}</div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[#666666] block text-[10px] uppercase font-semibold">Body text content</span>
                <div className="p-3.5 border border-[#EFE8DC] rounded-xl bg-[#FAF7F2] max-h-48 overflow-y-auto font-mono text-[10px] text-[#666666] whitespace-pre-wrap">
                  {detailedEmail.body_text || detailedEmail.body_html || 'No body content available.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
