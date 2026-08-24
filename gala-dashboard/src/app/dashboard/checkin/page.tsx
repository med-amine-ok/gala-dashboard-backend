'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { Ticket, TicketScan } from '@/lib/apiClient';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import {
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Eye,
  QrCode,
  Users,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  XCircle,
  X,
  Radio,
  ArrowUpRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';

export default function CheckInLiveAdmissions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'scanned' | 'all' | 'pending' | 'audit'>('scanned');
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<Ticket | null>(null);

  // Auto-polling tickets list every 3 seconds if isLivePolling is true
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery<{ results: Ticket[] }>({
    queryKey: ['tickets-checkin-live'],
    queryFn: () => apiClient.get('/api/tickets/?page_size=1000'),
    refetchInterval: isLivePolling ? 3000 : false
  });

  // Auto-polling scan logs audit trail
  const { data: scanLogData, isLoading: logsLoading, refetch: refetchLogs } = useQuery<{ scans: TicketScan[] }>({
    queryKey: ['scan-history-live'],
    queryFn: () => apiClient.get('/api/tickets/scan-history/'),
    refetchInterval: isLivePolling ? 3000 : false
  });

  const allTickets = ticketsData?.results || [];
  const scanLogs = scanLogData?.scans || [];

  // Scanned / Checked in tickets
  const scannedTickets = allTickets.filter(t => t.status === 'checked_in' || Boolean(t.checked_in_at));
  const assignedTickets = allTickets.filter(t => Boolean(t.participant));
  const pendingArrivalTickets = allTickets.filter(t => Boolean(t.participant) && t.status !== 'checked_in' && !t.checked_in_at);

  const totalAssignedCount = assignedTickets.length;
  const totalScannedCount = scannedTickets.length;
  const totalPendingCount = pendingArrivalTickets.length;
  const turnoutPercentage = totalAssignedCount > 0 ? Math.round((totalScannedCount / totalAssignedCount) * 100) : 0;

  // Filtered tickets based on search & tab
  const filteredTickets = React.useMemo(() => {
    let list = allTickets;
    if (activeTab === 'scanned') {
      list = scannedTickets;
    } else if (activeTab === 'pending') {
      list = pendingArrivalTickets;
    } else if (activeTab === 'all') {
      list = assignedTickets;
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      t =>
        t.serial_number.toLowerCase().includes(q) ||
        (t.participant_name && t.participant_name.toLowerCase().includes(q)) ||
        (t.participant_email && t.participant_email.toLowerCase().includes(q))
    );
  }, [allTickets, scannedTickets, pendingArrivalTickets, assignedTickets, activeTab, search]);

  const filteredLogs = React.useMemo(() => {
    if (!search.trim()) return scanLogs;
    const q = search.toLowerCase();
    return scanLogs.filter(
      l =>
        (l.serial_number && l.serial_number.toLowerCase().includes(q)) ||
        (l.participant_name && l.participant_name.toLowerCase().includes(q)) ||
        (l.scanned_by_name && l.scanned_by_name.toLowerCase().includes(q)) ||
        (l.scanned_by !== undefined && String(l.scanned_by).toLowerCase().includes(q))
    );
  }, [scanLogs, search]);

  // Optional manual checkout mutation if an admin needs to undo a scan
  const checkOutMutation = useMutation({
    mutationFn: (serial: string) => {
      return apiClient.post('/api/tickets/checkin/', {
        serial_number: serial,
        action: 'check_out'
      });
    },
    onSuccess: () => {
      toast.success('Attendee checked out / gate status updated.');
      queryClient.invalidateQueries({ queryKey: ['tickets-checkin-live'] });
      queryClient.invalidateQueries({ queryKey: ['scan-history-live'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Check out failed.');
    }
  });

  const handleRefresh = () => {
    refetchTickets();
    refetchLogs();
    toast.success('Live admissions data synced.');
  };

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EAE3D5]/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
              Live Gate Admissions
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8] text-[10px] font-semibold">
              <span className="relative flex h-2 w-2">
                {isLivePolling && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E5A36] opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E5A36]" />
              </span>
              <span>{isLivePolling ? 'Real-Time Sync Active' : 'Live Sync Paused'}</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
            Gate Scans & Attendance Feed
          </h1>
          <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
            Real-time feed of delegates admitted through scanner gates and mobile terminals.
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full sm:w-auto">
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs min-h-[42px] border ${
              isLivePolling
                ? 'bg-[#FAF8F5] border-[#EAE3D5] text-[#6B6862] hover:bg-[#ECE5F8]'
                : 'bg-[#ECE5F8] border-[#DDD0F3] text-[#6E4FA0]'
            }`}
          >
            <Radio className={`h-4 w-4 ${isLivePolling ? 'text-[#2E5A36]' : 'text-[#6E4FA0]'}`} />
            <span>{isLivePolling ? 'Pause Polling' : 'Resume Live Sync'}</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border border-[#EAE3D5] text-[#1A1A1A] hover:bg-[#FAF8F5]/80 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs min-h-[42px]"
            title="Refresh feed"
          >
            <RefreshCw className="h-4 w-4 text-[#8C6F45]" />
            <span>Sync Feed</span>
          </button>
        </div>
      </div>

      {/* 4-Stat Admission Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Admitted */}
        <div className="bg-gradient-to-br from-white to-[#F2F7F3] p-5 rounded-3xl border border-[#2E5A36]/30 shadow-[0_4px_24px_-4px_rgba(46,90,54,0.06)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#2E5A36] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#2E5A36]" />
              Admitted Delegates
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8] font-bold">
              {turnoutPercentage}% Turnout
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-[#2E5A36]">
                {totalScannedCount}
              </span>
              <span className="text-xs text-[#6B6862] font-medium">
                / {totalAssignedCount} expected
              </span>
            </div>
            <p className="text-[11px] text-[#2E5A36]/80 mt-1 font-medium">
              Verified & admitted at gates
            </p>
          </div>
        </div>

        {/* Card 2: Awaiting Arrival */}
        <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between hover:border-[#8C6F45]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#8C6F45]" />
              Awaiting Gate Arrival
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF8E6] text-[#8C6F45] border border-[#F4DCAC] font-semibold">
              Pending
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A] block">
              {totalPendingCount}
            </span>
            <p className="text-[11px] text-[#8C8C8C] mt-1">
              Registered passes not yet scanned
            </p>
          </div>
        </div>

        {/* Card 3: Total Issued Passes */}
        <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between hover:border-[#6E4FA0]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#6E4FA0]" />
              Total Issued Passes
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] font-semibold">
              Total Roster
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A] block">
              {totalAssignedCount}
            </span>
            <p className="text-[11px] text-[#8C8C8C] mt-1">
              Confirmed attendees in directory
            </p>
          </div>
        </div>

        {/* Card 4: Audit Scan Events */}
        <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between hover:border-[#1A1A1A]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#8C6F45]" />
              Audit Scan Logs
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#8C6F45] border border-[#EAE3D5] font-semibold">
              Telemetry
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif font-bold text-[#1A1A1A] block">
              {scanLogs.length}
            </span>
            <p className="text-[11px] text-[#8C8C8C] mt-1">
              Total gate barcode scan transactions
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Filter Tabs */}
          <div className="flex bg-white p-1 rounded-2xl border border-[#EAE3D5] shadow-2xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('scanned')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'scanned'
                  ? 'bg-[#2E5A36] text-white shadow-xs'
                  : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Scanned & Admitted ({totalScannedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-[#8C6F45] text-white shadow-xs'
                  : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Awaiting Arrival ({totalPendingCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#1A1A1A] text-[#FAF7F2] shadow-xs'
                  : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
              }`}
            >
              All Expected Attendees ({totalAssignedCount})
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-[#6E4FA0] text-white shadow-xs'
                  : 'text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
              }`}
            >
              Scan Logs Feed ({scanLogs.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#96928B]" />
            <input
              type="text"
              placeholder="Search attendee, email, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE3D5] rounded-2xl text-xs placeholder-[#96928B] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2] shadow-2xs"
            />
          </div>
        </div>

        {/* Main Live Table */}
        {activeTab !== 'audit' ? (
          <div className="bg-white rounded-3xl border border-[#EAE3D5] overflow-hidden shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAE3D5] bg-[#FAF8F5] text-[10px] font-semibold uppercase tracking-wider text-[#6B6862]">
                    <th className="p-4 px-6">Attendee Name</th>
                    <th className="p-4 px-6">Ticket Serial</th>
                    <th className="p-4 px-6">Gate Admission Time</th>
                    <th className="p-4 px-6">Gate Status</th>
                    <th className="p-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF8F5]">
                  {ticketsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="p-4 px-6 h-12 bg-[#FAF7F2]/50" />
                      </tr>
                    ))
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[#8C8C8C]">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[#2E5A36] opacity-30" />
                        <p className="font-medium text-xs">
                          {activeTab === 'scanned'
                            ? 'No scanned tickets yet. As attendees arrive and barcodes are scanned, they will immediately appear here.'
                            : 'No tickets match the selected filter.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const isScanned = ticket.status === 'checked_in' || Boolean(ticket.checked_in_at);

                      return (
                        <tr key={ticket.id} className="hover:bg-[#F4EFFF]/30 transition-colors">
                          <td className="p-4 px-6">
                            {ticket.participant_name ? (
                              <div>
                                <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                                  <span>{ticket.participant_name}</span>
                                </div>
                                <div className="text-[10px] text-[#8C8C8C] mt-0.5">{ticket.participant_email}</div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#8C8C8C] italic">Unassigned Pool Pass</span>
                            )}
                          </td>
                          <td className="p-4 px-6">
                            <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#EAE3D5] rounded-xl text-xs font-mono tracking-wider font-semibold text-[#1A1A1A]">
                              {ticket.serial_number}
                            </span>
                          </td>
                          <td className="p-4 px-6 text-[#666666]">
                            {ticket.checked_in_at ? (
                              <div className="space-y-0.5">
                                <div className="font-mono font-medium text-[#1A1A1A]">
                                  {new Date(ticket.checked_in_at).toLocaleTimeString()}
                                </div>
                                <div className="text-[10px] text-[#8C8C8C]">
                                  {new Date(ticket.checked_in_at).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#A0A0A0] italic">Not yet scanned</span>
                            )}
                          </td>
                          <td className="p-4 px-6">
                            {isScanned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8] tracking-wider">
                                <CheckCircle2 className="h-3 w-3 text-[#2E5A36]" />
                                <span>ADMITTED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#FFF8E6] text-[#8C6F45] border border-[#F4DCAC] tracking-wider">
                                <Clock className="h-3 w-3 text-[#8C6F45]" />
                                <span>AWAITING GATE</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 px-6 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedTicketDetail(ticket)}
                              className="p-1.5 hover:bg-[#ECE5F8] rounded-xl hover:text-[#6E4FA0] text-[#8C8C8C] transition-colors cursor-pointer inline-block"
                              title="View Pass QR Code & Attendee Details"
                            >
                              <QrCode className="h-4 w-4 text-[#6E4FA0]" />
                            </button>
                            <button
                              onClick={() => setSelectedTicketDetail(ticket)}
                              className="p-1.5 hover:bg-[#FAF8F5] rounded-xl hover:text-[#1A1A1A] text-[#8C8C8C] transition-colors cursor-pointer inline-block"
                              title="View Pass Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {isScanned && (
                              <button
                                onClick={() => {
                                  if (confirm(`Check out delegate ${ticket.participant_name || ticket.serial_number}?`)) {
                                    checkOutMutation.mutate(ticket.serial_number);
                                  }
                                }}
                                className="p-1.5 hover:bg-[#F9ECEF] rounded-xl hover:text-[#8B2635] text-[#8C8C8C] transition-colors cursor-pointer inline-block text-[10px] font-semibold"
                                title="Check out attendee"
                              >
                                Check Out
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
        ) : (
          /* Audit Log Feed Table */
          <div className="bg-white rounded-3xl border border-[#EAE3D5] overflow-hidden shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAE3D5] bg-[#FAF8F5] text-[10px] font-semibold uppercase tracking-wider text-[#6B6862]">
                    <th className="p-4 px-6">Event ID</th>
                    <th className="p-4 px-6">Attendee</th>
                    <th className="p-4 px-6">Ticket Serial</th>
                    <th className="p-4 px-6">Scan Result</th>
                    <th className="p-4 px-6">Operator</th>
                    <th className="p-4 px-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF8F5]">
                  {logsLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="p-4 px-6 h-12 bg-[#FAF7F2]/50" />
                      </tr>
                    ))
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-[#8C8C8C]">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-[#8C6F45] opacity-30" />
                        <p className="font-medium text-xs">No scan events recorded in the audit log.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="p-4 px-6 font-mono text-[10px] text-[#8C8C8C]">#{log.id}</td>
                        <td className="p-4 px-6 font-semibold text-[#1A1A1A]">
                          {log.participant_name || 'Delegate'}
                        </td>
                        <td className="p-4 px-6 font-mono text-xs text-[#1A1A1A] font-semibold">
                          {log.serial_number}
                        </td>
                        <td className="p-4 px-6">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              log.scan_result === 'valid'
                                ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]'
                                : 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]'
                            }`}
                          >
                            {log.scan_result}
                          </span>
                        </td>
                        <td className="p-4 px-6 text-[#666666]">
                          {log.scanned_by_name || (log.scanned_by !== undefined ? String(log.scanned_by) : 'Gate Terminal')}
                        </td>
                        <td className="p-4 px-6 text-right text-[#666666] font-mono text-[11px]">
                          {new Date(log.scan_datetime).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ticket & QR Code Details Modal */}
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
    </div>
  );
}
