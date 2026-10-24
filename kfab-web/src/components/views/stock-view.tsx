"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Building2,
  Wrench,
  ShieldAlert,
  Clock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { StockMaterial } from "@/lib/mock-data";
import {
  InventoryItemDTO,
  InventoryAnalysisSummaryDTO,
  InventoryCategory,
  getInventoryCompanies,
  getInventoryItems,
  getInventoryAnalysisSummary,
  recordInventoryPurchase,
  issueInventoryItem,
  adjustInventoryStock,
} from "@/lib/inventory-api";

interface StockViewProps {
  stockMaterials?: StockMaterial[];
  searchTerm?: string;
  onOpenInward?: () => void;
}

export function StockView({
  stockMaterials = [],
  searchTerm: initialSearch = "",
  onOpenInward,
}: StockViewProps) {
  const [companyId, setCompanyId] = useState<string>("c0000000-0000-0000-0000-000000000001");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Live Inventory Items & KPI Telemetry
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [summary, setSummary] = useState<InventoryAnalysisSummaryDTO>({
    totalItems: 0,
    totalInventoryValue: 0,
    lowStockItemsCount: 0,
    totalActiveMachines: 0,
    totalActiveIssues: 0,
    consumablesCount: 0,
    machinesCount: 0,
    safetyItemsCount: 0,
  });

  // Modal States
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<InventoryItemDTO | null>(null);

  // Form Inputs
  const [transQty, setTransQty] = useState<number>(10);
  const [unitPrice, setUnitPrice] = useState<number>(100);
  const [department, setDepartment] = useState<string>("Fabrication Bay 1");
  const [remarks, setRemarks] = useState<string>("");

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const comps = await getInventoryCompanies();
      const activeCompId = comps[0]?.id || companyId;
      setCompanyId(activeCompId);

      const [itemsRes, summaryRes] = await Promise.all([
        getInventoryItems(activeCompId, {
          category: selectedCategory,
          search: searchQuery,
        }),
        getInventoryAnalysisSummary(activeCompId),
      ]);

      setItems(itemsRes.items);
      setSummary(summaryRes);
    } catch (err) {
      console.error("Failed to load live inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedCategory, searchQuery]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handlePurchaseSubmit = async () => {
    if (!selectedItemForAction) return;
    try {
      await recordInventoryPurchase({
        company_id: companyId,
        item_id: selectedItemForAction.id,
        quantity: transQty,
        unit_price: unitPrice,
        notes: remarks || undefined,
      });
      setPurchaseModalOpen(false);
      setFeedback({
        type: "success",
        message: `Successfully recorded inward of ${transQty} ${selectedItemForAction.unit} for ${selectedItemForAction.itemCode}.`,
      });
      await loadInventory();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to record purchase",
      });
    }
  };

  const handleIssueSubmit = async () => {
    if (!selectedItemForAction) return;
    try {
      await issueInventoryItem({
        company_id: companyId,
        item_id: selectedItemForAction.id,
        employee_id: "e0000000-0000-0000-0000-000000000001",
        quantity: transQty,
        department,
        purpose: remarks || undefined,
      });
      setIssueModalOpen(false);
      setFeedback({
        type: "success",
        message: `Issued ${transQty} ${selectedItemForAction.unit} of ${selectedItemForAction.itemCode} to ${department}.`,
      });
      await loadInventory();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to issue item",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Actions */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B]">
              <Boxes className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#0F172A]">
                Material Stock & Inventory Master
              </h2>
              <p className="text-xs text-[#64748B]">
                Live FIFO inventory management: Consumables & Tackles, Machinery & Tools, Clothes & Safety PPE.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (items.length > 0) {
                setSelectedItemForAction(items[0]);
                setPurchaseModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="size-4" />
            <span>+ Inward Stock</span>
          </button>
        </div>
      </div>

      {/* 2. Global Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            feedback.type === "success"
              ? "bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Top Stock Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase">Total Catalog Items</p>
          <p className="text-2xl font-black text-[#0F172A] mt-1">{summary.totalItems} SKUs</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Active inventory master</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#BFDBFE] shadow-2xs bg-gradient-to-br from-white to-[#EFF6FF]">
          <p className="text-[11px] font-bold text-[#2563EB] uppercase">Inventory Valuation</p>
          <p className="text-2xl font-black text-[#1D4ED8] mt-1">
            ₹{summary.totalInventoryValue.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-[#2563EB] mt-0.5">Authoritative stock value</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#FECACA] shadow-2xs bg-gradient-to-br from-white to-[#FEF2F2]">
          <p className="text-[11px] font-bold text-[#DC2626] uppercase">Low Stock Alerts</p>
          <p className="text-2xl font-black text-[#B91C1C] mt-1">
            {summary.lowStockItemsCount} SKUs
          </p>
          <p className="text-[11px] text-[#DC2626] mt-0.5">Below reorder minimum</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#DDD6FE] shadow-2xs bg-gradient-to-br from-white to-[#FAF5FF]">
          <p className="text-[11px] font-bold text-[#7C3AED] uppercase">Plant Machinery</p>
          <p className="text-2xl font-black text-[#6D28D9] mt-1">
            {summary.totalActiveMachines} Units
          </p>
          <p className="text-[11px] text-[#7C3AED] mt-0.5">Active equipment & tools</p>
        </div>
      </div>

      {/* 4. Category Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-kfab space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "ALL", label: "All Items" },
              { id: "CONSUMABLES_TACKLES", label: "Consumables & Tackles" },
              { id: "MACHINES_TOOLS", label: "Machines & Tools" },
              { id: "CLOTHES_SAFETY", label: "Clothes & Safety PPE" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="size-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search code, item, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
            />
          </div>
        </div>
      </div>

      {/* 5. Inventory Items Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-kfab overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            <div className="inline-block animate-spin size-6 border-2 border-[#F59E0B] border-t-transparent rounded-full mb-2" />
            <p>Loading inventory ledger...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Item & Code</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-right">Available Qty</th>
                  <th className="py-3 px-3 text-right">Issued Qty</th>
                  <th className="py-3 px-3 text-right">Min Stock</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#64748B]">
                      No inventory items found matching filter.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isLow = item.availableQuantity <= item.minimumStock;
                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0F172A]">{item.itemName}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">{item.itemCode}</div>
                        </td>

                        <td className="py-3 px-3 text-[#475569]">
                          <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] font-medium text-[10px]">
                            {item.category.replace(/_/g, " ")}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[#64748B]">
                          {item.location || item.storageLocation || "Warehouse"}
                        </td>

                        <td className="py-3 px-3 text-right font-black text-[#0F172A]">
                          {item.availableQuantity} {item.unit}
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-[#64748B]">
                          {item.issuedQuantity} {item.unit}
                        </td>

                        <td className="py-3 px-3 text-right text-[#64748B]">
                          {item.minimumStock} {item.unit}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                              Optimal
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedItemForAction(item);
                                setIssueModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-[#0284C7] bg-[#E0F2FE] hover:bg-[#BAE6FD] rounded-lg transition-colors cursor-pointer"
                            >
                              Issue
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItemForAction(item);
                                setPurchaseModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-[#D97706] bg-[#FEF3C7] hover:bg-[#FDE68A] rounded-lg transition-colors cursor-pointer"
                            >
                              Inward
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
        )}
      </div>

      {/* 6. Purchase Inward Modal */}
      {purchaseModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Record Material Inward — {selectedItemForAction.itemName}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Inward Quantity ({selectedItemForAction.unit})
                </label>
                <input
                  type="number"
                  value={transQty}
                  onChange={(e) => setTransQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Remarks / Invoice Reference
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Challan #CH-8821 received at gate"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                onClick={() => setPurchaseModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchaseSubmit}
                className="px-4 py-2 rounded-xl bg-[#F59E0B] text-white text-xs font-bold hover:bg-[#D97706]"
              >
                Confirm Inward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Issue Modal */}
      {issueModalOpen && selectedItemForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Issue to Shop Floor — {selectedItemForAction.itemName}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Issue Quantity ({selectedItemForAction.unit}) [Available: {selectedItemForAction.availableQuantity}]
                </label>
                <input
                  type="number"
                  value={transQty}
                  max={selectedItemForAction.availableQuantity}
                  onChange={(e) => setTransQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Work Bay / Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-semibold text-[#0F172A]"
                >
                  <option value="Fabrication Bay 1">Fabrication Bay 1 - Girder Fitup</option>
                  <option value="Assembly Bay 2">Assembly Bay 2 - Box Welding</option>
                  <option value="Machine Shop">Machine Shop - Radial Drilling</option>
                  <option value="Painting Yard">Painting Yard - Blasting & Coating</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Purpose / Job Number
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Box girder diaphragm welding project #104"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                onClick={() => setIssueModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#64748B]"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueSubmit}
                className="px-4 py-2 rounded-xl bg-[#0284C7] text-white text-xs font-bold hover:bg-[#0369A1]"
              >
                Confirm Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
