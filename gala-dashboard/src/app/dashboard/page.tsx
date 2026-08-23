'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient, { Company, AgendaItem } from '@/lib/apiClient';
import Link from 'next/link';
import {
  Users,
  Building2,
  Calendar,
  Ticket,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  UserCheck,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  ShieldCheck,
  AlertCircle,
  MapPin,
  GraduationCap,
  ArrowUpRight,
  Activity as ActivityIcon,
  ExternalLink,
  ChevronRight,
  Globe,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

// --- Interfaces for Backend Responses ---

interface DashboardOverviewStats {
  quick_stats: {
    total_participants: number;
    pending_participants: number;
    approved_participants: number;
    total_companies: number;
    total_events: number;
    total_tickets: number;
    checked_in_count: number;
  };
  today_metrics: {
    new_registrations: number;
    approvals_made: number;
    checkins_completed: number;
    events_scheduled: number;
  };
  rates: {
    approval_rate_percentage: number;
    checkin_rate_percentage: number;
  };
  last_updated: string;
}

interface ParticipantStats {
  total_participants: number;
  status_breakdown: {
    pending: number;
    approved: number;
    rejected: number;
  };
  payment_breakdown: {
    paid: number;
    pending: number;
    failed: number;
  };
  participant_types: Array<{ participant_type: string; count: number }>;
  university_distribution: Array<{ university: string; count: number }>;
  recent_registrations_7_days: number;
  today_registrations: number;
  approval_rate: number;
  pending_approvals: number;
}

interface TicketStats {
  total_tickets: number;
  status_breakdown: {
    active: number;
    assigned: number;
    checked_in: number;
    cancelled: number;
  };
  checkin_rate_percentage: number;
  recent_checkins_24h: number;
  tickets_issued_today: number;
  approved_participants_without_tickets: number;
  total_scans: number;
}

interface CompanyStats {
  total_companies: number;
  top_companies_by_participants: Array<{
    id?: number;
    name: string;
    field?: string;
    website?: string;
    participant_count: number;
  }>;
  completion_rate: {
    with_website: number;
  };
}

interface AgendaStats {
  total_events: number;
  status_breakdown?: {
    cancelled: number;
    inactive: number;
  };
  event_types?: Array<{ event_type: string; count: number }>;
  today_events?: number;
  popular_places?: Array<{ place: string; count: number }>;
}

interface Activity {
  type: 'registration' | 'approval' | 'checkin' | 'company';
  message: string;
  timestamp: string;
  participant_id?: number;
  company_id?: number;
  status?: string;
  approved_by?: string;
  scanned_by?: string;
  ticket_number?: string;
}

interface ActivityFeed {
  activities: Activity[];
  total_activities: number;
}

// --- Helper Visual Components ---

function CircularProgress({
  value,
  size = 130,
  strokeWidth = 10,
  color = '#B8964A',
  bgColor = '#F3EFE6',
  label,
  sublabel
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold font-mono tracking-tight text-[#1A1A1A]">
          {label ?? `${clampedValue.toFixed(1)}%`}
        </span>
        {sublabel && (
          <span className="text-[10px] uppercase font-semibold text-[#8C827A] tracking-wider mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

// Multi-segment Donut Chart
function MultiSegmentDonut({
  segments,
  size = 140,
  strokeWidth = 12,
  centerLabel,
  centerSub
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
  strokeWidth?: number;
  centerLabel: string | number;
  centerSub: string;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track if empty */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3EFE6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {total > 0 &&
          segments.map((seg, idx) => {
            const segmentPercent = (seg.value / total) * 100;
            const strokeDasharray = `${(segmentPercent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += segmentPercent;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            );
          })}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold font-mono tracking-tight text-[#1A1A1A]">
          {centerLabel}
        </span>
        <span className="text-[10px] font-semibold text-[#8C827A] uppercase tracking-wider">
          {centerSub}
        </span>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  // 1. Core Overview Stats
  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
    isFetching: isFetchingOverview
  } = useQuery<DashboardOverviewStats>({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiClient.get('/api/dashboard/overview/'),
  });

  // 2. Deep Participant Statistics
  const {
    data: participantStats,
    isLoading: partStatsLoading,
    refetch: refetchPartStats
  } = useQuery<ParticipantStats>({
    queryKey: ['participants-statistics'],
    queryFn: () => apiClient.get('/api/participants/view/statistics/'),
  });

  // 3. Ticket Statistics
  const {
    data: ticketStats,
    isLoading: ticketStatsLoading,
    refetch: refetchTicketStats
  } = useQuery<TicketStats>({
    queryKey: ['tickets-statistics'],
    queryFn: () => apiClient.get('/api/tickets/statistics/'),
  });

  // 4. Company Statistics & List
  const {
    data: companyStats,
    refetch: refetchCompanyStats
  } = useQuery<CompanyStats>({
    queryKey: ['companies-statistics'],
    queryFn: () => apiClient.get('/api/companies/companies/statistics/'),
  });

  const {
    data: companiesList,
    refetch: refetchCompaniesList
  } = useQuery<Company[]>({
    queryKey: ['companies-all'],
    queryFn: async () => {
      const data: any = await apiClient.get('/api/companies/companies/');
      return Array.isArray(data) ? data : (data?.results || []);
    }
  });

  // 5. Agenda Statistics & All Agenda Items
  const {
    data: agendaStats,
    refetch: refetchAgendaStats
  } = useQuery<AgendaStats>({
    queryKey: ['agenda-statistics'],
    queryFn: () => apiClient.get('/api/agenda/statistics/'),
  });

  const {
    data: agendaItems,
    refetch: refetchAgendaItems
  } = useQuery<AgendaItem[]>({
    queryKey: ['agenda-items-all'],
    queryFn: async () => {
      const data: any = await apiClient.get('/api/agenda/');
      return Array.isArray(data) ? data : (data?.results || []);
    }
  });

  // 6. Recent Real-Time Activity Feed
  const {
    data: activityData,
    refetch: refetchActivity
  } = useQuery<ActivityFeed>({
    queryKey: ['dashboard-activity'],
    queryFn: () => apiClient.get('/api/dashboard/recent-activity/?limit=8'),
  });

  // Refetch all queries at once
  const handleRefreshAll = () => {
    refetchOverview();
    refetchPartStats();
    refetchTicketStats();
    refetchCompanyStats();
    refetchCompaniesList();
    refetchAgendaStats();
    refetchAgendaItems();
    refetchActivity();
    toast.success('Analytics refreshed with live backend data.');
  };

  const handleExport = async () => {
    try {
      const data = await apiClient.get<any>('/api/dashboard/export/');
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `gala_analytics_summary_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Full dashboard analytics exported as JSON.');
    } catch (err) {
      toast.error('Failed to export analytics data.');
    }
  };

  const isLoading = overviewLoading && partStatsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse p-2">
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 bg-[#EFE8DC] rounded-2xl" />
          <div className="h-10 w-44 bg-[#EFE8DC] rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-white border border-[#EAE3D5] rounded-3xl p-6" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-white border border-[#EAE3D5] rounded-3xl p-6" />
          <div className="h-80 bg-white border border-[#EAE3D5] rounded-3xl p-6" />
          <div className="h-80 bg-white border border-[#EAE3D5] rounded-3xl p-6" />
        </div>
      </div>
    );
  }

  // Extract variables with reliable fallbacks from real data
  const quickStats = overview?.quick_stats;
  const todayMetrics = overview?.today_metrics;
  const rates = overview?.rates;

  const totalParticipants = participantStats?.total_participants ?? quickStats?.total_participants ?? 0;
  const approvedCount = participantStats?.status_breakdown?.approved ?? quickStats?.approved_participants ?? 0;
  const pendingCount = participantStats?.status_breakdown?.pending ?? quickStats?.pending_participants ?? 0;
  const rejectedCount = participantStats?.status_breakdown?.rejected ?? 0;
  const approvalRate = participantStats?.approval_rate ?? rates?.approval_rate_percentage ?? 0;

  const totalTickets = ticketStats?.total_tickets ?? quickStats?.total_tickets ?? 0;
  const checkedInCount = ticketStats?.status_breakdown?.checked_in ?? quickStats?.checked_in_count ?? 0;
  const assignedTickets = ticketStats?.status_breakdown?.assigned ?? 0;
  const activeUnassignedTickets = ticketStats?.status_breakdown?.active ?? 0;
  const cancelledTickets = ticketStats?.status_breakdown?.cancelled ?? 0;
  const checkinRate = ticketStats?.checkin_rate_percentage ?? rates?.checkin_rate_percentage ?? 0;

  const paidParticipants = participantStats?.payment_breakdown?.paid ?? 0;
  const pendingPayments = participantStats?.payment_breakdown?.pending ?? 0;
  const failedPayments = participantStats?.payment_breakdown?.failed ?? 0;

  // Companies data consolidation (from statistics + company list)
  const allCompanies = companiesList || [];
  const totalCompanies = companyStats?.total_companies ?? allCompanies.length ?? quickStats?.total_companies ?? 0;

  // Build top company representations
  let topCompanies = companyStats?.top_companies_by_participants || [];
  if (topCompanies.length === 0 && allCompanies.length > 0) {
    topCompanies = allCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      field: c.field || 'Corporate Partner',
      website: c.website || '',
      participant_count: 0
    }));
  }

  // Agenda data consolidation (from statistics + agenda items list)
  const allAgenda = agendaItems || [];
  const totalEvents = agendaStats?.total_events ?? allAgenda.length ?? quickStats?.total_events ?? 0;

  // Calculate event types breakdown dynamically if not provided
  let eventTypes = agendaStats?.event_types || [];
  if (eventTypes.length === 0 && allAgenda.length > 0) {
    const typeMap: Record<string, number> = {};
    allAgenda.forEach((item) => {
      const t = item.event_type || 'General Session';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    eventTypes = Object.entries(typeMap).map(([event_type, count]) => ({
      event_type,
      count
    }));
  }

  // Calculate popular places dynamically if not provided
  let popularPlaces = agendaStats?.popular_places || [];
  if (popularPlaces.length === 0 && allAgenda.length > 0) {
    const placeMap: Record<string, number> = {};
    allAgenda.forEach((item) => {
      const p = item.place || 'Main Hall';
      placeMap[p] = (placeMap[p] || 0) + 1;
    });
    popularPlaces = Object.entries(placeMap).map(([place, count]) => ({
      place,
      count
    }));
  }

  const todayEvents = agendaStats?.today_events ?? todayMetrics?.events_scheduled ?? allAgenda.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.start_time?.startsWith(today);
  }).length;

  const participantTypes = participantStats?.participant_types || [];
  const universities = participantStats?.university_distribution || [];
  const activities = activityData?.activities || [];

  // Estimated Revenue Calculation
  const estimatedRevenue = paidParticipants * 190;

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* 1. Header & Live Telemetry Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EAE3D5]/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
              Executive Analytics
            </h1>
          
          </div>
          <p className="text-xs text-[#6B6862] mt-1 font-medium">
            Real-time multi-dimensional statistics from database • Last synced:{' '}
            {overview?.last_updated
              ? new Date(overview.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Live'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefreshAll}
            disabled={isFetchingOverview}
            title="Refresh analytics data"
            className="p-2.5 bg-white text-[#6B6862] hover:text-[#1A1A1A] border border-[#EAE3D5] hover:bg-[#F7F4EE] rounded-full text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetchingOverview ? 'animate-spin text-[#B8964A]' : ''}`} />
            <span className="hidden md:inline">Sync Data</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#E0D5F3] rounded-full text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Analytics</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Highlight Cards with Real Data & Sparkline Wave Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Registrations */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between relative overflow-hidden group hover:border-[#C5A880]/60 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#B8964A]" />
                Total Delegates
              </span>
              <span className="text-[10px] font-bold text-[#2E5A36] bg-[#EBF2EC] px-2 py-0.5 rounded-full border border-[#D5E6D8]">
                +{todayMetrics?.new_registrations || 0} today
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
                {totalParticipants.toLocaleString()}
              </h3>
              <p className="text-[11px] text-[#6B6862] mt-0.5 font-medium">
                <span className="text-[#2E5A36] font-semibold">{approvedCount}</span> approved •{' '}
                <span className="text-[#B8964A] font-semibold">{pendingCount}</span> pending
              </p>
            </div>
          </div>

          {/* SVG Sparkline Wave */}
          <div className="mt-4 h-12 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="goldWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DFC598" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C4A77D" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path
                d="M 0 35 C 30 20, 60 45, 90 25 C 120 10, 150 40, 180 15 L 200 20 L 200 50 L 0 50 Z"
                fill="url(#goldWaveGrad)"
              />
              <path
                d="M 0 35 C 30 20, 60 45, 90 25 C 120 10, 150 40, 180 15 L 200 20"
                fill="none"
                stroke="#C5A880"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#96928B] pt-1">
            <span>Approval Rate: {approvalRate}%</span>
            <Link href="/dashboard/participants" className="text-[#B8964A] hover:underline font-semibold flex items-center">
              View <ChevronRight className="h-3 w-3 inline" />
            </Link>
          </div>
        </div>

        {/* Card 2: Gate Check-ins */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between relative overflow-hidden group hover:border-[#C8B6E2]/60 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 text-[#6E4FA0]" />
                Gate Check-ins
              </span>
              <span className="text-[10px] font-bold text-[#6E4FA0] bg-[#ECE5F8] px-2 py-0.5 rounded-full border border-[#DDD0F3]">
                {checkinRate}% of tickets
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
                {checkedInCount.toLocaleString()}
                <span className="text-xs font-sans font-normal text-[#96928B] ml-2">/ {totalTickets}</span>
              </h3>
              <p className="text-[11px] text-[#6B6862] mt-0.5 font-medium">
                <span className="text-[#6E4FA0] font-semibold">+{todayMetrics?.checkins_completed || 0}</span> scans today
              </p>
            </div>
          </div>

          {/* SVG Lavender Sparkline */}
          <div className="mt-4 h-12 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lavenderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8B6E2" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ECE5F8" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path
                d="M 0 40 C 40 45, 80 15, 120 30 C 150 40, 170 10, 200 15 L 200 50 L 0 50 Z"
                fill="url(#lavenderGrad)"
              />
              <path
                d="M 0 40 C 40 45, 80 15, 120 30 C 150 40, 170 10, 200 15"
                fill="none"
                stroke="#6E4FA0"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#96928B] pt-1">
            <span>Total Scans: {ticketStats?.total_scans ?? checkedInCount}</span>
            <Link href="/dashboard/checkin" className="text-[#6E4FA0] hover:underline font-semibold flex items-center">
              Scanner <ChevronRight className="h-3 w-3 inline" />
            </Link>
          </div>
        </div>

        {/* Card 3: Partner Companies */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between group hover:border-[#8C6F45]/50 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#8C6F45]" />
                Corporate Partners
              </span>
              <span className="text-[10px] font-bold text-[#8C6F45] bg-[#F7F1E6] px-2 py-0.5 rounded-full border border-[#E5DAC6]">
                {totalCompanies} partners
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
                {totalCompanies}
              </h3>
              <p className="text-[11px] text-[#6B6862] mt-0.5 font-medium">
                {companyStats?.completion_rate?.with_website || allCompanies.filter(c => !!c.website).length} with verified web portal
              </p>
            </div>
          </div>

          {/* Mini Bar preview */}
          <div className="mt-4 h-12 w-full flex items-end justify-between px-1 gap-1.5">
            <div className="flex-1 bg-[#ECE5F8] rounded-t h-[40%]" />
            <div className="flex-1 bg-[#C8B6E2] rounded-t h-[70%]" />
            <div className="flex-1 bg-[#F7F1E6] rounded-t h-[30%]" />
            <div className="flex-1 bg-[#DFC598] rounded-t h-[90%]" />
            <div className="flex-1 bg-[#6E4FA0] rounded-t h-[60%]" />
            <div className="flex-1 bg-[#C5A880] rounded-t h-[80%]" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#96928B] pt-1">
            <span>Enterprise network</span>
            <Link href="/dashboard/companies" className="text-[#8C6F45] hover:underline font-semibold flex items-center">
              Directory <ChevronRight className="h-3 w-3 inline" />
            </Link>
          </div>
        </div>

        {/* Card 4: Scheduled Agenda Sessions */}
        <div className="bg-white p-6 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between group hover:border-[#2E5A36]/50 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B6862] font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#2E5A36]" />
                Event Sessions
              </span>
              <span className="text-[10px] font-bold text-[#2E5A36] bg-[#EBF2EC] px-2 py-0.5 rounded-full border border-[#D5E6D8]">
                {todayEvents} today
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
                {totalEvents}
              </h3>
              <p className="text-[11px] text-[#6B6862] mt-0.5 font-medium">
                Across {popularPlaces.length} stages & halls
              </p>
            </div>
          </div>

          {/* Mini Wave / Progress indicator */}
          <div className="mt-4 h-12 w-full flex items-center">
            <div className="w-full space-y-1.5">
              <div className="flex justify-between text-[10px] text-[#6B6862]">
                <span>Active agenda modules</span>
                <span className="font-semibold">{totalEvents} total</span>
              </div>
              <div className="w-full bg-[#EAE3D5]/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2E5A36] h-full rounded-full transition-all duration-700"
                  style={{ width: `${totalEvents > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#96928B] pt-1">
            <span>Program & Tracks</span>
            <Link href="/dashboard/agenda" className="text-[#2E5A36] hover:underline font-semibold flex items-center">
              Agenda <ChevronRight className="h-3 w-3 inline" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. CIRCULAR ANALYTICS SECTION: 3 Circular & Donut Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circle 1: Approval Rate & Registration Funnel */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#FAF5EB] rounded-xl text-[#B8964A]">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-serif font-bold text-[#1A1A1A]">
                  Approval & Vetting
                </h2>
                <p className="text-[11px] text-[#6B6862]">HR Verification Breakdown</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#B8964A] bg-[#FAF5EB] px-2.5 py-1 rounded-full border border-[#E5DAC6]">
              {approvalRate}% rate
            </span>
          </div>

          <div className="py-6 flex flex-col sm:flex-row items-center justify-around gap-4">
            <MultiSegmentDonut
              size={135}
              strokeWidth={12}
              centerLabel={totalParticipants}
              centerSub="Total"
              segments={[
                { label: 'Approved', value: approvedCount, color: '#2E5A36' },
                { label: 'Pending', value: pendingCount, color: '#B8964A' },
                { label: 'Rejected', value: rejectedCount, color: '#8B2635' }
              ]}
            />

            <div className="space-y-2.5 w-full sm:w-auto text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2E5A36]" />
                  Approved
                </span>
                <span className="font-mono font-bold text-[#2E5A36]">{approvedCount}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#B8964A]" />
                  Pending Review
                </span>
                <span className="font-mono font-bold text-[#B8964A]">{pendingCount}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8B2635]" />
                  Rejected
                </span>
                <span className="font-mono font-bold text-[#8B2635]">{rejectedCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE3D5]/60 flex items-center justify-between text-xs text-[#6B6862]">
            <span>Pending Approvals: <strong className="text-[#1A1A1A] font-mono">{pendingCount}</strong></span>
            <Link
              href="/dashboard/participants"
              className="text-[#B8964A] hover:text-[#9C7A2E] font-semibold hover:underline flex items-center gap-1"
            >
              Review Queue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Circle 2: Gate Check-in & Admission Donut */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#ECE5F8] rounded-xl text-[#6E4FA0]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-serif font-bold text-[#1A1A1A]">
                  Gate Admissions
                </h2>
                <p className="text-[11px] text-[#6B6862]">Ticket Scan & Entry Status</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#6E4FA0] bg-[#ECE5F8] px-2.5 py-1 rounded-full border border-[#DDD0F3]">
              {checkinRate}% admitted
            </span>
          </div>

          <div className="py-6 flex flex-col sm:flex-row items-center justify-around gap-4">
            <CircularProgress
              value={checkinRate}
              size={135}
              strokeWidth={12}
              color="#6E4FA0"
              bgColor="#ECE5F8"
              label={`${checkinRate}%`}
              sublabel="Admitted"
            />

            <div className="space-y-2.5 w-full sm:w-auto text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6E4FA0]" />
                  Checked In
                </span>
                <span className="font-mono font-bold text-[#6E4FA0]">{checkedInCount}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#C8B6E2]" />
                  Assigned
                </span>
                <span className="font-mono font-bold text-[#1A1A1A]">{assignedTickets}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DFC598]" />
                  Active Pool
                </span>
                <span className="font-mono font-bold text-[#8C6F45]">{activeUnassignedTickets}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE3D5]/60 flex items-center justify-between text-xs text-[#6B6862]">
            <span>Total Issued Tickets: <strong className="text-[#1A1A1A] font-mono">{totalTickets}</strong></span>
            <Link
              href="/dashboard/tickets"
              className="text-[#6E4FA0] hover:text-[#523A7A] font-semibold hover:underline flex items-center gap-1"
            >
              Ticket Manager <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Circle 3: Payment Breakdown & Financial State */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#EBF2EC] rounded-xl text-[#2E5A36]">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-serif font-bold text-[#1A1A1A]">
                  Payment Status
                </h2>
                <p className="text-[11px] text-[#6B6862]">Fee Settlement Metrics</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-[#2E5A36] bg-[#EBF2EC] px-2.5 py-1 rounded-full border border-[#D5E6D8]">
              €{estimatedRevenue.toLocaleString()}
            </span>
          </div>

          <div className="py-6 flex flex-col sm:flex-row items-center justify-around gap-4">
            <MultiSegmentDonut
              size={135}
              strokeWidth={12}
              centerLabel={paidParticipants}
              centerSub="Paid"
              segments={[
                { label: 'Paid', value: paidParticipants, color: '#2E5A36' },
                { label: 'Pending', value: pendingPayments, color: '#B8964A' },
                { label: 'Failed', value: failedPayments, color: '#8B2635' }
              ]}
            />

            <div className="space-y-2.5 w-full sm:w-auto text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2E5A36]" />
                  Paid Complete
                </span>
                <span className="font-mono font-bold text-[#2E5A36]">{paidParticipants}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#B8964A]" />
                  Payment Pending
                </span>
                <span className="font-mono font-bold text-[#B8964A]">{pendingPayments}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8B2635]" />
                  Failed / Unpaid
                </span>
                <span className="font-mono font-bold text-[#8B2635]">{failedPayments}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE3D5]/60 flex items-center justify-between text-xs text-[#6B6862]">
            <span>Paid Ratio: <strong className="text-[#1A1A1A] font-mono">{totalParticipants > 0 ? Math.round((paidParticipants / totalParticipants) * 100) : 0}%</strong></span>
            <span className="text-[11px] text-[#6B6862]">Auto-reconciled</span>
          </div>
        </div>
      </div>

      {/* 4. BAR CHARTS SECTION: Multi-Bar Breakdowns of Real Database Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart 1: Participant Types Distribution */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#FAF5EB] rounded-xl text-[#B8964A]">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
                  Participant Classifications
                </h2>
                <p className="text-xs text-[#6B6862]">Real-time role & delegate category breakdown</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#8C827A] uppercase tracking-wider">
              {participantTypes.length} Classes
            </span>
          </div>

          {participantTypes.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#96928B]">
              No participant classification records found in database.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {participantTypes.map((pt, idx) => {
                const percent = totalParticipants > 0 ? Math.round((pt.count / totalParticipants) * 100) : 0;
                const typeLabel =
                  pt.participant_type === 'ST'
                    ? 'Student'
                    : pt.participant_type === 'G'
                    ? 'Graduate / Professional'
                    : pt.participant_type;

                const barColors = ['#B8964A', '#6E4FA0', '#2E5A36', '#8C6F45', '#C8B6E2'];
                const color = barColors[idx % barColors.length];

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                        {typeLabel}
                      </span>
                      <span className="font-mono text-[#6B6862]">
                        <strong className="text-[#1A1A1A]">{pt.count}</strong> ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#F3EFE6] h-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-[11px] text-[#6B6862] flex justify-between items-center border-t border-[#EAE3D5]/60">
            <span>Verified against registration records</span>
            <span className="font-mono font-semibold">{totalParticipants} Total</span>
          </div>
        </div>

        {/* Bar Chart 2: Top Academic Institutions & Universities */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#EBF2EC] rounded-xl text-[#2E5A36]">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
                  Top Institutions & Universities
                </h2>
                <p className="text-xs text-[#6B6862]">Top academic representation by delegate count</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#8C827A] uppercase tracking-wider">
              Top {universities.length}
            </span>
          </div>

          {universities.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#96928B]">
              No university representation records registered yet.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {universities.map((uni, idx) => {
                const maxCount = Math.max(...universities.map((u) => u.count), 1);
                const percent = Math.round((uni.count / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1A1A1A] truncate max-w-[240px] sm:max-w-[320px]">
                        #{idx + 1}. {uni.university || 'General Campus'}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#2E5A36]">
                        {uni.count} delegates
                      </span>
                    </div>
                    <div className="w-full bg-[#F3EFE6] h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2E5A36] h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-[11px] text-[#6B6862] flex justify-between items-center border-t border-[#EAE3D5]/60">
            <span>Ranked by student & alumni enrollment</span>
            <span className="text-[#2E5A36] font-semibold">100% telemetry</span>
          </div>
        </div>
      </div>

      {/* 5. CORPORATE DELEGATIONS & AGENDA SESSIONS BY CATEGORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sponsoring Companies */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#FAF5EB] rounded-xl text-[#8C6F45]">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
                  Corporate Delegations
                </h2>
                <p className="text-xs text-[#6B6862]">Registered partner companies and active delegate links</p>
              </div>
            </div>
            <Link
              href="/dashboard/companies"
              className="text-xs text-[#8C6F45] hover:underline font-semibold flex items-center gap-1"
            >
              All ({totalCompanies}) <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {topCompanies.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#96928B]">
              No company records found in database.
            </div>
          ) : (
            <div className="space-y-3.5 pt-1">
              {topCompanies.slice(0, 5).map((comp, idx) => {
                const maxCount = Math.max(...topCompanies.map((c) => c.participant_count), 1);
                const hasParticipants = comp.participant_count > 0;
                const barWidth = hasParticipants ? Math.round((comp.participant_count / maxCount) * 100) : 100;

                return (
                  <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-[#FAF8F5]/70 border border-[#EAE3D5]/70 hover:border-[#C5A880]/50 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1A1A1A]">{comp.name}</span>
                        {comp.field && (
                          <span className="text-[10px] px-2 py-0.5 bg-white border border-[#EAE3D5] rounded-full text-[#6B6862] font-medium">
                            {comp.field}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {comp.website && (
                          <a
                            href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8C6F45] hover:text-[#B8964A]"
                            title="Visit website"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <span className="font-mono text-xs font-bold text-[#8C6F45]">
                          {hasParticipants ? `${comp.participant_count} delegates` : 'Partner Active'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#F3EFE6] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C5A880] h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${hasParticipants ? barWidth : 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-[11px] text-[#6B6862] flex justify-between items-center border-t border-[#EAE3D5]/60">
            <span>Total Corporate Partners: <strong className="text-[#1A1A1A] font-mono">{totalCompanies}</strong></span>
            <Link href="/dashboard/companies" className="text-[#8C6F45] font-semibold hover:underline">
              Manage Delegations →
            </Link>
          </div>
        </div>

        {/* Agenda Tracks & Stage Utilization */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#ECE5F8] rounded-xl text-[#6E4FA0]">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
                  Agenda Sessions by Category
                </h2>
                <p className="text-xs text-[#6B6862]">Distribution of planned event modules</p>
              </div>
            </div>
            <Link
              href="/dashboard/agenda"
              className="text-xs text-[#6E4FA0] hover:underline font-semibold flex items-center gap-1"
            >
              Manage ({totalEvents}) <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {eventTypes.length === 0 && allAgenda.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#96928B]">
              No agenda sessions recorded in schedule yet.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Event Types */}
              {eventTypes.map((et, idx) => {
                const pct = totalEvents > 0 ? Math.round((et.count / totalEvents) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1A1A1A] capitalize flex items-center gap-1.5">
                        <Tag className="h-3 w-3 text-[#6E4FA0]" />
                        {et.event_type || 'General Session'}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#6E4FA0]">
                        {et.count} {et.count === 1 ? 'session' : 'sessions'} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#F3EFE6] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#6E4FA0] h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.max(pct, 15)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Popular venues tags */}
              {popularPlaces.length > 0 && (
                <div className="pt-2 border-t border-[#EAE3D5]/60">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C827A] block mb-2">
                    Key Event Stages & Halls
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {popularPlaces.map((pl, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#FAF8F5] border border-[#EAE3D5] text-xs text-[#1A1A1A] rounded-lg font-medium flex items-center gap-1.5"
                      >
                        <MapPin className="h-3 w-3 text-[#B8964A]" />
                        {pl.place}: <strong className="font-mono text-[#B8964A]">{pl.count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 text-[11px] text-[#6B6862] flex justify-between items-center border-t border-[#EAE3D5]/60">
            <span>Total Agenda Modules: <strong className="text-[#1A1A1A] font-mono">{totalEvents}</strong></span>
            <Link href="/dashboard/agenda" className="text-[#6E4FA0] font-semibold hover:underline">
              Open Schedule Timeline →
            </Link>
          </div>
        </div>
      </div>

      {/* 6. LIVE ACTIVITY & OPERATION STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Log from Backend */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#EBF2EC] rounded-xl text-[#2E5A36]">
                <ActivityIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
                  Real-time Operational Feed
                </h2>
                <p className="text-xs text-[#6B6862]">Live telemetry across registrations, gate scans & approvals</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#2E5A36] bg-[#EBF2EC] px-2.5 py-1 rounded-full border border-[#D5E6D8]">
              {activities.length} Events
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#96928B]">
              No recent activity captured yet.
            </div>
          ) : (
            <div className="divide-y divide-[#EAE3D5]/50">
              {activities.map((act, index) => {
                const timeAgo = new Date(act.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                let badgeColor = 'bg-[#FAF5EB] text-[#B8964A] border-[#E5DAC6]';
                let icon = <Users className="h-3.5 w-3.5" />;

                if (act.type === 'approval') {
                  badgeColor = 'bg-[#EBF2EC] text-[#2E5A36] border-[#D5E6D8]';
                  icon = <CheckCircle2 className="h-3.5 w-3.5" />;
                } else if (act.type === 'checkin') {
                  badgeColor = 'bg-[#ECE5F8] text-[#6E4FA0] border-[#DDD0F3]';
                  icon = <Ticket className="h-3.5 w-3.5" />;
                } else if (act.type === 'company') {
                  badgeColor = 'bg-[#F7F1E6] text-[#8C6F45] border-[#E5DAC6]';
                  icon = <Building2 className="h-3.5 w-3.5" />;
                }

                return (
                  <div key={index} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF8F5]/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`p-1.5 rounded-lg border ${badgeColor}`}>
                        {icon}
                      </span>
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">{act.message}</p>
                        <p className="text-[10px] text-[#8C827A] mt-0.5">
                          {act.approved_by && `Approved by ${act.approved_by} • `}
                          {act.scanned_by && `Scanner: ${act.scanned_by} • `}
                          {act.ticket_number && `Ticket #${act.ticket_number} • `}
                          {timeAgo}
                        </p>
                      </div>
                    </div>

                    {act.participant_id && (
                      <Link
                        href={`/dashboard/participants`}
                        className="text-[11px] text-[#B8964A] hover:underline font-semibold shrink-0"
                      >
                        Inspect
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Operations & Target Summary */}
        <div className="bg-white rounded-3xl border border-[#EAE3D5] p-6 shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]/60">
              <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
                Event Targets & Health
              </h2>
              <span className="text-[10px] text-[#96928B] uppercase tracking-wider font-semibold">
                Status
              </span>
            </div>

            <div className="space-y-4 pt-3 text-xs">
              {/* Capacity Metric */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#6B6862] font-medium">
                  <span>Tickets Assigned Rate</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">
                    {totalTickets > 0 ? Math.round(((assignedTickets + checkedInCount) / totalTickets) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-[#ECE5F8] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#6E4FA0] h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${totalTickets > 0 ? Math.min(100, Math.round(((assignedTickets + checkedInCount) / totalTickets) * 100)) : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Approval Conversion */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#6B6862] font-medium">
                  <span>Vetting Efficiency</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">{approvalRate}%</span>
                </div>
                <div className="w-full bg-[#EBF2EC] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2E5A36] h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, approvalRate)}%` }}
                  />
                </div>
              </div>

              {/* Gate Scanning Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#6B6862] font-medium">
                  <span>Admissions Scanned</span>
                  <span className="font-mono text-[#1A1A1A] font-bold">{checkinRate}%</span>
                </div>
                <div className="w-full bg-[#FAF5EB] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#B8964A] h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, checkinRate)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#EAE3D5]/60">
            <Link
              href="/dashboard/participants"
              className="w-full py-2.5 bg-[#FAF8F5] text-[#1A1A1A] border border-[#EAE3D5] hover:bg-[#F3EFE6] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Users className="h-3.5 w-3.5 text-[#B8964A]" />
              <span>Participant Management</span>
            </Link>

            <Link
              href="/dashboard/checkin"
              className="w-full py-2.5 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#E0D5F3] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Ticket className="h-3.5 w-3.5 text-[#6E4FA0]" />
              <span>Check-in Scanner Station</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
