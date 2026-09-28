import Fastify, { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import crypto from 'node:crypto';
import { ENV, isProd, allowedOriginsList } from './config/env.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { rolesRoutes } from './modules/roles/roles.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { logsRoutes } from './modules/logs/logs.routes.js';
import { systemLogsRoutes } from './modules/system-logs/system-logs.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';
import { reportsRoutes } from './modules/reports/reports.routes.js';
import { supabaseAdmin } from './db/supabase.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: isProd ? 'info' : 'debug',
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            hostname: req.hostname,
            remoteAddress: req.ip,
          };
        },
      },
    },
    genReqId() {
      return crypto.randomUUID();
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
  });

  // Support empty JSON bodies gracefully without throwing FST_ERR_CTP_EMPTY_JSON_BODY
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (!body || (typeof body === 'string' && body.trim() === '')) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(body as string));
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Invalid JSON');
      (error as FastifyError).statusCode = 400;
      done(error as FastifyError, undefined);
    }
  });

  // 1. Correlation ID Hook
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = (request.headers['x-correlation-id'] as string) || request.id;
    request.correlationId = correlationId;
    reply.header('x-correlation-id', correlationId);
  });

  // 2. HTTP Security Headers via Helmet
  app.register(helmet, {
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https://*.supabase.co'],
            connectSrc: ["'self'", 'https://*.supabase.co'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' },
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    noSniff: true,
  });

  // 3. Strict CORS (No unrestricted wildcard * in production)
  app.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (!isProd) {
        // In local development, permit localhost ports
        return callback(null, true);
      }

      if (allowedOriginsList.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS: Origin not permitted by security policy'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-correlation-id'],
    maxAge: 86400,
  });

  // 4. Rate Limiting Protection (Prevents automated abuse and credential stuffing)
  app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again in ${context.after}.`,
    }),
  });

  // 5. Sensible Utilities (standard HTTP error helpers)
  app.register(sensible);

  // 6. Root Health Check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'kfab-backend',
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
  }));

  // 7. Register API Modules under /api/v1
  app.register(
    async (v1) => {
      v1.register(authRoutes, { prefix: '/auth' });
      v1.register(usersRoutes, { prefix: '/users' });
      v1.register(rolesRoutes);
      v1.register(auditRoutes);
      v1.register(logsRoutes, { prefix: '/logs' });
      v1.register(systemLogsRoutes, { prefix: '/system-logs' });
      v1.register(projectsRoutes, { prefix: '/projects' });
      v1.register(reportsRoutes, { prefix: '/reports' });

      // Fallback/Stub for employees directory
      v1.get('/employees', async (_request, reply) => {
        try {
          const { data, error } = await supabaseAdmin
            .from('employees')
            .select('id, employee_code, name, department, designation, status');
          if (!error && data) {
            return reply.send({ statusCode: 200, employees: data });
          }
        } catch {
          // ignore error if table does not exist
        }
        return reply.send({ statusCode: 200, employees: [] });
      });
    },
    { prefix: '/api/v1' }
  );

  // 8. Centralized Production-Grade Error Handler
  // Never exposes raw SQL errors, stack traces, database credentials, or internal secrets
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error({
      err: error,
      correlationId: request.correlationId,
      url: request.raw.url,
      method: request.raw.method,
    });

    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;

    // Validation errors from Fastify or Zod
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Input validation error',
        details: error.validation,
      });
    }

    if (statusCode === 500) {
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: isProd
          ? 'An internal server error occurred. Please contact support.'
          : error.message || 'An internal error occurred',
        correlationId: request.correlationId,
      });
    }

    return reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Error',
      message: error.message,
    });
  });

  return app;
}
