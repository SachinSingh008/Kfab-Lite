"use client";

import React, { useState, useMemo } from "react";
import {
  HardHat,
  Shield,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowUpRight,
  SlidersHorizontal,
  Eye,
  Plus,
} from "lucide-react";
import { InventoryItemDTO } from "@/lib/inventory-api";

interface InventorySafetyTabProps {
  items: InventoryItemDTO[];
  searchTerm: string;
  canIssueItems: boolean;
  canAdjustStock: boolean;
  onOpenIssueModal: (item: InventoryItemDTO) => void;
  onOpenRestockModal: (item: InventoryItemDTO) => void;
  onOpenAdjustModal: (item: InventoryItemDTO) => void;
  onOpenDetailModal: (item: InventoryItemDTO) => void;
  onOpenAddModal: () => void;
}

export function InventorySafetyTab({
  items,
  searchTerm,
  canIssueItems,
  canAdjustStock,
  onOpenIssueModal,
  onOpenRestockModal,
  onOpenAdjustModal,
  onOpenDetailModal,
  onOpenAddModal,
}: InventorySafetyTabProps) {
  const [filterSubcategory, setFilterSubcategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"code" | "name" | "stock" | "deficit">("deficit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Extract unique subcategories
  const subcategories = useMemo(() => {
    const subs = new Set<string>();
    items.forEach((it) => {
      if (it.subcategory) subs.add(it.subcategory);
    });
    return Array.from(subs);
  }, [items]);

  // Filtered and sorted safety gear
  const processedItems = useMemo(() => {
    return items
      .filter((it) => {
        if (filterSubcategory !== "ALL" && it.subcategory !== filterSubcategory) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          it.itemCode.toLowerCase().includes(q) ||
          it.itemName.toLowerCase().includes(q) ||
          (it.brand && it.brand.toLowerCase().includes(q)) ||
          (it.subcategory && it.subcategory.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === "code") {
          cmp = a.itemCode.localeCompare(b.itemCode);
        } else if (sortBy === "name") {
          cmp = a.itemName.localeCompare(b.itemName);
        } else if (sortBy === "stock") {
          cmp = a.currentStock - b.currentStock;
        } else if (sortBy === "deficit") {
          const deficitA = Math.max(0, a.minimumStock - a.currentStock);
          const deficitB = Math.max(0, b.minimumStock - b.currentStock);
          cmp = deficitA - deficitB;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [items, filterSubcategory, searchTerm, sortBy, sortOrder]);

  const toggleSort = (col: "code" | "name" | "stock" | "deficit") => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Subcategory & Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setFilterSubcategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterSubcategory === "ALL"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            All PPE Gear ({items.length})
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setFilterSubcategory(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterSubcategory === sub
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{processedItems.length}</span> safety items
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("code")}>
                <div className="flex items-center gap-1.5">
                  <span>PPE Code</span>
                  <ArrowUpDown className="size-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <div className="flex items-center gap-1.5">
                  <span>PPE Item & Standard</span>
                  <ArrowUpDown className="size-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Brand / Specifications</th>
              <th className="py-3 px-3 cursor-pointer select-none" onClick={() => toggleSort("stock")}>
                <div className="flex items-center gap-1.5">
                  <span>Available / Min Stock</span>
                  <ArrowUpDown className="size-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer select-none" onClick={() => toggleSort("deficit")}>
                <div className="flex items-center gap-1.5">
                  <span>Readiness / Deficit</span>
                  <ArrowUpDown className="size-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Storage Rack</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Shield className="size-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No safety or PPE equipment found</p>
                    <button
                      onClick={onOpenAddModal}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Safety Gear</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              processedItems.map((item) => {
                const isOutOfStock = item.currentStock <= 0;
                const isLowStock = !isOutOfStock && item.currentStock <= item.minimumStock;
                const deficit = Math.max(0, item.minimumStock - item.currentStock);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                    onClick={() => onOpenDetailModal(item)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-700 whitespace-nowrap">
                      {item.itemCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-amber-800 transition-colors flex items-center gap-1.5">
                        <HardHat className="size-3.5 text-amber-500" />
                        <span>{item.itemName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.subcategory || "Personnel Protective Equipment"}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      <div>{item.brand || "Standard Spec"}</div>
                      {item.model && <div className="text-[10px] text-slate-400">{item.model}</div>}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-baseline gap-1 font-bold text-slate-900">
                        <span
                          className={
                            isOutOfStock
                              ? "text-rose-600 font-black text-sm"
                              : isLowStock
                              ? "text-amber-600 font-black text-sm"
                              : "text-slate-900"
                          }
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-slate-400 text-[10px] font-normal">
                          / {item.minimumStock} {item.unit}
                        </span>
                      </div>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            isOutOfStock
                              ? "bg-rose-500 w-0"
                              : isLowStock
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(5, (item.currentStock / (item.minimumStock * 2 || 1)) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="size-3" />
                          DEPLETED
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="size-3" />
                          DEFICIT: {deficit} {item.unit}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" />
                          STOCKED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {item.storageLocation || item.location || "Safety Rack"}
                    </td>
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Issue to Worker */}
                        {canIssueItems && (
                          <button
                            onClick={() => onOpenIssueModal(item)}
                            disabled={item.currentStock <= 0}
                            title="Issue PPE to Worker"
                            className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <ArrowUpRight className="size-3" />
                            <span>Issue</span>
                          </button>
                        )}

                        {/* Restock */}
                        <button
                          onClick={() => onOpenRestockModal(item)}
                          title="Record Purchase / Inward"
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Truck className="size-3" />
                          <span>Restock</span>
                        </button>

                        {/* Adjust Stock */}
                        {canAdjustStock && (
                          <button
                            onClick={() => onOpenAdjustModal(item)}
                            title="Stock Take Adjustment"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal className="size-3.5" />
                          </button>
                        )}

                        {/* View Details */}
                        <button
                          onClick={() => onOpenDetailModal(item)}
                          title="View PPE Ledger"
                          className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
