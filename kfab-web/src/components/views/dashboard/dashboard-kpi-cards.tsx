"use client";

import React from "react";
import {
  Users,
  Layers,
  AlertOctagon,
  Receipt,
  ArrowRight,
  Lock,
  CalendarCheck2,
  Clock,
} from "lucide-react";
import { DashboardKPIData } from "./dashboard-types";

interface DashboardKPICardsProps {
  kpis: DashboardKPIData;
  onNavigateTab: (tab: string) => void;
}

export function DashboardKPICards({ kpis, onNavigateTab }: DashboardKPICardsProps) {
  const { attendance, projects, emergencies, bills } = kpis;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[760px] lg:min-w-0">
        {/* Card 1 — Attendance */}
        <div
          onClick={() => onNavigateTab("attendance")}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md hover:border-[#CBD5E1] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                  <CalendarCheck2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                    Workforce Attendance
                  </h3>
                  <p className="text-[10px] text-[#64748B]">Muster register today</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-[#94A3B8] group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-[#0F172A]">
                  {attendance.presentToday}
                </span>
                <span className="text-xs text-[#64748B] ml-1 font-semibold">
                  / {attendance.totalEmployees} Present
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                  {attendance.turnoutRate}% Turnout
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center bg-[#F8FAFC] p-2 rounded-xl border border-[#F1F5F9]">
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#16A34A] block">Present</span>
                <span className="text-xs font-black text-[#0F172A]">{attendance.presentToday}</span>
              </div>
              <div className="p-1 border-x border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#DC2626] block">Absent</span>
                <span className="text-xs font-black text-[#0F172A]">{attendance.absentToday}</span>
              </div>
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#2563EB] block">On Duty</span>
                <span className="text-xs font-black text-[#0F172A]">{attendance.odToday}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Click to open muster roll</span>
            <span className="font-semibold text-[#0F172A]">{attendance.date}</span>
          </div>
        </div>

        {/* Card 2 — Projects */}
        <div
          onClick={() => onNavigateTab("reports")}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md hover:border-[#CBD5E1] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                    Plant Projects
                  </h3>
                  <p className="text-[10px] text-[#64748B]">Fabrication execution</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-[#94A3B8] group-hover:text-[#0284C7] group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-[#0F172A]">
                  {projects.totalActive}
                </span>
                <span className="text-xs text-[#64748B] ml-1 font-semibold">Active Jobs</span>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                    projects.delayed > 0
                      ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
                      : "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                  }`}
                >
                  {projects.delayed > 0 ? `${projects.delayed} Delayed` : "All On Track"}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center bg-[#F8FAFC] p-2 rounded-xl border border-[#F1F5F9]">
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#16A34A] block">On Track</span>
                <span className="text-xs font-black text-[#0F172A]">{projects.onTrack}</span>
              </div>
              <div className="p-1 border-x border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#DC2626] block">Delayed</span>
                <span className="text-xs font-black text-[#0F172A]">{projects.delayed}</span>
              </div>
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#64748B] block">Finished</span>
                <span className="text-xs font-black text-[#0F172A]">{projects.completed}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Click to inspect Gantt & DPR</span>
            <span className="font-semibold text-[#0F172A]">Stage Tracking</span>
          </div>
        </div>

        {/* Card 3 — Emergencies & Issues */}
        <div
          onClick={() => onNavigateTab("issues")}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md hover:border-[#CBD5E1] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                  <AlertOctagon className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                    Emergencies & Issues
                  </h3>
                  <p className="text-[10px] text-[#64748B]">Shop bottlenecks</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-[#94A3B8] group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-all" />
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-[#0F172A]">
                  {emergencies.openCritical}
                </span>
                <span className="text-xs text-[#DC2626] ml-1 font-bold">Critical Open</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                  {emergencies.highPriority} High Priority
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center bg-[#F8FAFC] p-2 rounded-xl border border-[#F1F5F9]">
              <div className="p-1">
                <span className="text-[10px] font-bold text-[#DC2626] block">Overdue Unresolved</span>
                <span className="text-xs font-black text-[#0F172A]">{emergencies.overdueUnresolved}</span>
              </div>
              <div className="p-1 border-l border-[#E2E8F0]">
                <span className="text-[10px] font-bold text-[#16A34A] block">Resolved Period</span>
                <span className="text-xs font-black text-[#0F172A]">{emergencies.resolvedPeriod}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Click to review tickets</span>
            <span className="font-semibold text-[#0F172A]">Incident Register</span>
          </div>
        </div>

        {/* Card 4 — Bills & Payments */}
        <div
          onClick={() => bills.isAuthorized && onNavigateTab("accounts")}
          className={`rounded-2xl border p-4 shadow-sm transition-all flex flex-col justify-between ${
            bills.isAuthorized
              ? "bg-white border-[#E2E8F0] hover:shadow-md hover:border-[#CBD5E1] cursor-pointer group"
              : "bg-[#F8FAFC] border-[#E2E8F0] cursor-not-allowed opacity-90"
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <div
                  className={`size-8 rounded-lg flex items-center justify-center ${
                    bills.isAuthorized ? "bg-[#EDE9FE] text-[#7C3AED]" : "bg-slate-200 text-[#64748B]"
                  }`}
                >
                  {bills.isAuthorized ? <Receipt className="size-4" /> : <Lock className="size-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                    Bills & Financials
                  </h3>
                  <p className="text-[10px] text-[#64748B]">Accounts position</p>
                </div>
              </div>
              {bills.isAuthorized && (
                <ArrowRight className="size-3.5 text-[#94A3B8] group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all" />
              )}
            </div>

            {bills.isAuthorized ? (
              <>
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-black text-[#16A34A] block">
                      Receivable: {formatCurrency(bills.amountReceivable)}
                    </span>
                    <span className="text-xs font-black text-[#DC2626] block mt-0.5">
                      Payable: {formatCurrency(bills.amountPayable)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center bg-[#F8FAFC] p-2 rounded-xl border border-[#F1F5F9]">
                  <div className="p-1">
                    <span className="text-[10px] font-bold text-[#64748B] block">Pending Bills</span>
                    <span className="text-xs font-black text-[#0F172A]">{bills.billsPending}</span>
                  </div>
                  <div className="p-1 border-l border-[#E2E8F0]">
                    <span className="text-[10px] font-bold text-[#DC2626] block">Overdue Bills</span>
                    <span className="text-xs font-black text-[#0F172A]">{bills.billsOverdue}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="my-6 py-2 text-center">
                <Lock className="size-6 text-[#94A3B8] mx-auto mb-1.5" />
                <span className="text-xs font-bold text-[#64748B] block">Access Restricted</span>
                <span className="text-[11px] text-[#94A3B8]">Financial totals hidden per RBAC</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>{bills.isAuthorized ? "Click to open 3-way match" : "Unauthorized Role"}</span>
            <span className="font-semibold text-[#0F172A]">{bills.isAuthorized ? "Commercial Ledger" : "Restricted"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
