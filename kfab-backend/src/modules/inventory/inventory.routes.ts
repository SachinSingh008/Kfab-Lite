import { FastifyInstance } from 'fastify';
import {
  handleGetCompanies,
  handleGetEmployees,
  handleListItems,
  handleGetItemDetail,
  handleCreateItem,
  handleUpdateItem,
  handleRetireItem,
  handleDeleteItem,
  handleRecordPurchase,
  handleIssueItem,
  handleReturnItem,
  handleAdjustStock,
  handleListTransactions,
  handleListIssues,
  handleGetAnalysisSummary,
  handleGetMonthlyTrends,
  handleGetCategoryAnalysis,
  handleGetTopItems,
  handleGetDepartmentUsage,
  handleGetEmployeeUsage,
  handleGetLowStockAnalysis,
  handleGetMachineToolStatus,
  handleGetLedgerSheet,
  handleUpdateLedgerCell,
  handleBatchPasteRows,
} from './inventory.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

export async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. Authorized Companies & Personnel
  fastify.get(
    '/companies',
    { preHandler: [requirePermission('inventory.view')] },
    handleGetCompanies
  );

  fastify.get(
    '/employees',
    { preHandler: [requirePermission('inventory.view')] },
    handleGetEmployees
  );

  // 2. Inventory Items Master Catalog
  fastify.get(
    '/items',
    { preHandler: [requirePermission('inventory.view')] },
    handleListItems
  );

  fastify.get(
    '/items/:id',
    { preHandler: [requirePermission('inventory.view')] },
    handleGetItemDetail
  );

  fastify.post(
    '/items',
    { preHandler: [requirePermission('inventory.create')] },
    handleCreateItem
  );

  fastify.put(
    '/items/:id',
    { preHandler: [requirePermission('inventory.update')] },
    handleUpdateItem
  );

  fastify.post(
    '/items/:id/retire',
    { preHandler: [requirePermission('inventory.retire')] },
    handleRetireItem
  );

  fastify.delete(
    '/items/:id',
    { preHandler: [requirePermission('inventory.retire')] },
    handleDeleteItem
  );

  // 3. Stock Operations (Purchases, Issues, Returns, Adjustments)
  fastify.post(
    '/purchase',
    { preHandler: [requirePermission('inventory.purchase')] },
    handleRecordPurchase
  );

  fastify.post(
    '/issue',
    { preHandler: [requirePermission('inventory.issue')] },
    handleIssueItem
  );

  fastify.post(
    '/return',
    { preHandler: [requirePermission('inventory.return')] },
    handleReturnItem
  );

  fastify.post(
    '/adjust',
    { preHandler: [requirePermission('inventory.stock_adjust')] },
    handleAdjustStock
  );

  fastify.get(
    '/transactions',
    { preHandler: [requirePermission('inventory.view')] },
    handleListTransactions
  );

  fastify.get(
    '/issues',
    { preHandler: [requirePermission('inventory.view')] },
    handleListIssues
  );

  // 4. Management Analytics & Dashboards
  fastify.get(
    '/analysis/summary',
    { preHandler: [requirePermission('inventory.view_analysis')] },
    handleGetAnalysisSummary
  );

  fastify.get(
    '/analysis/trends',
    { preHandler: [requirePermission('inventory.view_analysis')] },
    handleGetMonthlyTrends
  );

  fastify.get(
    '/analysis/categories',
    { preHandler: [requirePermission('inventory.view_analysis')] },
    handleGetCategoryAnalysis
  );

  fastify.get(
    '/analysis/top-items',
    { preHandler: [requirePermission('inventory.view_analysis')] },
    handleGetTopItems
  );

  fastify.get(
    '/analysis/departments',
    { preHandler: [requirePermission('inventory.view_analysis')] },
    handleGetDepartmentUsage
  );

  fastify.get(
    '/analysis/employees',
    { preHandler: [requirePermission('inventory.view_analysis')] },
    handleGetEmployeeUsage
  );

  fastify.get(
    '/analysis/low-stock',
    { preHandler: [requirePermission('inventory.view_analysis')] },
    handleGetLowStockAnalysis
  );

  fastify.get(
    '/analysis/machines',
    { preHandler: [requirePermission('inventory.view_analysis')] },
    handleGetMachineToolStatus
  );

  // 5. Excel-Like Spreadsheet Ledger Workspace
  fastify.get(
    '/ledger',
    { preHandler: [requirePermission('inventory.ledger.view')] },
    handleGetLedgerSheet
  );

  fastify.patch(
    '/ledger/cell',
    { preHandler: [requirePermission('inventory.ledger.update')] },
    handleUpdateLedgerCell
  );

  fastify.post(
    '/ledger/batch',
    { preHandler: [requirePermission('inventory.ledger.update')] },
    handleBatchPasteRows
  );
}
