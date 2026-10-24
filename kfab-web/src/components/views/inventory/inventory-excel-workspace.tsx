"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  X,
  Save,
  Copy,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { LedgerSheetDTO } from "@/lib/inventory-api";

interface InventoryExcelWorkspaceProps {
  sheetData: LedgerSheetDTO | null;
  activeSheet: string;
  onSelectSheet: (sheetName: string) => void;
  onUpdateCell: (rowId: string, field: string, value: any) => Promise<void>;
  onBatchPaste: (rows: Array<Record<string, any>>) => Promise<void>;
  onClose: () => void;
  loading: boolean;
  onRefresh: () => void;
}

export function InventoryExcelWorkspace({
  sheetData,
  activeSheet,
  onSelectSheet,
  onUpdateCell,
  onBatchPaste,
  onClose,
  loading,
  onRefresh,
}: InventoryExcelWorkspaceProps) {
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    field: string;
    value: string;
  } | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Available sheets
  const SHEETS = [
    { id: "consumables", name: "Consumables & Tackles" },
    { id: "machines", name: "Machinery & Tools" },
    { id: "safety", name: "Safety PPE & Clothes" },
    { id: "inward", name: "Inward Goods Ledger" },
    { id: "issues", name: "Floor Issue Register" },
  ];

  // Global paste handler when workspace is active
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept if user is typing inside an input element
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const text = e.clipboardData?.getData("text/plain");
      if (!text || !sheetData?.columns) return;

      const lines = text.trim().split(/\r\n|\n|\r/);
      if (lines.length === 0) return;

      const newRows: Array<Record<string, any>> = [];
      const cols = sheetData.columns;

      for (const line of lines) {
        const values = line.split("\t");
        const rowObj: Record<string, any> = {};
        cols.forEach((col, idx) => {
          if (values[idx] !== undefined) {
            rowObj[col] = values[idx].trim();
          }
        });
        if (Object.keys(rowObj).length > 0) {
          newRows.push(rowObj);
        }
      }

      if (newRows.length > 0) {
        try {
          await onBatchPaste(newRows);
          setPasteNotice(`Successfully pasted ${newRows.length} rows into active sheet.`);
          setTimeout(() => setPasteNotice(null), 4000);
        } catch {
          setPasteNotice("Failed to batch paste rows. Check data formatting.");
          setTimeout(() => setPasteNotice(null), 4000);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [sheetData, onBatchPaste]);

  const handleCellCommit = async () => {
    if (!editingCell) return;
    const { rowId, field, value } = editingCell;
    setEditingCell(null);
    try {
      await onUpdateCell(rowId, field, value);
    } catch {
      // handled in parent
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCellCommit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-300 shadow-xl overflow-hidden flex flex-col min-h-[620px]">
      {/* 1. Excel Toolbar Header */}
      <div className="bg-emerald-800 text-white p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-inner">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-white">
                Live Inventory Ledger Spreadsheet
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-700">
                Excel Compatible • Live Sync
              </span>
            </div>
            <p className="text-[11px] text-emerald-200">
              Direct cell editing, multi-cell clipboard paste (Ctrl+V from Excel / Sheets), and live ledger reconciliation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Reload Sheet"
            className="p-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-emerald-100 transition-colors cursor-pointer"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Close Excel Mode Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <X className="size-4" />
            <span>Return to Cards</span>
          </button>
        </div>
      </div>

      {/* 2. Sheet Tabs & Notice */}
      <div className="bg-emerald-900/10 px-4 py-2 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {SHEETS.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSheet(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSheet === s.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
          <span className="text-[11px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-bold">
            Tip: Press Ctrl+V anywhere to paste Excel cells
          </span>
        </div>
      </div>

      {/* Paste Notification Banner */}
      {pasteNotice && (
        <div className="bg-emerald-100 text-emerald-900 px-4 py-2 text-xs font-bold flex items-center gap-2 border-b border-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{pasteNotice}</span>
        </div>
      )}

      {/* 3. Spreadsheet Data Grid */}
      <div ref={gridContainerRef} className="flex-1 overflow-auto bg-slate-50">
        {!sheetData || !sheetData.columns || sheetData.columns.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="size-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="font-semibold text-slate-600">Loading ledger sheet data...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs select-text">
            <thead>
              {/* Excel Column Letters (A, B, C...) */}
              <tr className="bg-slate-200 text-slate-600 font-mono text-[10px] text-center select-none border-b border-slate-300">
                <th className="w-12 py-1 px-2 border-r border-slate-300 bg-slate-300 font-bold">#</th>
                {sheetData.columns.map((col, idx) => (
                  <th key={col} className="py-1 px-3 border-r border-slate-300 font-bold uppercase">
                    {String.fromCharCode(65 + (idx % 26))}
                  </th>
                ))}
              </tr>
              {/* Column Field Names */}
              <tr className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px] border-b border-slate-300">
                <th className="py-2.5 px-2 border-r border-slate-300 text-center bg-slate-200/80">
                  Row
                </th>
                {sheetData.columns.map((col) => (
                  <th key={col} className="py-2.5 px-3 border-r border-slate-300 whitespace-nowrap">
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-mono">
              {sheetData.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={sheetData.columns.length + 1}
                    className="py-12 text-center text-slate-400 font-sans"
                  >
                    No ledger records in this sheet. Paste Excel rows with Ctrl+V or create items.
                  </td>
                </tr>
              ) : (
                sheetData.rows.map((row, rowIdx) => {
                  const rowId = row.id || `row-${rowIdx}`;

                  return (
                    <tr key={rowId} className="hover:bg-emerald-50/40 transition-colors">
                      {/* Row Index Number */}
                      <td className="py-2 px-2 border-r border-slate-300 text-center text-slate-400 font-bold bg-slate-50 select-none text-[10px]">
                        {rowIdx + 1}
                      </td>

                      {/* Cells */}
                      {sheetData.columns.map((col) => {
                        const cellVal = row[col];
                        const isEditing =
                          editingCell?.rowId === rowId && editingCell?.field === col;

                        return (
                          <td
                            key={col}
                            onDoubleClick={() => {
                              setEditingCell({
                                rowId,
                                field: col,
                                value: String(cellVal ?? ""),
                              });
                            }}
                            className="py-2 px-3 border-r border-slate-200 text-slate-800 truncate max-w-[240px] cursor-cell hover:outline hover:outline-1 hover:outline-emerald-500"
                            title="Double-click to edit cell"
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                value={editingCell.value}
                                onChange={(e) =>
                                  setEditingCell((prev) =>
                                    prev ? { ...prev, value: e.target.value } : null
                                  )
                                }
                                onBlur={handleCellCommit}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-white border border-emerald-600 px-1 py-0.5 text-xs text-slate-900 rounded-xs focus:outline-hidden"
                              />
                            ) : (
                              <span>
                                {cellVal === null || cellVal === undefined
                                  ? ""
                                  : typeof cellVal === "number"
                                  ? cellVal.toLocaleString("en-IN")
                                  : String(cellVal)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Excel Footer Status Bar */}
      <div className="bg-emerald-800 text-white px-4 py-2 border-t border-emerald-700 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-3">
          <span className="font-bold">READY</span>
          <span>•</span>
          <span>{sheetData?.rows.length || 0} Records</span>
          <span>•</span>
          <span>{sheetData?.columns.length || 0} Fields</span>
        </div>
        <div className="text-[11px] text-emerald-200 font-sans">
          KFAB360 High-Throughput Spreadsheet Engine
        </div>
      </div>
    </div>
  );
}
