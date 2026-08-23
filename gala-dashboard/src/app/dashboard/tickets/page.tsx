'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { Ticket, Participant } from '@/lib/apiClient';
import {
  Search,
  Plus,
  Trash2,
  X,
  Loader2,
  Ticket as TicketIcon,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeTicketQR, setActiveTicketQR] = useState<Ticket | null>(null);

  // Form states
  const [generateCount, setGenerateCount] = useState(10);
  const [assignForm, setAssignForm] = useState({
    participant_id: '',
    ticket_serial: '',
    reference: 'Manual cash payment'
  });

  // Query tickets list
  const { data: ticketsData, isLoading } = useQuery<{ results: Ticket[] }>({
    queryKey: ['tickets', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      return apiClient.get(`/api/tickets/?${params.toString()}`);
    }
  });

  // Query unassigned tickets
  const { data: unassignedData } = useQuery<{ tickets: Array<{ serial_number: string }> }>({
    queryKey: ['unassigned-tickets'],
    queryFn: () => apiClient.get('/api/tickets/unassigned_tickets/')
  });

  // Query approved participants without tickets (candidates for assignment)
  const { data: participantsData } = useQuery<{ results: Participant[] }>({
    queryKey: ['participants-no-tickets'],
    queryFn: () => apiClient.get('/api/participants/view/?status=APPROVED&payment_status=pending')
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['unassigned-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['participants-no-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
  };

  // Mutations
  const generateUnassignedMutation = useMutation({
    mutationFn: (count: number) => {
      return apiClient.post('/api/tickets/generate_unassigned_tickets/', { count });
    },
    onSuccess: (res: any, count: number) => {
      toast.success(res.message || `Pre-generated ${count} unassigned tickets.`);
      setIsGenerateModalOpen(false);
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Generation failed.');
    }
  });

  const assignTicketMutation = useMutation({
    mutationFn: (payload: typeof assignForm) => {
      return apiClient.post('/api/tickets/assign_ticket/', {
        participant_id: Number(payload.participant_id),
        ticket_serial: payload.ticket_serial,
        reference: payload.reference
      });
    },
    onSuccess: (res: any) => {
      toast.success(res.message || 'Ticket assigned & payment confirmed.');
      setIsAssignModalOpen(false);
      setAssignForm({ participant_id: '', ticket_serial: '', reference: 'Manual cash payment' });
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Assignment failed.');
    }
  });

  const cancelTicketMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.post(`/api/tickets/tickets/${id}/cancel_ticket/`);
    },
    onSuccess: () => {
      toast.success('Ticket cancelled.');
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to cancel ticket.');
    }
  });

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
              Ticketing
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F4EFFF] text-[#7A5F9E] border border-[#DDD0F3] text-[10px] font-semibold tracking-wider">
              {ticketsData?.results?.length || 0} Pool Total
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
            Ticket Management
          </h1>
          <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
            Generate ticket serial pools, issue delegate barcodes, and track gate admissions.
          </p>
        </div>
        
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FAF8F5] border border-[#EAE3D5] text-[#6E4FA0] hover:bg-[#ECE5F8] hover:border-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="h-4 w-4 text-[#6E4FA0]" />
            <span>Generate Pool</span>
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Assign Ticket</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-6 bg-white p-6 border border-[#EAE3D5] rounded-3xl shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
        <div className="text-center border-r border-[#EAE3D5]">
          <span className="text-[10px] text-[#6B6862] font-semibold uppercase tracking-widest block">Issued Tickets</span>
          <span className="text-2xl font-serif font-semibold text-[#1A1A1A] mt-1.5 block">
            {ticketsData?.results?.filter(t => t.participant).length || 0}
          </span>
        </div>
        <div className="text-center border-r border-[#EAE3D5]">
          <span className="text-[10px] text-[#6B6862] font-semibold uppercase tracking-widest block">Unassigned Pool</span>
          <span className="text-2xl font-serif font-semibold text-[#8C6F45] mt-1.5 block">
            {unassignedData?.tickets?.length || 0}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-[#6B6862] font-semibold uppercase tracking-widest block">Candidates Pending Ticket</span>
          <span className="text-2xl font-serif font-semibold text-[#6E4FA0] mt-1.5 block">
            {participantsData?.results?.length || 0}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#96928B]" />
          <input
            type="text"
            placeholder="Search serial, email, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs placeholder-[#96928B] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs font-medium text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
          >
            <option value="">All Ticket Statuses</option>
            <option value="active">Active</option>
            <option value="assigned">Assigned</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-3xl border border-[#EAE3D5] overflow-hidden shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAE3D5] bg-[#FAF8F5] text-[10px] font-semibold uppercase tracking-wider text-[#6B6862]">
                <th className="p-4 px-6">Ticket Serial</th>
                <th className="p-4 px-6">Assigned Participant</th>
                <th className="p-4 px-6">Issued At</th>
                <th className="p-4 px-6">Check-In Datetime</th>
                <th className="p-4 px-6">Status</th>
                <th className="p-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF8F5]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-4 px-6 h-12 bg-[#FAF7F2]/50" />
                  </tr>
                ))
              ) : !ticketsData?.results?.length ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#8C8C8C]">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                ticketsData.results.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F4EFFF]/40 transition-colors">
                    <td className="p-4 px-6 font-semibold font-mono text-[#1A1A1A]">{t.serial_number}</td>
                    <td className="p-4 px-6">
                      {t.participant_name ? (
                        <div>
                          <div className="font-semibold text-[#1A1A1A]">{t.participant_name}</div>
                          <div className="text-[10px] text-[#8C8C8C] mt-0.5">{t.participant_email}</div>
                        </div>
                      ) : (
                        <span className="text-[#8C8C8C] italic">Unassigned (Pool)</span>
                      )}
                    </td>
                    <td className="p-4 px-6 text-[#666666]">{new Date(t.issued_at || t.created_at).toLocaleDateString()}</td>
                    <td className="p-4 px-6 text-[#666666]">
                      {t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-4 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-semibold leading-4 tracking-wider uppercase ${
                        t.status === 'checked_in' ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' :
                        t.status === 'cancelled' ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' : 'bg-[#F7F1E6] text-[#8C6F45] border border-[#E5DAC6]'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-right space-x-2">
                      {t.participant && (
                        <button
                          onClick={() => setActiveTicketQR(t)}
                          className="p-1.5 hover:bg-[#FAF7F2] rounded-xl hover:text-[#C5A880] text-[#8C8C8C] transition-colors cursor-pointer inline-block"
                          title="View Barcode / Ticket Badge"
                        >
                          <QrCode className="h-4.5 w-4.5" />
                        </button>
                      )}
                      {t.status !== 'cancelled' && (
                        <button
                          onClick={() => { if (confirm('Cancel this ticket?')) cancelTicketMutation.mutate(t.id); }}
                          className="p-1.5 hover:bg-[#F9ECEF] rounded-xl hover:text-[#8B2635] text-[#8C8C8C] transition-colors cursor-pointer inline-block"
                          title="Cancel ticket"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Unassigned Tickets Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4 border border-[#EFE8DC]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">Pre-Generation</span>
              <h3 className="text-lg font-serif font-semibold text-[#1A1A1A] mt-0.5">
                Generate Pool Tickets
              </h3>
            </div>
            
            <div>
              <label className="block text-[10px] text-[#666666] font-semibold mb-1 uppercase">Count</label>
              <input
                type="number"
                min={1}
                max={200}
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
              />
              <span className="text-[10px] text-[#8C8C8C] mt-1 block">Generates unassigned active tickets into the corporate pool.</span>
            </div>

            <div className="flex gap-3 pt-2 text-xs">
              <button
                onClick={() => generateUnassignedMutation.mutate(generateCount)}
                disabled={generateUnassignedMutation.isPending}
                className="flex-1 py-3.5 px-4 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {generateUnassignedMutation.isPending ? 'Generating...' : 'Confirm'}
              </button>
              <button onClick={() => setIsGenerateModalOpen(false)} className="px-5 py-3.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Ticket Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full space-y-4 animate-fade-in border border-[#EAE3D5]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">Ticket Assignment</span>
              <h3 className="text-lg font-serif font-semibold text-[#1A1A1A] mt-0.5">
                Assign Ticket & Record Payment
              </h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignTicketMutation.mutate(assignForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] text-[#666666] font-semibold mb-1 uppercase">Select Approved Participant</label>
                <select
                  required
                  value={assignForm.participant_id}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, participant_id: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D5] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
                >
                  <option value="">Choose Candidate...</option>
                  {participantsData?.results?.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#666666] font-semibold mb-1 uppercase">Select Available Pool Ticket</label>
                <select
                  required
                  value={assignForm.ticket_serial}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, ticket_serial: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D5] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
                >
                  <option value="">Choose Ticket Serial...</option>
                  {unassignedData?.tickets?.map(t => (
                    <option key={t.serial_number} value={t.serial_number}>{t.serial_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#666666] font-semibold mb-1 uppercase">Payment Reference</label>
                <input
                  type="text"
                  required
                  value={assignForm.reference}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, reference: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D5] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
                />
              </div>

              <div className="flex gap-3 pt-2 text-xs">
                <button
                  type="submit"
                  disabled={assignTicketMutation.isPending}
                  className="flex-1 py-3.5 px-4 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {assignTicketMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Issue & Confirm Payment</span>
                </button>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-5 py-3.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket QR / Badge Viewer */}
      {activeTicketQR && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full animate-fade-in border border-[#EAE3D5]">
            {/* Elegant Ticket Background */}
            <div className="p-6 bg-[#171717] text-white text-center space-y-4 relative border-b border-[#262626]">
              <div className="absolute top-3 right-3 text-[#C5A880] font-serif text-[10px] tracking-widest font-semibold">
                GALA 2026
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#DFC598]/20 to-[#C8B6E2]/20 border border-[#C5A880]/30 flex items-center justify-center mx-auto mt-2">
                <TicketIcon className="h-6 w-6 text-[#C5A880]" />
              </div>
              <div>
                <h3 className="font-serif text-lg tracking-wider font-medium text-[#FAF7F2]">ADMIT ONE</h3>
                <p className="text-[10px] text-[#C5A880] tracking-widest uppercase font-semibold mt-1">Gala Event Access</p>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="p-6 space-y-6 text-center">
              <div>
                <span className="text-[10px] text-[#666666] font-semibold uppercase tracking-wider block">Attendee</span>
                <span className="font-serif text-lg font-semibold text-[#1A1A1A] mt-1 block">{activeTicketQR.participant_name}</span>
                <span className="text-[10px] text-[#8C8C8C] block mt-0.5">{activeTicketQR.participant_email}</span>
              </div>

              {/* Barcode Mockup */}
              <div className="py-4 px-6 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl space-y-2 inline-block mx-auto">
                {/* Barcode lines */}
                <div className="flex items-center justify-center h-12 w-48 gap-0.5 overflow-hidden">
                  {[...Array(24)].map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-[#1A1A1A] h-full shrink-0" 
                      style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1.5 : 0.5) * 2}px` }} 
                    />
                  ))}
                </div>
                <span className="font-mono text-xs tracking-widest text-[#1A1A1A] font-semibold block">{activeTicketQR.serial_number}</span>
              </div>

              <div className="flex gap-3 text-xs justify-center pt-2">
                <button
                  onClick={() => {
                    toast.success('Ticket layout code generated for print.');
                    setActiveTicketQR(null);
                  }}
                  className="px-5 py-3 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  Print Ticket
                </button>
                <button onClick={() => setActiveTicketQR(null)} className="px-5 py-3 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl font-semibold">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
