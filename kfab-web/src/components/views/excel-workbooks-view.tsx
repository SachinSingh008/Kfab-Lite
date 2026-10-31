"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  DATABASE_WORKBOOKS,
  DatabaseWorkbookItem,
} from "@/lib/database-workbooks-manifest";
import {
  loadSheetGrid,
  saveSheetGrid,
  evaluateFormula,
  calculateSalaryRow,
  syncAdvanceToSalary,
  calculateAttendanceRow,
  routeExpensesGrid,
  routeOutwardGrid,
  filterEmployeeMasterGrid,
  resetWorkbookToOriginal,
  loadWorksheetDimensions,
  saveWorksheetDimensions,
  loadCellStyles,
  saveCellStyles,
  loadCellMerges,
  saveCellMerges,
  CellMerge,
  extrapolateSeries,
  colToLetter,
  letterToCol,
  parseCellCoord,
  CellStyle,
  WorksheetDimensions,
} from "@/lib/excel-database-service";
import {
  FileSpreadsheet,
  Download,
  Search,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FileDown,
  Copy,
  Scissors,
  Clipboard,
  Check,
  Plus,
  Trash2,
  Calendar,
  Save,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Calculator,
  Filter,
  ArrowUpDown,
  Printer,
  Maximize2,
  Minimize2,
  Grid,
  Percent,
  IndianRupee,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  CheckCircle2,
  Database,
  Layers,
  HelpCircle,
  Paintbrush,
  Columns,
  Rows,
  Eye,
  EyeOff,
  MoreVertical,
  X,
  Replace,
  TableCellsMerge,
  TableCellsSplit,
} from "lucide-react";

interface ExcelWorkbooksViewProps {
  initialWorkbookId?: string;
}

interface FolderNode {
  name: string;
  fullPath: string;
  files: DatabaseWorkbookItem[];
  subfolders: Record<string, FolderNode>;
  totalCount: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  r: number;
  c: number;
}

interface HistorySnapshot {
  grid: any[][];
  merges: CellMerge[];
}

export function ExcelWorkbooksView({ initialWorkbookId }: ExcelWorkbooksViewProps) {
  // ─── 1. WORKBOOK & SHEET STATE ─────────────────────────────────────────────
  const [selectedWorkbook, setSelectedWorkbook] = useState<DatabaseWorkbookItem>(() => {
    if (initialWorkbookId) {
      const found = DATABASE_WORKBOOKS.find((w) => w.id === initialWorkbookId);
      if (found) return found;
    }
    return (
      DATABASE_WORKBOOKS.find((w) =>
        w.path.includes("Salary and Advance/2025/KFPL_Salary_and_Advance")
      ) ||
      DATABASE_WORKBOOKS.find((w) => w.fileName.includes("Attendance_2025")) ||
      DATABASE_WORKBOOKS[0]
    );
  });

  const [activeSheetName, setActiveSheetName] = useState<string>("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [gridData, setGridData] = useState<any[][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── 2. AUTOSAVE & DATABASE STATE ──────────────────────────────────────────
  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING" | "OFFLINE_SYNC">("SAVED");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── 3. SELECTION & RANGE STATE ────────────────────────────────────────────
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [selectionRange, setSelectionRange] = useState<{
    startR: number;
    startC: number;
    endR: number;
    endC: number;
  }>({ startR: 0, startC: 0, endR: 0, endC: 0 });
  const [isSelectingRange, setIsSelectingRange] = useState<boolean>(false);

  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [formulaBarValue, setFormulaBarValue] = useState<string>("");
  const [nameBoxInput, setNameBoxInput] = useState<string>("A1");

  // ─── 4. DIMENSIONS (ROW HEIGHTS & COLUMN WIDTHS) ───────────────────────────
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
  const [resizingCol, setResizingCol] = useState<{ col: number; startX: number; startW: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ row: number; startY: number; startH: number } | null>(null);

  // ─── 5. CELL STYLING & FORMAT PAINTER ──────────────────────────────────────
  const [cellStyles, setCellStyles] = useState<Record<string, CellStyle>>({});
  const [formatPainterStyle, setFormatPainterStyle] = useState<CellStyle | null>(null);

  // ─── 5.5. CELL MERGING STATE ────────────────────────────────────────────────
  const [cellMerges, setCellMerges] = useState<CellMerge[]>([]);
  const cellMergesRef = useRef<CellMerge[]>([]);
  const [showMergeDropdown, setShowMergeDropdown] = useState<boolean>(false);
  const mergeDropdownRef = useRef<HTMLDivElement>(null);

  // Close merge dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mergeDropdownRef.current && !mergeDropdownRef.current.contains(e.target as Node)) {
        setShowMergeDropdown(false);
      }
    };
    if (showMergeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMergeDropdown]);

  // ─── 6. DRAG AND FILL HANDLE STATE ─────────────────────────────────────────
  const [isDraggingFill, setIsDraggingFill] = useState<boolean>(false);
  const [fillPreviewRange, setFillPreviewRange] = useState<{
    startR: number;
    startC: number;
    endR: number;
    endC: number;
  } | null>(null);

  // ─── 7. DRAG AND MOVE RANGE STATE ──────────────────────────────────────────
  const [isDraggingMove, setIsDraggingMove] = useState<boolean>(false);
  const [moveDropTarget, setMoveDropTarget] = useState<{ r: number; c: number } | null>(null);

  // ─── 8. UNDO & REDO STACK ──────────────────────────────────────────────────
  const historyStackRef = useRef<HistorySnapshot[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // ─── 9. CLIPBOARD & CUT STATE ──────────────────────────────────────────────
  const [internalClipboard, setInternalClipboard] = useState<{
    range: { startR: number; startC: number; endR: number; endC: number };
    data: any[][];
    isCut?: boolean;
  } | null>(null);

  // ─── 10. CONTEXT MENU & MODALS ─────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState<boolean>(false);
  const [findText, setFindText] = useState<string>("");
  const [replaceText, setReplaceText] = useState<string>("");
  const [showSheetRenameModal, setShowSheetRenameModal] = useState<boolean>(false);
  const [renameSheetInput, setRenameSheetInput] = useState<string>("");
  const [sheetToRename, setSheetToRename] = useState<string>("");
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // ─── 11. RIBBON & VIEW PREFERENCES ─────────────────────────────────────────
  const [activeRibbonTab, setActiveRibbonTab] = useState<
    "Home" | "Insert" | "Page Layout" | "Formulas" | "Data" | "View"
  >("Home");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [showHeadings, setShowHeadings] = useState<boolean>(true);
  const [showFormulaBar, setShowFormulaBar] = useState<boolean>(true);
  const [freezeHeader, setFreezeHeader] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [filterFileSearch, setFilterFileSearch] = useState<string>("");
  const [gridSearchTerm, setGridSearchTerm] = useState<string>("");

  // ─── 12. FOLDER ACCORDION STATE ────────────────────────────────────────────
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    Attendence: true,
    "Employee Details": true,
    "Salary and Advance": true,
    "Salary and Advance/2025": true,
    "Salary and Advance/2026": false,
    "Salary and Advance/2027": false,
    "Salary and Advance/2028": false,
    Expenses: false,
    Inventory: false,
    "Outward Register": false,
    Sales: false,
    others: false,
  });

  const wbRef = useRef<XLSX.WorkBook | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when initialWorkbookId prop changes
  useEffect(() => {
    if (initialWorkbookId) {
      const found = DATABASE_WORKBOOKS.find((w) => w.id === initialWorkbookId);
      if (found) {
        setSelectedWorkbook(found);
        setOpenFolders((prev) => {
          const next = { ...prev };
          const parts = found.folder.split("/");
          if (parts[0]) next[parts[0]] = true;
          if (parts.length > 1) next[found.folder] = true;
          return next;
        });
      }
    }
  }, [initialWorkbookId]);

  // Push new state to Undo Stack
  const pushHistory = useCallback((newGrid: any[][], newMerges?: CellMerge[]) => {
    const currentMerges = newMerges !== undefined ? newMerges : cellMergesRef.current;
    const stack = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    stack.push({
      grid: newGrid.map((r) => [...r]),
      merges: currentMerges.map((m) => ({ ...m })),
    });
    if (stack.length > 50) stack.shift();
    historyStackRef.current = stack;
    historyIndexRef.current = stack.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // ─── 13. LOAD WORKBOOK & RESTORE DATABASE SNAPSHOT ─────────────────────────
  useEffect(() => {
    let isCancelled = false;

    async function loadWorkbook() {
      setIsLoading(true);
      setLoadError(null);

      try {
        let cleanPath = selectedWorkbook.url;
        if (!cleanPath) {
          const raw = selectedWorkbook.path.replace(/^\//, "");
          cleanPath = raw.startsWith("database/") ? `/${raw}` : `/database/${raw}`;
        }

        const response = await fetch(cleanPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch workbook (${response.status}: ${response.statusText})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        if (isCancelled) return;

        wbRef.current = workbook;
        const sheets = workbook.SheetNames || [];
        setSheetNames(sheets);

        const initialSheet = sheets[0] || "";
        setActiveSheetName(initialSheet);

        if (initialSheet && workbook.Sheets[initialSheet]) {
          const rawSheet = workbook.Sheets[initialSheet];
          const rawRows: any[][] = XLSX.utils.sheet_to_json(rawSheet, {
            header: 1,
            defval: "",
            blankrows: true,
          });

          const databaseRows = loadSheetGrid(selectedWorkbook.id, initialSheet, rawRows);
          setGridData(databaseRows);

          // Restore merges
          const initialMerges: CellMerge[] = (rawSheet["!merges"] || []).map((m: any) => ({
            startR: m.s.r,
            startC: m.s.c,
            endR: m.e.r,
            endC: m.e.c,
          }));
          const databaseMerges = loadCellMerges(selectedWorkbook.id, initialSheet, initialMerges);
          setCellMerges(databaseMerges);
          cellMergesRef.current = databaseMerges;

          // Initialize history stack
          historyStackRef.current = [
            {
              grid: databaseRows.map((r) => [...r]),
              merges: databaseMerges.map((m) => ({ ...m })),
            },
          ];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);

          // Restore dimensions and styles
          const dims = loadWorksheetDimensions(selectedWorkbook.id, initialSheet);
          setColWidths(dims.colWidths || {});
          setRowHeights(dims.rowHeights || {});
          const styles = loadCellStyles(selectedWorkbook.id, initialSheet);
          setCellStyles(styles || {});
        } else {
          setGridData([]);
          setCellMerges([]);
          cellMergesRef.current = [];
        }

        setSelectedCell({ r: 0, c: 0 });
        setSelectionRange({ startR: 0, startC: 0, endR: 0, endC: 0 });
        setEditingCell(null);
        setSaveStatus("SAVED");
        setLastSavedTime("Just now");
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Error loading workbook:", err);
          setLoadError(err?.message || "Failed to load workbook");
          setGridData([]);
          setCellMerges([]);
          cellMergesRef.current = [];
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadWorkbook();

    return () => {
      isCancelled = true;
    };
  }, [selectedWorkbook]);

  // ─── 14. SWITCH ACTIVE WORKSHEET ───────────────────────────────────────────
  const handleSelectSheet = useCallback((sheetName: string) => {
    if (!wbRef.current || sheetName === activeSheetName) return;

    setActiveSheetName(sheetName);
    setEditingCell(null);

    const sheet = wbRef.current.Sheets[sheetName];
    if (sheet) {
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        blankrows: true,
      });

      let liveRows = loadSheetGrid(selectedWorkbook.id, sheetName, rawRows);

      if (sheetName === "Salary Sheet" && wbRef.current.Sheets["Advance Sheet"]) {
        const advRaw: any[][] = XLSX.utils.sheet_to_json(wbRef.current.Sheets["Advance Sheet"], {
          header: 1,
          defval: "",
        });
        const advLive = loadSheetGrid(selectedWorkbook.id, "Advance Sheet", advRaw);
        liveRows = syncAdvanceToSalary(liveRows, advLive);
      }

      setGridData(liveRows);

      const sheetMerges: CellMerge[] = (sheet["!merges"] || []).map((m: any) => ({
        startR: m.s.r,
        startC: m.s.c,
        endR: m.e.r,
        endC: m.e.c,
      }));
      const liveMerges = loadCellMerges(selectedWorkbook.id, sheetName, sheetMerges);
      setCellMerges(liveMerges);
      cellMergesRef.current = liveMerges;

      historyStackRef.current = [
        {
          grid: liveRows.map((r) => [...r]),
          merges: liveMerges.map((m) => ({ ...m })),
        },
      ];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);

      const dims = loadWorksheetDimensions(selectedWorkbook.id, sheetName);
      setColWidths(dims.colWidths || {});
      setRowHeights(dims.rowHeights || {});
      const styles = loadCellStyles(selectedWorkbook.id, sheetName);
      setCellStyles(styles || {});
    } else {
      setGridData([]);
      setCellMerges([]);
      cellMergesRef.current = [];
    }

    setSelectedCell({ r: 0, c: 0 });
    setSelectionRange({ startR: 0, startC: 0, endR: 0, endC: 0 });
  }, [activeSheetName, selectedWorkbook]);

  // Sync Formula Bar & Name Box with selected cell
  useEffect(() => {
    const r = selectedCell.r;
    const c = selectedCell.c;
    const val = gridData[r]?.[c] ?? "";
    setFormulaBarValue(String(val));
    setNameBoxInput(`${colToLetter(c)}${r + 1}`);
  }, [selectedCell, gridData]);

  // ─── 15. COMMIT CELL EDIT & BUSINESS LOGIC ─────────────────────────────────
  const commitCellEdit = useCallback((newValue: string) => {
    if (!editingCell) return;

    const { r, c } = editingCell;
    setGridData((prev) => {
      const next = prev.map((row) => [...row]);
      while (next.length <= r) next.push([]);
      while (next[r].length <= c) next[r].push("");

      let finalVal: any = newValue;
      if (typeof newValue === "string" && newValue.startsWith("=")) {
        finalVal = evaluateFormula(newValue, next);
      } else {
        const num = Number(newValue);
        if (!isNaN(num) && newValue.trim() !== "") {
          finalVal = num;
        }
      }

      next[r][c] = finalVal;

      if (activeSheetName === "Salary Sheet" && r >= 5) {
        next[r] = calculateSalaryRow(next[r]);
      }

      if (activeSheetName === "Advance Sheet" && wbRef.current?.Sheets["Salary Sheet"]) {
        const rawSal: any[][] = XLSX.utils.sheet_to_json(wbRef.current.Sheets["Salary Sheet"], {
          header: 1,
          defval: "",
        });
        const liveSal = loadSheetGrid(selectedWorkbook.id, "Salary Sheet", rawSal);
        const syncedSal = syncAdvanceToSalary(liveSal, next);
        saveSheetGrid(selectedWorkbook.id, "Salary Sheet", syncedSal);
      }

      pushHistory(next);

      if (autosaveEnabled) {
        setSaveStatus("SAVING");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
          await saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
          setSaveStatus("SAVED");
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }, 800);
      }

      return next;
    });

    setEditingCell(null);
  }, [editingCell, activeSheetName, selectedWorkbook, autosaveEnabled, pushHistory]);

  // ─── 16. RESIZE COLUMNS & ROWS HANDLERS ────────────────────────────────────
  const handleStartColResize = (e: React.MouseEvent, colIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    const currentW = colWidths[colIndex] || 110;
    setResizingCol({ col: colIndex, startX: e.clientX, startW: currentW });
  };

  const handleStartRowResize = (e: React.MouseEvent, rowIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    const currentH = rowHeights[rowIndex] || 28;
    setResizingRow({ row: rowIndex, startY: e.clientY, startH: currentH });
  };

  // Mouse move and up listeners for resizing and dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol) {
        const delta = e.clientX - resizingCol.startX;
        const newW = Math.max(45, resizingCol.startW + delta);
        setColWidths((prev) => ({ ...prev, [resizingCol.col]: newW }));
      }
      if (resizingRow) {
        const delta = e.clientY - resizingRow.startY;
        const newH = Math.max(20, resizingRow.startH + delta);
        setRowHeights((prev) => ({ ...prev, [resizingRow.row]: newH }));
      }
    };

    const handleMouseUp = () => {
      if (resizingCol) {
        saveWorksheetDimensions(selectedWorkbook.id, activeSheetName, {
          colWidths,
          rowHeights,
        });
        setResizingCol(null);
      }
      if (resizingRow) {
        saveWorksheetDimensions(selectedWorkbook.id, activeSheetName, {
          colWidths,
          rowHeights,
        });
        setResizingRow(null);
      }
      if (isSelectingRange) {
        setIsSelectingRange(false);
      }
      if (isDraggingFill && fillPreviewRange) {
        // Execute fill series logic
        executeFillSeries(selectionRange, fillPreviewRange);
        setIsDraggingFill(false);
        setFillPreviewRange(null);
      }
      if (isDraggingMove && moveDropTarget) {
        executeMoveRange(selectionRange, moveDropTarget);
        setIsDraggingMove(false);
        setMoveDropTarget(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    resizingCol,
    resizingRow,
    colWidths,
    rowHeights,
    selectedWorkbook.id,
    activeSheetName,
    isSelectingRange,
    isDraggingFill,
    fillPreviewRange,
    isDraggingMove,
    moveDropTarget,
    selectionRange,
  ]);

  // Double-Click Boundary to AutoFit Column Width
  const handleAutoFitColumn = (colIndex: number) => {
    let maxLen = 0;
    gridData.forEach((row) => {
      const str = String(row[colIndex] ?? "");
      if (str.length > maxLen) maxLen = str.length;
    });
    const autoW = Math.max(70, Math.min(380, maxLen * 8.5 + 24));
    const nextColWidths = { ...colWidths, [colIndex]: autoW };
    setColWidths(nextColWidths);
    saveWorksheetDimensions(selectedWorkbook.id, activeSheetName, {
      colWidths: nextColWidths,
      rowHeights,
    });
  };

  // Double-Click Boundary to AutoFit Row Height
  const handleAutoFitRow = (rowIndex: number) => {
    const nextRowHeights = { ...rowHeights, [rowIndex]: 28 };
    setRowHeights(nextRowHeights);
    saveWorksheetDimensions(selectedWorkbook.id, activeSheetName, {
      colWidths,
      rowHeights: nextRowHeights,
    });
  };

  // ─── 17. DRAG-AND-FILL SERIES LOGIC ────────────────────────────────────────
  const executeFillSeries = (
    src: { startR: number; startC: number; endR: number; endC: number },
    target: { startR: number; startC: number; endR: number; endC: number }
  ) => {
    setGridData((prev) => {
      const next = prev.map((r) => [...r]);

      // Downward fill
      if (target.endR > src.endR) {
        for (let c = src.startC; c <= src.endC; c++) {
          const seeds = [];
          for (let r = src.startR; r <= src.endR; r++) {
            seeds.push(prev[r]?.[c] ?? "");
          }
          const stepsNeeded = target.endR - src.endR;
          const extrapolated = extrapolateSeries(seeds, stepsNeeded, "down");
          for (let i = 0; i < stepsNeeded; i++) {
            const destR = src.endR + 1 + i;
            while (next.length <= destR) next.push([]);
            while (next[destR].length <= c) next[destR].push("");
            next[destR][c] = extrapolated[i];
          }
        }
      }
      // Rightward fill
      else if (target.endC > src.endC) {
        for (let r = src.startR; r <= src.endR; r++) {
          const seeds = [];
          for (let c = src.startC; c <= src.endC; c++) {
            seeds.push(prev[r]?.[c] ?? "");
          }
          const stepsNeeded = target.endC - src.endC;
          const extrapolated = extrapolateSeries(seeds, stepsNeeded, "right");
          for (let i = 0; i < stepsNeeded; i++) {
            const destC = src.endC + 1 + i;
            while (next[r].length <= destC) next[r].push("");
            next[r][destC] = extrapolated[i];
          }
        }
      }

      pushHistory(next);
      saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
      return next;
    });

    setSelectionRange(target);
  };

  // ─── 18. DRAG-AND-MOVE RANGE LOGIC ─────────────────────────────────────────
  const executeMoveRange = (
    src: { startR: number; startC: number; endR: number; endC: number },
    dest: { r: number; c: number }
  ) => {
    setGridData((prev) => {
      const next = prev.map((r) => [...r]);
      const deltaR = dest.r - src.startR;
      const deltaC = dest.c - src.startC;

      // Extract contents
      const extracted: { r: number; c: number; val: any }[] = [];
      for (let r = src.startR; r <= src.endR; r++) {
        for (let c = src.startC; c <= src.endC; c++) {
          extracted.push({ r: r + deltaR, c: c + deltaC, val: prev[r]?.[c] ?? "" });
          if (next[r]) next[r][c] = "";
        }
      }

      // Drop into new position
      extracted.forEach(({ r, c, val }) => {
        while (next.length <= r) next.push([]);
        while (next[r].length <= c) next[r].push("");
        next[r][c] = val;
      });

      pushHistory(next);
      saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
      return next;
    });
  };

  // ─── 19. ADVANCED CLIPBOARD: COPY, CUT, PASTE TSV (EXCEL COMPATIBLE) ───────
  const handleCopy = useCallback(() => {
    const { startR, startC, endR, endC } = selectionRange;
    const minR = Math.min(startR, endR);
    const maxR = Math.max(startR, endR);
    const minC = Math.min(startC, endC);
    const maxC = Math.max(startC, endC);

    const rows: string[] = [];
    const internalRows: any[][] = [];

    for (let r = minR; r <= maxR; r++) {
      const rowVals: string[] = [];
      const intRow: any[] = [];
      for (let c = minC; c <= maxC; c++) {
        const val = gridData[r]?.[c] ?? "";
        rowVals.push(String(val));
        intRow.push(val);
      }
      rows.push(rowVals.join("\t"));
      internalRows.push(intRow);
    }

    const tsvString = rows.join("\n");
    navigator.clipboard.writeText(tsvString);
    setInternalClipboard({
      range: { startR: minR, startC: minC, endR: maxR, endC: maxC },
      data: internalRows,
      isCut: false,
    });
    setShowNotification(`Copied ${maxR - minR + 1}R × ${maxC - minC + 1}C to clipboard`);
    setTimeout(() => setShowNotification(null), 2500);
  }, [selectionRange, gridData]);

  const handleCut = useCallback(() => {
    handleCopy();
    setInternalClipboard((prev) => (prev ? { ...prev, isCut: true } : null));
  }, [handleCopy]);

  const handlePaste = useCallback(
    async (specialMode?: "values" | "formulas" | "transpose") => {
      try {
        const tsv = await navigator.clipboard.readText();
        let rows = tsv.split(/\r?\n/).map((line) => line.split("\t"));

        // Handle Transpose
        if (specialMode === "transpose") {
          const transposed: any[][] = [];
          for (let c = 0; c < rows[0].length; c++) {
            transposed.push([]);
            for (let r = 0; r < rows.length; r++) {
              transposed[c].push(rows[r][c] || "");
            }
          }
          rows = transposed;
        }

        const startR = selectedCell.r;
        const startC = selectedCell.c;

        setGridData((prev) => {
          const next = prev.map((r) => [...r]);

          // If internal clipboard was cut, clear the original range
          if (internalClipboard?.isCut) {
            const { startR: cr1, startC: cc1, endR: cr2, endC: cc2 } = internalClipboard.range;
            for (let r = cr1; r <= cr2; r++) {
              for (let c = cc1; c <= cc2; c++) {
                if (next[r]) next[r][c] = "";
              }
            }
            setInternalClipboard(null);
          }

          rows.forEach((rowVals, rOffset) => {
            const targetR = startR + rOffset;
            while (next.length <= targetR) next.push([]);

            rowVals.forEach((valStr, cOffset) => {
              const targetC = startC + cOffset;
              while (next[targetR].length <= targetC) next[targetR].push("");

              if (specialMode === "values" && valStr.startsWith("=")) {
                next[targetR][targetC] = evaluateFormula(valStr, next);
              } else {
                const num = Number(valStr);
                next[targetR][targetC] = !isNaN(num) && valStr.trim() !== "" ? num : valStr;
              }
            });
          });

          pushHistory(next);
          saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
          return next;
        });

        setShowNotification(`Pasted ${rows.length} rows successfully`);
        setTimeout(() => setShowNotification(null), 2500);
      } catch (e) {
        console.warn("Clipboard paste error:", e);
      }
    },
    [selectedCell, internalClipboard, selectedWorkbook.id, activeSheetName, pushHistory]
  );

  // ─── 20. UNDO & REDO HANDLERS ──────────────────────────────────────────────
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prev = historyStackRef.current[historyIndexRef.current];
      setGridData(prev.grid.map((r) => [...r]));
      saveSheetGrid(selectedWorkbook.id, activeSheetName, prev.grid);
      if (prev.merges) {
        setCellMerges(prev.merges);
        cellMergesRef.current = prev.merges;
        saveCellMerges(selectedWorkbook.id, activeSheetName, prev.merges);
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current += 1;
      const next = historyStackRef.current[historyIndexRef.current];
      setGridData(next.grid.map((r) => [...r]));
      saveSheetGrid(selectedWorkbook.id, activeSheetName, next.grid);
      if (next.merges) {
        setCellMerges(next.merges);
        cellMergesRef.current = next.merges;
        saveCellMerges(selectedWorkbook.id, activeSheetName, next.merges);
      }
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
    }
  };

  // ─── 21. INSERT & DELETE ROWS / COLUMNS ─────────────────────────────────────
  const handleInsertRow = (position: "above" | "below") => {
    const target = position === "above" ? selectedCell.r : selectedCell.r + 1;
    let nextMerges: CellMerge[] = [];
    setCellMerges((prevMerges) => {
      nextMerges = prevMerges.map((m) => {
        let { startR, endR, startC, endC } = m;
        if (startR >= target) {
          startR += 1;
          endR += 1;
        } else if (endR >= target) {
          endR += 1;
        }
        return { startR, startC, endR, endC };
      });
      cellMergesRef.current = nextMerges;
      saveCellMerges(selectedWorkbook.id, activeSheetName, nextMerges);
      return nextMerges;
    });

    setGridData((prev) => {
      const next = prev.map((r) => [...r]);
      const emptyRow = new Array(maxCols).fill("");
      next.splice(target, 0, emptyRow);
      pushHistory(next, nextMerges);
      saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
      return next;
    });
  };

  const handleDeleteRow = () => {
    if (gridData.length <= 1) return;
    const target = selectedCell.r;
    let nextMerges: CellMerge[] = [];
    setCellMerges((prevMerges) => {
      nextMerges = [];
      for (const m of prevMerges) {
        let { startR, endR, startC, endC } = m;
        if (startR === target && endR === target) {
          continue;
        }
        if (startR > target) {
          startR -= 1;
          endR -= 1;
        } else if (endR >= target) {
          endR -= 1;
        }
        if (startR <= endR && (startR !== endR || startC !== endC)) {
          nextMerges.push({ startR, startC, endR, endC });
        }
      }
      cellMergesRef.current = nextMerges;
      saveCellMerges(selectedWorkbook.id, activeSheetName, nextMerges);
      return nextMerges;
    });

    setGridData((prev) => {
      const next = prev.map((r) => [...r]);
      next.splice(target, 1);
      pushHistory(next, nextMerges);
      saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
      return next;
    });
  };

  const handleInsertColumn = (position: "left" | "right") => {
    const target = position === "left" ? selectedCell.c : selectedCell.c + 1;
    let nextMerges: CellMerge[] = [];
    setCellMerges((prevMerges) => {
      nextMerges = prevMerges.map((m) => {
        let { startR, endR, startC, endC } = m;
        if (startC >= target) {
          startC += 1;
          endC += 1;
        } else if (endC >= target) {
          endC += 1;
        }
        return { startR, startC, endR, endC };
      });
      cellMergesRef.current = nextMerges;
      saveCellMerges(selectedWorkbook.id, activeSheetName, nextMerges);
      return nextMerges;
    });

    setGridData((prev) => {
      const next = prev.map((r) => {
        const row = [...r];
        row.splice(target, 0, "");
        return row;
      });
      pushHistory(next, nextMerges);
      saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
      return next;
    });
  };

  const handleDeleteColumn = () => {
    if (maxCols <= 1) return;
    const target = selectedCell.c;
    let nextMerges: CellMerge[] = [];
    setCellMerges((prevMerges) => {
      nextMerges = [];
      for (const m of prevMerges) {
        let { startR, endR, startC, endC } = m;
        if (startC === target && endC === target) {
          continue;
        }
        if (startC > target) {
          startC -= 1;
          endC -= 1;
        } else if (endC >= target) {
          endC -= 1;
        }
        if (startC <= endC && (startR !== endR || startC !== endC)) {
          nextMerges.push({ startR, startC, endR, endC });
        }
      }
      cellMergesRef.current = nextMerges;
      saveCellMerges(selectedWorkbook.id, activeSheetName, nextMerges);
      return nextMerges;
    });

    setGridData((prev) => {
      const next = prev.map((r) => {
        const row = [...r];
        row.splice(target, 1);
        return row;
      });
      pushHistory(next, nextMerges);
      saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
      return next;
    });
  };

  // ─── 22. KEYBOARD SHORTCUTS DISPATCHER ─────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If typing in input or cell editor, bypass global shortcuts
    if (editingCell) {
      if (e.key === "Enter") {
        commitCellEdit(editValue);
        setSelectedCell((prev) => ({ r: Math.min(gridData.length - 1, prev.r + 1), c: prev.c }));
      } else if (e.key === "Escape") {
        setEditingCell(null);
      }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "c") {
        e.preventDefault();
        handleCopy();
      } else if (key === "x") {
        e.preventDefault();
        handleCut();
      } else if (key === "v") {
        e.preventDefault();
        handlePaste();
      } else if (key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (key === "y") {
        e.preventDefault();
        handleRedo();
      } else if (key === "a") {
        e.preventDefault();
        setSelectionRange({ startR: 0, startC: 0, endR: gridData.length - 1, endC: maxCols - 1 });
      } else if (key === "f") {
        e.preventDefault();
        setShowFindReplaceModal(true);
      } else if (key === "s") {
        e.preventDefault();
        handleManualSave();
      } else if (key === "d") {
        // Fill Down
        e.preventDefault();
        if (selectedCell.r > 0) {
          const aboveVal = gridData[selectedCell.r - 1]?.[selectedCell.c] ?? "";
          commitCellEdit(String(aboveVal));
        }
      } else if (key === "r") {
        // Fill Right
        e.preventDefault();
        if (selectedCell.c > 0) {
          const leftVal = gridData[selectedCell.r]?.[selectedCell.c - 1] ?? "";
          commitCellEdit(String(leftVal));
        }
      } else if (key === "b") {
        e.preventDefault();
        toggleCellStyle("bold");
      } else if (key === "i") {
        e.preventDefault();
        toggleCellStyle("italic");
      } else if (key === "u") {
        e.preventDefault();
        toggleCellStyle("underline");
      } else if (e.key === "Home") {
        e.preventDefault();
        setSelectedCell({ r: 0, c: 0 });
        setSelectionRange({ startR: 0, startC: 0, endR: 0, endC: 0 });
      } else if (e.key === "End") {
        e.preventDefault();
        setSelectedCell({ r: gridData.length - 1, c: maxCols - 1 });
        setSelectionRange({ startR: gridData.length - 1, startC: maxCols - 1, endR: gridData.length - 1, endC: maxCols - 1 });
      }
      return;
    }

    if (e.key === "F2") {
      e.preventDefault();
      setEditValue(String(gridData[selectedCell.r]?.[selectedCell.c] ?? ""));
      setEditingCell({ r: selectedCell.r, c: selectedCell.c });
    } else if (e.key === "Delete") {
      e.preventDefault();
      // Clear contents in selection range
      const { startR, startC, endR, endC } = selectionRange;
      setGridData((prev) => {
        const next = prev.map((r) => [...r]);
        for (let r = Math.min(startR, endR); r <= Math.max(startR, endR); r++) {
          for (let c = Math.min(startC, endC); c <= Math.max(startC, endC); c++) {
            if (next[r]) next[r][c] = "";
          }
        }
        pushHistory(next);
        saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextR = Math.max(0, selectedCell.r - 1);
      setSelectedCell({ r: nextR, c: selectedCell.c });
      if (!e.shiftKey) setSelectionRange({ startR: nextR, startC: selectedCell.c, endR: nextR, endC: selectedCell.c });
      else setSelectionRange((prev) => ({ ...prev, endR: nextR }));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextR = Math.min(gridData.length - 1, selectedCell.r + 1);
      setSelectedCell({ r: nextR, c: selectedCell.c });
      if (!e.shiftKey) setSelectionRange({ startR: nextR, startC: selectedCell.c, endR: nextR, endC: selectedCell.c });
      else setSelectionRange((prev) => ({ ...prev, endR: nextR }));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const nextC = Math.max(0, selectedCell.c - 1);
      setSelectedCell({ r: selectedCell.r, c: nextC });
      if (!e.shiftKey) setSelectionRange({ startR: selectedCell.r, startC: nextC, endR: selectedCell.r, endC: nextC });
      else setSelectionRange((prev) => ({ ...prev, endC: nextC }));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextC = Math.min(maxCols - 1, selectedCell.c + 1);
      setSelectedCell({ r: selectedCell.r, c: nextC });
      if (!e.shiftKey) setSelectionRange({ startR: selectedCell.r, startC: nextC, endR: selectedCell.r, endC: nextC });
      else setSelectionRange((prev) => ({ ...prev, endC: nextC }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      setEditValue(String(gridData[selectedCell.r]?.[selectedCell.c] ?? ""));
      setEditingCell({ r: selectedCell.r, c: selectedCell.c });
    } else if (e.key === "Tab") {
      e.preventDefault();
      const nextC = Math.min(maxCols - 1, selectedCell.c + 1);
      setSelectedCell({ r: selectedCell.r, c: nextC });
      setSelectionRange({ startR: selectedCell.r, startC: nextC, endR: selectedCell.r, endC: nextC });
    }
  };

  // Toggle cell style helper (Bold, Italic, Underline)
  const toggleCellStyle = (prop: keyof CellStyle) => {
    const key = `${selectedCell.r}_${selectedCell.c}`;
    const cur = cellStyles[key] || {};
    const updated = { ...cur, [prop]: !cur[prop] };
    const nextStyles = { ...cellStyles, [key]: updated };
    setCellStyles(nextStyles);
    saveCellStyles(selectedWorkbook.id, activeSheetName, nextStyles);
  };

  // ─── 23. FIND & REPLACE LOGIC ──────────────────────────────────────────────
  const handleFindNext = () => {
    if (!findText.trim()) return;
    const q = findText.toLowerCase();

    for (let r = 0; r < gridData.length; r++) {
      for (let c = 0; c < (gridData[r]?.length || 0); c++) {
        // If after current cell
        if (r > selectedCell.r || (r === selectedCell.r && c > selectedCell.c)) {
          if (String(gridData[r][c] ?? "").toLowerCase().includes(q)) {
            setSelectedCell({ r, c });
            setSelectionRange({ startR: r, startC: c, endR: r, endC: c });
            return;
          }
        }
      }
    }
    // Wrap around to start
    for (let r = 0; r < gridData.length; r++) {
      for (let c = 0; c < (gridData[r]?.length || 0); c++) {
        if (String(gridData[r][c] ?? "").toLowerCase().includes(q)) {
          setSelectedCell({ r, c });
          setSelectionRange({ startR: r, startC: c, endR: r, endC: c });
          return;
        }
      }
    }
    setShowNotification("No matches found for \"" + findText + "\"");
    setTimeout(() => setShowNotification(null), 2500);
  };

  const handleReplaceCurrent = () => {
    const currentVal = String(gridData[selectedCell.r]?.[selectedCell.c] ?? "");
    if (currentVal.toLowerCase().includes(findText.toLowerCase())) {
      const replaced = currentVal.replace(new RegExp(findText, "gi"), replaceText);
      commitCellEdit(replaced);
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!findText.trim()) return;
    let count = 0;
    setGridData((prev) => {
      const next = prev.map((row) =>
        row.map((cell) => {
          const str = String(cell ?? "");
          if (str.toLowerCase().includes(findText.toLowerCase())) {
            count += 1;
            return str.replace(new RegExp(findText, "gi"), replaceText);
          }
          return cell;
        })
      );
      pushHistory(next);
      saveSheetGrid(selectedWorkbook.id, activeSheetName, next);
      return next;
    });
    setShowNotification(`Replaced ${count} occurrences successfully.`);
    setTimeout(() => setShowNotification(null), 3000);
  };

  // ─── 24. MANUAL SAVE & RESET MASTER ────────────────────────────────────────
  const handleManualSave = async () => {
    setSaveStatus("SAVING");
    await saveSheetGrid(selectedWorkbook.id, activeSheetName, gridData);
    saveWorksheetDimensions(selectedWorkbook.id, activeSheetName, { colWidths, rowHeights });
    saveCellStyles(selectedWorkbook.id, activeSheetName, cellStyles);
    saveCellMerges(selectedWorkbook.id, activeSheetName, cellMerges);
    setSaveStatus("SAVED");
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setShowNotification("All workbook edits and dimensions saved to live database.");
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleResetMaster = () => {
    if (confirm("Reset current workbook to master template? Any uncommitted local test edits will be cleared.")) {
      resetWorkbookToOriginal(selectedWorkbook.id, sheetNames);
      if (wbRef.current && wbRef.current.Sheets[activeSheetName]) {
        const rawSheet = wbRef.current.Sheets[activeSheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(rawSheet, {
          header: 1,
          defval: "",
        });
        setGridData(rawRows);
        setColWidths({});
        setRowHeights({});
        setCellStyles({});
        const origMerges: CellMerge[] = (rawSheet["!merges"] || []).map((m: any) => ({
          startR: m.s.r,
          startC: m.s.c,
          endR: m.e.r,
          endC: m.e.c,
        }));
        setCellMerges(origMerges);
        cellMergesRef.current = origMerges;
        saveCellMerges(selectedWorkbook.id, activeSheetName, origMerges);
      }
      setShowNotification("Workbook reset to master database template.");
      setTimeout(() => setShowNotification(null), 3000);
    }
  };

  // ─── 24.5 CELL MERGING & UNMERGING ──────────────────────────────────────────
  const { rootMerges, hiddenCells } = useMemo(() => {
    const root = new Map<string, CellMerge>();
    const hidden = new Set<string>();

    for (const m of cellMerges) {
      const minR = Math.min(m.startR, m.endR);
      const maxR = Math.max(m.startR, m.endR);
      const minC = Math.min(m.startC, m.endC);
      const maxC = Math.max(m.startC, m.endC);

      root.set(`${minR}_${minC}`, { startR: minR, startC: minC, endR: maxR, endC: maxC });

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (r !== minR || c !== minC) {
            hidden.add(`${r}_${c}`);
          }
        }
      }
    }

    return { rootMerges: root, hiddenCells: hidden };
  }, [cellMerges]);

  const isSelectionMerged = useMemo(() => {
    const minR = Math.min(selectionRange.startR, selectionRange.endR);
    const maxR = Math.max(selectionRange.startR, selectionRange.endR);
    const minC = Math.min(selectionRange.startC, selectionRange.endC);
    const maxC = Math.max(selectionRange.startC, selectionRange.endC);

    return cellMerges.some(
      (m) =>
        Math.max(minR, m.startR) <= Math.min(maxR, m.endR) &&
        Math.max(minC, m.startC) <= Math.min(maxC, m.endC)
    );
  }, [cellMerges, selectionRange]);

  const handleMergeCells = (centerText: boolean = true) => {
    const minR = Math.min(selectionRange.startR, selectionRange.endR);
    const maxR = Math.max(selectionRange.startR, selectionRange.endR);
    const minC = Math.min(selectionRange.startC, selectionRange.endC);
    const maxC = Math.max(selectionRange.startC, selectionRange.endC);

    // If already exactly merged, toggle to unmerge
    const exactMergeIdx = cellMerges.findIndex(
      (m) =>
        m.startR === minR &&
        m.startC === minC &&
        m.endR === maxR &&
        m.endC === maxC
    );

    if (exactMergeIdx >= 0) {
      const updated = cellMerges.filter((_, idx) => idx !== exactMergeIdx);
      setCellMerges(updated);
      cellMergesRef.current = updated;
      saveCellMerges(selectedWorkbook.id, activeSheetName, updated);
      pushHistory(gridData, updated);
      setShowNotification("Unmerged cell range.");
      setTimeout(() => setShowNotification(null), 2500);
      return;
    }

    // Require at least 2 cells to merge
    if (minR === maxR && minC === maxC) {
      const overlapping = cellMerges.filter(
        (m) =>
          minR >= m.startR &&
          minR <= m.endR &&
          minC >= m.startC &&
          minC <= m.endC
      );
      if (overlapping.length > 0) {
        handleUnmergeCells();
        return;
      }
      setShowNotification("Please select 2 or more cells to merge.");
      setTimeout(() => setShowNotification(null), 2500);
      return;
    }

    // Remove overlapping merges
    const filtered = cellMerges.filter(
      (m) =>
        !(
          Math.max(minR, m.startR) <= Math.min(maxR, m.endR) &&
          Math.max(minC, m.startC) <= Math.min(maxC, m.endC)
        )
    );

    const newMerge: CellMerge = { startR: minR, startC: minC, endR: maxR, endC: maxC };
    const updated = [...filtered, newMerge];

    setCellMerges(updated);
    cellMergesRef.current = updated;
    saveCellMerges(selectedWorkbook.id, activeSheetName, updated);

    // If centerText is requested, center alignment of upper-left cell
    if (centerText) {
      const key = `${minR}_${minC}`;
      const nextStyles = {
        ...cellStyles,
        [key]: { ...(cellStyles[key] || {}), align: "center" as const },
      };
      setCellStyles(nextStyles);
      saveCellStyles(selectedWorkbook.id, activeSheetName, nextStyles);
    }

    pushHistory(gridData, updated);
    setShowNotification(
      `Merged ${maxR - minR + 1}×${maxC - minC + 1} cells (${colToLetter(minC)}${minR + 1}:${colToLetter(maxC)}${maxR + 1})`
    );
    setTimeout(() => setShowNotification(null), 2500);
  };

  const handleMergeAcross = () => {
    const minR = Math.min(selectionRange.startR, selectionRange.endR);
    const maxR = Math.max(selectionRange.startR, selectionRange.endR);
    const minC = Math.min(selectionRange.startC, selectionRange.endC);
    const maxC = Math.max(selectionRange.startC, selectionRange.endC);

    if (minC === maxC) {
      setShowNotification("Merge Across requires a range with 2 or more columns.");
      setTimeout(() => setShowNotification(null), 2500);
      return;
    }

    // Filter out merges overlapping this selection
    const filtered = cellMerges.filter(
      (m) =>
        !(
          Math.max(minR, m.startR) <= Math.min(maxR, m.endR) &&
          Math.max(minC, m.startC) <= Math.min(maxC, m.endC)
        )
    );

    const newMerges: CellMerge[] = [];
    for (let r = minR; r <= maxR; r++) {
      newMerges.push({ startR: r, startC: minC, endR: r, endC: maxC });
    }

    const updated = [...filtered, ...newMerges];
    setCellMerges(updated);
    cellMergesRef.current = updated;
    saveCellMerges(selectedWorkbook.id, activeSheetName, updated);
    pushHistory(gridData, updated);
    setShowNotification(`Merged across ${maxR - minR + 1} row(s).`);
    setTimeout(() => setShowNotification(null), 2500);
  };

  const handleUnmergeCells = () => {
    const minR = Math.min(selectionRange.startR, selectionRange.endR);
    const maxR = Math.max(selectionRange.startR, selectionRange.endR);
    const minC = Math.min(selectionRange.startC, selectionRange.endC);
    const maxC = Math.max(selectionRange.startC, selectionRange.endC);

    const overlaps = (m: CellMerge) =>
      Math.max(minR, m.startR) <= Math.min(maxR, m.endR) &&
      Math.max(minC, m.startC) <= Math.min(maxC, m.endC);

    const toRemove = cellMerges.filter(overlaps);
    if (toRemove.length === 0) {
      setShowNotification("No merged cells in selection.");
      setTimeout(() => setShowNotification(null), 2000);
      return;
    }

    const updated = cellMerges.filter((m) => !overlaps(m));
    setCellMerges(updated);
    cellMergesRef.current = updated;
    saveCellMerges(selectedWorkbook.id, activeSheetName, updated);
    pushHistory(gridData, updated);
    setShowNotification(`Unmerged ${toRemove.length} cell block(s).`);
    setTimeout(() => setShowNotification(null), 2500);
  };

  // ─── 25. EXPORTS ───────────────────────────────────────────────────────────
  const handleExportXLSX = () => {
    if (!wbRef.current) return;
    const exportWb = XLSX.utils.book_new();

    sheetNames.forEach((name) => {
      let sheetData = loadSheetGrid(selectedWorkbook.id, name);
      if (!sheetData || sheetData.length === 0) {
        if (wbRef.current && wbRef.current.Sheets[name]) {
          sheetData = XLSX.utils.sheet_to_json(wbRef.current.Sheets[name], { header: 1, defval: "" });
        }
      }
      const ws = XLSX.utils.aoa_to_sheet(sheetData || [[]]);

      const mergesToExport =
        name === activeSheetName ? cellMerges : loadCellMerges(selectedWorkbook.id, name);
      if (mergesToExport && mergesToExport.length > 0) {
        ws["!merges"] = mergesToExport.map((m) => ({
          s: { r: m.startR, c: m.startC },
          e: { r: m.endR, c: m.endC },
        }));
      }

      XLSX.utils.book_append_sheet(exportWb, ws, name.substring(0, 31));
    });

    const exportFileName = selectedWorkbook.fileName.endsWith(".xlsx")
      ? `LIVE_${selectedWorkbook.fileName}`
      : `LIVE_${selectedWorkbook.fileName}.xlsx`;

    XLSX.writeFile(exportWb, exportFileName);
  };

  const handleExportCSV = () => {
    const ws = XLSX.utils.aoa_to_sheet(gridData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedWorkbook.fileName}_${activeSheetName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── 26. HIERARCHICAL FOLDER TREE & METRICS ────────────────────────────────
  const folderTree = useMemo(() => {
    const root: Record<string, FolderNode> = {};

    DATABASE_WORKBOOKS.forEach((wb) => {
      const parts = wb.folder.split("/");
      const rootCat = parts[0] || "General";

      if (!root[rootCat]) {
        root[rootCat] = {
          name: rootCat,
          fullPath: rootCat,
          files: [],
          subfolders: {},
          totalCount: 0,
        };
      }
      root[rootCat].totalCount += 1;

      if (parts.length === 1) {
        root[rootCat].files.push(wb);
      } else {
        const subCat = parts[1];
        const subPath = `${rootCat}/${subCat}`;
        if (!root[rootCat].subfolders[subCat]) {
          root[rootCat].subfolders[subCat] = {
            name: subCat,
            fullPath: subPath,
            files: [],
            subfolders: {},
            totalCount: 0,
          };
        }
        root[rootCat].subfolders[subCat].files.push(wb);
        root[rootCat].subfolders[subCat].totalCount += 1;
      }
    });

    return root;
  }, []);

  const filteredWorkbooks = useMemo(() => {
    if (!filterFileSearch.trim()) return null;
    const q = filterFileSearch.toLowerCase();
    return DATABASE_WORKBOOKS.filter(
      (w) => w.fileName.toLowerCase().includes(q) || w.folder.toLowerCase().includes(q)
    );
  }, [filterFileSearch]);

  const maxCols = useMemo(() => {
    let max = 0;
    gridData.forEach((row) => {
      if (row && row.length > max) max = row.length;
    });
    return Math.max(max, 18);
  }, [gridData]);

  // Compute live selection statistics for bottom status bar
  const selectionStats = useMemo(() => {
    const { startR, startC, endR, endC } = selectionRange;
    const minR = Math.min(startR, endR);
    const maxR = Math.max(startR, endR);
    const minC = Math.min(startC, endC);
    const maxC = Math.max(startC, endC);

    let count = 0;
    let sum = 0;
    let numCount = 0;

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const val = gridData[r]?.[c];
        if (val !== undefined && val !== null && val !== "") {
          count += 1;
          const n = parseFloat(val);
          if (!isNaN(n)) {
            sum += n;
            numCount += 1;
          }
        }
      }
    }

    return {
      count,
      sum: Math.round(sum * 100) / 100,
      average: numCount > 0 ? Math.round((sum / numCount) * 100) / 100 : 0,
    };
  }, [selectionRange, gridData]);

  return (
    <div
      className={`flex flex-col w-full bg-[#F3F4F6] text-[#1E293B] select-none font-sans overflow-hidden border border-[#D1D5DB] shadow-sm rounded-lg ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-full"
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onClick={() => {
        if (contextMenu) setContextMenu(null);
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP EXCEL TITLE BAR                                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#107C41] text-white px-3 py-1.5 flex items-center justify-between shadow-sm border-b border-[#0C5E31] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center shadow-xs">
              <span className="text-[#107C41] font-black text-xs">X</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs tracking-tight text-white flex items-center gap-1.5">
                KFab360 Excel Database Studio
                <span className="text-[10px] font-normal px-1.5 py-0.2 bg-[#0C5E31] rounded text-emerald-100">
                  Live Database Connected
                </span>
              </span>
              <span className="text-[10px] text-emerald-100 truncate max-w-sm">
                {selectedWorkbook.fileName} • {activeSheetName}
              </span>
            </div>
          </div>
        </div>

        {/* Database Status & Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0C5E31]/70 rounded-full border border-emerald-500/30 text-[11px]">
            {saveStatus === "SAVED" ? (
              <>
                <CheckCircle2 className="size-3 text-emerald-300" />
                <span className="text-emerald-100 font-medium">All changes saved to database</span>
                <span className="text-[10px] text-emerald-300/80">({lastSavedTime})</span>
              </>
            ) : saveStatus === "SAVING" ? (
              <>
                <RefreshCw className="size-3 text-amber-300 animate-spin" />
                <span className="text-amber-200 font-medium">Saving to live database...</span>
              </>
            ) : (
              <>
                <Database className="size-3 text-blue-300" />
                <span className="text-blue-100 font-medium">Offline sync active</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#0C5E31] p-0.5 rounded border border-emerald-500/30">
            <button
              onClick={() => setAutosaveEnabled(!autosaveEnabled)}
              title="Toggle automatic saving to database on every edit"
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                autosaveEnabled ? "bg-white text-[#107C41]" : "text-emerald-200 hover:text-white"
              }`}
            >
              Autosave {autosaveEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <button
            onClick={handleManualSave}
            title="Force immediate save to database (Ctrl+S)"
            className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded text-xs font-semibold text-white transition-colors"
          >
            <Save className="size-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleExportXLSX}
            title="Export complete workbook with all sheets as genuine .xlsx"
            className="flex items-center gap-1 px-2.5 py-1 bg-white text-[#107C41] hover:bg-emerald-50 rounded text-xs font-bold shadow-xs transition-colors"
          >
            <FileDown className="size-3.5" />
            <span>Export XLSX</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Export current active worksheet as CSV"
            className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
          >
            <span>CSV</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Mode"}
            className="p-1 hover:bg-white/20 rounded text-white"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. AUTHENTIC MICROSOFT EXCEL RIBBON                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#D1D5DB] shrink-0">
        {/* Ribbon Tab Headers */}
        <div className="flex items-center px-2 bg-[#F3F4F6] border-b border-[#E5E7EB] text-xs">
          {(["Home", "Insert", "Page Layout", "Formulas", "Data", "View"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveRibbonTab(tab)}
              className={`px-3 py-1 font-semibold transition-colors ${
                activeRibbonTab === tab
                  ? "bg-white text-[#107C41] border-t-2 border-[#107C41] shadow-xs"
                  : "text-[#4B5563] hover:text-[#111827] hover:bg-gray-200/60"
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 pr-2">
            <button
              onClick={handleResetMaster}
              title="Reset current workbook to master template"
              className="text-[11px] text-[#6B7280] hover:text-[#DC2626] flex items-center gap-1"
            >
              <RefreshCw className="size-3" />
              <span>Reset Master</span>
            </button>
          </div>
        </div>

        {/* Ribbon Actions Toolbar */}
        <div className="p-1.5 px-3 flex items-center gap-3 overflow-x-auto text-xs text-[#374151]">
          {/* HOME TAB */}
          {activeRibbonTab === "Home" && (
            <>
              {/* Undo / Redo */}
              <div className="flex items-center gap-0.5 border-r border-[#E5E7EB] pr-2">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="p-1 hover:bg-gray-100 disabled:opacity-30 rounded"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="size-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="p-1 hover:bg-gray-100 disabled:opacity-30 rounded"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="size-3.5" />
                </button>
              </div>

              {/* Clipboard: Cut, Copy, Paste, Format Painter */}
              <div className="flex items-center gap-1 border-r border-[#E5E7EB] pr-3">
                <button
                  onClick={handleCut}
                  className="p-1 hover:bg-gray-100 rounded text-gray-700"
                  title="Cut (Ctrl+X)"
                >
                  <Scissors className="size-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-gray-100 rounded text-gray-700"
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  onClick={() => handlePaste()}
                  className="p-1 hover:bg-gray-100 rounded text-gray-700"
                  title="Paste (Ctrl+V)"
                >
                  <Clipboard className="size-3.5" />
                </button>
                <button
                  onClick={() => {
                    const key = `${selectedCell.r}_${selectedCell.c}`;
                    const cur = cellStyles[key] || {};
                    setFormatPainterStyle(cur);
                    setShowNotification("Format Painter active: click any cell to apply formatting");
                    setTimeout(() => setShowNotification(null), 3000);
                  }}
                  className={`p-1 rounded transition-colors ${
                    formatPainterStyle ? "bg-amber-100 text-amber-800" : "hover:bg-gray-100 text-gray-700"
                  }`}
                  title="Format Painter"
                >
                  <Paintbrush className="size-3.5" />
                </button>
              </div>

              {/* Font Family, Size, Styling */}
              <div className="flex items-center gap-1 border-r border-[#E5E7EB] pr-3">
                <select className="bg-white border border-[#D1D5DB] rounded px-1.5 py-0.5 text-xs text-gray-700">
                  <option>Calibri</option>
                  <option>Arial</option>
                  <option>Segoe UI</option>
                  <option>Inter</option>
                </select>
                <select className="bg-white border border-[#D1D5DB] rounded px-1.5 py-0.5 text-xs text-gray-700">
                  <option>10</option>
                  <option>11</option>
                  <option>12</option>
                  <option>14</option>
                  <option>16</option>
                </select>
                <button
                  onClick={() => toggleCellStyle("bold")}
                  className={`p-1 rounded ${
                    cellStyles[`${selectedCell.r}_${selectedCell.c}`]?.bold
                      ? "bg-emerald-100 text-[#107C41] font-bold"
                      : "hover:bg-gray-100"
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="size-3.5" />
                </button>
                <button
                  onClick={() => toggleCellStyle("italic")}
                  className={`p-1 rounded ${
                    cellStyles[`${selectedCell.r}_${selectedCell.c}`]?.italic
                      ? "bg-emerald-100 text-[#107C41]"
                      : "hover:bg-gray-100"
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="size-3.5" />
                </button>
                <button
                  onClick={() => toggleCellStyle("underline")}
                  className={`p-1 rounded ${
                    cellStyles[`${selectedCell.r}_${selectedCell.c}`]?.underline
                      ? "bg-emerald-100 text-[#107C41]"
                      : "hover:bg-gray-100"
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="size-3.5" />
                </button>
                <button
                  onClick={() => toggleCellStyle("strike")}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Strikethrough"
                >
                  <Strikethrough className="size-3.5" />
                </button>
              </div>

              {/* Text Alignment */}
              <div className="flex items-center gap-1 border-r border-[#E5E7EB] pr-3">
                <button
                  onClick={() => {
                    const key = `${selectedCell.r}_${selectedCell.c}`;
                    const updated = { ...(cellStyles[key] || {}), align: "left" as const };
                    setCellStyles((s) => ({ ...s, [key]: updated }));
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Align Left"
                >
                  <AlignLeft className="size-3.5" />
                </button>
                <button
                  onClick={() => {
                    const key = `${selectedCell.r}_${selectedCell.c}`;
                    const updated = { ...(cellStyles[key] || {}), align: "center" as const };
                    setCellStyles((s) => ({ ...s, [key]: updated }));
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Align Center"
                >
                  <AlignCenter className="size-3.5" />
                </button>
                <button
                  onClick={() => {
                    const key = `${selectedCell.r}_${selectedCell.c}`;
                    const updated = { ...(cellStyles[key] || {}), align: "right" as const };
                    setCellStyles((s) => ({ ...s, [key]: updated }));
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Align Right"
                >
                  <AlignRight className="size-3.5" />
                </button>
              </div>

              {/* Merge & Center Split Button */}
              <div className="relative flex items-center border-r border-[#E5E7EB] pr-3" ref={mergeDropdownRef}>
                <button
                  onClick={() => handleMergeCells(true)}
                  className={`px-2 py-0.5 rounded font-semibold text-[11px] flex items-center gap-1.5 transition-colors ${
                    isSelectionMerged
                      ? "bg-emerald-100 text-[#065F46] hover:bg-emerald-200 border border-emerald-300 shadow-xs"
                      : "bg-gray-100 hover:bg-gray-200 text-[#1F2937]"
                  }`}
                  title={isSelectionMerged ? "Click to toggle/unmerge cells" : "Merge & Center selection"}
                >
                  <TableCellsMerge className="size-3.5 text-[#107C41]" />
                  <span>Merge & Center</span>
                </button>
                <button
                  onClick={() => setShowMergeDropdown((prev) => !prev)}
                  className={`p-1 rounded-r border-l border-gray-300 hover:bg-gray-200 text-gray-600 transition-colors ${
                    showMergeDropdown ? "bg-gray-200 text-black" : ""
                  }`}
                  title="More merge options"
                >
                  <ChevronDown className="size-3" />
                </button>

                {/* Excel-style Merge Dropdown Menu */}
                {showMergeDropdown && (
                  <div
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#D1D5DB] rounded-lg shadow-xl py-1 z-50 text-xs text-[#334155] animate-in fade-in"
                    onClick={() => setShowMergeDropdown(false)}
                  >
                    <button
                      onClick={() => handleMergeCells(true)}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-[#065F46] flex items-start gap-2.5 transition-colors"
                    >
                      <TableCellsMerge className="size-4 text-[#107C41] mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Merge & Center</div>
                        <div className="text-[10px] text-gray-500">Combine and center the contents of selected cells</div>
                      </div>
                    </button>

                    <button
                      onClick={handleMergeAcross}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-[#065F46] flex items-start gap-2.5 transition-colors"
                    >
                      <Layers className="size-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Merge Across</div>
                        <div className="text-[10px] text-gray-500">Merge selected cells across each row horizontally</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleMergeCells(false)}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-[#065F46] flex items-start gap-2.5 transition-colors"
                    >
                      <TableCellsMerge className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900">Merge Cells</div>
                        <div className="text-[10px] text-gray-500">Merge selected cells into one cell without centering</div>
                      </div>
                    </button>

                    <div className="h-px bg-gray-200 my-1" />

                    <button
                      onClick={handleUnmergeCells}
                      disabled={!isSelectionMerged}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                        isSelectionMerged
                          ? "hover:bg-amber-50 hover:text-amber-800 text-amber-700"
                          : "opacity-40 cursor-not-allowed text-gray-400"
                      }`}
                    >
                      <TableCellsSplit className="size-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold">Unmerge Cells</div>
                        <div className="text-[10px] text-gray-500">Split the merged cells back into individual cells</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Number Formatting (Currency, Percent, Decimal) */}
              <div className="flex items-center gap-1 border-r border-[#E5E7EB] pr-3">
                <button
                  onClick={() => {
                    const val = parseFloat(gridData[selectedCell.r]?.[selectedCell.c]);
                    if (!isNaN(val)) commitCellEdit(`₹${val.toLocaleString("en-IN")}`);
                  }}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-semibold text-[11px] flex items-center gap-0.5"
                  title="Format as Indian Rupee Currency"
                >
                  <IndianRupee className="size-3" />
                  <span>Currency</span>
                </button>
                <button
                  onClick={() => {
                    const val = parseFloat(gridData[selectedCell.r]?.[selectedCell.c]);
                    if (!isNaN(val)) commitCellEdit(`${(val * 100).toFixed(1)}%`);
                  }}
                  className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-semibold text-[11px] flex items-center gap-0.5"
                  title="Format as Percentage"
                >
                  <Percent className="size-3" />
                  <span>Percent</span>
                </button>
              </div>

              {/* Find and Replace Trigger */}
              <button
                onClick={() => setShowFindReplaceModal(true)}
                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-semibold text-[11px] flex items-center gap-1"
                title="Find & Replace (Ctrl+F / Ctrl+H)"
              >
                <Search className="size-3" />
                <span>Find & Select</span>
              </button>
            </>
          )}

          {/* INSERT TAB */}
          {activeRibbonTab === "Insert" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleInsertRow("above")}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold flex items-center gap-1"
              >
                <Plus className="size-3.5" />
                <span>Insert Row Above</span>
              </button>
              <button
                onClick={() => handleInsertRow("below")}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold flex items-center gap-1"
              >
                <Plus className="size-3.5" />
                <span>Insert Row Below</span>
              </button>
              <button
                onClick={handleDeleteRow}
                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded font-semibold flex items-center gap-1"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Row</span>
              </button>
              <div className="h-4 w-px bg-gray-300 mx-1" />
              <button
                onClick={() => handleInsertColumn("left")}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold flex items-center gap-1"
              >
                <Columns className="size-3.5" />
                <span>Insert Column Left</span>
              </button>
              <button
                onClick={handleDeleteColumn}
                className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded font-semibold flex items-center gap-1"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Column</span>
              </button>
              <div className="h-4 w-px bg-gray-300 mx-1" />
              <button
                onClick={() => handleMergeCells(true)}
                className={`px-2 py-1 hover:bg-gray-200 rounded font-semibold flex items-center gap-1 ${
                  isSelectionMerged ? "bg-emerald-100 text-[#065F46]" : "bg-gray-100 text-gray-700"
                }`}
                title="Merge & Center Selection"
              >
                <TableCellsMerge className="size-3.5 text-[#107C41]" />
                <span>Merge Cells</span>
              </button>
              {isSelectionMerged && (
                <button
                  onClick={handleUnmergeCells}
                  className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded font-semibold flex items-center gap-1"
                  title="Unmerge Selected Cells"
                >
                  <TableCellsSplit className="size-3.5 text-amber-600" />
                  <span>Unmerge</span>
                </button>
              )}
            </div>
          )}

          {/* FORMULAS TAB */}
          {activeRibbonTab === "Formulas" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const formula = `=SUM(A1:${colToLetter(selectedCell.c)}${selectedCell.r})`;
                  setEditValue(formula);
                  setEditingCell({ r: selectedCell.r, c: selectedCell.c });
                }}
                className="px-2 py-1 bg-emerald-50 text-[#107C41] border border-emerald-300 font-bold rounded flex items-center gap-1"
              >
                <Calculator className="size-3.5" />
                <span>AutoSUM</span>
              </button>
              <button
                onClick={() => {
                  const formula = `=AVERAGE(A1:${colToLetter(selectedCell.c)}${selectedCell.r})`;
                  setEditValue(formula);
                  setEditingCell({ r: selectedCell.r, c: selectedCell.c });
                }}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold"
              >
                AVERAGE
              </button>
              <button
                onClick={() => {
                  const formula = `=COUNT(A1:${colToLetter(selectedCell.c)}${selectedCell.r})`;
                  setEditValue(formula);
                  setEditingCell({ r: selectedCell.r, c: selectedCell.c });
                }}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold"
              >
                COUNT
              </button>
              <span className="text-[11px] text-[#6B7280] ml-2">
                Calculation Mode: Automatic (Instant database-linked recalculation)
              </span>
            </div>
          )}

          {/* DATA TAB */}
          {activeRibbonTab === "Data" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const col = selectedCell.c;
                  setGridData((prev) => {
                    if (prev.length < 5) return prev;
                    const headers = prev.slice(0, 4);
                    const rows = [...prev.slice(4)];
                    rows.sort((a, b) => String(a[col] || "").localeCompare(String(b[col] || ""), undefined, { numeric: true }));
                    return [...headers, ...rows];
                  });
                }}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold flex items-center gap-1"
              >
                <ArrowUpDown className="size-3.5" />
                <span>Sort A to Z (Record-Safe)</span>
              </button>
              <button
                onClick={() => {
                  const col = selectedCell.c;
                  setGridData((prev) => {
                    if (prev.length < 5) return prev;
                    const headers = prev.slice(0, 4);
                    const rows = [...prev.slice(4)];
                    rows.sort((a, b) => String(b[col] || "").localeCompare(String(a[col] || ""), undefined, { numeric: true }));
                    return [...headers, ...rows];
                  });
                }}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold flex items-center gap-1"
              >
                <ArrowUpDown className="size-3.5 rotate-180" />
                <span>Sort Z to A (Record-Safe)</span>
              </button>
            </div>
          )}

          {/* VIEW TAB */}
          {activeRibbonTab === "View" && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGridlines}
                  onChange={(e) => setShowGridlines(e.target.checked)}
                  className="rounded text-[#107C41]"
                />
                <span>Gridlines</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeadings}
                  onChange={(e) => setShowHeadings(e.target.checked)}
                  className="rounded text-[#107C41]"
                />
                <span>Headings (A, B, C & 1, 2, 3)</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFormulaBar}
                  onChange={(e) => setShowFormulaBar(e.target.checked)}
                  className="rounded text-[#107C41]"
                />
                <span>Formula Bar</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={freezeHeader}
                  onChange={(e) => setFreezeHeader(e.target.checked)}
                  className="rounded text-[#107C41]"
                />
                <span>Freeze Top Rows</span>
              </label>
              <div className="flex items-center gap-1 ml-3 border-l pl-3 border-gray-200">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="text-[11px] font-bold w-10 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="size-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded font-bold ml-1"
                >
                  100%
                </button>
              </div>
            </div>
          )}

          {/* PAGE LAYOUT TAB */}
          {activeRibbonTab === "Page Layout" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold flex items-center gap-1"
              >
                <Printer className="size-3.5" />
                <span>Print Sheet</span>
              </button>
              <span className="text-[11px] text-gray-500">
                Orientation: Landscape • Scaling: Fit Sheet on One Page
              </span>
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* FORMULA BAR & NAME BOX                                            */}
        {/* ───────────────────────────────────────────────────────────────── */}
        {showFormulaBar && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F9FAFB] border-t border-[#E5E7EB] text-xs">
            {/* Name Box (Go To Cell Navigation) */}
            <input
              type="text"
              value={nameBoxInput}
              onChange={(e) => setNameBoxInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const parsed = parseCellCoord(nameBoxInput);
                  if (parsed) {
                    const r = Math.min(gridData.length - 1, Math.max(0, parsed.r));
                    const c = Math.min(maxCols - 1, Math.max(0, parsed.c));
                    setSelectedCell({ r, c });
                    setSelectionRange({ startR: r, startC: c, endR: r, endC: c });
                  }
                }
              }}
              title="Name Box: Enter coordinate e.g. B4 and press Enter to navigate"
              className="w-16 px-2 py-0.5 bg-white border border-[#D1D5DB] rounded font-mono font-bold text-center text-[#111827] shadow-xs focus:outline-hidden focus:border-[#107C41]"
            />

            <div className="w-6 h-6 flex items-center justify-center font-serif italic font-bold text-[#6B7280]">
              fx
            </div>

            {/* Formula Bar Input */}
            <div className="flex-1">
              <input
                type="text"
                value={formulaBarValue}
                onChange={(e) => setFormulaBarValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitCellEdit(formulaBarValue);
                  }
                }}
                placeholder="Enter formula or value (e.g. =SUM(A1:A10), =C2*D2)..."
                className="w-full px-2 py-0.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs text-[#111827] focus:outline-hidden focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41]"
              />
            </div>

            {/* In-Sheet Quick Search */}
            <div className="relative w-48">
              <input
                type="text"
                value={gridSearchTerm}
                onChange={(e) => setGridSearchTerm(e.target.value)}
                placeholder="Search in sheet..."
                className="w-full pl-6 pr-2 py-0.5 bg-white border border-[#D1D5DB] rounded text-xs text-[#111827] placeholder:text-gray-400 focus:outline-hidden focus:border-[#107C41]"
              />
              <Search className="size-3.5 text-gray-400 absolute left-1.5 top-1.5" />
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. MAIN WORKSPACE: LEFT NAVIGATOR & ADVANCED SPREADSHEET GRID       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Navigator (Collapsible) */}
        <div
          className={`bg-white border-r border-[#D1D5DB] flex flex-col shrink-0 transition-all duration-200 ${
            isSidebarCollapsed ? "w-10" : "w-64"
          }`}
        >
          <div className="p-2 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold text-[#334155] tracking-tight">
                Workbooks ({DATABASE_WORKBOOKS.length})
              </span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 hover:bg-gray-200 rounded text-gray-500"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronRight
                className={`size-3.5 transition-transform ${isSidebarCollapsed ? "" : "rotate-180"}`}
              />
            </button>
          </div>

          {!isSidebarCollapsed && (
            <>
              {/* Quick Search */}
              <div className="p-2 border-b border-[#E5E7EB]">
                <div className="relative">
                  <input
                    type="text"
                    value={filterFileSearch}
                    onChange={(e) => setFilterFileSearch(e.target.value)}
                    placeholder="Search workbooks..."
                    className="w-full pl-6 pr-2 py-1 text-xs bg-[#F1F5F9] border border-gray-200 rounded text-[#1E293B] placeholder:text-gray-400 focus:outline-hidden focus:border-[#107C41]"
                  />
                  <Search className="size-3 text-gray-400 absolute left-2 top-2" />
                </div>
              </div>

              {/* Folder Accordion */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1 text-xs">
                {filteredWorkbooks ? (
                  <div className="space-y-0.5">
                    {filteredWorkbooks.map((wb) => (
                      <button
                        key={wb.id}
                        onClick={() => setSelectedWorkbook(wb)}
                        className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
                          selectedWorkbook.id === wb.id
                            ? "bg-[#107C41] text-white font-bold"
                            : "text-[#334155] hover:bg-gray-100"
                        }`}
                      >
                        <FileSpreadsheet className="size-3.5 shrink-0" />
                        <span className="truncate">{wb.fileName}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  Object.values(folderTree).map((rootNode) => {
                    const isRootOpen = !!openFolders[rootNode.name];

                    return (
                      <div key={rootNode.name} className="space-y-0.5">
                        <button
                          onClick={() =>
                            setOpenFolders((prev) => {
                              // Accordion: close all root folders, only open the clicked one
                              const next: Record<string, boolean> = {};
                              Object.keys(prev).forEach(k => { next[k] = false; });
                              next[rootNode.name] = !prev[rootNode.name];
                              return next;
                            })
                          }
                          className={`w-full flex items-center justify-between px-2 py-1 rounded font-semibold text-xs transition-colors ${
                            rootNode.files.some(wb => wb.id === selectedWorkbook.id) ||
                            Object.values(rootNode.subfolders).some(sub => sub.files.some(wb => wb.id === selectedWorkbook.id))
                              ? "bg-[#E8F5EF] text-[#107C41] border border-[#107C41]/30"
                              : "text-[#334155] hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {isRootOpen ? (
                              <FolderOpen className="size-3.5 text-[#107C41] shrink-0" />
                            ) : (
                              <Folder className="size-3.5 text-gray-500 shrink-0" />
                            )}
                            <span className="truncate">{rootNode.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <span>{rootNode.totalCount}</span>
                            <ChevronDown
                              className={`size-3 transition-transform ${
                                isRootOpen ? "" : "-rotate-90"
                              }`}
                            />
                          </div>
                        </button>

                        {isRootOpen && (
                          <div className="pl-3 space-y-0.5 border-l border-gray-200 ml-2">
                            {rootNode.files.map((wb) => (
                              <button
                                key={wb.id}
                                onClick={() => setSelectedWorkbook(wb)}
                                className={`w-full text-left px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                                  selectedWorkbook.id === wb.id
                                    ? "bg-[#107C41] text-white font-bold shadow-xs"
                                    : "text-[#475569] hover:bg-gray-100"
                                }`}
                              >
                                <FileSpreadsheet className="size-3 shrink-0" />
                                <span className="truncate">{wb.fileName}</span>
                              </button>
                            ))}

                            {Object.values(rootNode.subfolders).map((subNode) => {
                              const isSubOpen = !!openFolders[subNode.fullPath];
                              return (
                                <div key={subNode.fullPath} className="space-y-0.5">
                                  <button
                                    onClick={() =>
                                      setOpenFolders((prev) => {
                                        // Keep root folder open, toggle only this subfolder
                                        const next = { ...prev };
                                        // Close sibling subfolders first
                                        Object.keys(next).forEach(k => {
                                          if (k !== rootNode.name && k !== subNode.fullPath) next[k] = false;
                                        });
                                        next[subNode.fullPath] = !prev[subNode.fullPath];
                                        return next;
                                      })
                                    }
                                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                                      subNode.files.some(wb => wb.id === selectedWorkbook.id)
                                        ? "bg-[#FEF9EC] text-amber-700 border border-amber-400/40 font-semibold"
                                        : "text-[#475569] hover:bg-gray-100 font-medium"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Calendar className="size-3 text-amber-600 shrink-0" />
                                      <span className="font-semibold truncate">Year {subNode.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                      <span>{subNode.totalCount}</span>
                                      <ChevronDown
                                        className={`size-3 transition-transform ${
                                          isSubOpen ? "" : "-rotate-90"
                                        }`}
                                      />
                                    </div>
                                  </button>

                                  {isSubOpen && (
                                    <div className="pl-3 space-y-0.5 border-l border-amber-300 ml-2">
                                      {subNode.files.map((wb) => (
                                        <button
                                          key={wb.id}
                                          onClick={() => setSelectedWorkbook(wb)}
                                          className={`w-full text-left px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                                            selectedWorkbook.id === wb.id
                                              ? "bg-[#107C41] text-white font-bold shadow-xs"
                                              : "text-[#475569] hover:bg-gray-100"
                                          }`}
                                        >
                                          <FileSpreadsheet className="size-3 shrink-0" />
                                          <span className="truncate">
                                            {wb.fileName.replace("_Salary_and_Advance.xlsx", "")}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Spreadsheet Grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
              <RefreshCw className="size-8 text-[#107C41] animate-spin mb-3" />
              <p className="text-sm font-semibold text-[#1F2937]">Connecting to Live KFab360 Database...</p>
              <p className="text-xs text-gray-400 mt-1">
                Loading {selectedWorkbook.fileName} ({activeSheetName})
              </p>
            </div>
          ) : loadError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-red-500">
              <p className="font-bold text-sm">Failed to load workbook</p>
              <p className="text-xs text-gray-500 mt-1">{loadError}</p>
              <button
                onClick={handleResetMaster}
                className="mt-3 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded text-gray-700"
              >
                Reload from Master Template
              </button>
            </div>
          ) : gridData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
              <FileSpreadsheet className="size-10 text-gray-300 mb-2" />
              <p className="text-sm font-semibold">Sheet is empty or has no rows.</p>
              <button
                onClick={() => {
                  const emptyRow = new Array(maxCols).fill("");
                  setGridData([emptyRow]);
                }}
                className="mt-2 text-xs text-[#107C41] font-bold hover:underline"
              >
                + Add Initial Row
              </button>
            </div>
          ) : (
            <div
              ref={gridContainerRef}
              className="flex-1 overflow-auto relative bg-[#F9FAFB]"
              style={{ fontSize: `${(zoomLevel / 100) * 12}px` }}
            >
              <table className="border-collapse table-fixed w-max min-w-full bg-white">
                {/* Column Headers (A, B, C, D...) with Resize Divider */}
                {showHeadings && (
                  <thead className={`${freezeHeader ? "sticky top-0 z-20" : ""} bg-[#F3F4F6]`}>
                    <tr>
                      {/* Top-Left Corner Box (Select All) */}
                      <th
                        onClick={() => {
                          setSelectionRange({
                            startR: 0,
                            startC: 0,
                            endR: gridData.length - 1,
                            endC: maxCols - 1,
                          });
                        }}
                        title="Click to select all cells (Ctrl+A)"
                        className="w-12 min-w-[48px] max-w-[48px] h-6 bg-[#E5E7EB] hover:bg-gray-300 border-b border-r border-[#D1D5DB] text-[10px] text-gray-400 sticky left-0 z-30 select-none cursor-pointer"
                      />

                      {Array.from({ length: maxCols }).map((_, colIdx) => {
                        const letter = colToLetter(colIdx);
                        const isColSelected =
                          selectionRange.startC <= colIdx && colIdx <= selectionRange.endC;
                        const w = colWidths[colIdx] || 110;

                        return (
                          <th
                            key={colIdx}
                            style={{ width: `${w}px`, minWidth: `${w}px` }}
                            onClick={() => {
                              setSelectedCell({ r: 0, c: colIdx });
                              setSelectionRange({
                                startR: 0,
                                startC: colIdx,
                                endR: gridData.length - 1,
                                endC: colIdx,
                              });
                            }}
                            className={`h-6 px-2 text-center text-[11px] font-semibold select-none border-b border-r border-[#D1D5DB] relative transition-colors cursor-pointer ${
                              isColSelected
                                ? "bg-[#D1FAE5] text-[#065F46] font-bold border-b-2 border-b-[#107C41]"
                                : "bg-[#F3F4F6] text-[#4B5563] hover:bg-gray-200/80"
                            }`}
                          >
                            <span>{letter}</span>
                            {/* Column Resize Divider Handle */}
                            <div
                              onMouseDown={(e) => handleStartColResize(e, colIdx)}
                              onDoubleClick={() => handleAutoFitColumn(colIdx)}
                              title="Drag to resize width • Double-click to AutoFit"
                              className="w-2 cursor-col-resize absolute right-0 top-0 bottom-0 z-10 hover:bg-[#107C41]"
                            />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                )}

                {/* Grid Rows (1, 2, 3...) with Row Height Resize Divider */}
                <tbody>
                  {gridData.map((row, rowIdx) => {
                    const isRowSelected =
                      selectionRange.startR <= rowIdx && rowIdx <= selectionRange.endR;
                    const h = rowHeights[rowIdx] || 28;
                    const isTitleRow =
                      rowIdx === 0 && row.length > 0 && typeof row[0] === "string" && row[0].length > 5;
                    const isTotalRow =
                      row.some((cell) => String(cell).toLowerCase().includes("total")) ||
                      row.some((cell) => String(cell).toLowerCase().includes("grand total"));

                    return (
                      <tr
                        key={rowIdx}
                        style={{ height: `${h}px` }}
                        className={`${
                          isTotalRow
                            ? "bg-[#1E3A8A] text-white font-bold"
                            : isTitleRow
                            ? "bg-[#F0FDF4] font-bold text-[#166534]"
                            : rowIdx % 2 === 1
                            ? "bg-[#FAFAFA]"
                            : "bg-white"
                        }`}
                      >
                        {/* Row Number Header with Resize Divider */}
                        {showHeadings && (
                          <td
                            onClick={() => {
                              setSelectedCell({ r: rowIdx, c: 0 });
                              setSelectionRange({
                                startR: rowIdx,
                                startC: 0,
                                endR: rowIdx,
                                endC: maxCols - 1,
                              });
                            }}
                            className={`w-12 min-w-[48px] max-w-[48px] text-center text-[10px] select-none border-b border-r border-[#D1D5DB] sticky left-0 z-10 relative cursor-pointer ${
                              isRowSelected
                                ? "bg-[#D1FAE5] text-[#065F46] font-bold border-r-2 border-r-[#107C41]"
                                : "bg-[#F3F4F6] text-[#6B7280] hover:bg-gray-200"
                            }`}
                          >
                            <span>{rowIdx + 1}</span>
                            {/* Row Resize Divider Handle */}
                            <div
                              onMouseDown={(e) => handleStartRowResize(e, rowIdx)}
                              onDoubleClick={() => handleAutoFitRow(rowIdx)}
                              title="Drag to resize height • Double-click to AutoFit"
                              className="h-2 cursor-row-resize absolute left-0 right-0 bottom-0 z-10 hover:bg-[#107C41]"
                            />
                          </td>
                        )}

                        {/* Cell Columns */}
                        {Array.from({ length: maxCols }).map((_, colIdx) => {
                          const cellKey = `${rowIdx}_${colIdx}`;
                          if (hiddenCells.has(cellKey)) {
                            return null;
                          }

                          const mergeInfo = rootMerges.get(cellKey);
                          const cellValue = row[colIdx];
                          const isFocused = selectedCell.r === rowIdx && selectedCell.c === colIdx;

                          const selMinR = Math.min(selectionRange.startR, selectionRange.endR);
                          const selMaxR = Math.max(selectionRange.startR, selectionRange.endR);
                          const selMinC = Math.min(selectionRange.startC, selectionRange.endC);
                          const selMaxC = Math.max(selectionRange.startC, selectionRange.endC);

                          const cellMinR = rowIdx;
                          const cellMaxR = mergeInfo ? mergeInfo.endR : rowIdx;
                          const cellMinC = colIdx;
                          const cellMaxC = mergeInfo ? mergeInfo.endC : colIdx;

                          const inRange =
                            Math.max(selMinR, cellMinR) <= Math.min(selMaxR, cellMaxR) &&
                            Math.max(selMinC, cellMinC) <= Math.min(selMaxC, cellMaxC);

                          const isBottomRightCorner =
                            cellMaxR === selMaxR && cellMaxC === selMaxC;

                          const isEditing = editingCell?.r === rowIdx && editingCell?.c === colIdx;
                          const customStyle = cellStyles[cellKey] || {};

                          const isCalculated =
                            activeSheetName === "Salary Sheet" &&
                            [4, 6, 7, 9, 15].includes(colIdx) &&
                            rowIdx >= 5;

                          const isSearchMatch =
                            gridSearchTerm.trim() !== "" &&
                            String(cellValue || "")
                              .toLowerCase()
                              .includes(gridSearchTerm.toLowerCase());

                          return (
                            <td
                              key={colIdx}
                              colSpan={mergeInfo ? mergeInfo.endC - mergeInfo.startC + 1 : undefined}
                              rowSpan={mergeInfo ? mergeInfo.endR - mergeInfo.startR + 1 : undefined}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setSelectedCell({ r: rowIdx, c: colIdx });
                                if (mergeInfo) {
                                  setSelectionRange({
                                    startR: mergeInfo.startR,
                                    startC: mergeInfo.startC,
                                    endR: mergeInfo.endR,
                                    endC: mergeInfo.endC,
                                  });
                                } else {
                                  const inCurrentRange =
                                    selMinR <= rowIdx &&
                                    rowIdx <= selMaxR &&
                                    selMinC <= colIdx &&
                                    colIdx <= selMaxC;
                                  if (!inCurrentRange) {
                                    setSelectionRange({
                                      startR: rowIdx,
                                      startC: colIdx,
                                      endR: rowIdx,
                                      endC: colIdx,
                                    });
                                  }
                                }
                                setContextMenu({ x: e.clientX, y: e.clientY, r: rowIdx, c: colIdx });
                              }}
                              onMouseDown={(e) => {
                                if (e.button === 0) {
                                  // Left click
                                  setSelectedCell({ r: rowIdx, c: colIdx });
                                  if (!e.shiftKey) {
                                    if (mergeInfo) {
                                      setSelectionRange({
                                        startR: mergeInfo.startR,
                                        startC: mergeInfo.startC,
                                        endR: mergeInfo.endR,
                                        endC: mergeInfo.endC,
                                      });
                                    } else {
                                      setSelectionRange({
                                        startR: rowIdx,
                                        startC: colIdx,
                                        endR: rowIdx,
                                        endC: colIdx,
                                      });
                                    }
                                    setIsSelectingRange(true);
                                  } else {
                                    setSelectionRange((prev) => ({
                                      ...prev,
                                      endR: cellMaxR,
                                      endC: cellMaxC,
                                    }));
                                  }

                                  // Apply format painter if active
                                  if (formatPainterStyle) {
                                    setCellStyles((s) => ({ ...s, [cellKey]: formatPainterStyle }));
                                    saveCellStyles(selectedWorkbook.id, activeSheetName, {
                                      ...cellStyles,
                                      [cellKey]: formatPainterStyle,
                                    });
                                    setFormatPainterStyle(null);
                                  }
                                }
                              }}
                              onMouseEnter={() => {
                                if (isSelectingRange) {
                                  setSelectionRange((prev) => ({
                                    ...prev,
                                    endR: cellMaxR,
                                    endC: cellMaxC,
                                  }));
                                }
                                if (isDraggingFill) {
                                  setFillPreviewRange({
                                    startR: selectionRange.startR,
                                    startC: selectionRange.startC,
                                    endR: cellMaxR,
                                    endC: cellMaxC,
                                  });
                                }
                                if (isDraggingMove) {
                                  setMoveDropTarget({ r: rowIdx, c: colIdx });
                                }
                              }}
                              onDoubleClick={() => {
                                setEditValue(cellValue === null || cellValue === undefined ? "" : String(cellValue));
                                setEditingCell({ r: rowIdx, c: colIdx });
                              }}
                              style={{
                                textAlign: customStyle.align || (typeof cellValue === "number" ? "right" : "left"),
                                fontWeight: customStyle.bold ? "bold" : undefined,
                                fontStyle: customStyle.italic ? "italic" : undefined,
                                textDecoration: customStyle.underline
                                  ? "underline"
                                  : customStyle.strike
                                  ? "line-through"
                                  : undefined,
                                color: customStyle.color,
                                backgroundColor: customStyle.bgColor,
                              }}
                              className={`h-7 px-2 text-[12px] align-middle truncate relative transition-shadow ${
                                showGridlines ? "border-b border-r border-[#E5E7EB]" : ""
                              } ${
                                inRange
                                  ? "bg-emerald-50/60 outline-1 outline-[#107C41] outline-offset-[-1px] z-10"
                                  : ""
                              } ${
                                isFocused
                                  ? "border-2 border-[#107C41] z-20 shadow-xs"
                                  : ""
                              } ${
                                isCalculated && !isTotalRow && !isTitleRow ? "bg-emerald-50/40 text-[#065F46]" : ""
                              } ${isSearchMatch ? "bg-amber-200 text-amber-900 font-bold" : ""}`}
                            >
                              {isEditing ? (
                                <input
                                  ref={cellInputRef}
                                  type="text"
                                  value={editValue}
                                  autoFocus
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => commitCellEdit(editValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      commitCellEdit(editValue);
                                    } else if (e.key === "Escape") {
                                      setEditingCell(null);
                                    }
                                  }}
                                  className="w-full h-full bg-white text-[#111827] outline-hidden px-1 border-2 border-[#107C41] font-sans"
                                />
                              ) : (
                                <span>{cellValue === null || cellValue === undefined ? "" : String(cellValue)}</span>
                              )}

                              {/* ─── CORNER DRAG FILL HANDLE ─── */}
                              {isBottomRightCorner && !isEditing && (
                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setIsDraggingFill(true);
                                    setFillPreviewRange(selectionRange);
                                  }}
                                  title="Drag to auto-fill series or formulas"
                                  className="w-2 h-2 bg-[#107C41] border border-white absolute -right-1 -bottom-1 cursor-crosshair z-30 shadow-xs"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────── */}
          {/* 4. BOTTOM WORKSHEET TABS & STATUS BAR                           */}
          {/* ─────────────────────────────────────────────────────────────── */}
          <div className="bg-[#F3F4F6] border-t border-[#D1D5DB] flex items-center justify-between px-2 shrink-0 select-none">
            {/* Sheet Tabs */}
            <div className="flex items-center overflow-x-auto max-w-2xl py-1 gap-1 text-xs">
              {sheetNames.map((name) => {
                const isActive = name === activeSheetName;
                return (
                  <button
                    key={name}
                    onClick={() => handleSelectSheet(name)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSheetToRename(name);
                      setRenameSheetInput(name);
                      setShowSheetRenameModal(true);
                    }}
                    title="Click to switch sheet • Right-click to rename"
                    className={`px-3 py-1 font-semibold rounded-t transition-colors shrink-0 ${
                      isActive
                        ? "bg-white text-[#107C41] border-b-2 border-b-[#107C41] font-bold shadow-xs"
                        : "text-[#4B5563] hover:bg-gray-200"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}

              {/* Add New Sheet Button */}
              <button
                onClick={() => {
                  const newSheet = `Sheet${sheetNames.length + 1}`;
                  setSheetNames((s) => [...s, newSheet]);
                  handleSelectSheet(newSheet);
                  setShowNotification(`Created new worksheet: ${newSheet}`);
                  setTimeout(() => setShowNotification(null), 2500);
                }}
                title="Insert New Worksheet"
                className="p-1 hover:bg-gray-200 rounded text-[#107C41]"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {/* Excel Status Bar (Average, Count, Sum of selection) */}
            <div className="flex items-center gap-4 text-[11px] text-[#6B7280] font-medium py-1">
              <span>Count: {selectionStats.count}</span>
              {selectionStats.sum > 0 && <span>Sum: ₹{selectionStats.sum.toLocaleString("en-IN")}</span>}
              {selectionStats.average > 0 && <span>Average: {selectionStats.average}</span>}
              <span className="font-mono text-[#107C41] font-bold border-l pl-3 border-gray-300">
                KFab360 Live Database
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. RIGHT-CLICK CONTEXT MENU                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed bg-white border border-[#D1D5DB] rounded-lg shadow-2xl py-1 w-56 z-50 text-xs text-[#334155] animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleCut();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between"
          >
            <span>Cut</span>
            <span className="text-[10px] text-gray-400">Ctrl+X</span>
          </button>
          <button
            onClick={() => {
              handleCopy();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between"
          >
            <span>Copy</span>
            <span className="text-[10px] text-gray-400">Ctrl+C</span>
          </button>
          <button
            onClick={() => {
              handlePaste();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between"
          >
            <span>Paste</span>
            <span className="text-[10px] text-gray-400">Ctrl+V</span>
          </button>
          <button
            onClick={() => {
              handlePaste("values");
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
          >
            Paste Values Only
          </button>
          <button
            onClick={() => {
              handlePaste("transpose");
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
          >
            Paste Transpose
          </button>

          <div className="h-px bg-gray-200 my-1" />

          <button
            onClick={() => {
              handleInsertRow("above");
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
          >
            Insert Row Above
          </button>
          <button
            onClick={() => {
              handleInsertRow("below");
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
          >
            Insert Row Below
          </button>
          <button
            onClick={() => {
              handleDeleteRow();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-700"
          >
            Delete Row
          </button>

          <div className="h-px bg-gray-200 my-1" />

          <button
            onClick={() => {
              handleAutoFitColumn(contextMenu.c);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
          >
            AutoFit Column Width
          </button>
          <button
            onClick={() => {
              handleAutoFitRow(contextMenu.r);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
          >
            AutoFit Row Height
          </button>

          <div className="h-px bg-gray-200 my-1" />

          <button
            onClick={() => {
              handleMergeCells(true);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 hover:text-[#065F46] flex items-center gap-2"
          >
            <TableCellsMerge className="size-3.5 text-[#107C41]" />
            <span>{isSelectionMerged ? "Merge / Unmerge Selection" : "Merge & Center"}</span>
          </button>
          <button
            onClick={() => {
              handleMergeAcross();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2"
          >
            <Layers className="size-3.5 text-blue-600" />
            <span>Merge Across</span>
          </button>
          {isSelectionMerged && (
            <button
              onClick={() => {
                handleUnmergeCells();
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-amber-700 flex items-center gap-2"
            >
              <TableCellsSplit className="size-3.5 text-amber-600" />
              <span>Unmerge Cells</span>
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. FIND & REPLACE MODAL                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showFindReplaceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-300 shadow-2xl w-96 p-4 text-xs text-[#1E293B]">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 mb-3">
              <span className="font-bold text-sm text-[#111827]">Find and Replace</span>
              <button
                onClick={() => setShowFindReplaceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Find what:</label>
                <input
                  type="text"
                  value={findText}
                  autoFocus
                  onChange={(e) => setFindText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFindNext()}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:border-[#107C41] outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Replace with:</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:border-[#107C41] outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handleFindNext}
                  className="px-3 py-1 bg-[#107C41] text-white font-bold rounded hover:bg-[#0C5E31]"
                >
                  Find Next
                </button>
                <button
                  onClick={handleReplaceCurrent}
                  className="px-3 py-1 bg-gray-100 text-gray-700 font-semibold rounded hover:bg-gray-200"
                >
                  Replace
                </button>
                <button
                  onClick={handleReplaceAll}
                  className="px-3 py-1 bg-gray-100 text-gray-700 font-semibold rounded hover:bg-gray-200"
                >
                  Replace All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. SHEET RENAME MODAL                                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showSheetRenameModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-gray-300 shadow-2xl w-80 p-4 text-xs text-[#1E293B]">
            <span className="font-bold text-sm block mb-2">Rename Sheet</span>
            <input
              type="text"
              value={renameSheetInput}
              autoFocus
              onChange={(e) => setRenameSheetInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameSheetInput.trim()) {
                  setSheetNames((prev) =>
                    prev.map((s) => (s === sheetToRename ? renameSheetInput.trim() : s))
                  );
                  setActiveSheetName(renameSheetInput.trim());
                  setShowSheetRenameModal(false);
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:border-[#107C41] outline-hidden mb-3"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSheetRenameModal(false)}
                className="px-3 py-1 bg-gray-100 rounded text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (renameSheetInput.trim()) {
                    setSheetNames((prev) =>
                      prev.map((s) => (s === sheetToRename ? renameSheetInput.trim() : s))
                    );
                    setActiveSheetName(renameSheetInput.trim());
                    setShowSheetRenameModal(false);
                  }
                }}
                className="px-3 py-1 bg-[#107C41] text-white font-bold rounded hover:bg-[#0C5E31]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ephemeral Toast Notification */}
      {showNotification && (
        <div className="absolute bottom-12 right-6 bg-[#0F172A] text-white text-xs px-3 py-2 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 z-50">
          <Check className="size-3.5 text-emerald-400" />
          <span>{showNotification}</span>
        </div>
      )}
    </div>
  );
}
