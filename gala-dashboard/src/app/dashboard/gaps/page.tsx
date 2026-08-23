'use client';

import React from 'react';
import {
  AlertTriangle,
  Lock,
  Calendar,
  KeyRound,
  FileSpreadsheet,
  FileCode,
  Building2
} from 'lucide-react';

export default function GapsPage() {
  const gaps = [
    {
      title: 'Authentication Storage Strategy',
      icon: Lock,
      status: 'Handled',
      desc: 'The login endpoint returns tokens directly in the JSON response rather than HTTP-only cookies. Refresh tokens are secured in localStorage.',
      mitigation: 'In-memory Axios headers for API requests. Short-lived session cookie synchronized with client state to allow server-side Next.js middleware protection.'
    },
    {
      title: 'Participant Deletions',
      icon: FileCode,
      status: 'Fixed in Backend',
      desc: 'The participant viewset originally inherited from ReadOnlyModelViewSet, lacking deletion support.',
      mitigation: 'Implemented destroy() method on the backend ParticipantViewSet view to execute atomic deletion of Participant profiles and user credentials.'
    },
    {
      title: 'Agenda Venue Overlap Warnings',
      icon: Calendar,
      status: 'Handled',
      desc: 'The database schema lacks venue-time unique indexes, but checks are enforced at view levels.',
      mitigation: 'Integrated pre-emptive client-side timeline scan alerting admins before session submissions.'
    },
    {
      title: 'HR Admin Password Changes',
      icon: KeyRound,
      status: 'Access Django Admin',
      desc: 'The backend has no user password update endpoint accessible by active HR admins.',
      mitigation: 'System guidelines direct administrators to modify passwords using the native Django Admin panel (/admin/).'
    }
  ];

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      <div className="space-y-1 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
            Technical Audit
          </span>
          <span className="px-3 py-1 rounded-full bg-[#F4EFFF] text-[#7A5F9E] border border-[#DDD0F3] text-[10px] font-semibold tracking-wider">
            4 Solved Specifications
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
          System Specifications & Gaps
        </h1>
        <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
          Review technical boundaries, data models, and resolution strategies implemented across the system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gaps.map((gap, index) => {
          const Icon = gap.icon;
          return (
            <div key={index} className="bg-white p-7 rounded-3xl border border-[#EAE3D5] shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] space-y-4 hover:border-[#C8B6E2]/60 hover:shadow-[0_8px_30px_-4px_rgba(200,182,226,0.15)] transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#FAF8F5] border border-[#EAE3D5] flex items-center justify-center shadow-2xs">
                    <Icon className="h-5 w-5 text-[#8C6F45]" />
                  </div>
                  <h3 className="font-semibold text-sm text-[#1A1A1A] font-serif">
                    {gap.title}
                  </h3>
                </div>
                
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase ${
                  gap.status.startsWith('Fixed') ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' : 'bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3]'
                }`}>
                  {gap.status}
                </span>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <span className="text-[10px] text-[#96928B] uppercase tracking-wider font-semibold block">Boundary</span>
                  <p className="text-[#6B6862] mt-0.5 leading-relaxed">{gap.desc}</p>
                </div>
                
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE3D5]">
                  <span className="text-[10px] text-[#8C6F45] uppercase tracking-wider font-semibold block">Resolution Strategy</span>
                  <p className="text-[#1A1A1A] mt-1 leading-relaxed">{gap.mitigation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DRF Production Note Card */}
      <div className="p-7 bg-[#171717] rounded-3xl border border-[#2D2D2D] text-[#FAF7F2] space-y-2 shadow-xl">
        <div className="flex items-center gap-2">
          <Building2 className="h-4.5 w-4.5 text-[#C5A880]" />
          <h4 className="font-serif font-semibold text-sm">Django REST Framework Integration Note</h4>
        </div>
        <p className="text-xs text-[#A0A0A0] leading-relaxed">
          Production endpoints strictly serve CORS headers with origin filtering. Token blacklisting and session rotation ensure secure access control for all HR Admin delegates and registration staff.
        </p>
      </div>
    </div>
  );
}
