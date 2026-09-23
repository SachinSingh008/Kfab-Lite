"use client";

import React, { useState, useEffect } from "react";
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
  XCircle,
  AlertTriangle,
  X,
  Users,
} from "lucide-react";
import {
  AppUser,
  AppRole,
  getStoredUsers,
  createUserRecord,
  updateUserRecord,
  deleteUserRecord,
} from "@/lib/auth-store";

const ALLOWED_CREATABLE_ROLES: { value: 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT'; label: string; desc: string }[] = [
  { value: "ADMIN", label: "Admin", desc: "Full operational access to company modules & roster" },
  { value: "SUPERVISOR", label: "Supervisor", desc: "Attendance muster, bay usage, & worker assignments" },
  { value: "ACCOUNTANT", label: "Accountant", desc: "Payroll, attendance muster review, & stock ledgers" },
];

export function UsersView() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT'>("SUPERVISOR");
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("SUPERVISOR");
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>("ACTIVE");
  const [showEditPassword, setShowEditPassword] = useState(false);

  const loadUsers = () => {
    setUsers(getStoredUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      createUserRecord({
        name: createName,
        username: createUsername,
        password: createPassword,
        role: createRole,
      });
      loadUsers();
      setShowCreateModal(false);
      setCreateName("");
      setCreateUsername("");
      setCreatePassword("");
      showNotice("success", `User "${createUsername}" created successfully with role ${createRole}.`);
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Failed to create user.");
    }
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditPassword(user.password);
    setEditRole(user.role);
    setEditStatus(user.status);
    setShowEditPassword(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      updateUserRecord(editingUser.id, {
        name: editName,
        username: editUsername,
        password: editPassword,
        role: editRole,
        status: editStatus,
      });
      loadUsers();
      setEditingUser(null);
      showNotice("success", `User "${editUsername}" updated successfully.`);
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Failed to update user.");
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    try {
      deleteUserRecord(deletingUser.id);
      loadUsers();
      showNotice("success", `User "${deletingUser.username}" removed permanently.`);
      setDeletingUser(null);
    } catch (err: unknown) {
      showNotice("error", err instanceof Error ? err.message : "Failed to delete user.");
      setDeletingUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-[#0F172A] border border-[#CBD5E1]">SUPER ADMIN</span>;
      case "ADMIN":
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200">ADMIN</span>;
      case "SUPERVISOR":
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">SUPERVISOR</span>;
      case "ACCOUNTANT":
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-[#D97706] border border-amber-200">ACCOUNTANT</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Notice */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="size-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-[#64748B] hover:text-[#172033]">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-slate-100 text-[#0F172A]">
              <Users className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#172033]">User Management & System Access</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0F172A] font-bold text-[10px] tracking-wider border border-[#CBD5E1]">
                  SUPER ADMIN CONSOLE
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage operational user accounts, credential overrides, and role-based permissions across plant departments.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg shadow-kfab transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="size-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-2.5 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search by name, username, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-medium placeholder-[#64748B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#64748B]">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#172033] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ACCOUNTANT">Accountant</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-kfab overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Username / Login</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#172033] font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748B]">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F4F7FC]/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-[#0F172A] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#172033]">{u.name}</div>
                          <div className="text-[10px] text-[#64748B]">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#172033]">
                      {u.username}
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3 px-4">
                      {u.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold">
                          <span className="size-2 rounded-full bg-[#16A34A]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[#64748B] text-[11px] font-semibold">
                          <span className="size-2 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          title="Edit user details and password"
                          className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#E8F1FF] rounded-md transition-colors cursor-pointer"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        {u.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => setDeletingUser(u)}
                            title="Delete user"
                            className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
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
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h4 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <UserPlus className="size-4 text-[#0F172A]" />
                Create New Authorized User
              </h4>
              <button onClick={() => setShowCreateModal(false)} className="text-[#64748B] hover:text-[#172033]">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172033] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Username / Login ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh@kfab.in or Ramesh@008"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg font-mono focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Initial Password</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    required
                    placeholder="Set secure password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full p-2.5 pr-10 border border-[#CBD5E1] rounded-lg font-mono focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#172033]"
                  >
                    {showCreatePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Authorized Role (Exclusive List)</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as 'ADMIN' | 'SUPERVISOR' | 'ACCOUNTANT')}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                >
                  {ALLOWED_CREATABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#CBD5E1] text-[#64748B] rounded-lg font-semibold hover:bg-[#F4F7FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg font-bold shadow-kfab cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h4 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Edit2 className="size-4 text-[#0F172A]" />
                Edit User Details & Password
              </h4>
              <button onClick={() => setEditingUser(null)} className="text-[#64748B] hover:text-[#172033]">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172033] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Username / Login ID</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg font-mono focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#172033]">Change / Update Password</label>
                  <span className="text-[10px] text-[#2563EB] font-semibold">Super Admin Override</span>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2.5 pr-10 border border-[#CBD5E1] rounded-lg font-mono focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#172033]"
                  >
                    {showEditPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {editingUser.role !== "SUPER_ADMIN" ? (
                <div>
                  <label className="block font-semibold text-[#172033] mb-1">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AppRole)}
                    className="w-full p-2.5 border border-[#CBD5E1] rounded-lg font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  >
                    {ALLOWED_CREATABLE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label} — {r.desc}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-2.5 bg-[#E8F1FF] rounded-lg border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#0F172A]" />
                  <span>Super Admin account role is immutable.</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#172033] mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full p-2.5 border border-[#CBD5E1] rounded-lg font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Can log in & operate)</option>
                  <option value="INACTIVE">INACTIVE (Access locked)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-[#CBD5E1] text-[#64748B] rounded-lg font-semibold hover:bg-[#F4F7FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg font-bold shadow-kfab cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-sm w-full p-6 relative">
            <div className="flex items-center gap-3 text-[#DC2626] mb-3">
              <div className="p-2 rounded-full bg-rose-100">
                <AlertTriangle className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-[#172033]">Confirm Deletion</h4>
            </div>

            <p className="text-xs text-[#64748B] mb-4">
              Are you sure you want to permanently delete user{" "}
              <strong className="text-[#172033]">{deletingUser.name}</strong> ({deletingUser.username})?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3.5 py-2 border border-[#CBD5E1] text-[#64748B] rounded-lg text-xs font-semibold hover:bg-[#F4F7FC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-2 bg-[#DC2626] hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-kfab cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
