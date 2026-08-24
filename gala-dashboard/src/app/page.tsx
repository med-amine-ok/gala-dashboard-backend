'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center text-[#1A1A1A]">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#F7F1E6] via-[#FAF7F2] to-[#F4EFFF] border border-[#E5DAC6] flex items-center justify-center shadow-xs mb-3">
        <Sparkles className="h-6 w-6 text-[#C5A880] animate-pulse" />
      </div>
      <span className="text-xs uppercase tracking-widest text-[#666666] font-medium animate-pulse">
        Initializing GALA Dashboard...
      </span>
    </div>
  );
}
