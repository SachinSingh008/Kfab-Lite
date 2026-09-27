import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'ACCOUNT',
  'SUPERVISOR',
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export type UserStatus = z.infer<typeof UserStatusSchema>;

export const CreateUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(150, 'Email must not exceed 150 characters'),
  role: UserRoleSchema.default('SUPERVISOR'),
  initialPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  status: UserStatusSchema.default('ACTIVE'),
  forcePasswordReset: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(150).optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  forcePasswordReset: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const ListUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.string().trim().optional(),
  status: z.string().trim().optional(),
  sortBy: z
    .enum(['name', 'email', 'role', 'status', 'created_at', 'last_login_at'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;

export const ResetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128)
    .optional(),
  forcePasswordReset: z.boolean().default(true),
  revokeExistingSessions: z.boolean().default(true),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const RevokeSessionsSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export type RevokeSessionsInput = z.infer<typeof RevokeSessionsSchema>;

export const UserIdParamSchema = z.object({
  id: z.string().uuid('Invalid User UUID format'),
});
