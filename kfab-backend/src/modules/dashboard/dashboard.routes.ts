import { FastifyInstance } from 'fastify';
import {
  handleGetDashboardOverview,
  handleGetMaterialIssues,
  handleCreateDashboardIssue,
} from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  // All dashboard routes require valid session authentication
  fastify.addHook('preHandler', authenticate);

  // 1. Authoritative Consolidated Dashboard Overview
  fastify.get('/overview', handleGetDashboardOverview);

  // 2. Paginated "Material Issued to Whom" Accountability Endpoint
  fastify.get('/material-issues', handleGetMaterialIssues);

  // 3. Create shop floor issue ticket
  fastify.post('/issues', handleCreateDashboardIssue);
}
