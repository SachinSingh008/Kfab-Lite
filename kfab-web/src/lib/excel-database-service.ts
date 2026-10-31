// =============================================================================
// KFab360 — Authoritative Live Excel Database Service (excel-database-service.ts)
// Permanent database source of truth for all Excel Workbooks in KFab360.
// Handles Supabase synchronization, formula evaluation, cross-table routing,
// business logic calculation, series fill extrapolation, and dimension persistence.
// =============================================================================

import { createClient } from "./supabase/client";
import * as XLSX from "xlsx";

export interface CellCoord {
  r: number;
  c: number;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  align?: "left" | "center" | "right";
  color?: string;
  bgColor?: string;
  format?: "text" | "currency" | "percent" | "number" | "date";
  fontSize?: number;
}

export interface WorksheetDimensions {
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  freezeRow?: number;
  freezeCol?: number;
}

export interface CellMerge {
  startR: number;
  startC: number;
  endR: number;
  endC: number;
}

const STORAGE_PREFIX = "kfab360_excel_db_";
const DIMENSIONS_PREFIX = "kfab360_excel_dims_";
const STYLES_PREFIX = "kfab360_excel_styles_";
const MERGES_PREFIX = "kfab360_excel_merges_";

/**
 * Checks if Supabase client is available in current environment
 */
function getSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Column & Coordinate Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

export function colToLetter(colIndex: number): string {
  let temp = colIndex + 1;
  let letter = "";
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

export function letterToCol(letterStr: string): number {
  const clean = letterStr.trim().toUpperCase();
  let col = 0;
  for (let i = 0; i < clean.length; i++) {
    col = col * 26 + (clean.charCodeAt(i) - 64);
  }
  return col - 1;
}

export function parseCellCoord(ref: string): { r: number; c: number } | null {
  const match = ref.trim().match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  const col = letterToCol(match[1]);
  const row = parseInt(match[2], 10) - 1;
  return { r: row, c: col };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Comprehensive Formula Engine
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateFormula(formula: string, grid: any[][]): string | number {
  if (!formula || typeof formula !== "string" || !formula.startsWith("=")) {
    return formula;
  }

  const expr = formula.substring(1).trim();

  // Helper to extract values from range e.g. "A1:A10"
  const getRangeValues = (rangeStr: string): number[] => {
    const parts = rangeStr.split(":");
    if (parts.length !== 2) {
      const single = parseCellCoord(rangeStr);
      if (single && grid[single.r] && grid[single.r][single.c] !== undefined) {
        const val = parseFloat(grid[single.r][single.c]);
        return isNaN(val) ? [] : [val];
      }
      return [];
    }

    const start = parseCellCoord(parts[0]);
    const end = parseCellCoord(parts[1]);
    if (!start || !end) return [];

    const minR = Math.min(start.r, end.r);
    const maxR = Math.max(start.r, end.r);
    const minC = Math.min(start.c, end.c);
    const maxC = Math.max(start.c, end.c);

    const values: number[] = [];
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (grid[r] && grid[r][c] !== undefined) {
          const val = parseFloat(grid[r][c]);
          if (!isNaN(val)) {
            values.push(val);
          }
        }
      }
    }
    return values;
  };

  // SUM function
  const sumMatch = expr.match(/^SUM\(([^)]+)\)$/i);
  if (sumMatch) {
    const vals = getRangeValues(sumMatch[1]);
    const total = vals.reduce((acc, v) => acc + v, 0);
    return Math.round(total * 100) / 100;
  }

  // AVERAGE function
  const avgMatch = expr.match(/^AVERAGE\(([^)]+)\)$/i);
  if (avgMatch) {
    const vals = getRangeValues(avgMatch[1]);
    if (vals.length === 0) return 0;
    const avg = vals.reduce((acc, v) => acc + v, 0) / vals.length;
    return Math.round(avg * 100) / 100;
  }

  // COUNT / COUNTA function
  const countMatch = expr.match(/^COUNT(?:A)?\(([^)]+)\)$/i);
  if (countMatch) {
    const vals = getRangeValues(countMatch[1]);
    return vals.length;
  }

  // MIN function
  const minMatch = expr.match(/^MIN\(([^)]+)\)$/i);
  if (minMatch) {
    const vals = getRangeValues(minMatch[1]);
    return vals.length > 0 ? Math.min(...vals) : 0;
  }

  // MAX function
  const maxMatch = expr.match(/^MAX\(([^)]+)\)$/i);
  if (maxMatch) {
    const vals = getRangeValues(maxMatch[1]);
    return vals.length > 0 ? Math.max(...vals) : 0;
  }

  // Simple arithmetic with cell refs e.g. "C5*D5", "A1+B1", "E10-F10"
  try {
    let replacedExpr = expr.replace(/[A-Za-z]+\d+/g, (match) => {
      const coord = parseCellCoord(match);
      if (coord && grid[coord.r] && grid[coord.r][coord.c] !== undefined) {
        const val = parseFloat(grid[coord.r][coord.c]);
        return isNaN(val) ? "0" : val.toString();
      }
      return "0";
    });

    if (/^[0-9+\-*\/().\s%]+$/.test(replacedExpr)) {
      // eslint-disable-next-line no-eval
      const result = Function('"use strict";return (' + replacedExpr + ')')();
      if (typeof result === "number" && !isNaN(result)) {
        return Math.round(result * 100) / 100;
      }
    }
  } catch {
    return "#VALUE!";
  }

  return formula;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Drag-and-Fill Series Extrapolation Engine
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Extrapolates a sequence of values based on the initial seed rows/cols.
 * Supports numbers (1,2 -> 3,4), months (Jan -> Feb), days (Mon -> Tue),
 * dates (YYYY-MM-DD), and relative formula reference shifts (=F6*G6 -> =F7*G7).
 */
export function extrapolateSeries(
  sourceValues: any[],
  stepsNeeded: number,
  direction: "down" | "right" | "up" | "left" = "down"
): any[] {
  if (sourceValues.length === 0 || stepsNeeded <= 0) return [];
  const results: any[] = [];
  const first = String(sourceValues[0] ?? "").trim();

  // 1. Month names
  const mLongIdx = MONTHS_LONG.findIndex((m) => m.toLowerCase() === first.toLowerCase());
  if (mLongIdx !== -1) {
    for (let i = 1; i <= stepsNeeded; i++) {
      const step = direction === "up" || direction === "left" ? -i : i;
      const targetIdx = (((mLongIdx + step) % 12) + 12) % 12;
      results.push(MONTHS_LONG[targetIdx]);
    }
    return results;
  }

  const mShortIdx = MONTHS_SHORT.findIndex((m) => m.toLowerCase() === first.toLowerCase());
  if (mShortIdx !== -1) {
    for (let i = 1; i <= stepsNeeded; i++) {
      const step = direction === "up" || direction === "left" ? -i : i;
      const targetIdx = (((mShortIdx + step) % 12) + 12) % 12;
      results.push(MONTHS_SHORT[targetIdx]);
    }
    return results;
  }

  // 2. Day names
  const dLongIdx = DAYS_LONG.findIndex((d) => d.toLowerCase() === first.toLowerCase());
  if (dLongIdx !== -1) {
    for (let i = 1; i <= stepsNeeded; i++) {
      const step = direction === "up" || direction === "left" ? -i : i;
      const targetIdx = (((dLongIdx + step) % 7) + 7) % 7;
      results.push(DAYS_LONG[targetIdx]);
    }
    return results;
  }

  // 3. Numbers (step calculation from 1 or 2 items)
  const num1 = parseFloat(first);
  if (!isNaN(num1) && String(num1) === first) {
    let diff = 1;
    if (sourceValues.length > 1) {
      const num2 = parseFloat(String(sourceValues[1]));
      if (!isNaN(num2)) diff = num2 - num1;
    }
    let cur = num1;
    for (let i = 1; i <= stepsNeeded; i++) {
      cur += direction === "up" || direction === "left" ? -diff : diff;
      results.push(Math.round(cur * 1000) / 1000);
    }
    return results;
  }

  // 4. Formula relative reference adjustment
  if (first.startsWith("=")) {
    for (let i = 1; i <= stepsNeeded; i++) {
      const step = direction === "up" || direction === "left" ? -i : i;
      const shifted = first.replace(/([A-Za-z]+)(\d+)/g, (match, colStr, rowStr) => {
        if (direction === "down" || direction === "up") {
          const nextRow = Math.max(1, parseInt(rowStr, 10) + step);
          return colStr + nextRow;
        } else {
          // Horizontal shift
          const colIdx = letterToCol(colStr);
          const nextCol = Math.max(0, colIdx + step);
          return colToLetter(nextCol) + rowStr;
        }
      });
      results.push(shifted);
    }
    return results;
  }

  // 5. Default: Replicate pattern
  for (let i = 1; i <= stepsNeeded; i++) {
    results.push(sourceValues[(i - 1) % sourceValues.length]);
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Specialized Business Logic Calculators
// ─────────────────────────────────────────────────────────────────────────────

export function calculateAttendanceRow(row: any[]): {
  pDays: number;
  hdDays: number;
  odDays: number;
  otHours: number;
  totalPresentDays: number;
} {
  let pCount = 0;
  let hdCount = 0;
  let odCount = 0;
  let otSum = 0;

  for (let c = 3; c <= 33; c++) {
    const cell = row[c];
    if (cell === undefined || cell === null || cell === "") continue;
    const str = String(cell).trim().toUpperCase();

    if (str === "P" || str === "PRESENT") {
      pCount += 1;
    } else if (str === "HD" || str === "HALF DAY" || str === "0.5") {
      hdCount += 1;
    } else if (str === "OD" || str === "ON DUTY") {
      odCount += 1;
    } else {
      const num = parseFloat(str);
      if (!isNaN(num)) {
        otSum += num;
      }
    }
  }

  const totalPresentDays = pCount + (hdCount * 0.5) + odCount + (otSum / 10);

  return {
    pDays: pCount,
    hdDays: hdCount,
    odDays: odCount,
    otHours: otSum,
    totalPresentDays: Math.round(totalPresentDays * 100) / 100,
  };
}

export function calculateSalaryRow(row: any[]): any[] {
  const updated = [...row];
  const pDay = parseFloat(updated[2]) || 0;
  const ot = parseFloat(updated[3]) || 0;
  const rate = parseFloat(updated[5]) || 0;
  const otAmount = parseFloat(updated[8]) || 0;
  const advance = parseFloat(updated[10]) || 0;
  const roomRent = parseFloat(updated[12]) || 0;
  const backSalary = parseFloat(updated[14]) || 0;

  const perDay = Math.round((rate / 30) * 100) / 100;
  const totalDay = Math.round((pDay + ot) * 100) / 100;
  const salary = Math.round((totalDay * perDay) * 100) / 100;
  const totalSalary = Math.round((salary + otAmount) * 100) / 100;
  const salaryPayable = Math.round((totalSalary - advance - roomRent + backSalary) * 100) / 100;

  updated[4] = totalDay;
  updated[6] = perDay;
  updated[7] = salary;
  updated[9] = totalSalary;
  updated[15] = salaryPayable;

  return updated;
}

export function syncAdvanceToSalary(salaryGrid: any[][], advanceGrid: any[][]): any[][] {
  const advanceMap: Record<string, number> = {};

  advanceGrid.forEach((row, idx) => {
    if (idx < 5) return;
    const name = String(row[1] || "").trim().toLowerCase();
    if (!name) return;
    const total = parseFloat(row[row.length - 1]) || 0;
    advanceMap[name] = total;
  });

  return salaryGrid.map((row, idx) => {
    if (idx < 5) return row;
    const name = String(row[1] || "").trim().toLowerCase();
    if (!name || advanceMap[name] === undefined) return row;

    const updated = [...row];
    updated[10] = advanceMap[name];
    return calculateSalaryRow(updated);
  });
}

export function filterEmployeeMasterGrid(allRows: any[][], view: "Active" | "Bank Details" | "Inactive"): any[][] {
  if (allRows.length < 5) return allRows;
  const headers = allRows.slice(0, 4);
  const dataRows = allRows.slice(4);

  if (view === "Active" || view === "Bank Details") {
    return [...headers, ...dataRows.filter((r) => String(r[35] || "").toLowerCase() !== "inactive")];
  } else if (view === "Inactive") {
    return [...headers, ...dataRows.filter((r) => String(r[35] || "").toLowerCase() === "inactive")];
  }

  return allRows;
}

export function routeExpensesGrid(allRows: any[][], category: "All" | "Recurring" | "One time" | "miscellaneous"): any[][] {
  if (category === "All" || allRows.length < 4) return allRows;
  const headers = allRows.slice(0, 4);
  const dataRows = allRows.slice(4);

  const filtered = dataRows.filter((r) => {
    const cat = String(r[12] || "").trim().toLowerCase();
    return cat === category.toLowerCase();
  });

  return [...headers, ...filtered];
}

export function routeOutwardGrid(allRows: any[][], company: "All" | "Hubli" | "KFPL" | "KIPL" | "Lonanad"): any[][] {
  if (company === "All" || allRows.length < 4) return allRows;
  const headers = allRows.slice(0, 4);
  const dataRows = allRows.slice(4);

  const filtered = dataRows.filter((r) => {
    const comp = String(r[12] || "").trim().toLowerCase();
    return comp === company.toLowerCase();
  });

  return [...headers, ...filtered];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Worksheet Dimensions & Styling Persistence
// ─────────────────────────────────────────────────────────────────────────────

export function loadWorksheetDimensions(workbookId: string, sheetName: string): WorksheetDimensions {
  const defaultDims: WorksheetDimensions = {
    colWidths: {},
    rowHeights: {},
    freezeRow: 0,
    freezeCol: 0,
  };

  if (typeof window === "undefined") return defaultDims;

  const key = `${DIMENSIONS_PREFIX}${workbookId}_${sheetName}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return { ...defaultDims, ...JSON.parse(cached) };
    } catch {
      // fallback
    }
  }
  return defaultDims;
}

export function saveWorksheetDimensions(
  workbookId: string,
  sheetName: string,
  dimensions: WorksheetDimensions
) {
  if (typeof window === "undefined") return;
  const key = `${DIMENSIONS_PREFIX}${workbookId}_${sheetName}`;
  try {
    localStorage.setItem(key, JSON.stringify(dimensions));
  } catch (e) {
    console.warn("[ExcelDatabaseService] Failed to cache dimensions:", e);
  }
}

export function loadCellStyles(workbookId: string, sheetName: string): Record<string, CellStyle> {
  if (typeof window === "undefined") return {};
  const key = `${STYLES_PREFIX}${workbookId}_${sheetName}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  return {};
}

export function saveCellStyles(
  workbookId: string,
  sheetName: string,
  styles: Record<string, CellStyle>
) {
  if (typeof window === "undefined") return;
  const key = `${STYLES_PREFIX}${workbookId}_${sheetName}`;
  try {
    localStorage.setItem(key, JSON.stringify(styles));
  } catch (e) {
    console.warn("[ExcelDatabaseService] Failed to cache styles:", e);
  }
}

export function loadCellMerges(
  workbookId: string,
  sheetName: string,
  fallbackMerges?: CellMerge[]
): CellMerge[] {
  if (typeof window === "undefined") return fallbackMerges || [];
  const key = `${MERGES_PREFIX}${workbookId}_${sheetName}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  return fallbackMerges || [];
}

export function saveCellMerges(
  workbookId: string,
  sheetName: string,
  merges: CellMerge[]
) {
  if (typeof window === "undefined") return;
  const key = `${MERGES_PREFIX}${workbookId}_${sheetName}`;
  try {
    localStorage.setItem(key, JSON.stringify(merges));
  } catch (e) {
    console.warn("[ExcelDatabaseService] Failed to cache merges:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Authoritative Live Data Storage & Sync Bridge
// ─────────────────────────────────────────────────────────────────────────────

export function loadSheetGrid(workbookId: string, sheetName: string, fallbackData?: any[][]): any[][] {
  if (typeof window === "undefined") return fallbackData || [];

  const key = `${STORAGE_PREFIX}${workbookId}_${sheetName}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  return fallbackData || [];
}

export async function saveSheetGrid(
  workbookId: string,
  sheetName: string,
  grid: any[][]
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: true };

  const key = `${STORAGE_PREFIX}${workbookId}_${sheetName}`;
  try {
    localStorage.setItem(key, JSON.stringify(grid));
  } catch (err: any) {
    console.warn("[ExcelDatabaseService] LocalStorage warning:", err?.message);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from("audit_logs").insert({
        action: "EXCEL_WORKBOOK_UPDATE",
        details: {
          workbookId,
          sheetName,
          rowCount: grid.length,
          colCount: grid[0]?.length || 0,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.warn("[ExcelDatabaseService] Supabase sync status:", dbErr);
    }
  }

  return { success: true };
}

export function resetWorkbookToOriginal(workbookId: string, sheetNames: string[]) {
  if (typeof window === "undefined") return;
  sheetNames.forEach((sheet) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${workbookId}_${sheet}`);
    localStorage.removeItem(`${DIMENSIONS_PREFIX}${workbookId}_${sheet}`);
    localStorage.removeItem(`${STYLES_PREFIX}${workbookId}_${sheet}`);
    localStorage.removeItem(`${MERGES_PREFIX}${workbookId}_${sheet}`);
  });
}
