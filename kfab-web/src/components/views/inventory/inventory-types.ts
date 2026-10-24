// ============================================================================
// KFAB360 — Inventory UI Local Types & Form Interfaces
// ============================================================================

import {
  InventoryCategory,
  InventoryItemDTO,
  InventoryTransactionDTO,
  InventoryIssueDTO,
  InventoryCompanyDTO,
  InventoryEmployeeDTO,
  AnalysisSummaryDTO,
  MonthlyTrendDTO,
  CategoryAnalysisDTO,
  TopConsumedItemsDTO,
  DepartmentUsageDTO,
  EmployeeUsageDTO,
  LowStockItemDTO,
  MachineToolStatusDTO,
  LedgerSheetDTO,
} from '@/lib/inventory-api';

export type InventoryTab = 'consumables' | 'machines' | 'safety' | 'analysis';

export interface AddFormState {
  item_code: string;
  item_name: string;
  category: InventoryCategory;
  subcategory: string;
  brand: string;
  model: string;
  unit: string;
  opening_quantity: number;
  minimum_stock: number;
  maximum_stock: number | null;
  purchase_price: number;
  supplier: string;
  purchase_date: string;
  warranty: string;
  location: string;
  storage_location: string;
  is_returnable: boolean;
  condition: string;
  remarks: string;
}

export interface IssueFormState {
  employee_id: string;
  quantity: number;
  issue_date: string;
  expected_return_date: string;
  condition_at_issue: string;
  remarks: string;
}

export interface ReturnFormState {
  return_quantity: number;
  return_date: string;
  condition_at_return: 'GOOD' | 'DAMAGED' | 'UNDER_MAINTENANCE' | 'LOST';
  remarks: string;
}

export interface RestockFormState {
  quantity: number;
  unit_price: number;
  supplier: string;
  reference_id: string;
  purchase_date: string;
  remarks: string;
}

export interface AdjustFormState {
  adjustment_type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity: number;
  reason: string;
}

export interface DetailDataState {
  item: InventoryItemDTO;
  transactions: InventoryTransactionDTO[];
  issues: InventoryIssueDTO[];
}
