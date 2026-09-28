import { z } from 'zod';

export const ProjectStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DELAYED',
  'ON_HOLD',
]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const StageDeadlinesSchema = z.object({
  marking: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Marking deadline must be YYYY-MM-DD'),
  cutting: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Cutting deadline must be YYYY-MM-DD'),
  fitting: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fitting deadline must be YYYY-MM-DD'),
  welding: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Welding deadline must be YYYY-MM-DD'),
  final: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Final deadline must be YYYY-MM-DD'),
});

export const CreateProjectSchema = z
  .object({
    projectName: z.string().min(2, 'Project name must be at least 2 characters').max(100),
    customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100),
    supervisorId: z.string().uuid('Supervisor ID must be a valid UUID'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
    stageDeadlines: StageDeadlinesSchema,
    remark: z.string().max(500).optional().nullable(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date must be greater than or equal to start date',
    path: ['endDate'],
  });

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z
  .object({
    projectName: z.string().min(2).max(100).optional(),
    customerName: z.string().min(2).max(100).optional(),
    supervisorId: z.string().uuid().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: ProjectStatusSchema.optional(),
    remark: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be greater than or equal to start date',
      path: ['endDate'],
    }
  );

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export const AddStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required').max(50),
  plannedCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Planned completion date must be YYYY-MM-DD'),
  sequence: z.number().int().positive().optional(),
});

export type AddStageInput = z.infer<typeof AddStageSchema>;

export const UpdateStageSchema = z.object({
  name: z.string().min(1, 'Stage name cannot be empty').max(50).optional(),
  plannedCompletionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sequence: z.number().int().positive().optional(),
});

export type UpdateStageInput = z.infer<typeof UpdateStageSchema>;

export const AddItemSchema = z.object({
  material: z.string().min(1, 'Material name is required').max(100),
  drawingNumber: z.string().min(1, 'Drawing number is required').max(100),
  sequence: z.number().int().positive().optional(),
});

export type AddItemInput = z.infer<typeof AddItemSchema>;

export const UpdateItemStageStatusSchema = z.object({
  status: z.enum(['INCOMPLETE', 'COMPLETE']),
  remark: z.string().max(300).optional().nullable(),
});

export type UpdateItemStageStatusInput = z.infer<typeof UpdateItemStageStatusSchema>;

export const ListProjectsQuerySchema = z.object({
  search: z.string().optional(),
  supervisorId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
