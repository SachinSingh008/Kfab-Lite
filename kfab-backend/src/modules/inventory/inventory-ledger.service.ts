// ============================================================================
// KFAB360 — Inventory Live Spreadsheet Ledger Service
// Multi-Sheet Workspace Serializer, In-Cell Fast Updates & Batch Excel Pasting
// ============================================================================

import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from '../../middleware/auth.js';
import {
  LedgerCellUpdateInput,
  LedgerBatchPasteInput,
  UpdateInventoryItemInput,
} from './inventory.schema.js';
import {
  InventoryItemDTO,
  memoryItems,
} from './inventory.store.js';
import { inventoryItemsService } from './inventory-items.service.js';
import { inventoryStockService } from './inventory-stock.service.js';
import { inventoryAnalysisService } from './inventory-analysis.service.js';

export class InventoryLedgerService {
  /**
   * Get spreadsheet data by sheet name
   */
  async getLedgerSheet(companyId: string, sheetName: string, user: AuthenticatedUser): Promise<{
    sheetName: string;
    columns: string[];
    rows: any[];
  }> {
    await inventoryItemsService.verifyCompanyAccess(companyId, user);

    if (sheetName === 'consumables') {
      const items = await inventoryItemsService.listItems({ company_id: companyId, category: 'CONSUMABLES_TACKLES' }, user);
      return {
        sheetName: 'Consumables & Tackles',
        columns: ['Item Code', 'Item Name', 'Brand', 'Unit', 'Qty', 'Min Qty', 'Deficit', 'Price', 'Value', 'Status', 'Location'],
        rows: items.map((i) => ({
          id: i.id,
          item_code: i.itemCode,
          item_name: i.itemName,
          brand: i.brand || '-',
          unit: i.unit,
          current_quantity: i.currentQuantity,
          minimum_stock: i.minimumStock,
          stock_deficit: i.stockDeficit,
          purchase_price: i.purchasePrice,
          current_value: i.currentValue,
          stock_status: i.stockStatus,
          location: i.location || '-',
        })),
      };
    }

    if (sheetName === 'machines') {
      const items = await inventoryItemsService.listItems({ company_id: companyId, category: 'MACHINES_TOOLS' }, user);
      return {
        sheetName: 'Machines & Tools',
        columns: ['Item Code', 'Item Name', 'Brand', 'Type', 'Total Qty', 'Available', 'Issued', 'Maintenance', 'Damaged', 'Condition', 'Location'],
        rows: items.map((i) => ({
          id: i.id,
          item_code: i.itemCode,
          item_name: i.itemName,
          brand: i.brand || '-',
          item_type: i.itemType,
          current_quantity: i.currentQuantity,
          available_quantity: i.availableQuantity,
          issued_quantity: i.issuedQuantity,
          maintenance_quantity: i.maintenanceQuantity,
          damaged_quantity: i.damagedQuantity,
          condition: i.condition,
          location: i.location || '-',
        })),
      };
    }

    if (sheetName === 'safety') {
      const items = await inventoryItemsService.listItems({ company_id: companyId, category: 'CLOTHES_SAFETY' }, user);
      return {
        sheetName: 'Clothes & Safety',
        columns: ['Item Code', 'Item Name', 'Brand', 'Unit', 'Qty', 'Min Qty', 'Available', 'Issued', 'Price', 'Status'],
        rows: items.map((i) => ({
          id: i.id,
          item_code: i.itemCode,
          item_name: i.itemName,
          brand: i.brand || '-',
          unit: i.unit,
          current_quantity: i.currentQuantity,
          minimum_stock: i.minimumStock,
          available_quantity: i.availableQuantity,
          issued_quantity: i.issuedQuantity,
          purchase_price: i.purchasePrice,
          stock_status: i.stockStatus,
        })),
      };
    }

    if (sheetName === 'transactions') {
      const trans = await inventoryStockService.listTransactions(companyId, undefined, undefined, user);
      return {
        sheetName: 'Stock Transactions',
        columns: ['Date', 'Type', 'Item Code', 'Item Name', 'Qty', 'Unit Price', 'Total Cost', 'Employee', 'Department', 'Remarks'],
        rows: trans.map((t) => ({
          id: t.id,
          transaction_date: t.transactionDate,
          transaction_type: t.transactionType,
          item_code: t.itemCode,
          item_name: t.itemName,
          quantity: t.quantity,
          unit_price: t.unitPrice,
          total_price: t.totalPrice,
          employee: t.employeeName || '-',
          department: t.department || '-',
          remarks: t.remarks || '-',
        })),
      };
    }

    if (sheetName === 'issues') {
      const issues = await inventoryStockService.listIssues(companyId, undefined, undefined, undefined, user);
      return {
        sheetName: 'Issues & Accountability',
        columns: ['Issue Date', 'Item Code', 'Item Name', 'Issued To', 'Dept', 'Qty', 'Returned', 'Status', 'Condition', 'Issuer'],
        rows: issues.map((i) => ({
          id: i.id,
          issue_date: i.issueDate,
          item_code: i.itemCode,
          item_name: i.itemName,
          employee_name: i.employeeName,
          department: i.department || '-',
          quantity: i.quantity,
          returned_quantity: i.returnedQuantity,
          status: i.status,
          condition: i.conditionAtIssue,
          issuer_name: i.issuerName,
        })),
      };
    }

    const summary = await inventoryAnalysisService.getAnalysisSummary(companyId, undefined, undefined, user);
    return {
      sheetName: 'Analysis Summary',
      columns: ['Metric', 'Value'],
      rows: [
        { metric: 'Total Active Items', value: summary.totalItems },
        { metric: 'Total Stock Valuation', value: `₹${summary.totalStockValue.toLocaleString()}` },
        { metric: 'Low Stock Deficit Items', value: summary.lowStockCount },
        { metric: 'Out of Stock Items', value: summary.outOfStockCount },
        { metric: 'Currently Issued Items', value: summary.issuedItemsCount },
        { metric: 'Monthly Consumption Cost', value: `₹${summary.totalConsumptionCost.toLocaleString()}` },
        { metric: 'Monthly Purchases Inward', value: `₹${summary.monthlyPurchaseCost.toLocaleString()}` },
      ],
    };
  }

  /**
   * Update single cell in live Excel ledger
   */
  async updateLedgerCell(input: LedgerCellUpdateInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
  }> {
    await inventoryItemsService.verifyCompanyAccess(input.company_id, user);

    const index = memoryItems.findIndex((i) => i.id === input.item_id && i.companyId === input.company_id);
    if (index === -1) {
      throw new Error(`Inventory item not found (ID: ${input.item_id}).`);
    }

    const updateInput: UpdateInventoryItemInput = {
      company_id: input.company_id,
      [input.field]: input.value,
    };

    const updated = await inventoryItemsService.updateItem(input.item_id, updateInput, user, request);
    return { item: updated };
  }

  /**
   * Batch paste rows into inventory
   */
  async batchPasteRows(input: LedgerBatchPasteInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    totalProcessed: number;
    successfulCount: number;
    failedCount: number;
    items: InventoryItemDTO[];
    errors: Array<{ row: number; itemCode: string; error: string }>;
  }> {
    await inventoryItemsService.verifyCompanyAccess(input.company_id, user);

    const items: InventoryItemDTO[] = [];
    const errors: Array<{ row: number; itemCode: string; error: string }> = [];

    let rowIndex = 1;
    for (const row of input.rows) {
      try {
        const created = await inventoryItemsService.createItem(
          {
            company_id: input.company_id,
            category: input.category,
            item_code: row.item_code,
            item_name: row.item_name,
            brand: row.brand || null,
            model: row.model || null,
            unit: row.unit,
            opening_quantity: row.current_quantity || 0,
            minimum_stock: row.minimum_stock,
            purchase_price: row.purchase_price || 0,
            supplier: row.supplier || null,
            location: row.location || null,
            remarks: row.remarks || 'Pasted from Excel',
          },
          user,
          request
        );
        items.push(created);
      } catch (err: unknown) {
        errors.push({
          row: rowIndex,
          itemCode: row.item_code,
          error: err instanceof Error ? err.message : 'Invalid row data',
        });
      }
      rowIndex++;
    }

    return {
      totalProcessed: input.rows.length,
      successfulCount: items.length,
      failedCount: errors.length,
      items,
      errors,
    };
  }
}

export const inventoryLedgerService = new InventoryLedgerService();
