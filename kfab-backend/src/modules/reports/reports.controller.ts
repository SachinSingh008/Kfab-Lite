import { FastifyRequest, FastifyReply } from 'fastify';
import { reportsService } from './reports.service.js';
import { ReportsSummaryQuerySchema } from './reports.schema.js';

export async function handleGetReportsSummary(request: FastifyRequest, reply: FastifyReply) {
  const queryResult = ReportsSummaryQuerySchema.safeParse(request.query);
  const period = queryResult.success ? queryResult.data.period : 'weekly';

  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  try {
    const summary = await reportsService.getSummary(user, period);
    return reply.send(summary);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reports summary';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetReportsProgress(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  try {
    const progressData = await reportsService.getProgressData(user);
    return reply.send(progressData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch progress telemetry';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}
