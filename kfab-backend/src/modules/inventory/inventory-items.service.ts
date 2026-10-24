// ============================================================================
// KFAB360 — Inventory Items Master Service
// Item Catalog CRUD, Multi-Tenant Scoping, Deficit Calculations & Retirement
// ============================================================================

import { FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../../db/supabase.js';
import { auditService } from '../audit/audit.service.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  RetireInventoryItemInput,
  ListItemsQuery,
} from './inventory.schema.js';
import {
  InventoryItemDTO,
  InventoryTransactionDTO,
  InventoryIssueDTO,
  CompanyDTO,
  EmployeeDTO,
  memoryCompanies,
  memoryEmployees,
  memoryItems,
  memoryTransactions,
  memoryIssues,
} from './inventory.store.js';

export class InventoryItemsService {
  /**
   * Helper: Calculates stock deficit and status
   */
  enrichStockStatus(item: InventoryItemDTO): InventoryItemDTO {
    const deficit = Math.max(0, Number((item.minimumStock - item.currentQuantity).toFixed(2)));
    let status: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NORMAL' | 'OVERSTOCK' = 'NORMAL';

    if (item.currentQuantity <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (item.currentQuantity < item.minimumStock) {
      status = 'LOW_STOCK';
    } else if (item.maximumStock !== null && item.maximumStock !== undefined && item.currentQuantity > item.maximumStock) {
      status = 'OVERSTOCK';
    }

    return {
      ...item,
      stockDeficit: deficit,
      stockStatus: status,
    };
  }

  /**
   * Enforces server-side company authorization check.
   */
  async verifyCompanyAccess(companyId: string, user: AuthenticatedUser): Promise<CompanyDTO> {
    let company: CompanyDTO | undefined;
    try {
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      if (!error && data) {
        company = {
          id: data.id,
          name: data.name,
          code: data.code,
          isActive: data.is_active,
          createdAt: data.created_at,
        };
      }
    } catch {
      // fallback to memory
    }

    if (!company) {
      company = memoryCompanies.find((c) => c.id === companyId);
    }

    if (!company) {
      throw new Error(`Access denied: Company not found or unauthorized (ID: ${companyId}).`);
    }

    // If user has specific companyId and is not Super Admin, verify match
    if (!user.isSuperAdmin && user.role !== 'SUPER_ADMIN' && user.companyId && user.companyId !== companyId) {
      throw new Error(`Access denied: User is restricted to company ${user.companyId}. Cannot access company ${companyId}.`);
    }

    return company;
  }

  /**
   * Validates employee belongs strictly to authorized company roster.
   */
  async verifyEmployeeBelongsToCompany(employeeId: string, companyId: string, user: AuthenticatedUser): Promise<EmployeeDTO> {
    await this.verifyCompanyAccess(companyId, user);

    let employee: EmployeeDTO | undefined;
    try {
      const { data, error } = await supabaseAdmin
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();
      if (!error && data) {
        employee = {
          id: data.id,
          companyId: data.company_id,
          employeeCode: data.employee_code,
          name: data.name,
          department: data.department,
          designation: data.designation,
          phone: data.phone,
          isActive: data.is_active,
          createdAt: data.created_at,
        };
      }
    } catch {
      // fallback
    }

    if (!employee) {
      employee = memoryEmployees.find((e) => e.id === employeeId && e.companyId === companyId && e.isActive);
    }

    if (!employee) {
      throw new Error(`Validation Error: Employee (ID: ${employeeId}) does not belong to authorized company roster (Company ID: ${companyId}). Cross-company issue rejected.`);
    }

    return employee;
  }

  /**
   * List authorized companies
   */
  async listCompanies(user: AuthenticatedUser): Promise<CompanyDTO[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (!error && data && data.length > 0) {
        return data.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          isActive: c.is_active,
          createdAt: c.created_at,
        }));
      }
    } catch {
      // fallback
    }
    return memoryCompanies.filter((c) => c.isActive);
  }

  /**
   * List company employees
   */
  async listEmployees(companyId: string, search: string | undefined, user: AuthenticatedUser): Promise<EmployeeDTO[]> {
    await this.verifyCompanyAccess(companyId, user);
    let list: EmployeeDTO[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');
      if (!error && data && data.length > 0) {
        list = data.map((e) => ({
          id: e.id,
          companyId: e.company_id,
          employeeCode: e.employee_code,
          name: e.name,
          department: e.department,
          designation: e.designation,
          phone: e.phone,
          isActive: e.is_active,
          createdAt: e.created_at,
        }));
      }
    } catch {
      // fallback
    }

    if (list.length === 0) {
      list = memoryEmployees.filter((e) => e.companyId === companyId && e.isActive);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
    }
    return list;
  }

  /**
   * List inventory items with stock deficit calculation and priority sorting
   */
  async listItems(query: ListItemsQuery, user: AuthenticatedUser): Promise<InventoryItemDTO[]> {
    await this.verifyCompanyAccess(query.company_id, user);

    let items: InventoryItemDTO[] = [];
    try {
      let dbQuery = supabaseAdmin
        .from('inventory_items')
        .select('*')
        .eq('company_id', query.company_id)
        .neq('status', 'RETIRED');

      if (query.category) {
        dbQuery = dbQuery.eq('category', query.category);
      }
      if (query.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }

      const { data, error } = await dbQuery;
      if (!error && data && data.length > 0) {
        items = data.map((row) => ({
          id: row.id,
          companyId: row.company_id,
          itemCode: row.item_code,
          itemName: row.item_name,
          category: row.category,
          subcategory: row.subcategory,
          description: row.description,
          brand: row.brand,
          model: row.model,
          unit: row.unit,
          itemType: row.item_type,
          isReturnable: row.is_returnable,
          currentQuantity: Number(row.current_quantity),
          availableQuantity: Number(row.available_quantity),
          issuedQuantity: Number(row.issued_quantity),
          maintenanceQuantity: Number(row.maintenance_quantity),
          damagedQuantity: Number(row.damaged_quantity),
          lostQuantity: Number(row.lost_quantity),
          minimumStock: Number(row.minimum_stock),
          maximumStock: row.maximum_stock ? Number(row.maximum_stock) : null,
          stockDeficit: 0,
          stockStatus: 'NORMAL',
          purchasePrice: Number(row.purchase_price),
          currentValue: Number(row.current_value),
          supplier: row.supplier,
          purchaseDate: row.purchase_date,
          warranty: row.warranty,
          location: row.location,
          storageLocation: row.storage_location,
          condition: row.condition,
          status: row.status,
          remarks: row.remarks,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    } catch {
      // fallback
    }

    if (items.length === 0) {
      items = memoryItems.filter((i) => i.companyId === query.company_id && i.status !== 'RETIRED');
      if (query.category) {
        items = items.filter((i) => i.category === query.category);
      }
    }

    // Filter by search
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.itemCode.toLowerCase().includes(q) ||
          (i.brand && i.brand.toLowerCase().includes(q)) ||
          (i.model && i.model.toLowerCase().includes(q)) ||
          (i.subcategory && i.subcategory.toLowerCase().includes(q)) ||
          (i.supplier && i.supplier.toLowerCase().includes(q))
      );
    }

    if (query.brand && query.brand.trim()) {
      items = items.filter((i) => i.brand && i.brand.toLowerCase() === query.brand!.trim().toLowerCase());
    }

    // Enrich stock deficit and status
    const enriched = items.map((item) => this.enrichStockStatus(item));

    // Priority sorting
    const sortBy = query.sort_by || 'stock_priority';
    const sortOrder = query.sort_order || 'desc';

    enriched.sort((a, b) => {
      if (sortBy === 'stock_priority') {
        const statusRank: Record<string, number> = {
          OUT_OF_STOCK: 4,
          LOW_STOCK: 3,
          NORMAL: 2,
          OVERSTOCK: 1,
        };

        const rankDiff = statusRank[b.stockStatus] - statusRank[a.stockStatus];
        if (rankDiff !== 0) return rankDiff;

        if (b.stockDeficit !== a.stockDeficit) {
          return b.stockDeficit - a.stockDeficit;
        }
        return a.itemName.localeCompare(b.itemName);
      }

      if (sortBy === 'deficit') {
        return sortOrder === 'desc' ? b.stockDeficit - a.stockDeficit : a.stockDeficit - b.stockDeficit;
      }
      if (sortBy === 'quantity') {
        return sortOrder === 'desc' ? b.currentQuantity - a.currentQuantity : a.currentQuantity - b.currentQuantity;
      }
      if (sortBy === 'price') {
        return sortOrder === 'desc' ? b.purchasePrice - a.purchasePrice : a.purchasePrice - b.purchasePrice;
      }
      if (sortBy === 'code') {
        return sortOrder === 'desc' ? b.itemCode.localeCompare(a.itemCode) : a.itemCode.localeCompare(b.itemCode);
      }
      return sortOrder === 'desc' ? b.itemName.localeCompare(a.itemName) : a.itemName.localeCompare(b.itemName);
    });

    return enriched;
  }

  /**
   * Get single item detail with stock history, issues, transactions
   */
  async getItemDetail(itemId: string, companyId: string, user: AuthenticatedUser): Promise<{
    item: InventoryItemDTO;
    transactions: InventoryTransactionDTO[];
    issues: InventoryIssueDTO[];
  }> {
    await this.verifyCompanyAccess(companyId, user);

    let item: InventoryItemDTO | undefined;
    const items = await this.listItems({ company_id: companyId }, user);
    item = items.find((i) => i.id === itemId);

    if (!item) {
      item = memoryItems.find((i) => i.id === itemId && i.companyId === companyId);
      if (item) {
        item = this.enrichStockStatus(item);
      }
    }

    if (!item) {
      throw new Error(`Inventory item not found (ID: ${itemId}).`);
    }

    const transactions = memoryTransactions
      .filter((t) => t.itemId === itemId && t.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const issues = memoryIssues
      .filter((i) => i.itemId === itemId && i.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { item, transactions, issues };
  }

  /**
   * Create inventory item
   */
  async createItem(input: CreateInventoryItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<InventoryItemDTO> {
    await this.verifyCompanyAccess(input.company_id, user);

    // RBAC: Supervisor or Accountant can add machines/tools; Admins can add all categories
    if ((user.role === 'SUPERVISOR' || user.role === 'ACCOUNT' || user.role === 'ACCOUNTANT') && !user.isSuperAdmin) {
      if (input.category !== 'MACHINES_TOOLS') {
        throw new Error(`Access denied: Role [${user.role}] is only authorized to add Machines & Tools.`);
      }
    }

    // Check duplicate item code in company
    const existing = memoryItems.find(
      (i) => i.companyId === input.company_id && i.itemCode.toLowerCase() === input.item_code.trim().toLowerCase() && i.status !== 'RETIRED'
    );
    if (existing) {
      throw new Error(`Item code "${input.item_code}" already exists in company inventory. Duplicate codes are rejected.`);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const openQty = input.opening_quantity || 0;
    const price = input.purchase_price || 0;
    const totalVal = openQty * price;

    const isReturnable =
      input.is_returnable !== undefined
        ? input.is_returnable
        : input.category === 'MACHINES_TOOLS' || input.item_type === 'MACHINE' || input.item_type === 'TOOL' || input.item_type === 'RETURNABLE';

    const newItem: InventoryItemDTO = {
      id,
      companyId: input.company_id,
      itemCode: input.item_code.trim().toUpperCase(),
      itemName: input.item_name.trim(),
      category: input.category,
      subcategory: input.subcategory || null,
      description: input.description || null,
      brand: input.brand?.trim() || null,
      model: input.model?.trim() || null,
      unit: input.unit.trim(),
      itemType: input.item_type || (input.category === 'MACHINES_TOOLS' ? 'MACHINE' : input.category === 'CLOTHES_SAFETY' ? 'SAFETY_ITEM' : 'CONSUMABLE'),
      isReturnable,
      currentQuantity: openQty,
      availableQuantity: openQty,
      issuedQuantity: 0,
      maintenanceQuantity: 0,
      damagedQuantity: 0,
      lostQuantity: 0,
      minimumStock: input.minimum_stock,
      maximumStock: input.maximum_stock || null,
      stockDeficit: Math.max(0, input.minimum_stock - openQty),
      stockStatus: openQty <= 0 ? 'OUT_OF_STOCK' : openQty < input.minimum_stock ? 'LOW_STOCK' : 'NORMAL',
      purchasePrice: price,
      currentValue: totalVal,
      supplier: input.supplier?.trim() || null,
      purchaseDate: input.purchase_date || null,
      warranty: input.warranty?.trim() || null,
      location: input.location?.trim() || null,
      storageLocation: input.storage_location?.trim() || null,
      condition: input.condition || 'GOOD',
      status: input.status || 'ACTIVE',
      remarks: input.remarks || null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await supabaseAdmin.from('inventory_items').insert({
        id: newItem.id,
        company_id: newItem.companyId,
        item_code: newItem.itemCode,
        item_name: newItem.itemName,
        category: newItem.category,
        subcategory: newItem.subcategory,
        description: newItem.description,
        brand: newItem.brand,
        model: newItem.model,
        unit: newItem.unit,
        item_type: newItem.itemType,
        is_returnable: newItem.isReturnable,
        current_quantity: newItem.currentQuantity,
        available_quantity: newItem.availableQuantity,
        issued_quantity: newItem.issuedQuantity,
        maintenance_quantity: newItem.maintenanceQuantity,
        damaged_quantity: newItem.damagedQuantity,
        lost_quantity: newItem.lostQuantity,
        minimum_stock: newItem.minimumStock,
        maximum_stock: newItem.maximumStock,
        purchase_price: newItem.purchasePrice,
        current_value: newItem.currentValue,
        supplier: newItem.supplier,
        purchase_date: newItem.purchaseDate,
        warranty: newItem.warranty,
        location: newItem.location,
        storage_location: newItem.storageLocation,
        condition: newItem.condition,
        status: newItem.status,
        remarks: newItem.remarks,
        created_by: user.id,
        updated_by: user.id,
        created_at: now,
        updated_at: now,
      });
    } catch {
      // fallback to memory
    }

    memoryItems.unshift(newItem);

    if (openQty > 0) {
      const trans: InventoryTransactionDTO = {
        id: crypto.randomUUID(),
        companyId: input.company_id,
        itemId: newItem.id,
        itemCode: newItem.itemCode,
        itemName: newItem.itemName,
        category: newItem.category,
        transactionType: 'OPENING',
        quantity: openQty,
        unitPrice: price,
        totalPrice: totalVal,
        employeeId: null,
        department: 'Store',
        referenceId: 'OPENING-STOCK',
        conditionState: newItem.condition,
        transactionDate: input.purchase_date || new Date().toISOString().split('T')[0],
        remarks: 'Opening inventory stock balance recorded',
        createdBy: user.id,
        createdAt: now,
      };
      memoryTransactions.unshift(trans);
    }

    await auditService.log({
      actorId: user.id,
      action: 'INVENTORY_ITEM_CREATED',
      module: 'INVENTORY',
      resourceType: 'INVENTORY_ITEM',
      resourceId: newItem.id,
      description: `Created inventory item [${newItem.itemCode}] - ${newItem.itemName} (${newItem.category}) with initial quantity ${openQty} ${newItem.unit}`,
      newValues: { ...newItem },
      companyId: input.company_id,
      status: 'SUCCESS',
      correlationId: request?.correlationId,
    });

    return newItem;
  }

  /**
   * Update inventory item
   */
  async updateItem(itemId: string, input: UpdateInventoryItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<InventoryItemDTO> {
    await this.verifyCompanyAccess(input.company_id, user);

    const index = memoryItems.findIndex((i) => i.id === itemId && i.companyId === input.company_id);
    if (index === -1) {
      throw new Error(`Inventory item not found for update (ID: ${itemId}).`);
    }

    const current = memoryItems[index];
    const oldValues = { ...current };

    if ((user.role === 'SUPERVISOR' || user.role === 'ACCOUNT' || user.role === 'ACCOUNTANT') && !user.isSuperAdmin) {
      if (current.category !== 'MACHINES_TOOLS') {
        throw new Error(`Access denied: Role [${user.role}] can only update Machines & Tools.`);
      }
    }

    const price = input.purchase_price !== undefined ? input.purchase_price : current.purchasePrice;
    const minStock = input.minimum_stock !== undefined ? input.minimum_stock : current.minimumStock;
    const maxStock = input.maximum_stock !== undefined ? input.maximum_stock : current.maximumStock;

    const updated: InventoryItemDTO = {
      ...current,
      itemName: input.item_name !== undefined ? input.item_name.trim() : current.itemName,
      category: input.category || current.category,
      subcategory: input.subcategory !== undefined ? input.subcategory : current.subcategory,
      description: input.description !== undefined ? input.description : current.description,
      brand: input.brand !== undefined ? input.brand : current.brand,
      model: input.model !== undefined ? input.model : current.model,
      unit: input.unit || current.unit,
      itemType: input.item_type || current.itemType,
      isReturnable: input.is_returnable !== undefined ? input.is_returnable : current.isReturnable,
      minimumStock: minStock,
      maximumStock: maxStock,
      purchasePrice: price,
      currentValue: current.currentQuantity * price,
      supplier: input.supplier !== undefined ? input.supplier : current.supplier,
      purchaseDate: input.purchase_date !== undefined ? input.purchase_date : current.purchaseDate,
      warranty: input.warranty !== undefined ? input.warranty : current.warranty,
      location: input.location !== undefined ? input.location : current.location,
      storageLocation: input.storage_location !== undefined ? input.storage_location : current.storageLocation,
      condition: input.condition || current.condition,
      status: input.status || current.status,
      remarks: input.remarks !== undefined ? input.remarks : current.remarks,
      updatedAt: new Date().toISOString(),
    };

    const enriched = this.enrichStockStatus(updated);
    memoryItems[index] = enriched;

    try {
      await supabaseAdmin.from('inventory_items').update({
        item_name: enriched.itemName,
        category: enriched.category,
        subcategory: enriched.subcategory,
        description: enriched.description,
        brand: enriched.brand,
        model: enriched.model,
        unit: enriched.unit,
        item_type: enriched.itemType,
        is_returnable: enriched.isReturnable,
        minimum_stock: enriched.minimumStock,
        maximum_stock: enriched.maximumStock,
        purchase_price: enriched.purchasePrice,
        current_value: enriched.currentValue,
        supplier: enriched.supplier,
        purchase_date: enriched.purchaseDate,
        warranty: enriched.warranty,
        location: enriched.location,
        storage_location: enriched.storageLocation,
        condition: enriched.condition,
        status: enriched.status,
        remarks: enriched.remarks,
        updated_by: user.id,
        updated_at: enriched.updatedAt,
      }).eq('id', itemId);
    } catch {
      // fallback
    }

    await auditService.log({
      actorId: user.id,
      action: 'INVENTORY_ITEM_UPDATED',
      module: 'INVENTORY',
      resourceType: 'INVENTORY_ITEM',
      resourceId: itemId,
      description: `Updated inventory item [${enriched.itemCode}] - ${enriched.itemName}`,
      oldValues,
      newValues: { ...enriched },
      companyId: input.company_id,
      status: 'SUCCESS',
      correlationId: request?.correlationId,
    });

    return enriched;
  }

  /**
   * Retire inventory item (Preserves historical transactions & issue records)
   */
  async retireItem(itemId: string, input: RetireInventoryItemInput, user: AuthenticatedUser, request?: FastifyRequest): Promise<InventoryItemDTO> {
    await this.verifyCompanyAccess(input.company_id, user);

    const index = memoryItems.findIndex((i) => i.id === itemId && i.companyId === input.company_id);
    if (index === -1) {
      throw new Error(`Inventory item not found (ID: ${itemId}).`);
    }

    const current = memoryItems[index];

    if ((user.role === 'SUPERVISOR' || user.role === 'ACCOUNT' || user.role === 'ACCOUNTANT') && !user.isSuperAdmin) {
      if (current.category !== 'MACHINES_TOOLS') {
        throw new Error(`Access denied: Role [${user.role}] is only authorized to retire/remove Machines & Tools.`);
      }
    }

    if (current.issuedQuantity > 0) {
      throw new Error(`Operation Rejected: Cannot retire item while ${current.issuedQuantity} ${current.unit} is currently issued to personnel. Return items first.`);
    }

    const retired: InventoryItemDTO = {
      ...current,
      status: 'RETIRED',
      condition: 'RETIRED',
      remarks: `${current.remarks ? current.remarks + ' | ' : ''}Retired on ${new Date().toISOString().split('T')[0]}: ${input.reason}`,
      updatedAt: new Date().toISOString(),
    };

    memoryItems[index] = retired;

    try {
      await supabaseAdmin.from('inventory_items').update({
        status: 'RETIRED',
        condition: 'RETIRED',
        remarks: retired.remarks,
        updated_by: user.id,
        updated_at: retired.updatedAt,
      }).eq('id', itemId);
    } catch {
      // fallback
    }

    await auditService.log({
      actorId: user.id,
      action: 'INVENTORY_ITEM_RETIRED',
      module: 'INVENTORY',
      resourceType: 'INVENTORY_ITEM',
      resourceId: itemId,
      description: `Retired inventory item [${retired.itemCode}] - ${retired.itemName}. Reason: ${input.reason}`,
      oldValues: { status: current.status, condition: current.condition },
      newValues: { status: 'RETIRED', condition: 'RETIRED', reason: input.reason },
      companyId: input.company_id,
      status: 'SUCCESS',
      correlationId: request?.correlationId,
    });

    return retired;
  }

  /**
   * Delete item (Permanent delete allowed ONLY if no transaction/issue history exists)
   */
  async deleteItem(itemId: string, companyId: string, user: AuthenticatedUser, request?: FastifyRequest): Promise<{ deleted: boolean; message: string }> {
    await this.verifyCompanyAccess(companyId, user);

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      throw new Error('Access denied: Permanent deletion requires Admin or Super Admin authority.');
    }

    const index = memoryItems.findIndex((i) => i.id === itemId && i.companyId === companyId);
    if (index === -1) {
      throw new Error(`Inventory item not found (ID: ${itemId}).`);
    }

    const current = memoryItems[index];

    const hasTransactions = memoryTransactions.some((t) => t.itemId === itemId);
    const hasIssues = memoryIssues.some((i) => i.itemId === itemId);

    if (hasTransactions || hasIssues) {
      throw new Error(`Policy Violation: Cannot delete item [${current.itemCode}] because historical stock transactions or issue records exist. Please use RETIRE / DEACTIVATE instead to preserve financial and audit trails.`);
    }

    memoryItems.splice(index, 1);

    try {
      await supabaseAdmin.from('inventory_items').delete().eq('id', itemId);
    } catch {
      // fallback
    }

    await auditService.log({
      actorId: user.id,
      action: 'INVENTORY_ITEM_DELETED',
      module: 'INVENTORY',
      resourceType: 'INVENTORY_ITEM',
      resourceId: itemId,
      description: `Permanently deleted unused inventory item [${current.itemCode}] - ${current.itemName}`,
      oldValues: { ...current },
      companyId,
      status: 'SUCCESS',
      correlationId: request?.correlationId,
    });

    return { deleted: true, message: `Inventory item ${current.itemCode} permanently deleted.` };
  }
}

export const inventoryItemsService = new InventoryItemsService();
