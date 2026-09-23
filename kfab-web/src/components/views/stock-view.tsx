"use client";

import React, { useState } from "react";
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Search,
  AlertTriangle,
  Layers,
  Plus,
  Download,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { StockMaterial } from "@/lib/mock-data";

interface StockViewProps {
  stockMaterials: StockMaterial[];
  searchTerm: string;
  onOpenInward?: () => void;
}

export function StockView({
  stockMaterials,
  searchTerm,
  onOpenInward,
}: StockViewProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = ["ALL", "Raw Steel", "Structural", "Consumables", "Gases", "Hardware"];

  const filteredStock = stockMaterials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.spec.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" ||
      m.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const totalItems = stockMaterials.length;
  const lowItems = stockMaterials.filter((m) => m.isLow).length;
  const totalWeight = stockMaterials
    .filter((m) => m.unit === "TON")
    .reduce((acc, curr) => acc + (parseFloat(curr.current) || 0), 0);

  return (
    <div className="space-y-5">
      {/* 1. Top Header & Action Controls */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#0F172A]">
              Fabrication Material Stock & Inventory Master
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F1FF] text-[#0F172A] border border-[#BFDBFE]">
              Real-Time Balance
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Strict FIFO ledger tracking: Current Stock = Opening Balance + Total Inward − Dispatch − Shop Floor Consumption
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
            <span>+ Record Inward</span>
          </button>
        </div>
      </div>

      {/* 2. Stock Health KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase">Catalogued Items</p>
          <p className="text-xl font-black text-[#172033] mt-1">{totalItems} SKUs</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#2563EB] uppercase">Raw Steel Balance</p>
          <p className="text-xl font-black text-[#2563EB] mt-1">{totalWeight.toFixed(2)} T</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#16A34A] uppercase">Optimal Stock</p>
          <p className="text-xl font-black text-[#16A34A] mt-1">
            {totalItems - lowItems} SKUs
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#DC2626] uppercase">Reorder Alerts</p>
          <p className="text-xl font-black text-[#DC2626] mt-1">{lowItems} SKUs</p>
        </div>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-[#172033] mr-1 flex items-center gap-1">
            <Filter className="size-3.5 text-[#2563EB]" />
            Category:
          </span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === c
                  ? "bg-[#0F172A] text-white shadow-2xs"
                  : "bg-[#F4F7FC] text-[#64748B] hover:bg-[#E8F1FF] hover:text-[#0F172A]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Stock Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-kfab overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Material Code</th>
                <th className="p-3.5">Material Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Specification & Grade</th>
                <th className="p-3.5 text-right">Inward</th>
                <th className="p-3.5 text-right">Outward Dispatched</th>
                <th className="p-3.5 text-right">Shop Usage</th>
                <th className="p-3.5 text-right font-black text-[#172033]">Current Balance</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#172033]">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center">
                      <Boxes className="size-8 text-[#CBD5E1] mb-2" />
                      <p className="text-xs font-bold text-[#172033]">No Inventory Materials Found</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Add raw materials or record an inward gate delivery to populate stock.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStock.map((m) => (
                  <tr key={m.code} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0F172A]">{m.code}</td>
                    <td className="p-3.5 font-bold text-[#172033]">{m.name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-medium text-[11px]">
                        {m.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#64748B] font-mono">{m.spec}</td>
                    <td className="p-3.5 text-right font-semibold text-[#16A34A]">
                      +{m.inward} {m.unit}
                    </td>
                    <td className="p-3.5 text-right text-[#64748B]">
                      -{m.outward} {m.unit}
                    </td>
                    <td className="p-3.5 text-right text-[#64748B]">
                      -{m.usage} {m.unit}
                    </td>
                    <td className="p-3.5 text-right font-black text-[#172033] text-sm font-mono">
                      {m.current} {m.unit}
                    </td>
                    <td className="p-3.5 text-center">
                      <StatusBadge
                        label={m.isLow ? "LOW STOCK" : "OPTIMAL"}
                        tone={m.isLow ? "danger" : "success"}
                      />
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
