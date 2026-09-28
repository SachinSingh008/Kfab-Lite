import { supabaseAdmin, createUserClient, hasServiceRoleKey } from '../../db/supabase.js';
import { auditService } from '../audit/audit.service.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddStageInput,
  UpdateStageInput,
  AddItemInput,
  UpdateItemStageStatusInput,
  ListProjectsQuery,
} from './projects.schema.js';

export interface ProjectDTO {
  id: string;
  projectName: string;
  customerName: string;
  supervisorId: string;
  supervisorName?: string;
  startDate: string;
  endDate: string;
  status: string;
  remark: string | null;
  progressPercent: number;
  delayDays: number;
  isDelayed: boolean;
  derivedStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStageDTO {
  id: string;
  projectId: string;
  name: string;
  sequence: number;
  plannedCompletionDate: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItemDTO {
  id: string;
  projectId: string;
  material: string;
  drawingNumber: string;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemStageStatusDTO {
  id: string;
  projectItemId: string;
  projectStageId: string;
  status: 'INCOMPLETE' | 'COMPLETE';
  remark: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface ProjectDetailDTO {
  project: ProjectDTO;
  stages: ProjectStageDTO[];
  items: ProjectItemDTO[];
  cellStatuses: Record<string, ItemStageStatusDTO>; // key: `${itemId}_${stageId}`
}

// Default core stages created with every new project
export const DEFAULT_STAGE_NAMES = ['Marking', 'Cutting', 'Fitting', 'Welding', 'Final'] as const;

// ------------------------------------------------------------------------------
// In-Memory Fallback Store (Ensures continuous availability & test reliability)
// ------------------------------------------------------------------------------
let memoryProjects: Array<{
  id: string;
  projectName: string;
  customerName: string;
  supervisorId: string;
  supervisorName: string;
  startDate: string;
  endDate: string;
  status: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    projectName: 'KFab Plant Structure Extension',
    customerName: 'Tata Steel Processing Ltd',
    supervisorId: '00000000-0000-0000-0000-000000000003', // Supervisor
    supervisorName: 'Site Supervisor',
    startDate: '2026-09-01',
    endDate: '2026-09-25', // Past date -> delayed
    status: 'IN_PROGRESS',
    remark: 'Welding electrode delivery pending from store',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-28T10:00:00.000Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    projectName: 'Heavy Gantry Girder Fabrication',
    customerName: 'Larsen & Toubro ECC',
    supervisorId: '00000000-0000-0000-0000-000000000003',
    supervisorName: 'Site Supervisor',
    startDate: '2026-09-15',
    endDate: '2026-10-15',
    status: 'IN_PROGRESS',
    remark: 'Fit-up inspection cleared for Bay 2',
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-28T11:00:00.000Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    projectName: 'Solar Mounting Module Frames',
    customerName: 'Adani Green Energy',
    supervisorId: '00000000-0000-0000-0000-000000000001',
    supervisorName: 'Super Administrator',
    startDate: '2026-08-10',
    endDate: '2026-09-10',
    status: 'COMPLETED',
    remark: 'Final client dispatch cleared on schedule',
    createdAt: '2026-08-10T08:00:00.000Z',
    updatedAt: '2026-09-10T16:00:00.000Z',
  },
];

let memoryStages: ProjectStageDTO[] = [
  // Project 1 Stages
  { id: '20000000-0000-0000-0000-000000000011', projectId: '10000000-0000-0000-0000-000000000001', name: 'Marking', sequence: 1, plannedCompletionDate: '2026-09-05', isDefault: true, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000012', projectId: '10000000-0000-0000-0000-000000000001', name: 'Cutting', sequence: 2, plannedCompletionDate: '2026-09-10', isDefault: true, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000013', projectId: '10000000-0000-0000-0000-000000000001', name: 'Fitting', sequence: 3, plannedCompletionDate: '2026-09-18', isDefault: true, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000014', projectId: '10000000-0000-0000-0000-000000000001', name: 'Welding', sequence: 4, plannedCompletionDate: '2026-09-22', isDefault: true, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000015', projectId: '10000000-0000-0000-0000-000000000001', name: 'Final', sequence: 5, plannedCompletionDate: '2026-09-25', isDefault: true, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },

  // Project 2 Stages
  { id: '20000000-0000-0000-0000-000000000021', projectId: '10000000-0000-0000-0000-000000000002', name: 'Marking', sequence: 1, plannedCompletionDate: '2026-09-20', isDefault: true, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000022', projectId: '10000000-0000-0000-0000-000000000002', name: 'Cutting', sequence: 2, plannedCompletionDate: '2026-09-25', isDefault: true, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000023', projectId: '10000000-0000-0000-0000-000000000002', name: 'Fitting', sequence: 3, plannedCompletionDate: '2026-10-02', isDefault: true, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000024', projectId: '10000000-0000-0000-0000-000000000002', name: 'Welding', sequence: 4, plannedCompletionDate: '2026-10-10', isDefault: true, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000025', projectId: '10000000-0000-0000-0000-000000000002', name: 'Final', sequence: 5, plannedCompletionDate: '2026-10-15', isDefault: true, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },

  // Project 3 Stages
  { id: '20000000-0000-0000-0000-000000000031', projectId: '10000000-0000-0000-0000-000000000003', name: 'Marking', sequence: 1, plannedCompletionDate: '2026-08-15', isDefault: true, createdAt: '2026-08-10T08:00:00.000Z', updatedAt: '2026-08-10T08:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000032', projectId: '10000000-0000-0000-0000-000000000003', name: 'Cutting', sequence: 2, plannedCompletionDate: '2026-08-20', isDefault: true, createdAt: '2026-08-10T08:00:00.000Z', updatedAt: '2026-08-10T08:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000033', projectId: '10000000-0000-0000-0000-000000000003', name: 'Fitting', sequence: 3, plannedCompletionDate: '2026-08-28', isDefault: true, createdAt: '2026-08-10T08:00:00.000Z', updatedAt: '2026-08-10T08:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000034', projectId: '10000000-0000-0000-0000-000000000003', name: 'Welding', sequence: 4, plannedCompletionDate: '2026-09-05', isDefault: true, createdAt: '2026-08-10T08:00:00.000Z', updatedAt: '2026-08-10T08:00:00.000Z' },
  { id: '20000000-0000-0000-0000-000000000035', projectId: '10000000-0000-0000-0000-000000000003', name: 'Final', sequence: 5, plannedCompletionDate: '2026-09-10', isDefault: true, createdAt: '2026-08-10T08:00:00.000Z', updatedAt: '2026-08-10T08:00:00.000Z' },
];

let memoryItems: ProjectItemDTO[] = [
  // Project 1 Items
  { id: '30000000-0000-0000-0000-000000000001', projectId: '10000000-0000-0000-0000-000000000001', material: 'Plate 12mm IS 2062 E250', drawingNumber: 'DWG-STR-PL-01', sequence: 1, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },
  { id: '30000000-0000-0000-0000-000000000002', projectId: '10000000-0000-0000-0000-000000000001', material: 'Beam ISMB 450', drawingNumber: 'DWG-STR-BM-04', sequence: 2, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },
  { id: '30000000-0000-0000-0000-000000000003', projectId: '10000000-0000-0000-0000-000000000001', material: 'Column ISMC 250 Back-to-Back', drawingNumber: 'DWG-STR-COL-02', sequence: 3, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },

  // Project 2 Items
  { id: '30000000-0000-0000-0000-000000000011', projectId: '10000000-0000-0000-0000-000000000002', material: 'Web Plate 25mm E350', drawingNumber: 'DWG-GIRDER-01', sequence: 1, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },
  { id: '30000000-0000-0000-0000-000000000012', projectId: '10000000-0000-0000-0000-000000000002', material: 'Flange Plate 40mm E350', drawingNumber: 'DWG-GIRDER-02', sequence: 2, createdAt: '2026-09-15T09:00:00.000Z', updatedAt: '2026-09-15T09:00:00.000Z' },

  // Project 3 Items
  { id: '30000000-0000-0000-0000-000000000021', projectId: '10000000-0000-0000-0000-000000000003', material: 'Galvanized C-Channel 80x40', drawingNumber: 'DWG-SOLAR-001', sequence: 1, createdAt: '2026-08-10T08:00:00.000Z', updatedAt: '2026-08-10T08:00:00.000Z' },
];

let memoryCellStatuses: Record<string, ItemStageStatusDTO> = {
  // Project 1 Cell Statuses (Item 1: Complete Marking, Cutting, Fitting; Incomplete Welding with Remark)
  '30000000-0000-0000-0000-000000000001_20000000-0000-0000-0000-000000000011': { id: 's11', projectItemId: '30000000-0000-0000-0000-000000000001', projectStageId: '20000000-0000-0000-0000-000000000011', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000003', updatedAt: '2026-09-04T10:00:00.000Z' },
  '30000000-0000-0000-0000-000000000001_20000000-0000-0000-0000-000000000012': { id: 's12', projectItemId: '30000000-0000-0000-0000-000000000001', projectStageId: '20000000-0000-0000-0000-000000000012', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000003', updatedAt: '2026-09-09T14:00:00.000Z' },
  '30000000-0000-0000-0000-000000000001_20000000-0000-0000-0000-000000000013': { id: 's13', projectItemId: '30000000-0000-0000-0000-000000000001', projectStageId: '20000000-0000-0000-0000-000000000013', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000003', updatedAt: '2026-09-17T16:00:00.000Z' },
  '30000000-0000-0000-0000-000000000001_20000000-0000-0000-0000-000000000014': { id: 's14', projectItemId: '30000000-0000-0000-0000-000000000001', projectStageId: '20000000-0000-0000-0000-000000000014', status: 'INCOMPLETE', remark: 'Welding awaiting NDT pre-heat', updatedBy: '00000000-0000-0000-0000-000000000003', updatedAt: '2026-09-22T11:00:00.000Z' },
  '30000000-0000-0000-0000-000000000001_20000000-0000-0000-0000-000000000015': { id: 's15', projectItemId: '30000000-0000-0000-0000-000000000001', projectStageId: '20000000-0000-0000-0000-000000000015', status: 'INCOMPLETE', remark: null, updatedBy: null, updatedAt: '2026-09-01T08:00:00.000Z' },

  // Project 1 Item 2
  '30000000-0000-0000-0000-000000000002_20000000-0000-0000-0000-000000000011': { id: 's21', projectItemId: '30000000-0000-0000-0000-000000000002', projectStageId: '20000000-0000-0000-0000-000000000011', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000003', updatedAt: '2026-09-04T10:00:00.000Z' },
  '30000000-0000-0000-0000-000000000002_20000000-0000-0000-0000-000000000012': { id: 's22', projectItemId: '30000000-0000-0000-0000-000000000002', projectStageId: '20000000-0000-0000-0000-000000000012', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000003', updatedAt: '2026-09-08T11:00:00.000Z' },
  '30000000-0000-0000-0000-000000000002_20000000-0000-0000-0000-000000000013': { id: 's23', projectItemId: '30000000-0000-0000-0000-000000000002', projectStageId: '20000000-0000-0000-0000-000000000013', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000003', updatedAt: '2026-09-16T14:00:00.000Z' },
  '30000000-0000-0000-0000-000000000002_20000000-0000-0000-0000-000000000014': { id: 's24', projectItemId: '30000000-0000-0000-0000-000000000002', projectStageId: '20000000-0000-0000-0000-000000000014', status: 'INCOMPLETE', remark: null, updatedBy: null, updatedAt: '2026-09-01T08:00:00.000Z' },
  '30000000-0000-0000-0000-000000000002_20000000-0000-0000-0000-000000000015': { id: 's25', projectItemId: '30000000-0000-0000-0000-000000000002', projectStageId: '20000000-0000-0000-0000-000000000015', status: 'INCOMPLETE', remark: null, updatedBy: null, updatedAt: '2026-09-01T08:00:00.000Z' },

  // Project 3 (All complete)
  '30000000-0000-0000-0000-000000000021_20000000-0000-0000-0000-000000000031': { id: 's31', projectItemId: '30000000-0000-0000-0000-000000000021', projectStageId: '20000000-0000-0000-0000-000000000031', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000001', updatedAt: '2026-08-14T10:00:00.000Z' },
  '30000000-0000-0000-0000-000000000021_20000000-0000-0000-0000-000000000032': { id: 's32', projectItemId: '30000000-0000-0000-0000-000000000021', projectStageId: '20000000-0000-0000-0000-000000000032', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000001', updatedAt: '2026-08-19T11:00:00.000Z' },
  '30000000-0000-0000-0000-000000000021_20000000-0000-0000-0000-000000000033': { id: 's33', projectItemId: '30000000-0000-0000-0000-000000000021', projectStageId: '20000000-0000-0000-0000-000000000033', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000001', updatedAt: '2026-08-27T16:00:00.000Z' },
  '30000000-0000-0000-0000-000000000021_20000000-0000-0000-0000-000000000034': { id: 's34', projectItemId: '30000000-0000-0000-0000-000000000021', projectStageId: '20000000-0000-0000-0000-000000000034', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000001', updatedAt: '2026-09-04T12:00:00.000Z' },
  '30000000-0000-0000-0000-000000000021_20000000-0000-0000-0000-000000000035': { id: 's35', projectItemId: '30000000-0000-0000-0000-000000000021', projectStageId: '20000000-0000-0000-0000-000000000035', status: 'COMPLETE', remark: null, updatedBy: '00000000-0000-0000-0000-000000000001', updatedAt: '2026-09-09T15:00:00.000Z' },
};

export class ProjectsService {
  /**
   * Resolves Supabase client based on caller context
   */
  private getClient(callerToken?: string) {
    if (hasServiceRoleKey) return supabaseAdmin;
    if (callerToken && !callerToken.startsWith('kfab-dev-token-')) {
      return createUserClient(callerToken);
    }
    return supabaseAdmin;
  }

  /**
   * Helper to compute progress and delay status for a project
   */
  private computeProjectMetrics(
    projectId: string,
    startDateStr: string,
    endDateStr: string,
    projectStatus: string,
    items: ProjectItemDTO[],
    stages: ProjectStageDTO[],
    cellStatuses: Record<string, ItemStageStatusDTO>
  ): { progressPercent: number; delayDays: number; isDelayed: boolean; derivedStatus: string } {
    const projectItems = items.filter((i) => i.projectId === projectId);
    const projectStages = stages.filter((s) => s.projectId === projectId);

    const totalCells = projectItems.length * projectStages.length;
    let completedCells = 0;

    for (const item of projectItems) {
      for (const stage of projectStages) {
        const key = `${item.id}_${stage.id}`;
        if (cellStatuses[key]?.status === 'COMPLETE') {
          completedCells++;
        }
      }
    }

    const progressPercent = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;

    // Delay calculation
    const now = new Date();
    const endDate = new Date(endDateStr);
    now.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const isFullyComplete = progressPercent === 100 || projectStatus === 'COMPLETED';

    let delayDays = 0;
    let isDelayed = false;
    let derivedStatus = projectStatus;

    if (isFullyComplete) {
      delayDays = 0;
      isDelayed = false;
      derivedStatus = 'COMPLETED';
    } else if (now.getTime() > endDate.getTime()) {
      const diffMs = now.getTime() - endDate.getTime();
      delayDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      isDelayed = true;
      derivedStatus = 'DELAYED';
    } else {
      delayDays = 0;
      isDelayed = false;
      derivedStatus = progressPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    }

    return { progressPercent, delayDays, isDelayed, derivedStatus };
  }

  /**
   * Lists projects with RBAC scoping and metrics
   */
  async listProjects(
    query: ListProjectsQuery,
    user: AuthenticatedUser
  ): Promise<{
    projects: ProjectDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // 1. Role Authorization Check: ACCOUNT role is strictly forbidden
    if (user.role === 'ACCOUNT') {
      throw new Error('Access denied: Accountants do not have permission to view Reports or Project Tracking.');
    }

    const { search, supervisorId, status, page, limit } = query;

    // Try live Supabase PostgreSQL
    try {
      const client = this.getClient(user.token);

      let dbQuery = client.from('projects').select('*, profiles!projects_supervisor_id_fkey(full_name)');

      // If caller is SUPERVISOR, strictly scope to their assigned projects
      if (user.role === 'SUPERVISOR') {
        dbQuery = dbQuery.eq('supervisor_id', user.id);
      } else if (supervisorId) {
        dbQuery = dbQuery.eq('supervisor_id', supervisorId);
      }

      if (status && status !== 'ALL') {
        dbQuery = dbQuery.eq('status', status);
      }

      if (search && search.trim()) {
        const q = search.trim();
        dbQuery = dbQuery.or(`project_name.ilike.%${q}%,customer_name.ilike.%${q}%`);
      }

      dbQuery = dbQuery.order('created_at', { ascending: false });

      const { data: dbProjects, error } = await dbQuery;

      if (!error && Array.isArray(dbProjects)) {
        // Fetch all stages, items, cellStatuses for these projects to compute live progress
        const projectIds = dbProjects.map((p) => p.id);
        const { data: dbStages } = await client.from('project_stages').select('*').in('project_id', projectIds);
        const { data: dbItems } = await client.from('project_items').select('*').in('project_id', projectIds);
        const { data: dbStatuses } = await client.from('project_item_stage_status').select('*');

        const stagesList: ProjectStageDTO[] = (dbStages || []).map((s) => ({
          id: s.id,
          projectId: s.project_id,
          name: s.name,
          sequence: s.sequence,
          plannedCompletionDate: s.planned_completion_date,
          isDefault: s.is_default,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));

        const itemsList: ProjectItemDTO[] = (dbItems || []).map((i) => ({
          id: i.id,
          projectId: i.project_id,
          material: i.material,
          drawingNumber: i.drawing_number,
          sequence: i.sequence,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
        }));

        const statusMap: Record<string, ItemStageStatusDTO> = {};
        for (const st of dbStatuses || []) {
          const key = `${st.project_item_id}_${st.project_stage_id}`;
          statusMap[key] = {
            id: st.id,
            projectItemId: st.project_item_id,
            projectStageId: st.project_stage_id,
            status: st.status,
            remark: st.remark,
            updatedBy: st.updated_by,
            updatedAt: st.updated_at,
          };
        }

        const mapped: ProjectDTO[] = dbProjects.map((p) => {
          const metrics = this.computeProjectMetrics(
            p.id,
            p.start_date,
            p.end_date,
            p.status,
            itemsList,
            stagesList,
            statusMap
          );
          return {
            id: p.id,
            projectName: p.project_name,
            customerName: p.customer_name,
            supervisorId: p.supervisor_id,
            supervisorName: p.profiles?.full_name || 'Assigned Supervisor',
            startDate: p.start_date,
            endDate: p.end_date,
            status: p.status,
            remark: p.remark,
            progressPercent: metrics.progressPercent,
            delayDays: metrics.delayDays,
            isDelayed: metrics.isDelayed,
            derivedStatus: metrics.derivedStatus,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          };
        });

        const offset = (page - 1) * limit;
        const paged = mapped.slice(offset, offset + limit);

        return {
          projects: paged,
          total: mapped.length,
          page,
          limit,
          totalPages: Math.ceil(mapped.length / limit) || 1,
        };
      }
    } catch {
      // Fall through to memory store
    }

    // 2. In-Memory Store Fallback
    let list = [...memoryProjects];

    // Supervisor scoping
    if (user.role === 'SUPERVISOR') {
      list = list.filter((p) => p.supervisorId === user.id || p.supervisorName.toLowerCase().includes('supervisor'));
    } else if (supervisorId) {
      list = list.filter((p) => p.supervisorId === supervisorId);
    }

    if (status && status !== 'ALL') {
      list = list.filter((p) => p.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.projectName.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q)
      );
    }

    const mapped: ProjectDTO[] = list.map((p) => {
      const metrics = this.computeProjectMetrics(
        p.id,
        p.startDate,
        p.endDate,
        p.status,
        memoryItems,
        memoryStages,
        memoryCellStatuses
      );
      return {
        id: p.id,
        projectName: p.projectName,
        customerName: p.customerName,
        supervisorId: p.supervisorId,
        supervisorName: p.supervisorName,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        remark: p.remark,
        progressPercent: metrics.progressPercent,
        delayDays: metrics.delayDays,
        isDelayed: metrics.isDelayed,
        derivedStatus: metrics.derivedStatus,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    const offset = (page - 1) * limit;
    const paged = mapped.slice(offset, offset + limit);

    return {
      projects: paged,
      total: mapped.length,
      page,
      limit,
      totalPages: Math.ceil(mapped.length / limit) || 1,
    };
  }

  /**
   * Retrieves single project detail with all stages, material items, and cell status map
   */
  async getProjectById(projectId: string, user: AuthenticatedUser): Promise<ProjectDetailDTO> {
    if (user.role === 'ACCOUNT') {
      throw new Error('Access denied: Accountants do not have permission to view Project Details.');
    }

    // Check in-memory store
    const memProj = memoryProjects.find((p) => p.id === projectId);
    if (!memProj) {
      throw new Error(`Project not found with ID: ${projectId}`);
    }

    // Supervisor ownership check
    if (user.role === 'SUPERVISOR' && memProj.supervisorId !== user.id && !memProj.supervisorName.toLowerCase().includes('supervisor')) {
      throw new Error('Access denied: You can only inspect projects assigned under your supervision.');
    }

    const projectStages = memoryStages
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => a.sequence - b.sequence);

    const projectItems = memoryItems
      .filter((i) => i.projectId === projectId)
      .sort((a, b) => a.sequence - b.sequence);

    const metrics = this.computeProjectMetrics(
      projectId,
      memProj.startDate,
      memProj.endDate,
      memProj.status,
      memoryItems,
      memoryStages,
      memoryCellStatuses
    );

    const projectDTO: ProjectDTO = {
      id: memProj.id,
      projectName: memProj.projectName,
      customerName: memProj.customerName,
      supervisorId: memProj.supervisorId,
      supervisorName: memProj.supervisorName,
      startDate: memProj.startDate,
      endDate: memProj.endDate,
      status: memProj.status,
      remark: memProj.remark,
      progressPercent: metrics.progressPercent,
      delayDays: metrics.delayDays,
      isDelayed: metrics.isDelayed,
      derivedStatus: metrics.derivedStatus,
      createdAt: memProj.createdAt,
      updatedAt: memProj.updatedAt,
    };

    return {
      project: projectDTO,
      stages: projectStages,
      items: projectItems,
      cellStatuses: memoryCellStatuses,
    };
  }

  /**
   * Creates a new project along with the 5 core default stages
   * Accessible only to ADMIN and SUPER_ADMIN
   */
  async createProject(input: CreateProjectInput, actor: AuthenticatedUser): Promise<ProjectDetailDTO> {
    if (actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN') {
      throw new Error('Access denied: Only Administrators and Super Administrators can provision new projects.');
    }

    const projectId = `10000000-0000-0000-0000-${String(memoryProjects.length + 1).padStart(12, '0')}`;
    const nowIso = new Date().toISOString();

    const newProject = {
      id: projectId,
      projectName: input.projectName.trim(),
      customerName: input.customerName.trim(),
      supervisorId: input.supervisorId,
      supervisorName: 'Assigned Supervisor',
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'NOT_STARTED',
      remark: input.remark || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    memoryProjects.unshift(newProject);

    // Create 5 default stages with their planned deadlines
    const defaultStagesConfig: Array<{ name: string; date: string; seq: number }> = [
      { name: 'Marking', date: input.stageDeadlines.marking, seq: 1 },
      { name: 'Cutting', date: input.stageDeadlines.cutting, seq: 2 },
      { name: 'Fitting', date: input.stageDeadlines.fitting, seq: 3 },
      { name: 'Welding', date: input.stageDeadlines.welding, seq: 4 },
      { name: 'Final', date: input.stageDeadlines.final, seq: 5 },
    ];

    const createdStages: ProjectStageDTO[] = defaultStagesConfig.map((cfg) => {
      const stageId = `20000000-0000-0000-0000-${String(memoryStages.length + 1).padStart(12, '0')}`;
      const stage: ProjectStageDTO = {
        id: stageId,
        projectId,
        name: cfg.name,
        sequence: cfg.seq,
        plannedCompletionDate: cfg.date,
        isDefault: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      memoryStages.push(stage);
      return stage;
    });

    // Create an initial sample item so execution table is immediately workable
    const sampleItemId = `30000000-0000-0000-0000-${String(memoryItems.length + 1).padStart(12, '0')}`;
    const initialItem: ProjectItemDTO = {
      id: sampleItemId,
      projectId,
      material: 'Primary Member / Plate',
      drawingNumber: 'DWG-001',
      sequence: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    memoryItems.push(initialItem);

    // Try live Supabase insertion if available
    try {
      if (hasServiceRoleKey) {
        await supabaseAdmin.from('projects').insert({
          id: projectId,
          project_name: newProject.projectName,
          customer_name: newProject.customerName,
          supervisor_id: newProject.supervisorId,
          start_date: newProject.startDate,
          end_date: newProject.endDate,
          status: newProject.status,
          remark: newProject.remark,
        });

        for (const st of createdStages) {
          await supabaseAdmin.from('project_stages').insert({
            id: st.id,
            project_id: projectId,
            name: st.name,
            sequence: st.sequence,
            planned_completion_date: st.plannedCompletionDate,
            is_default: st.isDefault,
          });
        }

        await supabaseAdmin.from('project_items').insert({
          id: initialItem.id,
          project_id: projectId,
          material: initialItem.material,
          drawing_number: initialItem.drawingNumber,
          sequence: initialItem.sequence,
        });
      }
    } catch (err) {
      console.warn('[ProjectsService.createProject] Database sync warning:', err);
    }

    // System Audit Log
    await auditService.log({
      actorId: actor.id,
      action: 'PROJECT_CREATED',
      module: 'Projects / Reports',
      resourceType: 'PROJECT',
      resourceId: projectId,
      description: `Project "${newProject.projectName}" provisioned for customer "${newProject.customerName}" with 5 default stages.`,
      newValues: {
        projectName: newProject.projectName,
        customerName: newProject.customerName,
        supervisorId: newProject.supervisorId,
        startDate: newProject.startDate,
        endDate: newProject.endDate,
      },
    });

    return this.getProjectById(projectId, actor);
  }

  /**
   * Updates an existing project's metadata
   */
  async updateProject(
    projectId: string,
    input: UpdateProjectInput,
    actor: AuthenticatedUser
  ): Promise<ProjectDetailDTO> {
    const existing = await this.getProjectById(projectId, actor);

    // Supervisor can only edit assigned project
    if (actor.role === 'SUPERVISOR' && existing.project.supervisorId !== actor.id && !existing.project.supervisorName?.toLowerCase().includes('supervisor')) {
      throw new Error('Access denied: You can only modify projects assigned under your supervision.');
    }

    const idx = memoryProjects.findIndex((p) => p.id === projectId);
    if (idx !== -1) {
      const oldValues = { ...memoryProjects[idx] };
      if (input.projectName !== undefined) memoryProjects[idx].projectName = input.projectName.trim();
      if (input.customerName !== undefined) memoryProjects[idx].customerName = input.customerName.trim();
      if (input.supervisorId !== undefined) memoryProjects[idx].supervisorId = input.supervisorId;
      if (input.startDate !== undefined) memoryProjects[idx].startDate = input.startDate;
      if (input.endDate !== undefined) memoryProjects[idx].endDate = input.endDate;
      if (input.status !== undefined) memoryProjects[idx].status = input.status;
      if (input.remark !== undefined) memoryProjects[idx].remark = input.remark;
      memoryProjects[idx].updatedAt = new Date().toISOString();

      await auditService.log({
        actorId: actor.id,
        action: input.status && input.status !== oldValues.status ? 'PROJECT_STATUS_CHANGED' : 'PROJECT_UPDATED',
        module: 'Projects / Reports',
        resourceType: 'PROJECT',
        resourceId: projectId,
        description: `Project "${memoryProjects[idx].projectName}" updated by ${actor.name}.`,
        oldValues,
        newValues: memoryProjects[idx],
      });
    }

    return this.getProjectById(projectId, actor);
  }

  /**
   * Adds a custom stage column to a project
   * Supervisor or Admin
   */
  async addStage(projectId: string, input: AddStageInput, actor: AuthenticatedUser): Promise<ProjectStageDTO> {
    const existing = await this.getProjectById(projectId, actor);

    if (actor.role === 'SUPERVISOR' && existing.project.supervisorId !== actor.id && !existing.project.supervisorName?.toLowerCase().includes('supervisor')) {
      throw new Error('Access denied: You cannot add stages to a project you do not supervise.');
    }

    const currentStages = memoryStages.filter((s) => s.projectId === projectId);
    const nextSeq = input.sequence || currentStages.length + 1;
    const stageId = `20000000-0000-0000-0000-${String(memoryStages.length + 1).padStart(12, '0')}`;
    const nowIso = new Date().toISOString();

    const newStage: ProjectStageDTO = {
      id: stageId,
      projectId,
      name: input.name.trim(),
      sequence: nextSeq,
      plannedCompletionDate: input.plannedCompletionDate,
      isDefault: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    memoryStages.push(newStage);

    await auditService.log({
      actorId: actor.id,
      action: 'PROJECT_STAGE_CREATED',
      module: 'Project Progress',
      resourceType: 'STAGE',
      resourceId: stageId,
      description: `Custom stage "${newStage.name}" added to project "${existing.project.projectName}" by ${actor.name}.`,
      newValues: newStage as unknown as Record<string, unknown>,
    });

    return newStage;
  }

  /**
   * Renames a stage column
   */
  async renameStage(
    projectId: string,
    stageId: string,
    newName: string,
    actor: AuthenticatedUser
  ): Promise<ProjectStageDTO> {
    const existing = await this.getProjectById(projectId, actor);

    if (actor.role === 'SUPERVISOR' && existing.project.supervisorId !== actor.id && !existing.project.supervisorName?.toLowerCase().includes('supervisor')) {
      throw new Error('Access denied: You cannot rename stages on a project you do not supervise.');
    }

    const stage = memoryStages.find((s) => s.id === stageId && s.projectId === projectId);
    if (!stage) {
      throw new Error('Stage not found on this project.');
    }

    const oldName = stage.name;
    stage.name = newName.trim();
    stage.updatedAt = new Date().toISOString();

    await auditService.log({
      actorId: actor.id,
      action: 'PROJECT_STAGE_RENAMED',
      module: 'Project Progress',
      resourceType: 'STAGE',
      resourceId: stageId,
      description: `Stage on project "${existing.project.projectName}" renamed from "${oldName}" to "${stage.name}".`,
      oldValues: { name: oldName },
      newValues: { name: stage.name },
    });

    return stage;
  }

  /**
   * Deletes a custom stage column
   * Prevents deletion of core 5 default stages
   */
  async deleteStage(
    projectId: string,
    stageId: string,
    actor: AuthenticatedUser
  ): Promise<{ deletedStageId: string; message: string }> {
    const existing = await this.getProjectById(projectId, actor);

    if (actor.role === 'SUPERVISOR' && existing.project.supervisorId !== actor.id && !existing.project.supervisorName?.toLowerCase().includes('supervisor')) {
      throw new Error('Access denied: You cannot delete stages on a project you do not supervise.');
    }

    const stage = memoryStages.find((s) => s.id === stageId && s.projectId === projectId);
    if (!stage) {
      throw new Error('Stage not found on this project.');
    }

    // Safety rule: Core default stages cannot be deleted
    if (stage.isDefault) {
      throw new Error(`Action rejected: Core default stage "${stage.name}" cannot be deleted.`);
    }

    const stageName = stage.name;
    memoryStages = memoryStages.filter((s) => s.id !== stageId);

    // Clean up associated cell statuses safely
    for (const key of Object.keys(memoryCellStatuses)) {
      if (key.endsWith(`_${stageId}`)) {
        delete memoryCellStatuses[key];
      }
    }

    await auditService.log({
      actorId: actor.id,
      action: 'PROJECT_STAGE_DELETED',
      module: 'Project Progress',
      resourceType: 'STAGE',
      resourceId: stageId,
      description: `Custom stage "${stageName}" deleted from project "${existing.project.projectName}" by ${actor.name}.`,
    });

    return {
      deletedStageId: stageId,
      message: `Custom stage "${stageName}" successfully deleted from project.`,
    };
  }

  /**
   * Adds a material/drawing row item to a project
   */
  async addItem(projectId: string, input: AddItemInput, actor: AuthenticatedUser): Promise<ProjectItemDTO> {
    const existing = await this.getProjectById(projectId, actor);

    if (actor.role === 'SUPERVISOR' && existing.project.supervisorId !== actor.id && !existing.project.supervisorName?.toLowerCase().includes('supervisor')) {
      throw new Error('Access denied: You cannot add items to a project you do not supervise.');
    }

    const currentItems = memoryItems.filter((i) => i.projectId === projectId);
    const nextSeq = input.sequence || currentItems.length + 1;
    const itemId = `30000000-0000-0000-0000-${String(memoryItems.length + 1).padStart(12, '0')}`;
    const nowIso = new Date().toISOString();

    const newItem: ProjectItemDTO = {
      id: itemId,
      projectId,
      material: input.material.trim(),
      drawingNumber: input.drawingNumber.trim(),
      sequence: nextSeq,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    memoryItems.push(newItem);

    return newItem;
  }

  /**
   * Updates a single stage cell status (COMPLETE / INCOMPLETE) and optional remark
   */
  async updateItemStageStatus(
    projectId: string,
    itemId: string,
    stageId: string,
    input: UpdateItemStageStatusInput,
    actor: AuthenticatedUser
  ): Promise<ItemStageStatusDTO> {
    const existing = await this.getProjectById(projectId, actor);

    if (actor.role === 'SUPERVISOR' && existing.project.supervisorId !== actor.id && !existing.project.supervisorName?.toLowerCase().includes('supervisor')) {
      throw new Error('Access denied: You cannot update stage status on a project you do not supervise.');
    }

    const stage = memoryStages.find((s) => s.id === stageId && s.projectId === projectId);
    const item = memoryItems.find((i) => i.id === itemId && i.projectId === projectId);

    if (!stage || !item) {
      throw new Error('Invalid item or stage for this project.');
    }

    const key = `${itemId}_${stageId}`;
    const oldStatus = memoryCellStatuses[key];
    const nowIso = new Date().toISOString();

    const updatedCell: ItemStageStatusDTO = {
      id: oldStatus?.id || `status-${Date.now()}`,
      projectItemId: itemId,
      projectStageId: stageId,
      status: input.status,
      remark: input.remark !== undefined ? input.remark : (oldStatus?.remark || null),
      updatedBy: actor.id,
      updatedAt: nowIso,
    };

    memoryCellStatuses[key] = updatedCell;

    // Audit changes
    if (!oldStatus || oldStatus.status !== updatedCell.status) {
      await auditService.log({
        actorId: actor.id,
        action: 'STAGE_STATUS_CHANGED',
        module: 'Project Progress',
        resourceType: 'STAGE_CELL',
        resourceId: `${itemId}:${stageId}`,
        description: `Stage "${stage.name}" for "${item.material}" marked ${updatedCell.status} on project "${existing.project.projectName}".`,
        oldValues: { status: oldStatus?.status || 'INCOMPLETE' },
        newValues: { status: updatedCell.status },
      });
    }

    if (input.remark !== undefined && input.remark !== oldStatus?.remark) {
      await auditService.log({
        actorId: actor.id,
        action: 'STAGE_REMARK_UPDATED',
        module: 'Project Progress',
        resourceType: 'STAGE_CELL',
        resourceId: `${itemId}:${stageId}`,
        description: `Remark updated on stage "${stage.name}" for "${item.material}" (${existing.project.projectName}).`,
        oldValues: { remark: oldStatus?.remark || null },
        newValues: { remark: input.remark },
      });
    }

    return updatedCell;
  }
}

export const projectsService = new ProjectsService();
