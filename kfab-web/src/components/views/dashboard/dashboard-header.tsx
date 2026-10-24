"use client";

import React from "react";
import { Building2, Calendar, RefreshCw, Filter, Layers } from "lucide-react";
import { DashboardPeriod } from "./dashboard-types";
import { AppUser } from "@/lib/auth-store";

interface DashboardHeaderProps {
  currentUser: AppUser | null;
  companies: Array<{ id: string; name: string; code: string }>;
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  period: DashboardPeriod;
  onSelectPeriod: (period: DashboardPeriod) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  projects?: Array<{ id: string; projectName: string }>;
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DashboardHeader({
  currentUser,
  companies,
  selectedCompanyId,
  onSelectCompany,
  period,
  onSelectPeriod,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  projects = [],
  selectedProjectId = "",
  onSelectProject,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isSupervisor = currentUser?.role === "SUPERVISOR";

  const periodOptions: Array<{ id: DashboardPeriod; label: string }> = [
    { id: "today", label: "Today" },
    { id: "this_week", label: "This Week" },
    { id: "this_month", label: "This Month" },
    { id: "this_year", label: "This Year" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Scope */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
              Executive Plant Operations Dashboard
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
              Live Authoritative
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time workforce attendance, project delay metrics, material consumption and financial position
          </p>
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-[#0F766E]" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh Live Data"}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Company Selector */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1">
            <Building2 className="size-3.5 text-[#64748B]" />
            <select
              value={selectedCompanyId}
              onChange={(e) => onSelectCompany(e.target.value)}
              disabled={isSupervisor}
              className="bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer disabled:cursor-not-allowed"
            >
              {isSuperAdmin && <option value="all">Consolidated (All Authorized Companies)</option>}
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Project Selector (if projects provided) */}
          {projects.length > 0 && onSelectProject && (
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1">
              <Layers className="size-3.5 text-[#64748B]" />
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer"
              >
                <option value="">All Scoped Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Date Pickers */}
          {period === "custom" && (
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2 py-1">
              <Calendar className="size-3 text-[#64748B]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-[#0F172A] focus:outline-none"
              />
              <span className="text-xs text-[#94A3B8]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-[#0F172A] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Quick Period Buttons */}
        <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
          {periodOptions.map((opt) => {
            const isSelected = period === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onSelectPeriod(opt.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
