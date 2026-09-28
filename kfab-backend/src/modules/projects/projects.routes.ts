import { FastifyInstance } from 'fastify';
import {
  handleListProjects,
  handleGetProjectById,
  handleCreateProject,
  handleUpdateProject,
  handleAddStage,
  handleRenameStage,
  handleDeleteStage,
  handleAddItem,
  handleUpdateItemStageStatus,
} from './projects.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';

export async function projectsRoutes(fastify: FastifyInstance) {
  // All project operations require valid user authentication
  fastify.addHook('preHandler', authenticate);

  // 1. List projects (Supervisor sees assigned, Admin/SuperAdmin sees all)
  fastify.get(
    '/',
    {
      preHandler: [requirePermission('reports.view')],
    },
    handleListProjects
  );

  // 2. Get project details with stages, items, and cell status grid
  fastify.get(
    '/:id',
    {
      preHandler: [requirePermission('reports.view')],
    },
    handleGetProjectById
  );

  // 3. Create project with 5 default stages (Admin & Super Admin only)
  fastify.post(
    '/',
    {
      preHandler: [requirePermission('projects.create')],
    },
    handleCreateProject
  );

  // 4. Update project metadata
  fastify.patch(
    '/:id',
    {
      preHandler: [requirePermission('projects.edit')],
    },
    handleUpdateProject
  );

  // 5. Add custom stage column (Supervisor or Admin)
  fastify.post(
    '/:id/stages',
    {
      preHandler: [requirePermission('projects.edit')],
    },
    handleAddStage
  );

  // 6. Rename stage column
  fastify.patch(
    '/:id/stages/:stageId',
    {
      preHandler: [requirePermission('projects.edit')],
    },
    handleRenameStage
  );

  // 7. Delete custom stage column (Core 5 defaults protected)
  fastify.delete(
    '/:id/stages/:stageId',
    {
      preHandler: [requirePermission('projects.edit')],
    },
    handleDeleteStage
  );

  // 8. Add material / drawing row item
  fastify.post(
    '/:id/items',
    {
      preHandler: [requirePermission('projects.edit')],
    },
    handleAddItem
  );

  // 9. Update cell status (Complete / Incomplete) & custom remark
  fastify.patch(
    '/:id/items/:itemId/stages/:stageId',
    {
      preHandler: [requirePermission('projects.edit')],
    },
    handleUpdateItemStageStatus
  );
}
