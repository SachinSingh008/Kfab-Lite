"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  RefreshCw,
  Users,
  Boxes,
  Truck,
  BookOpen,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import {
  exportAttendanceExcel,
  exportEmployeeMasterExcel,
  exportMaterialMasterExcel,
  exportSupplierMasterExcel,
  exportStockLedgerExcel,
  exportStockInwardExcel,
  downloadMaterialImportTemplate,
  downloadEmployeeImportTemplate,
  downloadStockInwardTemplate,
  parseAndValidateExcel,
  ExcelValidationResult,
} from "@/lib/excel-service";
import { DataService } from "@/lib/data-service";
import { AppUser } from "@/lib/auth-store";

interface ReportsViewProps {
  currentUser?: AppUser;
}

export function ReportsView({ currentUser }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<"exports" | "imports">("exports");
  const [importEntity, setImportEntity] = useState<"materials" | "employees" | "inward">("materials");
  const [validationResult, setValidationResult] = useState<ExcelValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Trigger live real Excel exports
  const handleExport = async (type: string) => {
    try {
      if (type === "attendance") {
        const workers = DataService.getWorkers();
        exportAttendanceExcel(workers);
        showSuccess("Attendance.xlsx generated and downloaded successfully!");
      } else if (type === "employees") {
        const workers = DataService.getWorkers();
        exportEmployeeMasterExcel(workers);
        showSuccess("Employee_Master.xlsx generated and downloaded successfully!");
      } else if (type === "materials") {
        const materials = await DataService.getMaterials();
        exportMaterialMasterExcel(materials);
        showSuccess("Material_Master.xlsx generated and downloaded successfully!");
      } else if (type === "suppliers") {
        const suppliers = [
          { supplier_code: "SUP-TATA-01", name: "Tata Steel BSL Ltd", contact_person: "M. K. Sharma", phone: "+91 98201 22311", city: "Mumbai" },
          { supplier_code: "SUP-JSW-02", name: "JSW Steel Coated", contact_person: "Anil Goel", phone: "+91 98220 99401", city: "Bellary" },
          { supplier_code: "SUP-AIR-03", name: "Air Liquide India", contact_person: "V. Pillai", phone: "+91 98400 11920", city: "Pune" },
        ];
        exportSupplierMasterExcel(suppliers);
        showSuccess("Supplier_Master.xlsx generated and downloaded successfully!");
      } else if (type === "stock_ledger") {
        const ledger = await DataService.getStockLedger();
        exportStockLedgerExcel(ledger);
        showSuccess("Stock_Ledger.xlsx generated and downloaded successfully!");
      } else if (type === "inward") {
        const transactions = DataService.getTransactions().filter((t) => t.type === "INWARD");
        exportStockInwardExcel(transactions);
        showSuccess("Stock_Inward.xlsx generated and downloaded successfully!");
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to generate Excel workbook." });
    }
  };

  const showSuccess = (text: string) => {
    setStatusMessage({ type: "success", text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 2. Download standard templates
  const handleDownloadTemplate = () => {
    if (importEntity === "materials") downloadMaterialImportTemplate();
    else if (importEntity === "employees") downloadEmployeeImportTemplate();
    else downloadStockInwardTemplate();
    showSuccess(`KFAB_${importEntity}_Import_Template.xlsx downloaded! Fill and upload below.`);
  };

  // 3. Parse and pre-validate uploaded Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      let existingData: any[] = [];
      if (importEntity === "materials") existingData = await DataService.getMaterials();
      else if (importEntity === "employees") existingData = DataService.getWorkers();
      else existingData = DataService.getTransactions();

      const result = await parseAndValidateExcel(file, importEntity, existingData);
      setValidationResult(result);
      setStatusMessage({
        type: "success",
        text: `Parsed ${result.totalRows} rows from ${file.name}. Review status before committing to DB.`,
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: `Excel parsing failed: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Commit verified rows to Database
  const handleCommitToDatabase = async () => {
    if (!validationResult) return;
    const validRows = validationResult.rows
      .filter((r) => r.status === "NEW" || r.status === "UPDATED")
      .map((r) => r.data);

    if (validRows.length === 0) {
      alert("No valid rows available to commit.");
      return;
    }

    setIsProcessing(true);
    try {
      const userName = currentUser?.name || "System Admin";
      const result = await DataService.commitExcelImport(importEntity, validRows, userName);
      showSuccess(`Successfully synchronized ${result.insertedCount} records with database and ledger!`);
      setValidationResult(null);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: `Database commit error: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-2xs ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-4 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-kfab flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[#0F172A] flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-[#2563EB]" />
            Enterprise Excel Hub & Audit Reporting
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Generate formatted .xlsx workbooks directly from live database or validate and ingest batch inventory sheets.
          </p>
        </div>

        <div className="flex bg-[#F4F7FC] p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setActiveTab("exports")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "exports"
                ? "bg-[#0F172A] text-white shadow-2xs"
                : "text-[#64748B] hover:text-[#172033]"
            }`}
          >
            Live Excel Exports
          </button>
          <button
            onClick={() => setActiveTab("imports")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "imports"
                ? "bg-[#0F172A] text-white shadow-2xs"
                : "text-[#64748B] hover:text-[#172033]"
            }`}
          >
            Excel ➔ DB Ingest Hub
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE EXCEL EXPORTS */}
      {activeTab === "exports" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Attendance */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <CalendarCheck className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Attendance.xlsx</h3>
              <p className="text-xs text-slate-500 mt-1">
                Active shop-floor daily muster records, punch-in timestamps, shift assignments, and supervisor sign-offs.
              </p>
            </div>
            <button
              onClick={() => handleExport("attendance")}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="size-3.5" /> Download Attendance (.xlsx)
            </button>
          </div>

          {/* Card 2: Stock Ledger */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <BookOpen className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Stock_Ledger.xlsx</h3>
              <p className="text-xs text-slate-500 mt-1">
                Audited chronological ledger with calculated running balances, supplier challans, and shop consumption.
              </p>
            </div>
            <button
              onClick={() => handleExport("stock_ledger")}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="size-3.5" /> Download Stock Ledger (.xlsx)
            </button>
          </div>

          {/* Card 3: Material Master */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Boxes className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Material_Master.xlsx</h3>
              <p className="text-xs text-slate-500 mt-1">
                Catalog of structural plates, beams, consumables, units of measurement, and minimum safety buffers.
              </p>
            </div>
            <button
              onClick={() => handleExport("materials")}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="size-3.5" /> Download Materials (.xlsx)
            </button>
          </div>

          {/* Card 4: Supplier Master */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <Truck className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Supplier_Master.xlsx</h3>
              <p className="text-xs text-slate-500 mt-1">
                Approved vendors, primary contact details, registered GSTIN, and compliance status.
              </p>
            </div>
            <button
              onClick={() => handleExport("suppliers")}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="size-3.5" /> Download Suppliers (.xlsx)
            </button>
          </div>

          {/* Card 5: Inward Goods */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Stock_Inward.xlsx</h3>
              <p className="text-xs text-slate-500 mt-1">
                Physical receipt journal, challan references, truck vehicle numbers, and receiving storekeeper remarks.
              </p>
            </div>
            <button
              onClick={() => handleExport("inward")}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="size-3.5" /> Download Inward Log (.xlsx)
            </button>
          </div>

          {/* Card 6: Employee Master */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="size-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Users className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Employee_Master.xlsx</h3>
              <p className="text-xs text-slate-500 mt-1">
                Personnel database with wage categories, departments, designations, and supervisory reporting trees.
              </p>
            </div>
            <button
              onClick={() => handleExport("employees")}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="size-3.5" /> Download Personnel (.xlsx)
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EXCEL TO DATABASE IMPORT HUB */}
      {activeTab === "imports" && (
        <div className="space-y-6">
          {/* Step 1 & 2 Toolbar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Step 1: Select Target Entity & Download Template</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={importEntity}
                onChange={(e) => {
                  setImportEntity(e.target.value as any);
                  setValidationResult(null);
                }}
                className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="materials">Materials Master (Catalog & Safety Stock)</option>
                <option value="employees">Personnel Master (Workers & Department)</option>
                <option value="inward">Stock Inward Journal (Supplier Receipts)</option>
              </select>

              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <FileDown className="size-4" />
                <span>Download {importEntity.toUpperCase()} Template (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 text-center space-y-3 transition-colors">
            <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <UploadCloud className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Upload Completed .xlsx Workbook</p>
              <p className="text-xs text-slate-500 mt-0.5">
                The file will be strictly validated in-memory before writing any row to the database.
              </p>
            </div>
            <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs">
              <span>Choose Excel File</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Validation Preview Table */}
          {validationResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    Pre-Commit Validation Preview: {validationResult.fileName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Found {validationResult.totalRows} rows. (
                    <span className="text-emerald-700 font-bold">{validationResult.validRows} Valid</span>,{" "}
                    <span className="text-rose-700 font-bold">{validationResult.errorRows} Errors</span>,{" "}
                    <span className="text-amber-700 font-bold">{validationResult.conflictRows} Conflicts</span>)
                  </p>
                </div>

                <button
                  onClick={handleCommitToDatabase}
                  disabled={validationResult.validRows === 0 || isProcessing}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer ${
                    validationResult.validRows > 0 && !isProcessing
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="size-4" />
                  <span>Commit {validationResult.validRows} Valid Rows to DB</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Primary Key / Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Validation Notes / Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {validationResult.rows.map((row) => {
                      const isError = row.status === "ERROR";
                      const isConflict = row.status === "CONFLICT";
                      const isNew = row.status === "NEW";
                      const isUpdated = row.status === "UPDATED";

                      const code =
                        row.data["Material Code"] ||
                        row.data["Employee Code"] ||
                        row.data["Challan Number"] ||
                        "-";
                      const desc =
                        row.data["Material Name"] ||
                        row.data["Full Name"] ||
                        row.data["Supplier Code"] ||
                        "-";

                      return (
                        <tr
                          key={row.rowNumber}
                          className={isError ? "bg-rose-50/40" : isConflict ? "bg-amber-50/40" : "hover:bg-slate-50"}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-500">#{row.rowNumber}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                                isNew
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : isUpdated
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : isError
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : isConflict
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">{code}</td>
                          <td className="py-2 px-3 text-slate-700">{desc}</td>
                          <td className="py-2 px-3">
                            {row.errors.length > 0 ? (
                              <span className="text-rose-700 font-semibold">{row.errors.join("; ")}</span>
                            ) : row.diffSummary ? (
                              <span className="text-blue-600 font-medium">{row.diffSummary}</span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Ready for commit</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
