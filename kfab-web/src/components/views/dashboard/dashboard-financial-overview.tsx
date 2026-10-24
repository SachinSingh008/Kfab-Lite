"use client";

import React from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Lock,
  PieChart,
} from "lucide-react";
import { FinancialOverviewData } from "./dashboard-types";

interface DashboardFinancialOverviewProps {
  financialData: FinancialOverviewData;
  onNavigateTab: (tab: string) => void;
}

export function DashboardFinancialOverview({
  financialData,
  onNavigateTab,
}: DashboardFinancialOverviewProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (!financialData.isAuthorized) {
    return (
      <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-8 text-center">
        <Lock className="size-8 text-[#94A3B8] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#0F172A]">Financial Modules Restricted</h3>
        <p className="text-xs text-[#64748B] mt-1">
          Financial accounts, billing positions, and commercial costing are restricted to Admin, Super Admin, and Accounts roles.
        </p>
      </div>
    );
  }

  const { moneyNeeded, moneyComingIn, moneyConsumed, financialMovementTrend = [], projectCosting = [] } = financialData;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#0F172A]">
              Company Financial Position & Cashflow Architecture
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]">
              Strict Accounting Integrity
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Transparently distinguishes money needed, money received, and actual material consumption
          </p>
        </div>

        <button
          onClick={() => onNavigateTab("accounts")}
          className="text-xs font-bold text-[#0F172A] hover:text-[#0F766E] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
        >
          <span>Open Full Commercial Ledger</span>
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>

      {/* 2. Three Primary Financial Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Money Needed */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-3 border-t-4 border-t-[#DC2626]">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                <ArrowDownRight className="size-4" />
              </div>
              <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                Money Needed (Payables)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded">
              Liability Scope
            </span>
          </div>

          <div>
            <span className="text-2xl font-black text-[#DC2626]">
              {formatCurrency(moneyNeeded?.totalPayables || 0)}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-0.5">
              Verified recorded liabilities & upcoming bills
            </span>
          </div>

          <div className="space-y-2 pt-2 text-xs border-t border-[#F1F5F9]">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Outstanding Supplier Bills:</span>
              <span className="font-bold text-[#0F172A]">
                {formatCurrency(moneyNeeded?.outstandingSupplierBills || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Upcoming Material Payables:</span>
              <span className="font-bold text-[#0F172A]">
                {formatCurrency(moneyNeeded?.upcomingMaterialPayables || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Approved Project Funding:</span>
              <span className="font-bold text-[#0F172A]">
                {formatCurrency(moneyNeeded?.approvedProjectFundingReq || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Money Coming In */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-3 border-t-4 border-t-[#16A34A]">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                <ArrowUpRight className="size-4" />
              </div>
              <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                Money Coming In (Receivables)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded">
              Receivables Scope
            </span>
          </div>

          <div>
            <span className="text-2xl font-black text-[#16A34A]">
              {formatCurrency(moneyComingIn?.totalReceivables || 0)}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-0.5">
              Customer billings & verified due amounts
            </span>
          </div>

          <div className="space-y-2 pt-2 text-xs border-t border-[#F1F5F9]">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Customer Receivables:</span>
              <span className="font-bold text-[#0F172A]">
                {formatCurrency(moneyComingIn?.customerReceivables || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Overdue Receivables:</span>
              <span className="font-bold text-[#DC2626]">
                {formatCurrency(moneyComingIn?.overdueReceivables || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Received This Month:</span>
              <span className="font-bold text-[#16A34A]">
                {formatCurrency(moneyComingIn?.paymentsReceivedThisMonth || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Money Consumed */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-3 border-t-4 border-t-[#0284C7]">
          <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
              <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
                Money Consumed (Expenses)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded">
              Usage Scope
            </span>
          </div>

          <div>
            <span className="text-2xl font-black text-[#0F172A]">
              {formatCurrency(moneyConsumed?.totalExpensesRecorded || 0)}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-0.5">
              Material issued to bays + project direct costs
            </span>
          </div>

          <div className="space-y-2 pt-2 text-xs border-t border-[#F1F5F9]">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Material Issue Cost:</span>
              <span className="font-bold text-[#0F172A]">
                {formatCurrency(moneyConsumed?.materialConsumptionCost || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Direct Project Expenses:</span>
              <span className="font-bold text-[#0F172A]">
                {formatCurrency(moneyConsumed?.directProjectExpenses || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Purchases (Separate Basis):</span>
              <span className="font-bold text-[#64748B]">
                {formatCurrency(moneyConsumed?.inventoryPurchases || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Financial Movement Trends & Project-Wise Costing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Movement Chart */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-sm font-black text-[#0F172A]">
                Cashflow & Material Cost Comparison
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Money In vs Money Out vs Material Consumption
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {financialMovementTrend.map((row, idx) => {
              const max = Math.max(row.moneyComingIn, row.moneyPaidOut, row.materialCost, 1);
              const inPct = (row.moneyComingIn / max) * 100;
              const outPct = (row.moneyPaidOut / max) * 100;
              const matPct = (row.materialCost / max) * 100;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                    <span className="font-mono text-[#64748B]">{row.period}</span>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-[#16A34A]">In: {formatCurrency(row.moneyComingIn)}</span>
                      <span className="text-[#DC2626]">Out: {formatCurrency(row.moneyPaidOut)}</span>
                      <span className="text-[#0284C7]">Mat: {formatCurrency(row.materialCost)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div className="bg-[#16A34A] h-full rounded-full" style={{ width: `${inPct}%` }} />
                    <div className="bg-[#DC2626] h-full rounded-full" style={{ width: `${outPct}%` }} />
                    <div className="bg-[#0284C7] h-full rounded-full" style={{ width: `${matPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
            <span>Accounting basis: Double-entry verified ledger</span>
            <span className="font-bold text-[#16A34A]">Balanced Cashflow</span>
          </div>
        </div>

        {/* Project-Wise Costing Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-sm font-black text-[#0F172A]">
                Project Costing & Budget Control
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Approved budget vs actual booked expenses
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold text-[11px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-2.5 pl-3">Project</th>
                  <th className="p-2.5 text-right">Budget</th>
                  <th className="p-2.5 text-right">Cost</th>
                  <th className="p-2.5 text-right">Remaining</th>
                  <th className="p-2.5 pr-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {projectCosting.map((p) => (
                  <tr key={p.projectId} className="hover:bg-slate-50">
                    <td className="p-2.5 pl-3 font-bold text-[#0F172A]">{p.projectName}</td>
                    <td className="p-2.5 text-right font-mono text-[#64748B]">{formatCurrency(p.budget)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#0F172A]">{formatCurrency(p.recordedCost)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#16A34A]">{formatCurrency(p.remainingBudget)}</td>
                    <td className="p-2.5 pr-3 text-center">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                          p.costVarianceStatus === "OVER_BUDGET"
                            ? "bg-[#FEE2E2] text-[#DC2626]"
                            : "bg-[#DCFCE7] text-[#16A34A]"
                        }`}
                      >
                        {p.costVarianceStatus.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
