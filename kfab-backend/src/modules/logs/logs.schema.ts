import { z } from 'zod';

export const CreateUserLogSchema = z.object({
  event: z.string().trim().min(1, 'Event description is required').max(500, 'Event description cannot exceed 500 characters'),
  remarks: z.string().trim().max(2000, 'Remarks cannot exceed 2000 characters').optional().nullable(),
});

export type CreateUserLogInput = z.infer<typeof CreateUserLogSchema>;

const emptyToUndefined = (val: unknown) => (typeof val === 'string' && val.trim() === '' ? undefined : val);

export const ListUserLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  from: z.preprocess(emptyToUndefined, z.string().optional()),
  to: z.preprocess(emptyToUndefined, z.string().optional()),
  role: z.preprocess((val) => {
    if (!val || val === '' || val === 'ALL' || val === 'all') return undefined;
    const str = String(val).toUpperCase();
    if (str === 'ACCOUNTANT') return 'ACCOUNT';
    return str;
  }, z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'ACCOUNT']).optional()),
  user: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
});

export type ListUserLogsQuery = z.infer<typeof ListUserLogsQuerySchema>;

export const ListSystemLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  module: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  action: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  user: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  from: z.preprocess(emptyToUndefined, z.string().optional()),
  to: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type ListSystemLogsQuery = z.infer<typeof ListSystemLogsQuerySchema>;
