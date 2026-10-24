import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

function createMockToken(
  role: string,
  id: string = '00000000-0000-0000-0000-000000000001',
  name: string = 'Test User',
  companyId?: string
): string {
  const payload = {
    sub: id,
    email: `${role.toLowerCase()}@kfab.in`,
    name,
    role,
    isSuperAdmin: role === 'SUPER_ADMIN',
    status: 'ACTIVE',
    companyId,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `kfab-dev-token-${encoded}`;
}

describe('KFab360 Inventory & Material Management Module Comprehensive Test Suite', () => {
  let app: FastifyInstance;
  let companyId: string;
  let employeeId1: string;
  let employeeId2: string;
  let createdItemId: string;
  let createdMachineId: string;
  let activeIssueId: string;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    // 1. Fetch authorized company
    const compRes = await app.inject({
      method: 'GET',
      url: '/api/v1/inventory/companies',
      headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
    });
    expect(compRes.statusCode).toBe(200);
    const compJson = compRes.json();
    expect(compJson.companies.length).toBeGreaterThan(0);
    companyId = compJson.companies[0].id;

    // 2. Fetch company employees
    const empRes = await app.inject({
      method: 'GET',
      url: `/api/v1/inventory/employees?company_id=${companyId}`,
      headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
    });
    expect(empRes.statusCode).toBe(200);
    const empJson = empRes.json();
    expect(empJson.employees.length).toBeGreaterThan(1);
    employeeId1 = empJson.employees[0].id;
    employeeId2 = empJson.employees[1].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Item Creation, Validation & Low-Stock Deficit Sorting', () => {
    it('1.1 Creates a new consumable inventory item', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/items',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_code: 'TEST-DISC-001',
          item_name: 'Test Flap Disc 4 inch 60 Grit',
          category: 'CONSUMABLES_TACKLES',
          subcategory: 'Grinding Consumables',
          brand: 'Norton',
          unit: 'Nos',
          opening_quantity: 20,
          minimum_stock: 50,
          purchase_price: 95.0,
          location: 'Bay 1 Store',
        },
      });
      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.item).toBeDefined();
      expect(json.item.itemCode).toBe('TEST-DISC-001');
      expect(json.item.currentQuantity).toBe(20);
      expect(json.item.minimumStock).toBe(50);
      expect(json.item.stockDeficit).toBe(30);
      expect(json.item.stockStatus).toBe('LOW_STOCK');
      createdItemId = json.item.id;
    });

    it('1.2 Prevents duplicate item codes within the same company', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/items',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_code: 'TEST-DISC-001',
          item_name: 'Duplicate Test Disc',
          category: 'CONSUMABLES_TACKLES',
          unit: 'Nos',
          minimum_stock: 10,
        },
      });
      expect(res.statusCode).toBe(409);
    });

    it('1.3 Prioritizes low-stock and out-of-stock items sorted by highest deficit first', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/items?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.items.length).toBeGreaterThan(0);

      // Verify that low stock items appear before normal stock items
      const lowOrOutIdx = json.items.findIndex(
        (i: any) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK'
      );
      const normalIdx = json.items.findIndex((i: any) => i.stockStatus === 'NORMAL');

      if (lowOrOutIdx !== -1 && normalIdx !== -1) {
        expect(lowOrOutIdx).toBeLessThan(normalIdx);
      }
    });

    it('1.4 Updates inventory item parameters and recalculates value', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/inventory/items/${createdItemId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_name: 'Updated Flap Disc Premium 60 Grit',
          purchase_price: 100.0,
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.item.itemName).toBe('Updated Flap Disc Premium 60 Grit');
      expect(json.item.purchasePrice).toBe(100.0);
      expect(json.item.currentValue).toBe(20 * 100.0);
    });
  });

  describe('2. Stock Movement: Purchases, Consumable Issues & Insufficient Stock Prevention', () => {
    it('2.1 Records a stock inward purchase and increases available quantity', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/purchase',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_id: createdItemId,
          quantity: 40,
          unit_price: 100.0,
          supplier: 'Industrial Fasteners & Abrasives',
          reference_id: 'INV-2026-9901',
          remarks: 'Restocking abrasive discs',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.item.currentQuantity).toBe(60); // 20 + 40
      expect(json.item.stockStatus).toBe('NORMAL'); // 60 >= 50
      expect(json.transaction.transactionType).toBe('PURCHASE');
      expect(json.transaction.quantity).toBe(40);
    });

    it('2.2 Issues consumable item to employee from authorized company roster', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/issue',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_id: createdItemId,
          employee_id: employeeId1,
          quantity: 5,
          remarks: 'Bevel grinding on plate girders',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.item.currentQuantity).toBe(55); // 60 - 5
      expect(json.issue.employeeId).toBe(employeeId1);
      expect(json.transaction.transactionType).toBe('ISSUE');
    });

    it('2.3 Prevents issuing stock when requested quantity exceeds available quantity', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/issue',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_id: createdItemId,
          employee_id: employeeId1,
          quantity: 999, // Exceeds available stock
        },
      });
      expect(res.statusCode).toBe(400);
      const json = res.json();
      expect(json.message).toContain('Insufficient stock');
    });

    it('2.4 Prevents issuing items to an employee not belonging to authorized company', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/issue',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_id: createdItemId,
          employee_id: 'e9999999-9999-9999-9999-999999999999', // Unknown/unauthorized employee
          quantity: 1,
        },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('3. Machine & Tool Lifecycle: Issue, Return, Damaged Equipment & Condition Tracking', () => {
    it('3.1 Creates a new power tool item', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/items',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_code: 'TEST-MAC-001',
          item_name: 'Test Magnetic Drill Machine 35mm',
          category: 'MACHINES_TOOLS',
          item_type: 'MACHINE',
          brand: 'Makita',
          unit: 'Nos',
          opening_quantity: 4,
          minimum_stock: 1,
          purchase_price: 45000.0,
          location: 'Tool Room Bay 2',
        },
      });
      expect(res.statusCode).toBe(201);
      const json = res.json();
      createdMachineId = json.item.id;
      expect(json.item.availableQuantity).toBe(4);
      expect(json.item.issuedQuantity).toBe(0);
    });

    it('3.2 Issues a returnable machine to personnel', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/issue',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_id: createdMachineId,
          employee_id: employeeId2,
          quantity: 2,
          condition_at_issue: 'Good',
          expected_return_date: '2026-10-10',
          remarks: 'Column base plate hole drilling',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.item.availableQuantity).toBe(2); // 4 - 2
      expect(json.item.issuedQuantity).toBe(2);
      expect(json.item.currentQuantity).toBe(4); // Current total remains 4 for returnables
      activeIssueId = json.issue.id;
    });

    it('3.3 Performs partial return of issued equipment in GOOD condition', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/return',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          issue_id: activeIssueId,
          return_quantity: 1,
          condition_at_return: 'GOOD',
          remarks: 'One drill machine returned in clean working order',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.issue.returnedQuantity).toBe(1);
      expect(json.issue.outstandingQuantity).toBe(1);
      expect(json.issue.status).toBe('PARTIALLY_RETURNED');
      expect(json.item.availableQuantity).toBe(3); // 2 + 1
      expect(json.item.issuedQuantity).toBe(1); // 2 - 1
    });

    it('3.4 Returns remaining unit as DAMAGED (does NOT increase available quantity)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/return',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          issue_id: activeIssueId,
          return_quantity: 1,
          condition_at_return: 'DAMAGED',
          remarks: 'Motor armature burnt out on site; sent for rewinding',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.issue.status).toBe('DAMAGED');
      expect(json.issue.returnedQuantity).toBe(2);
      expect(json.item.issuedQuantity).toBe(0);
      expect(json.item.damagedQuantity).toBe(1);
      // CRITICAL REQUIREMENT: Damaged items do NOT increase available stock!
      expect(json.item.availableQuantity).toBe(3);
    });

    it('3.5 Prevents returning more than the outstanding issued quantity', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/return',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          issue_id: activeIssueId,
          return_quantity: 5, // All units already returned
          condition_at_return: 'GOOD',
        },
      });
      expect(res.statusCode).toBe(400);
      const json = res.json();
      expect(json.message).toContain('Return Validation Error');
    });
  });

  describe('4. Item Retirement, Deletion Policy & Stock Adjustments', () => {
    it('4.1 Rejects physical deletion of items with transaction history', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/inventory/items/${createdItemId}?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(409);
      const json = res.json();
      expect(json.message).toContain('Policy Violation');
    });

    it('4.2 Retires item safely while preserving transaction and issue history', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/inventory/items/${createdItemId}/retire`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          reason: 'Item superseded by ceramic grain discs',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.item.status).toBe('RETIRED');
    });

    it('4.3 Performs verified physical stock adjustment with reason', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/adjust',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_id: createdMachineId,
          adjustment_type: 'ADJUSTMENT_IN',
          quantity: 1,
          reason: 'Physical quarterly stock verification found 1 extra unit',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.transaction.transactionType).toBe('ADJUSTMENT_IN');
      expect(json.item.currentQuantity).toBe(5); // 4 + 1
    });
  });

  describe('5. RBAC & Multi-Tenant Company Security Isolation', () => {
    it('5.1 Supervisor is permitted to add a machine/tool item', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/items',
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR')}` },
        payload: {
          company_id: companyId,
          item_code: 'SUP-TOOL-001',
          item_name: 'Supervisor Added Impact Wrench',
          category: 'MACHINES_TOOLS',
          brand: 'DeWalt',
          unit: 'Nos',
          minimum_stock: 1,
        },
      });
      expect(res.statusCode).toBe(201);
    });

    it('5.2 Supervisor is blocked from adding consumables (restricted to Machines & Tools)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/items',
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR')}` },
        payload: {
          company_id: companyId,
          item_code: 'SUP-CON-001',
          item_name: 'Unauthorized Consumable Rod',
          category: 'CONSUMABLES_TACKLES',
          unit: 'Kg',
          minimum_stock: 10,
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('5.3 Accountant is permitted to add a machine/tool item', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/items',
        headers: { authorization: `Bearer ${createMockToken('ACCOUNT')}` },
        payload: {
          company_id: companyId,
          item_code: 'ACC-MAC-001',
          item_name: 'Accountant Capitalized Radial Drill',
          category: 'MACHINES_TOOLS',
          brand: 'HMT',
          unit: 'Nos',
          minimum_stock: 1,
          purchase_price: 180000.0,
        },
      });
      expect(res.statusCode).toBe(201);
    });

    it('5.4 Rejects requests without valid authentication token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/items?company_id=${companyId}`,
      });
      expect(res.statusCode).toBe(401);
    });

    it('5.5 Prevents user with company restriction from querying another unauthorized company', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/inventory/items?company_id=d9999999-9999-9999-9999-999999999999',
        headers: { authorization: `Bearer ${createMockToken('ADMIN', '00000000-0000-0000-0000-000000000002', 'Admin 2', companyId)}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('6. Management Analytics & Dashboards', () => {
    it('6.1 Fetches analysis KPI summary cards', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/analysis/summary?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.summary).toBeDefined();
      expect(json.summary.totalItems).toBeGreaterThan(0);
      expect(json.summary.totalStockValue).toBeGreaterThan(0);
    });

    it('6.2 Fetches monthly consumption and purchase cost trends', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/analysis/trends?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.trends.length).toBeGreaterThanOrEqual(6);
    });

    it('6.3 Fetches category cost and valuation breakdown', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/analysis/categories?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.categories.length).toBe(3);
    });

    it('6.4 Fetches top 10 consumed items by quantity and by cost', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/analysis/top-items?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.byQuantity.length).toBeGreaterThan(0);
      expect(json.byCost.length).toBeGreaterThan(0);
    });

    it('6.5 Fetches department-wise and employee-wise consumption', async () => {
      const deptRes = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/analysis/departments?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(deptRes.statusCode).toBe(200);
      const deptJson = deptRes.json();
      expect(deptJson.departments.length).toBeGreaterThan(0);

      const empRes = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/analysis/employees?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(empRes.statusCode).toBe(200);
      const empJson = empRes.json();
      expect(empJson.employees.length).toBeGreaterThan(0);
    });

    it('6.6 Fetches dedicated low-stock replenishment deficit analysis', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/analysis/low-stock?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(Array.isArray(json.lowStock)).toBe(true);
    });

    it('6.7 Fetches machine and tool accountability breakdown', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/analysis/machines?company_id=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.totalMachinesTools).toBeGreaterThan(0);
      expect(json.items.length).toBeGreaterThan(0);
    });
  });

  describe('7. Excel-Like Spreadsheet Ledger Workspace & Cell Updating', () => {
    it('7.1 Retrieves spreadsheet workbook sheet for Consumables', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/inventory/ledger?company_id=${companyId}&sheet=consumables`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.sheetName).toBe('Consumables & Tackles');
      expect(json.columns).toContain('Item Code');
      expect(json.rows.length).toBeGreaterThan(0);
    });

    it('7.2 Updates a single cell in the live spreadsheet ledger via PATCH /ledger/cell', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/inventory/ledger/cell',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          item_id: createdMachineId,
          field: 'location',
          value: 'Plant 1 Central Tool Room Rack B',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.item.location).toBe('Plant 1 Central Tool Room Rack B');
    });

    it('7.3 Batch pastes multiple rows mimicking an Excel copy-paste workflow', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/inventory/ledger/batch',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: companyId,
          category: 'CONSUMABLES_TACKLES',
          rows: [
            {
              item_code: 'PST-WLD-001',
              item_name: 'Pasted MIG Wire ER70S-6 (1.2mm)',
              brand: 'D&H Secheron',
              unit: 'Kg',
              current_quantity: 250,
              minimum_stock: 100,
              purchase_price: 135.0,
            },
            {
              item_code: 'PST-GAS-001',
              item_name: 'Pasted Argon Gas Cylinder',
              brand: 'Inox Air',
              unit: 'Cylinder',
              current_quantity: 15,
              minimum_stock: 5,
              purchase_price: 1400.0,
            },
          ],
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.totalProcessed).toBe(2);
      expect(json.successfulCount).toBe(2);
      expect(json.failedCount).toBe(0);
    });
  });
});
