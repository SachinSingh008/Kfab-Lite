import { FastifyRequest, FastifyReply } from 'fastify';
import { projectsService } from './projects.service.js';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  AddStageSchema,
  UpdateStageSchema,
  AddItemSchema,
  UpdateItemStageStatusSchema,
  ListProjectsQuerySchema,
} from './projects.schema.js';

export async function handleListProjects(request: FastifyRequest, reply: FastifyReply) {
  const queryResult = ListProjectsQuerySchema.safeParse(request.query);
  if (!queryResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid query parameters',
      details: queryResult.error.format(),
    });
  }

  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  try {
    const result = await projectsService.listProjects(queryResult.data, user);
    return reply.send(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to list projects';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleGetProjectById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  try {
    const result = await projectsService.getProjectById(id, user);
    return reply.send(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Project not found';
    const status = msg.includes('Access denied') ? 403 : 404;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Not Found', message: msg });
  }
}

export async function handleCreateProject(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const bodyResult = CreateProjectSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed for project creation payload',
      details: bodyResult.error.format(),
    });
  }

  try {
    const result = await projectsService.createProject(bodyResult.data, user);
    return reply.status(201).send(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create project';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleUpdateProject(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const bodyResult = UpdateProjectSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed for project update payload',
      details: bodyResult.error.format(),
    });
  }

  try {
    const result = await projectsService.updateProject(id, bodyResult.data, user);
    return reply.send(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update project';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleAddStage(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const bodyResult = AddStageSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed for stage addition',
      details: bodyResult.error.format(),
    });
  }

  try {
    const stage = await projectsService.addStage(id, bodyResult.data, user);
    return reply.status(201).send({ stage });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add stage';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleRenameStage(request: FastifyRequest, reply: FastifyReply) {
  const { id, stageId } = request.params as { id: string; stageId: string };
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const bodyResult = UpdateStageSchema.safeParse(request.body);
  if (!bodyResult.success || !bodyResult.data.name) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Valid stage name is required for rename',
    });
  }

  try {
    const stage = await projectsService.renameStage(id, stageId, bodyResult.data.name, user);
    return reply.send({ stage });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to rename stage';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleDeleteStage(request: FastifyRequest, reply: FastifyReply) {
  const { id, stageId } = request.params as { id: string; stageId: string };
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  try {
    const result = await projectsService.deleteStage(id, stageId, user);
    return reply.send(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete stage';
    const status = msg.includes('Core default') || msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleAddItem(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const bodyResult = AddItemSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed for item addition',
      details: bodyResult.error.format(),
    });
  }

  try {
    const item = await projectsService.addItem(id, bodyResult.data, user);
    return reply.status(201).send({ item });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add item';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}

export async function handleUpdateItemStageStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id, itemId, stageId } = request.params as { id: string; itemId: string; stageId: string };
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User not authenticated' });
  }

  const bodyResult = UpdateItemStageStatusSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed for cell status update',
      details: bodyResult.error.format(),
    });
  }

  try {
    const cellStatus = await projectsService.updateItemStageStatus(id, itemId, stageId, bodyResult.data, user);
    return reply.send({ cellStatus });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update cell status';
    const status = msg.includes('Access denied') ? 403 : 500;
    return reply.status(status).send({ statusCode: status, error: status === 403 ? 'Forbidden' : 'Error', message: msg });
  }
}
