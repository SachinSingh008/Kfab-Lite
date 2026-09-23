// ============================================================================
// KFAB BASIC — Data Type Definitions (Zero Mock Data / Clean Slate)
// ============================================================================

export interface WorkerRecord {
  id: string;
  name: string;
  designation: string;
  dept: string;
  shift: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
  time: string;
  supervisor: string;
}

export interface StockMaterial {
  code: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  inward: string;
  outward: string;
  usage: string;
  current: string;
  min: string;
  isLow: boolean;
}

export interface SupplyTransaction {
  id: string;
  type: "INWARD" | "OUTWARD" | "USAGE";
  date: string;
  ref: string;
  entity: string;
  material: string;
  qty: string;
  vehicle: string;
  status: string;
}

// Clean Slate: Zero hardcoded fake items
export const INITIAL_WORKERS: WorkerRecord[] = [];
export const INITIAL_STOCK: StockMaterial[] = [];
export const INITIAL_TRANSACTIONS: SupplyTransaction[] = [];

// ============================================================================
// KFAB360 Operations Data Models (Supervisor Domain)
// ============================================================================

export interface DailyReportRecord {
  code: string;
  project: string;
  date: string;
  shift: string;
  planned: string;
  completed: string;
  percent: number;
  workers: number;
  welders?: number;
  fitters?: number;
  riggers?: number;
  machines: number;
  machineName?: string;
  machineHours?: number;
  qa: "Passed" | "Observation" | "Failed";
  qaNotes?: string;
  issueTitle?: string;
  issueSeverity?: "Low" | "Medium" | "High";
  reqItem?: string;
  reqUrgency?: "Low" | "Medium" | "High";
  supervisorNotes?: string;
  status: "Submitted" | "Approved" | "Under Review";
}

export interface ProductionLogRecord {
  code: string;
  project: string;
  bay: string;
  plannedMT: number;
  completedMT: number;
  scrapMT: number;
  efficiency: string;
  shift: string;
  supervisor: string;
}

export interface MachineRecord {
  code: string;
  name: string;
  make: string;
  runningHrsToday: number;
  capacity: string;
  operator: string;
  status: "Operational" | "Maintenance" | "Standby";
  nextService: string;
}

export interface QaqcRecord {
  code: string;
  project: string;
  component: string;
  testType: string;
  standard: string;
  inspector: string;
  result: "Passed" | "Observation" | "Failed";
  date: string;
}

export interface IssueRecord {
  code: string;
  project: string;
  severity: "Low" | "Medium" | "High";
  title: string;
  reportedBy: string;
  assignedTo: string;
  targetDate: string;
  status: "Open" | "Under Repair" | "Resolved";
}

export interface RequirementRecord {
  code: string;
  project: string;
  item: string;
  quantity: string;
  urgency: "Low" | "Medium" | "High";
  requestedBy: string;
  requiredBy: string;
  status: "Pending Approval" | "Approved" | "PO Placed" | "Issued";
}

export const INITIAL_DAILY_REPORTS: DailyReportRecord[] = [
  {
    code: "DR-2026-0912",
    project: "KFAB-PRJ-001 (Chakan Plant)",
    date: "2026-09-05",
    shift: "Day Shift",
    planned: "Column erection & splice fitup G1-G8",
    completed: "G1-G6 columns fully erected & torque checked",
    percent: 75,
    workers: 24,
    welders: 8,
    fitters: 10,
    riggers: 6,
    machines: 3,
    machineName: "Hydra Mobile Crane 25T (ACE)",
    machineHours: 7.5,
    qa: "Passed",
    qaNotes: "Ultrasonic weld testing passed with zero linear defects.",
    status: "Submitted",
  },
  {
    code: "DR-2026-0911",
    project: "KFAB-PRJ-002 (Aurangabad Conveyor)",
    date: "2026-09-05",
    shift: "Day Shift",
    planned: "Gantry girder submerged arc welding splice joint",
    completed: "60% weld passes completed on girder GG-04",
    percent: 60,
    workers: 18,
    welders: 6,
    fitters: 8,
    riggers: 4,
    machines: 2,
    machineName: "Submerged Arc Welder (SAW 1000A)",
    machineHours: 6.0,
    qa: "Observation",
    qaNotes: "Minor surface porosity observed at root pass weld.",
    status: "Submitted",
  },
  {
    code: "DR-2026-0910",
    project: "KFAB-PRJ-003 (Storage Tank Unit 4)",
    date: "2026-09-04",
    shift: "Night Shift",
    planned: "Shell plate 28mm rolling and root tacking",
    completed: "Full shell cylinder roundness verified & tacked",
    percent: 100,
    workers: 12,
    welders: 4,
    fitters: 6,
    riggers: 2,
    machines: 4,
    machineName: "4-Roll Hydraulic Plate Bender (DAVI)",
    machineHours: 8.0,
    qa: "Passed",
    qaNotes: "Radius template check within +/- 1.5mm tolerance.",
    status: "Approved",
  },
];

export const INITIAL_PRODUCTION_LOGS: ProductionLogRecord[] = [
  {
    code: "PRD-2026-0905",
    project: "KFAB-PRJ-001",
    bay: "Bay 1 — CNC Cutting & Fit-Up",
    plannedMT: 12.5,
    completedMT: 11.2,
    scrapMT: 0.35,
    efficiency: "89.6%",
    shift: "Day Shift",
    supervisor: "Imran Shaikh (Bay Supervisor)",
  },
  {
    code: "PRD-2026-0904",
    project: "KFAB-PRJ-002",
    bay: "Bay 2 — Submerged Arc Welding (SAW)",
    plannedMT: 8.0,
    completedMT: 8.4,
    scrapMT: 0.18,
    efficiency: "105.0%",
    shift: "Day Shift",
    supervisor: "Priya Deshmukh (QA/QC Lead)",
  },
  {
    code: "PRD-2026-0903",
    project: "KFAB-PRJ-003",
    bay: "Bay 3 — Shot Blasting & Epoxy Primer",
    plannedMT: 15.0,
    completedMT: 14.1,
    scrapMT: 0.05,
    efficiency: "94.0%",
    shift: "Night Shift",
    supervisor: "Vikram Patil (Shop Supv.)",
  },
  {
    code: "PRD-2026-0902",
    project: "KFAB-PRJ-004",
    bay: "Bay 1 — Heavy Box Girder Assembly",
    plannedMT: 10.0,
    completedMT: 7.8,
    scrapMT: 0.42,
    efficiency: "78.0%",
    shift: "Day Shift",
    supervisor: "Imran Shaikh (Bay Supervisor)",
  },
];

export const INITIAL_MACHINES: MachineRecord[] = [
  {
    code: "MCH-01",
    name: "Hydra Mobile Crane 25T",
    make: "Action Construction (ACE)",
    runningHrsToday: 7.5,
    capacity: "25 MT",
    operator: "Dnyaneshwar More",
    status: "Operational",
    nextService: "2026-09-25",
  },
  {
    code: "MCH-02",
    name: "CNC Plasma Gantry Cutting Table (3x12m)",
    make: "Messer Cutting Systems",
    runningHrsToday: 9.0,
    capacity: "50mm Mild Steel Plate",
    operator: "Sanjay Mane",
    status: "Operational",
    nextService: "2026-10-05",
  },
  {
    code: "MCH-03",
    name: "Submerged Arc Welder (SAW Column & Boom)",
    make: "Lincoln Electric 1000A",
    runningHrsToday: 6.0,
    capacity: "1000 Amps Multi-Pass",
    operator: "Baban Ghorpade",
    status: "Operational",
    nextService: "2026-09-18",
  },
  {
    code: "MCH-04",
    name: "4-Roll Hydraulic Plate Bender",
    make: "DAVI Promau 32mm",
    runningHrsToday: 4.5,
    capacity: "32mm x 3000mm Pre-Bend",
    operator: "Santosh Yadav",
    status: "Maintenance",
    nextService: "2026-09-07",
  },
  {
    code: "MCH-05",
    name: "EOT Double Girder Overhead Crane (Bay 1)",
    make: "Mukand Industrial Cranes",
    runningHrsToday: 11.0,
    capacity: "15 MT Hook Load",
    operator: "Workshop Rigger Pool",
    status: "Operational",
    nextService: "2026-11-12",
  },
];

export const INITIAL_QAQC: QaqcRecord[] = [
  {
    code: "QA-2026-041",
    project: "KFAB-PRJ-001",
    component: "Column Base Pl. Full Pen Weld C1-C6",
    testType: "Ultrasonic Testing (UT)",
    standard: "AWS D1.1 Structural Welding",
    inspector: "Priya Deshmukh",
    result: "Passed",
    date: "2026-09-05",
  },
  {
    code: "QA-2026-040",
    project: "KFAB-PRJ-002",
    component: "Gantry Girder Splice Web Flange Weld",
    testType: "Radiographic Testing (RT)",
    standard: "ASME Section IX",
    inspector: "Third Party (TUV India)",
    result: "Observation",
    date: "2026-09-04",
  },
  {
    code: "QA-2026-039",
    project: "KFAB-PRJ-003",
    component: "Shell Plate Curvature Template Check",
    testType: "Dimensional & Radius Gauge",
    standard: "API 650 Storage Tanks",
    inspector: "Priya Deshmukh",
    result: "Passed",
    date: "2026-09-03",
  },
  {
    code: "QA-2026-038",
    project: "KFAB-PRJ-004",
    component: "Handrail Post Fillet Welds",
    testType: "Visual & Dye Penetrant (DPT)",
    standard: "IS 800:2007",
    inspector: "Imran Shaikh",
    result: "Passed",
    date: "2026-09-02",
  },
];

export const INITIAL_ISSUES: IssueRecord[] = [
  {
    code: "ISS-012",
    project: "KFAB-PRJ-002",
    severity: "High",
    title: "Splice weld porosity on girder GG-04 root pass",
    reportedBy: "Priya Deshmukh",
    assignedTo: "Baban Ghorpade (Welder)",
    targetDate: "2026-09-07",
    status: "Under Repair",
  },
  {
    code: "ISS-011",
    project: "KFAB-PRJ-004",
    severity: "Medium",
    title: "Plate bending machine roll alignment drift +2mm",
    reportedBy: "Santosh Yadav",
    assignedTo: "Plant Maintenance Team",
    targetDate: "2026-09-08",
    status: "Open",
  },
  {
    code: "ISS-010",
    project: "KFAB-PRJ-001",
    severity: "Low",
    title: "Primer DFT dry film thickness uneven at bracket joint",
    reportedBy: "Imran Shaikh",
    assignedTo: "Raju Gaikwad (Painter)",
    targetDate: "2026-09-06",
    status: "Resolved",
  },
];

export const INITIAL_REQUIREMENTS: RequirementRecord[] = [
  {
    code: "REQ-081",
    project: "KFAB-PRJ-001",
    item: "Low-Hydrogen Electrodes E7018 4.0mm",
    quantity: "250 kg",
    urgency: "High",
    requestedBy: "Imran Shaikh (Bay Supervisor)",
    requiredBy: "2026-09-08",
    status: "Approved",
  },
  {
    code: "REQ-082",
    project: "KFAB-PRJ-003",
    item: "SS 304 Solid Filler Wire 2.4mm",
    quantity: "60 kg",
    urgency: "Medium",
    requestedBy: "Vishnu Chavan (TIG Welder)",
    requiredBy: "2026-09-12",
    status: "PO Placed",
  },
  {
    code: "REQ-083",
    project: "KFAB-PRJ-002",
    item: "M24 Grade 8.8 HSFG Structural Bolts",
    quantity: "180 nos",
    urgency: "High",
    requestedBy: "Priya Deshmukh (QA/QC)",
    requiredBy: "2026-09-09",
    status: "Pending Approval",
  },
];

