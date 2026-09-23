"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Download,
  Filter,
  Search,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Flame,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import { DataService, StockLedgerEntry } from "@/lib/data-service";
import { exportStockLedgerExcel } from "@/lib/excel-service";
import { AppUser } from "@/lib/auth-store";

interface LedgerViewProps {
  currentUser: AppUser;
}

export function LedgerView({ currentUser }: LedgerViewProps) {
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedForVoid, setSelectedForVoid] = useState<StockLedgerEntry | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canVoid = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const data = await DataService.getStockLedger(selectedMaterial);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, [selectedMaterial]);

  const handleExportExcel = () => {
    exportStockLedgerExcel(filteredEntries);
    setActionSuccess("Stock_Ledger.xlsx generated and downloaded successfully!");
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleOpenVoidModal = (entry: StockLedgerEntry) => {
    setSelectedForVoid(entry);
    setVoidReason("");
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!selectedForVoid) return;
    if (!voidReason.trim() || voidReason.trim().length < 5) {
      alert("A comprehensive void reason (minimum 5 characters) is required for audit trails.");
      return;
    }

    try {
      await DataService.voidLedgerTransaction(selectedForVoid.id, voidReason, currentUser.name);
      setVoidModalOpen(false);
      setSelectedForVoid(null);
      setVoidReason("");
      setActionSuccess(`Transaction ${selectedForVoid.ref} has been safely voided and balance recalculated.`);
      loadLedgerData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to void transaction");
    }
  };

  const filteredEntries = entries.filter((e) => {
    const q = searchTerm.toLowerCase();
    return (
      e.material_name.toLowerCase().includes(q) ||
      e.material_code.toLowerCase().includes(q) ||
      e.ref.toLowerCase().includes(q) ||
      e.entity.toLowerCase().includes(q)
    );
  });

  // Calculate high-level ledger totals
  const totalInward = filteredEntries
    .filter((e) => e.status === "ACTIVE")
    .reduce((sum, e) => sum + e.inward_qty, 0);

  const totalOutward = filteredEntries
    .filter((e) => e.status === "ACTIVE")
    .reduce((sum, e) => sum + e.outward_qty, 0);

  const totalUsage = filteredEntries
    .filter((e) => e.status === "ACTIVE")
    .reduce((sum, e) => sum + e.usage_qty, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Action Message */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            ×
          </button>
        </div>
      )}

      {/* Header & Control Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-kfab flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
            <BookOpen className="size-5 text-[#2563EB]" />
            Chronological Stock Movement Ledger
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Authoritative, mathematically computed running balance. Direct sync with Supabase and Excel workbooks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="size-4" />
            <span>Download Stock Ledger (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-kfab">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase">Total Inward Qty</span>
            <span className="p-1.5 bg-[#DCFCE7] text-[#16A34A] rounded-lg">
              <ArrowDownLeft className="size-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#172033] mt-2">
            +{totalInward.toFixed(2)} <span className="text-xs font-bold text-[#64748B]">TON</span>
          </p>
          <p className="text-[11px] text-[#16A34A] font-semibold mt-1">Vendor Mill Shipments</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-kfab">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase">Outward Dispatched</span>
            <span className="p-1.5 bg-[#FEF3C7] text-[#D97706] rounded-lg">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#172033] mt-2">
            -{totalOutward.toFixed(2)} <span className="text-xs font-bold text-[#64748B]">TON</span>
          </p>
          <p className="text-[11px] text-[#D97706] font-semibold mt-1">Project Site Deliveries</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-kfab">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase">Shop Floor Usage</span>
            <span className="p-1.5 bg-[#E0E7FF] text-[#0F172A] rounded-lg">
              <Flame className="size-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#172033] mt-2">
            -{totalUsage.toFixed(2)} <span className="text-xs font-bold text-[#64748B]">TON</span>
          </p>
          <p className="text-[11px] text-[#2563EB] font-semibold mt-1">Fabrication Bays 1-5</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-kfab">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase">Ledger Entries</span>
            <span className="p-1.5 bg-[#E8F1FF] text-[#2563EB] rounded-lg">
              <BookOpen className="size-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-[#172033] mt-2">
            {filteredEntries.length} <span className="text-xs font-bold text-[#64748B]">Records</span>
          </p>
          <p className="text-[11px] text-[#16A34A] font-semibold mt-1">Audit Trail Active</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Material Filter:</span>
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Materials (Combined Ledger)</option>
            <option value="STL-PL-12">MS Plate 12mm IS 2062</option>
            <option value="STL-PL-20">MS Plate 20mm IS 2062</option>
            <option value="STL-BEAM-250">ISMB 250 Heavy Beam</option>
            <option value="GAS-ARG-D">Argon Shielding Gas Cyl</option>
            <option value="WLD-E7018">Low Hydrogen Electrode 7018</option>
            <option value="BLT-M20-75">HT Structural Bolts M20x75</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search ref, supplier, bay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Ref / Challan #</th>
                <th className="py-3 px-4">Material Item</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Inward (+)</th>
                <th className="py-3 px-4 text-right">Outward (-)</th>
                <th className="py-3 px-4 text-right">Usage (-)</th>
                <th className="py-3 px-4 text-right font-extrabold text-blue-900 bg-blue-50/50">
                  Running Balance
                </th>
                <th className="py-3 px-4">Entity / Bay</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canVoid && <th className="py-3 px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No ledger entries match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isVoided = entry.status === "VOIDED";

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isVoided ? "bg-rose-50/40 opacity-70" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{entry.date}</td>
                      <td className="py-3 px-4 font-semibold text-blue-700">{entry.ref}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{entry.material_name}</div>
                        <div className="text-[10px] text-slate-400">{entry.material_code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                            entry.type === "INWARD"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : entry.type === "OUTWARD"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {entry.inward_qty > 0 ? `+${entry.inward_qty.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-600">
                        {entry.outward_qty > 0 ? `-${entry.outward_qty.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                        {entry.usage_qty > 0 ? `-${entry.usage_qty.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-blue-800 bg-blue-50/30 whitespace-nowrap">
                        {isVoided ? (
                          <span className="line-through text-slate-400">
                            {entry.running_balance.toFixed(2)} {entry.unit}
                          </span>
                        ) : (
                          `${entry.running_balance.toFixed(2)} ${entry.unit}`
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{entry.entity}</td>
                      <td className="py-3 px-4 text-center">
                        {isVoided ? (
                          <span
                            title={entry.void_reason}
                            className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold border border-rose-300"
                          >
                            <ShieldAlert className="size-3" /> VOIDED
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      {canVoid && (
                        <td className="py-3 px-4 text-center">
                          {!isVoided ? (
                            <button
                              onClick={() => handleOpenVoidModal(entry)}
                              title="Void this entry with required audit reason"
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              Void
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Protected</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Confirmation Modal */}
      {voidModalOpen && selectedForVoid && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit Void Procedure</h3>
                <p className="text-xs text-slate-500">Entry: {selectedForVoid.ref}</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              <strong>Warning:</strong> Hard deleting stock movements is prohibited. Voiding will record a permanent
              audit reversal, restore prior balance calculation, and log your username (
              <strong>{currentUser.name}</strong>).
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Mandatory Void Reason *</label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Duplicate inward entry, material rejected at QA, data entry correction..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setVoidModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVoid}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Confirm & Recompute Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
