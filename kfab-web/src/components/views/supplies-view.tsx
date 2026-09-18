"use client";

import React from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { SupplyTransaction } from "@/lib/mock-data";

interface SuppliesViewProps {
  supplyTransactions: SupplyTransaction[];
  searchTerm: string;
}

export function SuppliesView({ supplyTransactions, searchTerm }: SuppliesViewProps) {
  const filteredTransactions = supplyTransactions.filter(
    (tx) =>
      tx.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Material Inward & Gate Challans</h3>
          <p className="text-xs text-slate-500">
            Track vendor deliveries, vehicle numbers and invoices
          </p>
        </div>
        <button
          onClick={() => alert("Opening Inward Voucher Entry Form")}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          + Record Inward Delivery
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Voucher ID</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Supplier / Source</th>
              <th className="p-3.5">Material Description</th>
              <th className="p-3.5">Quantity</th>
              <th className="p-3.5">Vehicle #</th>
              <th className="p-3.5">Invoice / Challan</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5 font-bold text-slate-900">{tx.id}</td>
                <td className="p-3.5 text-slate-600">{tx.date}</td>
                <td className="p-3.5">
                  <StatusBadge
                    label={tx.type}
                    tone={tx.type === "INWARD" ? "success" : "info"}
                  />
                </td>
                <td className="p-3.5 font-medium text-slate-800">{tx.entity}</td>
                <td className="p-3.5 text-slate-700">{tx.material}</td>
                <td className="p-3.5 font-bold text-slate-900">{tx.qty}</td>
                <td className="p-3.5 text-slate-600">{tx.vehicle}</td>
                <td className="p-3.5 text-slate-600">{tx.ref}</td>
                <td className="p-3.5">
                  <StatusBadge label={tx.status} tone="success" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
