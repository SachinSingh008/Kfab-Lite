"use client";

import React from "react";
import {
  Users,
  RefreshCw,
  Info,
  Edit2,
  KeyRound,
  LogOut,
  UserCheck,
  UserX,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Briefcase,
} from "lucide-react";
import { ApiUserDTO } from "@/lib/api-client";
import { AppUser } from "@/lib/auth-store";

interface UserTableProps {
  users: ApiUserDTO[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  currentUser: AppUser | null;
  onOpenDetails: (user: ApiUserDTO) => void;
  onOpenEdit: (user: ApiUserDTO) => void;
  onOpenPasswordReset: (user: ApiUserDTO) => void;
  onOpenRevokeSessions: (user: ApiUserDTO) => void;
  onOpenStatusToggle: (user: ApiUserDTO) => void;
  onOpenDelete: (user: ApiUserDTO) => void;
}

export function UserTable({
  users,
  totalUsers,
  totalPages,
  currentPage,
  setCurrentPage,
  isLoading,
  currentUser,
  onOpenDetails,
  onOpenEdit,
  onOpenPasswordReset,
  onOpenRevokeSessions,
  onOpenStatusToggle,
  onOpenDelete,
}: UserTableProps) {
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
      case "ACCOUNT":
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

  const isSelf = (u: ApiUserDTO) =>
    currentUser?.id === u.id ||
    (currentUser?.username && u.email && currentUser.username.toLowerCase() === u.email.toLowerCase());

  const isProtectedAdmin = (u: ApiUserDTO) =>
    u.role === "SUPER_ADMIN" ||
    u.id === "6060b3df-fec0-4772-8d3a-d32d3efd97d5" ||
    u.email.toLowerCase() === "sachinasinghofficial@gmail.com";

  return (
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
                    <span className="text-xs font-semibold">Synchronizing users with database...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#64748B]">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Users className="size-8 text-slate-300 mb-1" />
                    <span className="font-bold text-slate-700">No matching user accounts found</span>
                    <p className="text-[11px] text-slate-400">Click &quot;Sync Live DB&quot; or adjust your search filters.</p>
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
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                              title="Password reset required on next login"
                            >
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
                        onClick={() => onOpenDetails(u)}
                        title="View user details & security audit history"
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Info className="size-3.5" />
                      </button>

                      {/* Edit User */}
                      <button
                        onClick={() => onOpenEdit(u)}
                        title="Edit user details & role assignment"
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 className="size-3.5" />
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => onOpenPasswordReset(u)}
                        title="Administrative password reset override"
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                      >
                        <KeyRound className="size-3.5" />
                      </button>

                      {/* Revoke Sessions */}
                      <button
                        onClick={() => onOpenRevokeSessions(u)}
                        title="Revoke active sessions"
                        className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                      >
                        <LogOut className="size-3.5" />
                      </button>

                      {/* Activate / Deactivate Toggle */}
                      {isSelf(u) || isProtectedAdmin(u) ? (
                        <span
                          title="Super Admin cannot be deactivated"
                          className="p-1.5 text-slate-300 cursor-not-allowed inline-flex items-center"
                        >
                          <UserX className="size-3.5" />
                        </span>
                      ) : (
                        <button
                          onClick={() => onOpenStatusToggle(u)}
                          title={u.status === "ACTIVE" ? "Deactivate user" : "Activate user"}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            u.status === "ACTIVE"
                              ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {u.status === "ACTIVE" ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                        </button>
                      )}

                      {/* DELETE USER ACTION */}
                      {isSelf(u) || isProtectedAdmin(u) ? (
                        <span
                          title="Primary Super Administrator cannot be deleted"
                          className="p-1.5 text-slate-300 cursor-not-allowed inline-flex items-center"
                        >
                          <Trash2 className="size-3.5" />
                        </span>
                      ) : (
                        <button
                          onClick={() => onOpenDelete(u)}
                          title="Permanently delete user from database"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-3.5 text-red-500" />
                        </button>
                      )}
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
  );
}
