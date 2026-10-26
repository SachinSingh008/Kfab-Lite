// ============================================================================
// KFAB360 — Authoritative Datasets (Zero Mock Data / Clean Slate)
// All mock and demo data removed. All collections initialize empty.
// ============================================================================

import {
  WorkerRecord,
  StockMaterial,
  SupplyTransaction,
  DailyReportRecord,
  ProductionLogRecord,
  MachineRecord,
  QaqcRecord,
  IssueRecord,
  RequirementRecord,
} from "./mock-data";
import { StockLedgerEntry } from "./data-service";

export interface InwardReconciliationRecord {
  id: string;
  challan: string;
  invoice: string;
  supplier: string;
  material: string;
  billedQty: number;
  receivedQty: number;
  unit: string;
  ratePerUnit: number;
  status: "MATCHED" | "DISCREPANCY" | "PENDING_AUDIT";
  paymentStatus: "PAID" | "PENDING" | "ON_HOLD";
}

// All sample datasets completely cleared (Zero mock data)
export const SAMPLE_WORKERS: WorkerRecord[] = [];
export const SAMPLE_STOCK: StockMaterial[] = [];
export const SAMPLE_TRANSACTIONS: SupplyTransaction[] = [];
export const SAMPLE_DAILY_REPORTS: DailyReportRecord[] = [];
export const SAMPLE_PRODUCTION_LOGS: ProductionLogRecord[] = [];
export const SAMPLE_MACHINES: MachineRecord[] = [];
export const SAMPLE_QAQC: QaqcRecord[] = [];
export const SAMPLE_ISSUES: IssueRecord[] = [];
export const SAMPLE_REQUIREMENTS: RequirementRecord[] = [];
export const SAMPLE_ACCOUNTS: InwardReconciliationRecord[] = [];
export const SAMPLE_LEDGER_ENTRIES: StockLedgerEntry[] = [];
