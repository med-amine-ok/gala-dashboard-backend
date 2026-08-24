'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { Ticket, Participant } from '@/lib/apiClient';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import {
  Search,
  Plus,
  Trash2,
  X,
  Loader2,
  Ticket as TicketIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  UserCheck,
  UserPlus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'scanned' | 'assigned' | 'unassigned'>('all');
  
  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<Ticket | null>(null);

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
  const { data: unassignedData, isLoading: isUnassignedLoading } = useQuery<{ tickets: Array<{ serial_number: string }> }>({
    queryKey: ['unassigned-tickets'],
    queryFn: () => apiClient.get('/api/tickets/unassigned_tickets/')
  });

  // Query all participants (to find candidates without tickets)
  const { data: participantsData, isLoading: isParticipantsLoading } = useQuery<{ results: Participant[] }>({
    queryKey: ['participants-candidate-list'],
    queryFn: () => apiClient.get('/api/participants/view/?page_size=1000')
  });

  // Filter candidates: participants who do not have a ticket assigned yet
  const candidateParticipants = React.useMemo(() => {
    return participantsData?.results?.filter(p => !p.ticket_serial_number) || [];
  }, [participantsData]);

  const allTickets = ticketsData?.results || [];
  const unassignedTickets = unassignedData?.tickets || [];

  // Ticket stats calculations
  const totalTicketsCount = allTickets.length;
  const assignedTicketsCount = allTickets.filter(t => t.participant).length;
  const scannedTicketsCount = allTickets.filter(t => t.status === 'checked_in' || t.checked_in_at).length;
  const unassignedCount = unassignedTickets.length;
  const pendingCandidatesCount = candidateParticipants.length;
  const scanRate = assignedTicketsCount > 0 ? Math.round((scannedTicketsCount / assignedTicketsCount) * 100) : 0;

  // Filtered tickets based on active tab & search
  const displayedTickets = React.useMemo(() => {
    return allTickets.filter(ticket => {
      if (activeTab === 'scanned') {
        return ticket.status === 'checked_in' || Boolean(ticket.checked_in_at);
      }
      if (activeTab === 'assigned') {
        return Boolean(ticket.participant) && ticket.status !== 'checked_in';
      }
      if (activeTab === 'unassigned') {
        return !ticket.participant;
      }
      return true;
    });
  }, [allTickets, activeTab]);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['unassigned-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['participants-candidate-list'] });
    queryClient.invalidateQueries({ queryKey: ['participants'] });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EAE3D5]/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
              Ticketing & Telemetry
            </span>
            <span className="px-3 py-1 rounded-full bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8] text-[10px] font-semibold tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-[#2E5A36]" />
              {scannedTicketsCount} Scanned at Gates
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
            Ticket Data & Scanned Passes
          </h1>
          <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
            Live overview of issued tickets, gate scan timestamps, and assigned attendee profiles.
          </p>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full sm:w-auto">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border border-[#EAE3D5] text-[#6E4FA0] hover:bg-[#ECE5F8] hover:border-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs min-h-[42px]"
          >
            <Plus className="h-4 w-4 text-[#6E4FA0]" />
            <span>Generate Pool</span>
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all shadow-2xs cursor-pointer min-h-[42px]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Assign Ticket</span>
          </button>
        </div>
      </div>

      {/* 4-Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Ticket Pool */}
        <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between hover:border-[#C5A880]/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
              <TicketIcon className="h-3.5 w-3.5 text-[#8C6F45]" />
              Total Ticket Pool
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#8C6F45] border border-[#EAE3D5] font-semibold">
              Pool
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A] block">
              {totalTicketsCount}
            </span>
            <p className="text-[11px] text-[#8C8C8C] mt-1 font-mono">
              {unassignedCount} unassigned in pool
            </p>
          </div>
        </div>

        {/* Card 2: Assigned Tickets */}
        <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between hover:border-[#C5A880]/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-[#6E4FA0]" />
              Assigned Passes
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] font-semibold">
              Delegates
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A] block">
              {assignedTicketsCount}
            </span>
            <p className="text-[11px] text-[#8C8C8C] mt-1">
              Issued to verified attendees
            </p>
          </div>
        </div>

        {/* Card 3: Scanned / Checked In */}
        <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between hover:border-[#2E5A36]/60 transition-all bg-gradient-to-br from-white to-[#F2F7F3]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#2E5A36] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#2E5A36]" />
              Scanned / Checked In
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8] font-semibold">
              {scanRate}% Turnout
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-[#2E5A36]">
                {scannedTicketsCount}
              </span>
              <span className="text-xs text-[#6B6862] font-sans font-medium">
                / {assignedTicketsCount} assigned
              </span>
            </div>
            <p className="text-[11px] text-[#2E5A36]/80 mt-1 font-medium">
              Admitted through gate scanners
            </p>
          </div>
        </div>

        {/* Card 4: Pending Candidates */}
        <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between hover:border-[#C5A880]/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#8C6F45]" />
              Awaiting Assignment
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#8C6F45] border border-[#EAE3D5] font-semibold">
              Action
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A] block">
              {pendingCandidatesCount}
            </span>
            <p className="text-[11px] text-[#8C8C8C] mt-1">
              Registered candidates without ticket
            </p>
          </div>
        </div>
      </div>

      {/* Quick View Tabs & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-[#EAE3D5] shadow-2xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#1A1A1A] text-[#FAF7F2] shadow-xs'
                  : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
              }`}
            >
              All Passes ({totalTicketsCount})
            </button>
            <button
              onClick={() => setActiveTab('scanned')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'scanned'
                  ? 'bg-[#2E5A36] text-white shadow-xs'
                  : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Scanned ({scannedTicketsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'assigned'
                  ? 'bg-[#6E4FA0] text-white shadow-xs'
                  : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Assigned ({assignedTicketsCount - scannedTicketsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'unassigned'
                  ? 'bg-[#8C6F45] text-white shadow-xs'
                  : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
              }`}
            >
              Unassigned Pool ({unassignedCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#96928B]" />
            <input
              type="text"
              placeholder="Search serial, participant, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE3D5] rounded-2xl text-xs placeholder-[#96928B] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2] shadow-2xs"
            />
          </div>
        </div>

        {/* Tickets List Table */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] overflow-hidden shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EAE3D5] bg-[#FAF8F5] text-[10px] font-semibold uppercase tracking-wider text-[#6B6862]">
                  <th className="p-4 px-6">Ticket Serial</th>
                  <th className="p-4 px-6">Assigned Attendee</th>
                  <th className="p-4 px-6">Gate Admission / Scan</th>
                  <th className="p-4 px-6">Issued Date</th>
                  <th className="p-4 px-6">Status</th>
                  <th className="p-4 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5]">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="p-4 px-6 h-12 bg-[#FAF7F2]/50" />
                    </tr>
                  ))
                ) : displayedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[#8C8C8C]">
                      <TicketIcon className="h-8 w-8 mx-auto mb-2 text-[#C5A880] opacity-40" />
                      <p className="font-medium text-xs">No tickets match the selected criteria.</p>
                    </td>
                  </tr>
                ) : (
                  displayedTickets.map((t) => {
                    const isScanned = t.status === 'checked_in' || Boolean(t.checked_in_at);

                    return (
                      <tr key={t.id} className="hover:bg-[#F4EFFF]/30 transition-colors">
                        <td className="p-4 px-6 font-semibold font-mono text-[#1A1A1A]">
                          <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#EAE3D5] rounded-xl text-xs font-mono tracking-wider">
                            {t.serial_number}
                          </span>
                        </td>
                        <td className="p-4 px-6">
                          {t.participant_name ? (
                            <div>
                              <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                                <span>{t.participant_name}</span>
                              </div>
                              <div className="text-[10px] text-[#8C8C8C] mt-0.5">{t.participant_email}</div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8C8C8C] italic">Unassigned Pool Pass</span>
                          )}
                        </td>
                        <td className="p-4 px-6">
                          {isScanned ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]">
                                <CheckCircle2 className="h-3 w-3 text-[#2E5A36]" />
                                <span>SCANNED & ADMITTED</span>
                              </span>
                              {t.checked_in_at && (
                                <div className="text-[10px] text-[#666666] font-mono flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5 text-[#8C8C8C]" />
                                  <span>{new Date(t.checked_in_at).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          ) : t.participant ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#FFF8E6] text-[#8C6F45] border border-[#F4DCAC]">
                              <Clock className="h-3 w-3 text-[#8C6F45]" />
                              <span>Awaiting Gate Check-In</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#A0A0A0] font-mono">-</span>
                          )}
                        </td>
                        <td className="p-4 px-6 text-[#666666]">
                          {t.issued_at || t.created_at ? new Date(t.issued_at || t.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 px-6">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-semibold leading-4 tracking-wider uppercase ${
                            isScanned ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' :
                            t.status === 'cancelled' ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' :
                            t.participant ? 'bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3]' :
                            'bg-[#F7F1E6] text-[#8C6F45] border border-[#E5DAC6]'
                          }`}>
                            {isScanned ? 'CHECKED IN' : t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 px-6 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedTicketDetail(t)}
                            className="p-1.5 hover:bg-[#ECE5F8] rounded-xl hover:text-[#6E4FA0] text-[#8C8C8C] transition-colors cursor-pointer inline-block"
                            title="View Ticket QR Code & Attendee Details"
                          >
                            <QrCode className="h-4 w-4 text-[#6E4FA0]" />
                          </button>
                          <button
                            onClick={() => setSelectedTicketDetail(t)}
                            className="p-1.5 hover:bg-[#FAF8F5] rounded-xl hover:text-[#1A1A1A] text-[#8C8C8C] transition-colors cursor-pointer inline-block"
                            title="View Full Pass Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {t.status !== 'cancelled' && (
                            <button
                              onClick={() => { if (confirm('Cancel this ticket pass?')) cancelTicketMutation.mutate(t.id); }}
                              className="p-1.5 hover:bg-[#F9ECEF] rounded-xl hover:text-[#8B2635] text-[#8C8C8C] transition-colors cursor-pointer inline-block"
                              title="Cancel ticket"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ticket & Attendee Details Modal */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full animate-fade-in border border-[#EAE3D5] max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-[#FAF8F5] border-b border-[#EAE3D5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#ECE5F8] border border-[#DDD0F3] flex items-center justify-center text-[#6E4FA0] shadow-2xs">
                  <TicketIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8C6F45] font-semibold block">Pass & QR Code</span>
                  <h3 className="font-serif text-sm font-bold text-[#1A1A1A] font-mono">{selectedTicketDetail.serial_number}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="p-1.5 rounded-xl hover:bg-white text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* QR Code Presentation */}
              <div className="p-5 bg-[#FAF8F5] rounded-3xl border border-[#EAE3D5] text-center">
                <QRCodeDisplay
                  value={selectedTicketDetail.serial_number}
                  size={160}
                  label={`SERIAL: ${selectedTicketDetail.serial_number}`}
                  showActions={true}
                />
              </div>

              {/* Scan Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                selectedTicketDetail.status === 'checked_in' || selectedTicketDetail.checked_in_at
                  ? 'bg-[#EBF2EC] border-[#D5E6D8] text-[#2E5A36]'
                  : 'bg-[#FFF8E6] border-[#F4DCAC] text-[#8C6F45]'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedTicketDetail.status === 'checked_in' || selectedTicketDetail.checked_in_at ? (
                    <CheckCircle2 className="h-5 w-5 text-[#2E5A36] shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-[#8C6F45] shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs">
                      {selectedTicketDetail.status === 'checked_in' || selectedTicketDetail.checked_in_at
                        ? 'Scanned & Admitted at Gate'
                        : 'Awaiting Gate Scanner Check-In'}
                    </h4>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      {selectedTicketDetail.checked_in_at
                        ? `Validated on ${new Date(selectedTicketDetail.checked_in_at).toLocaleString()}`
                        : 'Attendee has not scanned QR code at terminal yet'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendee Profile Info */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE3D5] space-y-2">
                <span className="text-[10px] text-[#8C6F45] uppercase tracking-wider font-semibold block">
                  Assigned Attendee
                </span>
                {selectedTicketDetail.participant_name ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-[#1A1A1A]">
                      {selectedTicketDetail.participant_name}
                    </div>
                    <div className="text-xs text-[#666666] font-mono">
                      {selectedTicketDetail.participant_email}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#8C8C8C] italic">
                    Unassigned Ticket in Pool.
                  </div>
                )}
              </div>

              {/* Technical Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D5]">
                  <span className="text-[10px] text-[#8C8C8C] uppercase font-semibold block">Issued Date</span>
                  <span className="font-semibold text-[#1A1A1A] mt-0.5 block">
                    {selectedTicketDetail.issued_at ? new Date(selectedTicketDetail.issued_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D5]">
                  <span className="text-[10px] text-[#8C8C8C] uppercase font-semibold block">Pass Status</span>
                  <span className="font-semibold text-[#1A1A1A] mt-0.5 block uppercase">
                    {selectedTicketDetail.status}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setSelectedTicketDetail(null)}
                  className="w-full py-3 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl font-semibold transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

            <div className="flex flex-col sm:flex-row gap-3 pt-2 text-xs">
              <button
                onClick={() => generateUnassignedMutation.mutate(generateCount)}
                disabled={generateUnassignedMutation.isPending}
                className="flex-1 py-3.5 px-4 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
              >
                {generateUnassignedMutation.isPending ? 'Generating...' : 'Confirm'}
              </button>
              <button onClick={() => setIsGenerateModalOpen(false)} className="px-5 py-3.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl font-semibold min-h-[44px]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Ticket Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 max-w-md w-full space-y-4 animate-fade-in border border-[#EAE3D5] max-h-[90vh] overflow-y-auto">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">Ticket Assignment</span>
              <h3 className="text-lg font-serif font-semibold text-[#1A1A1A] mt-0.5">
                Assign Ticket & Record Payment
              </h3>
            </div>

            {/* Warning if no pool tickets available */}
            {unassignedTickets.length === 0 && !isUnassignedLoading && (
              <div className="p-3.5 bg-[#FFF8E6] border border-[#F4DCAC] rounded-2xl text-xs text-[#8C6F45] space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-[#8C6F45]" />
                  No unassigned tickets available in pool
                </p>
                <p className="text-[11px]">
                  You must generate unassigned tickets first before assigning one to a participant.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setIsGenerateModalOpen(true);
                  }}
                  className="text-[#6E4FA0] hover:text-[#583C85] underline font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1 pt-1"
                >
                  <span>Generate Pool Tickets Now</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Info if no candidates awaiting ticket */}
            {candidateParticipants.length === 0 && !isParticipantsLoading && (
              <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs text-[#6B6862] space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-[#1A1A1A]">
                  <CheckCircle2 className="h-4 w-4 text-[#2E5A36]" />
                  No candidates awaiting tickets
                </p>
                <p className="text-[11px]">
                  All registered participants currently have a ticket, or no participants exist in the directory.
                </p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignTicketMutation.mutate(assignForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] text-[#666666] font-semibold mb-1 uppercase">
                  Select Participant ({candidateParticipants.length} Available)
                </label>
                <select
                  required
                  disabled={candidateParticipants.length === 0}
                  value={assignForm.participant_id}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, participant_id: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D5] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2] disabled:opacity-50"
                >
                  <option value="">
                    {isParticipantsLoading
                      ? 'Loading participants...'
                      : candidateParticipants.length === 0
                      ? 'No participants awaiting tickets'
                      : 'Choose Participant...'}
                  </option>
                  {candidateParticipants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email} ({p.email || 'No email'}) • [{p.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#666666] font-semibold mb-1 uppercase">
                  Select Pool Ticket ({unassignedTickets.length} Available)
                </label>
                <select
                  required
                  disabled={unassignedTickets.length === 0}
                  value={assignForm.ticket_serial}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, ticket_serial: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D5] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2] disabled:opacity-50"
                >
                  <option value="">
                    {isUnassignedLoading
                      ? 'Loading pool tickets...'
                      : unassignedTickets.length === 0
                      ? 'No tickets in pool (Generate pool first)'
                      : 'Choose Ticket Serial...'}
                  </option>
                  {unassignedTickets.map(t => (
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

              <div className="flex flex-col sm:flex-row gap-3 pt-2 text-xs">
                <button
                  type="submit"
                  disabled={assignTicketMutation.isPending || candidateParticipants.length === 0 || unassignedTickets.length === 0}
                  className="flex-1 py-3.5 px-4 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
                >
                  {assignTicketMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Issue & Confirm Payment</span>
                </button>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-5 py-3.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl font-semibold min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
