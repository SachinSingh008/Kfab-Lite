"use client";

import React, { useState } from "react";
import {
  DollarSign,
  FileCheck2,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { exportToExcel } from "@/lib/excel-service";
import { AppUser } from "@/lib/auth-store";

interface AccountsViewProps {
  currentUser: AppUser;
}

export interface InwardReconciliationRecord {
  id: string;
  challan: string;
  invoice: string;
  supplier: string;
  material: string;
  billedQty: number;
  receivedQty: number;
  unit: string;
  ratePerUnit: number;
  status: "MATCHED" | "DISCREPANCY" | "PENDING_AUDIT";
  paymentStatus: "PAID" | "PENDING" | "ON_HOLD";
}

// Clean slate: Live reconciliation data populated from Supabase invoices/gate passes
const DEFAULT_ACCOUNTS_DATA: InwardReconciliationRecord[] = [];

export function AccountsView({ currentUser }: AccountsViewProps) {
  const [records, setRecords] = useState<InwardReconciliationRecord[]>(DEFAULT_ACCOUNTS_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const filtered = records.filter(
    (r) =>
      r.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.challan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReconcile = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "MATCHED", paymentStatus: "PAID" } : r))
    );
    setNotification("Invoice verified and cleared for ledger accounting.");
    setTimeout(() => setNotification(null), 3500);
  };

  const handleExportAccountsExcel = () => {
    const exportRows = filtered.map((r, idx) => ({
      "Sl No": idx + 1,
      "Challan Number": r.challan,
      "Invoice Number": r.invoice,
      "Vendor / Supplier": r.supplier,
      "Material Description": r.material,
      "Billed Quantity": r.billedQty,
      "Received Quantity": r.receivedQty,
      "Unit": r.unit,
      "Rate Per Unit (INR)": r.ratePerUnit,
      "Total Invoice Value (INR)": r.billedQty * r.ratePerUnit,
      "Reconciliation Status": r.status,
      "Payment Status": r.paymentStatus,
    }));

    exportToExcel(exportRows, `Accounts_Reconciliation_${new Date().toISOString().split("T")[0]}`, "Accounts");
    setNotification("Accounts_Reconciliation.xlsx downloaded successfully!");
    setTimeout(() => setNotification(null), 3500);
  };

  const totalInvoiceValue = filtered.reduce((sum, r) => sum + r.billedQty * r.ratePerUnit, 0);
  const totalPendingPayment = filtered
    .filter((r) => r.paymentStatus !== "PAID")
    .reduce((sum, r) => sum + r.billedQty * r.ratePerUnit, 0);
  const discrepancyCount = filtered.filter((r) => r.status === "DISCREPANCY").length;

  return (
    <div className="space-y-5">
      {/* 1. Header & Notification Banner */}
      {notification && (
        <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl flex items-center justify-between text-[#16A34A] text-xs font-bold shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#16A34A]" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-[#16A34A] hover:text-[#15803D]">
            ×
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#0F172A]">
              Accounts & Invoice Reconciliation Command
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F1FF] text-[#0F172A] border border-[#BFDBFE]">
              3-Way Match Active
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Cross-audit Purchase Orders against Weighbridge Gate Challans and Vendor GST Invoices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportAccountsExcel}
            className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="size-4" />
            <span>Export Accounts Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-kfab">
          <p className="text-[11px] font-bold text-[#64748B] uppercase">Total Billed Invoices</p>
          <p className="text-2xl font-black text-[#172033] mt-1">
            ₹{(totalInvoiceValue / 100000).toFixed(2)} <span className="text-xs font-bold text-[#64748B]">Lakhs</span>
          </p>
          <p className="text-[11px] text-[#2563EB] font-semibold mt-1">{filtered.length} Invoices Verified</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-kfab">
          <p className="text-[11px] font-bold text-[#16A34A] uppercase">Cleared for Payment</p>
          <p className="text-2xl font-black text-[#16A34A] mt-1">
            ₹{((totalInvoiceValue - totalPendingPayment) / 100000).toFixed(2)} <span className="text-xs font-bold text-[#64748B]">Lakhs</span>
          </p>
          <p className="text-[11px] text-[#16A34A] font-semibold mt-1">Passed 3-Way Reconciliation</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-kfab">
          <p className="text-[11px] font-bold text-[#D97706] uppercase">Pending Clearance</p>
          <p className="text-2xl font-black text-[#D97706] mt-1">
            ₹{(totalPendingPayment / 100000).toFixed(2)} <span className="text-xs font-bold text-[#64748B]">Lakhs</span>
          </p>
          <p className="text-[11px] text-[#D97706] font-semibold mt-1">Awaiting Weight Check</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-kfab">
          <p className="text-[11px] font-bold text-[#DC2626] uppercase">Disputed Weight Slips</p>
          <p className="text-2xl font-black text-[#DC2626] mt-1">
            {discrepancyCount} <span className="text-xs font-bold text-[#64748B]">Bills</span>
          </p>
          <p className="text-[11px] text-[#DC2626] font-semibold mt-1">Immediate Audit Action Required</p>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-kfab overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Challan #</th>
                <th className="p-3.5">Tax Invoice #</th>
                <th className="p-3.5">Supplier / Vendor</th>
                <th className="p-3.5">Material Description</th>
                <th className="p-3.5 text-right">Billed Qty</th>
                <th className="p-3.5 text-right">Weighed Qty</th>
                <th className="p-3.5 text-right">Rate / Unit</th>
                <th className="p-3.5 text-right font-black text-[#172033]">Total Amount</th>
                <th className="p-3.5 text-center">3-Way Audit</th>
                <th className="p-3.5 text-center">Payment Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#172033]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="size-8 text-[#CBD5E1] mb-2" />
                      <p className="text-xs font-bold text-[#172033]">No Invoices Pending Reconciliation</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        New supplier tax invoices will appear here upon weighbridge gate verification.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const hasDiscrepancy = r.status === "DISCREPANCY";
                  const total = r.billedQty * r.ratePerUnit;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        hasDiscrepancy ? "bg-[#FEF2F2]/40" : ""
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-[#0F172A]">{r.challan}</td>
                      <td className="p-3.5 font-mono font-bold text-[#2563EB]">{r.invoice}</td>
                      <td className="p-3.5 font-bold text-[#172033]">{r.supplier}</td>
                      <td className="p-3.5 text-[#475569]">{r.material}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#172033]">
                        {r.billedQty} {r.unit}
                      </td>
                      <td className={`p-3.5 text-right font-mono font-bold ${
                        hasDiscrepancy ? "text-[#DC2626]" : "text-[#16A34A]"
                      }`}>
                        {r.receivedQty} {r.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono text-[#64748B]">
                        ₹{r.ratePerUnit.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-[#172033] text-sm">
                        ₹{total.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                            r.status === "MATCHED"
                              ? "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                              : "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                            r.paymentStatus === "PAID"
                              ? "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                              : r.paymentStatus === "ON_HOLD"
                              ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
                              : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                          }`}
                        >
                          {r.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {r.paymentStatus !== "PAID" && (
                          <button
                            onClick={() => handleReconcile(r.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#E8F1FF] hover:bg-[#DBEAFE] text-[#0F172A] border border-[#BFDBFE] transition-colors cursor-pointer"
                          >
                            Verify & Clear
                          </button>
                        )}
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
