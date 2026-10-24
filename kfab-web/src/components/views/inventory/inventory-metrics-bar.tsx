"use client";

import React from "react";
import {
  Boxes,
  DollarSign,
  AlertTriangle,
  XCircle,
  HardHat,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { InventoryItemDTO, AnalysisSummaryDTO } from "@/lib/inventory-api";

interface InventoryMetricsBarProps {
  items: InventoryItemDTO[];
  analysisSummary: AnalysisSummaryDTO | null;
  activeIssuesCount: number;
}

export function InventoryMetricsBar({
  items,
  analysisSummary,
  activeIssuesCount,
}: InventoryMetricsBarProps) {
  // Compute fallback metrics if analysis summary hasn't loaded yet
  const totalItems = analysisSummary?.totalItems ?? items.length;
  const totalValue =
    analysisSummary?.totalStockValue ??
    items.reduce((acc, it) => acc + (it.currentStock || 0) * (it.purchasePrice || 0), 0);
  const lowStockCount =
    analysisSummary?.lowStockCount ??
    items.filter((it) => (it.currentStock || 0) > 0 && (it.currentStock || 0) <= (it.minimumStock || 0)).length;
  const outOfStockCount =
    analysisSummary?.outOfStockCount ??
    items.filter((it) => (it.currentStock || 0) === 0).length;
  const inCustodyCount = analysisSummary?.issuedItemsCount ?? activeIssuesCount;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Total Registered Items */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Catalog
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {totalItems}
          </span>
          <span className="text-xs font-semibold text-slate-500">SKUs</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Active inventory master</p>
      </div>

      {/* 2. Total Valuation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Store Valuation
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{totalValue.toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
          <TrendingUp className="size-3" />
          Physical asset value
        </p>
      </div>

      {/* 3. Low Stock Items */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Low Stock Alerts
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span
            className={`text-2xl font-black tracking-tight ${
              lowStockCount > 0 ? "text-amber-600" : "text-slate-900"
            }`}
          >
            {lowStockCount}
          </span>
          <span className="text-xs font-semibold text-slate-500">items</span>
        </div>
        <p className="text-[11px] text-amber-600 font-semibold mt-1">Below minimum threshold</p>
      </div>

      {/* 4. Stockout Items */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Out of Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span
            className={`text-2xl font-black tracking-tight ${
              outOfStockCount > 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {outOfStockCount}
          </span>
          <span className="text-xs font-semibold text-slate-500">depleted</span>
        </div>
        <p className="text-[11px] text-rose-600 font-semibold mt-1">Immediate PO required</p>
      </div>

      {/* 5. In Custody / Active Issues */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Floor Custody
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HardHat className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {inCustodyCount}
          </span>
          <span className="text-xs font-semibold text-slate-500">issued</span>
        </div>
        <p className="text-[11px] text-indigo-600 font-semibold mt-1">Active worker handovers</p>
      </div>
    </div>
  );
}
