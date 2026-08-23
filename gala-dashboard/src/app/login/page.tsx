"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useAuth } from "../providers";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Mail, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
    } catch (err: any) {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const isSessionExpired = searchParams.get("expired") === "true";

  return (
    <div className="bg-white py-8 px-6 shadow-xl shadow-[#1A1A1A]/5 rounded-3xl border border-[#EFE8DC] sm:px-10">
      <h2 className="text-lg font-medium text-[#1A1A1A] mb-6 text-center font-serif">
        Sign In to Control Panel
      </h2>

      {isSessionExpired && (
        <div className="mb-5 p-3 rounded-xl bg-[#F9ECEF] border border-[#F2C2CB] text-[#8B2635] text-xs font-medium text-center">
          Your session has expired. Please log in again.
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2"
          >
            Email Address
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-[#A0A0A0]" />
            </div>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-sm placeholder-[#A0A0A0] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880] focus:border-[#C5A880] transition-colors"
              placeholder="admin@gala.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-2"
          >
            Password
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <KeyRound className="h-4 w-4 text-[#A0A0A0]" />
            </div>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E5DAC6] rounded-xl text-sm placeholder-[#A0A0A0] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880] focus:border-[#C5A880] transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-2xl text-sm font-semibold text-[#6E4FA0] bg-[#ECE5F8] border border-[#DDD0F3] hover:bg-[#DDD0F3] hover:shadow-md hover:shadow-[#C8B6E2]/25 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#C8B6E2] transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F4EE] px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden text-[#1A1A1A]">
      {/* Decorative Champagne & Lavender Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[550px] h-[550px] rounded-full bg-radial from-[#DFC598]/20 via-[#ECE5F8]/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-radial from-[#ECE5F8]/40 via-[#DFC598]/15 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 z-10">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center justify-center p-3 rounded-3xl ">
            <Image
              src="/GALA.png"
              alt="Gala Logo"
              width={160}
              height={50}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
          <p className="mt-3 text-xs text-[#6B6862] uppercase tracking-widest font-sans font-semibold">
            Event Management System
          </p>
          <div className="w-12 h-[2px] bg-gradient-to-r from-[#C5A880] to-[#C8B6E2] mx-auto mt-3 rounded-full" />
        </div>

        <Suspense
          fallback={
            <div className="bg-white py-12 px-6 rounded-3xl border border-[#EAE3D5] flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#6E4FA0]" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <div className="text-center">
          <p className="text-xs text-[#96928B] flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6E4FA0]" />
            Authorized HR Administrators & Event Staff Only
          </p>
        </div>
      </div>
    </div>
  );
}
