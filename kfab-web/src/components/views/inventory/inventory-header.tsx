"use client";

import React from "react";
import {
  Boxes,
  Search,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  TableProperties,
} from "lucide-react";
import { InventoryCompanyDTO } from "@/lib/inventory-api";
import { InventoryTab } from "./inventory-types";

interface InventoryHeaderProps {
  companies: InventoryCompanyDTO[];
  selectedCompanyId: string;
  onCompanyChange: (id: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
  isExcelMode: boolean;
  onToggleExcelMode: () => void;
  onOpenAddModal: () => void;
  canAddItems: boolean;
  activeTab: InventoryTab;
}

export function InventoryHeader({
  companies,
  selectedCompanyId,
  onCompanyChange,
  searchTerm,
  onSearchChange,
  onRefresh,
  loading,
  isExcelMode,
  onToggleExcelMode,
  onOpenAddModal,
  canAddItems,
  activeTab,
}: InventoryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      {/* Title & Brand Icon */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Boxes className="size-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Store & Inventory Master
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Fabrication ERP
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Consumables, machinery, power tools, safety PPE gear, and atomic stock tracking
          </p>
        </div>
      </div>

      {/* Action Controls & Company Selector */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Multi-Tenant Company Selector */}
        {companies.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
            <Building2 className="size-3.5 text-slate-400" />
            <select
              value={selectedCompanyId}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Global Search Bar (hidden in analysis tab if preferred, or universal) */}
        <div className="relative">
          <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code, name, brand..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8.5 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-44 md:w-56 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Inventory"
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
        </button>

        {/* Excel Workspace Toggle */}
        <button
          onClick={onToggleExcelMode}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
            isExcelMode
              ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          }`}
          title="Switch to Excel-compatible Live Ledger Grid"
        >
          {isExcelMode ? (
            <>
              <TableProperties className="size-3.5" />
              <span>Standard View</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="size-3.5" />
              <span>Excel Grid Mode</span>
            </>
          )}
        </button>

        {/* Add Material / Equipment Button */}
        {canAddItems && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Add Item</span>
          </button>
        )}
      </div>
    </div>
  );
}
