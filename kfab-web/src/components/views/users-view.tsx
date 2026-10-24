"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  Search,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
} from "lucide-react";
import {
  apiGetUsers,
  apiGetUserById,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  apiDeactivateUser,
  apiActivateUser,
  apiResetPassword,
  apiRevokeSessions,
  apiGetEmployees,
  apiSyncUsers,
  ApiUserDTO,
  ApiEmployeeDTO,
  AuditLogDTO,
} from "@/lib/api-client";
import { AppUser, getStoredSession } from "@/lib/auth-store";
import { UsersViewProps } from "./users/types";
import { UserTable } from "./users/user-table";
import { UserModals } from "./users/user-modals";
import { CreateUserModal } from "./users/create-user-modal";
import { UserDetailsDrawer } from "./users/user-details-drawer";

export function UsersView({ currentUser: propUser }: UsersViewProps = {}) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(propUser || null);

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    } else {
      setCurrentUser(getStoredSession());
    }
  }, [propUser]);

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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
  const [deleteTargetUser, setDeleteTargetUser] = useState<ApiUserDTO | null>(null);

  // ============================================================================
  // State: Create Form
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

  const showNotice = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ============================================================================
  // Data Fetching & Sync Handlers
  // ============================================================================
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiGetUsers({
        search: searchTerm || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        department: deptFilter !== "ALL" ? deptFilter : undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: pageSize,
      });

      setUsers(response.users || []);
      setTotalUsers(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err: unknown) {
      console.error("Failed to fetch users:", err);
      showNotice("error", err instanceof Error ? err.message : "Failed to load users from database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await apiSyncUsers();
      setUsers(res.users || []);
      setTotalUsers(res.total || 0);
      setTotalPages(res.totalPages || 1);
      showNotice("success", `Database synchronized with UI successfully (${res.total} user account${res.total === 1 ? "" : "s"}).`);
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Database synchronization failed.");
    } finally {
      setIsSyncing(false);
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

  // User Details Drawer
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
  // Mutation Handlers: Create, Edit, Toggle, Reset, Revoke, Delete
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
      await loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      showNotice("success", res.message || `User "${res.user.fullName}" updated successfully in database.`);
      setEditingUser(null);
      await loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      await loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setIsSubmitting(true);
    try {
      const res = await apiDeleteUser(deleteTargetUser.id);
      showNotice("success", res.message || `User "${deleteTargetUser.fullName}" permanently removed.`);
      setDeleteTargetUser(null);
      await loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      await loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeSessionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeSessionUser) return;

    setIsSubmitting(true);
    try {
      const res = await apiRevokeSessions(revokeSessionUser.id, revokeReason || undefined);
      showNotice("success", res.message);
      setRevokeSessionUser(null);
      setRevokeReason("");
      await loadUsers();
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Session revocation failed.");
    } finally {
      setIsSubmitting(false);
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
          <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer">
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
                  Live DB Sync &bull; RBAC
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Centralized ERP identity administration, role authorizations, and synchronized database persistence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Authoritative Database Sync Button */}
          <button
            onClick={handleSyncDatabase}
            disabled={isSyncing || isLoading}
            title="Synchronize UI with authoritative database records"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing DB..." : "Sync with Database"}</span>
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

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-kfab space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
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
      <UserTable
        users={users}
        totalUsers={totalUsers}
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isLoading={isLoading}
        currentUser={currentUser}
        onOpenDetails={openUserDetails}
        onOpenEdit={openEditModal}
        onOpenPasswordReset={(u) => setPasswordResetUser(u)}
        onOpenRevokeSessions={(u) => setRevokeSessionUser(u)}
        onOpenStatusToggle={(u) => setStatusToggleUser(u)}
        onOpenDelete={(u) => setDeleteTargetUser(u)}
      />

      {/* Modals: Edit, Reset Password, Revoke, Toggle, and Delete */}
      <UserModals
        editingUser={editingUser}
        editFullName={editFullName}
        setEditFullName={setEditFullName}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        editDepartment={editDepartment}
        setEditDepartment={setEditDepartment}
        editDesignation={editDesignation}
        setEditDesignation={setEditDesignation}
        editEmployeeId={editEmployeeId}
        setEditEmployeeId={setEditEmployeeId}
        editRole={editRole}
        setEditRole={setEditRole}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        handleEditSubmit={handleEditSubmit}
        onCloseEdit={() => setEditingUser(null)}

        passwordResetUser={passwordResetUser}
        resetNewPassword={resetNewPassword}
        setResetNewPassword={setResetNewPassword}
        resetForceReset={resetForceReset}
        setResetForceReset={setResetForceReset}
        resetRevokeSessions={resetRevokeSessions}
        setResetRevokeSessions={setResetRevokeSessions}
        handlePasswordResetSubmit={handlePasswordResetSubmit}
        onClosePasswordReset={() => setPasswordResetUser(null)}

        revokeSessionUser={revokeSessionUser}
        revokeReason={revokeReason}
        setRevokeReason={setRevokeReason}
        handleRevokeSessionsSubmit={handleRevokeSessionsSubmit}
        onCloseRevokeSession={() => setRevokeSessionUser(null)}

        statusToggleUser={statusToggleUser}
        handleToggleStatus={handleToggleStatus}
        onCloseStatusToggle={() => setStatusToggleUser(null)}

        deleteTargetUser={deleteTargetUser}
        handleDeleteUser={handleDeleteUser}
        onCloseDelete={() => setDeleteTargetUser(null)}

        isSubmitting={isSubmitting}
        employees={employees}
      />

      {/* 6-Step Create User Modal */}
      <CreateUserModal
        showModal={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        createStep={createStep}
        setCreateStep={setCreateStep}
        isSubmitting={isSubmitting}
        handleCreateSubmit={handleCreateSubmit}

        createFullName={createFullName}
        setCreateFullName={setCreateFullName}
        createUsername={createUsername}
        setCreateUsername={setCreateUsername}
        createEmail={createEmail}
        setCreateEmail={setCreateEmail}
        createEmployeeId={createEmployeeId}
        setCreateEmployeeId={setCreateEmployeeId}
        createDepartment={createDepartment}
        setCreateDepartment={setCreateDepartment}
        createDesignation={createDesignation}
        setCreateDesignation={setCreateDesignation}
        createRole={createRole}
        setCreateRole={setCreateRole}
        createPassword={createPassword}
        setCreatePassword={setCreatePassword}
        createStatus={createStatus}
        setCreateStatus={setCreateStatus}
        createForceReset={createForceReset}
        setCreateForceReset={setCreateForceReset}
        showCreatePassword={showCreatePassword}
        setShowCreatePassword={setShowCreatePassword}
        createConfirmed={createConfirmed}
        setCreateConfirmed={setCreateConfirmed}
        generateRandomPassword={generateRandomPassword}
        employees={employees}
      />

      {/* User Details Drawer */}
      <UserDetailsDrawer
        viewingUser={viewingUser}
        onClose={() => setViewingUser(null)}
        isLoading={isLoadingUserDetail}
      />
    </div>
  );
}
