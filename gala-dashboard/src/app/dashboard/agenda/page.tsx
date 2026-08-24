'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { AgendaItem } from '@/lib/apiClient';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Loader2,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AgendaPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [placeFilter, setPlaceFilter] = useState('');
  
  // Modals & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  
  const [agendaForm, setAgendaForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    place: '',
    capacity: 100,
    event_type: 'Keynote',
    speakers_raw: '' // Comma-separated names for quick speakers JSON parsing
  });

  // Query agenda items
  const { data: agendaItems, isLoading } = useQuery<AgendaItem[]>({
    queryKey: ['agenda', placeFilter],
    queryFn: async () => {
      const data: any = await apiClient.get('/api/agenda/');
      const items: AgendaItem[] = Array.isArray(data) ? data : (data?.results || []);
      // Filter locally by place if selected
      if (placeFilter) {
        return items.filter(item => item.place === placeFilter);
      }
      return items;
    }
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['agenda'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => {
      return apiClient.post('/api/agenda/', payload);
    },
    onSuccess: () => {
      toast.success('Agenda session created successfully.');
      setIsModalOpen(false);
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Overlap detected or validation failed.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => {
      return apiClient.put(`/api/agenda/${id}/`, payload);
    },
    onSuccess: () => {
      toast.success('Session updated successfully.');
      setIsModalOpen(false);
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Overlap detected or validation failed.');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.post(`/api/agenda/${id}/cancel_event/`);
    },
    onSuccess: (res: any) => {
      toast.success(res.message || 'Session cancelled.');
      invalidateQueries();
    }
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.post(`/api/agenda/${id}/activate_event/`);
    },
    onSuccess: (res: any) => {
      toast.success(res.message || 'Session activated.');
      invalidateQueries();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.delete(`/api/agenda/${id}/`);
    },
    onSuccess: () => {
      toast.success('Agenda session deleted.');
      invalidateQueries();
    }
  });

  const resetForm = () => {
    setAgendaForm({
      title: '', description: '', start_time: '', end_time: '',
      place: '', capacity: 100, event_type: 'Keynote', speakers_raw: ''
    });
    setEditingItem(null);
  };

  const handleEditClick = (item: AgendaItem) => {
    setEditingItem(item);
    
    // Map speakers list back to string
    const speakersNames = Array.isArray(item.speakers) 
      ? item.speakers.map(s => s.name).join(', ')
      : '';

    // Format ISO datetime to YYYY-MM-DDThh:mm for datetime-local inputs
    const start = item.start_time ? item.start_time.substring(0, 16) : '';
    const end = item.end_time ? item.end_time.substring(0, 16) : '';

    setAgendaForm({
      title: item.title,
      description: item.description || '',
      start_time: start,
      end_time: end,
      place: item.place || '',
      capacity: item.capacity || 100,
      event_type: item.event_type || 'Keynote',
      speakers_raw: speakersNames
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse speakers text
    const speakersList = agendaForm.speakers_raw
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .map(name => ({ name }));

    const payload = {
      title: agendaForm.title,
      description: agendaForm.description,
      start_time: new Date(agendaForm.start_time).toISOString(),
      end_time: new Date(agendaForm.end_time).toISOString(),
      place: agendaForm.place,
      capacity: Number(agendaForm.capacity),
      event_type: agendaForm.event_type,
      speakers: speakersList
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Client side validation warning: overlap in place and time
  const checkOverlaps = () => {
    if (!agendaItems || !agendaForm.start_time || !agendaForm.end_time || !agendaForm.place) return false;
    const currentStart = new Date(agendaForm.start_time).getTime();
    const currentEnd = new Date(agendaForm.end_time).getTime();
    
    return agendaItems.some(item => {
      if (editingItem && item.id === editingItem.id) return false;
      if (item.is_cancelled) return false;
      if (item.place.toLowerCase() !== agendaForm.place.toLowerCase()) return false;
      
      const itemStart = new Date(item.start_time).getTime();
      const itemEnd = new Date(item.end_time).getTime();
      
      return currentStart < itemEnd && currentEnd > itemStart;
    });
  };

  const hasOverlapWarning = checkOverlaps();
  const places = ['Main Hall', 'Conference Room A', 'Ballroom', 'VIP Lounge', 'Terrace'];

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
              Schedule
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F4EFFF] text-[#7A5F9E] border border-[#DDD0F3] text-[10px] font-semibold tracking-wider">
              {agendaItems?.length || 0} Sessions
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
            Agenda Scheduler
          </h1>
          <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
            Build the event agenda timeline, check conflicts, and assign venue spaces.
          </p>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full sm:w-auto">
          <div className="border border-[#EAE3D5] rounded-2xl overflow-hidden flex bg-white p-1 shadow-2xs w-full sm:w-auto justify-center">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px] ${
                viewMode === 'timeline' ? 'bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3]' : 'text-[#6B6862] hover:bg-[#FAF8F5]'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px] ${
                viewMode === 'table' ? 'bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3]' : 'text-[#6B6862] hover:bg-[#FAF8F5]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all shadow-2xs cursor-pointer w-full sm:w-auto shrink-0 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <span className="text-xs font-semibold text-[#6B6862] uppercase tracking-wider">Venue Filters</span>
        <select
          value={placeFilter}
          onChange={(e) => setPlaceFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs font-medium text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
        >
          <option value="">All Venues</option>
          {places.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' ? (
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-white border border-[#EAE3D5] rounded-3xl" />
              ))}
            </div>
          ) : !agendaItems?.length ? (
            <div className="bg-white rounded-3xl border border-[#EAE3D5] p-12 text-center text-[#96928B] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
              <CalendarIcon className="h-10 w-10 text-[#C5A880] mx-auto mb-2 opacity-50" />
              <p className="text-xs">No agenda sessions scheduled for this filter.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-[#EAE3D5] space-y-6 ml-3 py-2">
              {agendaItems.map((item) => (
                <div key={item.id} className="relative bg-white p-7 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] hover:border-[#C8B6E2]/60 hover:shadow-[0_8px_30px_-4px_rgba(200,182,226,0.15)] transition-all group">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[33px] top-8 h-4 w-4 rounded-full border-2 border-[#C5A880] bg-[#FAF8F5] shadow-2xs" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase ${
                          item.is_cancelled ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' : 'bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3]'
                        }`}>
                          {item.is_cancelled ? 'Cancelled' : item.event_type}
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-[#666666]">
                          <Clock className="h-3.5 w-3.5 text-[#C5A880]" />
                          <span>{new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <h3 className={`text-lg font-serif font-semibold ${item.is_cancelled ? 'line-through text-gray-400' : 'text-[#1A1A1A]'}`}>
                        {item.title}
                      </h3>
                      
                      <p className="text-xs text-[#666666] max-w-2xl">{item.description}</p>
                      
                      {item.speakers_names && (
                        <p className="text-[11px] text-[#666666]">
                          Speakers: <strong className="text-[#1A1A1A] font-medium">{item.speakers_names}</strong>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                      <div className="space-y-1.5 text-xs text-[#666666]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#8C8C8C]" />
                          <span>{item.place}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-[#8C8C8C]" />
                          <span>Capacity: {item.capacity || 100}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-2 border border-[#EFE8DC] rounded-xl hover:text-[#C5A880] text-[#8C8C8C] transition-colors inline-block cursor-pointer bg-[#FAF7F2] hover:bg-white"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        
                        {item.is_cancelled ? (
                          <button
                            onClick={() => activateMutation.mutate(item.id)}
                            className="px-3 py-1.5 border border-[#D5E6D8] rounded-xl text-xs font-semibold text-[#2E5A36] bg-[#EBF2EC] hover:bg-emerald-200 transition-colors cursor-pointer"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => cancelMutation.mutate(item.id)}
                            className="px-3 py-1.5 border border-[#F2C2CB] rounded-xl text-xs font-semibold text-[#8B2635] bg-[#F9ECEF] hover:bg-red-200 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        
                        <button
                          onClick={() => { if (confirm('Delete session?')) deleteMutation.mutate(item.id); }}
                          className="p-2 border border-[#EFE8DC] rounded-xl hover:text-[#8B2635] text-[#8C8C8C] transition-colors inline-block cursor-pointer bg-[#FAF7F2] hover:bg-white"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-[#EFE8DC] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EFE8DC] bg-[#FAF7F2]/70 text-[10px] font-semibold uppercase tracking-wider text-[#666666]">
                  <th className="p-4 px-6">Session</th>
                  <th className="p-4 px-6">Venue</th>
                  <th className="p-4 px-6">Time Window</th>
                  <th className="p-4 px-6">Type</th>
                  <th className="p-4 px-6">Status</th>
                  <th className="p-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF7F2]">
                {agendaItems?.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="p-4 px-6 font-medium text-[#1A1A1A]">
                      <div className="font-semibold">{item.title}</div>
                      {item.speakers_names && <div className="text-[10px] text-[#8C8C8C] mt-0.5">Speakers: {item.speakers_names}</div>}
                    </td>
                    <td className="p-4 px-6 text-[#666666]">{item.place}</td>
                    <td className="p-4 px-6 text-[#666666]">
                      {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 px-6 text-[#8C6F45] font-semibold">{item.event_type}</td>
                    <td className="p-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${item.is_cancelled ? 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]' : 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]'}`}>
                        {item.is_cancelled ? 'Cancelled' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 px-6 text-right space-x-1.5">
                      <button onClick={() => handleEditClick(item)} className="p-1 hover:text-[#C5A880] text-[#8C8C8C] cursor-pointer inline-block"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm('Delete session?')) deleteMutation.mutate(item.id); }} className="p-1 hover:text-[#8B2635] text-[#8C8C8C] cursor-pointer inline-block"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col animate-fade-in border border-[#EFE8DC]">
            <div className="p-6 border-b border-[#EFE8DC] bg-[#FAF7F2] flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">Scheduler</span>
                <h3 className="text-lg font-serif font-semibold text-[#1A1A1A] mt-0.5">
                  {editingItem ? `Edit: ${editingItem.title}` : 'Schedule New Session'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={agendaForm.title}
                  onChange={(e) => setAgendaForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Start Datetime</label>
                  <input
                    type="datetime-local"
                    required
                    value={agendaForm.start_time}
                    onChange={(e) => setAgendaForm(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">End Datetime</label>
                  <input
                    type="datetime-local"
                    required
                    value={agendaForm.end_time}
                    onChange={(e) => setAgendaForm(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Venue Location</label>
                  <select
                    value={agendaForm.place}
                    onChange={(e) => setAgendaForm(prev => ({ ...prev, place: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  >
                    <option value="">Select Place</option>
                    {places.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={agendaForm.capacity}
                    onChange={(e) => setAgendaForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Event Category</label>
                <select
                  value={agendaForm.event_type}
                  onChange={(e) => setAgendaForm(prev => ({ ...prev, event_type: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                >
                  <option value="Keynote">Keynote Session</option>
                  <option value="Panel">Panel Discussion</option>
                  <option value="Networking">Networking Lunch</option>
                  <option value="Award">Award Ceremony</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Speakers (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. John Doe, Sarah Jenkins"
                  value={agendaForm.speakers_raw}
                  onChange={(e) => setAgendaForm(prev => ({ ...prev, speakers_raw: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={agendaForm.description}
                  onChange={(e) => setAgendaForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              {/* Conflict Warnings Box */}
              {hasOverlapWarning && (
                <div className="p-3 bg-[#F9ECEF] border border-red-200 rounded-2xl text-[#8B2635] text-xs flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block">Overlap Alert</span>
                    An active session is already scheduled in this venue at the specified time range. Creating this may conflict.
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 border-t border-[#EAE3D5] pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3.5 px-4 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>{editingItem ? 'Save Changes' : 'Schedule Session'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl text-xs font-semibold transition-colors min-h-[44px]"
                >
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
