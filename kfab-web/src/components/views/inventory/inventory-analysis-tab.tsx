"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Boxes,
  Truck,
  HardHat,
  AlertTriangle,
  Building2,
  Users,
  Wrench,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  AnalysisSummaryDTO,
  MonthlyTrendDTO,
  CategoryAnalysisDTO,
  TopConsumedItemsDTO,
  DepartmentUsageDTO,
  EmployeeUsageDTO,
  LowStockItemDTO,
  MachineToolStatusDTO,
} from "@/lib/inventory-api";

interface InventoryAnalysisTabProps {
  summary: AnalysisSummaryDTO | null;
  monthlyTrends: MonthlyTrendDTO[];
  categoryAnalysis: CategoryAnalysisDTO[];
  topItems: TopConsumedItemsDTO | null;
  departmentUsage: DepartmentUsageDTO[];
  employeeUsage: EmployeeUsageDTO[];
  lowStockItems: LowStockItemDTO[];
  machineStatus: MachineToolStatusDTO | null;
  dateFilter: { from?: string; to?: string };
  onDateFilterChange: (filter: { from?: string; to?: string }) => void;
  onRefresh: () => void;
}

export function InventoryAnalysisTab({
  summary,
  monthlyTrends,
  categoryAnalysis,
  topItems,
  departmentUsage,
  employeeUsage,
  lowStockItems,
  machineStatus,
  dateFilter,
  onDateFilterChange,
  onRefresh,
}: InventoryAnalysisTabProps) {
  const [topSortMode, setTopSortMode] = useState<"cost" | "quantity">("cost");

  const totalConsumption = summary?.totalConsumptionCost ?? 0;
  const totalPurchase = summary?.monthlyPurchaseCost ?? 0;
  const activeIssues = summary?.issuedItemsCount ?? 0;
  const lowStockCount = summary?.lowStockCount ?? lowStockItems.length;

  return (
    <div className="space-y-6">
      {/* 1. Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Consumption Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Consumption Cost
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{totalConsumption.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Shop floor material usage value</p>
        </div>

        {/* Purchase Inward Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Recent Purchase Inward
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{totalPurchase.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            Store replenishment inflows
          </p>
        </div>

        {/* Active Issues / Custody */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              In Floor Custody
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardHat className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {activeIssues}
            </span>
            <span className="text-xs font-semibold text-slate-500">items</span>
          </div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">Handed over to workforce</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Critical Reorders
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black tracking-tight ${lowStockCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {lowStockCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">items</span>
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Below minimum buffer</p>
        </div>
      </div>

      {/* 2. Monthly Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Cost Trends</h3>
              <p className="text-[11px] text-slate-500">Consumption cost vs inward purchase</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
                Consumption
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                Inward Purchase
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {monthlyTrends.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No monthly trend data recorded</p>
            ) : (
              monthlyTrends.map((t) => {
                const maxVal = Math.max(
                  ...monthlyTrends.map((x) => Math.max(x.consumptionCost, x.purchaseCost)),
                  1
                );
                const consumPercent = Math.min(100, Math.max(4, (t.consumptionCost / maxVal) * 100));
                const purchPercent = Math.min(100, Math.max(4, (t.purchaseCost / maxVal) * 100));

                return (
                  <div key={t.month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{t.month}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-blue-600 font-semibold">
                          ₹{t.consumptionCost.toLocaleString("en-IN")}
                        </span>
                        <span className="text-emerald-600 font-semibold">
                          ₹{t.purchaseCost.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    {/* Double Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${consumPercent}%` }}
                        />
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${purchPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Breakdown Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Category Cost & Valuation</h3>
            <p className="text-[11px] text-slate-500">Asset value and consumption split</p>
          </div>

          <div className="mt-4 space-y-4">
            {categoryAnalysis.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No category analysis data</p>
            ) : (
              categoryAnalysis.map((cat) => {
                const totalVal = categoryAnalysis.reduce((acc, c) => acc + (c.stockValue || 0), 0) || 1;
                const percent = Math.min(100, Math.max(5, (cat.stockValue / totalVal) * 100));

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{cat.label}</span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          ({cat.itemCount} SKUs)
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{cat.stockValue.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-600"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Consumed: ₹{cat.consumptionCost.toLocaleString("en-IN")}</span>
                      <span>{percent.toFixed(1)}% of total assets</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. Top 10 Consumed Items */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top 10 High Consumption Items</h3>
            <p className="text-[11px] text-slate-500">Identify heavy shop floor consumption drivers</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTopSortMode("cost")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                topSortMode === "cost" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              By Total Cost (₹)
            </button>
            <button
              onClick={() => setTopSortMode("quantity")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                topSortMode === "quantity" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              By Units Consumed
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4">Quantity Consumed</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const list =
                  topSortMode === "cost"
                    ? topItems?.byCost || []
                    : topItems?.byQuantity || [];

                if (list.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No consumption data recorded yet
                      </td>
                    </tr>
                  );
                }

                return list.map((item, idx) => (
                  <tr key={item.itemCode} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-400 w-8">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{item.itemCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.itemName}</td>
                    <td className="py-3 px-4 font-bold text-slate-700">
                      {item.totalQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                      ₹{item.totalCost.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Department Usage & Machinery Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Usage */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Department Usage Breakdown</h3>
            <p className="text-[11px] text-slate-500">Fabrication, Welding, Assembly cost attribution</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-3">Units Used</th>
                  <th className="py-2.5 px-3">Transactions</th>
                  <th className="py-2.5 px-4 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentUsage.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No department usage logs
                    </td>
                  </tr>
                ) : (
                  departmentUsage.map((dep) => (
                    <tr key={dep.department} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{dep.department}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{dep.totalQuantity}</td>
                      <td className="py-2.5 px-3 text-slate-500">{dep.transactionCount}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{dep.totalCost.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Machinery & Equipment Fleet Condition */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Machine & Tool Fleet Health</h3>
              <p className="text-[11px] text-slate-500">Condition telemetry and readiness</p>
            </div>
            <span className="font-bold text-xs text-slate-700">
              {machineStatus?.totalMachines ?? 0} Total Units
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                Operational
              </span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                {machineStatus?.operationalCount ?? 0}
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Ready for deployment</p>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Activity className="size-3" />
                Maintenance
              </span>
              <p className="text-2xl font-black text-amber-800 mt-1">
                {machineStatus?.maintenanceCount ?? 0}
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">Under workshop repair</p>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <XCircle className="size-3" />
                Damaged
              </span>
              <p className="text-2xl font-black text-rose-800 mt-1">
                {machineStatus?.damagedCount ?? 0}
              </p>
              <p className="text-[10px] text-rose-600 mt-0.5">Scrap / overhaul required</p>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <HardHat className="size-3" />
                In Floor Custody
              </span>
              <p className="text-2xl font-black text-indigo-800 mt-1">
                {machineStatus?.inUseCount ?? 0}
              </p>
              <p className="text-[10px] text-indigo-600 mt-0.5">Active worker handovers</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Low Stock Replenishment Action Table */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Critical Low Stock & Replenishment Recommended
                </h3>
                <p className="text-[11px] text-amber-700">
                  The following items are below minimum threshold and require immediate purchase indent
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-200 text-amber-900">
              {lowStockItems.length} Needs Reorder
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Minimum Buffer</th>
                  <th className="py-3 px-3">Shortfall Deficit</th>
                  <th className="py-3 px-3">Preferred Supplier</th>
                  <th className="py-3 px-4 text-right">Est. Reorder Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.map((item) => (
                  <tr key={item.itemCode} className="hover:bg-amber-50/30">
                    <td className="py-3 px-4 font-mono font-bold text-amber-800">{item.itemCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.itemName}</td>
                    <td className="py-3 px-3 font-bold text-rose-600">
                      {item.currentStock ?? item.currentQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">
                      {item.minimumStock} {item.unit}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-700">
                      +{item.shortfall ?? item.deficit} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.supplier || "Standard PO"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{(item.estimatedCost ?? item.estimatedReplenishmentCost ?? 0).toLocaleString("en-IN")}
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
