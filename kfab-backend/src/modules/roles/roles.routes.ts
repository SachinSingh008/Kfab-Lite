import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission, ROLE_DEFAULT_PERMISSIONS } from '../../middleware/rbac.js';
import { supabaseAdmin } from '../../db/supabase.js';

export async function rolesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. Roles Catalog
  fastify.get('/roles', async (_request: FastifyRequest, reply: FastifyReply) => {
    const rolesList = [
      {
        value: 'SUPER_ADMIN',
        label: 'Super Admin',
        description: 'Global system authority across all plant entities and security configurations',
        permissions: ROLE_DEFAULT_PERMISSIONS.SUPER_ADMIN,
      },
      {
        value: 'ADMIN',
        label: 'Admin',
        description: 'Plant operations, personnel directory, materials catalog, and muster oversight',
        permissions: ROLE_DEFAULT_PERMISSIONS.ADMIN,
      },
      {
        value: 'SUPERVISOR',
        label: 'Supervisor',
        description: 'Assigned shop-floor worker roster, daily punch-in, and bay raw-material usage',
        permissions: ROLE_DEFAULT_PERMISSIONS.SUPERVISOR,
      },
      {
        value: 'ACCOUNTANT',
        label: 'Accountant',
        description: 'Material stock ledgers, financial reconciliation, and Excel ledger reporting',
        permissions: ROLE_DEFAULT_PERMISSIONS.ACCOUNTANT,
      },
      {
        value: 'STOREKEEPER',
        label: 'Storekeeper',
        description: 'Inward gate deliveries, stock dispatch vouchers, and warehouse issuance',
        permissions: ROLE_DEFAULT_PERMISSIONS.STOREKEEPER,
      },
      {
        value: 'ATTENDANCE_USER',
        label: 'Attendance User',
        description: 'Dedicated team muster mark recording on current business date',
        permissions: ROLE_DEFAULT_PERMISSIONS.ATTENDANCE_USER,
      },
      {
        value: 'VIEWER',
        label: 'Viewer',
        description: 'Read-only observation of production muster and inventory',
        permissions: ROLE_DEFAULT_PERMISSIONS.VIEWER,
      },
    ];

    return reply.send({ roles: rolesList });
  });

  // 2. Employees Directory for User Mapping
  fastify.get(
    '/employees',
    {
      preHandler: [requirePermission('employees.view')],
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const { data: employees, error } = await supabaseAdmin
        .from('employees')
        .select('id, employee_code, name, department, designation, status')
        .eq('status', 'ACTIVE')
        .order('name', { ascending: true });

      if (error) {
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to query employees directory.',
        });
      }

      return reply.send({ employees: employees || [] });
    }
  );
}
