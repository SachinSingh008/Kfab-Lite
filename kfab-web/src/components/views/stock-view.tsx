"use client";

import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { StockMaterial } from "@/lib/mock-data";

interface StockViewProps {
  stockMaterials: StockMaterial[];
  searchTerm: string;
}

export function StockView({ stockMaterials, searchTerm }: StockViewProps) {
  const filteredStock = stockMaterials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Fabrication Material Master & Ledger</h3>
          <p className="text-xs text-slate-500">
            Stock is dynamically computed: Inward − Outward − Usage
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => alert("Opening Inward Delivery Form")}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownLeft className="size-3.5" /> + Inward
          </button>
          <button
            onClick={() => alert("Opening Material Issue Form")}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpRight className="size-3.5" /> - Issue / Usage
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Material Code</th>
              <th className="p-3.5">Material Name</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Specification</th>
              <th className="p-3.5 text-right">Inward</th>
              <th className="p-3.5 text-right">Dispatched</th>
              <th className="p-3.5 text-right">Used</th>
              <th className="p-3.5 text-right font-bold text-slate-900">Current Stock</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredStock.map((m) => (
              <tr key={m.code} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5 font-bold text-slate-900">{m.code}</td>
                <td className="p-3.5 font-medium text-slate-900">{m.name}</td>
                <td className="p-3.5 text-slate-600">{m.category}</td>
                <td className="p-3.5 text-slate-500">{m.spec}</td>
                <td className="p-3.5 text-right text-emerald-600 font-semibold">
                  +{m.inward} {m.unit}
                </td>
                <td className="p-3.5 text-right text-slate-600">
                  -{m.outward} {m.unit}
                </td>
                <td className="p-3.5 text-right text-slate-600">
                  -{m.usage} {m.unit}
                </td>
                <td className="p-3.5 text-right font-bold text-slate-900 text-sm">
                  {m.current} {m.unit}
                </td>
                <td className="p-3.5 text-center">
                  <StatusBadge
                    label={m.isLow ? "LOW STOCK" : "NORMAL"}
                    tone={m.isLow ? "danger" : "success"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
