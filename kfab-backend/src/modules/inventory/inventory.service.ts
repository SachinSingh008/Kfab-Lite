// ============================================================================
// KFAB360 — Authoritative Inventory & Material Management Service Facade
// Unifies Item Master, Stock Movements, Analysis Telemetry & Live Excel Ledger
// ============================================================================

import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../../middleware/auth.js';
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  RetireInventoryItemInput,
  RecordPurchaseInput,
  IssueItemInput,
  ReturnItemInput,
  StockAdjustmentInput,
  LedgerCellUpdateInput,
  LedgerBatchPasteInput,
  ListItemsQuery,
} from './inventory.schema.js';
import {
  InventoryItemDTO,
  InventoryTransactionDTO,
  InventoryIssueDTO,
  CompanyDTO,
  EmployeeDTO,
} from './inventory.store.js';
import { inventoryItemsService } from './inventory-items.service.js';
import { inventoryStockService } from './inventory-stock.service.js';
import { inventoryAnalysisService } from './inventory-analysis.service.js';
import { inventoryLedgerService } from './inventory-ledger.service.js';

export * from './inventory.store.js';
export * from './inventory-items.service.js';
export * from './inventory-stock.service.js';
export * from './inventory-analysis.service.js';
export * from './inventory-ledger.service.js';

export class InventoryService {
  // --------------------------------------------------------------------------
  // Authorization & Company Master
  // --------------------------------------------------------------------------
  async verifyCompanyAccess(companyId: string, user: AuthenticatedUser): Promise<CompanyDTO> {
    return inventoryItemsService.verifyCompanyAccess(companyId, user);
  }

  async verifyEmployeeBelongsToCompany(employeeId: string, companyId: string, user: AuthenticatedUser): Promise<EmployeeDTO> {
    return inventoryItemsService.verifyEmployeeBelongsToCompany(employeeId, companyId, user);
  }

  async listCompanies(user: AuthenticatedUser): Promise<CompanyDTO[]> {
    return inventoryItemsService.listCompanies(user);
  }

  async listEmployees(companyId: string, search: string | undefined, user: AuthenticatedUser): Promise<EmployeeDTO[]> {
    return inventoryItemsService.listEmployees(companyId, search, user);
  }

  // --------------------------------------------------------------------------
  // Item Master CRUD & Deficit Sorting
  // --------------------------------------------------------------------------
  enrichStockStatus(item: InventoryItemDTO): InventoryItemDTO {
    return inventoryItemsService.enrichStockStatus(item);
  }

  async listItems(query: ListItemsQuery, user: AuthenticatedUser): Promise<InventoryItemDTO[]> {
    return inventoryItemsService.listItems(query, user);
  }

  async getItemDetail(itemId: string, companyId: string, user: AuthenticatedUser): Promise<{
    item: InventoryItemDTO;
    transactions: InventoryTransactionDTO[];
    issues: InventoryIssueDTO[];
  }> {
    return inventoryItemsService.getItemDetail(itemId, companyId, user);
  }

  async createItem(input: CreateInventoryItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<InventoryItemDTO> {
    return inventoryItemsService.createItem(input, user, request);
  }

  async updateItem(itemId: string, input: UpdateInventoryItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<InventoryItemDTO> {
    return inventoryItemsService.updateItem(itemId, input, user, request);
  }

  async retireItem(itemId: string, input: RetireInventoryItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<InventoryItemDTO> {
    return inventoryItemsService.retireItem(itemId, input, user, request);
  }

  async deleteItem(itemId: string, companyId: string, user: AuthenticatedUser, request?: FastifyRequest): Promise<{ deleted: boolean; message: string }> {
    return inventoryItemsService.deleteItem(itemId, companyId, user, request);
  }

  // --------------------------------------------------------------------------
  // Stock Movements & Lifecycle Transactions
  // --------------------------------------------------------------------------
  async recordPurchase(input: RecordPurchaseInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
    transaction: InventoryTransactionDTO;
  }> {
    return inventoryStockService.recordPurchase(input, user, request);
  }

  async issueItem(input: IssueItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
    issue: InventoryIssueDTO;
    transaction: InventoryTransactionDTO;
  }> {
    return inventoryStockService.issueItem(input, user, request);
  }

  async returnItem(input: ReturnItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
    issue: InventoryIssueDTO;
    transaction: InventoryTransactionDTO;
  }> {
    return inventoryStockService.returnItem(input, user, request);
  }

  async adjustStock(input: StockAdjustmentInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
    transaction: InventoryTransactionDTO;
  }> {
    return inventoryStockService.adjustStock(input, user, request);
  }

  async listTransactions(companyId: string, itemId?: string, transactionType?: string, user?: AuthenticatedUser): Promise<InventoryTransactionDTO[]> {
    return inventoryStockService.listTransactions(companyId, itemId, transactionType, user);
  }

  async listIssues(companyId: string, employeeId?: string, itemId?: string, status?: string, user?: AuthenticatedUser): Promise<InventoryIssueDTO[]> {
    return inventoryStockService.listIssues(companyId, employeeId, itemId, status, user);
  }

  // --------------------------------------------------------------------------
  // Management Analytics & Telemetry Dashboards
  // --------------------------------------------------------------------------
  async getAnalysisSummary(companyId: string, from?: string, to?: string, user?: AuthenticatedUser) {
    return inventoryAnalysisService.getAnalysisSummary(companyId, from, to, user);
  }

  async getMonthlyTrends(companyId: string, user?: AuthenticatedUser) {
    return inventoryAnalysisService.getMonthlyTrends(companyId, user);
  }

  async getCategoryCostAnalysis(companyId: string, from?: string, to?: string, user?: AuthenticatedUser) {
    return inventoryAnalysisService.getCategoryCostAnalysis(companyId, from, to, user);
  }

  async getTopConsumedItems(companyId: string, from?: string, to?: string, user?: AuthenticatedUser) {
    return inventoryAnalysisService.getTopConsumedItems(companyId, from, to, user);
  }

  async getDepartmentUsage(companyId: string, from?: string, to?: string, user?: AuthenticatedUser) {
    return inventoryAnalysisService.getDepartmentUsage(companyId, from, to, user);
  }

  async getEmployeeUsage(companyId: string, search?: string, user?: AuthenticatedUser) {
    return inventoryAnalysisService.getEmployeeUsage(companyId, search, user);
  }

  async getLowStockAnalysis(companyId: string, user?: AuthenticatedUser) {
    return inventoryAnalysisService.getLowStockAnalysis(companyId, user);
  }

  async getMachineToolStatus(companyId: string, user?: AuthenticatedUser) {
    return inventoryAnalysisService.getMachineToolStatus(companyId, user);
  }

  // --------------------------------------------------------------------------
  // Live Excel Spreadsheet Ledger
  // --------------------------------------------------------------------------
  async getLedgerSheet(companyId: string, sheetName: string, user: AuthenticatedUser) {
    return inventoryLedgerService.getLedgerSheet(companyId, sheetName, user);
  }

  async updateLedgerCell(input: LedgerCellUpdateInput, user: AuthenticatedUser, request?: FastifyRequest) {
    return inventoryLedgerService.updateLedgerCell(input, user, request);
  }

  async batchPasteRows(input: LedgerBatchPasteInput, user: AuthenticatedUser, request?: FastifyRequest) {
    return inventoryLedgerService.batchPasteRows(input, user, request);
  }
}

export const inventoryService = new InventoryService();
