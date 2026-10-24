"use client";

import React from "react";
import {
  X,
  Edit2,
  KeyRound,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { UserModalsProps } from "./types";

export function UserModals({
  editingUser,
  editFullName,
  setEditFullName,
  editEmail,
  setEditEmail,
  editDepartment,
  setEditDepartment,
  editDesignation,
  setEditDesignation,
  editEmployeeId,
  setEditEmployeeId,
  editRole,
  setEditRole,
  editStatus,
  setEditStatus,
  handleEditSubmit,
  onCloseEdit,

  passwordResetUser,
  resetNewPassword,
  setResetNewPassword,
  resetForceReset,
  setResetForceReset,
  resetRevokeSessions,
  setResetRevokeSessions,
  handlePasswordResetSubmit,
  onClosePasswordReset,

  revokeSessionUser,
  revokeReason,
  setRevokeReason,
  handleRevokeSessionsSubmit,
  onCloseRevokeSession,

  statusToggleUser,
  handleToggleStatus,
  onCloseStatusToggle,

  deleteTargetUser,
  handleDeleteUser,
  onCloseDelete,

  isSubmitting,
  employees,
}: UserModalsProps) {
  return (
    <>
      {/* 1. EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Edit2 className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Edit User Profile</h4>
                  <p className="text-[11px] text-slate-500">Update identity, organizational assignment & role</p>
                </div>
              </div>
              <button onClick={onCloseEdit} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="e.g. Fabrication"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    placeholder="e.g. Senior Welder"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Linked Employee (Optional)</label>
                <select
                  value={editEmployeeId}
                  onChange={(e) => setEditEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="">-- No Employee Linked --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} &bull; {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Assignment</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  >
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseEdit}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PASSWORD RESET MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <KeyRound className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Reset Password</h4>
                  <p className="text-[11px] text-slate-500">For {passwordResetUser.fullName}</p>
                </div>
              </div>
              <button onClick={onClosePasswordReset} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Temporary Password</label>
                <input
                  type="text"
                  placeholder="Leave empty to send email reset link"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">If entered, minimum 8 characters required.</p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetForceReset}
                    onChange={(e) => setResetForceReset(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-700">Force password change on next login</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetRevokeSessions}
                    onChange={(e) => setResetRevokeSessions(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-700">Revoke all active login sessions immediately</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClosePasswordReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Confirm Password Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. REVOKE SESSIONS MODAL */}
      {revokeSessionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                  <LogOut className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Revoke Active Sessions</h4>
                  <p className="text-[11px] text-slate-500">Disconnect {revokeSessionUser.fullName}</p>
                </div>
              </div>
              <button onClick={onCloseRevokeSession} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRevokeSessionsSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                This will immediately invalidate all active JWT tokens and sessions for{" "}
                <strong>{revokeSessionUser.fullName}</strong>. They will be forced to log in again.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Revocation (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Device lost or suspected compromised session"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseRevokeSession}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Revoking..." : "Revoke All Sessions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. STATUS TOGGLE (ACTIVATE / DEACTIVATE) MODAL */}
      {statusToggleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-full ${
                  statusToggleUser.status === "ACTIVE" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                }`}
              >
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {statusToggleUser.status === "ACTIVE" ? "Deactivate User Account?" : "Reactivate User Account?"}
                </h4>
                <p className="text-xs text-slate-500">{statusToggleUser.fullName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {statusToggleUser.status === "ACTIVE"
                ? "Deactivating will immediately lock this account and terminate all active enterprise sessions."
                : "Reactivating will restore login access and system authorizations for this user."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCloseStatusToggle}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleToggleStatus}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50 ${
                  statusToggleUser.status === "ACTIVE" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting ? "Updating..." : statusToggleUser.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PERMANENT DELETE USER MODAL */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Permanently Delete User Account?</h4>
                <p className="text-xs text-red-600 font-semibold">{deleteTargetUser.fullName} &bull; {deleteTargetUser.email}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-red-600 shrink-0" />
                This action is permanent and cannot be undone!
              </p>
              <p className="text-[11px] leading-relaxed">
                The account identity will be completely wiped from the database and authentication identity provider. The UI will instantly reflect this change.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCloseDelete}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteUser}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="size-3.5" />
                <span>{isSubmitting ? "Deleting from DB..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
