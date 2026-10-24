import { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  RetireInventoryItemSchema,
  RecordPurchaseSchema,
  IssueItemSchema,
  ReturnItemSchema,
  StockAdjustmentSchema,
  LedgerCellUpdateSchema,
  LedgerBatchPasteSchema,
  ListItemsQuerySchema,
  AnalysisQuerySchema,
} from './inventory.schema.js';
import { inventoryService } from './inventory.service.js';

export async function handleGetCompanies(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  try {
    const companies = await inventoryService.listCompanies(user);
    return reply.send({ statusCode: 200, companies });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch authorized companies';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetEmployees(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string; search?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const employees = await inventoryService.listEmployees(query.company_id, query.search, user);
    return reply.send({ statusCode: 200, employees });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch company employees';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleListItems(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = ListItemsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid query parameters',
      issues: parsed.error.issues,
    });
  }

  try {
    const items = await inventoryService.listItems(parsed.data, user);
    return reply.send({ statusCode: 200, items, total: items.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch inventory items';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetItemDetail(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const { id } = request.params as { id: string };
  const query = request.query as { company_id?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const detail = await inventoryService.getItemDetail(id, query.company_id, user);
    return reply.send({ statusCode: 200, ...detail });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch item details';
    const status = msg.includes('Access denied') ? 403 : 404;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Not Found', message: msg });
  }
}

export async function handleCreateItem(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = CreateInventoryItemSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid item payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const item = await inventoryService.createItem(parsed.data, user, request);
    return reply.status(201).send({ statusCode: 201, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create inventory item';
    const status = msg.includes('Access denied') ? 403 : msg.includes('already exists') ? 409 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : status === 409 ? 'Conflict' : 'Bad Request', message: msg });
  }
}

export async function handleUpdateItem(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const { id } = request.params as { id: string };
  const parsed = UpdateInventoryItemSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid update payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const item = await inventoryService.updateItem(id, parsed.data, user, request);
    return reply.send({ statusCode: 200, item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update inventory item';
    const status = msg.includes('Access denied') ? 403 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Bad Request', message: msg });
  }
}

export async function handleRetireItem(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const { id } = request.params as { id: string };
  const parsed = RetireInventoryItemSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid retire payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const item = await inventoryService.retireItem(id, parsed.data, user, request);
    return reply.send({ statusCode: 200, item, message: `Item [${item.itemCode}] has been safely retired from active service.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retire item';
    const status = msg.includes('Access denied') ? 403 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Bad Request', message: msg });
  }
}

export async function handleDeleteItem(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const { id } = request.params as { id: string };
  const query = request.query as { company_id?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const result = await inventoryService.deleteItem(id, query.company_id, user, request);
    return reply.send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete item';
    const status = msg.includes('Access denied') ? 403 : msg.includes('Policy Violation') ? 409 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : status === 409 ? 'Conflict' : 'Bad Request', message: msg });
  }
}

export async function handleRecordPurchase(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = RecordPurchaseSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid purchase payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await inventoryService.recordPurchase(parsed.data, user, request);
    return reply.send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to record purchase';
    const status = msg.includes('Access denied') ? 403 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Bad Request', message: msg });
  }
}

export async function handleIssueItem(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = IssueItemSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid issue payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await inventoryService.issueItem(parsed.data, user, request);
    return reply.send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to issue item';
    const status = msg.includes('Access denied') || msg.includes('Cross-company') ? 403 : msg.includes('Insufficient stock') ? 400 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Bad Request', message: msg });
  }
}

export async function handleReturnItem(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = ReturnItemSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid return payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await inventoryService.returnItem(parsed.data, user, request);
    return reply.send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to return item';
    const status = msg.includes('Access denied') ? 403 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Bad Request', message: msg });
  }
}

export async function handleAdjustStock(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = StockAdjustmentSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid adjustment payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await inventoryService.adjustStock(parsed.data, user, request);
    return reply.send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to adjust stock';
    const status = msg.includes('Access denied') ? 403 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Bad Request', message: msg });
  }
}

export async function handleListTransactions(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string; item_id?: string; transaction_type?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const transactions = await inventoryService.listTransactions(query.company_id, query.item_id, query.transaction_type, user);
    return reply.send({ statusCode: 200, transactions, total: transactions.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch transactions';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleListIssues(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string; employee_id?: string; item_id?: string; status?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const issues = await inventoryService.listIssues(query.company_id, query.employee_id, query.item_id, query.status, user);
    return reply.send({ statusCode: 200, issues, total: issues.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch issues';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

// ============================================================================
// ANALYSIS CONTROLLERS
// ============================================================================

export async function handleGetAnalysisSummary(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = AnalysisQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id is required' });
  }

  try {
    const summary = await inventoryService.getAnalysisSummary(parsed.data.company_id, parsed.data.from, parsed.data.to, user);
    return reply.send({ statusCode: 200, summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate analysis summary';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetMonthlyTrends(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const trends = await inventoryService.getMonthlyTrends(query.company_id, user);
    return reply.send({ statusCode: 200, trends });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch monthly trends';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetCategoryAnalysis(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = AnalysisQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id is required' });
  }

  try {
    const categories = await inventoryService.getCategoryCostAnalysis(parsed.data.company_id, parsed.data.from, parsed.data.to, user);
    return reply.send({ statusCode: 200, categories });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch category analysis';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetTopItems(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = AnalysisQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id is required' });
  }

  try {
    const topItems = await inventoryService.getTopConsumedItems(parsed.data.company_id, parsed.data.from, parsed.data.to, user);
    return reply.send({ statusCode: 200, ...topItems });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch top consumed items';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetDepartmentUsage(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = AnalysisQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id is required' });
  }

  try {
    const departments = await inventoryService.getDepartmentUsage(parsed.data.company_id, parsed.data.from, parsed.data.to, user);
    return reply.send({ statusCode: 200, departments });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch department usage';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetEmployeeUsage(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string; search?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const employees = await inventoryService.getEmployeeUsage(query.company_id, query.search, user);
    return reply.send({ statusCode: 200, employees });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch employee usage';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetLowStockAnalysis(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const lowStock = await inventoryService.getLowStockAnalysis(query.company_id, user);
    return reply.send({ statusCode: 200, lowStock });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch low stock analysis';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetMachineToolStatus(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const status = await inventoryService.getMachineToolStatus(query.company_id, user);
    return reply.send({ statusCode: 200, ...status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch machine and tool status';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

// ============================================================================
// EXCEL-LIKE SPREADSHEET LEDGER CONTROLLERS
// ============================================================================

export async function handleGetLedgerSheet(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string; sheet?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query param is required' });
  }

  try {
    const sheet = await inventoryService.getLedgerSheet(query.company_id, query.sheet || 'consumables', user);
    return reply.send({ statusCode: 200, ...sheet });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load ledger sheet';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleUpdateLedgerCell(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = LedgerCellUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid ledger cell payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await inventoryService.updateLedgerCell(parsed.data, user, request);
    return reply.send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update ledger cell';
    const status = msg.includes('Access denied') ? 403 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Bad Request', message: msg });
  }
}

export async function handleBatchPasteRows(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = LedgerBatchPasteSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid batch paste payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await inventoryService.batchPasteRows(parsed.data, user, request);
    return reply.send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to batch paste rows';
    const status = msg.includes('Access denied') ? 403 : 400;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Bad Request', message: msg });
  }
}
