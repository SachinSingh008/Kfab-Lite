import { z } from 'zod';

export const DashboardPeriodEnum = z.enum([
  'today',
  'this_week',
  'this_month',
  'this_year',
  'custom',
]);

export type DashboardPeriod = z.infer<typeof DashboardPeriodEnum>;

export const DashboardQuerySchema = z.object({
  companyId: z.string().optional(),
  period: DashboardPeriodEnum.optional().default('today'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD').optional(),
  projectId: z.string().optional(),
});

export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;

export const MaterialIssuesQuerySchema = z.object({
  companyId: z.string().optional(),
  projectId: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type MaterialIssuesQuery = z.infer<typeof MaterialIssuesQuerySchema>;

export const CreateDashboardIssueSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  category: z.string().default('Shop Floor Bottleneck'),
  targetDate: z.string().optional(),
});

export type CreateDashboardIssueInput = z.infer<typeof CreateDashboardIssueSchema>;
