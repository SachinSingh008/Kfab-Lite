import { FastifyInstance } from 'fastify';
import {
  handleGetCompanies,
  handleGetEmployees,
  handleGetDailyAttendance,
  handleGetWeeklyAttendance,
  handleGetMonthlyAttendance,
  handleGetCustomRangeAttendance,
  handleGetAttendanceSummary,
  handleMarkAttendance,
  handleBulkMarkAttendance,
  handleClearAttendance,
  handleUpdateOvertime,
  handleUpdateLedgerCell,
} from './attendance.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

export async function attendanceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. Authorized Companies & Employee Master Roster
  fastify.get(
    '/companies',
    {
      preHandler: [requirePermission('attendance.view')],
    },
    handleGetCompanies
  );

  fastify.get(
    '/employees',
    {
      preHandler: [requirePermission('attendance.view')],
    },
    handleGetEmployees
  );

  // 2. Attendance Query Views
  fastify.get(
    '/daily',
    {
      preHandler: [requirePermission('attendance.view')],
    },
    handleGetDailyAttendance
  );

  fastify.get(
    '/weekly',
    {
      preHandler: [requirePermission('attendance.view')],
    },
    handleGetWeeklyAttendance
  );

  fastify.get(
    '/monthly',
    {
      preHandler: [requirePermission('attendance.view')],
    },
    handleGetMonthlyAttendance
  );

  fastify.get(
    '/custom',
    {
      preHandler: [requirePermission('attendance.view')],
    },
    handleGetCustomRangeAttendance
  );

  fastify.get(
    '/summary',
    {
      preHandler: [requirePermission('attendance.view')],
    },
    handleGetAttendanceSummary
  );

  // 3. Fast Marking, Overtime & Bulk Operations
  fastify.post(
    '/mark',
    {
      preHandler: [requirePermission('attendance.create')],
    },
    handleMarkAttendance
  );

  fastify.post(
    '/bulk',
    {
      preHandler: [requirePermission('attendance.bulk_update')],
    },
    handleBulkMarkAttendance
  );

  fastify.post(
    '/clear',
    {
      preHandler: [requirePermission('attendance.delete')],
    },
    handleClearAttendance
  );

  fastify.patch(
    '/overtime',
    {
      preHandler: [requirePermission('attendance.overtime_update')],
    },
    handleUpdateOvertime
  );

  // 4. Excel-Like Ledger Workspace
  fastify.get(
    '/ledger',
    {
      preHandler: [requirePermission('attendance.ledger.view')],
    },
    handleGetMonthlyAttendance
  );

  fastify.patch(
    '/ledger/cell',
    {
      preHandler: [requirePermission('attendance.ledger.update')],
    },
    handleUpdateLedgerCell
  );
}
