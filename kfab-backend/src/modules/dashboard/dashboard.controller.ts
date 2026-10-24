import { FastifyRequest, FastifyReply } from 'fastify';
import { dashboardService } from './dashboard.service.js';
import {
  DashboardQuerySchema,
  MaterialIssuesQuerySchema,
  CreateDashboardIssueSchema,
} from './dashboard.schema.js';

export async function handleGetDashboardOverview(request: FastifyRequest, reply: FastifyReply) {
  const parsed = DashboardQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid dashboard query parameters',
      details: parsed.error.issues,
    });
  }

  const user = request.user;
  if (!user) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication session required',
    });
  }

  try {
    const data = await dashboardService.getDashboardOverview(parsed.data, user);
    return reply.send({
      statusCode: 200,
      data,
    });
  } catch (err: any) {
    request.log.error({ err }, 'Failed to compute dashboard overview');
    const isForbidden = err.message?.includes('Unauthorized') || err.message?.includes('restricted');
    return reply.status(isForbidden ? 403 : 500).send({
      statusCode: isForbidden ? 403 : 500,
      error: isForbidden ? 'Forbidden' : 'Internal Server Error',
      message: err.message || 'Failed to aggregate dashboard metrics',
    });
  }
}

export async function handleGetMaterialIssues(request: FastifyRequest, reply: FastifyReply) {
  const parsed = MaterialIssuesQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid material issue parameters',
      details: parsed.error.issues,
    });
  }

  const user = request.user;
  if (!user) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication session required',
    });
  }

  try {
    const result = dashboardService.getMaterialIssueRecords(
      parsed.data.companyId || '',
      user,
      parsed.data
    );
    return reply.send({
      statusCode: 200,
      ...result,
    });
  } catch (err: any) {
    request.log.error({ err }, 'Failed to retrieve material issue records');
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: err.message || 'Failed to retrieve material accountability records',
    });
  }
}

export async function handleCreateDashboardIssue(request: FastifyRequest, reply: FastifyReply) {
  const parsed = CreateDashboardIssueSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid issue payload',
      details: parsed.error.issues,
    });
  }

  const user = request.user;
  if (!user) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication session required',
    });
  }

  try {
    const created = await dashboardService.createDashboardIssue(parsed.data, user);
    return reply.status(201).send({
      statusCode: 201,
      message: 'Shop floor issue recorded successfully',
      data: created,
    });
  } catch (err: any) {
    request.log.error({ err }, 'Failed to create dashboard issue');
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: err.message || 'Failed to create dashboard issue',
    });
  }
}
