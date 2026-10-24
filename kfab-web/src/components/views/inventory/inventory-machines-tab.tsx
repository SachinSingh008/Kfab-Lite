"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  Eye,
  Plus,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { InventoryItemDTO, InventoryIssueDTO } from "@/lib/inventory-api";

interface InventoryMachinesTabProps {
  items: InventoryItemDTO[];
  issues: InventoryIssueDTO[];
  searchTerm: string;
  canIssueItems: boolean;
  canReturnItems: boolean;
  canAdjustStock: boolean;
  onOpenIssueModal: (item: InventoryItemDTO) => void;
  onOpenReturnModal: (issue: InventoryIssueDTO) => void;
  onOpenRestockModal: (item: InventoryItemDTO) => void;
  onOpenAdjustModal: (item: InventoryItemDTO) => void;
  onOpenDetailModal: (item: InventoryItemDTO) => void;
  onOpenAddModal: () => void;
}

export function InventoryMachinesTab({
  items,
  issues,
  searchTerm,
  canIssueItems,
  canReturnItems,
  canAdjustStock,
  onOpenIssueModal,
  onOpenReturnModal,
  onOpenRestockModal,
  onOpenAdjustModal,
  onOpenDetailModal,
  onOpenAddModal,
}: InventoryMachinesTabProps) {
  const [filterCondition, setFilterCondition] = useState<string>("ALL");
  const [filterSubcategory, setFilterSubcategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"code" | "name" | "stock" | "available">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter active issues to find active custody per item
  const activeIssuesMap = useMemo(() => {
    const map = new Map<string, InventoryIssueDTO[]>();
    issues.forEach((iss) => {
      if (iss.status === "ISSUED" || iss.status === "PARTIALLY_RETURNED") {
        const list = map.get(iss.itemId) || [];
        list.push(iss);
        map.set(iss.itemId, list);
      }
    });
    return map;
  }, [issues]);

  // Extract unique subcategories
  const subcategories = useMemo(() => {
    const subs = new Set<string>();
    items.forEach((it) => {
      if (it.subcategory) subs.add(it.subcategory);
    });
    return Array.from(subs);
  }, [items]);

  // Filtered and sorted machines
  const processedItems = useMemo(() => {
    return items
      .filter((it) => {
        if (filterCondition !== "ALL" && (it.condition || "GOOD") !== filterCondition) return false;
        if (filterSubcategory !== "ALL" && it.subcategory !== filterSubcategory) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          it.itemCode.toLowerCase().includes(q) ||
          it.itemName.toLowerCase().includes(q) ||
          (it.brand && it.brand.toLowerCase().includes(q)) ||
          (it.model && it.model.toLowerCase().includes(q))
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
        } else if (sortBy === "available") {
          const inUseA = (activeIssuesMap.get(a.id) || []).reduce((acc, x) => acc + (x.quantity - (x.returnedQuantity || 0)), 0);
          const inUseB = (activeIssuesMap.get(b.id) || []).reduce((acc, x) => acc + (x.quantity - (x.returnedQuantity || 0)), 0);
          const availA = a.currentStock - inUseA;
          const availB = b.currentStock - inUseB;
          cmp = availA - availB;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [items, filterCondition, filterSubcategory, searchTerm, sortBy, sortOrder, activeIssuesMap]);

  const toggleSort = (col: "code" | "name" | "stock" | "available") => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Subcategory & Condition Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-2">
          {/* Condition Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterCondition("ALL")}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                filterCondition === "ALL" ? "bg-slate-800 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Conditions
            </button>
            <button
              onClick={() => setFilterCondition("GOOD")}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                filterCondition === "GOOD" ? "bg-emerald-600 text-white shadow-xs" : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              Operational / Good
            </button>
            <button
              onClick={() => setFilterCondition("UNDER_MAINTENANCE")}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                filterCondition === "UNDER_MAINTENANCE" ? "bg-amber-600 text-white shadow-xs" : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              Maintenance
            </button>
            <button
              onClick={() => setFilterCondition("DAMAGED")}
              className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                filterCondition === "DAMAGED" ? "bg-rose-600 text-white shadow-xs" : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              Damaged / Out
            </button>
          </div>

          {/* Subcategory dropdown if many */}
          {subcategories.length > 0 && (
            <select
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Equipment Categories</option>
              {subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{processedItems.length}</span> machines & tools
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("code")}>
                <div className="flex items-center gap-1.5">
                  <span>Equip Code</span>
                  <ArrowUpDown className="size-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <div className="flex items-center gap-1.5">
                  <span>Machine / Tool Description</span>
                  <ArrowUpDown className="size-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Brand & Model</th>
              <th className="py-3 px-3 cursor-pointer select-none" onClick={() => toggleSort("stock")}>
                <div className="flex items-center gap-1.5">
                  <span>Total Fleet</span>
                  <ArrowUpDown className="size-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer select-none" onClick={() => toggleSort("available")}>
                <div className="flex items-center gap-1.5">
                  <span>Available / In Custody</span>
                  <ArrowUpDown className="size-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">Operational Status</th>
              <th className="py-3 px-3">Bay / Storage</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Wrench className="size-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">No machinery or tools match your filters</p>
                    <button
                      onClick={onOpenAddModal}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Machine / Tool</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              processedItems.map((item) => {
                const activeIssues = activeIssuesMap.get(item.id) || [];
                const inUseCount = activeIssues.reduce(
                  (acc, x) => acc + (x.quantity - (x.returnedQuantity || 0)),
                  0
                );
                const availableCount = Math.max(0, item.currentStock - inUseCount);
                const condition = item.condition || "GOOD";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => onOpenDetailModal(item)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {item.itemCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {item.itemName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.subcategory || "Machinery & Power Tools"}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      <div>{item.brand || "—"}</div>
                      {item.model && <div className="text-[10px] text-slate-400">{item.model}</div>}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-800">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          {availableCount} Avail
                        </span>
                        {inUseCount > 0 && (
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                            {inUseCount} In Use
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {condition === "GOOD" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3" />
                          OPERATIONAL
                        </span>
                      ) : condition === "UNDER_MAINTENANCE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <Activity className="size-3" />
                          MAINTENANCE
                        </span>
                      ) : condition === "DAMAGED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="size-3" />
                          DAMAGED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          RETIRED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {item.storageLocation || item.location || "Tool Crib"}
                    </td>
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Issue to Worker / Operator */}
                        {canIssueItems && (
                          <button
                            onClick={() => onOpenIssueModal(item)}
                            disabled={availableCount <= 0}
                            title="Dispatch Machine to Worker"
                            className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            <ArrowUpRight className="size-3" />
                            <span>Issue</span>
                          </button>
                        )}

                        {/* Return from Custody button if active issues exist */}
                        {canReturnItems && activeIssues.length > 0 && (
                          <button
                            onClick={() => onOpenReturnModal(activeIssues[0])}
                            title="Return Equipment to Tool Crib"
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <ArrowDownLeft className="size-3" />
                            <span>Return ({activeIssues.length})</span>
                          </button>
                        )}

                        {/* Restock */}
                        <button
                          onClick={() => onOpenRestockModal(item)}
                          title="Record Purchase / Inward"
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Truck className="size-3" />
                          <span>Add Unit</span>
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => onOpenDetailModal(item)}
                          title="View Tool Crib Ledger"
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
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
