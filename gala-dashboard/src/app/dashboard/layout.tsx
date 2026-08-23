"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../providers";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Ticket,
  CheckSquare,
  LogOut,
  Mail,
  Menu,
  X,
  Sparkles,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation: SidebarItem[] = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Participants", href: "/dashboard/participants", icon: Users },
    { name: "Companies", href: "/dashboard/companies", icon: Building2 },
    { name: "Agenda Schedule", href: "/dashboard/agenda", icon: Calendar },
    { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
    { name: "Check-In Station", href: "/dashboard/checkin", icon: CheckSquare },
    { name: "Communications", href: "/dashboard/notifications", icon: Mail },
    { name: "System Gaps", href: "/dashboard/gaps", icon: AlertTriangle },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-3 border-[#E5DAC6] border-t-[#C5A880] rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
            Loading Portal...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex text-[#1A1A1A]">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-[#EAE3D5] z-30 shadow-[4px_0_24px_-4px_rgba(26,26,26,0.02)]">
        {/* Brand Area */}
        <div className="flex items-center px-4 h-20">
          <Link href="/dashboard" className="w-full block">
            <div className="w-full py-2.5 px-4  shadow-2xs flex items-center justify-center transition-all">
              <Image
                src="/GALA.png"
                alt="Gala Logo"
                width={220}
                height={60}
                className="h-11 w-full object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all group relative ${
                  isActive
                    ? "text-[#6E4FA0] bg-[#ECE5F8] border border-[#DDD0F3] shadow-2xs"
                    : "text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#F7F4EE] border border-transparent"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 ${isActive ? "text-[#6E4FA0]" : "text-[#96928B] group-hover:text-[#1A1A1A]"} transition-colors`}
                />
                <span className="tracking-tight">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6E4FA0]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#EAE3D5] bg-[#FAF8F5]">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-3 rounded-2xl bg-white border border-[#EAE3D5]">
            <div className="h-8 w-8 rounded-xl bg-[#ECE5F8] border border-[#DDD0F3] flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-[#6E4FA0]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                {user ? `${user.first_name} ${user.last_name}` : "HR Admin"}
              </p>
              <p className="text-[10px] text-[#8C6F45] uppercase tracking-wider font-semibold truncate">
                {user?.role_display || "HR Admin"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8B2635] hover:text-white hover:bg-[#8B2635] border border-[#8B2635]/20 hover:border-transparent transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between w-full h-16 bg-white px-4 fixed top-0 left-0 right-0 z-40 ">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 shadow-2xs flex items-center justify-center">
            <Image
              src="/GALA.png"
              alt="Gala Logo"
              width={100}
              height={30}
              className="h-6 w-auto object-contain"
              priority
            />
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#1A1A1A] hover:text-[#6E4FA0] transition-colors p-1"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-30 flex flex-col justify-between border-t border-[#EAE3D5] animate-fade-in">
          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "text-[#6E4FA0] bg-[#ECE5F8] border border-[#DDD0F3]"
                      : "text-[#6B6862] hover:text-[#1A1A1A] hover:bg-[#F7F4EE]"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-[#6E4FA0]" : "text-[#96928B]"}`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#EAE3D5] bg-[#FAF8F5]">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-3 rounded-2xl bg-white border border-[#EAE3D5]">
              <div className="h-8 w-8 rounded-xl bg-[#ECE5F8] border border-[#DDD0F3] flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-[#6E4FA0]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#1A1A1A]">
                  {user ? `${user.first_name} ${user.last_name}` : "HR Admin"}
                </p>
                <p className="text-[10px] text-[#8C6F45] uppercase tracking-wider font-semibold">
                  {user?.role_display || "HR Admin"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8B2635] hover:bg-[#8B2635]/10 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 min-h-screen pt-16 md:pt-0 flex flex-col">
        <div className="flex-1 p-6 md:p-10 lg:p-12 max-w-7xl w-full mx-auto space-y-10">
          {children}
        </div>
      </main>
    </div>
  );
}
