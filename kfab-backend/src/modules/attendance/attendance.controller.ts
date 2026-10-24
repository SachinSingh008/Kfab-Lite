import { FastifyRequest, FastifyReply } from 'fastify';
import { attendanceService } from './attendance.service.js';
import {
  MarkAttendanceSchema,
  BulkAttendanceSchema,
  ClearAttendanceSchema,
  UpdateOvertimeSchema,
  LedgerCellUpdateSchema,
  DailyAttendanceQuerySchema,
  WeeklyAttendanceQuerySchema,
  MonthlyAttendanceQuerySchema,
  CustomRangeAttendanceQuerySchema,
  AttendanceSummaryQuerySchema,
} from './attendance.schema.js';

export async function handleGetCompanies(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  try {
    const companies = await attendanceService.listCompanies(user);
    return reply.send({ statusCode: 200, companies });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch companies';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetEmployees(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const query = request.query as { company_id?: string; search?: string };
  if (!query.company_id) {
    return reply.status(400).send({ statusCode: 400, error: 'Bad Request', message: 'company_id query parameter is required' });
  }

  try {
    const employees = await attendanceService.listEmployees(query.company_id, query.search, user);
    return reply.send({ statusCode: 200, employees });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch employees';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetDailyAttendance(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = DailyAttendanceQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid daily attendance query',
      issues: parsed.error.issues,
    });
  }

  try {
    const dailyData = await attendanceService.getDailyAttendance(
      parsed.data.company_id,
      parsed.data.date,
      parsed.data.search,
      user
    );
    return reply.send({ statusCode: 200, ...dailyData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch daily attendance';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetWeeklyAttendance(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = WeeklyAttendanceQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid weekly attendance query',
      issues: parsed.error.issues,
    });
  }

  try {
    const weeklyData = await attendanceService.getWeeklyAttendance(
      parsed.data.company_id,
      parsed.data.week_start,
      parsed.data.search,
      user
    );
    return reply.send({ statusCode: 200, ...weeklyData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch weekly attendance';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetMonthlyAttendance(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = MonthlyAttendanceQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid monthly attendance query',
      issues: parsed.error.issues,
    });
  }

  try {
    const monthlyData = await attendanceService.getMonthlyAttendance(
      parsed.data.company_id,
      parsed.data.year,
      parsed.data.month,
      parsed.data.search,
      user
    );
    return reply.send({ statusCode: 200, ...monthlyData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch monthly attendance';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetCustomRangeAttendance(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = CustomRangeAttendanceQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid custom range query',
      issues: parsed.error.issues,
    });
  }

  try {
    const customData = await attendanceService.getCustomRangeAttendance(
      parsed.data.company_id,
      parsed.data.from_date,
      parsed.data.to_date,
      parsed.data.search,
      user
    );
    return reply.send({ statusCode: 200, ...customData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch custom range attendance';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetAttendanceSummary(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = AttendanceSummaryQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid attendance summary query',
      issues: parsed.error.issues,
    });
  }

  try {
    const summary = await attendanceService.getAttendanceSummary(
      parsed.data.company_id,
      parsed.data.date,
      user
    );
    return reply.send({ statusCode: 200, summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch attendance summary';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleMarkAttendance(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = MarkAttendanceSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid mark attendance payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const record = await attendanceService.markAttendance(parsed.data, user, request);
    return reply.status(200).send({ statusCode: 200, record });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark attendance';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleBulkMarkAttendance(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = BulkAttendanceSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid bulk attendance payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await attendanceService.bulkMarkAttendance(parsed.data, user, request);
    return reply.status(200).send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to perform bulk attendance marking';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleClearAttendance(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = ClearAttendanceSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid clear attendance payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await attendanceService.clearAttendance(parsed.data, user, request);
    return reply.status(200).send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to clear attendance records';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleUpdateOvertime(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = UpdateOvertimeSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid overtime payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const record = await attendanceService.updateOvertime(parsed.data, user, request);
    return reply.status(200).send({ statusCode: 200, record });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update overtime';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleUpdateLedgerCell(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const parsed = LedgerCellUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: parsed.error.issues[0]?.message || 'Invalid ledger cell payload',
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await attendanceService.updateLedgerCell(parsed.data, user, request);
    return reply.status(200).send({ statusCode: 200, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update ledger cell';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}
