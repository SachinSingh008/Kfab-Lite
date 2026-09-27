// =============================================================================
// KFAB BASIC — Supabase Database Service (supabase-db.ts)
// Central data access layer — all Supabase queries live here.
// Views import from this file; they never call Supabase directly.
// =============================================================================

import { createClient } from './supabase/client';
import type {
  DbCompany,
  DbEmployee,
  DbAttendance,
  DbMaterial,
  DbSupplier,
  DbMaterialStock,
  DbStockInward,
  DbStockOutward,
  DbStockUsage,
  DbDailyReport,
  DbProductionLog,
  DbMachine,
  DbQaqcRecord,
  DbShopIssue,
  DbMaterialRequisition,
  DbChatGroup,
  DbChatGroupMember,
  DbChatMessage,
  DbProfile,
  InsertDailyReport,
  InsertProductionLog,
  InsertMachine,
  InsertQaqcRecord,
  InsertShopIssue,
  InsertMaterialRequisition,
  InsertEmployee,
  InsertMaterial,
  InsertSupplier,
} from './database.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function db() {
  return createClient();
}

/** Throws a consistent error if Supabase is not configured */
function requireDb() {
  const client = db();
  if (!client) throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.');
  return client;
}

export function isDbAvailable(): boolean {
  return db() !== null;
}

// =============================================================================
// MODULE 1: AUTH & PROFILES
// =============================================================================

export async function getCurrentProfile(): Promise<DbProfile | null> {
  const client = requireDb();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as DbProfile;
}

export async function signInWithPassword(email: string, password: string) {
  const client = requireDb();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = requireDb();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getAuthUser() {
  const client = requireDb();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  return user;
}

// =============================================================================
// MODULE 2: COMPANIES
// =============================================================================

export async function getMyCompanies(): Promise<DbCompany[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('companies')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []) as DbCompany[];
}

export async function getCompanyById(companyId: string): Promise<DbCompany | null> {
  const client = requireDb();
  const { data, error } = await client
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  if (error) return null;
  return data as DbCompany;
}

export async function createCompany(payload: {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
}): Promise<DbCompany> {
  const client = requireDb();
  const { data, error } = await client
    .from('companies')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbCompany;
}

// =============================================================================
// MODULE 3: EMPLOYEES
// =============================================================================

export async function getEmployees(companyId: string): Promise<DbEmployee[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'ACTIVE')
    .order('name');
  if (error) throw error;
  return (data ?? []) as DbEmployee[];
}

export async function createEmployee(payload: InsertEmployee): Promise<DbEmployee> {
  const client = requireDb();
  const { data, error } = await client
    .from('employees')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbEmployee;
}

export async function updateEmployee(id: string, updates: Partial<DbEmployee>): Promise<DbEmployee> {
  const client = requireDb();
  const { data, error } = await client
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DbEmployee;
}

// =============================================================================
// MODULE 4: ATTENDANCE
// =============================================================================

export async function getTodayAttendance(companyId: string): Promise<DbAttendance[]> {
  const client = requireDb();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const { data, error } = await client
    .from('attendance')
    .select('*, employees(name, designation, department)')
    .eq('company_id', companyId)
    .eq('date', today)
    .order('marked_at');
  if (error) throw error;
  return (data ?? []) as DbAttendance[];
}

export async function getAttendanceByDate(companyId: string, date: string): Promise<DbAttendance[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('attendance')
    .select('*, employees(name, designation, department)')
    .eq('company_id', companyId)
    .eq('date', date)
    .order('marked_at');
  if (error) throw error;
  return (data ?? []) as DbAttendance[];
}

export async function markAttendance(payload: {
  company_id: string;
  employee_id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  marked_by: string;
  client_id?: string;
}): Promise<DbAttendance> {
  const client = requireDb();
  const { data, error } = await client
    .from('attendance')
    .upsert(payload, { onConflict: 'company_id,employee_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data as DbAttendance;
}

// =============================================================================
// MODULE 5: MATERIALS & STOCK
// =============================================================================

export async function getMaterials(companyId: string): Promise<DbMaterial[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('materials')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'ACTIVE')
    .order('name');
  if (error) throw error;
  return (data ?? []) as DbMaterial[];
}

export async function getMaterialStock(companyId: string): Promise<DbMaterialStock[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('v_material_stock')
    .select('*')
    .eq('company_id', companyId)
    .order('material_name');
  if (error) throw error;
  return (data ?? []) as DbMaterialStock[];
}

export async function createMaterial(payload: InsertMaterial): Promise<DbMaterial> {
  const client = requireDb();
  const { data, error } = await client
    .from('materials')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbMaterial;
}

export async function getSuppliers(companyId: string): Promise<DbSupplier[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('suppliers')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'ACTIVE')
    .order('name');
  if (error) throw error;
  return (data ?? []) as DbSupplier[];
}

export async function createSupplier(payload: InsertSupplier): Promise<DbSupplier> {
  const client = requireDb();
  const { data, error } = await client
    .from('suppliers')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbSupplier;
}

export async function addStockInward(payload: {
  company_id: string;
  date: string;
  supplier_id: string;
  material_id: string;
  quantity: number;
  unit_code: string;
  vehicle_number?: string;
  invoice_number?: string;
  challan_number?: string;
  remarks?: string;
  created_by: string;
  client_id?: string;
}): Promise<DbStockInward> {
  const client = requireDb();
  const { data, error } = await client
    .from('stock_inward')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbStockInward;
}

export async function addStockOutward(payload: {
  company_id: string;
  date: string;
  material_id: string;
  quantity: number;
  unit_code: string;
  destination: string;
  vehicle_number?: string;
  challan_number?: string;
  remarks?: string;
  created_by: string;
  client_id?: string;
}): Promise<DbStockOutward> {
  const client = requireDb();
  const { data, error } = await client
    .from('stock_outward')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbStockOutward;
}

export async function addStockUsage(payload: {
  company_id: string;
  date: string;
  material_id: string;
  quantity: number;
  unit_code: string;
  project_name?: string;
  used_by?: string;
  remarks?: string;
  created_by: string;
  client_id?: string;
}): Promise<DbStockUsage> {
  const client = requireDb();
  const { data, error } = await client
    .from('stock_usage')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbStockUsage;
}

export async function voidStockTransaction(
  table: 'stock_inward' | 'stock_outward' | 'stock_usage',
  id: string,
  voidReason: string
): Promise<void> {
  const client = requireDb();
  const { error } = await client
    .from(table)
    .update({ status: 'VOIDED', void_reason: voidReason })
    .eq('id', id);
  if (error) throw error;
}

export async function getStockTransactions(companyId: string, limit = 50): Promise<(DbStockInward | DbStockOutward | DbStockUsage)[]> {
  const client = requireDb();
  // Fetch all three transaction types and merge
  const [inward, outward, usage] = await Promise.all([
    client.from('stock_inward').select('*, materials(name), suppliers(name)').eq('company_id', companyId).eq('status', 'ACTIVE').order('date', { ascending: false }).limit(limit),
    client.from('stock_outward').select('*, materials(name)').eq('company_id', companyId).eq('status', 'ACTIVE').order('date', { ascending: false }).limit(limit),
    client.from('stock_usage').select('*, materials(name)').eq('company_id', companyId).eq('status', 'ACTIVE').order('date', { ascending: false }).limit(limit),
  ]);
  if (inward.error) throw inward.error;
  if (outward.error) throw outward.error;
  if (usage.error) throw usage.error;
  return [...(inward.data ?? []), ...(outward.data ?? []), ...(usage.data ?? [])] as (DbStockInward | DbStockOutward | DbStockUsage)[];
}

// =============================================================================
// MODULE 6: SUPERVISOR OPERATIONS — DAILY REPORTS
// =============================================================================

export async function getDailyReports(companyId: string, limit = 100): Promise<DbDailyReport[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('daily_reports')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbDailyReport[];
}

export async function createDailyReport(payload: InsertDailyReport): Promise<DbDailyReport> {
  const client = requireDb();
  const { data, error } = await client
    .from('daily_reports')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbDailyReport;
}

export async function updateDailyReportStatus(
  id: string,
  status: 'Submitted' | 'Approved' | 'Under Review'
): Promise<void> {
  const client = requireDb();
  const { error } = await client
    .from('daily_reports')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================================
// MODULE 6B: PRODUCTION LOGS
// =============================================================================

export async function getProductionLogs(companyId: string, limit = 100): Promise<DbProductionLog[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('production_logs')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbProductionLog[];
}

export async function createProductionLog(payload: InsertProductionLog): Promise<DbProductionLog> {
  const client = requireDb();
  const { data, error } = await client
    .from('production_logs')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbProductionLog;
}

// =============================================================================
// MODULE 6C: MACHINES
// =============================================================================

export async function getMachines(companyId: string): Promise<DbMachine[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('machines')
    .select('*')
    .eq('company_id', companyId)
    .order('machine_code');
  if (error) throw error;
  return (data ?? []) as DbMachine[];
}

export async function createMachine(payload: InsertMachine): Promise<DbMachine> {
  const client = requireDb();
  const { data, error } = await client
    .from('machines')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbMachine;
}

export async function updateMachineStatus(
  id: string,
  status: 'Operational' | 'Maintenance' | 'Standby' | 'Breakdown',
  runningHrsToday?: number
): Promise<void> {
  const client = requireDb();
  const { error } = await client
    .from('machines')
    .update({ status, ...(runningHrsToday !== undefined && { running_hrs_today: runningHrsToday }) })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================================
// MODULE 6D: QA/QC RECORDS
// =============================================================================

export async function getQaqcRecords(companyId: string, limit = 100): Promise<DbQaqcRecord[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('qaqc_records')
    .select('*')
    .eq('company_id', companyId)
    .order('inspection_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbQaqcRecord[];
}

export async function createQaqcRecord(payload: InsertQaqcRecord): Promise<DbQaqcRecord> {
  const client = requireDb();
  const { data, error } = await client
    .from('qaqc_records')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbQaqcRecord;
}

// =============================================================================
// MODULE 6E: SHOP ISSUES
// =============================================================================

export async function getShopIssues(companyId: string, limit = 100): Promise<DbShopIssue[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('shop_issues')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbShopIssue[];
}

export async function createShopIssue(payload: InsertShopIssue): Promise<DbShopIssue> {
  const client = requireDb();
  const { data, error } = await client
    .from('shop_issues')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbShopIssue;
}

export async function updateShopIssueStatus(
  id: string,
  status: 'Open' | 'In Progress' | 'Under Repair' | 'Resolved' | 'Closed'
): Promise<void> {
  const client = requireDb();
  const updates: Partial<DbShopIssue> = { status };
  if (status === 'Resolved' || status === 'Closed') {
    updates.resolved_at = new Date().toISOString();
  }
  const { error } = await client.from('shop_issues').update(updates).eq('id', id);
  if (error) throw error;
}

// =============================================================================
// MODULE 6F: MATERIAL REQUISITIONS
// =============================================================================

export async function getMaterialRequisitions(companyId: string, limit = 100): Promise<DbMaterialRequisition[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('material_requisitions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbMaterialRequisition[];
}

export async function createMaterialRequisition(payload: InsertMaterialRequisition): Promise<DbMaterialRequisition> {
  const client = requireDb();
  const { data, error } = await client
    .from('material_requisitions')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbMaterialRequisition;
}

export async function approveMaterialRequisition(
  id: string,
  approvedById: string,
  newStatus: 'Approved' | 'PO Placed' | 'Issued' | 'Rejected'
): Promise<void> {
  const client = requireDb();
  const { error } = await client
    .from('material_requisitions')
    .update({
      status: newStatus,
      approved_by: approvedById,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

// =============================================================================
// MODULE 7: CHAT
// =============================================================================

export async function getChatGroups(): Promise<DbChatGroup[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('chat_groups')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbChatGroup[];
}

export async function getChatGroupMembers(groupId: string): Promise<DbChatGroupMember[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('chat_group_members')
    .select('*, profiles(full_name, avatar_url)')
    .eq('group_id', groupId);
  if (error) throw error;
  return (data ?? []) as DbChatGroupMember[];
}

export async function getChatMessages(groupId: string, limit = 100): Promise<DbChatMessage[]> {
  const client = requireDb();
  const { data, error } = await client
    .from('chat_messages')
    .select('*, profiles(full_name, avatar_url)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbChatMessage[];
}

export async function sendChatMessage(payload: {
  group_id: string;
  sender_id: string;
  message_text?: string;
  media_url?: string;
  media_type?: 'IMAGE' | 'FILE' | 'AUDIO' | 'DOCUMENT';
  caption?: string;
  target_scope: 'ALL' | 'LEADS_AND_SENDER' | 'ROLE' | 'USERS';
  target_role?: string;
  target_user_ids?: string[];
}): Promise<DbChatMessage> {
  const client = requireDb();
  const { data, error } = await client
    .from('chat_messages')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbChatMessage;
}

export async function createChatGroup(payload: {
  company_id?: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
}): Promise<DbChatGroup> {
  const client = requireDb();
  const { data, error } = await client
    .from('chat_groups')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbChatGroup;
}

export async function addChatGroupMember(payload: {
  group_id: string;
  user_id: string;
  is_lead?: boolean;
  can_view_all?: boolean;
  role_in_group?: string;
}): Promise<DbChatGroupMember> {
  const client = requireDb();
  const { data, error } = await client
    .from('chat_group_members')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbChatGroupMember;
}

// Real-time subscription for chat messages
export function subscribeToChatMessages(
  groupId: string,
  onNewMessage: (message: DbChatMessage) => void
) {
  const client = db();
  if (!client) return () => {};

  const channel = client
    .channel(`chat:${groupId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `group_id=eq.${groupId}` },
      (payload) => onNewMessage(payload.new as DbChatMessage)
    )
    .subscribe();

  return () => { client.removeChannel(channel); };
}

// =============================================================================
// MODULE 8: USER MANAGEMENT (SUPER ADMIN)
// =============================================================================

export async function getCompanyMembers(companyId: string) {
  const client = requireDb();
  const { data, error } = await client
    .from('company_members')
    .select('*, profiles(full_name, phone, avatar_url)')
    .eq('company_id', companyId)
    .eq('status', 'ACTIVE');
  if (error) throw error;
  return data ?? [];
}

export async function inviteCompanyMember(payload: {
  company_id: string;
  user_id: string;
  role: string;
}): Promise<void> {
  const client = requireDb();
  const { error } = await client.from('company_members').insert(payload);
  if (error) throw error;
}

export async function updateMemberRole(memberId: string, role: string): Promise<void> {
  const client = requireDb();
  const { error } = await client
    .from('company_members')
    .update({ role })
    .eq('id', memberId);
  if (error) throw error;
}

export async function deactivateMember(memberId: string): Promise<void> {
  const client = requireDb();
  const { error } = await client
    .from('company_members')
    .update({ status: 'DEACTIVATED' })
    .eq('id', memberId);
  if (error) throw error;
}
