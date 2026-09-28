import { z } from 'zod';

export const ReportsSummaryQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly']).default('weekly'),
});

export type ReportsSummaryQuery = z.infer<typeof ReportsSummaryQuerySchema>;
