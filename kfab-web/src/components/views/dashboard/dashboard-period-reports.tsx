"use client";

import React, { useState } from "react";
import {
  Calendar,
  Layers,
  Boxes,
  Receipt,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { PeriodReportsData, ProjectSummaryRow, MaterialIssueRow } from "./dashboard-types";

interface DashboardPeriodReportsProps {
  periodReports: PeriodReportsData;
  onNavigateTab: (tab: string) => void;
  isFinancialAuthorized: boolean;
}

export function DashboardPeriodReports({
  periodReports,
  onNavigateTab,
  isFinancialAuthorized,
}: DashboardPeriodReportsProps) {
  const [activeTab, setActiveTab] = useState<"today" | "this_week" | "this_month">("today");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-5">
      {/* 1. Header with Period Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold">
              <Calendar className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0F172A]">
                Comprehensive Operations Reports & Chart Annexures
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Granular drill-down tables for attendance, project milestones, material issues and bills
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-xl border border-[#E2E8F0]">
          {(["today", "this_week", "this_month"] as const).map((tabKey) => {
            const isSelected = activeTab === tabKey;
            const label = tabKey === "today" ? "Today" : tabKey === "this_week" ? "This Week" : "This Month";
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TAB CONTENT: TODAY */}
      {activeTab === "today" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Today KPI Highlights Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Shop Floor Output</span>
              <span className="text-lg font-black text-[#0F172A]">
                {periodReports.today.workCompletedTodayTonnage} Tons
              </span>
              <span className="text-[10px] text-[#16A34A] block mt-0.5 font-bold">Fabricated Today</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Material Issued Cost</span>
              <span className="text-lg font-black text-[#0F172A]">
                {formatCurrency(periodReports.today.materialIssuedCostToday)}
              </span>
              <span className="text-[10px] text-[#64748B] block mt-0.5">Floor Requisitions</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">New Issues Raised</span>
              <span className="text-lg font-black text-[#0F172A]">
                {periodReports.today.newIssuesToday}
              </span>
              <span className="text-[10px] text-[#D97706] block mt-0.5 font-bold">Requires Action</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Muster Status</span>
              <span className="text-lg font-black text-[#16A34A]">Locked & Synced</span>
              <span className="text-[10px] text-[#64748B] block mt-0.5 font-mono">08:00 - 17:00 IST</span>
            </div>
          </div>

          {/* Annexure Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Annexure 1: Today Attendance */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="bg-[#F8FAFC] p-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-black text-[#0F172A]">Attendance Annexure</span>
                <button
                  onClick={() => onNavigateTab("attendance")}
                  className="text-[11px] text-[#0284C7] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Attendance</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F1F5F9] text-[#64748B] font-bold text-[11px]">
                    <tr>
                      <th className="p-2 pl-3">Employee</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Overtime</th>
                      <th className="p-2 pr-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {periodReports.today.attendanceAnnexure.map((att, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 pl-3 font-bold text-[#0F172A]">{att.employeeName}</td>
                        <td className="p-2">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              att.status === "PRESENT"
                                ? "bg-[#DCFCE7] text-[#16A34A]"
                                : att.status === "OD"
                                ? "bg-[#E0F2FE] text-[#0284C7]"
                                : "bg-[#FEE2E2] text-[#DC2626]"
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono">{att.overtimeHours > 0 ? `+${att.overtimeHours}h` : "—"}</td>
                        <td className="p-2 pr-3 text-[11px] text-[#64748B] truncate max-w-[120px]">
                          {att.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Annexure 2: Today Material Consumption */}
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="bg-[#F8FAFC] p-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-black text-[#0F172A]">Material Issue Annexure</span>
                <button
                  onClick={() => onNavigateTab("inventory")}
                  className="text-[11px] text-[#0284C7] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>View Stock Ledger</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F1F5F9] text-[#64748B] font-bold text-[11px]">
                    <tr>
                      <th className="p-2 pl-3">Material Item</th>
                      <th className="p-2">Department</th>
                      <th className="p-2 text-right">Quantity</th>
                      <th className="p-2 pr-3 text-right">Issue Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {periodReports.today.materialAnnexure.map((mat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 pl-3">
                          <span className="font-bold text-[#0F172A] block">{mat.itemName}</span>
                          <span className="text-[10px] font-mono text-[#64748B]">{mat.itemCode}</span>
                        </td>
                        <td className="p-2 text-[#334155]">{mat.projectOrDept}</td>
                        <td className="p-2 text-right font-bold text-[#0F172A]">
                          {mat.quantity} {mat.unit}
                        </td>
                        <td className="p-2 pr-3 text-right font-black text-[#0F172A]">
                          {formatCurrency(mat.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: THIS WEEK */}
      {activeTab === "this_week" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Weekly Fabrication Tonnage</span>
              <span className="text-xl font-black text-[#0F172A]">{periodReports.this_week.weeklyTonnage} Tons</span>
              <span className="text-[10px] text-[#16A34A] block mt-0.5 font-bold">Target 95.0 T</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Weekly Turnout Average</span>
              <span className="text-xl font-black text-[#0F172A]">{periodReports.this_week.weeklyTurnoutRate}%</span>
              <span className="text-[10px] text-[#0284C7] block mt-0.5">High Stability</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Issues Resolved This Week</span>
              <span className="text-xl font-black text-[#16A34A]">{periodReports.this_week.issuesResolvedCount} Tickets</span>
              <span className="text-[10px] text-[#64748B] block mt-0.5">Zero Bottlenecks Remaining</span>
            </div>
          </div>

          {/* Project Progress Annexure for the Week */}
          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="bg-[#F8FAFC] p-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs font-black text-[#0F172A]">Weekly Project Milestones Annexure</span>
              <button
                onClick={() => onNavigateTab("reports")}
                className="text-[11px] text-[#0284C7] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Reports</span>
                <ExternalLink className="size-3" />
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] text-[#64748B] font-bold text-[11px]">
                <tr>
                  <th className="p-2.5 pl-4">Project</th>
                  <th className="p-2.5">Supervisor</th>
                  <th className="p-2.5 text-right">Actual Progress</th>
                  <th className="p-2.5 text-right">Target Baseline</th>
                  <th className="p-2.5">End Date</th>
                  <th className="p-2.5 pr-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {periodReports.this_week.projectAnnexure.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-2.5 pl-4 font-bold text-[#0F172A]">{p.projectName}</td>
                    <td className="p-2.5 text-[#334155]">{p.supervisorName}</td>
                    <td className="p-2.5 text-right font-black text-[#0F172A]">{p.progressPercent}%</td>
                    <td className="p-2.5 text-right text-[#64748B]">{p.plannedPercent}%</td>
                    <td className="p-2.5 font-mono text-[11px]">{p.endDate}</td>
                    <td className="p-2.5 pr-4 text-center">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          p.isDelayed ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#DCFCE7] text-[#16A34A]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: THIS MONTH */}
      {activeTab === "this_month" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Monthly Tonnage Completed</span>
              <span className="text-xl font-black text-[#0F172A]">{periodReports.this_month.monthlyTonnage} Tons</span>
              <span className="text-[10px] text-[#16A34A] block mt-0.5 font-bold">103% of Target</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Monthly Average Turnout</span>
              <span className="text-xl font-black text-[#0F172A]">{periodReports.this_month.monthlyTurnoutRate}%</span>
              <span className="text-[10px] text-[#0284C7] block mt-0.5 font-bold">Plant Wide</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] block">Total Material Consumption</span>
              <span className="text-xl font-black text-[#0F172A]">
                {formatCurrency(periodReports.this_month.totalConsumptionCost)}
              </span>
              <span className="text-[10px] text-[#64748B] block mt-0.5">Authoritative Inventory</span>
            </div>
          </div>

          {/* Top Consumed Items Annexure */}
          <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="bg-[#F8FAFC] p-3 border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="text-xs font-black text-[#0F172A]">Top Consumed Materials Annexure</span>
              <button
                onClick={() => onNavigateTab("inventory")}
                className="text-[11px] text-[#0284C7] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Inventory Analytics</span>
                <ExternalLink className="size-3" />
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F5F9] text-[#64748B] font-bold text-[11px]">
                <tr>
                  <th className="p-2.5 pl-4">Item Description</th>
                  <th className="p-2.5">Item Code</th>
                  <th className="p-2.5 text-right">Quantity Consumed</th>
                  <th className="p-2.5 pr-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {periodReports.this_month.topItems?.byCost?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 pl-4 font-bold text-[#0F172A]">{item.itemName}</td>
                    <td className="p-2.5 font-mono text-[11px] text-[#64748B]">{item.itemCode}</td>
                    <td className="p-2.5 text-right font-semibold text-[#0F172A]">
                      {item.totalQuantity} {item.unit}
                    </td>
                    <td className="p-2.5 pr-4 text-right font-black text-[#0F172A]">
                      {formatCurrency(item.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
