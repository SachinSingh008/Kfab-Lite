"use client";

import React, { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Filter,
  Download,
  Building2,
  FileCheck2,
  Calendar,
  Inbox,
  ArrowDownLeft,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { SupplyTransaction } from "@/lib/mock-data";

interface SuppliesViewProps {
  supplyTransactions: SupplyTransaction[];
  searchTerm: string;
  onOpenInward?: () => void;
}

export function SuppliesView({
  supplyTransactions,
  searchTerm,
  onOpenInward,
}: SuppliesViewProps) {
  const [filterType, setFilterType] = useState("ALL");

  const filteredTransactions = supplyTransactions.filter((tx) => {
    const matchesSearch =
      tx.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalInward = supplyTransactions.filter((t) => t.type === "INWARD").length;
  const totalOutward = supplyTransactions.filter((t) => t.type === "OUTWARD").length;

  return (
    <div className="space-y-5">
      {/* 1. Top Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#0F172A]">
              Material Inward Gate Passes & Supplier Challans
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F1FF] text-[#0F172A] border border-[#BFDBFE]">
              Gate Registry
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Log incoming truck weighbridge slips, supplier tax invoices, and shop-floor inward delivery notes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (onOpenInward) onOpenInward();
              else alert("Open Inward Receipt Modal");
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="size-4" />
            <span>+ New Gate Inward Receipt</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase">Gate Shipments</p>
          <p className="text-xl font-black text-[#172033] mt-1">{supplyTransactions.length} Trucks</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#16A34A] uppercase">Vendor Receipts</p>
          <p className="text-xl font-black text-[#16A34A] mt-1">{totalInward} Receipts</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#2563EB] uppercase">Dispatched Out</p>
          <p className="text-xl font-black text-[#2563EB] mt-1">{totalOutward} Gate Passes</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#0F172A] uppercase">Verification Status</p>
          <p className="text-xl font-black text-[#0F172A] mt-1">100% Weighed</p>
        </div>
      </div>

      {/* 3. Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-kfab overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Voucher ID</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Movement Type</th>
                <th className="p-3.5">Supplier / Source</th>
                <th className="p-3.5">Material Description</th>
                <th className="p-3.5 text-right">Quantity</th>
                <th className="p-3.5">Vehicle #</th>
                <th className="p-3.5">Challan / Invoice</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#172033]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="size-8 text-[#CBD5E1] mb-2" />
                      <p className="text-xs font-bold text-[#172033]">No Gate Passes Found</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Log incoming vendor deliveries using the &quot;+ New Gate Inward Receipt&quot; button.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0F172A]">{tx.id}</td>
                    <td className="p-3.5 text-[#64748B] whitespace-nowrap">{tx.date}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                          tx.type === "INWARD"
                            ? "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                            : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-[#172033]">{tx.entity}</td>
                    <td className="p-3.5 text-[#475569]">{tx.material}</td>
                    <td className="p-3.5 text-right font-black text-[#172033] font-mono">
                      {tx.qty}
                    </td>
                    <td className="p-3.5 font-mono text-[#64748B]">{tx.vehicle}</td>
                    <td className="p-3.5 font-mono text-[#2563EB] font-bold">{tx.ref}</td>
                    <td className="p-3.5 text-center">
                      <StatusBadge label={tx.status} tone="success" />
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
