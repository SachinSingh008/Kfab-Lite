"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  Search,
  ShieldCheck,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  RefreshCw,
  KeyRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Building2,
  Briefcase,
  History,
  Info,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  apiGetUsers,
  apiGetUserById,
  apiCreateUser,
  apiUpdateUser,
  apiDeactivateUser,
  apiActivateUser,
  apiResetPassword,
  apiRevokeSessions,
  apiGetEmployees,
  ApiUserDTO,
  ApiEmployeeDTO,
  AuditLogDTO,
  ROLE_DEFAULT_PERMISSIONS,
} from "@/lib/api-client";

export function UsersView() {
  // ============================================================================
  // State: List & Filters
  // ============================================================================
  const [users, setUsers] = useState<ApiUserDTO[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active employees catalog for employee mapping
  const [employees, setEmployees] = useState<ApiEmployeeDTO[]>([]);

  // ============================================================================
  // State: Modals & Drawers
  // ============================================================================
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  const [viewingUser, setViewingUser] = useState<(ApiUserDTO & { auditLogs?: AuditLogDTO[] }) | null>(null);
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false);

  const [editingUser, setEditingUser] = useState<ApiUserDTO | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<ApiUserDTO | null>(null);
  const [revokeSessionUser, setRevokeSessionUser] = useState<ApiUserDTO | null>(null);
  const [statusToggleUser, setStatusToggleUser] = useState<ApiUserDTO | null>(null);

  // ============================================================================
  // State: Create Form (6-Step Wizard)
  // ============================================================================
  const [createFullName, setCreateFullName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createEmployeeId, setCreateEmployeeId] = useState("");
  const [createDepartment, setCreateDepartment] = useState("");
  const [createDesignation, setCreateDesignation] = useState("");
  const [createRole, setCreateRole] = useState("SUPERVISOR");
  const [createPassword, setCreatePassword] = useState("");
  const [createStatus, setCreateStatus] = useState("ACTIVE");
  const [createForceReset, setCreateForceReset] = useState(true);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createConfirmed, setCreateConfirmed] = useState(false);

  // ============================================================================
  // State: Edit Form
  // ============================================================================
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editRole, setEditRole] = useState("SUPERVISOR");
  const [editStatus, setEditStatus] = useState("ACTIVE");

  // ============================================================================
  // State: Action Modals
  // ============================================================================
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetForceReset, setResetForceReset] = useState(true);
  const [resetRevokeSessions, setResetRevokeSessions] = useState(true);
  const [revokeReason, setRevokeReason] = useState("");

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ============================================================================
  // Data Fetching: Authoritative Backend API
  // ============================================================================
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiGetUsers({
        search: searchTerm || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        department: deptFilter !== 'ALL' ? deptFilter : undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: pageSize,
      });

      setUsers(response.users || []);
      setTotalUsers(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to fetch users from Fastify API:", err);
      showNotice("error", err instanceof Error ? err.message : "Failed to load users from backend API.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await apiGetEmployees();
      setEmployees(res.employees || []);
    } catch {
      // Optional fallback
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter, statusFilter, deptFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    loadEmployees();
  }, []);

  // Distinct departments for filter
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // ============================================================================
  // View User Profile Drawer
  // ============================================================================
  const openUserDetails = async (user: ApiUserDTO) => {
    setViewingUser(user);
    setIsLoadingUserDetail(true);
    try {
      const details = await apiGetUserById(user.id);
      setViewingUser(details.user);
    } catch (err: unknown) {
      console.warn("Could not load full user detail audit history:", err);
    } finally {
      setIsLoadingUserDetail(false);
    }
  };

  // ============================================================================
  // Create User Handlers
  // ============================================================================
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreatePassword(pwd);
  };

  const resetCreateForm = () => {
    setCreateFullName("");
    setCreateUsername("");
    setCreateEmail("");
    setCreateEmployeeId("");
    setCreateDepartment("");
    setCreateDesignation("");
    setCreateRole("SUPERVISOR");
    setCreatePassword("");
    setCreateStatus("ACTIVE");
    setCreateForceReset(true);
    setCreateConfirmed(false);
    setCreateStep(1);
    setShowCreateModal(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createConfirmed) {
      showNotice("error", "Please confirm that you have reviewed the user profile before creating.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiCreateUser({
        fullName: createFullName,
        username: createUsername,
        email: createEmail,
        employeeId: createEmployeeId || null,
        department: createDepartment || null,
        designation: createDesignation || null,
        role: createRole,
        initialPassword: createPassword,
        status: createStatus,
        forcePasswordReset: createForceReset,
      });

      showNotice("success", `User "${res.user.fullName}" (${res.user.email}) created successfully.`);
      resetCreateForm();
      loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Failed to create user via backend API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Edit User Handlers
  // ============================================================================
  const openEditModal = (user: ApiUserDTO) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditEmail(user.email);
    setEditDepartment(user.department || "");
    setEditDesignation(user.designation || "");
    setEditEmployeeId(user.employeeId || "");
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const res = await apiUpdateUser(editingUser.id, {
        fullName: editFullName,
        email: editEmail,
        department: editDepartment || null,
        designation: editDesignation || null,
        employeeId: editEmployeeId || null,
        role: editRole,
        status: editStatus,
      });

      showNotice("success", `User "${res.user.fullName}" updated successfully in database.`);
      setEditingUser(null);
      loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Deactivate / Activate Handlers
  // ============================================================================
  const handleToggleStatus = async () => {
    if (!statusToggleUser) return;
    setIsSubmitting(true);
    try {
      if (statusToggleUser.status === "ACTIVE") {
        await apiDeactivateUser(statusToggleUser.id);
        showNotice("success", `User "${statusToggleUser.fullName}" deactivated & sessions terminated.`);
      } else {
        await apiActivateUser(statusToggleUser.id);
        showNotice("success", `User "${statusToggleUser.fullName}" reactivated.`);
      }
      setStatusToggleUser(null);
      loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Password Reset Handler
  // ============================================================================
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;

    setIsSubmitting(true);
    try {
      const res = await apiResetPassword(passwordResetUser.id, {
        newPassword: resetNewPassword || undefined,
        forcePasswordReset: resetForceReset,
        revokeExistingSessions: resetRevokeSessions,
      });

      showNotice("success", res.message);
      setPasswordResetUser(null);
      setResetNewPassword("");
      loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Revoke Sessions Handler
  // ============================================================================
  const handleRevokeSessionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeSessionUser) return;

    setIsSubmitting(true);
    try {
      const res = await apiRevokeSessions(revokeSessionUser.id, revokeReason || undefined);
      showNotice("success", res.message);
      setRevokeSessionUser(null);
      setRevokeReason("");
      loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Session revocation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role Badge Helper
  const getRoleBadge = (role: string, isSuper?: boolean) => {
    if (isSuper || role === "SUPER_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-900 text-amber-300 border border-slate-700 shadow-xs">
          <ShieldAlert className="size-3 text-amber-400" />
          SUPER ADMIN
        </span>
      );
    }
    switch (role) {
      case "ADMIN":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">ADMIN</span>;
      case "SUPERVISOR":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">SUPERVISOR</span>;
      case "ACCOUNTANT":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">ACCOUNTANT</span>;
      case "STOREKEEPER":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">STOREKEEPER</span>;
      case "ATTENDANCE_USER":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">ATTENDANCE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{role}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Alert Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in-50 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="size-4.5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-slate-800 p-1">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
              <Users className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#172033]">Enterprise User Management</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#0F172A] font-bold text-[10px] tracking-wider border border-[#CBD5E1]">
                  REST API v1 &bull; RBAC
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Centralized ERP identity administration, role-based authorizations, credential lifecycle, and security auditing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => loadUsers()}
            disabled={isLoading}
            title="Reload authoritative roster from Fastify API"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-[#CBD5E1] text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync Live DB</span>
          </button>

          <button
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg shadow-kfab transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="size-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Search & Comprehensive Filters */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-kfab space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="size-4 absolute left-3 top-2.5 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-medium placeholder-[#64748B]"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#172033] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="STOREKEEPER">Storekeeper</option>
              <option value="ATTENDANCE_USER">Attendance User</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#172033] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated Accounts</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] bg-white text-[#172033] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="ALL">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort and Result Count Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span>Showing {users.length} of {totalUsers} registered users</span>
            {isLoading && <RefreshCw className="size-3 animate-spin text-blue-600" />}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-md font-medium text-slate-700 bg-white"
            >
              <option value="created_at">Created Date</option>
              <option value="name">Full Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="status">Status</option>
              <option value="last_login_at">Last Login</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-2 py-1 text-xs border border-slate-200 rounded-md font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {sortOrder === "asc" ? "▲ Ascending" : "▼ Descending"}
            </button>
          </div>
        </div>
      </div>

      {/* Users Master Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-kfab overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">User & Identity</th>
                <th className="py-3 px-4">Organization & Employee</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#172033] font-medium">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="size-5 animate-spin text-[#2563EB]" />
                      <span className="text-xs font-semibold">Loading users from backend API...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Users className="size-8 text-slate-300 mb-1" />
                      <span className="font-bold text-slate-700">No matching user accounts found</span>
                      <p className="text-[11px] text-slate-400">Try adjusting your search criteria or clearing filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {u.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {u.forcePasswordReset && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300" title="Password reset required on next login">
                                RESET REQ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#64748B] font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Employee */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800">
                          {u.department || <span className="text-slate-400 font-normal italic">General Plant</span>}
                          {u.designation && <span className="text-slate-500 font-normal text-[11px]"> &bull; {u.designation}</span>}
                        </div>
                        {u.employeeCode ? (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-700">
                            <Briefcase className="size-3 text-slate-500" />
                            <span>{u.employeeCode} {u.employeeName && `(${u.employeeName})`}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No employee linked</span>
                        )}
                      </div>
                    </td>

                    {/* System Role */}
                    <td className="py-3 px-4">{getRoleBadge(u.role, u.isSuperAdmin)}</td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {u.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                          <span className="size-2 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Last Activity */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {u.lastLoginAt ? (
                        <div>
                          <span className="font-semibold text-slate-700">
                            {new Date(u.lastLoginAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>{" "}
                          at{" "}
                          {new Date(u.lastLoginAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Never logged in</span>
                      )}
                      <div className="text-[10px] text-slate-400">
                        Joined {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => openUserDetails(u)}
                          title="View user details & security audit history"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Info className="size-3.5" />
                        </button>

                        {/* Edit User */}
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit user details & role assignment"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Edit2 className="size-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => setPasswordResetUser(u)}
                          title="Administrative password reset override"
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        >
                          <KeyRound className="size-3.5" />
                        </button>

                        {/* Revoke Sessions */}
                        <button
                          onClick={() => setRevokeSessionUser(u)}
                          title="Revoke active sessions"
                          className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                        >
                          <LogOut className="size-3.5" />
                        </button>

                        {/* Activate / Deactivate Toggle (Protected for last super admin) */}
                        <button
                          onClick={() => setStatusToggleUser(u)}
                          title={u.status === "ACTIVE" ? "Deactivate user" : "Activate user"}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            u.status === "ACTIVE"
                              ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {u.status === "ACTIVE" ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-slate-50 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-600">
            <div>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalUsers} total users)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================ */}
      {/* 6-STEP CREATE USER MODAL WIZARD                                             */}
      {/* ============================================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="size-4 text-slate-900" />
                  Provision Authorized User (Step {createStep} of 5)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Follow the multi-step verification pipeline to provision an enterprise account.
                </p>
              </div>
              <button onClick={resetCreateForm} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="size-4.5" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="py-3 flex items-center justify-between border-b border-slate-100">
              {[
                { num: 1, label: "Identity" },
                { num: 2, label: "Org" },
                { num: 3, label: "Security" },
                { num: 4, label: "Permissions" },
                { num: 5, label: "Review" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-1.5">
                  <span
                    className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      createStep === s.num
                        ? "bg-slate-900 text-white"
                        : createStep > s.num
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {createStep > s.num ? "✓" : s.num}
                  </span>
                  <span className={`text-[11px] font-semibold ${createStep === s.num ? "text-slate-900" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  {s.num < 5 && <span className="text-slate-300 text-xs mx-1">›</span>}
                </div>
              ))}
            </div>

            {/* Form Content Steps */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {/* STEP 1: Basic Identity */}
              {createStep === 1 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra Kulkarni"
                      value={createFullName}
                      onChange={(e) => setCreateFullName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Username / Login ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ramesh.kulkarni or ramesh@kfab.in"
                      value={createUsername}
                      onChange={(e) => setCreateUsername(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Authoritative Work Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@kfab.in"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">This email acts as the primary login identifier in Supabase Auth.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Link Employee Record (Optional)</label>
                    <select
                      value={createEmployeeId}
                      onChange={(e) => {
                        setCreateEmployeeId(e.target.value);
                        const emp = employees.find((x) => x.id === e.target.value);
                        if (emp) {
                          if (!createDepartment && emp.department) setCreateDepartment(emp.department);
                          if (!createDesignation && emp.designation) setCreateDesignation(emp.designation);
                        }
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">-- No linked employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.employee_code} — {emp.name} ({emp.department})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: Organization */}
              {createStep === 2 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Fabrication, Accounts, Quality, Store"
                      value={createDepartment}
                      onChange={(e) => setCreateDepartment(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Shop Floor In-Charge, Shift Supervisor"
                      value={createDesignation}
                      onChange={(e) => setCreateDesignation(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Assigned System Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="SUPERVISOR">Supervisor — Shop floor team muster & bay raw-material usage</option>
                      <option value="ADMIN">Admin — Full plant management & user administration</option>
                      <option value="ACCOUNTANT">Accountant — Stock ledgers, reconciliation & financial reports</option>
                      <option value="STOREKEEPER">Storekeeper — Inward gate entries & outward material dispatches</option>
                      <option value="ATTENDANCE_USER">Attendance User — Team punch-in on current business date</option>
                      <option value="VIEWER">Viewer — Read-only observation</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 3: Security & Credentials */}
              {createStep === 3 && (
                <div className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-800">
                        Initial Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="size-3" />
                        Generate Strong Password
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showCreatePassword ? "text" : "password"}
                        required
                        placeholder="At least 8 characters"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        className="w-full p-2.5 pr-10 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {showCreatePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Initial Account Status</label>
                    <select
                      value={createStatus}
                      onChange={(e) => setCreateStatus(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE (Immediate login permitted)</option>
                      <option value="INACTIVE">INACTIVE (Staged, access disabled)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="forcePasswordResetCheck"
                      checked={createForceReset}
                      onChange={(e) => setCreateForceReset(e.target.checked)}
                      className="mt-0.5 size-4 rounded text-blue-600"
                    />
                    <label htmlFor="forcePasswordResetCheck" className="text-xs text-amber-900 font-semibold cursor-pointer">
                      Force password reset on first login
                      <p className="text-[10px] font-normal text-amber-700 mt-0.5">
                        User will be mandated to change this initial temporary password upon initial authentication.
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 4: Permissions Review */}
              {createStep === 4 && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-slate-800 mb-1">Effective Role Permissions for "{createRole}"</h5>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Permissions are enforced strictly by the backend Fastify RBAC engine on every operational mutation.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                      {(ROLE_DEFAULT_PERMISSIONS[createRole] || []).map((p: string) => (
                        <div key={p} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-mono bg-white p-1.5 rounded border border-slate-200">
                          <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Final Review & Confirmation */}
              {createStep === 5 && (
                <div className="space-y-3.5">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-900 text-xs border-b pb-1.5">Account Summary Review</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Full Name:</span>
                        <div className="font-bold text-slate-800">{createFullName}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Username:</span>
                        <div className="font-mono font-semibold text-slate-800">{createUsername}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Email (Login):</span>
                        <div className="font-mono text-slate-800">{createEmail}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Assigned Role:</span>
                        <div>{getRoleBadge(createRole)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Department:</span>
                        <div className="font-semibold text-slate-800">{createDepartment || "General"}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Initial Status:</span>
                        <div className="font-semibold text-slate-800">{createStatus}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="confirmCreation"
                      required
                      checked={createConfirmed}
                      onChange={(e) => setCreateConfirmed(e.target.checked)}
                      className="mt-0.5 size-4 rounded text-blue-600"
                    />
                    <label htmlFor="confirmCreation" className="text-xs text-blue-950 font-bold cursor-pointer">
                      I explicitly confirm the provisioning of this enterprise account.
                      <p className="text-[10px] font-normal text-blue-800 mt-0.5">
                        This action will register the user in Supabase Auth, assign verified RBAC permissions, and write an immutable security audit event.
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Footer */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (createStep > 1) setCreateStep((s) => s - 1);
                    else resetCreateForm();
                  }}
                  className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 flex items-center gap-1"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>{createStep === 1 ? "Cancel" : "Back"}</span>
                </button>

                {createStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (createStep === 1 && (!createFullName || !createUsername || !createEmail)) {
                        showNotice("error", "Please complete all mandatory fields in Step 1.");
                        return;
                      }
                      if (createStep === 3 && createPassword.length < 8) {
                        showNotice("error", "Password must be at least 8 characters.");
                        return;
                      }
                      setCreateStep((s) => s + 1);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !createConfirmed}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting && <RefreshCw className="size-3.5 animate-spin" />}
                    <span>{isSubmitting ? "Provisioning..." : "Confirm & Create User"}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* USER DETAIL & AUDIT HISTORY DRAWER                                           */}
      {/* ============================================================================ */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white h-full max-w-md w-full shadow-2xl border-l border-slate-200 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-900 text-white">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{viewingUser.fullName}</h4>
                  <div className="text-[11px] text-slate-500 font-mono">{viewingUser.email}</div>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="size-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Security Role</span>
                  <div className="mt-0.5">{getRoleBadge(viewingUser.role, viewingUser.isSuperAdmin)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Account State</span>
                  <div className="font-bold mt-0.5">
                    {viewingUser.status === "ACTIVE" ? (
                      <span className="text-emerald-700 font-bold">Active & Allowed</span>
                    ) : (
                      <span className="text-rose-700 font-bold">Deactivated</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity & Org Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px]">User UUID:</span>
                  <div className="font-mono text-[10px] text-slate-700 break-all">{viewingUser.id}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Department:</span>
                  <div className="font-semibold text-slate-800">{viewingUser.department || "General Plant"}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Designation:</span>
                  <div className="font-semibold text-slate-800">{viewingUser.designation || "Operational Staff"}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Linked Employee:</span>
                  <div className="font-semibold text-slate-800">
                    {viewingUser.employeeCode ? `${viewingUser.employeeCode}` : "None"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Force Password Reset:</span>
                  <div className="font-semibold text-slate-800">{viewingUser.forcePasswordReset ? "Mandatory" : "No"}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Last Login:</span>
                  <div className="font-semibold text-slate-800">
                    {viewingUser.lastLoginAt ? new Date(viewingUser.lastLoginAt).toLocaleString("en-IN") : "Never"}
                  </div>
                </div>
              </div>

              {/* Audit History Timeline */}
              <div>
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <History className="size-4 text-slate-700" />
                  <span>Security Audit Trail</span>
                </h5>

                {isLoadingUserDetail ? (
                  <div className="p-4 text-center text-slate-400">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-1 text-blue-600" />
                    <span>Loading audit records...</span>
                  </div>
                ) : !viewingUser.auditLogs || viewingUser.auditLogs.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 italic">
                    No security events recorded for this user yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {viewingUser.auditLogs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-mono text-slate-800">{log.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.created_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {log.reason && <p className="text-slate-600 italic text-[10px]">{log.reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 mt-auto flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* EDIT USER MODAL                                                              */}
      {/* ============================================================================ */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="size-4 text-slate-800" />
                Edit User Profile & Role
              </h4>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Linked Employee</label>
                <select
                  value={editEmployeeId}
                  onChange={(e) => setEditEmployeeId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">-- No linked employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} — {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {editingUser.role !== "SUPER_ADMIN" ? (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Assigned Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="STOREKEEPER">Storekeeper</option>
                    <option value="ATTENDANCE_USER">Attendance User</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-amber-700 shrink-0" />
                  <span>Super Admin account role is immutable for system security.</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to authenticate)</option>
                  <option value="INACTIVE">INACTIVE (Deactivated, sessions blocked)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="size-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Updating..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* PASSWORD RESET CONFIRMATION MODAL                                            */}
      {/* ============================================================================ */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 relative">
            <div className="flex items-center gap-2.5 text-amber-600 mb-3">
              <div className="p-2 rounded-full bg-amber-100">
                <KeyRound className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Administrative Password Reset</h4>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Reset credentials for user <strong className="text-slate-900">{passwordResetUser.fullName}</strong> ({passwordResetUser.email}).
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  New Direct Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty to send email reset link"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  If left blank, an authoritative GoTrue reset link will be dispatched to the user's email.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={resetForceReset}
                    onChange={(e) => setResetForceReset(e.target.checked)}
                    className="size-4 rounded text-blue-600"
                  />
                  <span>Mandate password change on next login</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={resetRevokeSessions}
                    onChange={(e) => setResetRevokeSessions(e.target.checked)}
                    className="size-4 rounded text-blue-600"
                  />
                  <span>Terminate all currently active sessions</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="size-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Resetting..." : "Confirm Reset"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* REVOKE SESSIONS CONFIRMATION MODAL                                           */}
      {/* ============================================================================ */}
      {revokeSessionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 relative">
            <div className="flex items-center gap-2.5 text-purple-600 mb-3">
              <div className="p-2 rounded-full bg-purple-100">
                <LogOut className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Revoke Active Sessions</h4>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Terminate all authenticated JWT refresh tokens and active sessions for{" "}
              <strong className="text-slate-900">{revokeSessionUser.fullName}</strong>. The user will be immediately logged out across all devices.
            </p>

            <form onSubmit={handleRevokeSessionsSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Reason for Revocation (Audit Trail)</label>
                <input
                  type="text"
                  placeholder="e.g. Device lost, scheduled security rotation"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRevokeSessionUser(null)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="size-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Revoking..." : "Revoke All Sessions"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* ACTIVATE / DEACTIVATE CONFIRMATION MODAL                                     */}
      {/* ============================================================================ */}
      {statusToggleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 relative">
            <div className={`flex items-center gap-2.5 mb-3 ${statusToggleUser.status === "ACTIVE" ? "text-rose-600" : "text-emerald-600"}`}>
              <div className={`p-2 rounded-full ${statusToggleUser.status === "ACTIVE" ? "bg-rose-100" : "bg-emerald-100"}`}>
                {statusToggleUser.status === "ACTIVE" ? <UserX className="size-5" /> : <UserCheck className="size-5" />}
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {statusToggleUser.status === "ACTIVE" ? "Deactivate User Account" : "Reactivate User Account"}
              </h4>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              {statusToggleUser.status === "ACTIVE" ? (
                <>
                  Are you sure you want to deactivate <strong className="text-slate-900">{statusToggleUser.fullName}</strong> ({statusToggleUser.email})?
                  This will immediately block login access and terminate all active sessions. Historical ERP records and audit trails will remain preserved.
                </>
              ) : (
                <>
                  Restore login access for <strong className="text-slate-900">{statusToggleUser.fullName}</strong> ({statusToggleUser.email})?
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStatusToggleUser(null)}
                className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  statusToggleUser.status === "ACTIVE" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting && <RefreshCw className="size-3.5 animate-spin" />}
                <span>
                  {isSubmitting
                    ? "Updating..."
                    : statusToggleUser.status === "ACTIVE"
                    ? "Confirm Deactivation"
                    : "Confirm Reactivation"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
