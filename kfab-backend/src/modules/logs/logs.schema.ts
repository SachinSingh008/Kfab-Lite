import { z } from 'zod';

export const CreateUserLogSchema = z.object({
  event: z.string().trim().min(1, 'Event description is required').max(500, 'Event description cannot exceed 500 characters'),
  remarks: z.string().trim().max(2000, 'Remarks cannot exceed 2000 characters').optional().nullable(),
});

export type CreateUserLogInput = z.infer<typeof CreateUserLogSchema>;

export const ListUserLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  from: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  to: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'ACCOUNT']).optional(),
  user: z.string().trim().max(100).optional(),
});

export type ListUserLogsQuery = z.infer<typeof ListUserLogsQuerySchema>;

export const ListSystemLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  module: z.string().trim().max(50).optional(),
  action: z.string().trim().max(50).optional(),
  user: z.string().trim().max(100).optional(),
  from: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  to: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});

export type ListSystemLogsQuery = z.infer<typeof ListSystemLogsQuerySchema>;
