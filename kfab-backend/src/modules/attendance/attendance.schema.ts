import { z } from 'zod';

export const AttendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'OD']);
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;

export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD');

export const OvertimeHoursSchema = z
  .number({ invalid_type_error: 'Overtime hours must be a number' })
  .min(0, 'Overtime hours cannot be negative')
  .max(24, 'Overtime hours cannot exceed 24 hours in a single shift');

export const MarkAttendanceSchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  employee_id: z.string().uuid('Employee ID must be a valid UUID'),
  attendance_date: DateStringSchema,
  status: AttendanceStatusSchema,
  overtime_hours: OvertimeHoursSchema.default(0.0),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
});
export type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;

export const BulkAttendanceItemSchema = z.object({
  employee_id: z.string().uuid('Employee ID must be a valid UUID'),
  status: AttendanceStatusSchema,
  overtime_hours: OvertimeHoursSchema.optional().default(0.0),
  remarks: z.string().max(500).optional().nullable(),
});
export type BulkAttendanceItem = z.infer<typeof BulkAttendanceItemSchema>;

export const BulkAttendanceSchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  attendance_date: DateStringSchema,
  records: z.array(BulkAttendanceItemSchema).min(1, 'At least one attendance record must be provided in bulk batch'),
});
export type BulkAttendanceInput = z.infer<typeof BulkAttendanceSchema>;

export const ClearAttendanceSchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  attendance_date: DateStringSchema,
  employee_ids: z.array(z.string().uuid()).optional(),
});
export type ClearAttendanceInput = z.infer<typeof ClearAttendanceSchema>;

export const UpdateOvertimeSchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  employee_id: z.string().uuid('Employee ID must be a valid UUID'),
  attendance_date: DateStringSchema,
  overtime_hours: OvertimeHoursSchema,
  remarks: z.string().max(500).optional().nullable(),
});
export type UpdateOvertimeInput = z.infer<typeof UpdateOvertimeSchema>;

export const LedgerCellUpdateSchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  employee_id: z.string().uuid('Employee ID must be a valid UUID'),
  attendance_date: DateStringSchema,
  status: z.enum(['PRESENT', 'ABSENT', 'OD', 'BLANK']),
  overtime_hours: OvertimeHoursSchema.optional().default(0.0),
  remarks: z.string().max(500).optional().nullable(),
});
export type LedgerCellUpdateInput = z.infer<typeof LedgerCellUpdateSchema>;

export const DailyAttendanceQuerySchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  date: DateStringSchema,
  search: z.string().optional(),
});
export type DailyAttendanceQuery = z.infer<typeof DailyAttendanceQuerySchema>;

export const WeeklyAttendanceQuerySchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  week_start: DateStringSchema,
  search: z.string().optional(),
});
export type WeeklyAttendanceQuery = z.infer<typeof WeeklyAttendanceQuerySchema>;

export const MonthlyAttendanceQuerySchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  year: z.coerce.number().int().min(2020).max(2050),
  month: z.coerce.number().int().min(1).max(12),
  search: z.string().optional(),
});
export type MonthlyAttendanceQuery = z.infer<typeof MonthlyAttendanceQuerySchema>;

export const CustomRangeAttendanceQuerySchema = z
  .object({
    company_id: z.string().uuid('Company ID must be a valid UUID'),
    from_date: DateStringSchema,
    to_date: DateStringSchema,
    search: z.string().optional(),
  })
  .refine((data) => new Date(data.to_date) >= new Date(data.from_date), {
    message: 'To date must be greater than or equal to from date',
    path: ['to_date'],
  });
export type CustomRangeAttendanceQuery = z.infer<typeof CustomRangeAttendanceQuerySchema>;

export const AttendanceSummaryQuerySchema = z.object({
  company_id: z.string().uuid('Company ID must be a valid UUID'),
  date: DateStringSchema.optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().optional(),
});
export type AttendanceSummaryQuery = z.infer<typeof AttendanceSummaryQuerySchema>;
