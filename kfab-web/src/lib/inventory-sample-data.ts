// ============================================================================
// KFAB360 — Inventory Sample Datasets (Zero Mock Data / Clean Slate)
// All mock and demo data removed. Collections initialize empty.
// ============================================================================

import {
  InventoryItemDTO,
  InventoryTransactionDTO,
  InventoryIssueDTO,
  AnalysisSummaryDTO,
  MonthlyTrendDTO,
  CategoryAnalysisDTO,
  TopConsumedItemsDTO,
  DepartmentUsageDTO,
  EmployeeUsageDTO,
  LowStockItemDTO,
  MachineToolStatusDTO,
} from "./inventory-api";

export const SAMPLE_INVENTORY_ITEMS: InventoryItemDTO[] = [];
export const SAMPLE_INVENTORY_TRANSACTIONS: InventoryTransactionDTO[] = [];
export const SAMPLE_INVENTORY_ISSUES: InventoryIssueDTO[] = [];

export const SAMPLE_INVENTORY_ANALYSIS_SUMMARY: AnalysisSummaryDTO = {
  totalItems: 0,
  totalStockValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  issuedItemsCount: 0,
  totalConsumptionCost: 0,
  monthlyPurchaseCost: 0,
  totalConsumptionQuantity: 0,
};

export const SAMPLE_INVENTORY_MONTHLY_TRENDS: MonthlyTrendDTO[] = [];
export const SAMPLE_INVENTORY_CATEGORY_ANALYSIS: CategoryAnalysisDTO[] = [];

export const SAMPLE_INVENTORY_TOP_ITEMS: TopConsumedItemsDTO = {
  byQuantity: [],
  byCost: [],
};

export const SAMPLE_INVENTORY_DEPARTMENT_USAGE: DepartmentUsageDTO[] = [];
export const SAMPLE_INVENTORY_EMPLOYEE_USAGE: EmployeeUsageDTO[] = [];
export const SAMPLE_INVENTORY_LOW_STOCK: LowStockItemDTO[] = [];

export const SAMPLE_INVENTORY_MACHINE_STATUS: MachineToolStatusDTO = {
  totalMachinesTools: 0,
  totalMachines: 0,
  availableCount: 0,
  operationalCount: 0,
  issuedCount: 0,
  inUseCount: 0,
  maintenanceCount: 0,
  damagedCount: 0,
  lostCount: 0,
  items: [],
};
