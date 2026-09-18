"use client";

import React from "react";
import { FileSpreadsheet, Boxes, Truck } from "lucide-react";

export function ReportsView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-bold text-slate-900">
          Enterprise Reports & Excel Export
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Generate audit-compliant payroll muster sheets and stock valuation ledgers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
            <FileSpreadsheet className="size-8 text-emerald-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Monthly Muster Sheet</h4>
            <p className="text-xs text-slate-500 mt-1">
              Full month worker attendance matrix with present/absent counts.
            </p>
            <button
              onClick={() => alert("Exporting Monthly Muster to Excel (.xlsx)...")}
              className="mt-4 w-full py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
            >
              Export to Excel (.xlsx)
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
            <Boxes className="size-8 text-blue-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Stock Balance & Usage Ledger</h4>
            <p className="text-xs text-slate-500 mt-1">
              Material inward vs consumption reports by project and work bay.
            </p>
            <button
              onClick={() => alert("Exporting Stock Ledger to Excel (.xlsx)...")}
              className="mt-4 w-full py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              Export Stock Ledger
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
            <Truck className="size-8 text-indigo-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Vendor Inward Reconciliation</h4>
            <p className="text-xs text-slate-500 mt-1">
              Challan vs invoice reconciliation for accounts processing.
            </p>
            <button
              onClick={() => alert("Generating Vendor Summary...")}
              className="mt-4 w-full py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
            >
              Generate Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
