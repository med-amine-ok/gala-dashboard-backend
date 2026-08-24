'use client';

import React, { useState } from 'react';
import { QrCode, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showActions?: boolean;
  label?: string;
}

export default function QRCodeDisplay({
  value,
  size = 180,
  className = '',
  showActions = true,
  label
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fast, reliable QR generator API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(
    value
  )}&color=1A1A1A&bgcolor=FFFFFF&margin=2`;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Ticket serial copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-qr-${value}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QR Code downloaded successfully');
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="p-3 bg-white border border-[#EAE3D5] rounded-2xl shadow-xs inline-block relative group">
        {!imageError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrUrl}
            alt={`QR Code for ${value}`}
            width={size}
            height={size}
            className="rounded-xl aspect-square object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="bg-[#FAF8F5] border border-dashed border-[#DDD0F3] rounded-xl flex flex-col items-center justify-center p-3 text-center"
          >
            <QrCode className="h-8 w-8 text-[#6E4FA0] mb-2 opacity-60" />
            <span className="font-mono text-[10px] text-[#1A1A1A] font-semibold break-all">
              {value}
            </span>
          </div>
        )}
      </div>

      {label && (
        <span className="font-mono text-xs font-bold text-[#1A1A1A] tracking-wider mt-2.5">
          {label}
        </span>
      )}

      {showActions && (
        <div className="flex items-center gap-2 mt-3 text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-xl font-medium transition-colors cursor-pointer text-[11px]"
            title="Copy Serial Code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#2E5A36]" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#ECE5F8] text-[#6E4FA0] border border-[#EAE3D5] rounded-xl font-medium transition-colors cursor-pointer text-[11px]"
            title="Download QR Image"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
        </div>
      )}
    </div>
  );
}
