"use client";

import React from "react";
import {
  X,
  Eye,
  HardHat,
  Clock,
} from "lucide-react";
import { DetailDataState } from "./inventory-types";

// ============================================================================
// ITEM DETAIL & AUDIT DRAWER
// ============================================================================
interface ItemDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: DetailDataState | null;
}

export function ItemDetailDrawer({
  isOpen,
  onClose,
  data,
}: ItemDetailDrawerProps) {
  if (!isOpen || !data) return null;

  const { item, transactions, issues } = data;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Eye className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-700 text-xs">
                  {item.itemCode}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  {item.category.replace(/_/g, " ")}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-sm mt-0.5">
                {item.itemName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Current Stock
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {item.currentStock} {item.unit}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Min Threshold
              </span>
              <span className="text-xl font-black text-slate-700 mt-1 block">
                {item.minimumStock} {item.unit}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Unit Valuation
              </span>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                ₹{item.purchasePrice?.toLocaleString("en-IN") || 0}
              </span>
            </div>
          </div>

          {/* Specification details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <h3 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                Brand: <span className="font-bold text-slate-800">{item.brand || "—"}</span>
              </div>
              <div>
                Model: <span className="font-bold text-slate-800">{item.model || "—"}</span>
              </div>
              <div>
                Subcategory: <span className="font-bold text-slate-800">{item.subcategory || "—"}</span>
              </div>
              <div>
                Storage Location:{" "}
                <span className="font-bold text-slate-800">
                  {item.storageLocation || item.location || "Store"}
                </span>
              </div>
              <div>
                Supplier: <span className="font-bold text-slate-800">{item.supplier || "—"}</span>
              </div>
              <div>
                Condition: <span className="font-bold text-slate-800">{item.condition || "GOOD"}</span>
              </div>
            </div>
          </div>

          {/* Active Custody Handovers */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardHat className="size-3.5 text-indigo-600" />
              <span>
                Active Floor Custody (
                {issues.filter((i) => i.status === "ISSUED" || i.status === "PARTIALLY_RETURNED").length}
                )
              </span>
            </h3>
            {issues.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-slate-200">
                No active custody records for this item
              </p>
            ) : (
              <div className="space-y-2">
                {issues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{iss.employeeName}</span>
                      <p className="text-[10px] text-slate-400">
                        Issued on {iss.issueDate}{" "}
                        {iss.expectedReturnDate && `• Due ${iss.expectedReturnDate}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {iss.quantity - (iss.returnedQuantity || 0)} Nos Issued
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">{iss.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction History Ledger */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="size-3.5 text-slate-500" />
              <span>Atomic Transaction Audit Trail ({transactions.length})</span>
            </h3>
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-slate-200">
                No ledger transactions recorded
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const isPositive =
                    tx.transactionType === "PURCHASE" ||
                    tx.transactionType === "RETURN" ||
                    tx.transactionType === "OPENING" ||
                    tx.transactionType === "ADJUSTMENT_IN" ||
                    (tx.transactionType as string) === "INWARD_PURCHASE" ||
                    (tx.transactionType as string) === "RETURN_FROM_EMPLOYEE";

                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isPositive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {tx.transactionType.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-slate-400">{tx.transactionDate}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {tx.remarks || tx.referenceId || "No notes"}
                        </p>
                      </div>
                      <div className="text-right font-mono font-bold">
                        <span className={tx.quantity > 0 ? "text-emerald-700" : "text-rose-700"}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
