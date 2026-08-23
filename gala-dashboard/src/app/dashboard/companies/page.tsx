'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { Company } from '@/lib/apiClient';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  X,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  
  // Modals & drawers state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // Form fields
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    email: '',
    website: '',
    field: '',
    contact_person: '',
    phone: '',
    address: '',
    logo: '',
    password: '' // For creating company user accounts
  });

  // Query companies list
  const { data: companiesData, isLoading } = useQuery<Company[] | { count: number; results: Company[] }>({
    queryKey: ['companies', search, fieldFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (fieldFilter) params.append('field', fieldFilter);
      return apiClient.get(`/api/companies/companies/?${params.toString()}`);
    }
  });

  const companies: Company[] = Array.isArray(companiesData)
    ? companiesData
    : (companiesData?.results || []);

  const totalCount = Array.isArray(companiesData)
    ? companiesData.length
    : (companiesData?.count ?? companies.length);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
  };

  // Mutations
  const createCompanyMutation = useMutation({
    mutationFn: (payload: typeof companyForm) => {
      return apiClient.post('/api/companies/companies/', payload);
    },
    onSuccess: () => {
      toast.success('Company sponsor registered successfully.');
      setIsFormModalOpen(false);
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to register company.');
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<typeof companyForm> }) => {
      return apiClient.patch(`/api/companies/companies/${id}/`, payload);
    },
    onSuccess: () => {
      toast.success('Company details updated.');
      setIsFormModalOpen(false);
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update company.');
    }
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: number) => {
      return apiClient.delete(`/api/companies/companies/${id}/`);
    },
    onSuccess: () => {
      toast.success('Company sponsor removed.');
      invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove company.');
    }
  });

  const resetForm = () => {
    setCompanyForm({
      name: '', description: '', email: '', website: '',
      field: '', contact_person: '', phone: '', address: '',
      logo: '', password: ''
    });
    setEditingCompany(null);
  };

  const handleEditClick = (c: Company) => {
    setEditingCompany(c);
    setCompanyForm({
      name: c.name,
      description: c.description || '',
      email: c.email || '',
      website: c.website || '',
      field: c.field || '',
      contact_person: c.contact_person || '',
      phone: c.phone || '',
      address: c.address || '',
      logo: c.logo || '',
      password: '' // Blank during edit
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      // Exclude password if empty during edits
      const { password, ...updatePayload } = companyForm;
      const payload = password ? companyForm : updatePayload;
      updateCompanyMutation.mutate({ id: editingCompany.id, payload });
    } else {
      createCompanyMutation.mutate(companyForm);
    }
  };

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
              Partners
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F4EFFF] text-[#7A5F9E] border border-[#DDD0F3] text-[10px] font-semibold tracking-wider">
              {totalCount} Registered
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
            Exhibitors & Sponsors
          </h1>
          <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
            Manage exhibitor and sponsor profiles, delegate registrations, and partnership coordination.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-5 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#96928B]" />
          <input
            type="text"
            placeholder="Search by company name, website..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs placeholder-[#96928B] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
          />
        </div>

        <div>
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="px-4 py-3 bg-[#FAF8F5] border border-[#EAE3D5] rounded-2xl text-xs font-medium text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C8B6E2]"
          >
            <option value="">All Sectors</option>
            <option value="Technology">Technology</option>
            <option value="Finance">Finance</option>
            <option value="Consulting">Consulting</option>
            <option value="Energy">Energy</option>
            <option value="Industrial">Industrial</option>
          </select>
        </div>
      </div>

      {/* Grid of sponsor cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-white border border-[#EAE3D5] rounded-3xl" />
          ))}
        </div>
      ) : !companies?.length ? (
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-12 text-center text-[#96928B] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)]">
          <Building2 className="h-10 w-10 text-[#C5A880] mx-auto mb-2 opacity-50" />
          <p className="text-xs">No corporate sponsors registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((c) => (
            <div key={c.id} className="bg-white p-7 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between hover:border-[#C8B6E2]/60 hover:shadow-[0_8px_30px_-4px_rgba(200,182,226,0.15)] transition-all relative group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 items-center">
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} className="h-11 w-11 rounded-2xl object-contain bg-[#FAF8F5] border border-[#EAE3D5] p-1.5 shadow-2xs" />
                    ) : (
                      <div className="h-11 w-11 rounded-2xl bg-[#ECE5F8] flex items-center justify-center border border-[#DDD0F3] shadow-2xs">
                        <Building2 className="h-5 w-5 text-[#6E4FA0]" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm text-[#1A1A1A] font-serif">{c.name}</h3>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-semibold text-[#6E4FA0] bg-[#ECE5F8] border border-[#DDD0F3] uppercase tracking-wider">
                        {c.field || 'Sponsor'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEditClick(c)}
                      className="p-1.5 hover:bg-[#FAF7F2] rounded-xl text-[#8C8C8C] hover:text-[#1A1A1A] transition-colors inline-block cursor-pointer"
                      title="Edit details"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remove ${c.name}?`)) deleteCompanyMutation.mutate(c.id); }}
                      className="p-1.5 hover:bg-[#F9ECEF] rounded-xl text-[#8C8C8C] hover:text-[#8B2635] transition-colors inline-block cursor-pointer"
                      title="Remove sponsor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#666666] line-clamp-2">{c.description || 'No description provided.'}</p>
                
                <div className="space-y-2 border-t border-[#EFE8DC]/80 pt-3.5 text-[11px] text-[#666666]">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-[#8C8C8C]" />
                    <span>Contact: <strong className="text-[#1A1A1A] font-medium">{c.contact_person || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[#8C8C8C]" />
                    <span>{c.email}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#8C8C8C]" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#8C8C8C]" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {c.website && (
                <div className="mt-4 pt-3 border-t border-[#EFE8DC]">
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8C6F45] hover:text-[#C5A880] transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5 text-[#C5A880]" />
                    <span>Visit Website</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col animate-fade-in border border-[#EFE8DC]">
            <div className="p-6 border-b border-[#EFE8DC] bg-[#FAF7F2] flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">Corporate Sponsors</span>
                <h3 className="text-lg font-serif font-semibold text-[#1A1A1A] mt-0.5">
                  {editingCompany ? `Edit ${editingCompany.name}` : 'Add Corporate Sponsor'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Sector / Industry</label>
                <input
                  type="text"
                  placeholder="e.g. Technology, Finance, Energy"
                  value={companyForm.field}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, field: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              {!editingCompany && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Account Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={companyForm.password}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Representative Name</label>
                  <input
                    type="text"
                    value={companyForm.contact_person}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Company Website URL</label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Logo Image URL</label>
                <input
                  type="url"
                  placeholder="https://image-host.com/logo.png"
                  value={companyForm.logo}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, logo: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
                {companyForm.logo && (
                  <div className="mt-2 p-2 border border-[#EFE8DC] rounded-xl bg-[#FAF7F2] flex items-center gap-2">
                    <img src={companyForm.logo} alt="Preview" className="h-8 w-8 object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                    <span className="text-[10px] text-[#666666]">Logo preview loaded</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-1">Office Address</label>
                <input
                  type="text"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]"
                />
              </div>

              <div className="flex gap-4 border-t border-[#EAE3D5] pt-4">
                <button
                  type="submit"
                  disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
                  className="flex-1 py-3.5 px-4 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {(createCompanyMutation.isPending || updateCompanyMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>{editingCompany ? 'Save Changes' : 'Register Sponsor'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-3.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-2xl text-xs font-semibold transition-colors"
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
