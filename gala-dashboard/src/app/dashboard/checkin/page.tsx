'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient, { TicketScan } from '@/lib/apiClient';
import {
  Scan,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Users,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function CheckInStation() {
  const [serialInput, setSerialInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
    serial?: string;
    attendee?: string;
  }>({ status: null, message: 'Ready to scan barcode...' });

  const inputRef = useRef<HTMLInputElement>(null);

  // Play audio feedbacks using Web Audio API (no external asset needed)
  const playSound = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        // Success sound: High pitched short double beep
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        
        // Second beep
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.setValueAtTime(1200, ctx.currentTime);
          gain2.gain.setValueAtTime(0.1, ctx.currentTime);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.12);
        }, 120);
      } else {
        // Error sound: Low pitch long buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  // Query scan log
  const { data: scanData, isLoading: scansLoading, refetch: refetchScans } = useQuery<{ scans: TicketScan[] }>({
    queryKey: ['scan-history'],
    queryFn: () => apiClient.get('/api/tickets/scan-history/')
  });

  // Mutation for check-in action
  const checkinMutation = useMutation({
    mutationFn: ({ serial, action }: { serial: string; action: 'check_in' | 'check_out' }) => {
      return apiClient.post<{
        message: string;
        serial_number: string;
        participant: string;
        status: string;
      }>('/api/tickets/checkin/', {
        serial_number: serial,
        action
      });
    },
    onSuccess: (res) => {
      playSound('success');
      setLastScanResult({
        status: 'success',
        message: res.message || 'Successfully checked in.',
        serial: res.serial_number,
        attendee: res.participant
      });
      setSerialInput('');
      refetchScans();
      // Keep input focused
      inputRef.current?.focus();
    },
    onError: (err: any) => {
      playSound('error');
      setLastScanResult({
        status: 'error',
        message: err.message || 'Ticket invalid or not found.'
      });
      setSerialInput('');
      refetchScans();
      inputRef.current?.focus();
    }
  });

  // Keep input focused
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSerial = serialInput.trim();
    if (!cleanSerial) return;
    
    checkinMutation.mutate({ serial: cleanSerial, action: 'check_in' });
  };

  const handleManualCheckOut = (serial: string) => {
    checkinMutation.mutate({ serial, action: 'check_out' });
  };

  return (
    <div className="space-y-8 text-[#1A1A1A]" onClick={handleContainerClick}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#1A1A1A] text-[#FAF7F2] text-[10px] font-semibold tracking-widest uppercase shadow-2xs">
              Access Gate
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F4EFFF] text-[#7A5F9E] border border-[#DDD0F3] text-[10px] font-semibold tracking-wider">
              Validator Active
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
            Check-In Station
          </h1>
          <p className="text-xs text-[#666666] font-sans font-normal tracking-wide">
            Automated ticket validator terminal with rapid barcode scanner detection.
          </p>
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 text-[#6E4FA0]" /> : <VolumeX className="h-4 w-4 text-[#96928B]" />}
          <span>{soundEnabled ? 'Beep Audio: ON' : 'Beep Audio: OFF'}</span>
        </button>
      </div>

      {/* Main scanner & display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Validation Feedback screen */}
          <div className={`p-8 rounded-3xl border flex flex-col items-center justify-center text-center h-80 transition-all shadow-[0_4px_24px_-4px_rgba(26,26,26,0.02)] relative overflow-hidden ${
            lastScanResult.status === 'success' ? 'bg-[#EBF2EC] border-[#2E5A36]/30 text-[#2E5A36]' :
            lastScanResult.status === 'error' ? 'bg-[#F9ECEF] border-[#8B2635]/30 text-[#8B2635]' : 'bg-white border-[#EAE3D5] text-[#1A1A1A]'
          }`}>
            <div className="absolute top-5 left-5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold opacity-70">
              <Scan className="h-3.5 w-3.5" />
              <span>Gate Validator Screen</span>
            </div>

            {lastScanResult.status === 'success' && (
              <div className="space-y-4 animate-scale-up">
                <CheckCircle2 className="h-16 w-16 text-[#2E5A36] mx-auto" />
                <div>
                  <h3 className="text-2xl font-serif font-bold uppercase tracking-wider">{lastScanResult.message}</h3>
                  <p className="text-sm font-semibold text-gray-700 mt-2">{lastScanResult.attendee}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">Serial: {lastScanResult.serial}</p>
                </div>
              </div>
            )}

            {lastScanResult.status === 'error' && (
              <div className="space-y-4 animate-scale-up">
                <XCircle className="h-16 w-16 text-[#8B2635] mx-auto" />
                <div>
                  <h3 className="text-2xl font-serif font-bold uppercase tracking-wider">Access Denied</h3>
                  <p className="text-sm font-medium mt-2">{lastScanResult.message}</p>
                </div>
              </div>
            )}

            {lastScanResult.status === null && (
              <div className="space-y-4 text-[#8C8C8C]">
                <div className="h-16 w-16 mx-auto rounded-full bg-[#FAF8F5] border border-[#EAE3D5] flex items-center justify-center">
                  <Scan className="h-8 w-8 text-[#C5A880] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-semibold text-[#1A1A1A]">{lastScanResult.message}</h3>
                  <p className="text-xs text-[#666666] mt-1 font-sans">Focus is active. Scan a ticket barcode or type serial code.</p>
                </div>
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleScanSubmit} className="bg-white p-6 border border-[#EAE3D5] rounded-3xl shadow-sm">
            <label htmlFor="scanner-input" className="block text-[10px] uppercase tracking-wider text-[#666666] font-semibold mb-2">
              Scanner Input (Auto Focused)
            </label>
            <div className="relative rounded-xl shadow-xs">
              <input
                ref={inputRef}
                type="text"
                id="scanner-input"
                autoComplete="off"
                placeholder="Scan barcode or enter serial number..."
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                disabled={checkinMutation.isPending}
                className="block w-full py-3 px-4 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-sm font-mono tracking-widest text-[#1A1A1A] placeholder:font-sans placeholder:tracking-normal placeholder:text-[#A0A0A0] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880] transition-colors"
              />
              {checkinMutation.isPending && (
                <div className="absolute right-3 top-3.5">
                  <Loader2 className="h-5 w-5 animate-spin text-[#C5A880]" />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#8C8C8C]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6E4FA0]" />
                Automatic submission active
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] rounded-xl text-xs font-semibold cursor-pointer shadow-2xs transition-all"
              >
                Validate Manually
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Scan History Feed */}
        <div className="bg-white rounded-3xl border border-[#EFE8DC] p-6 flex flex-col h-[500px] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-[#1A1A1A] font-serif flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#C5A880]" />
              <span>Recent Scans Log</span>
            </h2>
            <button
              onClick={() => refetchScans()}
              className="p-1.5 hover:bg-[#FAF7F2] rounded-lg text-[#8C8C8C] hover:text-[#1A1A1A] transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {scansLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-[#FAF7F2] rounded-xl" />
                ))}
              </div>
            ) : !scanData?.scans?.length ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center text-[#8C8C8C]">
                <Scan className="h-8 w-8 mb-2 opacity-40 text-[#C5A880]" />
                <p className="text-xs">No scan events processed yet.</p>
              </div>
            ) : (
              scanData.scans.map((scan) => (
                <div key={scan.id} className="p-3.5 bg-[#FAF7F2] border border-[#EFE8DC] rounded-2xl flex items-center justify-between text-xs hover:border-[#C5A880]/40 transition-colors">
                  <div className="space-y-1">
                    <div className="font-semibold text-[#1A1A1A]">{scan.participant_name || 'Participant'}</div>
                    <div className="text-[10px] text-[#666666] font-mono">{scan.serial_number}</div>
                    <div className="text-[9px] text-[#8C8C8C]">
                      {new Date(scan.scan_datetime).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold leading-3 ${
                      scan.scan_result === 'valid' ? 'bg-[#EBF2EC] text-[#2E5A36] border border-[#D5E6D8]' : 'bg-[#F9ECEF] text-[#8B2635] border border-[#F2C2CB]'
                    }`}>
                      {scan.scan_result.toUpperCase()}
                    </span>
                    {scan.scan_result === 'valid' && (
                      <button
                        onClick={() => handleManualCheckOut(scan.serial_number)}
                        className="text-[9px] text-[#8B2635] hover:underline font-semibold cursor-pointer"
                      >
                        Check Out
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
