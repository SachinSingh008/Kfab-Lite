import { z } from 'zod';

export const InventoryCategoryEnum = z.enum([
  'CONSUMABLES_TACKLES',
  'MACHINES_TOOLS',
  'CLOTHES_SAFETY',
]);
export type InventoryCategory = z.infer<typeof InventoryCategoryEnum>;

export const ItemTypeEnum = z.enum([
  'CONSUMABLE',
  'RETURNABLE',
  'MACHINE',
  'TOOL',
  'CLOTHING',
  'SAFETY_ITEM',
]);
export type ItemType = z.infer<typeof ItemTypeEnum>;

export const ItemConditionEnum = z.enum([
  'GOOD',
  'DAMAGED',
  'UNDER_MAINTENANCE',
  'LOST',
  'RETIRED',
]);
export type ItemCondition = z.infer<typeof ItemConditionEnum>;

export const ItemStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'RETIRED']);
export type ItemStatus = z.infer<typeof ItemStatusEnum>;

export const TransactionTypeEnum = z.enum([
  'OPENING',
  'PURCHASE',
  'ISSUE',
  'RETURN',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'DAMAGE',
  'LOSS',
]);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const IssueStatusEnum = z.enum([
  'ISSUED',
  'PARTIALLY_RETURNED',
  'RETURNED',
  'DAMAGED',
  'LOST',
]);
export type IssueStatus = z.infer<typeof IssueStatusEnum>;

// 1. Create Inventory Item
export const CreateInventoryItemSchema = z.object({
  company_id: z.string().uuid({ message: 'Valid company UUID is required' }),
  item_name: z.string().min(2, { message: 'Item name must be at least 2 characters' }),
  item_code: z.string().min(2, { message: 'Item code must be at least 2 characters' }),
  category: InventoryCategoryEnum,
  subcategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  unit: z.string().min(1, { message: 'Unit is required (e.g. Nos, Kg, Meter, Pair)' }),
  item_type: ItemTypeEnum.optional(),
  is_returnable: z.boolean().optional(),
  opening_quantity: z.number().min(0, { message: 'Opening quantity cannot be negative' }).optional(),
  minimum_stock: z.number().min(0, { message: 'Minimum stock cannot be negative' }),
  maximum_stock: z.number().min(0).optional().nullable(),
  purchase_price: z.number().min(0, { message: 'Purchase price cannot be negative' }).optional(),
  supplier: z.string().optional().nullable(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date format must be YYYY-MM-DD' }).optional().nullable(),
  warranty: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  storage_location: z.string().optional().nullable(),
  condition: ItemConditionEnum.optional(),
  status: ItemStatusEnum.optional(),
  remarks: z.string().optional().nullable(),
});
export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;

// 2. Update Inventory Item
export const UpdateInventoryItemSchema = z.object({
  company_id: z.string().uuid({ message: 'Valid company UUID is required' }),
  item_name: z.string().min(2).optional(),
  category: InventoryCategoryEnum.optional(),
  subcategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  unit: z.string().min(1).optional(),
  item_type: ItemTypeEnum.optional(),
  is_returnable: z.boolean().optional(),
  minimum_stock: z.number().min(0).optional(),
  maximum_stock: z.number().min(0).optional().nullable(),
  purchase_price: z.number().min(0).optional(),
  supplier: z.string().optional().nullable(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  warranty: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  storage_location: z.string().optional().nullable(),
  condition: ItemConditionEnum.optional(),
  status: ItemStatusEnum.optional(),
  remarks: z.string().optional().nullable(),
});
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>;

// 3. Retire Item (Soft Delete preserving historical transactions)
export const RetireInventoryItemSchema = z.object({
  company_id: z.string().uuid(),
  reason: z.string().min(3, { message: 'A retirement reason of at least 3 characters is required' }),
});
export type RetireInventoryItemInput = z.infer<typeof RetireInventoryItemSchema>;

// 4. Record Stock Purchase / Inward
export const RecordPurchaseSchema = z.object({
  company_id: z.string().uuid(),
  item_id: z.string().uuid(),
  quantity: z.number().positive({ message: 'Purchase quantity must be greater than 0' }),
  unit_price: z.number().min(0, { message: 'Unit price cannot be negative' }),
  supplier: z.string().optional().nullable(),
  reference_id: z.string().optional().nullable(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  remarks: z.string().optional().nullable(),
});
export type RecordPurchaseInput = z.infer<typeof RecordPurchaseSchema>;

// 5. Issue Item (Consumables, Machines, Tools, Safety Items)
export const IssueItemSchema = z.object({
  company_id: z.string().uuid(),
  item_id: z.string().uuid(),
  employee_id: z.string().uuid({ message: 'Valid employee ID from authorized company roster is required' }),
  quantity: z.number().positive({ message: 'Issue quantity must be greater than 0' }),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expected_return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  condition_at_issue: z.string().optional().default('Good'),
  remarks: z.string().optional().nullable(),
});
export type IssueItemInput = z.infer<typeof IssueItemSchema>;

// 6. Return Item (Supports Partial Returns and Condition Classification)
export const ReturnItemSchema = z.object({
  issue_id: z.string().uuid(),
  company_id: z.string().uuid(),
  return_quantity: z.number().positive({ message: 'Return quantity must be greater than 0' }),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  condition_at_return: z.enum(['GOOD', 'DAMAGED', 'UNDER_MAINTENANCE', 'LOST']),
  remarks: z.string().optional().nullable(),
});
export type ReturnItemInput = z.infer<typeof ReturnItemSchema>;

// 7. Stock Adjustment (Physical Stock Verification)
export const StockAdjustmentSchema = z.object({
  company_id: z.string().uuid(),
  item_id: z.string().uuid(),
  adjustment_type: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT']),
  quantity: z.number().positive({ message: 'Adjustment quantity must be greater than 0' }),
  reason: z.string().min(5, { message: 'A verification reason (minimum 5 chars) is mandatory for stock adjustments' }),
});
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

// 8. Excel-Like Ledger Cell Update
export const LedgerCellUpdateSchema = z.object({
  company_id: z.string().uuid(),
  item_id: z.string().uuid(),
  field: z.enum([
    'item_name',
    'subcategory',
    'brand',
    'model',
    'unit',
    'minimum_stock',
    'maximum_stock',
    'purchase_price',
    'supplier',
    'location',
    'storage_location',
    'remarks',
  ]),
  value: z.any(),
});
export type LedgerCellUpdateInput = z.infer<typeof LedgerCellUpdateSchema>;

// 9. Excel-Like Batch Paste Rows
export const LedgerBatchPasteSchema = z.object({
  company_id: z.string().uuid(),
  category: InventoryCategoryEnum,
  rows: z.array(
    z.object({
      item_code: z.string().min(2),
      item_name: z.string().min(2),
      brand: z.string().optional().nullable(),
      model: z.string().optional().nullable(),
      unit: z.string().min(1),
      current_quantity: z.number().min(0).optional(),
      minimum_stock: z.number().min(0),
      purchase_price: z.number().min(0).optional(),
      supplier: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      remarks: z.string().optional().nullable(),
    })
  ).min(1, { message: 'At least one row required for batch paste' }),
});
export type LedgerBatchPasteInput = z.infer<typeof LedgerBatchPasteSchema>;

// 10. Query Filter Schemas
export const ListItemsQuerySchema = z.object({
  company_id: z.string().uuid(),
  category: InventoryCategoryEnum.optional(),
  subcategory: z.string().optional(),
  search: z.string().optional(),
  brand: z.string().optional(),
  status: z.string().optional(),
  sort_by: z.enum(['stock_priority', 'deficit', 'name', 'code', 'quantity', 'price', 'brand']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});
export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>;

export const AnalysisQuerySchema = z.object({
  company_id: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: InventoryCategoryEnum.optional(),
  department: z.string().optional(),
  employee_id: z.string().uuid().optional(),
});
export type AnalysisQuery = z.infer<typeof AnalysisQuerySchema>;
