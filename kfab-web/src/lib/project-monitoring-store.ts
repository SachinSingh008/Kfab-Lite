"use client";

// Shared store and telemetry calculations for Project Details Monitoring Sheet & Project Progress Tab

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
  supervisor: string; // Comma-separated supervisor string (e.g. "Sachin Singh, Ramesh Sharma")
  supervisors?: string[]; // Array of assigned supervisors
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

export const DEFAULT_AUDIT: CellAudit = {
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
    const defaultLabel = isDrive ? "Drive Document" : "Open Document";
    const remainingText = text.replace(url, "").trim();
    return {
      hasUrl: true,
      url,
      label: remainingText || defaultLabel,
    };
  }
  return { hasUrl: false, url: "", label: text };
}

export const INITIAL_PROJECTS: ProjectCol[] = [
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

export const INITIAL_ROWS: SheetRowItem[] = [
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
      p3: { status: "done", remark: "List under verification", audit: DEFAULT_AUDIT },
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
      p1: { status: "not_updated", sectionDate: "05-Sep-2026", remark: "Steel Inward Gate MIDC", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "08-Sep-2026", remark: "Raw Material Plates", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "10-Sep-2026", remark: "Rolled Sections Gate 2", audit: DEFAULT_AUDIT },
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
      p3: { status: "done", remark: "Awaiting challan", audit: DEFAULT_AUDIT },
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
      p1: { status: "not_updated", sectionDate: "15-Sep-2026", remark: "Bay 1 Main Gantry", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "16-Sep-2026", remark: "Cutting Bed 3", audit: DEFAULT_AUDIT },
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
      p3: { status: "not_updated", remark: "Timeline to be revised", audit: DEFAULT_AUDIT },
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
      p1: { status: "not_updated", sectionDate: "18-Sep-2026", remark: "https://drive.google.com/drive/folders/qa-reports QA Dossier", audit: DEFAULT_AUDIT },
      p2: { status: "not_updated", sectionDate: "18-Sep-2026", remark: "QC Portal Synchronized", audit: DEFAULT_AUDIT },
      p3: { status: "not_updated", sectionDate: "20-Sep-2026", remark: "Material Lab Dossier", audit: DEFAULT_AUDIT },
    },
  },
  {
    id: "r16",
    rowNum: 16,
    activityName: "Inspection Report",
    activityAudit: DEFAULT_AUDIT,
    cells: {
      p1: { status: "done", remark: "IR-001 submitted", audit: DEFAULT_AUDIT },
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
      p1: { status: "pending", remark: "https://drive.google.com/file/d/tc-26362/view TC-26362-01 ready", audit: DEFAULT_AUDIT },
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
      p1: { status: "done", remark: "Not required", audit: DEFAULT_AUDIT },
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

// LocalStorage helpers to keep Project Details and Progress 100% in sync
const STORAGE_PROJECTS_KEY = "kfab_monitoring_projects_v2";
const STORAGE_ROWS_KEY = "kfab_monitoring_rows_v2";

export function getStoredMonitoringProjects(): ProjectCol[] {
  if (typeof window === "undefined") return INITIAL_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (!raw) return INITIAL_PROJECTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.error("Failed to read stored monitoring projects", err);
  }
  return INITIAL_PROJECTS;
}

export function saveStoredMonitoringProjects(projects: ProjectCol[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("kfab_monitoring_sheet_updated"));
  } catch (err) {
    console.error("Failed to save monitoring projects", err);
  }
}

export function getStoredMonitoringRows(): SheetRowItem[] {
  if (typeof window === "undefined") return INITIAL_ROWS;
  try {
    const raw = localStorage.getItem(STORAGE_ROWS_KEY);
    if (!raw) return INITIAL_ROWS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.error("Failed to read stored monitoring rows", err);
  }
  return INITIAL_ROWS;
}

export function saveStoredMonitoringRows(rows: SheetRowItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_ROWS_KEY, JSON.stringify(rows));
    window.dispatchEvent(new Event("kfab_monitoring_sheet_updated"));
  } catch (err) {
    console.error("Failed to save monitoring rows", err);
  }
}

export interface StageProgressItem {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  targetDate: string;
  status: "done" | "in_progress" | "pending";
}

export interface ProductionTelemetryMetrics {
  targetCompany: string;
  targetJobName: string;
  targetSupervisor: string;
  isSpecificJob: boolean;
  totalProjects: number;
  activeProjectsCount: number;
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  delayedActivities: number;
  notUpdatedActivities: number;
  overallProgressPercent: number;
  efficiencyVariance: number;
  stages: StageProgressItem[];
  timelineCurve: Array<{
    stage: string;
    planned: number;
    actual: number;
    date: string;
  }>;
  milestones: Array<{
    id: string;
    activity: string;
    stage: string;
    company: string;
    remark: string;
    date: string;
    status: CellStatusType;
  }>;
  bottlenecks: Array<{
    id: string;
    activity: string;
    stage: string;
    company: string;
    remark: string;
    supervisor: string;
    status: CellStatusType;
  }>;
  documents: Array<{
    title: string;
    url: string;
    company: string;
    activity: string;
  }>;
}

// Compute production telemetry and progress curves strictly from Project Details Sheet rows
export function calculateProductionMetrics(
  projects: ProjectCol[],
  rows: SheetRowItem[],
  selectedCompany: string,
  selectedJobId: string
): ProductionTelemetryMetrics {
  // Determine target projects
  let targetProjects = projects.filter((p) => p.status === "Active");
  if (selectedCompany !== "ALL") {
    targetProjects = targetProjects.filter((p) => p.company === selectedCompany);
  }
  if (selectedJobId !== "ALL") {
    targetProjects = projects.filter((p) => p.id === selectedJobId);
  }

  // If no matching projects found, fallback to all active
  if (targetProjects.length === 0) {
    targetProjects = projects.filter((p) => p.status === "Active");
    if (targetProjects.length === 0) targetProjects = projects;
  }

  const isSpecificJob = selectedJobId !== "ALL" && targetProjects.length === 1;
  const targetCompany = isSpecificJob ? targetProjects[0].company : selectedCompany === "ALL" ? "All Active Companies" : selectedCompany;
  const targetJobName = isSpecificJob ? targetProjects[0].jobName : "All Active Projects";
  const targetSupervisor = isSpecificJob ? targetProjects[0].supervisor : "Multiple Supervisors";

  // Scan production stages and activities
  const stages: StageProgressItem[] = [];
  let currentStage: StageProgressItem | null = null;
  let currentStageName = "JOB INITIATION";

  let totalActivities = 0;
  let completedActivities = 0;
  let pendingActivities = 0;
  let delayedActivities = 0;
  let notUpdatedActivities = 0;

  const milestones: ProductionTelemetryMetrics["milestones"] = [];
  const bottlenecks: ProductionTelemetryMetrics["bottlenecks"] = [];
  const documents: ProductionTelemetryMetrics["documents"] = [];

  rows.forEach((row) => {
    if (row.isSectionHeader) {
      if (currentStage) {
        currentStage.progressPercent =
          currentStage.totalTasks > 0
            ? Math.round((currentStage.completedTasks / currentStage.totalTasks) * 100)
            : 0;
        currentStage.status =
          currentStage.progressPercent === 100
            ? "done"
            : currentStage.progressPercent > 0
            ? "in_progress"
            : "pending";
        stages.push(currentStage);
      }

      currentStageName = row.activityName;
      // Get section milestone date from first target project
      const firstTargetProj = targetProjects[0];
      const sectionDate = (firstTargetProj && row.cells[firstTargetProj.id]?.sectionDate) || "";

      currentStage = {
        id: row.id,
        name: row.activityName,
        totalTasks: 0,
        completedTasks: 0,
        progressPercent: 0,
        targetDate: sectionDate || "Scheduled",
        status: "pending",
      };
    } else {
      // Activity task row
      targetProjects.forEach((proj) => {
        const cell = row.cells[proj.id];
        totalActivities += 1;
        if (currentStage) {
          currentStage.totalTasks += 1;
        }

        const status = cell?.status || "not_updated";
        const remark = cell?.remark || "";

        if (status === "done") {
          completedActivities += 1;
          if (currentStage) currentStage.completedTasks += 1;
          if (remark && remark !== "-") {
            milestones.push({
              id: `${row.id}_${proj.id}`,
              activity: row.activityName,
              stage: currentStageName,
              company: proj.company,
              remark,
              date: cell.audit?.updatedAt || "Current Phase",
              status,
            });
          }
        } else if (status === "pending") {
          pendingActivities += 1;
          bottlenecks.push({
            id: `${row.id}_${proj.id}`,
            activity: row.activityName,
            stage: currentStageName,
            company: proj.company,
            remark: remark || "WIP / In Progress",
            supervisor: proj.supervisor,
            status,
          });
        } else if (status === "not_done") {
          delayedActivities += 1;
          bottlenecks.push({
            id: `${row.id}_${proj.id}`,
            activity: row.activityName,
            stage: currentStageName,
            company: proj.company,
            remark: remark || "Critical delay / Not started",
            supervisor: proj.supervisor,
            status,
          });
        } else {
          notUpdatedActivities += 1;
        }

        // Check for attached Drive/web links in remark
        if (remark) {
          const extracted = extractUrl(remark);
          if (extracted.hasUrl) {
            documents.push({
              title: extracted.label || row.activityName,
              url: extracted.url,
              company: proj.company,
              activity: row.activityName,
            });
          }
        }
      });
    }
  });

  // Push final stage
  if (currentStage) {
    const s = currentStage as StageProgressItem;
    s.progressPercent =
      s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0;
    s.status = s.progressPercent === 100 ? "done" : s.progressPercent > 0 ? "in_progress" : "pending";
    stages.push(s);
  }

  const overallProgressPercent =
    totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  // Efficiency variance: compare actual completion percentage vs expected baseline
  const expectedPlannedProgress = 75;
  const efficiencyVariance = overallProgressPercent - expectedPlannedProgress;

  // Build SVG timeline curve points
  const stageWeights = [15, 30, 55, 70, 85, 95, 100];
  let cumulativeCompleted = 0;
  const timelineCurve = stages.map((stg, idx) => {
    cumulativeCompleted += stg.completedTasks;
    const actualCumulative =
      totalActivities > 0 ? Math.min(100, Math.round((cumulativeCompleted / totalActivities) * 100)) : 0;
    const plannedWeight = stageWeights[idx] ?? Math.round(((idx + 1) / stages.length) * 100);

    return {
      stage: stg.name.length > 12 ? stg.name.slice(0, 10) + "..." : stg.name,
      planned: plannedWeight,
      actual: actualCumulative,
      date: stg.targetDate || `Step ${idx + 1}`,
    };
  });

  return {
    targetCompany,
    targetJobName,
    targetSupervisor,
    isSpecificJob,
    totalProjects: projects.length,
    activeProjectsCount: projects.filter((p) => p.status === "Active").length,
    totalActivities,
    completedActivities,
    pendingActivities,
    delayedActivities,
    notUpdatedActivities,
    overallProgressPercent,
    efficiencyVariance,
    stages,
    timelineCurve,
    milestones: milestones.slice(0, 6),
    bottlenecks: bottlenecks.slice(0, 6),
    documents: documents.slice(0, 6),
  };
}
