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

export const INITIAL_DAILY_REPORTS: DailyReportRecord[] = [];

export const INITIAL_PRODUCTION_LOGS: ProductionLogRecord[] = [];

export const INITIAL_MACHINES: MachineRecord[] = [];

export const INITIAL_QAQC: QaqcRecord[] = [];

export const INITIAL_ISSUES: IssueRecord[] = [];

export const INITIAL_REQUIREMENTS: RequirementRecord[] = [];

