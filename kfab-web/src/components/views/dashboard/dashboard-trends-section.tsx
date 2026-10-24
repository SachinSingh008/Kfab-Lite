"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { ProjectSummaryRow } from "./dashboard-types";

interface DashboardTrendsSectionProps {
  projectProgressTrend: Array<{ date: string; actualProgress: number; plannedProgress: number }>;
  workforceTrend: Array<{ date: string; present: number; absent: number; od: number }>;
  projectSummaryRows: ProjectSummaryRow[];
  onOpenProject: (projectId: string) => void;
}

export function DashboardTrendsSection({
  projectProgressTrend,
  workforceTrend,
  projectSummaryRows,
  onOpenProject,
}: DashboardTrendsSectionProps) {
  const [trendPeriod, setTrendPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const delayedCount = projectSummaryRows.filter((p) => p.isDelayed).length;

  return (
    <div className="space-y-6">
      {/* 1. Dual Line Trends Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Trend */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1F5F9] gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]">
                  Project Progress Trend vs Schedule Baseline
                </h3>
                <p className="text-[11px] text-[#64748B]">Actual achievement vs planned milestones</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-[#0284C7]">
                <span className="size-2 rounded-full bg-[#0284C7]" /> Actual
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#94A3B8]">
                <span className="size-2 rounded-full bg-[#CBD5E1]" /> Planned Baseline
              </span>
            </div>
          </div>

          {/* Progress Curve Bars/Graph */}
          <div className="space-y-3 pt-2">
            {projectProgressTrend.map((pt, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#0F172A]">
                  <span className="text-[#64748B]">{pt.date}</span>
                  <div className="flex gap-3">
                    <span className="text-[#0284C7]">Actual: {pt.actualProgress}%</span>
                    <span className="text-[#94A3B8]">Target: {pt.plannedProgress}%</span>
                  </div>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden flex relative">
                  {/* Planned target indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                    style={{ left: `${pt.plannedProgress}%` }}
                    title={`Target: ${pt.plannedProgress}%`}
                  />
                  {/* Actual progress fill */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pt.actualProgress >= pt.plannedProgress ? "bg-[#0284C7]" : "bg-[#F59E0B]"
                    }`}
                    style={{ width: `${pt.actualProgress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
            <span>Measurement: Physical milestone verification</span>
            <span className="font-bold text-[#0F172A]">Authoritative Stage Log</span>
          </div>
        </div>

        {/* Workforce Attendance Trend */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1F5F9] gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                <Users className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]">
                  Workforce Strength & Turnout Trend
                </h3>
                <p className="text-[11px] text-[#64748B]">Daily plant personnel reporting</p>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] text-xs">
              {(["daily", "weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  className={`px-2 py-0.5 rounded capitalize text-[10px] font-bold cursor-pointer ${
                    trendPeriod === p ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Workforce Daily Stack */}
          <div className="space-y-2.5 pt-2">
            {workforceTrend.map((w, idx) => {
              const total = w.present + w.absent + w.od || 1;
              const presentPct = (w.present / total) * 100;
              const absentPct = (w.absent / total) * 100;
              const odPct = (w.od / total) * 100;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#0F172A] w-12">{w.date}</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#16A34A]">{w.present} Present</span>
                      <span className="text-[#DC2626]">{w.absent} Absent</span>
                      <span className="text-[#2563EB]">{w.od} OD</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div style={{ width: `${presentPct}%` }} className="bg-[#16A34A] h-full" />
                    <div style={{ width: `${absentPct}%` }} className="bg-[#DC2626] h-full" />
                    <div style={{ width: `${odPct}%` }} className="bg-[#2563EB] h-full" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
            <span>Live sync from Mobile Muster & Biometrics</span>
            <span className="font-bold text-[#16A34A]">Authoritative Register</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Project Summary Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#0F172A]">
                Company Project Execution Summary
              </h3>
              {delayedCount > 0 && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                  {delayedCount} Delayed Jobs (Prioritized to Top)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Click any project row to inspect full stage Gantt tracking and daily fabrication reports
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <th className="p-3 pl-4">Project Name</th>
                <th className="p-3">Supervisor</th>
                <th className="p-3 text-right">Actual Progress</th>
                <th className="p-3 text-right">Target Baseline</th>
                <th className="p-3">End Date</th>
                <th className="p-3 text-right">Delay</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {projectSummaryRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748B]">
                    No project records found for the selected company scope.
                  </td>
                </tr>
              ) : (
                projectSummaryRows.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      className={`hover:bg-[#F8FAFC] cursor-pointer transition-colors ${
                        p.isDelayed ? "bg-[#FEF2F2]/40" : ""
                      }`}
                    >
                      <td className="p-3 pl-4">
                        <span className="font-bold text-[#0F172A] block">{p.projectName}</span>
                        <span className="text-[11px] text-[#64748B]">{p.customerName}</span>
                      </td>
                      <td className="p-3 font-semibold text-[#334155]">{p.supervisorName}</td>
                      <td className="p-3 text-right">
                        <span className="font-black text-[#0F172A]">{p.progressPercent}%</span>
                      </td>
                      <td className="p-3 text-right text-[#64748B] font-medium">
                        {p.plannedPercent}%
                      </td>
                      <td className="p-3 text-[#334155] font-mono text-[11px]">{p.endDate}</td>
                      <td className="p-3 text-right">
                        {p.isDelayed ? (
                          <span className="font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded text-[11px]">
                            +{p.delayDays}d Overdue
                          </span>
                        ) : (
                          <span className="text-[#16A34A] font-bold text-[11px]">On Time</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            p.status === "COMPLETED"
                              ? "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                              : p.isDelayed
                              ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
                              : "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProject(p.id);
                          }}
                          className="p-1 rounded hover:bg-slate-200 text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                          title="Open Project Details"
                        >
                          <ExternalLink className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
