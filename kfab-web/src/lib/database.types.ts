// =============================================================================
// KFAB BASIC — Supabase PostgreSQL Database Type Definitions
// Auto-aligned with migrations 01–08
// =============================================================================

export type AppRole = 'ADMIN' | 'ACCOUNTS' | 'SUPERVISOR' | 'STOREKEEPER' | 'VIEWER' | 'ATTENDANCE_USER';

// ─── Auth & Profiles ─────────────────────────────────────────────────────────
export interface DbProfile {
  id: string; // uuid, references auth.users
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Companies & Members ──────────────────────────────────────────────────────
export interface DbCompany {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: AppRole;
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
  created_at: string;
  updated_at: string;
}

// ─── Workforce & Attendance ───────────────────────────────────────────────────
export interface DbEmployee {
  id: string;
  company_id: string;
  employee_code: string;
  name: string;
  photo_url: string | null;
  mobile: string | null;
  designation: string;
  department: string;
  joining_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAttendance {
  id: string;
  company_id: string;
  employee_id: string;
  date: string; // ISO date string
  status: 'PRESENT' | 'ABSENT';
  marked_at: string;
  marked_by: string;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Materials & Stock ────────────────────────────────────────────────────────
export interface DbUnit {
  code: string;
  name: string;
  description: string | null;
  is_standard: boolean;
  created_at: string;
}

export interface DbMaterial {
  id: string;
  company_id: string;
  material_code: string;
  name: string;
  category: string;
  specification: string | null;
  unit_code: string;
  minimum_stock: number;
  status: 'ACTIVE' | 'DISCONTINUED' | 'INACTIVE';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSupplier {
  id: string;
  company_id: string;
  supplier_code: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStockInward {
  id: string;
  company_id: string;
  date: string;
  supplier_id: string;
  material_id: string;
  quantity: number;
  unit_code: string;
  vehicle_number: string | null;
  invoice_number: string | null;
  challan_number: string | null;
  received_by: string | null;
  remarks: string | null;
  attachment_url: string | null;
  status: 'ACTIVE' | 'VOIDED' | 'CANCELLED';
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  client_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbStockOutward {
  id: string;
  company_id: string;
  date: string;
  material_id: string;
  quantity: number;
  unit_code: string;
  destination: string;
  vehicle_number: string | null;
  driver: string | null;
  challan_number: string | null;
  issued_by: string | null;
  received_by_name: string | null;
  remarks: string | null;
  attachment_url: string | null;
  status: 'ACTIVE' | 'VOIDED' | 'CANCELLED';
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  client_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbStockUsage {
  id: string;
  company_id: string;
  date: string;
  material_id: string;
  quantity: number;
  unit_code: string;
  project_name: string | null;
  used_by: string | null;
  remarks: string | null;
  status: 'ACTIVE' | 'VOIDED' | 'CANCELLED';
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  client_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Computed view: v_material_stock
export interface DbMaterialStock {
  material_id: string;
  company_id: string;
  material_code: string;
  material_name: string;
  category: string;
  specification: string | null;
  unit_code: string;
  minimum_stock: number;
  material_status: 'ACTIVE' | 'DISCONTINUED' | 'INACTIVE';
  total_inward: number;
  total_outward: number;
  total_usage: number;
  current_stock: number;
  is_low_stock: boolean;
}

// ─── Supervisor Operations (Migration 08) ─────────────────────────────────────

export interface DbDailyReport {
  id: string;
  company_id: string;
  report_code: string;
  project: string;
  date: string;
  shift: 'Day Shift' | 'Night Shift' | 'General Shift';
  planned_work: string;
  completed_work: string | null;
  completion_percent: number;
  worker_count: number;
  welder_count: number | null;
  fitter_count: number | null;
  rigger_count: number | null;
  machine_count: number;
  machine_name: string | null;
  machine_hours: number | null;
  qa_result: 'Passed' | 'Observation' | 'Failed';
  qa_notes: string | null;
  issue_title: string | null;
  issue_severity: 'Low' | 'Medium' | 'High' | null;
  req_item: string | null;
  req_urgency: 'Low' | 'Medium' | 'High' | null;
  supervisor_notes: string | null;
  status: 'Submitted' | 'Approved' | 'Under Review';
  submitted_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbProductionLog {
  id: string;
  company_id: string;
  log_code: string;
  project: string;
  bay: string;
  planned_mt: number;
  completed_mt: number;
  scrap_mt: number;
  efficiency_percent: number; // GENERATED column
  shift: 'Day Shift' | 'Night Shift' | 'General Shift';
  supervisor_name: string | null;
  date: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbMachine {
  id: string;
  company_id: string;
  machine_code: string;
  name: string;
  make: string | null;
  capacity: string | null;
  operator_name: string | null;
  status: 'Operational' | 'Maintenance' | 'Standby' | 'Breakdown';
  running_hrs_today: number;
  next_service_date: string | null;
  last_service_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbQaqcRecord {
  id: string;
  company_id: string;
  record_code: string;
  project: string;
  component: string;
  test_type: string;
  standard: string;
  inspector_name: string;
  result: 'Passed' | 'Observation' | 'Failed';
  inspection_date: string;
  notes: string | null;
  attachment_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbShopIssue {
  id: string;
  company_id: string;
  issue_code: string;
  project: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string | null;
  reported_by_name: string;
  assigned_to_name: string | null;
  target_date: string | null;
  resolved_at: string | null;
  status: 'Open' | 'In Progress' | 'Under Repair' | 'Resolved' | 'Closed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbMaterialRequisition {
  id: string;
  company_id: string;
  req_code: string;
  project: string;
  item_description: string;
  quantity: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  requested_by_name: string;
  required_by_date: string | null;
  status: 'Pending Approval' | 'Approved' | 'PO Placed' | 'Issued' | 'Rejected';
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Chat (Migration 07) ──────────────────────────────────────────────────────
export interface DbChatGroup {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_direct_chat: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbChatGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  is_lead: boolean;
  can_view_all: boolean;
  role_in_group: string;
  joined_at: string;
}

export interface DbChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  message_text: string | null;
  media_url: string | null;
  media_type: 'IMAGE' | 'FILE' | 'AUDIO' | 'DOCUMENT' | null;
  caption: string | null;
  target_scope: 'ALL' | 'LEADS_AND_SENDER' | 'ROLE' | 'USERS';
  target_role: string | null;
  target_user_ids: string[];
  created_at: string;
}

// ─── Correction Requests ──────────────────────────────────────────────────────
export interface DbCorrectionRequest {
  id: string;
  company_id: string;
  module: 'ATTENDANCE' | 'STOCK_INWARD' | 'STOCK_OUTWARD' | 'STOCK_USAGE';
  record_id: string | null;
  target_date: string;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';
  requested_data: Record<string, unknown>;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export interface DbAuditLog {
  id: string;
  company_id: string | null;
  user_id: string | null;
  module: string;
  action: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Insert Payloads (subset of DB types without server-generated fields) ─────
export type InsertDailyReport = Omit<DbDailyReport, 'id' | 'created_at' | 'updated_at'>;
export type InsertProductionLog = Omit<DbProductionLog, 'id' | 'efficiency_percent' | 'created_at' | 'updated_at'>;
export type InsertMachine = Omit<DbMachine, 'id' | 'created_at' | 'updated_at'>;
export type InsertQaqcRecord = Omit<DbQaqcRecord, 'id' | 'created_at' | 'updated_at'>;
export type InsertShopIssue = Omit<DbShopIssue, 'id' | 'created_at' | 'updated_at'>;
export type InsertMaterialRequisition = Omit<DbMaterialRequisition, 'id' | 'created_at' | 'updated_at'>;
export type InsertEmployee = Omit<DbEmployee, 'id' | 'created_at' | 'updated_at'>;
export type InsertMaterial = Omit<DbMaterial, 'id' | 'created_at' | 'updated_at'>;
export type InsertSupplier = Omit<DbSupplier, 'id' | 'created_at' | 'updated_at'>;
