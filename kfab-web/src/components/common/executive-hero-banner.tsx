"use client";

import React from "react";
import {
  CalendarCheck,
  Truck,
  BookOpen,
  Building2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AppUser } from "@/lib/auth-store";

interface ExecutiveHeroBannerProps {
  currentUser?: AppUser | null;
  onNavigateTab: (tab: any) => void;
  onOpenQuickInward?: () => void;
}

export function ExecutiveHeroBanner({
  currentUser,
  onNavigateTab,
  onOpenQuickInward,
}: ExecutiveHeroBannerProps) {
  const role = currentUser?.role || "ADMIN";
  const isSupervisor = role === "SUPERVISOR";
  const isAccountant = role === "ACCOUNTANT";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] shadow-kfab p-6 bg-industrial-grid">
      {/* Decorative Subtle Scrims */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-slate-100/50 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Title & Corporate Context */}
        <div className="max-w-2xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-[#0F172A] border border-slate-200">
              <Sparkles className="size-3 text-[#F59E0B]" />
              KFAB360 MANUFACTURING OS
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
              <ShieldCheck className="size-3" />
              IST Date-Lock Verified
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            {isAccountant
              ? "Commercial Reconciliations & Stock Valuation Command"
              : isSupervisor
              ? "Fabrication Bay Muster & Shop Floor Operations Command"
              : "Executive Operations Command & Multi-Bay Fabrication Intelligence"}
          </h2>

          <p className="text-xs text-[#64748B] leading-relaxed">
            Synchronized production metrics across fabrication shop floor, warehouse raw material inventory,
            and real-time accounts ledger for KFab Infra Project Pvt. Ltd.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-[#64748B]" />
              Facility: <strong className="text-[#0F172A]">Jejuri MIDC, Pune</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-[#F59E0B]" />
              Shift: <strong className="text-[#0F172A]">General (08:00 - 17:00 IST)</strong>
            </span>
          </div>
        </div>

        {/* Right Column: High-Priority Action Buttons */}
        <div className="flex flex-wrap lg:flex-col sm:flex-row gap-2.5 shrink-0">
          <button
            onClick={() => {
              if (onOpenQuickInward) onOpenQuickInward();
              else onNavigateTab("supplies");
            }}
            className="px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Truck className="size-4 text-[#F59E0B]" />
            <span>Record Inward Challan</span>
            <ArrowRight className="size-3.5" />
          </button>

          <button
            onClick={() => onNavigateTab("attendance")}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#0F172A] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CalendarCheck className="size-4 text-slate-500" />
            <span>Open Attendance Muster</span>
          </button>
        </div>
      </div>
    </div>
  );
}
