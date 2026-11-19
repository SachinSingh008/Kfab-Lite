"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Building2,
  Folder,
  User,
  Calendar,
  RotateCw,
  Upload,
  Download,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  UserCheck,
  Trash2,
  Edit2,
  Undo2,
  PlusCircle,
  Sparkles,
  Palette,
  ArrowUp,
  ArrowDown,
  Info,
  Clock,
  FileText,
  ExternalLink,
  Sliders,
  ArrowUpRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import { AppUser } from "@/lib/auth-store";
import {
  getStoredMonitoringProjects,
  saveStoredMonitoringProjects,
  getStoredMonitoringRows,
  saveStoredMonitoringRows,
} from "@/lib/project-monitoring-store";
import { ProjectDetailSheetsModal } from "./project-detail-sheets-modal";

export type CellStatusType = "done" | "pending" | "not_done" | "not_updated";

export interface CellAudit {
  updatedBy: string;
  updatedAt: string;
}

export interface CellData {
  status: CellStatusType;
  remark: string;
  sectionDate?: string;
  audit?: CellAudit;
}

export interface ProjectCol {
  id: string;
  company: string;
  jobName: string;
  supervisor: string;
  supervisors?: string[];
  status: "Active" | "Inactive" | "Completed";
  bgHeader: string;
  textColor: string;
}

export interface SheetRowItem {
  id: string;
  rowNum: number | string;
  isSectionHeader?: boolean;
  activityName: string;
  activityAudit?: CellAudit;
  cells: Record<string, CellData>;
}

const DEFAULT_AUDIT: CellAudit = {
  updatedBy: "Sachin Singh (SUPER ADMIN)",
  updatedAt: "25-Sep-2026, 06:30 PM",
};

// URL Detection helper for Google Drive & documents
export function extractUrl(text: string): { hasUrl: boolean; url: string; label: string } {
  if (!text) return { hasUrl: false, url: "", label: "" };
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    const url = urlMatch[0];
    const isDrive = url.includes("drive.google.com") || url.includes("docs.google.com");
    let defaultLabel = isDrive ? "Drive Document" : "Open Document";
    const remainingText = text.replace(url, "").trim();
    return {
      hasUrl: true,
      url,
      label: remainingText || defaultLabel,
    };
  }
  return { hasUrl: false, url: "", label: text };
}

const INITIAL_PROJECTS: ProjectCol[] = [
  {
    id: "p1",
    company: "KFAB INFRA",
    jobName: "Plant Structure Extension",
    supervisor: "Sachin Singh",
    supervisors: ["Sachin Singh"],
    status: "Active",
    bgHeader: "#D6F5DE", // Soft green
    textColor: "#14532D",
  },
  {
    id: "p2",
    company: "KUMAR FABRICATORS",
    jobName: "Gantry Girder",
    supervisor: "Ramesh Sharma",
    supervisors: ["Ramesh Sharma"],
    status: "Active",
    bgHeader: "#FDE6CE", // Soft amber/peach
    textColor: "#7C2D12",
  },
  {
    id: "p3",
    company: "KFAB UNIT 2",
    jobName: "Trolley Assembly",
    supervisor: "Vikas Patil",
    supervisors: ["Vikas Patil"],
    status: "Active",
    bgHeader: "#DCEAF7", // Soft light blue
    textColor: "#1E3A8A",
  },
];

const INITIAL_ROWS: SheetRowItem[] = [
  // SECTION 1: JOB INITIATION
  {
    id: "r1",
    rowNum: 1,
    isSectionHeader: true,
    activityName: "JOB INITIATION",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "not_updated", sectionDate: "01-Sep-2026", remark: "Kickoff Phase", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "01-Sep-2026", remark: "PO Registered", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "02-Sep-2026", remark: "Drawings in Queue", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r2",
    rowNum: 2,
    activityName: "Job Received",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "PO received (SO-26362)", audit: DEFAULT_AUDIT },
      p2: { status: "done", remark: "PO received (SO-26363)", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "Work order received", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r3",
    rowNum: 3,
    activityName: "Take Out Required Material List",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "MRL finalized", audit: DEFAULT_AUDIT },
      p2: { status: "done", remark: "MRL shared with stores", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "List under verification", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r4",
    rowNum: 4,
    activityName: "Tools Required List",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Tools arranged", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Tool list pending", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "Not yet prepared", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r5",
    rowNum: 5,
    activityName: "Final Data & Starting Date",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Data approved, start 05-Sep", audit: DEFAULT_AUDIT },
      p2: { status: "done", remark: "Start 15-Sep", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "Awaiting final drawing", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r6",
    rowNum: 6,
    activityName: "Calculate Budget & Deadline",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Budget ₹38.5L / Due 25-Sep", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Under calculation", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "Budget not approved", audit: DEFAULT_AUDIT },
    },
  },

  // SECTION 2: INWARD
  {
    id: "r7",
    rowNum: 7,
    isSectionHeader: true,
    activityName: "INWARD",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "not_updated", sectionDate: "05-Sep-2026", remark: "Stores Inward Inspection", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "05-Sep-2026", remark: "Gate Entry CH-1187", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "06-Sep-2026", remark: "Awaiting Mill TC", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r8",
    rowNum: 8,
    activityName: "Material Inward Challan",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Material received (CH-1124)", audit: DEFAULT_AUDIT },
      p2: { status: "done", remark: "Received (CH-1187)", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "Awaiting challan", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r9",
    rowNum: 9,
    activityName: "Match Input with Required List",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Matched & verified", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Partial match", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "Mismatch - qty short", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r10",
    rowNum: 10,
    activityName: "Resolve Queries",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "pending", remark: "Minor query on thickness", audit: DEFAULT_AUDIT },
      p2: { status: "not_done", remark: "Query raised to vendor", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "Pending review", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r11",
    rowNum: 11,
    activityName: "Mark Done",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Inward closed", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Pending query closure", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", remark: "-", audit: DEFAULT_AUDIT },
    },
  },

  // SECTION 3: FABRICATION
  {
    id: "r12",
    rowNum: 12,
    isSectionHeader: true,
    activityName: "FABRICATION",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "not_updated", sectionDate: "15-Sep-2026", remark: "Bay 2 & Bay 3 Floor", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "15-Sep-2026", remark: "Cutting Station 1", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "18-Sep-2026", remark: "Assembly Line 2", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r13",
    rowNum: 13,
    activityName: "Track Progress",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "76% (Cutting & Fitting done)", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "40% (Cutting ongoing)", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "Not started", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r14",
    rowNum: 14,
    activityName: "Match with Given Timeline",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "On schedule", audit: DEFAULT_AUDIT },
      p2: { status: "not_done", remark: "Delay - 3 days", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "Timeline to be revised", audit: DEFAULT_AUDIT },
    },
  },

  // SECTION 4: REPORTS
  {
    id: "r15",
    rowNum: 15,
    isSectionHeader: true,
    activityName: "REPORTS",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "not_updated", sectionDate: "18-Sep-2026", remark: "https://drive.google.com/file/d/IR-001/view IR-001 Drive Report", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "18-Sep-2026", remark: "Stage Audit Dossier", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "20-Sep-2026", remark: "Testing Pending", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r16",
    rowNum: 16,
    activityName: "Inspection Report",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "https://drive.google.com/file/d/IR-001/view IR-001 Submitted", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "In progress", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "Not yet started", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r17",
    rowNum: 17,
    activityName: "TC Report",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "pending", remark: "https://drive.google.com/file/d/TC-26362/view TC-26362-01 ready", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "To be generated", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "Pending fabrication", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r18",
    rowNum: 18,
    activityName: "RT Report",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "RT scheduled (20-Sep)", audit: DEFAULT_AUDIT },
      p2: { status: "not_done", remark: "Not applicable", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", remark: "-", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r19",
    rowNum: 19,
    activityName: "Dye Test Report",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "not_updated", remark: "Not required", audit: DEFAULT_AUDIT },
      p2: { status: "done", remark: "DPT-001 completed", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "To be scheduled", audit: DEFAULT_AUDIT },
    },
  },

  // SECTION 5: INSPECTION
  {
    id: "r20",
    rowNum: 20,
    isSectionHeader: true,
    activityName: "INSPECTION",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "not_updated", sectionDate: "20-Sep-2026", remark: "TPI Agency Bureau Veritas", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "22-Sep-2026", remark: "Client QC Verification", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "25-Sep-2026", remark: "Internal Plant QC", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r21",
    rowNum: 21,
    activityName: "Inspection",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Inspection completed", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Inspection scheduled (22-Sep)", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "Pending fabrication", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r22",
    rowNum: 22,
    activityName: "Resolved Query",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "All queries resolved", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "2 queries open", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", remark: "-", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r23",
    rowNum: 23,
    activityName: "Inspection Final",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Final inspection cleared", audit: DEFAULT_AUDIT },
      p2: { status: "not_done", remark: "Not cleared - rework", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "Pending inspection", audit: DEFAULT_AUDIT },
    },
  },

  // SECTION 6: PROOFS
  {
    id: "r24",
    rowNum: 24,
    isSectionHeader: true,
    activityName: "PROOFS",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "not_updated", sectionDate: "22-Sep-2026", remark: "https://drive.google.com/drive/folders/proofs Site Proofs Drive", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "22-Sep-2026", remark: "Surface Quality Photos", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "26-Sep-2026", remark: "Fabrication Visuals", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r25",
    rowNum: 25,
    activityName: "Photo",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "https://drive.google.com/drive/folders/proofs Photos uploaded", audit: DEFAULT_AUDIT },
      p2: { status: "done", remark: "Progress photos (20-Sep)", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "To be uploaded", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r26",
    rowNum: 26,
    activityName: "Paint if Applicable",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Primer & top coat done", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Painting on hold", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "Not applicable", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r27",
    rowNum: 27,
    activityName: "Photo",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "https://drive.google.com/drive/folders/painted Final painted photos", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Pending", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "After painting", audit: DEFAULT_AUDIT },
    },
  },

  // SECTION 7: DELIVERY
  {
    id: "r28",
    rowNum: 28,
    isSectionHeader: true,
    activityName: "DELIVERY",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "not_updated", sectionDate: "24-Sep-2026", remark: "https://drive.google.com/file/d/dispatch-26362/view Dispatch Dossier", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "25-Sep-2026", remark: "Trailer Logistics Ready", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "28-Sep-2026", remark: "Gate Clearance Scheduled", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r29",
    rowNum: 29,
    activityName: "Delivery Challan",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "DC-26362 issued", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Draft prepared", audit: DEFAULT_AUDIT },
      p3: { status: "pending", remark: "Not ready", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r30",
    rowNum: 30,
    activityName: "E-way Bill",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "EWB-843726 generated", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "To be generated", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", remark: "-", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r31",
    rowNum: 31,
    activityName: "Invoice",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "https://drive.google.com/file/d/inv-26362-01/view INV-26362-01 raised", audit: DEFAULT_AUDIT },
      p2: { status: "not_done", remark: "Pending inspection", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", remark: "-", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r32",
    rowNum: 32,
    activityName: "Dispatched",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "Dispatched (25-Sep)", audit: DEFAULT_AUDIT },
      p2: { status: "pending", remark: "Tentative - 27-Sep", audit: DEFAULT_AUDIT },
      p3: { status: "not_done", remark: "Not dispatched", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r33",
    rowNum: 33,
    activityName: "Date",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "25-Sep-2026", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", remark: "-", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", remark: "-", audit: DEFAULT_AUDIT },
    },
  },
];

export interface ProjectDetailsMonitoringSheetProps {
  currentUser?: AppUser;
  onSwitchToProgress?: () => void;
}

export function ProjectDetailsMonitoringSheet({
  currentUser,
  onSwitchToProgress,
}: ProjectDetailsMonitoringSheetProps = {}) {
  const [projects, setProjects] = useState<ProjectCol[]>(() => getStoredMonitoringProjects());
  const [rows, setRows] = useState<SheetRowItem[]>(() => getStoredMonitoringRows());
  const [history, setHistory] = useState<SheetRowItem[][]>([]);

  // Automatically broadcast and sync state changes to shared store so Project Progress tab updates live
  useEffect(() => {
    saveStoredMonitoringProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveStoredMonitoringRows(rows);
  }, [rows]);

  // Current user display name for audit stamp
  const currentUserName = useMemo(() => {
    if (!currentUser) return "Sachin Singh (SUPER ADMIN)";
    const r = currentUser.role ? ` (${currentUser.role.replace("_", " ")})` : "";
    return `${currentUser.name || currentUser.username || "Operator"}${r}`;
  }, [currentUser]);

  const getNowFormatted = () => {
    const d = new Date();
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Pinned Column Widths
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    num: 45,
    activity: 260,
    p1_status: 80,
    p1_remark: 220,
    p2_status: 80,
    p2_remark: 220,
    p3_status: 80,
    p3_remark: 220,
  });

  const resizingRef = useRef<{ colKey: string; startX: number; startWidth: number } | null>(null);

  // Filters (Defaults: All Companies, Active Projects, All Supervisor, All Period)
  const [selectedCompany, setSelectedCompany] = useState<string>("ALL");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "COMPLETED" | "ALL">("ACTIVE");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");

  // Modals for Incomplete Tasks, Shift to Active, Assign Supervisor & Project Worksheets
  const [worksheetsProject, setWorksheetsProject] = useState<ProjectCol | null>(null);
  const [incompleteModalProject, setIncompleteModalProject] = useState<ProjectCol | null>(null);
  const [activateModalProject, setActivateModalProject] = useState<ProjectCol | null>(null);
  const [assignSupervisorModal, setAssignSupervisorModal] = useState<ProjectCol | null>(null);
  const [assignedSupervisorsList, setAssignedSupervisorsList] = useState<string[]>([]);
  const [customSupervisorInput, setCustomSupervisorInput] = useState<string>("");

  // Excel Cell Selection & Inline Editing
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colKey: string } | null>({
    rowIdx: 1,
    colKey: "activity",
  });
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [inlineValue, setInlineValue] = useState<string>("");
  const [formulaValue, setFormulaValue] = useState<string>("");

  // Quick Status Picker Popover (for non-blue rows: 4 options only)
  const [statusPicker, setStatusPicker] = useState<{
    rowIdx: number;
    projId: string;
    x: number;
    y: number;
  } | null>(null);

  // Audit Info Popover
  const [activeAuditInfo, setActiveAuditInfo] = useState<{
    x: number;
    y: number;
    title: string;
    audit: CellAudit;
  } | null>(null);

  // Collapsible Header / KPIs State (saves vertical space for Excel grid)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

  // Project Column Edit Modal
  const [editingProject, setEditingProject] = useState<ProjectCol | null>(null);
  const [editCompanyInput, setEditCompanyInput] = useState<string>("");
  const [editJobInput, setEditJobInput] = useState<string>("");
  const [editColorInput, setEditColorInput] = useState<string>("");
  const [editSupervisors, setEditSupervisors] = useState<string[]>([]);
  const [editCustomSupInput, setEditCustomSupInput] = useState<string>("");

  // Add Project Modal (Supports Multiple Supervisors)
  const [showAddProjectModal, setShowAddProjectModal] = useState<boolean>(false);
  const [newCompany, setNewCompany] = useState<string>("");
  const [newJobName, setNewJobName] = useState<string>("");
  const [newSupervisors, setNewSupervisors] = useState<string[]>(["Sachin Singh"]);
  const [newCustomSupInput, setNewCustomSupInput] = useState<string>("");
  const [newColorTheme, setNewColorTheme] = useState<"emerald" | "amber" | "blue" | "purple">("purple");

  // Row Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowIdx: number } | null>(null);

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Two-way Synced Horizontal Scroll Refs (Top sliding bar and grid)
  const topScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef<boolean>(false);

  const handleTopScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (gridScrollRef.current && topScrollRef.current) {
      gridScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handleGridScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (topScrollRef.current && gridScrollRef.current) {
      topScrollRef.current.scrollLeft = gridScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const scrollLeftBy = (offset: number) => {
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  // Record history for Undo
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(rows))]);
  }, [rows]);

  const handleUndo = () => {
    if (history.length === 0) {
      showToast("Nothing to undo.");
      return;
    }
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRows(previous);
    showToast("Reverted last change.");
  };

  // Filtered projects based on Company, Project Status (Default: Active Projects), Supervisor
  const visibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedCompany !== "ALL" && p.company !== selectedCompany) return false;
      if (projectStatusFilter === "ACTIVE" && p.status !== "Active") return false;
      if (projectStatusFilter === "INACTIVE" && p.status !== "Inactive") return false;
      if (projectStatusFilter === "COMPLETED" && p.status !== "Completed") return false;
      if (selectedSupervisor !== "ALL") {
        const matches =
          (p.supervisors && p.supervisors.includes(selectedSupervisor)) ||
          (p.supervisor && p.supervisor.toLowerCase().includes(selectedSupervisor.toLowerCase()));
        if (!matches) return false;
      }
      return true;
    });
  }, [projects, selectedCompany, projectStatusFilter, selectedSupervisor]);

  // Dynamic KPI Stats computed live from projects
  const kpiStats = useMemo(() => {
    const active = projects.filter((p) => p.status === "Active").length;
    const inactive = projects.filter((p) => p.status === "Inactive").length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    const total = projects.length;
    const progress = total > 0 ? Math.round(((completed + active * 0.5) / total) * 100) : 0;
    return {
      active: String(active).padStart(2, "0"),
      inactive: String(inactive).padStart(2, "0"),
      completed: String(completed).padStart(2, "0"),
      total: String(total).padStart(2, "0"),
      progress: `${progress}%`,
    };
  }, [projects]);

  // List of all supervisors with tasks/projects assigned to them
  const allSupervisors = useMemo(() => {
    const sups = new Set<string>();
    projects.forEach((p) => {
      if (p.supervisors && Array.isArray(p.supervisors)) {
        p.supervisors.forEach((s: string) => {
          if (s && s.trim()) sups.add(s.trim());
        });
      }
      if (p.supervisor && p.supervisor.trim()) {
        p.supervisor.split(",").forEach((s: string) => {
          if (s && s.trim()) sups.add(s.trim());
        });
      }
    });
    ["Sachin Singh", "Ramesh Sharma", "Vikas Patil", "Sunil Gaikwad", "Anil Deshmukh"].forEach((s) => sups.add(s));
    return Array.from(sups);
  }, [projects]);

  // Check if all non-section status cells for a project are green ("done")
  const checkProjectAllDone = (projId: string): boolean => {
    const nonSectionRows = rows.filter((r) => !r.isSectionHeader);
    if (nonSectionRows.length === 0) return true;
    return nonSectionRows.every((r) => {
      const cell = r.cells[projId];
      return cell && cell.status === "done";
    });
  };

  // Mark Project as Done / Completed or Shift to Active
  const handleMarkProjectDoneClick = (p: ProjectCol) => {
    // If project is already in Inactive or Completed (Done) state, prompt to shift it to Active
    if (p.status === "Inactive" || p.status === "Completed") {
      setActivateModalProject(p);
      return;
    }

    const allGreen = checkProjectAllDone(p.id);
    if (allGreen) {
      setProjects((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, status: "Completed" } : item))
      );
      showToast(`${p.company} marked as Completed!`);
    } else {
      setIncompleteModalProject(p);
    }
  };

  // Open Assign Supervisor modal for a project (Multi-Supervisor)
  const openAssignSupervisorModal = (p: ProjectCol) => {
    setAssignSupervisorModal(p);
    const existing = p.supervisors && p.supervisors.length > 0
      ? [...p.supervisors]
      : p.supervisor
        ? p.supervisor.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    setAssignedSupervisorsList(existing);
    setCustomSupervisorInput("");
  };

  // Toggle supervisor in assigned list
  const toggleSupervisorAssignment = (name: string) => {
    setAssignedSupervisorsList((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  // Add custom supervisor to assignment list
  const addCustomSupervisorToAssignment = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!assignedSupervisorsList.includes(trimmed)) {
      setAssignedSupervisorsList((prev) => [...prev, trimmed]);
    }
    setCustomSupervisorInput("");
  };

  // Save multiple supervisors to project
  const handleSaveAssignedSupervisors = () => {
    if (!assignSupervisorModal) return;
    const finalSups = assignedSupervisorsList.length > 0 ? assignedSupervisorsList : ["Unassigned"];
    const joinedStr = finalSups.join(", ");
    setProjects((prev) =>
      prev.map((item) =>
        item.id === assignSupervisorModal.id
          ? { ...item, supervisor: joinedStr, supervisors: finalSups }
          : item
      )
    );
    showToast(`Updated supervisors for ${assignSupervisorModal.company}: ${joinedStr}`);
    setAssignSupervisorModal(null);
    setCustomSupervisorInput("");
  };

  // Multi-Supervisor helpers for Add Project modal
  const toggleNewSupervisor = (name: string) => {
    setNewSupervisors((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const addNewCustomSupervisor = () => {
    const trimmed = newCustomSupInput.trim();
    if (!trimmed) return;
    if (!newSupervisors.includes(trimmed)) {
      setNewSupervisors((prev) => [...prev, trimmed]);
    }
    setNewCustomSupInput("");
  };

  // Total width of all table columns for top sliding bar
  const totalTableWidth = useMemo(() => {
    let w = (colWidths.num || 45) + (colWidths.activity || 260);
    visibleProjects.forEach((p) => {
      w += (colWidths[`${p.id}_status`] || 80) + (colWidths[`${p.id}_remark`] || 220);
    });
    return Math.max(w, 850);
  }, [colWidths, visibleProjects]);

  // Compute selected cell value string (for formula bar and display)
  const getCellValue = useCallback(
    (rowIdx: number, colKey: string): string => {
      const row = rows[rowIdx];
      if (!row) return "";
      if (colKey === "num") return String(row.rowNum);
      if (colKey === "activity") return row.activityName;

      const [projId, subType] = colKey.split("_");
      const cell = row.cells[projId];
      if (!cell) return "";

      // In blue section rows, status column holds the milestone date
      if (row.isSectionHeader) {
        if (subType === "status") {
          return cell.sectionDate || "";
        }
        if (subType === "remark") {
          return cell.remark === "-" ? "" : cell.remark;
        }
      }

      if (subType === "status") {
        if (cell.status === "done") return "Done";
        if (cell.status === "pending") return "Pending";
        if (cell.status === "not_done") return "Not Done";
        return "Not Updated";
      }
      if (subType === "remark") {
        return cell.remark === "-" ? "" : cell.remark;
      }
      return "";
    },
    [rows]
  );

  // Update formula bar when selected cell changes
  useEffect(() => {
    if (selectedCell) {
      const val = getCellValue(selectedCell.rowIdx, selectedCell.colKey);
      setFormulaValue(val);
      if (editingCell) {
        setInlineValue(val);
      }
    }
  }, [selectedCell, editingCell, getCellValue]);

  // Save edit value to grid with audit stamp
  const commitCellValue = (rowIdx: number, colKey: string, newValue: string) => {
    pushHistory();
    const newAudit: CellAudit = {
      updatedBy: currentUserName,
      updatedAt: getNowFormatted(),
    };

    setRows((prev) => {
      const copy = [...prev];
      const r = { ...copy[rowIdx] };

      if (colKey === "num") {
        r.rowNum = newValue;
      } else if (colKey === "activity") {
        r.activityName = newValue;
        r.activityAudit = newAudit;
      } else {
        const [projId, subType] = colKey.split("_");
        const existingCell = r.cells[projId] || { status: "not_updated", remark: "-" };

        // For Blue section rows, status column is an editable date field
        if (r.isSectionHeader) {
          if (subType === "status") {
            r.cells = {
              ...r.cells,
              [projId]: {
                ...existingCell,
                sectionDate: newValue.trim(),
                audit: newAudit,
              },
            };
          } else if (subType === "remark") {
            r.cells = {
              ...r.cells,
              [projId]: {
                ...existingCell,
                remark: newValue.trim() || "-",
                audit: newAudit,
              },
            };
          }
        } else {
          // Regular data rows
          if (subType === "status") {
            const lower = newValue.toLowerCase().trim();
            let newStatus: CellStatusType = "not_updated";
            if (lower === "done" || lower === "complete" || lower === "yes" || lower === "green" || lower === "ok") {
              newStatus = "done";
            } else if (lower === "pending" || lower === "wip" || lower === "yellow" || lower === "amber") {
              newStatus = "pending";
            } else if (lower === "not done" || lower === "red" || lower === "no" || lower === "x") {
              newStatus = "not_done";
            }
            r.cells = {
              ...r.cells,
              [projId]: {
                ...existingCell,
                status: newStatus,
                audit: newAudit,
              },
            };
          } else if (subType === "remark") {
            r.cells = {
              ...r.cells,
              [projId]: {
                ...existingCell,
                remark: newValue.trim() || "-",
                audit: newAudit,
              },
            };
          }
        }
      }
      copy[rowIdx] = r;
      return copy;
    });
    setEditingCell(null);
  };

  // Start editing cell
  const startEditing = (rowIdx: number, colKey: string) => {
    setSelectedCell({ rowIdx, colKey });
    setEditingCell({ rowIdx, colKey });
    const val = getCellValue(rowIdx, colKey);
    setInlineValue(val);
    setFormulaValue(val);
  };

  // Handle keydown on grid
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If typing in any input, textarea, select, or modal dialog, do NOT intercept
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        Boolean(target.closest("input, textarea, select, form, [role='dialog'], .modal-container")))
    ) {
      return;
    }

    if (!selectedCell) return;
    const { rowIdx, colKey } = selectedCell;

    // In edit mode
    if (editingCell) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitCellValue(rowIdx, colKey, inlineValue);
        if (rowIdx < rows.length - 1) {
          setSelectedCell({ rowIdx: rowIdx + 1, colKey });
        }
      } else if (e.key === "Escape") {
        setEditingCell(null);
        setInlineValue(getCellValue(rowIdx, colKey));
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitCellValue(rowIdx, colKey, inlineValue);
      }
      return;
    }

    // Navigation mode
    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      startEditing(rowIdx, colKey);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIdx < rows.length - 1) {
        setSelectedCell({ rowIdx: rowIdx + 1, colKey });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIdx > 0) {
        setSelectedCell({ rowIdx: rowIdx - 1, colKey });
      }
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      commitCellValue(rowIdx, colKey, "");
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      startEditing(rowIdx, colKey);
      setInlineValue(e.key);
      setFormulaValue(e.key);
    }
  };

  // Column Resizing handlers
  const handleMouseDownResize = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey] || 150,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = moveEvent.clientX - resizingRef.current.startX;
      const newWidth = Math.max(35, resizingRef.current.startWidth + diff);
      setColWidths((prev) => ({
        ...prev,
        [resizingRef.current!.colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Row Manipulation (Insert / Delete)
  const insertRow = (targetIdx: number, direction: "above" | "below", isSection = false) => {
    pushHistory();
    const newAudit: CellAudit = {
      updatedBy: currentUserName,
      updatedAt: getNowFormatted(),
    };

    setRows((prev) => {
      const copy = [...prev];
      const insertAt = direction === "above" ? targetIdx : targetIdx + 1;
      const newRowNum = isSection ? `SEC` : copy.length + 1;
      const newRow: SheetRowItem = {
        id: `r_${Date.now()}`,
        rowNum: newRowNum,
        isSectionHeader: isSection,
        activityName: isSection ? "NEW SECTION HEADER" : "New Process / Activity",
        activityAudit: newAudit,
        cells: isSection
          ? {
              p1: { status: "not_updated", sectionDate: "DD-Mon-YYYY", remark: "Section Notes", audit: newAudit },
              p2: { status: "not_updated", sectionDate: "DD-Mon-YYYY", remark: "Section Notes", audit: newAudit },
              p3: { status: "not_updated", sectionDate: "DD-Mon-YYYY", remark: "Section Notes", audit: newAudit },
            }
          : {},
      };
      copy.splice(insertAt, 0, newRow);
      return copy;
    });
    setContextMenu(null);
    showToast(`Inserted ${isSection ? "section" : "row"} ${direction}.`);
  };

  const deleteRow = (targetIdx: number) => {
    if (rows.length <= 1) {
      showToast("Cannot delete the only remaining row.");
      return;
    }
    pushHistory();
    setRows((prev) => prev.filter((_, idx) => idx !== targetIdx));
    setContextMenu(null);
    showToast(`Deleted row #${rows[targetIdx]?.rowNum}.`);
  };

  // Status Quick Update (4 Options Only for normal rows)
  const setQuickStatus = (rowIdx: number, projId: string, status: CellStatusType) => {
    pushHistory();
    const newAudit: CellAudit = {
      updatedBy: currentUserName,
      updatedAt: getNowFormatted(),
    };

    setRows((prev) => {
      const copy = [...prev];
      const r = { ...copy[rowIdx] };
      const existing = r.cells[projId] || { status: "not_updated", remark: "-" };
      r.cells = {
        ...r.cells,
        [projId]: {
          ...existing,
          status,
          audit: newAudit,
        },
      };
      copy[rowIdx] = r;
      return copy;
    });
    setStatusPicker(null);
  };

  // Project Column Header Editing (Multi-Supervisor support)
  const openEditProject = (proj: ProjectCol) => {
    setEditingProject(proj);
    setEditCompanyInput(proj.company);
    setEditJobInput(proj.jobName);
    setEditColorInput(proj.bgHeader);
    const existing = proj.supervisors && proj.supervisors.length > 0
      ? [...proj.supervisors]
      : proj.supervisor
        ? proj.supervisor.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    setEditSupervisors(existing);
    setEditCustomSupInput("");
  };

  const toggleEditSupervisor = (name: string) => {
    setEditSupervisors((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const addEditCustomSupervisor = () => {
    const trimmed = editCustomSupInput.trim();
    if (!trimmed) return;
    if (!editSupervisors.includes(trimmed)) {
      setEditSupervisors((prev) => [...prev, trimmed]);
    }
    setEditCustomSupInput("");
  };

  const saveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const finalSups = editSupervisors.length > 0 ? editSupervisors : ["Unassigned"];
    const joinedStr = finalSups.join(", ");
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === editingProject.id) {
          return {
            ...p,
            company: editCompanyInput.toUpperCase().trim() || p.company,
            jobName: editJobInput.trim() || p.jobName,
            bgHeader: editColorInput || p.bgHeader,
            supervisor: joinedStr,
            supervisors: finalSups,
          };
        }
        return p;
      })
    );
    setEditingProject(null);
    showToast("Updated company & project heading.");
  };

  const deleteProject = (projId: string) => {
    if (projects.length <= 1) {
      showToast("Cannot delete the last project column.");
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== projId));
    setEditingProject(null);
    showToast("Project column removed.");
  };

  // Add Project Submit (Multi-Supervisor support)
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newJobName.trim()) {
      showToast("Please provide company name and job/project name.");
      return;
    }

    const themeMap = {
      emerald: { bg: "#D6F5DE", text: "#14532D" },
      amber: { bg: "#FDE6CE", text: "#7C2D12" },
      blue: { bg: "#DCEAF7", text: "#1E3A8A" },
      purple: { bg: "#EDE9FE", text: "#5B21B6" },
    };

    const finalSups = newSupervisors.length > 0 ? newSupervisors : ["Sachin Singh"];
    const newId = `p_${Date.now()}`;
    const newProj: ProjectCol = {
      id: newId,
      company: newCompany.toUpperCase().trim(),
      jobName: newJobName.trim(),
      supervisor: finalSups.join(", "),
      supervisors: finalSups,
      status: "Active",
      bgHeader: themeMap[newColorTheme].bg,
      textColor: themeMap[newColorTheme].text,
    };

    setColWidths((prev) => ({
      ...prev,
      [`${newId}_status`]: 80,
      [`${newId}_remark`]: 220,
    }));

    setProjects((prev) => [...prev, newProj]);
    setShowAddProjectModal(false);
    setNewCompany("");
    setNewJobName("");
    setNewSupervisors(["Sachin Singh"]);
    setNewCustomSupInput("");
    showToast(`Added ${newProj.company} column to sheet.`);
  };

  // =================================================================
  // EXCEL CLIPBOARD COPY & PASTE (Tab-separated and Newline-separated)
  // =================================================================
  const handleGridPaste = (e: React.ClipboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        Boolean(target.closest("input, textarea, select, form, [role='dialog'], .modal-container")))
    ) {
      return;
    }
    if (editingCell) return;

    const pasteText = e.clipboardData.getData("text/plain");
    if (!pasteText) return;

    e.preventDefault();
    const pasteRows = pasteText.split(/\r\n|\n|\r/).filter((line) => line.length > 0);
    if (pasteRows.length === 0) return;

    pushHistory();
    const startRowIdx = selectedCell ? selectedCell.rowIdx : 0;
    const startColKey = selectedCell ? selectedCell.colKey : "activity";

    const allColKeys = ["num", "activity"];
    visibleProjects.forEach((p) => {
      allColKeys.push(`${p.id}_status`, `${p.id}_remark`);
    });

    let startColIdx = allColKeys.indexOf(startColKey);
    if (startColIdx === -1) startColIdx = 1;

    const newAudit: CellAudit = {
      updatedBy: currentUserName,
      updatedAt: getNowFormatted(),
    };

    setRows((prev) => {
      const copy = [...prev];

      pasteRows.forEach((rowStr, rOffset) => {
        const targetRowIdx = startRowIdx + rOffset;
        if (targetRowIdx >= copy.length) {
          copy.push({
            id: `r_pasted_${Date.now()}_${rOffset}`,
            rowNum: copy.length + 1,
            activityName: "",
            activityAudit: newAudit,
            cells: {},
          });
        }

        const r = { ...copy[targetRowIdx] };
        const cellsInRow = rowStr.split("\t");

        cellsInRow.forEach((val, cOffset) => {
          const colIdx = startColIdx + cOffset;
          if (colIdx >= allColKeys.length) return;
          const colKey = allColKeys[colIdx];
          const trimmed = val.trim();

          if (colKey === "num") {
            r.rowNum = trimmed;
          } else if (colKey === "activity") {
            r.activityName = trimmed;
            r.activityAudit = newAudit;
          } else {
            const [projId, subType] = colKey.split("_");
            const existing = r.cells[projId] || { status: "not_updated", remark: "-" };

            if (r.isSectionHeader) {
              if (subType === "status") {
                r.cells = {
                  ...r.cells,
                  [projId]: { ...existing, sectionDate: trimmed, audit: newAudit },
                };
              } else if (subType === "remark") {
                r.cells = {
                  ...r.cells,
                  [projId]: { ...existing, remark: trimmed || "-", audit: newAudit },
                };
              }
            } else {
              if (subType === "status") {
                const lower = trimmed.toLowerCase();
                let s: CellStatusType = "not_updated";
                if (["done", "complete", "completed", "ok", "yes", "green", "✓"].includes(lower)) {
                  s = "done";
                } else if (["pending", "wip", "in progress", "yellow", "amber", "−"].includes(lower)) {
                  s = "pending";
                } else if (["not done", "failed", "no", "red", "x", "✕"].includes(lower)) {
                  s = "not_done";
                }
                r.cells = {
                  ...r.cells,
                  [projId]: { ...existing, status: s, audit: newAudit },
                };
              } else if (subType === "remark") {
                r.cells = {
                  ...r.cells,
                  [projId]: { ...existing, remark: trimmed || "-", audit: newAudit },
                };
              }
            }
          }
        });

        copy[targetRowIdx] = r;
      });

      return copy;
    });

    showToast(`Pasted ${pasteRows.length} rows from Excel clipboard.`);
  };

  // Copy active cell
  const handleGridCopy = (e: React.ClipboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        Boolean(target.closest("input, textarea, select, form, [role='dialog'], .modal-container")))
    ) {
      return;
    }
    if (editingCell) return;
    if (!selectedCell) return;
    const val = getCellValue(selectedCell.rowIdx, selectedCell.colKey);
    e.clipboardData.setData("text/plain", val);
    e.preventDefault();
    showToast(`Copied "${val}" to clipboard.`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const dataToExport: Array<Record<string, string | number>> = [];

      rows.forEach((r) => {
        if (r.isSectionHeader) {
          const rowObj: Record<string, string | number> = {
            "#": r.rowNum,
            "Process / Activity": r.activityName,
          };
          visibleProjects.forEach((p) => {
            const cell = r.cells[p.id];
            rowObj[`${p.company} - Status / Date`] = cell?.sectionDate || "";
            rowObj[`${p.company} - Remark`] = cell?.remark || "";
          });
          dataToExport.push(rowObj);
        } else {
          const rowObj: Record<string, string | number> = {
            "#": r.rowNum,
            "Process / Activity": r.activityName,
          };
          visibleProjects.forEach((p) => {
            const cell = r.cells[p.id];
            rowObj[`${p.company} - Status / Date`] = cell?.status?.toUpperCase() || "NOT_UPDATED";
            rowObj[`${p.company} - Remark`] = cell?.remark || "-";
          });
          dataToExport.push(rowObj);
        }
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Production Report");
      XLSX.writeFile(wb, "Project_Details_Production_Monitoring_Sheet.xlsx");
      showToast("Excel spreadsheet downloaded successfully.");
    } catch (err) {
      console.error(err);
      showToast("Failed to export Excel file.");
    }
  };

  // Import Excel handler
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast(`Loaded ${file.name}. Spreadsheet synchronized.`);
    e.target.value = "";
  };

  // Status icon renderer (The 4 exact options)
  const renderStatusBadge = (status: CellStatusType) => {
    switch (status) {
      case "done":
        return (
          <div
            className="size-5 rounded-md bg-[#16A34A] text-white flex items-center justify-center shadow-xs mx-auto"
            title="Done (Green)"
          >
            <Check className="size-3.5 stroke-[3]" />
          </div>
        );
      case "pending":
        return (
          <div
            className="size-5 rounded-md bg-[#EAB308] text-white flex items-center justify-center shadow-xs mx-auto"
            title="Pending (Yellow)"
          >
            <span className="font-bold text-sm leading-none">−</span>
          </div>
        );
      case "not_done":
        return (
          <div
            className="size-5 rounded-md bg-[#DC2626] text-white flex items-center justify-center shadow-xs mx-auto"
            title="Not Done (Red)"
          >
            <X className="size-3.5 stroke-[3]" />
          </div>
        );
      case "not_updated":
      default:
        return (
          <div
            className="size-5 rounded-md border-2 border-slate-300 bg-white mx-auto"
            title="Not Updated (Blank)"
          />
        );
    }
  };

  // Cell address converter for formula bar (e.g. Row 2, Activity -> B2)
  const cellAddress = useMemo(() => {
    if (!selectedCell) return "A1";
    const { rowIdx, colKey } = selectedCell;
    let colLetter = "A";
    if (colKey === "num") colLetter = "A";
    else if (colKey === "activity") colLetter = "B";
    else {
      const idx = visibleProjects.findIndex((p) => colKey.startsWith(p.id));
      if (idx !== -1) {
        const isRemark = colKey.endsWith("remark");
        const charCode = 67 + idx * 2 + (isRemark ? 1 : 0);
        colLetter = String.fromCharCode(charCode);
      }
    }
    return `${colLetter}${rowIdx + 1}`;
  }, [selectedCell, visibleProjects]);

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPaste={handleGridPaste}
      onCopy={handleGridCopy}
      className="space-y-1.5 pb-2 font-sans text-slate-800 outline-none"
    >
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="size-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. COLLAPSIBLE TOP HEADER & SMALL KPIS (Saves vertical space for Excel grid) */}
      {isHeaderCollapsed ? (
        /* ULTRA-COMPACT COLLAPSED STRIP */
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center justify-between gap-3 shadow-2xs">
          {/* Left: Title & Small KPI Badges */}
          <div className="flex items-center gap-2.5 overflow-x-auto min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 shrink-0">
              <FileSpreadsheet className="size-4 text-[#0F2642]" />
              <span className="hidden sm:inline">Project Details</span>
            </div>

            <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

            {/* Small KPI Badges on top (Dynamic live stats) */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>{kpiStats.active} Active</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-rose-500" />
                <span>{kpiStats.inactive} Inactive</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-blue-500" />
                <span>{kpiStats.completed} Completed</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                <span>{kpiStats.total} Projects</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 flex items-center gap-1">
                <span>{kpiStats.progress} Progress</span>
              </span>
            </div>
          </div>

          {/* Right: Actions & Expand Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Undo last edit (Ctrl+Z)"
            >
              <Undo2 className="size-3 text-slate-600" />
              <span className="hidden md:inline">Undo</span>
            </button>

            <button
              type="button"
              onClick={() => showToast("Synchronized production telemetry & progress data.")}
              className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Sync telemetry"
            >
              <RotateCw className="size-3 text-slate-600" />
              <span className="hidden md:inline">Sync</span>
            </button>

            <label className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer">
              <Upload className="size-3 text-slate-600" />
              <span className="hidden md:inline">Import</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Export to Excel"
            >
              <Download className="size-3 text-slate-600" />
              <span className="hidden md:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddProjectModal(true)}
              className="px-2.5 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>Add Project</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(false)}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Expand Header & KPIs"
            >
              <ChevronDown className="size-3.5" />
              <span>Expand</span>
            </button>
          </div>
        </div>
      ) : (
        /* EXPANDED HEADER WITH SMALL KPIS ON TOP */
        <div className="space-y-2.5">
          {/* Breadcrumb + Switch Link + Collapse Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Reports</span>
              <ChevronRight className="size-3 text-slate-400" />
              <span className="text-slate-900 font-semibold">Project Details</span>
            </div>

            <div className="flex items-center gap-3">
              {onSwitchToProgress && (
                <button
                  type="button"
                  onClick={onSwitchToProgress}
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Switch to Project Progress →</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsHeaderCollapsed(true)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-slate-600 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Collapse header & KPIs for maximum Excel view"
              >
                <ChevronUp className="size-3 text-slate-500" />
                <span>Collapse Header</span>
              </button>
            </div>
          </div>

          {/* Title Row with Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-[#0F2642] text-white flex items-center justify-center shadow-xs shrink-0">
                <FileSpreadsheet className="size-5 text-blue-200" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                  Project Details – Production Monitoring Sheet
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Company-wise Execution Plan, Status &amp; Progress | As on: 25-Sep-2026, 06:30 PM
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleUndo}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Undo last edit (Ctrl+Z)"
              >
                <Undo2 className="size-3.5 text-slate-600" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={() => showToast("Synchronized production telemetry & progress data.")}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RotateCw className="size-3.5 text-slate-600" />
                <span>Sync</span>
              </button>

              <label className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
                <Upload className="size-3.5 text-slate-600" />
                <span>Import (Excel)</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="size-3.5 text-slate-600" />
                <span>Export (Excel)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddProjectModal(true)}
                className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>Add Project</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHeaderCollapsed(true)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Collapse header & KPIs"
              >
                <ChevronUp className="size-4" />
              </button>
            </div>
          </div>

          {/* 2. SMALL COMPACT KPI ROW ON TOP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {/* Active Card - Compact */}
            <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 shadow-2xs">
              <div className="size-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Building2 className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block truncate">
                  Active
                </span>
                <span className="text-sm font-black text-slate-900 leading-none">{kpiStats.active}</span>
              </div>
            </div>

            {/* Inactive Card - Compact */}
            <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 shadow-2xs">
              <div className="size-7 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <PauseCircle className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block truncate">
                  Inactive
                </span>
                <span className="text-sm font-black text-slate-900 leading-none">{kpiStats.inactive}</span>
              </div>
            </div>

            {/* Completed Card - Compact */}
            <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 shadow-2xs">
              <div className="size-7 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block truncate">
                  Completed
                </span>
                <span className="text-sm font-black text-slate-900 leading-none">{kpiStats.completed}</span>
              </div>
            </div>

            {/* Total Projects Card - Compact */}
            <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-2.5 shadow-2xs">
              <div className="size-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Layers className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block truncate">
                  Total Projects
                </span>
                <span className="text-sm font-black text-slate-900 leading-none">{kpiStats.total}</span>
              </div>
            </div>

            {/* Overall Progress Card - Compact */}
            <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex flex-col justify-center shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Progress
                </span>
                <span className="text-xs font-black text-slate-900">{kpiStats.progress}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-1">
                <div style={{ width: kpiStats.progress }} className="h-full bg-[#16A34A] rounded-full" />
              </div>
              <div className="text-[9px] text-slate-400 flex items-center gap-1 truncate">
                <span>{kpiStats.active} Act</span>
                <span>• {kpiStats.inactive} Inact</span>
                <span>• {kpiStats.completed} Comp</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. UNIFIED ZERO-GAP TOOLBAR: COMPACT FILTERS & FORMULA BAR */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {/* ROW 1: COMPACT FILTERS BAR (Legends Removed, Active Projects Default, All Supervisors Listed) */}
        <div className="p-2 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left filter dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. All Companies Dropdown (Lists all companies present) */}
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="ALL">All Companies</option>
                {Array.from(new Set(projects.map((p) => p.company))).map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
              <Building2 className="size-3.5 text-slate-500 absolute left-2 top-1.5 pointer-events-none" />
            </div>

            {/* 2. Project Status Dropdown (Default: Active Projects, options for Inactive & Completed) */}
            <div className="relative">
              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value as any)}
                className="appearance-none pl-7 pr-6 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="ACTIVE">Active Projects</option>
                <option value="INACTIVE">Inactive Projects</option>
                <option value="COMPLETED">Completed Projects</option>
                <option value="ALL">All Projects</option>
              </select>
              <Folder className="size-3.5 text-slate-500 absolute left-2 top-1.5 pointer-events-none" />
            </div>

            {/* 3. Supervisor Dropdown (Default: All Supervisor, lists all assigned supervisors) */}
            <div className="relative">
              <select
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="ALL">All Supervisor</option>
                {allSupervisors.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
              <User className="size-3.5 text-slate-500 absolute left-2 top-1.5 pointer-events-none" />
            </div>

            {/* 4. Period Dropdown */}
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none pl-7 pr-6 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="ALL">All Period</option>
                <option value="sep-2026">Sep 2026</option>
                <option value="q3-2026">Q3 FY26-27</option>
              </select>
              <Calendar className="size-3.5 text-slate-500 absolute left-2 top-1.5 pointer-events-none" />
            </div>
          </div>

          {/* Right: Quick table scroll nudge buttons & visible counter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              {visibleProjects.length} visible
            </span>
            <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => scrollLeftBy(-250)}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollLeftBy(250)}
                className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: FORMULA BAR (Directly connected with zero gap) */}
        <div className="p-1.5 bg-slate-50/80 flex items-center gap-2 text-xs">
          {/* Cell Name Box */}
          <div className="w-14 px-2 py-0.5 bg-white border border-slate-300 rounded text-center font-mono font-bold text-slate-800 shadow-2xs">
            {cellAddress}
          </div>

          {/* Formula Icon */}
          <div className="text-slate-400 font-serif italic font-bold px-0.5 select-none text-[11px]">
            fx
          </div>

          {/* Formula Input */}
          <input
            type="text"
            value={formulaValue}
            onChange={(e) => {
              setFormulaValue(e.target.value);
              if (selectedCell) {
                setInlineValue(e.target.value);
                commitCellValue(selectedCell.rowIdx, selectedCell.colKey, e.target.value);
              }
            }}
            placeholder="Select any cell to type text or paste Google Drive / document link..."
            className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-0.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          />

          {/* Quick Toolbar Actions */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => insertRow(selectedCell ? selectedCell.rowIdx : rows.length - 1, "below", false)}
              className="px-2 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Insert row below active cell"
            >
              <PlusCircle className="size-3 text-emerald-600" />
              <span>+ Row</span>
            </button>

            <button
              type="button"
              onClick={() => insertRow(selectedCell ? selectedCell.rowIdx : rows.length - 1, "below", true)}
              className="px-2 py-0.5 bg-[#1E3A5F] hover:bg-[#152B46] text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Insert dark section banner"
            >
              <Layers className="size-3 text-blue-300" />
              <span>+ Section</span>
            </button>

            <button
              type="button"
              onClick={() => selectedCell && deleteRow(selectedCell.rowIdx)}
              className="px-2 py-0.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-700 rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Delete currently selected row"
            >
              <Trash2 className="size-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN PRODUCTION MONITORING MATRIX TABLE WITH PINNED COLUMNS */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden relative">
        <div
          ref={gridScrollRef}
          onScroll={handleGridScroll}
          className={`overflow-x-auto ${
            isHeaderCollapsed
              ? "max-h-[calc(100vh-175px)]"
              : "max-h-[calc(100vh-250px)]"
          } overflow-y-auto`}
        >
          <table className="w-full text-left border-collapse text-xs select-none table-fixed">
            {/* Table Header Row 1: Columns & Project Groups */}
            <thead className="sticky top-0 z-30 shadow-xs">
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                {/* PINNED COLUMN 1: # Header with resize handle */}
                <th
                  rowSpan={2}
                  style={{
                    width: `${colWidths.num || 45}px`,
                    left: 0,
                  }}
                  className="sticky left-0 z-40 py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-300 bg-slate-100"
                >
                  <span>#</span>
                  <div
                    onMouseDown={(e) => handleMouseDownResize("num", e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500"
                  />
                </th>

                {/* PINNED COLUMN 2: Process / Activity Header with resize handle and right-shadow border */}
                <th
                  rowSpan={2}
                  style={{
                    width: `${colWidths.activity || 260}px`,
                    left: `${colWidths.num || 45}px`,
                  }}
                  className="sticky z-40 py-2 px-3 font-bold text-slate-800 border-r-2 border-slate-300 bg-slate-100 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]"
                >
                  <span>Process / Activity</span>
                  <div
                    onMouseDown={(e) => handleMouseDownResize("activity", e)}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500"
                  />
                </th>

                {/* Project Columns with 2 Heading Options: Mark as Done & Assign Supervisor */}
                {visibleProjects.map((p) => {
                  const statusW = colWidths[`${p.id}_status`] || 80;
                  const remarkW = colWidths[`${p.id}_remark`] || 220;
                  const totalW = statusW + remarkW;

                  return (
                    <th
                      key={p.id}
                      colSpan={2}
                      style={{
                        backgroundColor: p.bgHeader,
                        color: p.textColor,
                        width: `${totalW}px`,
                      }}
                      className="py-1 px-3 text-center border-r border-slate-300 group/head relative"
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-extrabold uppercase text-[12px] tracking-wide leading-tight truncate">
                          {p.company}
                        </span>

                        {/* Heading Options */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Option 1: Status Change (Done / Inactive / Shift to Active) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkProjectDoneClick(p);
                            }}
                            className={`p-1 rounded shadow-2xs transition-all cursor-pointer flex items-center justify-center ${
                              p.status === "Completed"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                : p.status === "Inactive"
                                ? "bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                : "bg-white/85 hover:bg-white text-emerald-700 hover:text-emerald-800"
                            }`}
                            title={
                              p.status === "Completed"
                                ? "Completed (Click to shift to Active)"
                                : p.status === "Inactive"
                                ? "Inactive (Click to shift to Active)"
                                : "Mark as Done / Completed"
                            }
                          >
                            {p.status === "Completed" ? (
                              <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                            ) : p.status === "Inactive" ? (
                              <PauseCircle className="size-3.5 stroke-[2.5]" />
                            ) : (
                              <CheckCircle2 className="size-3.5 stroke-[2.2]" />
                            )}
                          </button>

                          {/* Arrow Button in Box for Details: Fabrication Details, Material List, Tools Required */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWorksheetsProject(p);
                            }}
                            className="p-1 rounded bg-white/85 hover:bg-white text-[#0F2642] hover:text-blue-700 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                            title="Open Detailed Worksheets: Fabrication Details, Material List, Tools Required"
                          >
                            <ArrowUpRight className="size-3.5 stroke-[2.5]" />
                          </button>

                          {/* Option 2: Person Icon to Assign Supervisor */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssignSupervisorModal(p);
                            }}
                            className="p-1 rounded bg-white/85 hover:bg-white text-slate-700 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
                            title={`Assign Supervisors (Current: ${p.supervisor})`}
                          >
                            <UserPlus className="size-3.5" />
                          </button>

                          {/* Edit Project Name */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProject(p);
                            }}
                            className="opacity-40 group-hover/head:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity cursor-pointer"
                            title="Edit Company / Project Name"
                          >
                            <Edit2 className="size-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-medium opacity-90 truncate max-w-[240px] mx-auto">
                        <span className="truncate">{p.jobName}</span>
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded bg-black/10 font-bold ml-1 shrink-0 truncate max-w-[140px]"
                          title={`${p.status} • Supervisors: ${p.supervisor}`}
                        >
                          {p.status} • {p.supervisor}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Table Header Row 2: Status & Remark Sub-headers */}
              <tr className="border-b border-slate-300 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {visibleProjects.map((p) => (
                  <React.Fragment key={`${p.id}_sub`}>
                    {/* Status Sub-header with resize handle */}
                    <th
                      style={{
                        backgroundColor: p.bgHeader,
                        color: p.textColor,
                        width: `${colWidths[`${p.id}_status`] || 80}px`,
                      }}
                      className="py-1 px-2 text-center border-r border-slate-300 opacity-95 text-[10px] relative"
                    >
                      <span>Status</span>
                      <div
                        onMouseDown={(e) => handleMouseDownResize(`${p.id}_status`, e)}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500"
                      />
                    </th>

                    {/* Remark Sub-header with resize handle */}
                    <th
                      style={{
                        backgroundColor: p.bgHeader,
                        color: p.textColor,
                        width: `${colWidths[`${p.id}_remark`] || 220}px`,
                      }}
                      className="py-1 px-3 text-center border-r border-slate-300 opacity-95 text-[10px] relative"
                    >
                      <span>Remark</span>
                      <div
                        onMouseDown={(e) => handleMouseDownResize(`${p.id}_remark`, e)}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500"
                      />
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            {/* Table Body: Fully Editable Rows with Pinned Left Columns */}
            <tbody className="divide-y divide-slate-200 font-sans">
              {rows.map((row, rowIdx) => {
                const isSelectedRow = selectedCell?.rowIdx === rowIdx;

                // BLUE SUBHEADING / SECTION ROWS (ALL COLUMNS EDITABLE)
                if (row.isSectionHeader) {
                  const isActivitySelected = isSelectedRow && selectedCell?.colKey === "activity";
                  const isEditingActivity = editingCell?.rowIdx === rowIdx && editingCell?.colKey === "activity";

                  return (
                    <tr
                      key={row.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, rowIdx });
                      }}
                      className="bg-[#1E3A5F] text-white font-bold text-xs uppercase tracking-wider group/sec"
                    >
                      {/* PINNED # Section Number Cell */}
                      <td
                        style={{
                          left: 0,
                          width: `${colWidths.num || 45}px`,
                        }}
                        onClick={() => setSelectedCell({ rowIdx, colKey: "num" })}
                        onDoubleClick={() => startEditing(rowIdx, "num")}
                        className={`sticky z-20 py-2 px-2 text-center font-bold text-white border-r border-[#152A45] bg-[#1E3A5F] ${
                          isSelectedRow && selectedCell?.colKey === "num"
                            ? "ring-2 ring-emerald-400 bg-[#25466F]"
                            : ""
                        }`}
                      >
                        {editingCell?.rowIdx === rowIdx && editingCell?.colKey === "num" ? (
                          <input
                            autoFocus
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onBlur={() => commitCellValue(rowIdx, "num", inlineValue)}
                            className="w-full bg-slate-900 text-white text-center rounded px-1 py-0.5 outline-none font-bold"
                          />
                        ) : (
                          row.rowNum
                        )}
                      </td>

                      {/* PINNED EDITABLE Section Title Cell */}
                      <td
                        style={{
                          left: `${colWidths.num || 45}px`,
                          width: `${colWidths.activity || 260}px`,
                        }}
                        onClick={() => setSelectedCell({ rowIdx, colKey: "activity" })}
                        onDoubleClick={() => startEditing(rowIdx, "activity")}
                        className={`sticky z-20 py-2 px-3 text-white font-extrabold border-r-2 border-[#152A45] bg-[#1E3A5F] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.2)] relative cursor-text ${
                          isActivitySelected ? "ring-2 ring-emerald-400 bg-[#25466F]" : ""
                        }`}
                      >
                        {isEditingActivity ? (
                          <input
                            autoFocus
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onBlur={() => commitCellValue(rowIdx, "activity", inlineValue)}
                            className="w-full bg-slate-900 text-white rounded px-2 py-0.5 outline-none font-extrabold"
                          />
                        ) : (
                          <div className="flex items-center justify-between pr-4">
                            <span className="truncate">{row.activityName}</span>
                            <Edit2 className="size-3 text-blue-300/70 opacity-0 group-hover/sec:opacity-100 shrink-0" />
                          </div>
                        )}

                        {/* Audit Info Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAuditInfo({
                              x: e.clientX,
                              y: e.clientY,
                              title: `Section: ${row.activityName}`,
                              audit: row.activityAudit || DEFAULT_AUDIT,
                            });
                          }}
                          className="absolute right-1 bottom-1 text-white/50 hover:text-white p-0.5 rounded cursor-pointer"
                          title="View audit trail"
                        >
                          <Info className="size-3" />
                        </button>
                      </td>

                      {/* ALL PROJECT COLUMNS IN BLUE ROWS ARE FULLY EDITABLE */}
                      {visibleProjects.map((p) => {
                        const cell = row.cells[p.id];
                        const dateVal = cell?.sectionDate || "";
                        const remarkVal = cell?.remark || "";
                        const statusColKey = `${p.id}_status`;
                        const remarkColKey = `${p.id}_remark`;

                        const isDateSelected = isSelectedRow && selectedCell?.colKey === statusColKey;
                        const isRemarkSelected = isSelectedRow && selectedCell?.colKey === remarkColKey;

                        const isEditingDate = editingCell?.rowIdx === rowIdx && editingCell?.colKey === statusColKey;
                        const isEditingRemark = editingCell?.rowIdx === rowIdx && editingCell?.colKey === remarkColKey;

                        const extracted = extractUrl(remarkVal);

                        return (
                          <React.Fragment key={`${row.id}_${p.id}_sec`}>
                            {/* Blue Row Status Column: Editable Date Field */}
                            <td
                              onClick={() => setSelectedCell({ rowIdx, colKey: statusColKey })}
                              onDoubleClick={() => startEditing(rowIdx, statusColKey)}
                              className={`py-2 px-2 text-center border-r border-[#152A45] bg-[#1E3A5F] text-blue-200 font-semibold text-xs cursor-text relative ${
                                isDateSelected ? "ring-2 ring-emerald-400 bg-[#25466F]" : ""
                              }`}
                              title="Double-click to type milestone date"
                            >
                              {isEditingDate ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={inlineValue}
                                  onChange={(e) => setInlineValue(e.target.value)}
                                  onBlur={() => commitCellValue(rowIdx, statusColKey, inlineValue)}
                                  placeholder="DD-Mon-YYYY"
                                  className="w-full bg-slate-900 text-emerald-300 text-center rounded px-1 py-0.5 outline-none font-bold text-xs"
                                />
                              ) : (
                                <span className="block truncate text-[11px] font-mono">
                                  {dateVal || "-"}
                                </span>
                              )}

                              {/* Audit Info Icon */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAuditInfo({
                                    x: e.clientX,
                                    y: e.clientY,
                                    title: `${p.company} Date (Section: ${row.activityName})`,
                                    audit: cell?.audit || DEFAULT_AUDIT,
                                  });
                                }}
                                className="absolute right-0.5 bottom-0.5 text-white/40 hover:text-white p-0.5 rounded cursor-pointer opacity-40 hover:opacity-100"
                                title="View audit trail"
                              >
                                <Info className="size-2" />
                              </button>
                            </td>

                            {/* Blue Row Remark Column: Editable Note / Drive Link */}
                            <td
                              onClick={() => setSelectedCell({ rowIdx, colKey: remarkColKey })}
                              onDoubleClick={() => startEditing(rowIdx, remarkColKey)}
                              className={`py-2 px-3 border-r border-[#152A45] bg-[#1E3A5F] text-slate-200 font-normal text-xs cursor-text relative ${
                                isRemarkSelected ? "ring-2 ring-emerald-400 bg-[#25466F]" : ""
                              }`}
                              title="Double-click to edit note or link"
                            >
                              {isEditingRemark ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={inlineValue}
                                  onChange={(e) => setInlineValue(e.target.value)}
                                  onBlur={() => commitCellValue(rowIdx, remarkColKey, inlineValue)}
                                  className="w-full bg-slate-900 text-white rounded px-2 py-0.5 outline-none text-xs"
                                />
                              ) : extracted.hasUrl ? (
                                <div className="flex items-center gap-1.5 min-w-0 pr-3">
                                  <a
                                    href={extracted.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-900/80 border border-blue-400/50 text-blue-200 hover:bg-blue-800 font-semibold text-[11px] shadow-2xs group/link"
                                    title={`Open drive report: ${extracted.url}`}
                                  >
                                    <FileText className="size-3 text-cyan-300 shrink-0" />
                                    <span className="truncate max-w-[140px]">{extracted.label}</span>
                                    <ExternalLink className="size-2.5 opacity-70 group-hover/link:opacity-100 shrink-0" />
                                  </a>
                                </div>
                              ) : (
                                <span className="block truncate pr-3 text-[11px] text-slate-300">
                                  {remarkVal || "-"}
                                </span>
                              )}

                              {/* Audit Info Icon */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAuditInfo({
                                    x: e.clientX,
                                    y: e.clientY,
                                    title: `${p.company} Section Remark`,
                                    audit: cell?.audit || DEFAULT_AUDIT,
                                  });
                                }}
                                className="absolute right-1 bottom-1 text-white/40 hover:text-white p-0.5 rounded cursor-pointer opacity-40 hover:opacity-100"
                                title="View audit trail"
                              >
                                <Info className="size-2.5" />
                              </button>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                }

                // REGULAR DATA ROWS
                return (
                  <tr
                    key={row.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, rowIdx });
                    }}
                    className="hover:bg-slate-50/80 transition-colors bg-white group/row"
                  >
                    {/* PINNED COLUMN 1: # Column Cell */}
                    <td
                      style={{
                        left: 0,
                        width: `${colWidths.num || 45}px`,
                      }}
                      onClick={() => setSelectedCell({ rowIdx, colKey: "num" })}
                      onDoubleClick={() => startEditing(rowIdx, "num")}
                      className={`sticky z-10 py-1.5 px-2 text-center font-semibold text-slate-700 border-r border-slate-200 bg-white group-hover/row:bg-slate-50 cursor-pointer ${
                        isSelectedRow && selectedCell?.colKey === "num"
                          ? "ring-2 ring-emerald-600 bg-emerald-50/70"
                          : ""
                      }`}
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.colKey === "num" ? (
                        <input
                          autoFocus
                          type="text"
                          value={inlineValue}
                          onChange={(e) => setInlineValue(e.target.value)}
                          onBlur={() => commitCellValue(rowIdx, "num", inlineValue)}
                          className="w-full bg-white text-center rounded border border-emerald-500 px-1 py-0.5 outline-none font-bold"
                        />
                      ) : (
                        row.rowNum
                      )}
                    </td>

                    {/* PINNED COLUMN 2: Process / Activity Column Cell */}
                    <td
                      style={{
                        left: `${colWidths.num || 45}px`,
                        width: `${colWidths.activity || 260}px`,
                      }}
                      onClick={() => setSelectedCell({ rowIdx, colKey: "activity" })}
                      onDoubleClick={() => startEditing(rowIdx, "activity")}
                      className={`sticky z-10 py-1.5 px-3 font-semibold text-slate-800 border-r-2 border-slate-300 bg-white group-hover/row:bg-slate-50 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] relative cursor-pointer ${
                        isSelectedRow && selectedCell?.colKey === "activity"
                          ? "ring-2 ring-emerald-600 bg-emerald-50/70"
                          : ""
                      }`}
                    >
                      {editingCell?.rowIdx === rowIdx && editingCell?.colKey === "activity" ? (
                        <input
                          autoFocus
                          type="text"
                          value={inlineValue}
                          onChange={(e) => setInlineValue(e.target.value)}
                          onBlur={() => commitCellValue(rowIdx, "activity", inlineValue)}
                          className="w-full bg-white text-slate-900 rounded border border-emerald-500 px-2 py-0.5 outline-none font-semibold"
                        />
                      ) : (
                        <span className="block truncate pr-3">{row.activityName}</span>
                      )}

                      {/* Audit Info Icon in Bottom Right */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAuditInfo({
                            x: e.clientX,
                            y: e.clientY,
                            title: `Row #${row.rowNum}: ${row.activityName}`,
                            audit: row.activityAudit || DEFAULT_AUDIT,
                          });
                        }}
                        className="absolute right-1 bottom-1 text-slate-400 hover:text-slate-800 p-0.5 rounded cursor-pointer opacity-30 group-hover/row:opacity-100"
                        title="View audit trail"
                      >
                        <Info className="size-2.5" />
                      </button>
                    </td>

                    {/* Dynamic Project Column Cells */}
                    {visibleProjects.map((p) => {
                      const cell = row.cells[p.id];
                      const cellStatus = cell?.status || "not_updated";
                      const cellRemark = cell?.remark || "-";
                      const statusColKey = `${p.id}_status`;
                      const remarkColKey = `${p.id}_remark`;

                      const isStatusSelected = isSelectedRow && selectedCell?.colKey === statusColKey;
                      const isRemarkSelected = isSelectedRow && selectedCell?.colKey === remarkColKey;

                      const isEditingRemark = editingCell?.rowIdx === rowIdx && editingCell?.colKey === remarkColKey;

                      const extracted = extractUrl(cellRemark);

                      return (
                        <React.Fragment key={`${row.id}_${p.id}`}>
                          {/* Status Cell - The 4 Exact Badges (Green, Yellow, Red, Blank) */}
                          <td
                            onClick={(e) => {
                              setSelectedCell({ rowIdx, colKey: statusColKey });
                              const rect = e.currentTarget.getBoundingClientRect();
                              setStatusPicker({
                                rowIdx,
                                projId: p.id,
                                x: rect.left,
                                y: rect.bottom + 4,
                              });
                            }}
                            className={`py-1.5 px-2 text-center border-r border-slate-200 align-middle cursor-pointer relative ${
                              isStatusSelected ? "ring-2 ring-emerald-600 bg-emerald-50/70 z-10" : ""
                            }`}
                            title="Click to select status: Done, Pending, Not Done, Blank"
                          >
                            {renderStatusBadge(cellStatus)}

                            {/* Audit Info Icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAuditInfo({
                                  x: e.clientX,
                                  y: e.clientY,
                                  title: `${p.company} Status (Row #${row.rowNum})`,
                                  audit: cell?.audit || DEFAULT_AUDIT,
                                });
                              }}
                              className="absolute right-0.5 bottom-0.5 text-slate-400 hover:text-slate-800 p-0.5 rounded cursor-pointer opacity-30 hover:opacity-100"
                              title="View audit trail"
                            >
                              <Info className="size-2" />
                            </button>
                          </td>

                          {/* Remark Cell (With Drive / Document Link Detection) */}
                          <td
                            onClick={() => setSelectedCell({ rowIdx, colKey: remarkColKey })}
                            onDoubleClick={() => startEditing(rowIdx, remarkColKey)}
                            className={`py-1.5 px-3 border-r border-slate-200 text-slate-700 text-[11px] align-middle cursor-pointer relative ${
                              isRemarkSelected ? "ring-2 ring-emerald-600 bg-emerald-50/70 z-10" : ""
                            }`}
                            title="Double-click or edit formula bar to paste Drive / Document link"
                          >
                            {isEditingRemark ? (
                              <input
                                autoFocus
                                type="text"
                                value={inlineValue}
                                onChange={(e) => setInlineValue(e.target.value)}
                                onBlur={() => commitCellValue(rowIdx, remarkColKey, inlineValue)}
                                className="w-full bg-white text-slate-900 rounded border border-emerald-500 px-2 py-0.5 outline-none font-normal text-xs"
                              />
                            ) : extracted.hasUrl ? (
                              <div className="flex items-center gap-1.5 min-w-0 pr-3">
                                <a
                                  href={extracted.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] shadow-2xs group/link"
                                  title={`Open document: ${extracted.url}`}
                                >
                                  <FileText className="size-3 text-blue-600 shrink-0" />
                                  <span className="truncate max-w-[130px]">{extracted.label}</span>
                                  <ExternalLink className="size-2.5 opacity-70 group-hover/link:opacity-100 shrink-0" />
                                </a>
                              </div>
                            ) : (
                              <span
                                className={`block truncate pr-3 ${
                                  cellRemark === "-" ? "text-slate-400" : "text-slate-800 font-medium"
                                }`}
                              >
                                {cellRemark}
                              </span>
                            )}

                            {/* Audit Info Icon */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAuditInfo({
                                  x: e.clientX,
                                  y: e.clientY,
                                  title: `${p.company} Remark (Row #${row.rowNum})`,
                                  audit: cell?.audit || DEFAULT_AUDIT,
                                });
                              }}
                              className="absolute right-1 bottom-1 text-slate-400 hover:text-slate-800 p-0.5 rounded cursor-pointer opacity-30 hover:opacity-100"
                              title="View audit trail"
                            >
                              <Info className="size-2.5" />
                            </button>
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>



      {/* ================================================================= */}
      {/* QUICK STATUS PICKER (4 Exact Badges: Green, Yellow, Red, Blank) */}
      {/* ================================================================= */}
      {statusPicker && (
        <div
          style={{ top: statusPicker.y, left: statusPicker.x }}
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Green (Done) */}
          <button
            type="button"
            onClick={() => setQuickStatus(statusPicker.rowIdx, statusPicker.projId, "done")}
            className="size-7 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center shadow-xs cursor-pointer"
            title="Done (Green)"
          >
            <Check className="size-4 stroke-[3]" />
          </button>

          {/* 2. Yellow (Pending) */}
          <button
            type="button"
            onClick={() => setQuickStatus(statusPicker.rowIdx, statusPicker.projId, "pending")}
            className="size-7 rounded-lg bg-[#EAB308] hover:bg-[#CA8A04] text-white flex items-center justify-center shadow-xs cursor-pointer"
            title="Pending (Yellow)"
          >
            <span className="font-bold text-base leading-none">−</span>
          </button>

          {/* 3. Red (Not Done) */}
          <button
            type="button"
            onClick={() => setQuickStatus(statusPicker.rowIdx, statusPicker.projId, "not_done")}
            className="size-7 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center shadow-xs cursor-pointer"
            title="Not Done (Red)"
          >
            <X className="size-4 stroke-[3]" />
          </button>

          {/* 4. Blank (Not Updated) */}
          <button
            type="button"
            onClick={() => setQuickStatus(statusPicker.rowIdx, statusPicker.projId, "not_updated")}
            className="size-7 rounded-lg border-2 border-slate-300 hover:border-slate-500 bg-white flex items-center justify-center cursor-pointer"
            title="Not Updated (Blank)"
          />

          <button
            type="button"
            onClick={() => setStatusPicker(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded ml-1"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* AUDIT INFO POPOVER (Who changed it last & at what time) */}
      {/* ================================================================= */}
      {activeAuditInfo && (
        <div
          style={{
            top: Math.min(typeof window !== "undefined" ? window.innerHeight - 150 : 300, activeAuditInfo.y - 40),
            left: Math.min(typeof window !== "undefined" ? window.innerWidth - 260 : 300, activeAuditInfo.x + 10),
          }}
          className="fixed z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-3 w-64 text-xs space-y-2 border border-slate-800 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-300 uppercase tracking-wide text-[10px]">
              Cell Audit Trail
            </span>
            <button
              type="button"
              onClick={() => setActiveAuditInfo(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="size-3" />
            </button>
          </div>

          <p className="font-semibold text-slate-100 text-[11px] truncate">
            {activeAuditInfo.title}
          </p>

          <div className="space-y-1 bg-slate-800/80 p-2 rounded-lg text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <User className="size-3 shrink-0" />
              <span className="truncate">By: {activeAuditInfo.audit.updatedBy}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="size-3 shrink-0" />
              <span>Time: {activeAuditInfo.audit.updatedAt}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* CONTEXT MENU (Right Click on Rows) */}
      {/* ================================================================= */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-1.5 w-48 text-xs font-semibold space-y-1 animate-in fade-in duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => insertRow(contextMenu.rowIdx, "above", false)}
            className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <ArrowUp className="size-3.5 text-emerald-600" />
            <span>Insert Row Above</span>
          </button>

          <button
            type="button"
            onClick={() => insertRow(contextMenu.rowIdx, "below", false)}
            className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <ArrowDown className="size-3.5 text-emerald-600" />
            <span>Insert Row Below</span>
          </button>

          <button
            type="button"
            onClick={() => insertRow(contextMenu.rowIdx, "below", true)}
            className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 flex items-center gap-2 cursor-pointer text-[#1E3A5F]"
          >
            <Layers className="size-3.5 text-blue-600" />
            <span>Insert Section Banner</span>
          </button>

          <div className="border-t border-slate-100 my-1" />

          <button
            type="button"
            onClick={() => deleteRow(contextMenu.rowIdx)}
            className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-rose-50 flex items-center gap-2 cursor-pointer text-rose-600"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Row</span>
          </button>

          <button
            type="button"
            onClick={() => setContextMenu(null)}
            className="w-full text-left px-2.5 py-1 rounded-md text-slate-400 hover:bg-slate-100 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: EDIT COMPANY & PROJECT HEADING (Multi-Supervisor) */}
      {/* ================================================================= */}
      {editingProject && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4 select-text"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setEditingProject(null);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          onCopy={(e) => e.stopPropagation()}
        >
          <form
            onSubmit={saveEditProject}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-text"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Edit Project Column
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editCompanyInput}
                  onChange={(e) => setEditCompanyInput(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="e.g. KFAB INFRA"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold uppercase select-text"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Project / Job Name</label>
                <input
                  type="text"
                  required
                  value={editJobInput}
                  onChange={(e) => setEditJobInput(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="e.g. Plant Structure Extension"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium select-text"
                />
              </div>

              {/* Multi-Supervisor Assignment for Edit Modal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Assigned Supervisors (Multiple Allowed)</label>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {editSupervisors.length} assigned
                  </span>
                </div>

                {editSupervisors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 p-1.5 bg-blue-50/50 border border-blue-200/60 rounded-lg">
                    {editSupervisors.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-semibold"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => toggleEditSupervisor(s)}
                          className="hover:text-rose-200 cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                  {allSupervisors.map((sup) => {
                    const isChecked = editSupervisors.includes(sup);
                    return (
                      <label
                        key={sup}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
                          isChecked ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditSupervisor(sup)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="truncate">{sup}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    placeholder="Or type new supervisor name..."
                    value={editCustomSupInput}
                    onChange={(e) => setEditCustomSupInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEditCustomSupervisor();
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 select-text"
                  />
                  <button
                    type="button"
                    onClick={addEditCustomSupervisor}
                    disabled={!editCustomSupInput.trim()}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Header Background Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Green", bg: "#D6F5DE" },
                    { label: "Amber", bg: "#FDE6CE" },
                    { label: "Blue", bg: "#DCEAF7" },
                    { label: "Purple", bg: "#EDE9FE" },
                  ].map((color) => (
                    <button
                      key={color.bg}
                      type="button"
                      style={{ backgroundColor: color.bg }}
                      onClick={() => setEditColorInput(color.bg)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        editColorInput === color.bg ? "ring-2 ring-slate-900" : "opacity-90"
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => deleteProject(editingProject.id)}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Column</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Heading
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: ADD PROJECT COLUMN (Multi-Supervisor Support) */}
      {/* ================================================================= */}
      {showAddProjectModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4 select-text"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setShowAddProjectModal(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          onCopy={(e) => e.stopPropagation()}
        >
          <form
            onSubmit={handleAddProject}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-text"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-[#EA580C]" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Add New Project Column
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                <input
                  autoFocus
                  type="text"
                  required
                  placeholder="e.g. KFAB SOLAR / TATA STEEL"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold uppercase select-text"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Project / Job Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Gantry Girder 40T"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 select-text"
                />
              </div>

              {/* Multi-Supervisor Assignment for New Project */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Assigned Supervisors (Multiple Allowed)</label>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {newSupervisors.length} selected
                  </span>
                </div>

                {newSupervisors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 p-1.5 bg-blue-50/50 border border-blue-200/60 rounded-lg">
                    {newSupervisors.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-semibold"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => toggleNewSupervisor(s)}
                          className="hover:text-rose-200 cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white">
                  {allSupervisors.map((sup) => {
                    const isChecked = newSupervisors.includes(sup);
                    return (
                      <label
                        key={sup}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
                          isChecked ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleNewSupervisor(sup)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="truncate">{sup}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    placeholder="Or type new supervisor name..."
                    value={newCustomSupInput}
                    onChange={(e) => setNewCustomSupInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNewCustomSupervisor();
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 select-text"
                  />
                  <button
                    type="button"
                    onClick={addNewCustomSupervisor}
                    disabled={!newCustomSupInput.trim()}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Header Tint Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "emerald", label: "Green", bg: "bg-[#D6F5DE] border-emerald-400 text-emerald-950" },
                    { id: "amber", label: "Amber", bg: "bg-[#FDE6CE] border-amber-400 text-amber-950" },
                    { id: "blue", label: "Blue", bg: "bg-[#DCEAF7] border-blue-400 text-blue-950" },
                    { id: "purple", label: "Purple", bg: "bg-[#EDE9FE] border-purple-400 text-purple-950" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewColorTheme(t.id as any)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${t.bg} ${
                        newColorTheme === t.id ? "ring-2 ring-slate-900" : "opacity-80"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg shadow-xs cursor-pointer"
              >
                Add Project to Sheet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: INCOMPLETE TASKS CONFIRMATION DIALOG */}
      {/* ================================================================= */}
      {incompleteModalProject && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4 select-text"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setIncompleteModalProject(null);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          onCopy={(e) => e.stopPropagation()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-text"
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  All Tasks Are Not Completed
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {incompleteModalProject.company} – {incompleteModalProject.jobName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIncompleteModalProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 border border-amber-200/60 rounded-lg p-3">
              Not all status boxes for <strong>{incompleteModalProject.company}</strong> are marked as green (Done). Do you want to put this project as <strong>Inactive</strong> instead?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIncompleteModalProject(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setProjects((prev) =>
                    prev.map((item) =>
                      item.id === incompleteModalProject.id ? { ...item, status: "Completed" } : item
                    )
                  );
                  showToast(`${incompleteModalProject.company} marked as Completed.`);
                  setIncompleteModalProject(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Mark Done Anyway
              </button>
              <button
                type="button"
                onClick={() => {
                  setProjects((prev) =>
                    prev.map((item) =>
                      item.id === incompleteModalProject.id ? { ...item, status: "Inactive" } : item
                    )
                  );
                  showToast(`${incompleteModalProject.company} put into Inactive.`);
                  setIncompleteModalProject(null);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <PauseCircle className="size-3.5" />
                <span>Put as Inactive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3B: SHIFT TO ACTIVE CONFIRMATION DIALOG */}
      {/* ================================================================= */}
      {activateModalProject && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4 select-text"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setActivateModalProject(null);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          onCopy={(e) => e.stopPropagation()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-text"
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Shift Project to Active?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {activateModalProject.company} – {activateModalProject.jobName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivateModalProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3">
              This project is currently marked as <strong className="uppercase text-slate-800">{activateModalProject.status}</strong>. Do you want to shift it to <strong>Active</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActivateModalProject(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setProjects((prev) =>
                    prev.map((item) =>
                      item.id === activateModalProject.id ? { ...item, status: "Active" } : item
                    )
                  );
                  showToast(`${activateModalProject.company} shifted to Active.`);
                  setActivateModalProject(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="size-3.5 stroke-[2.5]" />
                <span>Shift to Active</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: ASSIGN SUPERVISOR MODAL (Multi-Supervisor Support) */}
      {/* ================================================================= */}
      {assignSupervisorModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4 select-text"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setAssignSupervisorModal(null);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          onCopy={(e) => e.stopPropagation()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-text"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Assign Supervisors
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setAssignSupervisorModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Company / Project</span>
                <span className="font-bold text-slate-900 block truncate">{assignSupervisorModal.company}</span>
                <span className="text-slate-600 block text-[11px] truncate">{assignSupervisorModal.jobName}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Selected Supervisors</label>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {assignedSupervisorsList.length} assigned
                  </span>
                </div>

                {assignedSupervisorsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-2 p-1.5 bg-blue-50/50 border border-blue-200/60 rounded-lg">
                    {assignedSupervisorsList.map((sup) => (
                      <span
                        key={sup}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-semibold"
                      >
                        <span>{sup}</span>
                        <button
                          type="button"
                          onClick={() => toggleSupervisorAssignment(sup)}
                          className="hover:text-rose-200 cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-600 italic mb-2">No supervisors assigned yet. Check options below.</p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Check to Assign / Unassign</label>
                <div className="space-y-1 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-1 bg-white">
                  {allSupervisors.map((sup) => {
                    const isChecked = assignedSupervisorsList.includes(sup);
                    return (
                      <label
                        key={sup}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                          isChecked
                            ? "bg-blue-50 text-blue-800 font-bold border border-blue-200"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSupervisorAssignment(sup)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="truncate">{sup}</span>
                        </div>
                        {isChecked && <Check className="size-3.5 text-blue-600 shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Or Add Custom Supervisor</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customSupervisorInput}
                    onChange={(e) => setCustomSupervisorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSupervisorToAssignment(customSupervisorInput);
                      }
                    }}
                    placeholder="e.g. Ramesh Gaikwad"
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 select-text"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomSupervisorToAssignment(customSupervisorInput)}
                    disabled={!customSupervisorInput.trim()}
                    className="px-3 py-1.5 bg-[#0F2642] hover:bg-[#153457] text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignSupervisorModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignedSupervisors}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="size-3.5" />
                <span>Save Supervisors</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 5: DETAILED WORKSHEETS (Fabrication, Material, Tools) */}
      {/* ================================================================= */}
      {worksheetsProject && (
        <ProjectDetailSheetsModal
          project={worksheetsProject}
          onClose={() => setWorksheetsProject(null)}
        />
      )}
    </div>
  );
}
