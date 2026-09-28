import { FastifyInstance } from 'fastify';
import {
  handleGetReportsSummary,
  handleGetReportsProgress,
} from './reports.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

export async function reportsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // 1. KPI Summary (Efficiency, Output, Today, Period Output)
  fastify.get(
    '/summary',
    {
      preHandler: [requirePermission('reports.view')],
    },
    handleGetReportsSummary
  );

  // 2. Project Progress List & Timeline Telemetry
  fastify.get(
    '/progress',
    {
      preHandler: [requirePermission('reports.view')],
    },
    handleGetReportsProgress
  );
}
