"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Shield,
  Layers,
  Activity,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowRight,
  Eye,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { AppUser } from "@/lib/auth-store";
import {
  apiCreateUserLog,
  apiGetMyLogs,
  apiGetAllLogs,
  apiGetSystemLogs,
  UserLogDTO,
  SystemLogDTO,
} from "@/lib/api-client";
import { getVisibleLogRoles, canViewSystemLogs } from "@/lib/logs-visibility";

interface LogsViewProps {
  currentUser: AppUser;
}

type TabType = "my" | "all" | "system";

/**
 * Format ISO string into clean format:
 * Example: "27 Sep 2026, 05:32 PM"
 */
function formatLogDateTime(isoString?: string | null): string {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = d.getDate().toString().padStart(2, "0");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours.toString().padStart(2, "0");
    return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

/**
 * Render standard badge for user roles
 */
function RoleBadge({ role }: { role?: string | null }) {
  const normRole = (role === "ACCOUNTANT" ? "ACCOUNT" : role || "SUPERVISOR").toUpperCase();

  switch (normRole) {
    case "SUPER_ADMIN":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-purple-100 text-purple-800 border border-purple-200">
          SUPER ADMIN
        </span>
      );
    case "ADMIN":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-100 text-blue-800 border border-blue-200">
          ADMIN
        </span>
      );
    case "SUPERVISOR":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 border border-amber-200">
          SUPERVISOR
        </span>
      );
    case "ACCOUNT":
    case "ACCOUNTANT":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
          ACCOUNT
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
          {normRole}
        </span>
      );
  }
}

/**
 * Render standard badge for system audit actions
 */
function ActionBadge({ action }: { action: string }) {
  const act = action.toUpperCase();
  let color = "bg-slate-100 text-slate-700 border-slate-200";

  if (act.includes("CREATE") || act.includes("INSERT")) {
    color = "bg-emerald-100 text-emerald-800 border-emerald-200";
  } else if (act.includes("UPDATE") || act.includes("STATUS") || act.includes("ROLE")) {
    color = "bg-blue-100 text-blue-800 border-blue-200";
  } else if (act.includes("DELETE") || act.includes("REVOKE") || act.includes("DEACTIVATE")) {
    color = "bg-rose-100 text-rose-800 border-rose-200";
  } else if (act.includes("ACTIVATE") || act.includes("APPROVE")) {
    color = "bg-green-100 text-green-800 border-green-200";
  } else if (act.includes("RESET") || act.includes("REJECT")) {
    color = "bg-orange-100 text-orange-800 border-orange-200";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${color}`}>
      {action.replace(/_/g, " ")}
    </span>
  );
}

export function LogsView({ currentUser }: LogsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("my");
  const canSeeSystemLogs = canViewSystemLogs(currentUser.role);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --------------------------------------------------------------------------
  // Tab 1: MY LOGS STATE
  // --------------------------------------------------------------------------
  const [myLogs, setMyLogs] = useState<UserLogDTO[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myTotal, setMyTotal] = useState(0);
  const [myPage, setMyPage] = useState(1);
  const [myLimit] = useState(25);
  const [mySearch, setMySearch] = useState("");

  // Add Log Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEvent, setAddEvent] = useState("");
  const [addRemarks, setAddRemarks] = useState("");
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // --------------------------------------------------------------------------
  // Tab 2: ALL LOGS STATE
  // --------------------------------------------------------------------------
  const [allLogs, setAllLogs] = useState<UserLogDTO[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allTotal, setAllTotal] = useState(0);
  const [allPage, setAllPage] = useState(1);
  const [allLimit] = useState(25);
  const [allSearch, setAllSearch] = useState("");
  const [allRoleFilter, setAllRoleFilter] = useState("ALL");
  const [allDateFrom, setAllDateFrom] = useState("");
  const [allDateTo, setAllDateTo] = useState("");

  // --------------------------------------------------------------------------
  // Tab 3: SYSTEM LOGS STATE
  // --------------------------------------------------------------------------
  const [sysLogs, setSysLogs] = useState<SystemLogDTO[]>([]);
  const [sysLoading, setSysLoading] = useState(false);
  const [sysTotal, setSysTotal] = useState(0);
  const [sysPage, setSysPage] = useState(1);
  const [sysLimit] = useState(25);
  const [sysSearch, setSysSearch] = useState("");
  const [sysModuleFilter, setSysModuleFilter] = useState("ALL");
  const [sysActionFilter, setSysActionFilter] = useState("ALL");
  const [sysDateFrom, setSysDateFrom] = useState("");
  const [sysDateTo, setSysDateTo] = useState("");

  // Detail Modal for System Log
  const [selectedSysLog, setSelectedSysLog] = useState<SystemLogDTO | null>(null);

  // --------------------------------------------------------------------------
  // Fetch Functions
  // --------------------------------------------------------------------------
  const fetchMyLogs = useCallback(async () => {
    setMyLoading(true);
    try {
      const res = await apiGetMyLogs({
        page: myPage,
        limit: myLimit,
        search: mySearch.trim() || undefined,
      });
      setMyLogs(res.logs || []);
      setMyTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load My Logs:", err);
      showToast(err.message || "Failed to load My Logs", "error");
    } finally {
      setMyLoading(false);
    }
  }, [myPage, myLimit, mySearch]);

  const fetchAllLogs = useCallback(async () => {
    setAllLoading(true);
    try {
      const res = await apiGetAllLogs({
        page: allPage,
        limit: allLimit,
        search: allSearch.trim() || undefined,
        role: allRoleFilter !== "ALL" ? allRoleFilter : undefined,
        from: allDateFrom || undefined,
        to: allDateTo || undefined,
      });
      setAllLogs(res.logs || []);
      setAllTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load All Logs:", err);
      showToast(err.message || "Failed to load All Logs", "error");
    } finally {
      setAllLoading(false);
    }
  }, [allPage, allLimit, allSearch, allRoleFilter, allDateFrom, allDateTo]);

  const fetchSystemLogs = useCallback(async () => {
    if (!canSeeSystemLogs) return;
    setSysLoading(true);
    try {
      const res = await apiGetSystemLogs({
        page: sysPage,
        limit: sysLimit,
        search: sysSearch.trim() || undefined,
        module: sysModuleFilter !== "ALL" ? sysModuleFilter : undefined,
        action: sysActionFilter !== "ALL" ? sysActionFilter : undefined,
        from: sysDateFrom || undefined,
        to: sysDateTo || undefined,
      });
      setSysLogs(res.logs || []);
      setSysTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load System Logs:", err);
      showToast(err.message || "Failed to load System Logs", "error");
    } finally {
      setSysLoading(false);
    }
  }, [canSeeSystemLogs, sysPage, sysLimit, sysSearch, sysModuleFilter, sysActionFilter, sysDateFrom, sysDateTo]);

  // Load data when active tab changes or parameters change
  useEffect(() => {
    if (activeTab === "my") {
      fetchMyLogs();
    } else if (activeTab === "all") {
      fetchAllLogs();
    } else if (activeTab === "system" && canSeeSystemLogs) {
      fetchSystemLogs();
    }
  }, [activeTab, fetchMyLogs, fetchAllLogs, fetchSystemLogs, canSeeSystemLogs]);

  // --------------------------------------------------------------------------
  // Tab 2 UI-ONLY Role Filtering
  // SPECIFICATION CONTRACT:
  // - SUPER_ADMIN: Can see logs created by SUPER_ADMIN, ADMIN, SUPERVISOR, ACCOUNT (everyone)
  // - ADMIN:       Can see logs created by ADMIN, SUPERVISOR, ACCOUNT
  // - SUPERVISOR:  Can see logs created by ADMIN, SUPERVISOR (hides SUPER_ADMIN and ACCOUNT)
  // - ACCOUNT:     Can see logs created by ADMIN, SUPERVISOR, ACCOUNT (hides SUPER_ADMIN)
  // --------------------------------------------------------------------------
  const visibleRoles = useMemo(() => getVisibleLogRoles(currentUser.role), [currentUser.role]);

  const filteredAllLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const rawRole = (log.user_role === "ACCOUNTANT" ? "ACCOUNT" : log.user_role || "").toUpperCase();
      return visibleRoles.includes(rawRole);
    });
  }, [allLogs, visibleRoles]);

  // --------------------------------------------------------------------------
  // Add Log Handler
  // --------------------------------------------------------------------------
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEvent.trim()) {
      showToast("Event is required", "error");
      return;
    }

    setIsSubmittingLog(true);
    try {
      await apiCreateUserLog({
        event: addEvent.trim(),
        remarks: addRemarks.trim() || undefined,
      });
      setShowAddModal(false);
      setAddEvent("");
      setAddRemarks("");
      showToast("Log added successfully.", "success");
      // Refresh list, newest at top
      setMyPage(1);
      fetchMyLogs();
    } catch (err: any) {
      showToast(err.message || "Failed to create log", "error");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="size-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                LOGS
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive operational activity logs and automated system audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Global tab buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "my"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Logs
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Logs
          </button>
          {canSeeSystemLogs && (
            <button
              onClick={() => setActiveTab("system")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "system"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              System Logs
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: MY LOGS */}
      {/* ==================================================================== */}
      {activeTab === "my" && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Event or Remarks..."
                  value={mySearch}
                  onChange={(e) => setMySearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchMyLogs()}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50/50"
                />
              </div>
              <button
                onClick={fetchMyLogs}
                title="Search / Refresh"
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${myLoading ? "animate-spin" : ""}`} />
                <span>Filter</span>
              </button>
            </div>

            {/* + Add Log Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
              <span>+ Add Log</span>
            </button>
          </div>

          {/* My Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-[220px]">Date & Time</th>
                    <th className="py-3 px-4 w-[350px]">Event</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myLoading ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-400">
                        <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-slate-400" />
                        <p className="font-medium">Loading your activity logs...</p>
                      </td>
                    </tr>
                  ) : myLogs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-14 text-center">
                        <div className="max-w-sm mx-auto space-y-2">
                          <FileText className="size-8 text-slate-300 mx-auto" />
                          <p className="text-sm font-bold text-slate-700">No logs yet.</p>
                          <p className="text-xs text-slate-500">
                            Create your first log to start recording your activities.
                          </p>
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Plus className="size-3.5" />
                            <span>Add First Log</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    myLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-slate-400 shrink-0" />
                            <span>{formatLogDateTime(log.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-semibold">
                          {log.event}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {log.remarks ? (
                            <span>{log.remarks}</span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {myTotal > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing {myLogs.length} of {myTotal} log{myTotal === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={myPage <= 1 || myLoading}
                    onClick={() => setMyPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="font-semibold text-slate-800">
                    Page {myPage} of {Math.max(1, Math.ceil(myTotal / myLimit))}
                  </span>
                  <button
                    disabled={myPage * myLimit >= myTotal || myLoading}
                    onClick={() => setMyPage((p) => p + 1)}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ALL LOGS */}
      {/* ==================================================================== */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Event, Remarks, User..."
                  value={allSearch}
                  onChange={(e) => setAllSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchAllLogs()}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50/50"
                />
              </div>

              {/* Role Filter dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter className="size-3.5 text-slate-400" />
                <select
                  value={allRoleFilter}
                  onChange={(e) => {
                    setAllRoleFilter(e.target.value);
                    setAllPage(1);
                  }}
                  className="py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:border-slate-400"
                >
                  <option value="ALL">All Roles ({visibleRoles.length})</option>
                  {visibleRoles.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-400" />
                <input
                  type="date"
                  value={allDateFrom}
                  onChange={(e) => setAllDateFrom(e.target.value)}
                  className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  title="From Date"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={allDateTo}
                  onChange={(e) => setAllDateTo(e.target.value)}
                  className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  title="To Date"
                />
              </div>

              <button
                onClick={fetchAllLogs}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${allLoading ? "animate-spin" : ""}`} />
                <span>Apply</span>
              </button>
            </div>

            {/* Active user role indicator */}
            <div className="text-right">
              <span className="text-[11px] text-slate-500">
                Viewing as <span className="font-bold text-slate-800">{currentUser.role.replace("_", " ")}</span>
              </span>
            </div>
          </div>

          {/* All Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-[190px]">Date & Time</th>
                    <th className="py-3 px-4 w-[180px]">User</th>
                    <th className="py-3 px-4 w-[130px]">Role</th>
                    <th className="py-3 px-4 w-[280px]">Event</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-slate-400" />
                        <p className="font-medium">Loading consolidated logs...</p>
                      </td>
                    </tr>
                  ) : filteredAllLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <FileText className="size-7 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No logs found matching your criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAllLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {formatLogDateTime(log.created_at)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {log.user_name || "Unknown User"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <RoleBadge role={log.user_role} />
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-semibold">
                          {log.event}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {log.remarks ? (
                            <span>{log.remarks}</span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {allTotal > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing {filteredAllLogs.length} of {allTotal} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={allPage <= 1 || allLoading}
                    onClick={() => setAllPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="font-semibold text-slate-800">
                    Page {allPage} of {Math.max(1, Math.ceil(allTotal / allLimit))}
                  </span>
                  <button
                    disabled={allPage * allLimit >= allTotal || allLoading}
                    onClick={() => setAllPage((p) => p + 1)}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: SYSTEM LOGS (SUPER_ADMIN and ADMIN only) */}
      {/* ==================================================================== */}
      {activeTab === "system" && canSeeSystemLogs && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Description, User, Resource ID..."
                  value={sysSearch}
                  onChange={(e) => setSysSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSystemLogs()}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50/50"
                />
              </div>

              {/* Module Filter */}
              <select
                value={sysModuleFilter}
                onChange={(e) => {
                  setSysModuleFilter(e.target.value);
                  setSysPage(1);
                }}
                className="py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:border-slate-400"
              >
                <option value="ALL">All Modules</option>
                <option value="USER MANAGEMENT">USER MANAGEMENT</option>
                <option value="ATTENDANCE">ATTENDANCE</option>
                <option value="PRODUCTION">PRODUCTION</option>
                <option value="MATERIAL">MATERIAL</option>
                <option value="QUALITY">QUALITY</option>
                <option value="PURCHASE">PURCHASE</option>
                <option value="ACCOUNTS">ACCOUNTS</option>
                <option value="SYSTEM">SYSTEM</option>
                <option value="GENERAL">GENERAL</option>
              </select>

              {/* Action Filter */}
              <select
                value={sysActionFilter}
                onChange={(e) => {
                  setSysActionFilter(e.target.value);
                  setSysPage(1);
                }}
                className="py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:border-slate-400"
              >
                <option value="ALL">All Actions</option>
                <option value="USER_CREATED">USER_CREATED</option>
                <option value="USER_UPDATED">USER_UPDATED</option>
                <option value="USER_ACTIVATED">USER_ACTIVATED</option>
                <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
                <option value="ROLE_CHANGED">ROLE_CHANGED</option>
                <option value="PASSWORD_RESET">PASSWORD_RESET</option>
                <option value="SESSION_REVOKED">SESSION_REVOKED</option>
                <option value="RECORD_CREATED">RECORD_CREATED</option>
                <option value="RECORD_UPDATED">RECORD_UPDATED</option>
                <option value="RECORD_DELETED">RECORD_DELETED</option>
              </select>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-slate-400" />
                <input
                  type="date"
                  value={sysDateFrom}
                  onChange={(e) => setSysDateFrom(e.target.value)}
                  className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  title="From Date"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={sysDateTo}
                  onChange={(e) => setSysDateTo(e.target.value)}
                  className="py-1.5 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  title="To Date"
                />
              </div>

              <button
                onClick={fetchSystemLogs}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${sysLoading ? "animate-spin" : ""}`} />
                <span>Apply</span>
              </button>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Shield className="size-3" />
                Immutable Audit Trail
              </span>
            </div>
          </div>

          {/* System Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-[190px]">Date & Time</th>
                    <th className="py-3 px-4 w-[160px]">User</th>
                    <th className="py-3 px-4 w-[120px]">Role</th>
                    <th className="py-3 px-4 w-[130px]">Module</th>
                    <th className="py-3 px-4 w-[150px]">Action</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 w-[80px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sysLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-slate-400" />
                        <p className="font-medium">Loading system audit trail...</p>
                      </td>
                    </tr>
                  ) : sysLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Shield className="size-7 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No system audit records found.</p>
                      </td>
                    </tr>
                  ) : (
                    sysLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedSysLog(log)}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {formatLogDateTime(log.created_at)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {log.actor_name || "System"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <RoleBadge role={log.actor_role} />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium max-w-md truncate">
                          {log.description}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSysLog(log);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            title="View Diff Details"
                          >
                            <Eye className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sysTotal > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing {sysLogs.length} of {sysTotal} audit records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={sysPage <= 1 || sysLoading}
                    onClick={() => setSysPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="font-semibold text-slate-800">
                    Page {sysPage} of {Math.max(1, Math.ceil(sysTotal / sysLimit))}
                  </span>
                  <button
                    disabled={sysPage * sysLimit >= sysTotal || sysLoading}
                    onClick={() => setSysPage((p) => p + 1)}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD LOG */}
      {/* ==================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
                  <Plus className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">ADD LOG</h3>
                  <p className="text-xs text-slate-500">Record a new manual operational activity</p>
                </div>
              </div>
              <button
                onClick={() => !isSubmittingLog && setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateLog} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter event (e.g. Material received, Drawing revision reviewed)"
                  value={addEvent}
                  onChange={(e) => setAddEvent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter remarks (e.g. MTC verified, awaiting supplier quote)"
                  value={addRemarks}
                  onChange={(e) => setAddRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p className="flex items-center gap-1 font-semibold text-slate-700">
                  <Info className="size-3.5 text-slate-400" />
                  Automatic Metadata Recording
                </p>
                <p>
                  Creator: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.role.replace("_", " ")})
                </p>
                <p>
                  Timestamp: <span className="font-semibold text-slate-800">Recorded automatically by server</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingLog}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingLog && <RefreshCw className="size-3.5 animate-spin" />}
                  <span>Add Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: SYSTEM LOG DETAIL (IMMUTABLE AUDIT RECORD) */}
      {/* ==================================================================== */}
      {selectedSysLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">SYSTEM AUDIT LOG DETAIL</h3>
                  <p className="text-xs text-slate-500">Immutable forensic change audit record</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSysLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Timestamp</span>
                  <span className="font-bold text-slate-800">{formatLogDateTime(selectedSysLog.created_at)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">User (Actor)</span>
                  <span className="font-bold text-slate-800">{selectedSysLog.actor_name || "System"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Role</span>
                  <div>
                    <RoleBadge role={selectedSysLog.actor_role} />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Module</span>
                  <span className="font-bold text-slate-800">{selectedSysLog.module}</span>
                </div>
              </div>

              {/* Action & Resource Info */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold">Action:</span>
                    <ActionBadge action={selectedSysLog.action} />
                  </div>
                  {selectedSysLog.resource_id && (
                    <div className="text-[11px] text-slate-600">
                      Resource: <span className="font-mono font-bold text-slate-800">{selectedSysLog.resource_type || "Entity"} #{selectedSysLog.resource_id}</span>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Description:</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedSysLog.description}</p>
                </div>
              </div>

              {/* Human-Readable Change Summary (if status/values changed) */}
              {selectedSysLog.old_values && selectedSysLog.new_values && (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                    <Activity className="size-4 text-blue-700" />
                    <span>Change Summary</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.keys({ ...selectedSysLog.old_values, ...selectedSysLog.new_values }).map((key) => {
                      const oldVal = (selectedSysLog.old_values as any)?.[key];
                      const newVal = (selectedSysLog.new_values as any)?.[key];
                      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;

                      return (
                        <div key={key} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-100 text-xs">
                          <span className="font-mono font-bold text-slate-600 w-32 truncate">{key}:</span>
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-mono line-through text-[11px]">
                            {typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal ?? "null")}
                          </span>
                          <ArrowRight className="size-3 text-slate-400" />
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono font-bold text-[11px]">
                            {typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal ?? "null")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Old Values & New Values JSON Viewer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">OLD VALUES</span>
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48">
                    <pre>{selectedSysLog.old_values ? JSON.stringify(selectedSysLog.old_values, null, 2) : "null"}</pre>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">NEW VALUES</span>
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48">
                    <pre>{selectedSysLog.new_values ? JSON.stringify(selectedSysLog.new_values, null, 2) : "null"}</pre>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider block mb-2">Technical Telemetry</span>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">IP Address</span>
                    <span className="font-mono text-slate-700 font-semibold">{selectedSysLog.ip_address || "Internal / Unknown"}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">User Agent</span>
                    <span className="font-mono text-slate-700 font-semibold truncate block" title={selectedSysLog.user_agent || undefined}>
                      {selectedSysLog.user_agent || "Fastify API / Web"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Correlation ID</span>
                    <span className="font-mono text-slate-700 font-semibold truncate block">
                      {selectedSysLog.correlation_id || "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Immutable Notice */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Shield className="size-3.5 text-slate-400" />
                Audit records are append-only and cryptographically immutable.
              </span>
              <button
                onClick={() => setSelectedSysLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
