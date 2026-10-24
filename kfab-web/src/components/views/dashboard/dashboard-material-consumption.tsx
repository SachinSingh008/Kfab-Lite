"use client";

import React, { useState } from "react";
import {
  Boxes,
  Search,
  Filter,
  ArrowRight,
  Layers,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Wrench,
  ExternalLink,
} from "lucide-react";
import { MaterialIssueRow } from "./dashboard-types";

interface DashboardMaterialConsumptionProps {
  materialData: {
    totalIssuedQuantity: number;
    totalConsumptionCost: number;
    topConsumedItems: {
      byQuantity: Array<{ itemName: string; itemCode: string; unit: string; totalQuantity: number; totalCost: number }>;
      byCost: Array<{ itemName: string; itemCode: string; unit: string; totalQuantity: number; totalCost: number }>;
    };
    lowStockCount: number;
    categories: Array<{ category: string; label: string; itemCount: number; stockValue: number; consumptionCost: number; transactionCount: number }>;
    issueAccountabilityRows: MaterialIssueRow[];
    totalAccountabilityRecords: number;
  };
  onNavigateTab: (tab: string) => void;
}

export function DashboardMaterialConsumption({
  materialData,
  onNavigateTab,
}: DashboardMaterialConsumptionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredIssues = materialData.issueAccountabilityRows.filter((row) => {
    const matchSearch =
      row.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.projectOrDept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === "ALL" || row.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-6">
      {/* 1. Section Header & KPI Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Boxes className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0F172A]">
                Material Consumption & Issue Analysis
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Shop floor consumption ledger, category breakdowns, and individual worker issue accountability
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("inventory")}
          className="text-xs font-bold text-[#0F172A] hover:text-[#0F766E] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
        >
          <span>Open Inventory Workspace</span>
          <ExternalLink className="size-3.5" />
        </button>
      </div>

      {/* 2. Top-Level Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-[11px] font-bold text-[#64748B] block">Total Material Issued</span>
          <span className="text-xl font-black text-[#0F172A] mt-1 block">
            {materialData.totalIssuedQuantity} Units
          </span>
          <span className="text-[10px] text-[#16A34A] block mt-0.5 font-bold">Approved Requisitions</span>
        </div>

        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-[11px] font-bold text-[#64748B] block">Total Consumption Cost</span>
          <span className="text-xl font-black text-[#0F172A] mt-1 block">
            {formatCurrency(materialData.totalConsumptionCost)}
          </span>
          <span className="text-[10px] text-[#64748B] block mt-0.5 font-medium">Billed to Job Orders</span>
        </div>

        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-[11px] font-bold text-[#64748B] block">Critical Low Stock</span>
          <span className="text-xl font-black text-[#DC2626] mt-1 block">
            {materialData.lowStockCount} Items
          </span>
          <span className="text-[10px] text-[#DC2626] block mt-0.5 font-bold">Below Safety Level</span>
        </div>

        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <span className="text-[11px] font-bold text-[#64748B] block">Accountability Records</span>
          <span className="text-xl font-black text-[#0284C7] mt-1 block">
            {materialData.totalAccountabilityRecords} Tracked
          </span>
          <span className="text-[10px] text-[#64748B] block mt-0.5">Worker Signoffs</span>
        </div>
      </div>

      {/* 3. Category Breakdown & Top Consumed Items Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
            Material Issued by Category
          </h3>
          <div className="space-y-2.5">
            {materialData.categories.map((cat, idx) => {
              const maxVal = Math.max(...materialData.categories.map((c) => c.consumptionCost), 1);
              const pct = (cat.consumptionCost / maxVal) * 100;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0F172A]">
                    <span>{cat.label}</span>
                    <span className="text-[#0284C7]">{formatCurrency(cat.consumptionCost)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-[#0284C7] h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Consumed Items */}
        <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
            Top Consumed Items (by Cost Basis)
          </h3>
          <div className="space-y-2">
            {materialData.topConsumedItems?.byCost?.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] text-xs">
                <div>
                  <span className="font-bold text-[#0F172A] block">{item.itemName}</span>
                  <span className="text-[10px] font-mono text-[#64748B]">{item.itemCode}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#0F172A] block">{formatCurrency(item.totalCost)}</span>
                  <span className="text-[10px] text-[#64748B]">{item.totalQuantity} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. MANDATORY ACCOUNTABILITY SECTION: Material Issued to Whom Table */}
      <div className="border border-[#E2E8F0] rounded-xl overflow-hidden space-y-3">
        <div className="bg-[#F8FAFC] p-3 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">
              Material Issued to Whom — Accountability Register
            </h3>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Tracks worker name, issuing supervisor, shop bay, and return status for machinery/tools
            </p>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="size-3.5 absolute left-2.5 top-2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search worker or item..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-[#CBD5E1] bg-white focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-[#CBD5E1] rounded-lg px-2.5 py-1 bg-white font-bold text-[#0F172A] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="CONSUMABLES_TACKLES">Consumables & Tackles</option>
              <option value="MACHINES_TOOLS">Machines & Tools</option>
              <option value="CLOTHES_SAFETY">Clothes & Safety</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F1F5F9] text-[#64748B] font-bold text-[11px] border-b border-[#E2E8F0]">
              <tr>
                <th className="p-2.5 pl-4">Issue Date</th>
                <th className="p-2.5">Item Code & Name</th>
                <th className="p-2.5 text-right">Quantity</th>
                <th className="p-2.5">Issued To (Worker)</th>
                <th className="p-2.5">Project / Bay</th>
                <th className="p-2.5">Issued By</th>
                <th className="p-2.5 text-center">Type / Return Status</th>
                <th className="p-2.5 pr-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-[#64748B]">
                    No material issue records match the search filter.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 pl-4 font-mono text-[11px] text-[#64748B]">{iss.date}</td>
                    <td className="p-2.5">
                      <span className="font-bold text-[#0F172A] block">{iss.itemName}</span>
                      <span className="text-[10px] font-mono text-[#64748B]">{iss.itemCode}</span>
                    </td>
                    <td className="p-2.5 text-right font-black text-[#0F172A]">
                      {iss.quantity} {iss.unit}
                    </td>
                    <td className="p-2.5 font-bold text-[#0F172A]">{iss.employeeName}</td>
                    <td className="p-2.5 text-[#334155]">{iss.projectOrDept}</td>
                    <td className="p-2.5 text-[#64748B]">{iss.issuedBy}</td>
                    <td className="p-2.5 text-center">
                      {iss.isReturnable ? (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            iss.returnStatus === "RETURNED"
                              ? "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                              : iss.returnStatus === "OVERDUE"
                              ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
                              : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                          }`}
                        >
                          {iss.returnStatus} (Tool)
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                          Consumable
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 pr-4 text-right font-black text-[#0F172A]">
                      {formatCurrency(iss.totalCost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
