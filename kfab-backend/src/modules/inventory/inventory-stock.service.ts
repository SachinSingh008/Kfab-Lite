// ============================================================================
// KFAB360 — Inventory Stock Transactions Service
// Inward Purchases, Issue Workflows, Equipment Returns, Stock Adjustments
// ============================================================================

import { FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../db/supabase.js';
import { auditService } from '../audit/audit.service.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import {
  RecordPurchaseInput,
  IssueItemInput,
  ReturnItemInput,
  StockAdjustmentInput,
} from './inventory.schema.js';
import {
  InventoryItemDTO,
  InventoryTransactionDTO,
  InventoryIssueDTO,
  memoryItems,
  memoryTransactions,
  memoryIssues,
} from './inventory.store.js';
import { inventoryItemsService } from './inventory-items.service.js';

export class InventoryStockService {
  /**
   * Record Stock Purchase / Inward Receipt
   */
  async recordPurchase(input: RecordPurchaseInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
    transaction: InventoryTransactionDTO;
  }> {
    await inventoryItemsService.verifyCompanyAccess(input.company_id, user);

    const index = memoryItems.findIndex((i) => i.id === input.item_id && i.companyId === input.company_id);
    if (index === -1) {
      throw new Error(`Inventory item not found (ID: ${input.item_id}).`);
    }

    const item = memoryItems[index];
    if (item.status === 'RETIRED') {
      throw new Error(`Cannot record purchase for retired item [${item.itemCode}].`);
    }

    const newQty = Number((item.currentQuantity + input.quantity).toFixed(2));
    const newAvail = Number((item.availableQuantity + input.quantity).toFixed(2));
    const unitPrice = input.unit_price;
    const totalPrice = Number((input.quantity * unitPrice).toFixed(2));
    const newVal = Number((newQty * unitPrice).toFixed(2));
    const now = new Date().toISOString();

    const updatedItem: InventoryItemDTO = {
      ...item,
      currentQuantity: newQty,
      availableQuantity: newAvail,
      purchasePrice: unitPrice,
      currentValue: newVal,
      supplier: input.supplier || item.supplier,
      purchaseDate: input.purchase_date || new Date().toISOString().split('T')[0],
      updatedAt: now,
    };

    memoryItems[index] = inventoryItemsService.enrichStockStatus(updatedItem);

    const transaction: InventoryTransactionDTO = {
      id: crypto.randomUUID(),
      companyId: input.company_id,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      transactionType: 'PURCHASE',
      quantity: input.quantity,
      unitPrice,
      totalPrice,
      employeeId: null,
      department: 'Store',
      referenceId: input.reference_id || `PO-${Date.now().toString().slice(-6)}`,
      conditionState: 'Good',
      transactionDate: input.purchase_date || new Date().toISOString().split('T')[0],
      remarks: input.remarks || `Inward purchase batch from ${input.supplier || 'supplier'}`,
      createdBy: user.id,
      createdAt: now,
    };

    memoryTransactions.unshift(transaction);

    try {
      await supabaseAdmin.from('inventory_items').update({
        current_quantity: updatedItem.currentQuantity,
        available_quantity: updatedItem.availableQuantity,
        purchase_price: updatedItem.purchasePrice,
        current_value: updatedItem.currentValue,
        supplier: updatedItem.supplier,
        purchase_date: updatedItem.purchaseDate,
        updated_at: now,
      }).eq('id', item.id);

      await supabaseAdmin.from('inventory_transactions').insert({
        id: transaction.id,
        company_id: transaction.companyId,
        item_id: transaction.itemId,
        transaction_type: transaction.transactionType,
        quantity: transaction.quantity,
        unit_price: transaction.unitPrice,
        total_price: transaction.totalPrice,
        reference_id: transaction.referenceId,
        condition_state: transaction.conditionState,
        transaction_date: transaction.transactionDate,
        remarks: transaction.remarks,
        created_by: user.id,
        created_at: now,
      });
    } catch {
      // fallback
    }

    await auditService.log({
      actorId: user.id,
      action: 'INVENTORY_PURCHASE_RECORDED',
      module: 'INVENTORY',
      resourceType: 'INVENTORY_TRANSACTION',
      resourceId: transaction.id,
      description: `Recorded stock inward purchase of ${input.quantity} ${item.unit} for [${item.itemCode}] - ${item.itemName} at ₹${unitPrice}/unit`,
      newValues: { quantity: input.quantity, unitPrice, totalPrice, newStock: newQty },
      companyId: input.company_id,
      status: 'SUCCESS',
      correlationId: request?.correlationId,
    });

    return { item: memoryItems[index], transaction };
  }

  /**
   * Issue item to employee (Consumables, Machines, Tools, Safety equipment)
   */
  async issueItem(input: IssueItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
    issue: InventoryIssueDTO;
    transaction: InventoryTransactionDTO;
  }> {
    const employee = await inventoryItemsService.verifyEmployeeBelongsToCompany(input.employee_id, input.company_id, user);

    const index = memoryItems.findIndex((i) => i.id === input.item_id && i.companyId === input.company_id);
    if (index === -1) {
      throw new Error(`Inventory item not found (ID: ${input.item_id}).`);
    }

    const item = memoryItems[index];
    if (item.status !== 'ACTIVE') {
      throw new Error(`Cannot issue item [${item.itemCode}] because it is ${item.status}.`);
    }

    if (item.availableQuantity < input.quantity) {
      throw new Error(`Insufficient stock. Available: ${item.availableQuantity} ${item.unit}, Requested: ${input.quantity} ${item.unit}. Negative inventory is prohibited.`);
    }

    const now = new Date().toISOString();
    const issueDate = input.issue_date || new Date().toISOString().split('T')[0];

    let newCurrent = item.currentQuantity;
    const newAvailable = Number((item.availableQuantity - input.quantity).toFixed(2));
    let newIssued = item.issuedQuantity;

    if (item.isReturnable) {
      newIssued = Number((item.issuedQuantity + input.quantity).toFixed(2));
    } else {
      newCurrent = Number((item.currentQuantity - input.quantity).toFixed(2));
    }

    const updatedItem: InventoryItemDTO = {
      ...item,
      currentQuantity: newCurrent,
      availableQuantity: newAvailable,
      issuedQuantity: newIssued,
      currentValue: Number((newCurrent * item.purchasePrice).toFixed(2)),
      updatedAt: now,
    };

    memoryItems[index] = inventoryItemsService.enrichStockStatus(updatedItem);

    const issue: InventoryIssueDTO = {
      id: crypto.randomUUID(),
      companyId: input.company_id,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.employeeCode,
      department: employee.department,
      quantity: input.quantity,
      returnedQuantity: 0,
      outstandingQuantity: input.quantity,
      issuedBy: user.id,
      issuerName: user.name || 'Store Supervisor',
      issuedAt: now,
      issueDate,
      expectedReturnDate: input.expected_return_date || null,
      returnedAt: null,
      conditionAtIssue: input.condition_at_issue || 'Good',
      conditionAtReturn: null,
      status: 'ISSUED',
      remarks: input.remarks || `Issued to ${employee.name} (${employee.employeeCode})`,
      createdAt: now,
      updatedAt: now,
    };
    memoryIssues.unshift(issue);

    const transaction: InventoryTransactionDTO = {
      id: crypto.randomUUID(),
      companyId: input.company_id,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      transactionType: 'ISSUE',
      quantity: input.quantity,
      unitPrice: item.purchasePrice,
      totalPrice: Number((input.quantity * item.purchasePrice).toFixed(2)),
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.employeeCode,
      department: employee.department,
      referenceId: issue.id,
      conditionState: input.condition_at_issue || 'Good',
      transactionDate: issueDate,
      remarks: input.remarks || `Issued to ${employee.name} (${employee.employeeCode}) - ${employee.department}`,
      createdBy: user.id,
      createdAt: now,
    };
    memoryTransactions.unshift(transaction);

    try {
      await supabaseAdmin.from('inventory_items').update({
        current_quantity: updatedItem.currentQuantity,
        available_quantity: updatedItem.availableQuantity,
        issued_quantity: updatedItem.issuedQuantity,
        current_value: updatedItem.currentValue,
        updated_at: now,
      }).eq('id', item.id);

      await supabaseAdmin.from('inventory_issues').insert({
        id: issue.id,
        company_id: issue.companyId,
        item_id: issue.itemId,
        employee_id: issue.employeeId,
        quantity: issue.quantity,
        returned_quantity: 0,
        issued_by: user.id,
        issuer_name: issue.issuerName,
        issued_at: now,
        issue_date: issue.issueDate,
        expected_return_date: issue.expectedReturnDate,
        condition_at_issue: issue.conditionAtIssue,
        status: 'ISSUED',
        remarks: issue.remarks,
        created_at: now,
        updated_at: now,
      });

      await supabaseAdmin.from('inventory_transactions').insert({
        id: transaction.id,
        company_id: transaction.companyId,
        item_id: transaction.itemId,
        transaction_type: 'ISSUE',
        quantity: transaction.quantity,
        unit_price: transaction.unitPrice,
        total_price: transaction.totalPrice,
        employee_id: employee.id,
        department: employee.department,
        reference_id: issue.id,
        condition_state: transaction.conditionState,
        transaction_date: transaction.transactionDate,
        remarks: transaction.remarks,
        created_by: user.id,
        created_at: now,
      });
    } catch {
      // fallback
    }

    await auditService.log({
      actorId: user.id,
      action: 'INVENTORY_ISSUED',
      module: 'INVENTORY',
      resourceType: 'INVENTORY_ISSUE',
      resourceId: issue.id,
      description: `Issued ${input.quantity} ${item.unit} of [${item.itemCode}] - ${item.itemName} to employee ${employee.name} (${employee.employeeCode}) in ${employee.department}`,
      newValues: {
        itemId: item.id,
        employeeId: employee.id,
        quantity: input.quantity,
        issueDate,
        isReturnable: item.isReturnable,
      },
      companyId: input.company_id,
      status: 'SUCCESS',
      correlationId: request?.correlationId,
    });

    return { item: memoryItems[index], issue, transaction };
  }

  /**
   * Return issued item (Machines, Tools, Returnable PPE, Partial Returns)
   */
  async returnItem(input: ReturnItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
    issue: InventoryIssueDTO;
    transaction: InventoryTransactionDTO;
  }> {
    await inventoryItemsService.verifyCompanyAccess(input.company_id, user);

    const issueIndex = memoryIssues.findIndex((i) => i.id === input.issue_id && i.companyId === input.company_id);
    if (issueIndex === -1) {
      throw new Error(`Issue record not found (ID: ${input.issue_id}).`);
    }

    const issue = memoryIssues[issueIndex];
    const outstanding = Number((issue.quantity - issue.returnedQuantity).toFixed(2));

    if (input.return_quantity > outstanding) {
      throw new Error(`Return Validation Error: Cannot return ${input.return_quantity}. Outstanding unreturned quantity is only ${outstanding}.`);
    }

    const itemIndex = memoryItems.findIndex((i) => i.id === issue.itemId && i.companyId === input.company_id);
    if (itemIndex === -1) {
      throw new Error(`Inventory item not found (ID: ${issue.itemId}).`);
    }

    const item = memoryItems[itemIndex];
    const now = new Date().toISOString();
    const returnDate = input.return_date || new Date().toISOString().split('T')[0];

    const newReturnedQty = Number((issue.returnedQuantity + input.return_quantity).toFixed(2));
    const isFullReturn = newReturnedQty >= issue.quantity;

    let issueStatus: 'ISSUED' | 'PARTIALLY_RETURNED' | 'RETURNED' | 'DAMAGED' | 'LOST' = isFullReturn ? 'RETURNED' : 'PARTIALLY_RETURNED';
    if (input.condition_at_return === 'LOST') {
      issueStatus = 'LOST';
    } else if (input.condition_at_return === 'DAMAGED' && isFullReturn) {
      issueStatus = 'DAMAGED';
    }

    const updatedIssue: InventoryIssueDTO = {
      ...issue,
      returnedQuantity: newReturnedQty,
      outstandingQuantity: Number((issue.quantity - newReturnedQty).toFixed(2)),
      returnedAt: now,
      conditionAtReturn: input.condition_at_return,
      status: issueStatus,
      remarks: input.remarks ? `${issue.remarks ? issue.remarks + ' | ' : ''}Returned ${input.return_quantity} on ${returnDate} (${input.condition_at_return}): ${input.remarks}` : issue.remarks,
      updatedAt: now,
    };
    memoryIssues[issueIndex] = updatedIssue;

    let newAvail = item.availableQuantity;
    const newIssued = Math.max(0, Number((item.issuedQuantity - input.return_quantity).toFixed(2)));
    let newMaintenance = item.maintenanceQuantity;
    let newDamaged = item.damagedQuantity;
    let newLost = item.lostQuantity;
    let newCurrent = item.currentQuantity;

    let transactionType = 'RETURN';

    if (input.condition_at_return === 'GOOD') {
      newAvail = Number((item.availableQuantity + input.return_quantity).toFixed(2));
      transactionType = 'RETURN';
    } else if (input.condition_at_return === 'DAMAGED') {
      newDamaged = Number((item.damagedQuantity + input.return_quantity).toFixed(2));
      transactionType = 'DAMAGE';
    } else if (input.condition_at_return === 'UNDER_MAINTENANCE') {
      newMaintenance = Number((item.maintenanceQuantity + input.return_quantity).toFixed(2));
      transactionType = 'RETURN';
    } else if (input.condition_at_return === 'LOST') {
      newLost = Number((item.lostQuantity + input.return_quantity).toFixed(2));
      newCurrent = Math.max(0, Number((item.currentQuantity - input.return_quantity).toFixed(2)));
      transactionType = 'LOSS';
    }

    const updatedItem: InventoryItemDTO = {
      ...item,
      currentQuantity: newCurrent,
      availableQuantity: newAvail,
      issuedQuantity: newIssued,
      maintenanceQuantity: newMaintenance,
      damagedQuantity: newDamaged,
      lostQuantity: newLost,
      currentValue: Number((newCurrent * item.purchasePrice).toFixed(2)),
      updatedAt: now,
    };
    memoryItems[itemIndex] = inventoryItemsService.enrichStockStatus(updatedItem);

    const transaction: InventoryTransactionDTO = {
      id: crypto.randomUUID(),
      companyId: input.company_id,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      transactionType,
      quantity: input.return_quantity,
      unitPrice: item.purchasePrice,
      totalPrice: Number((input.return_quantity * item.purchasePrice).toFixed(2)),
      employeeId: issue.employeeId,
      employeeName: issue.employeeName,
      employeeCode: issue.employeeCode,
      department: issue.department || null,
      referenceId: issue.id,
      conditionState: input.condition_at_return,
      transactionDate: returnDate,
      remarks: input.remarks || `Returned by ${issue.employeeName} (${issue.employeeCode}) in ${input.condition_at_return} condition`,
      createdBy: user.id,
      createdAt: now,
    };
    memoryTransactions.unshift(transaction);

    try {
      await supabaseAdmin.from('inventory_items').update({
        current_quantity: updatedItem.currentQuantity,
        available_quantity: updatedItem.availableQuantity,
        issued_quantity: updatedItem.issuedQuantity,
        maintenance_quantity: updatedItem.maintenanceQuantity,
        damaged_quantity: updatedItem.damagedQuantity,
        lost_quantity: updatedItem.lostQuantity,
        current_value: updatedItem.currentValue,
        updated_at: now,
      }).eq('id', item.id);

      await supabaseAdmin.from('inventory_issues').update({
        returned_quantity: updatedIssue.returnedQuantity,
        returned_at: now,
        condition_at_return: updatedIssue.conditionAtReturn,
        status: updatedIssue.status,
        remarks: updatedIssue.remarks,
        updated_at: now,
      }).eq('id', issue.id);

      await supabaseAdmin.from('inventory_transactions').insert({
        id: transaction.id,
        company_id: transaction.companyId,
        item_id: transaction.itemId,
        transaction_type: transactionType,
        quantity: transaction.quantity,
        unit_price: transaction.unitPrice,
        total_price: transaction.totalPrice,
        employee_id: issue.employeeId,
        department: issue.department,
        reference_id: issue.id,
        condition_state: transaction.conditionState,
        transaction_date: transaction.transactionDate,
        remarks: transaction.remarks,
        created_by: user.id,
        created_at: now,
      });
    } catch {
      // fallback
    }

    await auditService.log({
      actorId: user.id,
      action: 'INVENTORY_RETURNED',
      module: 'INVENTORY',
      resourceType: 'INVENTORY_ISSUE',
      resourceId: issue.id,
      description: `Returned ${input.return_quantity} ${item.unit} of [${item.itemCode}] - ${item.itemName} from employee ${issue.employeeName}. Condition: ${input.condition_at_return}`,
      newValues: {
        returnQuantity: input.return_quantity,
        condition: input.condition_at_return,
        issueStatus: updatedIssue.status,
        availableQuantity: updatedItem.availableQuantity,
      },
      companyId: input.company_id,
      status: 'SUCCESS',
      correlationId: request?.correlationId,
    });

    return { item: memoryItems[itemIndex], issue: updatedIssue, transaction };
  }

  /**
   * Verified physical stock adjustment
   */
  async adjustStock(input: StockAdjustmentInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<{
    item: InventoryItemDTO;
    transaction: InventoryTransactionDTO;
  }> {
    await inventoryItemsService.verifyCompanyAccess(input.company_id, user);

    const index = memoryItems.findIndex((i) => i.id === input.item_id && i.companyId === input.company_id);
    if (index === -1) {
      throw new Error(`Inventory item not found (ID: ${input.item_id}).`);
    }

    const item = memoryItems[index];
    const now = new Date().toISOString();

    let newCurrent = item.currentQuantity;
    let newAvailable = item.availableQuantity;

    if (input.adjustment_type === 'ADJUSTMENT_IN') {
      newCurrent = Number((item.currentQuantity + input.quantity).toFixed(2));
      newAvailable = Number((item.availableQuantity + input.quantity).toFixed(2));
    } else {
      if (item.currentQuantity < input.quantity) {
        throw new Error(`Stock Adjustment Rejected: Current stock (${item.currentQuantity}) is less than downward adjustment (${input.quantity}). Negative stock is prohibited.`);
      }
      newCurrent = Number((item.currentQuantity - input.quantity).toFixed(2));
      newAvailable = Math.max(0, Number((item.availableQuantity - input.quantity).toFixed(2)));
    }

    const updatedItem: InventoryItemDTO = {
      ...item,
      currentQuantity: newCurrent,
      availableQuantity: newAvailable,
      currentValue: Number((newCurrent * item.purchasePrice).toFixed(2)),
      updatedAt: now,
    };
    memoryItems[index] = inventoryItemsService.enrichStockStatus(updatedItem);

    const transaction: InventoryTransactionDTO = {
      id: crypto.randomUUID(),
      companyId: input.company_id,
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      transactionType: input.adjustment_type,
      quantity: input.quantity,
      unitPrice: item.purchasePrice,
      totalPrice: Number((input.quantity * item.purchasePrice).toFixed(2)),
      employeeId: null,
      department: 'Store',
      referenceId: 'AUDIT-ADJUSTMENT',
      conditionState: 'Good',
      transactionDate: new Date().toISOString().split('T')[0],
      remarks: input.reason,
      createdBy: user.id,
      createdAt: now,
    };
    memoryTransactions.unshift(transaction);

    await auditService.log({
      actorId: user.id,
      action: 'INVENTORY_ADJUSTED',
      module: 'INVENTORY',
      resourceType: 'INVENTORY_TRANSACTION',
      resourceId: transaction.id,
      description: `Physical stock verification adjustment [${input.adjustment_type}] of ${input.quantity} ${item.unit} for [${item.itemCode}] - ${item.itemName}. Reason: ${input.reason}`,
      oldValues: { currentQuantity: item.currentQuantity, availableQuantity: item.availableQuantity },
      newValues: { currentQuantity: newCurrent, availableQuantity: newAvailable, reason: input.reason },
      companyId: input.company_id,
      status: 'SUCCESS',
      correlationId: request?.correlationId,
    });

    return { item: memoryItems[index], transaction };
  }

  /**
   * List transactions with filters
   */
  async listTransactions(companyId: string, itemId?: string, transactionType?: string, user?: AuthenticatedUser): Promise<InventoryTransactionDTO[]> {
    if (user) {
      await inventoryItemsService.verifyCompanyAccess(companyId, user);
    }
    let list = memoryTransactions.filter((t) => t.companyId === companyId);
    if (itemId) {
      list = list.filter((t) => t.itemId === itemId);
    }
    if (transactionType) {
      list = list.filter((t) => t.transactionType === transactionType);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * List issues with filters
   */
  async listIssues(companyId: string, employeeId?: string, itemId?: string, status?: string, user?: AuthenticatedUser): Promise<InventoryIssueDTO[]> {
    if (user) {
      await inventoryItemsService.verifyCompanyAccess(companyId, user);
    }
    let list = memoryIssues.filter((i) => i.companyId === companyId);
    if (employeeId) {
      list = list.filter((i) => i.employeeId === employeeId);
    }
    if (itemId) {
      list = list.filter((i) => i.itemId === itemId);
    }
    if (status) {
      list = list.filter((i) => i.status === status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const inventoryStockService = new InventoryStockService();
