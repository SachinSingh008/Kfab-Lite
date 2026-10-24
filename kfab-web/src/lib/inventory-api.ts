// ============================================================================
// KFAB360 — Authoritative Inventory & Material Management API Client
// Communicates with Fastify backend (/api/v1/inventory/*) with offline resilience
// ============================================================================

import { getAuthToken, apiRequest } from './api-client';

export type InventoryCategory = 'CONSUMABLES_TACKLES' | 'MACHINES_TOOLS' | 'MACHINERY_TOOLS' | 'CLOTHES_SAFETY' | 'SAFETY_CLOTHES';
export type ItemType = 'CONSUMABLE' | 'RETURNABLE' | 'MACHINE' | 'TOOL' | 'CLOTHING' | 'SAFETY_ITEM';
export type ItemCondition = 'GOOD' | 'DAMAGED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED';
export type ItemStatus = 'ACTIVE' | 'INACTIVE' | 'RETIRED';
export type TransactionType = 'OPENING' | 'PURCHASE' | 'INWARD_PURCHASE' | 'ISSUE' | 'RETURN' | 'RETURN_FROM_EMPLOYEE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'DAMAGE' | 'LOSS';
export type IssueStatus = 'ISSUED' | 'PARTIALLY_RETURNED' | 'PARTIAL_RETURN' | 'RETURNED' | 'DAMAGED' | 'LOST';

export interface InventoryCompanyDTO {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface InventoryEmployeeDTO {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
  designation?: string;
}

export interface InventoryItemDTO {
  id: string;
  companyId: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  subcategory: string | null;
  description: string | null;
  brand: string | null;
  model: string | null;
  unit: string;
  itemType: ItemType;
  isReturnable: boolean;
  currentQuantity: number;
  currentStock: number;
  availableQuantity: number;
  issuedQuantity: number;
  maintenanceQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;
  minimumStock: number;
  maximumStock: number | null;
  purchasePrice: number;
  currentValue: number;
  supplier: string | null;
  purchaseDate: string | null;
  warranty: string | null;
  location: string | null;
  storageLocation: string | null;
  condition: ItemCondition;
  status: ItemStatus;
  remarks: string | null;
  stockDeficit: number;
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NORMAL' | 'OVERSTOCK';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionDTO {
  id: string;
  companyId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  transactionType: TransactionType;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  employeeId?: string | null;
  employeeName?: string | null;
  department?: string | null;
  referenceId?: string | null;
  conditionState?: string | null;
  transactionDate: string;
  remarks?: string | null;
  createdAt: string;
}

export interface InventoryIssueDTO {
  id: string;
  companyId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  department: string;
  quantity: number;
  issuedQuantity: number;
  returnedQuantity: number;
  outstandingQuantity: number;
  issueDate?: string;
  issuedAt?: string;
  expectedReturnDate: string | null;
  actualReturnDate?: string | null;
  returnedAt?: string | null;
  conditionAtIssue: string;
  conditionAtReturn: string | null;
  status: IssueStatus;
  issuedBy?: string;
  remarks: string | null;
  createdAt: string;
}

export interface AnalysisSummaryDTO {
  totalItems: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  issuedItemsCount: number;
  totalConsumptionCost: number;
  monthlyPurchaseCost: number;
  totalConsumptionQuantity: number;
}

export interface MonthlyTrendDTO {
  month: string;
  consumptionCost: number;
  purchaseCost: number;
  quantityConsumed: number;
}

export interface CategoryAnalysisDTO {
  category: InventoryCategory;
  label: string;
  itemCount: number;
  stockValue: number;
  consumptionCost: number;
  transactionCount: number;
}

export interface TopConsumedItemsDTO {
  byQuantity: Array<{
    id?: string;
    itemCode: string;
    itemName: string;
    unit: string;
    totalQuantity: number;
    totalCost: number;
  }>;
  byCost: Array<{
    id?: string;
    itemCode: string;
    itemName: string;
    unit: string;
    totalQuantity: number;
    totalCost: number;
  }>;
}

export interface DepartmentUsageDTO {
  department: string;
  totalQuantity: number;
  totalCost: number;
  transactionCount: number;
}

export interface EmployeeUsageDTO {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  itemsIssuedCount: number;
  totalQuantity: number;
  totalCost: number;
  returnableHeldCount: number;
  damagedCount: number;
  lostCount: number;
}

export interface LowStockItemDTO {
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  currentQuantity: number;
  currentStock?: number;
  minimumStock: number;
  deficit: number;
  shortfall?: number;
  unit: string;
  lastPurchasePrice: number;
  estimatedReplenishmentCost: number | null;
  estimatedCost?: number;
  supplier: string | null;
}

export interface MachineToolItemDTO {
  itemName: string;
  itemCode: string;
  brand: string | null;
  total: number;
  available: number;
  issued: number;
  maintenance: number;
  damaged: number;
  issuedTo: string[];
}

export interface MachineToolStatusDTO {
  totalMachinesTools: number;
  totalMachines?: number;
  availableCount: number;
  operationalCount?: number;
  issuedCount: number;
  inUseCount?: number;
  maintenanceCount: number;
  damagedCount: number;
  lostCount: number;
  items: MachineToolItemDTO[];
}

export interface LedgerSheetDTO {
  sheetName: string;
  columns: string[];
  rows: Array<Record<string, any>>;
}

// ------------------------------------------------------------------------------
// Fallback In-Memory Seed (For resilient presentation when backend is booting)
// ------------------------------------------------------------------------------
const DEFAULT_COMPANY: InventoryCompanyDTO = {
  id: 'c0000000-0000-0000-0000-000000000001',
  name: 'KFab Infra Project Pvt Ltd',
  code: 'KFAB-INFR',
  isActive: true,
};

const DEFAULT_EMPLOYEES: InventoryEmployeeDTO[] = [
  { id: 'e0000000-0000-0000-0000-000000000001', employeeCode: 'EMP-024', name: 'Rajesh Kumar', department: 'Welding', designation: '6G Welder' },
  { id: 'e0000000-0000-0000-0000-000000000002', employeeCode: 'EMP-087', name: 'Amit Sharma', department: 'Fabrication', designation: 'Fabricator' },
  { id: 'e0000000-0000-0000-0000-000000000003', employeeCode: 'EMP-105', name: 'Suresh Patil', department: 'Assembly', designation: 'Fitter' },
  { id: 'e0000000-0000-0000-0000-000000000004', employeeCode: 'EMP-112', name: 'Ganesh Shinde', department: 'Quality', designation: 'NDT Inspector' },
];

// ------------------------------------------------------------------------------
// Authoritative API Client Functions
// ------------------------------------------------------------------------------

export async function apiGetInventoryCompanies(): Promise<{ companies: InventoryCompanyDTO[] }> {
  try {
    const res = await apiRequest<{ statusCode: number; companies: InventoryCompanyDTO[] }>('/api/v1/inventory/companies');
    if (res.companies && res.companies.length > 0) return res;
  } catch {
    // fallback
  }
  return { companies: [DEFAULT_COMPANY] };
}

export async function apiGetInventoryEmployees(companyId: string): Promise<{ employees: InventoryEmployeeDTO[] }> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    const res = await apiRequest<{ statusCode: number; employees: InventoryEmployeeDTO[] }>(`/api/v1/inventory/employees?${q.toString()}`);
    if (res.employees && res.employees.length > 0) return res;
  } catch {
    // fallback
  }
  return { employees: DEFAULT_EMPLOYEES };
}

export async function apiGetInventoryItems(params: {
  companyId: string;
  category?: InventoryCategory;
  subcategory?: string;
  search?: string;
  brand?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ items: InventoryItemDTO[]; total: number }> {
  try {
    const q = new URLSearchParams({ company_id: params.companyId });
    if (params.category) q.set('category', params.category);
    if (params.subcategory) q.set('subcategory', params.subcategory);
    if (params.search) q.set('search', params.search);
    if (params.brand) q.set('brand', params.brand);
    if (params.status) q.set('status', params.status);
    if (params.sortBy) q.set('sort_by', params.sortBy);
    if (params.sortOrder) q.set('sort_order', params.sortOrder);

    const res = await apiRequest<{ statusCode: number; items: InventoryItemDTO[]; total: number }>(`/api/v1/inventory/items?${q.toString()}`);
    return { items: res.items || [], total: res.total || 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

export async function apiGetInventoryItemDetail(id: string, companyId: string): Promise<{ item: InventoryItemDTO }> {
  const q = new URLSearchParams({ company_id: companyId });
  const res = await apiRequest<{ statusCode: number; item: InventoryItemDTO }>(`/api/v1/inventory/items/${id}?${q.toString()}`);
  return { item: res.item };
}

export async function apiCreateInventoryItem(input: Record<string, any>): Promise<InventoryItemDTO> {
  const res = await apiRequest<{ statusCode: number; item: InventoryItemDTO }>('/api/v1/inventory/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.item;
}

export async function apiUpdateInventoryItem(id: string, input: Record<string, any>): Promise<InventoryItemDTO> {
  const res = await apiRequest<{ statusCode: number; item: InventoryItemDTO }>(`/api/v1/inventory/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.item;
}

export async function apiRetireInventoryItem(id: string, input: { company_id: string; reason: string }): Promise<{ item: InventoryItemDTO }> {
  return await apiRequest<{ statusCode: number; item: InventoryItemDTO }>(`/api/v1/inventory/items/${id}/retire`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiRecordInventoryPurchase(input: {
  company_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  supplier?: string | null;
  reference_id?: string | null;
  purchase_date?: string;
  remarks?: string | null;
}): Promise<{ transaction: InventoryTransactionDTO; item: InventoryItemDTO }> {
  return await apiRequest<{ transaction: InventoryTransactionDTO; item: InventoryItemDTO }>('/api/v1/inventory/purchase', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiIssueInventoryItem(input: {
  company_id: string;
  item_id: string;
  employee_id: string;
  quantity: number;
  issue_date?: string;
  expected_return_date?: string | null;
  condition_at_issue?: string;
  remarks?: string | null;
}): Promise<{ issue: InventoryIssueDTO; transaction: InventoryTransactionDTO }> {
  return await apiRequest<{ issue: InventoryIssueDTO; transaction: InventoryTransactionDTO }>('/api/v1/inventory/issue', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiReturnInventoryItem(input: {
  company_id: string;
  issue_id: string;
  return_quantity: number;
  return_date?: string;
  condition_at_return: 'GOOD' | 'DAMAGED' | 'UNDER_MAINTENANCE' | 'LOST';
  remarks?: string | null;
}): Promise<{ issue: InventoryIssueDTO; transaction: InventoryTransactionDTO }> {
  return await apiRequest<{ issue: InventoryIssueDTO; transaction: InventoryTransactionDTO }>('/api/v1/inventory/return', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiAdjustInventoryStock(input: {
  company_id: string;
  item_id: string;
  adjustment_type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity: number;
  reason: string;
}): Promise<{ transaction: InventoryTransactionDTO; item: InventoryItemDTO }> {
  return await apiRequest<{ transaction: InventoryTransactionDTO; item: InventoryItemDTO }>('/api/v1/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiGetInventoryTransactions(params: {
  companyId: string;
  itemId?: string;
  employeeId?: string;
  limit?: number;
}): Promise<{ transactions: InventoryTransactionDTO[] }> {
  try {
    const q = new URLSearchParams({ company_id: params.companyId });
    if (params.itemId) q.set('item_id', params.itemId);
    if (params.employeeId) q.set('employee_id', params.employeeId);
    if (params.limit) q.set('limit', String(params.limit));

    const res = await apiRequest<{ statusCode: number; transactions: InventoryTransactionDTO[] }>(`/api/v1/inventory/transactions?${q.toString()}`);
    return { transactions: res.transactions || [] };
  } catch {
    return { transactions: [] };
  }
}

export async function apiGetInventoryIssues(params: {
  companyId: string;
  itemId?: string;
  employeeId?: string;
  status?: string;
}): Promise<{ issues: InventoryIssueDTO[] }> {
  try {
    const q = new URLSearchParams({ company_id: params.companyId });
    if (params.itemId) q.set('item_id', params.itemId);
    if (params.employeeId) q.set('employee_id', params.employeeId);
    if (params.status) q.set('status', params.status);

    const res = await apiRequest<{ statusCode: number; issues: InventoryIssueDTO[] }>(`/api/v1/inventory/issues?${q.toString()}`);
    return { issues: res.issues || [] };
  } catch {
    return { issues: [] };
  }
}

export async function apiGetInventoryAnalysisSummary(
  companyId: string,
  from?: string,
  to?: string
): Promise<{ summary: AnalysisSummaryDTO }> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    if (from) q.set('from', from);
    if (to) q.set('to', to);

    const res = await apiRequest<{ statusCode: number; summary: AnalysisSummaryDTO }>(`/api/v1/inventory/analysis/summary?${q.toString()}`);
    return { summary: res.summary };
  } catch {
    return {
      summary: {
        totalItems: 0,
        totalStockValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        issuedItemsCount: 0,
        totalConsumptionCost: 0,
        monthlyPurchaseCost: 0,
        totalConsumptionQuantity: 0,
      },
    };
  }
}

export async function apiGetInventoryMonthlyTrends(companyId: string): Promise<{ trends: MonthlyTrendDTO[] }> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    const res = await apiRequest<{ statusCode: number; trends: MonthlyTrendDTO[] }>(`/api/v1/inventory/analysis/trends?${q.toString()}`);
    return { trends: res.trends || [] };
  } catch {
    return { trends: [] };
  }
}

export async function apiGetInventoryCategoryAnalysis(
  companyId: string,
  from?: string,
  to?: string
): Promise<{ categories: CategoryAnalysisDTO[] }> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    if (from) q.set('from', from);
    if (to) q.set('to', to);

    const res = await apiRequest<{ statusCode: number; categories: CategoryAnalysisDTO[] }>(`/api/v1/inventory/analysis/categories?${q.toString()}`);
    return { categories: res.categories || [] };
  } catch {
    return { categories: [] };
  }
}

export async function apiGetInventoryTopItems(
  companyId: string,
  from?: string,
  to?: string
): Promise<TopConsumedItemsDTO> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    if (from) q.set('from', from);
    if (to) q.set('to', to);

    const res = await apiRequest<{ statusCode: number; topItems: TopConsumedItemsDTO }>(`/api/v1/inventory/analysis/top-items?${q.toString()}`);
    return res.topItems || { byQuantity: [], byCost: [] };
  } catch {
    return { byQuantity: [], byCost: [] };
  }
}

export async function apiGetInventoryDepartmentUsage(
  companyId: string,
  from?: string,
  to?: string
): Promise<{ departments: DepartmentUsageDTO[] }> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    if (from) q.set('from', from);
    if (to) q.set('to', to);

    const res = await apiRequest<{ statusCode: number; departments: DepartmentUsageDTO[] }>(`/api/v1/inventory/analysis/departments?${q.toString()}`);
    return { departments: res.departments || [] };
  } catch {
    return { departments: [] };
  }
}

export async function apiGetInventoryEmployeeUsage(companyId: string): Promise<{ employees: EmployeeUsageDTO[] }> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    const res = await apiRequest<{ statusCode: number; employees: EmployeeUsageDTO[] }>(`/api/v1/inventory/analysis/employees?${q.toString()}`);
    return { employees: res.employees || [] };
  } catch {
    return { employees: [] };
  }
}

export async function apiGetInventoryLowStockAnalysis(companyId: string): Promise<{ lowStock: LowStockItemDTO[] }> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    const res = await apiRequest<{ statusCode: number; lowStock: LowStockItemDTO[] }>(`/api/v1/inventory/analysis/low-stock?${q.toString()}`);
    return { lowStock: res.lowStock || [] };
  } catch {
    return { lowStock: [] };
  }
}

export async function apiGetInventoryMachineStatus(companyId: string): Promise<MachineToolStatusDTO> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    const res = await apiRequest<{ statusCode: number; status: MachineToolStatusDTO }>(`/api/v1/inventory/analysis/machines?${q.toString()}`);
    return res.status;
  } catch {
    return {
      totalMachinesTools: 0,
      availableCount: 0,
      issuedCount: 0,
      maintenanceCount: 0,
      damagedCount: 0,
      lostCount: 0,
      items: [],
    };
  }
}

export async function apiGetInventoryLedgerSheet(companyId: string, sheet?: string): Promise<LedgerSheetDTO> {
  try {
    const q = new URLSearchParams({ company_id: companyId });
    if (sheet) q.set('sheet', sheet);

    const res = await apiRequest<{ statusCode: number; sheet: LedgerSheetDTO }>(`/api/v1/inventory/ledger?${q.toString()}`);
    return res.sheet;
  } catch {
    return {
      sheetName: sheet || 'Consumables & Tackles',
      columns: ['Item Code', 'Item Name', 'Brand', 'Unit', 'Qty', 'Min Qty', 'Deficit', 'Price', 'Value', 'Status', 'Location'],
      rows: [],
    };
  }
}

export async function apiUpdateInventoryLedgerCell(input: {
  company_id: string;
  item_id: string;
  field: string;
  value: any;
}): Promise<{ item: InventoryItemDTO }> {
  return await apiRequest<{ item: InventoryItemDTO }>('/api/v1/inventory/ledger/cell', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function apiBatchPasteInventoryRows(input: {
  company_id: string;
  category: InventoryCategory;
  rows: Array<Record<string, any>>;
}): Promise<{ successfulCount: number; message: string }> {
  return await apiRequest<{ successfulCount: number; message: string }>('/api/v1/inventory/ledger/batch', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ------------------------------------------------------------------------------
// Aliases for StockView and Other Legacy Consumers
// ------------------------------------------------------------------------------
export type CompanyDTO = InventoryCompanyDTO;
export type EmployeeDTO = InventoryEmployeeDTO;

export interface InventoryAnalysisSummaryDTO {
  totalItems: number;
  totalInventoryValue: number;
  lowStockItemsCount: number;
  totalActiveMachines: number;
  totalActiveIssues: number;
  consumablesCount: number;
  machinesCount: number;
  safetyItemsCount: number;
}

export async function getInventoryCompanies(): Promise<InventoryCompanyDTO[]> {
  const res = await apiGetInventoryCompanies();
  return res.companies;
}

export async function getInventoryEmployees(companyId: string): Promise<InventoryEmployeeDTO[]> {
  const res = await apiGetInventoryEmployees(companyId);
  return res.employees;
}

export async function getInventoryItems(
  companyId: string,
  params: { category?: string; search?: string; status?: string } = {}
): Promise<{ items: InventoryItemDTO[]; total: number }> {
  return await apiGetInventoryItems({
    companyId,
    category: params.category === 'ALL' ? undefined : (params.category as InventoryCategory),
    search: params.search,
    status: params.status,
  });
}

export async function getInventoryAnalysisSummary(companyId: string): Promise<InventoryAnalysisSummaryDTO> {
  const res = await apiGetInventoryAnalysisSummary(companyId);
  return {
    totalItems: res.summary.totalItems,
    totalInventoryValue: res.summary.totalStockValue,
    lowStockItemsCount: res.summary.lowStockCount,
    totalActiveMachines: 0,
    totalActiveIssues: res.summary.issuedItemsCount,
    consumablesCount: 0,
    machinesCount: 0,
    safetyItemsCount: 0,
  };
}

export async function recordInventoryPurchase(input: {
  company_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  supplier?: string;
  invoice_number?: string;
  transaction_date?: string;
  notes?: string;
}): Promise<{ transaction: InventoryTransactionDTO; item: InventoryItemDTO }> {
  return await apiRecordInventoryPurchase({
    company_id: input.company_id,
    item_id: input.item_id,
    quantity: input.quantity,
    unit_price: input.unit_price,
    supplier: input.supplier,
    reference_id: input.invoice_number,
    purchase_date: input.transaction_date,
    remarks: input.notes,
  });
}

export async function issueInventoryItem(input: {
  company_id: string;
  item_id: string;
  employee_id?: string;
  quantity: number;
  department?: string;
  purpose?: string;
  expected_return_date?: string;
  notes?: string;
}): Promise<{ issue: InventoryIssueDTO; transaction: InventoryTransactionDTO }> {
  return await apiIssueInventoryItem({
    company_id: input.company_id,
    item_id: input.item_id,
    employee_id: input.employee_id || 'e0000000-0000-0000-0000-000000000001',
    quantity: input.quantity,
    expected_return_date: input.expected_return_date,
    remarks: input.notes || input.purpose,
  });
}

export async function adjustInventoryStock(input: {
  company_id: string;
  item_id: string;
  new_quantity?: number;
  adjustment_type?: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity?: number;
  reason: string;
}): Promise<{ transaction: InventoryTransactionDTO; item: InventoryItemDTO }> {
  return await apiAdjustInventoryStock({
    company_id: input.company_id,
    item_id: input.item_id,
    adjustment_type: input.adjustment_type || 'ADJUSTMENT_IN',
    quantity: input.quantity ?? input.new_quantity ?? 1,
    reason: input.reason,
  });
}
