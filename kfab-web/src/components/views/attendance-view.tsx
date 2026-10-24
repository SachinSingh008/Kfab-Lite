"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Users,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  RotateCw,
  Copy,
  Clipboard,
  Scissors,
  Trash2,
  Layers,
  Lock,
  Unlock,
  Check,
  AlertTriangle,
  FileText,
  Building2,
  Sparkles,
  HelpCircle,
  Download,
} from "lucide-react";
import { AppUser } from "@/lib/auth-store";
import { WorkerRecord } from "@/lib/mock-data";
import {
  CompanyDTO,
  EmployeeDTO,
  AttendanceRecordDTO,
  AttendanceSummaryDTO,
  AttendanceStatus,
  MatrixAttendanceDTO,
  getAttendanceCompanies,
  getAttendanceEmployees,
  getDailyAttendance,
  getWeeklyAttendance,
  getMonthlyAttendance,
  getCustomRangeAttendance,
  getAttendanceSummary,
  markAttendance,
  bulkMarkAttendance,
  clearAttendance,
  updateOvertime,
  updateLedgerCell,
} from "@/lib/attendance-api";

interface AttendanceViewProps {
  workers?: WorkerRecord[];
  searchTerm?: string;
  currentUser?: AppUser;
}

type AttendanceTab = "attendance" | "ledger" | "reserved";
type ViewMode = "daily" | "weekly" | "monthly" | "custom";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function AttendanceView({
  searchTerm: initialSearch = "",
  currentUser,
}: AttendanceViewProps) {
  // ----------------------------------------------------------------------------
  // Role & Permissions
  // ----------------------------------------------------------------------------
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isAdmin = currentUser?.role === "ADMIN" || isSuperAdmin;
  const isAccountant =
    currentUser?.role === "ACCOUNTANT" || currentUser?.role === "ACCOUNT";
  const isSupervisor = currentUser?.role === "SUPERVISOR";
  const canEdit = (isAdmin || isSupervisor) && !isAccountant;

  // ----------------------------------------------------------------------------
  // Module Navigation State
  // ----------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<AttendanceTab>("attendance");
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  // Filter & Query Controls
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 1-indexed (10 = October)
  const [customFromDate, setCustomFromDate] = useState<string>("2026-10-01");
  const [customToDate, setCustomToDate] = useState<string>("2026-10-15");
  const [employeeSearch, setEmployeeSearch] = useState<string>(initialSearch);

  // Data Loading & Feedback State
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Authoritative Attendance Data
  const [summary, setSummary] = useState<AttendanceSummaryDTO>({
    totalEmployees: 0,
    present: 0,
    absent: 0,
    od: 0,
    totalOvertimeHours: 0,
    turnoutRate: 0,
    date: selectedDate,
  });
  const [dailyRecords, setDailyRecords] = useState<AttendanceRecordDTO[]>([]);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixAttendanceDTO | null>(null);

  // Local Edits Tracker for Tab 1 Batch Saving
  // Key: employeeId, Value: { status, overtimeHours, remarks }
  const [stagedDailyEdits, setStagedDailyEdits] = useState<
    Record<string, { status: AttendanceStatus; overtimeHours: number; remarks: string | null }>
  >({});

  // Confirmation Modal State (e.g. for "Clear Today")
  const [clearModalOpen, setClearModalOpen] = useState(false);

  // Overtime Popover / Modal State
  const [editingOvertimeEmp, setEditingOvertimeEmp] = useState<{
    employeeId: string;
    employeeName: string;
    status: AttendanceStatus;
    overtimeHours: number;
    remarks: string;
  } | null>(null);

  // ----------------------------------------------------------------------------
  // Tab 2: Attendance Ledger / Excel Spreadsheet State
  // ----------------------------------------------------------------------------
  const [freezeEmployeeCol, setFreezeEmployeeCol] = useState(true);
  const [freezeHeaderRow, setFreezeHeaderRow] = useState(true);
  const [ledgerSelectedCell, setLedgerSelectedCell] = useState<{
    rowIdx: number;
    colIdx: number;
    date: string;
    employeeId: string;
  } | null>(null);

  // Staged Ledger Edits: `${employeeId}_${date}` -> { status, overtimeHours, remarks }
  const [stagedLedgerEdits, setStagedLedgerEdits] = useState<
    Record<string, { status: "PRESENT" | "ABSENT" | "OD" | "BLANK"; overtimeHours: number; remarks: string | null }>
  >({});
  const [undoStack, setUndoStack] = useState<Array<Record<string, any>>>([]);
  const [redoStack, setRedoStack] = useState<Array<Record<string, any>>>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync initialSearch if prop changes
  useEffect(() => {
    if (initialSearch) {
      setEmployeeSearch(initialSearch);
    }
  }, [initialSearch]);

  // ----------------------------------------------------------------------------
  // 1. Initial Load: Companies List
  // ----------------------------------------------------------------------------
  useEffect(() => {
    async function loadCompanies() {
      try {
        const comps = await getAttendanceCompanies();
        setCompanies(comps);
        if (comps.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(comps[0].id);
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    }
    loadCompanies();
  }, []);

  // ----------------------------------------------------------------------------
  // 2. Load Attendance Data whenever filter parameters change
  // ----------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    setFeedback(null);

    try {
      if (activeTab === "attendance") {
        if (viewMode === "daily") {
          const res = await getDailyAttendance(selectedCompanyId, selectedDate, employeeSearch);
          setDailyRecords(res.records);
          setSummary(res.summary);
          // Also fetch company employees for complete roster
          const empList = await getAttendanceEmployees(selectedCompanyId, employeeSearch);
          setEmployees(empList);
          // Initialize staged edits with current authoritative records
          const initialMap: Record<string, { status: AttendanceStatus; overtimeHours: number; remarks: string | null }> = {};
          res.records.forEach((r) => {
            initialMap[r.employeeId] = {
              status: r.status,
              overtimeHours: r.overtimeHours,
              remarks: r.remarks,
            };
          });
          setStagedDailyEdits(initialMap);
        } else if (viewMode === "weekly") {
          // Derive week start date from selectedDate (Monday)
          const d = new Date(selectedDate);
          const day = d.getDay(); // 0 is Sunday
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d.setDate(diff)).toISOString().split("T")[0];
          const res = await getWeeklyAttendance(selectedCompanyId, monday, employeeSearch);
          setMatrixData(res);
          setSummary(res.summary);
        } else if (viewMode === "monthly") {
          const res = await getMonthlyAttendance(selectedCompanyId, selectedYear, selectedMonth, employeeSearch);
          setMatrixData(res);
          setSummary(res.summary);
        } else if (viewMode === "custom") {
          const res = await getCustomRangeAttendance(selectedCompanyId, customFromDate, customToDate, employeeSearch);
          setMatrixData(res);
          setSummary(res.summary);
        }
      } else if (activeTab === "ledger") {
        // Tab 2 Ledger: Always loads monthly matrix for selectedYear & selectedMonth
        const res = await getMonthlyAttendance(selectedCompanyId, selectedYear, selectedMonth, employeeSearch);
        setMatrixData(res);
        setSummary(res.summary);
        setStagedLedgerEdits({});
        setUndoStack([]);
        setRedoStack([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load attendance records";
      setFeedback({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }, [
    selectedCompanyId,
    activeTab,
    viewMode,
    selectedDate,
    selectedYear,
    selectedMonth,
    customFromDate,
    customToDate,
    employeeSearch,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----------------------------------------------------------------------------
  // TAB 1 — Daily Attendance Actions
  // ----------------------------------------------------------------------------
  const handleMarkDailyStatus = (employeeId: string, status: AttendanceStatus) => {
    if (!canEdit) return;
    setStagedDailyEdits((prev) => {
      const current = prev[employeeId] || { status, overtimeHours: 0, remarks: null };
      return {
        ...prev,
        [employeeId]: {
          ...current,
          status,
        },
      };
    });
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!canEdit) return;
    setStagedDailyEdits((prev) => {
      const updated = { ...prev };
      employees.forEach((emp) => {
        const existing = updated[emp.id] || { status, overtimeHours: 0, remarks: null };
        updated[emp.id] = {
          ...existing,
          status,
        };
      });
      return updated;
    });
    setFeedback({
      type: "success",
      message: `Marked all ${employees.length} employees as ${status} locally. Click "Save Attendance" to persist.`,
    });
  };

  const handleSaveDailyAttendance = async () => {
    if (!canEdit || !selectedCompanyId) return;
    setSaving(true);
    setFeedback(null);

    const recordsToSave = Object.entries(stagedDailyEdits).map(([empId, data]) => ({
      employee_id: empId,
      status: data.status,
      overtime_hours: data.overtimeHours,
      remarks: data.remarks,
    }));

    if (recordsToSave.length === 0) {
      setFeedback({ type: "error", message: "No attendance changes to save." });
      setSaving(false);
      return;
    }

    try {
      const result = await bulkMarkAttendance({
        company_id: selectedCompanyId,
        attendance_date: selectedDate,
        records: recordsToSave,
      });

      setFeedback({
        type: "success",
        message: `Successfully saved attendance for ${result.successfulCount} employees on ${selectedDate}.`,
      });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save attendance records";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmClearToday = async () => {
    if (!canEdit || !selectedCompanyId) return;
    setSaving(true);
    setClearModalOpen(false);

    try {
      const result = await clearAttendance({
        company_id: selectedCompanyId,
        attendance_date: selectedDate,
      });
      setFeedback({
        type: "success",
        message: result.message,
      });
      setStagedDailyEdits({});
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to clear attendance";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOvertimeModal = async () => {
    if (!editingOvertimeEmp || !canEdit || !selectedCompanyId) return;

    try {
      await updateOvertime({
        company_id: selectedCompanyId,
        employee_id: editingOvertimeEmp.employeeId,
        attendance_date: selectedDate,
        overtime_hours: Number(editingOvertimeEmp.overtimeHours) || 0,
        remarks: editingOvertimeEmp.remarks || null,
      });

      // Update local staged edits
      setStagedDailyEdits((prev) => ({
        ...prev,
        [editingOvertimeEmp.employeeId]: {
          status: editingOvertimeEmp.status,
          overtimeHours: Number(editingOvertimeEmp.overtimeHours) || 0,
          remarks: editingOvertimeEmp.remarks || null,
        },
      }));

      setFeedback({
        type: "success",
        message: `Updated overtime for ${editingOvertimeEmp.employeeName} to ${editingOvertimeEmp.overtimeHours}h OT.`,
      });
      setEditingOvertimeEmp(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update overtime";
      setFeedback({ type: "error", message: msg });
    }
  };

  // ----------------------------------------------------------------------------
  // TAB 2 — Attendance Ledger / Excel-Like Spreadsheet Logic
  // ----------------------------------------------------------------------------
  const unsavedLedgerCount = Object.keys(stagedLedgerEdits).length;

  const handleLedgerCellClick = (rowIdx: number, colIdx: number, employeeId: string, date: string) => {
    setLedgerSelectedCell({ rowIdx, colIdx, date, employeeId });
    setValidationError(null);
  };

  const handleLedgerCellEdit = (
    employeeId: string,
    date: string,
    newStatus: "PRESENT" | "ABSENT" | "OD" | "BLANK",
    newOvertime: number = 0,
    newRemarks: string | null = null
  ) => {
    if (!canEdit) return;
    const key = `${employeeId}_${date}`;
    const previousState = { ...stagedLedgerEdits };

    setUndoStack((prev) => [...prev, previousState]);
    setRedoStack([]);

    setStagedLedgerEdits((prev) => ({
      ...prev,
      [key]: {
        status: newStatus,
        overtimeHours: newOvertime,
        remarks: newRemarks,
      },
    }));
  };

  const handleUndoLedger = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, stagedLedgerEdits]);
    setStagedLedgerEdits(previous);
  };

  const handleRedoLedger = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, stagedLedgerEdits]);
    setStagedLedgerEdits(next);
  };

  const handleSaveLedgerChanges = async () => {
    if (!canEdit || !selectedCompanyId || unsavedLedgerCount === 0) return;
    setSaving(true);
    setFeedback(null);

    let successCount = 0;
    const errors: string[] = [];

    for (const [key, val] of Object.entries(stagedLedgerEdits)) {
      const [empId, date] = key.split("_");
      try {
        await updateLedgerCell({
          company_id: selectedCompanyId,
          employee_id: empId,
          attendance_date: date,
          status: val.status,
          overtime_hours: val.overtimeHours,
          remarks: val.remarks,
        });
        successCount++;
      } catch (err: unknown) {
        errors.push(`Failed for ${date}: ${err instanceof Error ? err.message : "Error"}`);
      }
    }

    setSaving(false);
    if (errors.length > 0) {
      setFeedback({
        type: "error",
        message: `Saved ${successCount} cells. Encountered ${errors.length} errors: ${errors[0]}`,
      });
    } else {
      setFeedback({
        type: "success",
        message: `Successfully persisted all ${successCount} cell edits to PostgreSQL authoritative store.`,
      });
      setStagedLedgerEdits({});
      await loadData();
    }
  };

  const handleDiscardLedgerChanges = () => {
    setStagedLedgerEdits({});
    setUndoStack([]);
    setRedoStack([]);
    setFeedback({
      type: "success",
      message: "Discarded unsaved spreadsheet edits.",
    });
  };

  // ----------------------------------------------------------------------------
  // Microsoft Excel Copy / Paste Integration (Sections 34, 35, 36)
  // ----------------------------------------------------------------------------
  const handleCopyLedgerToClipboard = async () => {
    if (!matrixData) return;
    // Build Excel-compatible TSV string
    const headers = ["Employee Code", "Employee Name", "Department", ...matrixData.dates];
    const rows = matrixData.employees.map((row) => {
      const dayValues = matrixData.dates.map((d) => {
        const key = `${row.employee.id}_${d}`;
        const staged = stagedLedgerEdits[key];
        const status = staged ? (staged.status === "BLANK" ? "" : staged.status) : (row.days[d]?.status || "");
        const ot = staged ? staged.overtimeHours : (row.days[d]?.overtimeHours || 0);
        if (status === "PRESENT" && ot > 0) {
          return `P ${ot}h OT`;
        }
        if (status === "PRESENT") return "P";
        if (status === "ABSENT") return "A";
        if (status === "OD") return "OD";
        return "";
      });
      return [row.employee.employeeCode, row.employee.name, row.employee.department, ...dayValues].join("\t");
    });

    const tsvContent = [headers.join("\t"), ...rows].join("\n");
    try {
      await navigator.clipboard.writeText(tsvContent);
      setFeedback({
        type: "success",
        message: "Copied attendance spreadsheet matrix to clipboard (100% Microsoft Excel TSV compatible).",
      });
    } catch {
      setFeedback({ type: "error", message: "Clipboard write failed. Please check browser permissions." });
    }
  };

  const handlePasteFromExcel = async () => {
    if (!canEdit || !matrixData) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === "") {
        setFeedback({ type: "error", message: "Clipboard is empty." });
        return;
      }

      // Parse TSV lines
      const lines = text.trim().split(/\r?\n/).map((l) => l.split("\t"));
      const startRowIdx = ledgerSelectedCell?.rowIdx ?? 0;
      const startColIdx = ledgerSelectedCell?.colIdx ?? 0;

      const newEdits = { ...stagedLedgerEdits };
      let updatedCells = 0;
      const invalidTokens: string[] = [];

      lines.forEach((line, rOffset) => {
        const targetRow = matrixData.employees[startRowIdx + rOffset];
        if (!targetRow) return;

        line.forEach((cellRaw, cOffset) => {
          const targetDate = matrixData.dates[startColIdx + cOffset];
          if (!targetDate) return;

          const trimmed = cellRaw.trim().toUpperCase();
          if (trimmed === "" || trimmed === "-") {
            newEdits[`${targetRow.employee.id}_${targetDate}`] = {
              status: "BLANK",
              overtimeHours: 0,
              remarks: null,
            };
            updatedCells++;
            return;
          }

          // Parse "P 2H OT" or "P" or "A" or "OD"
          let status: AttendanceStatus | null = null;
          let otHours = 0;

          if (trimmed.startsWith("P")) {
            status = "PRESENT";
            const otMatch = trimmed.match(/(\d+(\.\d+)?)H/);
            if (otMatch) {
              otHours = parseFloat(otMatch[1]);
            }
          } else if (trimmed === "A" || trimmed === "ABSENT") {
            status = "ABSENT";
          } else if (trimmed === "OD" || trimmed === "ON DUTY") {
            status = "OD";
          } else {
            invalidTokens.push(cellRaw);
            return;
          }

          if (status) {
            newEdits[`${targetRow.employee.id}_${targetDate}`] = {
              status,
              overtimeHours: otHours,
              remarks: otHours > 0 ? "Pasted with OT" : null,
            };
            updatedCells++;
          }
        });
      });

      if (invalidTokens.length > 0) {
        setValidationError(`Invalid attendance value(s): "${invalidTokens.slice(0, 3).join('", "')}". Only P, A, OD, or Blank are permitted.`);
      } else {
        setValidationError(null);
      }

      if (updatedCells > 0) {
        setUndoStack((prev) => [...prev, stagedLedgerEdits]);
        setStagedLedgerEdits(newEdits);
        setFeedback({
          type: "success",
          message: `Pasted ${updatedCells} cells from Excel clipboard into spreadsheet matrix. Click "Save Changes" to commit.`,
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to read from clipboard. Ensure clipboard permissions are granted.",
      });
    }
  };

  // Keyboard Navigation & Shortcuts for Tab 2 Ledger
  useEffect(() => {
    if (activeTab !== "ledger" || !matrixData) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if active inside input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Ctrl + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoLedger();
        } else {
          handleUndoLedger();
        }
        return;
      }

      // Ctrl + Y (Redo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedoLedger();
        return;
      }

      // Ctrl + C (Copy)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyLedgerToClipboard();
        return;
      }

      // Ctrl + V (Paste)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        handlePasteFromExcel();
        return;
      }

      // Arrow Key Navigation
      if (ledgerSelectedCell) {
        let { rowIdx, colIdx } = ledgerSelectedCell;
        const maxRows = matrixData.employees.length;
        const maxCols = matrixData.dates.length;

        if (e.key === "ArrowUp") {
          e.preventDefault();
          rowIdx = Math.max(0, rowIdx - 1);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          rowIdx = Math.min(maxRows - 1, rowIdx + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          colIdx = Math.max(0, colIdx - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          colIdx = Math.min(maxCols - 1, colIdx + 1);
        } else if (e.key.toUpperCase() === "P") {
          e.preventDefault();
          handleLedgerCellEdit(ledgerSelectedCell.employeeId, ledgerSelectedCell.date, "PRESENT");
          return;
        } else if (e.key.toUpperCase() === "A") {
          e.preventDefault();
          handleLedgerCellEdit(ledgerSelectedCell.employeeId, ledgerSelectedCell.date, "ABSENT");
          return;
        } else if (e.key.toUpperCase() === "O") {
          e.preventDefault();
          handleLedgerCellEdit(ledgerSelectedCell.employeeId, ledgerSelectedCell.date, "OD");
          return;
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          handleLedgerCellEdit(ledgerSelectedCell.employeeId, ledgerSelectedCell.date, "BLANK");
          return;
        } else {
          return;
        }

        const newEmp = matrixData.employees[rowIdx];
        const newDate = matrixData.dates[colIdx];
        if (newEmp && newDate) {
          setLedgerSelectedCell({
            rowIdx,
            colIdx,
            employeeId: newEmp.employee.id,
            date: newDate,
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, matrixData, ledgerSelectedCell, stagedLedgerEdits, undoStack, redoStack]);

  // Selected Company Name
  const selectedCompanyName = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId)?.name || "KFab Infra Project Pvt Ltd";
  }, [companies, selectedCompanyId]);

  return (
    <div className="space-y-5">
      {/* -------------------------------------------------------------------- */}
      {/* 1. Header Bar: Title & Three Navigation Tabs */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-kfab flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#0284C7]/10 text-[#0284C7]">
              <CalendarCheck className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                Attendance Management
              </h1>
              <p className="text-xs text-[#64748B]">
                Authoritative workforce muster roll, rapid daily marking, and Excel-like monthly workbook.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Main Tabs (Tab 1: Attendance, Tab 2: Attendance Ledger, Tab 3: Reserved / Future) */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] shadow-xs">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "attendance"
                ? "bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1]"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <CalendarCheck className="size-3.5" />
            <span>Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "ledger"
                ? "bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1]"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <FileSpreadsheet className="size-3.5 text-[#16A34A]" />
            <span>Attendance Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("reserved")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "reserved"
                ? "bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1]"
                : "text-[#94A3B8] hover:text-[#64748B]"
            }`}
          >
            <Clock className="size-3.5 opacity-60" />
            <span>Reserved / Future</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#E2E8F0] text-[#64748B]">Tab 3</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. Global Feedback & Toast Alerts */}
      {/* -------------------------------------------------------------------- */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            feedback.type === "success"
              ? "bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]"
              : "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0 text-[#16A34A]" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-[#DC2626]" />
            )}
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

      {/* -------------------------------------------------------------------- */}
      {/* 3. Global Filters Bar (Adaptive Controls per View Mode) */}
      {/* -------------------------------------------------------------------- */}
      {activeTab !== "reserved" && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-kfab space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Company Selection */}
            <div className="flex items-center gap-2 min-w-[260px]">
              <span className="text-xs font-bold text-[#64748B] shrink-0">Company:</span>
              <div className="relative flex-1">
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Toggle (Only on Tab 1 Attendance) */}
            {activeTab === "attendance" && (
              <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#CBD5E1]">
                {(["daily", "weekly", "monthly", "custom"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-xs font-bold capitalize rounded-lg transition-all cursor-pointer ${
                      viewMode === mode
                        ? "bg-[#0284C7] text-white shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}

            {/* Instant Employee Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="size-3.5 absolute left-3 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="🔍 Search employee name, code..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
              />
              {employeeSearch && (
                <button
                  onClick={() => setEmployeeSearch("")}
                  className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-[#0F172A] text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Adaptive Second Row Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#F1F5F9] text-xs">
            {/* Daily View Controls */}
            {activeTab === "attendance" && viewMode === "daily" && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#64748B]">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer"
                />
              </div>
            )}

            {/* Weekly View Controls */}
            {activeTab === "attendance" && viewMode === "weekly" && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#64748B]">Week Commencing:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer"
                />
              </div>
            )}

            {/* Monthly View / Tab 2 Ledger Controls */}
            {(activeTab === "ledger" || (activeTab === "attendance" && viewMode === "monthly")) && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#64748B]">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#64748B]">Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Custom Date Range Controls */}
            {activeTab === "attendance" && viewMode === "custom" && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#64748B]">From:</span>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#64748B]">To:</span>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer"
                  />
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-[#0284C7] text-white font-bold rounded-xl text-xs hover:bg-[#0369A1] transition-colors cursor-pointer"
                >
                  Apply Range
                </button>
              </>
            )}

            {/* Account Role Read-Only Indicator */}
            {isAccountant && (
              <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#B45309] font-bold text-[11px] border border-[#FDE68A]">
                <Lock className="size-3" />
                <span>Accounting View (Read-Only)</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. Top KPI / Authoritative Summary Area (Section 6) */}
      {/* -------------------------------------------------------------------- */}
      {activeTab !== "reserved" && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-kfab">
            <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold">
              <span>Total Employees</span>
              <Users className="size-4 opacity-70" />
            </div>
            <p className="text-2xl font-black text-[#0F172A] mt-2">
              {summary.totalEmployees}
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">Authoritative roster count</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#BBF7D0] p-4 shadow-kfab bg-gradient-to-br from-white to-[#F0FDF4]">
            <div className="flex items-center justify-between text-[#16A34A] text-xs font-bold">
              <span>Present</span>
              <span className="size-2 rounded-full bg-[#16A34A] animate-pulse" />
            </div>
            <p className="text-2xl font-black text-[#15803D] mt-2">
              {summary.present}
            </p>
            <p className="text-[11px] text-[#16A34A] font-medium mt-0.5">
              Turnout: {summary.turnoutRate}%
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#FECACA] p-4 shadow-kfab bg-gradient-to-br from-white to-[#FEF2F2]">
            <div className="flex items-center justify-between text-[#DC2626] text-xs font-bold">
              <span>Absent</span>
              <XCircle className="size-4 opacity-70" />
            </div>
            <p className="text-2xl font-black text-[#B91C1C] mt-2">
              {summary.absent}
            </p>
            <p className="text-[11px] text-[#DC2626] font-medium mt-0.5">Real absent record</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#DDD6FE] p-4 shadow-kfab bg-gradient-to-br from-white to-[#FAF5FF]">
            <div className="flex items-center justify-between text-[#7C3AED] text-xs font-bold">
              <span>OD (On Duty)</span>
              <Building2 className="size-4 opacity-70" />
            </div>
            <p className="text-2xl font-black text-[#6D28D9] mt-2">
              {summary.od}
            </p>
            <p className="text-[11px] text-[#7C3AED] font-medium mt-0.5">External site duty</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#FED7AA] p-4 shadow-kfab bg-gradient-to-br from-white to-[#FFF7ED] col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-[#EA580C] text-xs font-bold">
              <span>Total Overtime</span>
              <Clock className="size-4 opacity-70" />
            </div>
            <p className="text-2xl font-black text-[#C2410C] mt-2">
              {summary.totalOvertimeHours} <span className="text-sm font-bold">h</span>
            </p>
            <p className="text-[11px] text-[#EA580C] font-medium mt-0.5">Decimal OT hours</p>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 5. TAB 1: ATTENDANCE (Daily, Weekly, Monthly, Custom Range) */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          {/* Daily Fast Marking Action Bar (Sections 8 & 9) */}
          {viewMode === "daily" && canEdit && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-kfab flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Quick Actions:
                </span>
                <button
                  onClick={() => handleMarkAll("PRESENT")}
                  className="px-3 py-1.5 rounded-xl bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0] border border-[#86EFAC] text-xs font-bold transition-colors cursor-pointer"
                >
                  ✓ Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAll("ABSENT")}
                  className="px-3 py-1.5 rounded-xl bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] border border-[#FCA5A5] text-xs font-bold transition-colors cursor-pointer"
                >
                  ✗ Mark All Absent
                </button>
                <button
                  onClick={() => setClearModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Today
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#64748B]">
                  {Object.keys(stagedDailyEdits).length} staged changes
                </span>
                <button
                  onClick={handleSaveDailyAttendance}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#16A34A] text-white hover:bg-[#15803D] shadow-sm font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="size-4" />
                  <span>{saving ? "Saving..." : "Save Attendance"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-kfab overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-[#64748B]">
                <div className="inline-block animate-spin size-6 border-2 border-[#0284C7] border-t-transparent rounded-full mb-2" />
                <p>Loading attendance data for {selectedCompanyName}...</p>
              </div>
            ) : viewMode === "daily" ? (
              /* DAILY VIEW TABLE */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-3">Code</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Designation</th>
                      <th className="py-3 px-4 text-center">Fast Marking Status</th>
                      <th className="py-3 px-3 text-center">Overtime</th>
                      <th className="py-3 px-3">Remarks</th>
                      {canEdit && <th className="py-3 px-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#64748B]">
                          No employees found matching query.
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp) => {
                        const staged = stagedDailyEdits[emp.id];
                        const currentStatus = staged ? staged.status : null;
                        const otHours = staged ? staged.overtimeHours : 0;
                        const remark = staged ? staged.remarks : null;

                        return (
                          <tr key={emp.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-3 px-4 font-bold text-[#0F172A]">
                              {emp.name}
                            </td>
                            <td className="py-3 px-3 text-[#64748B] font-mono">
                              {emp.employeeCode}
                            </td>
                            <td className="py-3 px-3 text-[#475569]">
                              {emp.department}
                            </td>
                            <td className="py-3 px-3 text-[#64748B]">
                              {emp.designation}
                            </td>

                            {/* Direct Status Buttons (PRESENT, ABSENT, OD) */}
                            <td className="py-2.5 px-4 text-center">
                              <div className="inline-flex items-center p-0.5 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1]">
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() => handleMarkDailyStatus(emp.id, "PRESENT")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    currentStatus === "PRESENT"
                                      ? "bg-[#16A34A] text-white shadow-xs"
                                      : "text-[#64748B] hover:text-[#16A34A]"
                                  }`}
                                >
                                  PRESENT
                                </button>
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() => handleMarkDailyStatus(emp.id, "ABSENT")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    currentStatus === "ABSENT"
                                      ? "bg-[#DC2626] text-white shadow-xs"
                                      : "text-[#64748B] hover:text-[#DC2626]"
                                  }`}
                                >
                                  ABSENT
                                </button>
                                <button
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() => handleMarkDailyStatus(emp.id, "OD")}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    currentStatus === "OD"
                                      ? "bg-[#7C3AED] text-white shadow-xs"
                                      : "text-[#64748B] hover:text-[#7C3AED]"
                                  }`}
                                >
                                  OD
                                </button>
                              </div>
                            </td>

                            {/* Overtime display */}
                            <td className="py-3 px-3 text-center">
                              {otHours > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74]">
                                  {otHours}h OT
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-[#64748B] max-w-[200px] truncate">
                              {remark || "-"}
                            </td>

                            {canEdit && (
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingOvertimeEmp({
                                      employeeId: emp.id,
                                      employeeName: emp.name,
                                      status: currentStatus || "PRESENT",
                                      overtimeHours: otHours,
                                      remarks: remark || "",
                                    })
                                  }
                                  className="text-xs text-[#0284C7] hover:underline font-bold cursor-pointer"
                                >
                                  Edit OT
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* WEEKLY, MONTHLY & CUSTOM MATRIX VIEWS */
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr className="text-[#475569] font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 sticky left-0 z-20 bg-[#F8FAFC] border-r border-[#E2E8F0] min-w-[180px]">
                        Employee
                      </th>
                      {matrixData?.dates.map((dt) => {
                        const dayNum = dt.split("-")[2];
                        const dateObj = new Date(dt);
                        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                        return (
                          <th
                            key={dt}
                            className="py-2.5 px-2 text-center min-w-[50px] border-r border-[#F1F5F9]"
                          >
                            <div className="text-[10px] text-[#64748B]">{dayName}</div>
                            <div className="font-bold text-[#0F172A]">{dayNum}</div>
                          </th>
                        );
                      })}
                      <th className="py-3 px-3 text-center bg-[#F1F5F9] min-w-[45px] font-bold text-[#15803D]">P</th>
                      <th className="py-3 px-3 text-center bg-[#F1F5F9] min-w-[45px] font-bold text-[#B91C1C]">A</th>
                      <th className="py-3 px-3 text-center bg-[#F1F5F9] min-w-[45px] font-bold text-[#6D28D9]">OD</th>
                      <th className="py-3 px-3 text-center bg-[#F1F5F9] min-w-[60px] font-bold text-[#C2410C]">OT h</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {matrixData?.employees.map((row) => (
                      <tr key={row.employee.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 sticky left-0 z-10 bg-white border-r border-[#E2E8F0] font-bold text-[#0F172A] truncate max-w-[200px]">
                          <div>{row.employee.name}</div>
                          <div className="text-[10px] text-[#64748B] font-mono font-normal">
                            {row.employee.employeeCode}
                          </div>
                        </td>

                        {matrixData.dates.map((dt) => {
                          const cell = row.days[dt];
                          if (!cell) {
                            // Rule 14: NO DATA != ABSENT (Blank cell)
                            return (
                              <td
                                key={dt}
                                className="py-2 px-1 text-center border-r border-[#F1F5F9] bg-white"
                              >
                                &nbsp;
                              </td>
                            );
                          }

                          if (cell.status === "PRESENT") {
                            return (
                              <td
                                key={dt}
                                className="py-1 px-1 text-center border-r border-[#86EFAC] bg-[#DCFCE7] text-[#15803D] font-black"
                              >
                                <div>P</div>
                                {cell.overtimeHours > 0 && (
                                  <div className="text-[9px] font-black text-[#0F172A] tracking-tighter">
                                    {cell.overtimeHours}h OT
                                  </div>
                                )}
                              </td>
                            );
                          }

                          if (cell.status === "ABSENT") {
                            return (
                              <td
                                key={dt}
                                className="py-1 px-1 text-center border-r border-[#FCA5A5] bg-[#FEE2E2] text-[#B91C1C] font-black"
                              >
                                <div>A</div>
                              </td>
                            );
                          }

                          if (cell.status === "OD") {
                            return (
                              <td
                                key={dt}
                                className="py-1 px-1 text-center border-r border-[#DDD6FE] bg-[#EDE9FE] text-[#6D28D9] font-black"
                              >
                                <div>OD</div>
                              </td>
                            );
                          }

                          return null;
                        })}

                        {/* Authoritative Employee Matrix Totals */}
                        <td className="py-2 px-2 text-center font-bold text-[#15803D] bg-[#F8FAFC]">
                          {row.totalPresent}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-[#B91C1C] bg-[#F8FAFC]">
                          {row.totalAbsent}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-[#6D28D9] bg-[#F8FAFC]">
                          {row.totalOD}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-[#C2410C] bg-[#F8FAFC]">
                          {row.totalOvertimeHours}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 6. TAB 2: ATTENDANCE LEDGER / EXCEL-LIKE WORKSPACE (Sections 26-40) */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === "ledger" && (
        <div className="space-y-3">
          {/* Spreadsheet Workspace Header (Section 69) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-kfab flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#16A34A]/10 text-[#16A34A]">
                <FileSpreadsheet className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
                  Attendance Workbook — {selectedCompanyName}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Spreadsheet Matrix • Year {selectedYear} • {MONTH_NAMES[selectedMonth - 1]} Sheet
                </p>
              </div>
            </div>

            {/* Freeze Controls */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setFreezeEmployeeCol(!freezeEmployeeCol)}
                className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  freezeEmployeeCol
                    ? "bg-[#0284C7] text-white border-[#0284C7]"
                    : "bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1]"
                }`}
              >
                <Lock className="size-3" />
                <span>Freeze Employee Column</span>
              </button>

              <button
                onClick={() => setFreezeHeaderRow(!freezeHeaderRow)}
                className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  freezeHeaderRow
                    ? "bg-[#0284C7] text-white border-[#0284C7]"
                    : "bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1]"
                }`}
              >
                <Lock className="size-3" />
                <span>Freeze Header Row</span>
              </button>
            </div>
          </div>

          {/* Spreadsheet Practical Toolbar (Section 70) */}
          <div className="bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndoLedger}
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-lg hover:bg-[#E2E8F0] text-[#0F172A] disabled:opacity-30 cursor-pointer"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                onClick={handleRedoLedger}
                disabled={redoStack.length === 0}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded-lg hover:bg-[#E2E8F0] text-[#0F172A] disabled:opacity-30 cursor-pointer"
              >
                <RotateCw className="size-4" />
              </button>

              <div className="h-4 w-px bg-[#CBD5E1] mx-1" />

              <button
                onClick={handleCopyLedgerToClipboard}
                title="Copy entire sheet to clipboard (Ctrl+C)"
                className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Copy</span>
              </button>

              <button
                onClick={handlePasteFromExcel}
                disabled={!canEdit}
                title="Paste from Microsoft Excel (Ctrl+V)"
                className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Clipboard className="size-3.5 text-[#16A34A]" />
                <span>Paste from Excel</span>
              </button>

              <div className="h-4 w-px bg-[#CBD5E1] mx-1" />

              <span className="text-[11px] text-[#64748B] ml-2">
                Tip: Click cell & press <strong>P</strong>, <strong>A</strong>, <strong>O</strong>, or <strong>Del</strong>
              </span>
            </div>

            {/* Unsaved Changes Indicator (Section 61) */}
            <div className="flex items-center gap-2">
              {unsavedLedgerCount > 0 && (
                <span className="text-xs font-bold text-[#C2410C] bg-[#FFEDD5] px-2.5 py-1 rounded-lg border border-[#FDBA74]">
                  Unsaved changes: {unsavedLedgerCount}
                </span>
              )}

              {unsavedLedgerCount > 0 && (
                <>
                  <button
                    onClick={handleDiscardLedgerChanges}
                    className="px-3 py-1 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9] font-bold cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveLedgerChanges}
                    disabled={saving}
                    className="px-4 py-1 rounded-lg bg-[#16A34A] text-white hover:bg-[#15803D] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="size-3.5" />
                    <span>{saving ? "Saving..." : "Save Workbook"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Validation Error Banner (Section 63) */}
          {validationError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs font-semibold text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Excel Spreadsheet Scrolling Matrix Container */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-kfab overflow-hidden">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-left text-xs border-collapse font-sans select-none">
                <thead className={`${freezeHeaderRow ? "sticky top-0 z-20" : ""} bg-[#F1F5F9] border-b border-[#CBD5E1]`}>
                  <tr className="text-[#334155] font-bold text-[11px]">
                    <th
                      className={`py-2 px-3 border-r border-[#CBD5E1] ${
                        freezeEmployeeCol ? "sticky left-0 z-30" : ""
                      } bg-[#E2E8F0] min-w-[200px] shadow-sm`}
                    >
                      Employee Name (Sheet 1)
                    </th>
                    {matrixData?.dates.map((dt, colIdx) => {
                      const dayNum = dt.split("-")[2];
                      return (
                        <th
                          key={dt}
                          className="py-1.5 px-1 text-center min-w-[46px] max-w-[46px] border-r border-[#CBD5E1] bg-[#F1F5F9] text-[#475569] font-mono text-[11px]"
                        >
                          {dayNum}
                        </th>
                      );
                    })}
                    <th className="py-2 px-3 text-center bg-[#E2E8F0] min-w-[45px] font-bold text-[#15803D]">P</th>
                    <th className="py-2 px-3 text-center bg-[#E2E8F0] min-w-[45px] font-bold text-[#B91C1C]">A</th>
                    <th className="py-2 px-3 text-center bg-[#E2E8F0] min-w-[45px] font-bold text-[#6D28D9]">OD</th>
                    <th className="py-2 px-3 text-center bg-[#E2E8F0] min-w-[55px] font-bold text-[#C2410C]">OT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {matrixData?.employees.map((row, rowIdx) => (
                    <tr key={row.employee.id} className="hover:bg-[#F8FAFC]">
                      {/* Frozen Column 1: Employee Name */}
                      <td
                        className={`py-2 px-3 border-r border-[#CBD5E1] ${
                          freezeEmployeeCol ? "sticky left-0 z-10" : ""
                        } bg-white font-bold text-[#0F172A] truncate max-w-[200px] shadow-xs`}
                      >
                        <div className="truncate">{row.employee.name}</div>
                        <div className="text-[10px] text-[#64748B] font-mono font-normal">
                          {row.employee.employeeCode}
                        </div>
                      </td>

                      {/* Date Cells */}
                      {matrixData.dates.map((dt, colIdx) => {
                        const cellKey = `${row.employee.id}_${dt}`;
                        const staged = stagedLedgerEdits[cellKey];
                        const authoritative = row.days[dt];

                        const isSelected =
                          ledgerSelectedCell?.rowIdx === rowIdx &&
                          ledgerSelectedCell?.colIdx === colIdx;

                        let status: "PRESENT" | "ABSENT" | "OD" | "BLANK" = "BLANK";
                        let otHours = 0;

                        if (staged) {
                          status = staged.status;
                          otHours = staged.overtimeHours;
                        } else if (authoritative) {
                          status = authoritative.status;
                          otHours = authoritative.overtimeHours;
                        }

                        // Colors based on Status
                        let bgClass = "bg-white text-transparent";
                        let displayVal = "";

                        if (status === "PRESENT") {
                          bgClass = "bg-[#DCFCE7] text-[#15803D] font-black";
                          displayVal = "P";
                        } else if (status === "ABSENT") {
                          bgClass = "bg-[#FEE2E2] text-[#B91C1C] font-black";
                          displayVal = "A";
                        } else if (status === "OD") {
                          bgClass = "bg-[#EDE9FE] text-[#6D28D9] font-black";
                          displayVal = "OD";
                        }

                        return (
                          <td
                            key={dt}
                            onClick={() =>
                              handleLedgerCellClick(rowIdx, colIdx, row.employee.id, dt)
                            }
                            onDoubleClick={() => {
                              if (!canEdit) return;
                              // Toggle status cycle on double click
                              const nextStatus =
                                status === "BLANK"
                                  ? "PRESENT"
                                  : status === "PRESENT"
                                  ? "ABSENT"
                                  : status === "ABSENT"
                                  ? "OD"
                                  : "BLANK";
                              handleLedgerCellEdit(row.employee.id, dt, nextStatus);
                            }}
                            className={`py-1.5 px-0.5 text-center border-r border-[#CBD5E1] cursor-pointer transition-all ${bgClass} ${
                              isSelected
                                ? "ring-2 ring-[#0284C7] ring-inset font-black z-5"
                                : ""
                            } ${staged ? "border-b-2 border-b-[#F97316]" : ""}`}
                          >
                            <div className="text-[11px] leading-none">{displayVal}</div>
                            {status === "PRESENT" && otHours > 0 && (
                              <div className="text-[8px] font-black text-[#0F172A] leading-tight">
                                {otHours}h
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Totals */}
                      <td className="py-2 px-2 text-center font-bold text-[#15803D] bg-[#F8FAFC]">
                        {row.totalPresent}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-[#B91C1C] bg-[#F8FAFC]">
                        {row.totalAbsent}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-[#6D28D9] bg-[#F8FAFC]">
                        {row.totalOD}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-[#C2410C] bg-[#F8FAFC]">
                        {row.totalOvertimeHours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 12 Monthly Spreadsheet Sheets Tab Bar (Section 38) */}
          <div className="bg-[#E2E8F0] p-1.5 rounded-xl border border-[#CBD5E1] flex items-center overflow-x-auto gap-1 shadow-inner">
            <span className="text-[10px] font-bold text-[#64748B] uppercase px-2 shrink-0">
              Monthly Sheets:
            </span>
            {MONTH_SHORT.map((mShort, idx) => {
              const monthNumber = idx + 1;
              const isCurrentSheet = selectedMonth === monthNumber;
              return (
                <button
                  key={mShort}
                  onClick={() => {
                    if (unsavedLedgerCount > 0) {
                      if (!confirm("You have unsaved spreadsheet edits on this sheet. Switch anyway?")) {
                        return;
                      }
                    }
                    setSelectedMonth(monthNumber);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isCurrentSheet
                      ? "bg-white text-[#0F172A] shadow-md border-t-2 border-t-[#0284C7]"
                      : "text-[#475569] hover:bg-[#CBD5E1]/60"
                  }`}
                >
                  {mShort}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 7. TAB 3: RESERVED / FUTURE (Section 2) */}
      {/* "The third tab is intentionally reserved. DO NOT invent functionality for Tab 3." */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === "reserved" && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-kfab space-y-4">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-[#F1F5F9] text-[#64748B] mb-2">
            <Clock className="size-7" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A]">
            Tab 3 — Reserved / Future Functionality
          </h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            This module tab is intentionally reserved in accordance with the KFab360 Architecture Specification for upcoming biometric hardware synchronization, time-clock integration, and facial verification.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-semibold text-[#475569]">
            <span>Architecture Reserved • No invented logic per Section 2 Specification</span>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 8. Modal: Confirmation for "Clear Today" Destructive Action (Section 9) */}
      {/* -------------------------------------------------------------------- */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <span className="p-2 rounded-xl bg-[#FEE2E2]">
                <AlertTriangle className="size-5" />
              </span>
              <h3 className="text-sm font-bold text-[#0F172A]">
                Confirm Clear Attendance Records
              </h3>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Are you sure you want to clear attendance for{" "}
              <strong>{employees.length} employees</strong> on{" "}
              <strong>{selectedDate}</strong>?
            </p>
            <p className="text-[11px] text-[#64748B] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              <strong>Rule 9 Note:</strong> This operation clears existing attendance records (returning cells to blank / no-data) rather than marking workers absent.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearToday}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] cursor-pointer disabled:opacity-50"
              >
                {saving ? "Clearing..." : "Clear Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 9. Modal: Overtime & Remarks Editing (Section 16) */}
      {/* -------------------------------------------------------------------- */}
      {editingOvertimeEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Edit Overtime & Remark
                </h3>
                <p className="text-xs text-[#64748B]">
                  Employee: <strong>{editingOvertimeEmp.employeeName}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingOvertimeEmp(null)}
                className="text-xs font-bold text-[#94A3B8] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Attendance Status
                </label>
                <div className="inline-block px-3 py-1 rounded-lg font-bold bg-[#DCFCE7] text-[#15803D]">
                  {editingOvertimeEmp.status}
                </div>
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Overtime Hours (Numeric Decimal, e.g. 1.5, 2.0, 4)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={editingOvertimeEmp.overtimeHours}
                  onChange={(e) =>
                    setEditingOvertimeEmp({
                      ...editingOvertimeEmp,
                      overtimeHours: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-bold focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Remark / Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editingOvertimeEmp.remarks}
                  onChange={(e) =>
                    setEditingOvertimeEmp({
                      ...editingOvertimeEmp,
                      remarks: e.target.value,
                    })
                  }
                  placeholder="e.g. Completed urgent fabrication work for dispatch"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setEditingOvertimeEmp(null)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOvertimeModal}
                className="px-4 py-2 rounded-xl bg-[#0284C7] text-white text-xs font-bold hover:bg-[#0369A1] cursor-pointer shadow-sm"
              >
                Save Overtime
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
