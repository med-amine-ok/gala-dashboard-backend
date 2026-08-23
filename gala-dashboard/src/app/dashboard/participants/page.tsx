'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { Participant } from '@/lib/apiClient';
import {
  Search,
  Filter,
  Check,
  X,
  Trash2,
  Eye,
  Plus,
  Loader2,
  FileDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Linkedin,
  Phone,
  Mail,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

export default function ParticipantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Modals / Drawers State
  const [detailParticipant, setDetailParticipant] = useState<Participant | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [rejectingParticipantId, setRejectingParticipantId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Manual Add Form State
  const [addForm, setAddForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    participant_type: 'ST',
    university: 'ENP',
    university_other: '',
    field_of_study: 'electrical',
    field_of_study_other: '',
    academic_level: 'Bachelor’s Degree',
    academic_level_other: '',
    graduation_year: '2026',
    graduation_year_other: '',
    plans_next_year: 'Continue studying',
    personal_description: '',
    perspective_gala: 'Networking',
    benefit_from_event: 'Career opportunities',
    attended_before: false,
    heard_about: 'LinkedIn',
    heard_about_other: '',
    additional_comments: '',
    linkedin_url: ''
  });

  // Query participants list
  const { data, isLoading } = useQuery<{ count: number; results: Participant[] }>({
    queryKey: ['participants', page, search, statusFilter, typeFilter, paymentFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('participant_type', typeFilter);
      if (paymentFilter) params.append('payment_status', paymentFilter);
      
      return apiClient.get(`/api/participants/view/?${params.toString()}`);
    }
  });

  // Query stats to update dashboard queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['participants'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
  };

  // Mutations
  const approveRejectMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: string; reason?: string }) => {
      return apiClient.post(`/api/participants/view/${id}/approve_reject/`, {
        action,
        rejection_reason: reason || ''
      });
    },
    onSuccess: (res: any) => {
      toast.success(res.message || 'Status updated successfully.');
      setDetailParticipant(null);
      setRejectingParticipantId(null);
      setRejectionReason('');
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Operation failed.');
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ ids, action, reason }: { ids: number[]; action: string; reason?: string }) => {
      return apiClient.post('/api/participants/view/bulk_approve_reject/', {
        participant_ids: ids,
        action,
        rejection_reason: reason || ''
      });
    },
    onSuccess: (res: any) => {
      toast.success(res.message || 'Bulk status updated.');
      setSelectedIds([]);
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Bulk operation failed.');
    }
  });

  const addParticipantMutation = useMutation({
    mutationFn: (payload: typeof addForm) => {
      return apiClient.post('/api/participants/manual-register/', payload);
    },
    onSuccess: () => {
      toast.success('Participant manually registered & approved.');
      setIsAddModalOpen(false);
      // Reset form
      setAddForm({
        email: '', first_name: '', last_name: '', phone: '',
        participant_type: 'ST', university: 'ENP', university_other: '',
        field_of_study: 'electrical', field_of_study_other: '',
        academic_level: 'Bachelor’s Degree', academic_level_other: '',
        graduation_year: '2026', graduation_year_other: '',
        plans_next_year: 'Continue studying', personal_description: '',
        perspective_gala: 'Networking', benefit_from_event: 'Career opportunities',
        attended_before: false, heard_about: 'LinkedIn', heard_about_other: '',
        additional_comments: '', linkedin_url: ''
      });
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Registration failed.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.delete(`/api/participants/view/${id}/`);
    },
    onSuccess: () => {
      toast.success('Participant deleted successfully.');
      setDetailParticipant(null);
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete participant.');
    }
  });

  // Action Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.results) {
      setSelectedIds(data.results.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRejectSubmit = () => {
    if (rejectingParticipantId) {
      if (!rejectionReason.trim()) {
        toast.error('Rejection reason is required.');
        return;
      }
      approveRejectMutation.mutate({
        id: rejectingParticipantId,
        action: 'rejected',
        reason: rejectionReason
      });
    }
  };

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
              Directory
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F4EFFF] text-[#7A5F9E] border border-[#DDD0F3] text-[10px] font-semibold tracking-wider">
              {data?.count || 0} Registrations
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
            Participant Directory
          </h1>
          <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
            Review registration submissions, approve profiles, and manage ticket assignments.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Participant</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#96928B]" />
          <input
            type="text"
            placeholder="Search by name, school, study..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs placeholder-[#96928B] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs font-medium text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs font-medium text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
          >
            <option value="">All Types</option>
            <option value="ST">Student</option>
            <option value="G">Guest</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs font-medium text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#FAF8F5] border border-[#EAE3D5] px-6 py-4 rounded-2xl flex items-center justify-between animate-fade-in shadow-2xs">
          <span className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6E4FA0]" />
            {selectedIds.length} participants selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => bulkActionMutation.mutate({ ids: selectedIds, action: 'approved' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E5A36] text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Approve Selection</span>
            </button>
            <button
              onClick={() => {
                const reason = prompt('Rejection reason (required):');
                if (reason) bulkActionMutation.mutate({ ids: selectedIds, action: 'rejected', reason });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B2635] text-white rounded-xl text-xs font-semibold hover:bg-red-800 transition-colors cursor-pointer shadow-xs"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reject Selection</span>
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-[#EAE3D5] overflow-hidden shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE3D5] bg-[#FAF8F5] text-[10px] font-semibold uppercase tracking-wider text-[#6B6862]">
                <th className="py-4 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={data?.results && selectedIds.length === data.results.length}
                    onChange={handleSelectAll}
                    className="rounded-sm border-[#EAE3D5] text-[#C5A880] focus:ring-[#C5A880]"
                  />
                </th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Affiliation / Study</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Payment</th>
                <th className="py-4 px-6">Registered</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF7F2] text-xs">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-6 h-12 bg-[#FAF7F2]/50" />
                  </tr>
                ))
              ) : !data?.results?.length ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C8C8C]">
                    No participants match your query.
                  </td>
                </tr>
              ) : (
                data.results.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-4 px-6 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleSelectOne(p.id)}
                        className="rounded-sm border-[#E5DAC6] text-[#C5A880] focus:ring-[#C5A880]"
                      />
                    </td>
                    <td className="py-4 px-6 font-medium text-[#1A1A1A]">
                      <div className="font-semibold">{p.full_name}</div>
                      <div className="text-[10px] text-[#8C8C8C] font-normal mt-0.5">{p.email}</div>
                    </td>
                    <td className="py-4 px-6 text-[#666666]">
                      <div className="font-medium text-[#1A1A1A]">{p.university === 'OTHER' ? p.university_other : p.university}</div>
                      <div className="text-[10px] text-[#8C8C8C] mt-0.5">{p.field_of_study === 'OTHER' ? p.field_of_study_other : p.field_of_study}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase bg-[#F4EFFF] text-[#7A5F9E] border border-[#DDD0F3]">
                        {p.participant_type === 'ST' ? 'Student' : 'Guest'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold leading-4 ${
                        p.status === 'APPROVED' ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' :
                        p.status === 'REJECTED' ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' : 'bg-[#F7F1E6] text-[#8C6F45] border border-[#E5DAC6]'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold leading-4 ${
                        p.payment_status === 'paid' ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' :
                        p.payment_status === 'failed' ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' : 'bg-[#F7F1E6] text-[#8C6F45] border border-[#E5DAC6]'
                      }`}>
                        {p.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#666666]">
                      {new Date(p.registered_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setDetailParticipant(p)}
                        className="p-1 hover:text-[#B8964A] text-gray-400 transition-colors inline-block cursor-pointer"
                        title="View profile detail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="p-1 hover:text-[#8B2635] text-gray-400 transition-colors inline-block cursor-pointer"
                        title="Delete registration"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.count > 50 && (
          <div className="px-6 py-4 bg-[#FAF7F2]/80 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#666666]">
            <span>Showing page {page} of {Math.ceil(data.count / 50)}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-[#E5DAC6] bg-white hover:bg-[#FAF7F2] disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= Math.ceil(data.count / 50)}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-xl border border-[#E5DAC6] bg-white hover:bg-[#FAF7F2] disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Participant Detail Drawer */}
      {detailParticipant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-[#EFE8DC] bg-[#FAF7F2] flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">
                  Participant Profile
                </span>
                <h3 className="text-xl font-serif font-semibold text-[#1A1A1A] mt-1">
                  {detailParticipant.full_name}
                </h3>
              </div>
              <button
                onClick={() => setDetailParticipant(null)}
                className="p-2 hover:bg-[#EFE8DC]/50 rounded-full transition-colors text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 flex-1 space-y-6">
              {/* Quick Details Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EFE8DC]">
                  <span className="text-[10px] text-[#666666] font-semibold block uppercase">Status</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    detailParticipant.status === 'APPROVED' ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' :
                    detailParticipant.status === 'REJECTED' ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' : 'bg-[#F7F1E6] text-[#8C6F45] border border-[#E5DAC6]'
                  }`}>
                    {detailParticipant.status}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EFE8DC]">
                  <span className="text-[10px] text-[#666666] font-semibold block uppercase">Payment</span>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    detailParticipant.payment_status === 'paid' ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' :
                    detailParticipant.payment_status === 'failed' ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' : 'bg-[#F7F1E6] text-[#8C6F45] border border-[#E5DAC6]'
                  }`}>
                    {detailParticipant.payment_status.toUpperCase()}
                  </span>
                </div>
                <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EFE8DC]">
                  <span className="text-[10px] text-[#666666] font-semibold block uppercase">Ticket</span>
                  <span className="block mt-1 font-semibold text-xs text-[#1A1A1A]">
                    {detailParticipant.ticket_serial_number || 'None Issued'}
                  </span>
                </div>
              </div>

              {/* Main Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#666666] border-b border-[#EFE8DC] pb-2">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-[#1A1A1A]">
                    <Mail className="h-4 w-4 text-[#8C8C8C]" />
                    <span>{detailParticipant.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#1A1A1A]">
                    <Phone className="h-4 w-4 text-[#8C8C8C]" />
                    <span>{detailParticipant.phone || 'No phone recorded'}</span>
                  </div>
                  {detailParticipant.linkedin_url && (
                    <div className="flex items-center gap-2 text-[#1A1A1A] col-span-2">
                      <Linkedin className="h-4 w-4 text-[#8C8C8C]" />
                      <a href={detailParticipant.linkedin_url} target="_blank" rel="noreferrer" className="text-[#C5A880] hover:underline">
                        {detailParticipant.linkedin_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#666666] border-b border-[#EFE8DC] pb-2">
                  Academic Background
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2 text-[#1A1A1A]">
                    <GraduationCap className="h-4 w-4 text-[#8C8C8C] mt-0.5" />
                    <div>
                      <div className="font-semibold">{detailParticipant.university === 'OTHER' ? detailParticipant.university_other : detailParticipant.university}</div>
                      <div className="text-[10px] text-[#666666]">University / School</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-[#1A1A1A]">
                    <BookOpen className="h-4 w-4 text-[#8C8C8C] mt-0.5" />
                    <div>
                      <div className="font-semibold">{detailParticipant.field_of_study === 'OTHER' ? detailParticipant.field_of_study_other : detailParticipant.field_of_study}</div>
                      <div className="text-[10px] text-[#666666]">Field of Study</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-[#1A1A1A] bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EFE8DC]">
                    <div className="font-semibold text-[10px] text-[#666666] uppercase mb-1">Academic Level & Graduation</div>
                    {detailParticipant.academic_level} (Class of {detailParticipant.graduation_year})
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#666666] border-b border-[#EFE8DC] pb-2">
                  Registration Answers
                </h4>
                <div className="space-y-3 text-xs text-[#1A1A1A]">
                  <div>
                    <div className="font-semibold text-[#1A1A1A]">Why do you want to attend GALA?</div>
                    <div className="mt-1 bg-[#FAF7F2] p-3 rounded-xl border border-[#EFE8DC] text-[#666666] italic">"{detailParticipant.perspective_gala}"</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1A1A1A]">What are your plans next year?</div>
                    <div className="mt-1 bg-[#FAF7F2] p-3 rounded-xl border border-[#EFE8DC] text-[#666666]">"{detailParticipant.plans_next_year}"</div>
                  </div>
                  {detailParticipant.benefit_from_event && (
                    <div>
                      <div className="font-semibold text-[#1A1A1A]">How will you benefit from the event?</div>
                      <div className="mt-1 bg-[#FAF7F2] p-3 rounded-xl border border-[#EFE8DC] text-[#666666] italic">"{detailParticipant.benefit_from_event}"</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action buttons */}
            <div className="p-6 border-t border-[#EFE8DC] bg-[#FAF7F2] flex gap-3">
              {detailParticipant.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => approveRejectMutation.mutate({ id: detailParticipant.id, action: 'approved' })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2E5A36] text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setRejectingParticipantId(detailParticipant.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#8B2635] text-white rounded-xl text-xs font-semibold hover:bg-red-800 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}
              {detailParticipant.status === 'APPROVED' && (
                <div className="text-xs text-[#2E5A36] font-semibold bg-[#EBF2EC] py-2 px-4 rounded-xl flex-1 text-center border border-[#D5E6D8]">
                  Participant stands approved. Credentials setup email triggered.
                </div>
              )}
              {detailParticipant.status === 'REJECTED' && (
                <div className="text-xs text-[#8B2635] font-semibold bg-[#F9ECEF] py-2 px-4 rounded-xl flex-1 text-center border border-[#F1D2D6]">
                  Participant was rejected. Reason: "{detailParticipant.rejection_reason || 'No reason provided'}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col animate-fade-in border border-[#EFE8DC]">
            <div className="p-6 border-b border-[#EFE8DC] bg-[#FAF7F2] flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">HR Control Panel</span>
                <h3 className="text-lg font-serif font-semibold text-[#1A1A1A] mt-0.5">
                  Manual Registration Form
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addParticipantMutation.mutate(addForm);
              }}
              className="p-6 space-y-4 flex-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.first_name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.last_name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={addForm.phone}
                    onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Type</label>
                  <select
                    value={addForm.participant_type}
                    onChange={(e) => setAddForm(prev => ({ ...prev, participant_type: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  >
                    <option value="ST">Student</option>
                    <option value="G">Guest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={addForm.linkedin_url}
                    onChange={(e) => setAddForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#EFE8DC] pt-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">University</label>
                  <select
                    value={addForm.university}
                    onChange={(e) => setAddForm(prev => ({ ...prev, university: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  >
                    <option value="ENP">ENP</option>
                    <option value="ENSTA">ENSTA</option>
                    <option value="USTHB">USTHB</option>
                    <option value="ESAA">ESAA</option>
                    <option value="ENSTP">ENSTP</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                {addForm.university === 'OTHER' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Other School</label>
                    <input
                      type="text"
                      required
                      value={addForm.university_other}
                      onChange={(e) => setAddForm(prev => ({ ...prev, university_other: e.target.value }))}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Study Stream</label>
                  <select
                    value={addForm.field_of_study}
                    onChange={(e) => setAddForm(prev => ({ ...prev, field_of_study: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  >
                    <option value="electrical">electrical</option>
                    <option value="electronics">electronics</option>
                    <option value="datascience_ai">datascience_ai</option>
                    <option value="mechanical">mechanical</option>
                    <option value="chemical">chemical</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                {addForm.field_of_study === 'OTHER' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Other Stream</label>
                    <input
                      type="text"
                      required
                      value={addForm.field_of_study_other}
                      onChange={(e) => setAddForm(prev => ({ ...prev, field_of_study_other: e.target.value }))}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 border-t border-[#EAE3D5] pt-4">
                <button
                  type="submit"
                  disabled={addParticipantMutation.isPending}
                  className="flex-1 py-3.5 px-4 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {addParticipantMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Register & Auto Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal Overlay */}
      {rejectingParticipantId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#EAE3D5]">
            <h3 className="text-md font-semibold text-[#1A1A1A] font-serif">
              Reason for Rejection
            </h3>
            <textarea
              placeholder="Provide a reason for rejection..."
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs placeholder-[#96928B] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={handleRejectSubmit}
                disabled={approveRejectMutation.isPending}
                className="px-4 py-2.5 bg-[#8B2635] text-white rounded-2xl font-semibold hover:bg-red-800 transition-colors cursor-pointer shadow-xs"
              >
                Submit Rejection
              </button>
              <button
                onClick={() => { setRejectingParticipantId(null); setRejectionReason(''); }}
                className="px-4 py-2.5 bg-[#FAF8F5] text-[#6E4FA0] hover:bg-[#ECE5F8] border border-[#EAE3D5] rounded-2xl font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
