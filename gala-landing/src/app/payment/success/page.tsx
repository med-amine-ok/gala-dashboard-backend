"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Download,
  Ticket,
  Mail,
  Loader2,
  AlertCircle,
  QrCode,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Printer,
} from "lucide-react";

interface ParticipantInfo {
  id: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  university?: string;
  fieldOfStudy?: string;
}

interface VerifyResponse {
  success: boolean;
  ticketSerial?: string;
  ticketStatus?: string;
  emailSent?: boolean;
  qrDataUrl?: string;
  downloadUrl?: string;
  participant?: ParticipantInfo;
  message?: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participant_id");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!participantId) {
      setError("Aucun identifiant de participant n'a été fourni.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch(
          `/api/payments/verify?participant_id=${participantId}`,
        );
        const json: VerifyResponse = await res.json();

        if (isMounted) {
          if (json.success) {
            setData(json);
          } else {
            setError(
              json.message ||
                "Paiement en cours de vérification. Veuillez patienter.",
            );
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.message || "Impossible de vérifier le statut du paiement.",
          );
          setLoading(false);
        }
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, [participantId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-[#F7F4EE] text-[#1A1A1A] flex items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Ambient Luxury Event Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,#DFC598_0%,transparent_70%)] opacity-25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,#ECE5F8_0%,transparent_70%)] opacity-35 blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 space-y-8">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl shadow-[#1A1A1A]/5 border border-[#EAE3D5] text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#EAE3D5] flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-[#B89A5E] animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-semibold text-[#1A1A1A]">
                Vérification de votre paiement...
              </h2>
              <p className="text-sm text-[#6B6862] max-w-md mx-auto">
                Nous confirmons la transaction auprès de Chargily et générons
                votre billet officiel avec QR code sécurisé.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 shadow-xl shadow-[#1A1A1A]/5 border border-[#F2C2CB] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#F9ECEF] border border-[#F2C2CB] flex items-center justify-center mx-auto text-[#8B2635]">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-semibold text-[#8B2635]">
                Statut du Paiement
              </h2>
              <p className="text-sm text-[#6B6862] max-w-md mx-auto">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider text-[#6E4FA0] bg-[#ECE5F8] border border-[#DDD0F3] hover:bg-[#DDD0F3] transition cursor-pointer"
              >
                Réessayer la vérification
              </button>
              <Link
                href="/"
                className="px-6 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider text-[#6B6862] bg-[#FAF8F5] border border-[#EAE3D5] hover:bg-[#EAE3D5] transition"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Success Banner */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBF2EC] border border-[#D5E6D8] text-[#2E5A36] text-xs font-semibold tracking-wide uppercase mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E5A36]" />
                <span>Paiement Confirmé & Place Réservée</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-[#1A1A1A]">
                Félicitations & Bienvenue !
              </h1>
              <p className="text-sm text-[#6B6862] max-w-md mx-auto">
                Votre inscription à l&apos;Engineers Gala 2026 est validée.
                Votre billet d&apos;accès officiel est prêt.
              </p>
            </div>

            {/* ================= OFFICIAL EVENT TICKET PASS ================= */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-[#1A1A1A]/8 border border-[#EAE3D5] relative">
              {/* Gold Top Accent Bar */}
              <div className="h-2.5 w-full bg-gradient-to-r from-[#FFFFFF] via-[#FFFFFF] to-[#FFFFFF]" />

              <div className="p-6 sm:p-8 space-y-6">
                {/* Event Branding Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE3D5] pb-5">
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#B89A5E] block">
                      BILLET OFFICIEL D&apos;ADMISSION
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1A1A] mt-0.5">
                      ENGINEERS GALA 2026
                    </h2>
                  </div>
                </div>

                {/* Ticket Body: Info & QR Code Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* Left Column: Attendee Information */}
                  <div className="sm:col-span-7 space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8C8C8C] block">
                        Participant(e)
                      </span>
                      <p className="text-lg font-serif font-bold text-[#1A1A1A]">
                        {data?.participant?.firstName}{" "}
                        {data?.participant?.lastName}
                      </p>
                      <p className="text-xs text-[#6B6862]">
                        {data?.participant?.email}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8C8C8C] block">
                          Établissement
                        </span>
                        <p className="text-xs font-semibold text-[#1A1A1A]">
                          {data?.participant?.university || "Étudiant / Invité"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8C8C8C] block">
                          Spécialité
                        </span>
                        <p className="text-xs font-semibold text-[#1A1A1A] truncate capitalize">
                          {data?.participant?.fieldOfStudy?.replace("_", " ") ||
                            "Ingénierie"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8C8C8C] block">
                        Numéro de Série du Billet
                      </span>
                      <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-xl bg-[#FAF8F5] border border-[#EAE3D5] font-mono text-xs font-bold text-[#1A1A1A]">
                        <Ticket className="w-3.5 h-3.5 text-[#B89A5E]" />
                        <span>{data?.ticketSerial}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scannable QR Code Frame */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] text-center space-y-2.5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#B89A5E]">
                      SCAN À L&apos;ENTRÉE
                    </span>

                    {/* QR Code Container */}
                    <div className="relative p-2.5 bg-white rounded-2xl border-2 border-[#DFC598]/60 shadow-md">
                      {data?.qrDataUrl ? (
                        <Image
                          src={data.qrDataUrl}
                          alt="Ticket QR Code"
                          width={160}
                          height={160}
                          className="rounded-lg object-contain w-36 h-36 sm:w-40 sm:h-40"
                          priority
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-[#8C8C8C]">
                          <QrCode className="w-12 h-12 animate-pulse" />
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-[#6B6862] leading-tight max-w-[180px]">
                      Présentez ce QR code sur votre téléphone le jour de
                      l&apos;événement
                    </p>
                  </div>
                </div>

                {/* Event Location & Date Footer Bar */}
                <div className="pt-4 border-t border-[#EAE3D5] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6862]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B89A5E]" />
                    <span>Événement Annuel GALA 2026</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6E4FA0]" />
                    <span>Palais des Congrès • Alger</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Dispatch Notification Pill */}
            <div className="p-4 rounded-2xl bg-[#ECE5F8]/50 border border-[#DDD0F3] flex items-center gap-3 text-xs text-[#6E4FA0]">
              <Mail className="w-5 h-5 shrink-0 text-[#6E4FA0]" />
              <p>
                Un exemplaire PDF de votre billet a également été envoyé à{" "}
                <strong>{data?.participant?.email}</strong>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
              {data?.downloadUrl && (
                <a
                  href={data.downloadUrl}
                  download={"ticket-" + (data?.ticketSerial || "pass") + ".pdf"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider text-[#FAF7F2] bg-[#1A1A1A] hover:bg-[#333333] shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le Billet (PDF)</span>
                </a>
              )}

              <button
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider text-[#6B6862] bg-white border border-[#EAE3D5] hover:bg-[#FAF8F5] transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#8C8C8C]" />
                <span>Imprimer</span>
              </button>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider text-[#B89A5E] bg-[#FAF8F5] border border-[#EAE3D5] hover:bg-[#EAE3D5] transition-all"
              >
                <span>Retour à l&apos;accueil</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#B89A5E] animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
