"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Layers,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Building2,
  User,
  ShieldAlert,
  Info,
  Check,
  X,
} from "lucide-react";
import { AppUser, getStoredUsers } from "@/lib/auth-store";
import {
  ProjectDTO,
  ProjectStageDTO,
  ProjectItemDTO,
  ItemStageStatusDTO,
  ProjectDetailDTO,
  ReportsSummaryDTO,
  ProgressTimelinePoint,
  apiGetReportsSummary,
  apiGetReportsProgress,
  apiGetProjects,
  apiGetProjectById,
  apiCreateProject,
  apiAddProjectStage,
  apiRenameProjectStage,
  apiDeleteProjectStage,
  apiAddProjectItem,
  apiUpdateItemStageStatus,
} from "@/lib/reports-api";

interface ReportsViewProps {
  currentUser?: AppUser;
  initialTab?: "progress" | "details";
}

export function ReportsView({ currentUser, initialTab = "progress" }: ReportsViewProps) {
  const role = currentUser?.role || "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isSupervisor = role === "SUPERVISOR";
  const isAccountant = role === "ACCOUNTANT" || role === "ACCOUNT";

  // State Management
  const [activeTab, setActiveTab] = useState<"progress" | "details">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [showDetailsDropdown, setShowDetailsDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Summary & Progress Data
  const [summary, setSummary] = useState<ReportsSummaryDTO | null>(null);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [timeline, setTimeline] = useState<ProgressTimelinePoint[]>([]);

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Project Details Expansion
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetailDTO | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Modals
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showRenameColumnModal, setShowRenameColumnModal] = useState<{ stageId: string; name: string } | null>(null);
  const [showDeleteColumnConfirm, setShowDeleteColumnConfirm] = useState<{ stageId: string; name: string } | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Cell Interaction Popover / Modal
  const [activeCellModal, setActiveCellModal] = useState<{
    itemId: string;
    stageId: string;
    material: string;
    stageName: string;
    currentStatus: "COMPLETE" | "INCOMPLETE";
    currentRemark: string;
  } | null>(null);
  const [cellRemarkInput, setCellRemarkInput] = useState("");

  // Create Project Form State
  const [newProjectName, setNewProjectName] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newSupervisorId, setNewSupervisorId] = useState("");
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEndDate, setNewEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [newStageDeadlines, setNewStageDeadlines] = useState({
    marking: "",
    cutting: "",
    fitting: "",
    welding: "",
    final: "",
  });
  const [newRemark, setNewRemark] = useState("");
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Add Column Form State
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnDate, setNewColumnDate] = useState(new Date().toISOString().split("T")[0]);

  // Rename Column Form State
  const [renameColumnInput, setRenameColumnInput] = useState("");

  // Add Item Form State
  const [newItemMaterial, setNewItemMaterial] = useState("");
  const [newItemDrawing, setNewItemDrawing] = useState("");

  // Hover Tooltip for SVG Line Graph
  const [hoveredPoint, setHoveredPoint] = useState<ProgressTimelinePoint | null>(null);

  // Available Supervisors for Dropdown
  const supervisorsList = useMemo(() => {
    const users = getStoredUsers();
    return users.filter((u) => u.role === "SUPERVISOR" || u.role === "SUPER_ADMIN" || u.role === "ADMIN");
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusNotice({ type, text });
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Fetch Summary & Progress Data
  const loadReportsData = async () => {
    setIsLoading(true);
    try {
      const [sumData, progData] = await Promise.all([
        apiGetReportsSummary(period),
        apiGetReportsProgress(),
      ]);
      setSummary(sumData);
      setProjects(progData.projects);
      setTimeline(progData.timeline);
    } catch (err: unknown) {
      console.error("Failed to load reports data:", err);
      showNotification("error", "Unable to load reports telemetry. Showing offline state.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAccountant) {
      loadReportsData();
    }
  }, [period, isAccountant]);

  // Expand Project Row & Load Details
  const handleToggleProject = async (projId: string) => {
    if (expandedProjectId === projId) {
      setExpandedProjectId(null);
      setProjectDetail(null);
      return;
    }

    setExpandedProjectId(projId);
    setIsLoadingDetail(true);
    try {
      const detail = await apiGetProjectById(projId);
      setProjectDetail(detail);
    } catch (err) {
      console.error("Failed to load project details:", err);
      showNotification("error", "Failed to load project execution details.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Quick reload for active project detail
  const reloadActiveProjectDetail = async (projId: string) => {
    try {
      const detail = await apiGetProjectById(projId);
      setProjectDetail(detail);
      // Also refresh summary
      const progData = await apiGetReportsProgress();
      setProjects(progData.projects);
    } catch (err) {
      console.error("Failed to reload project detail:", err);
    }
  };

  // Filtered Projects for List
  const filteredProjects = useMemo(() => {
    let list = projects;
    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter || p.derivedStatus === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.supervisorName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, statusFilter, searchQuery]);

  // Initialize Default Stage Deadlines when dates change
  useEffect(() => {
    if (newStartDate && newEndDate) {
      const start = new Date(newStartDate).getTime();
      const end = new Date(newEndDate).getTime();
      const diff = end - start;
      if (diff > 0) {
        const d1 = new Date(start + diff * 0.2).toISOString().split("T")[0];
        const d2 = new Date(start + diff * 0.4).toISOString().split("T")[0];
        const d3 = new Date(start + diff * 0.6).toISOString().split("T")[0];
        const d4 = new Date(start + diff * 0.8).toISOString().split("T")[0];
        const d5 = newEndDate;
        setNewStageDeadlines({
          marking: d1,
          cutting: d2,
          fitting: d3,
          welding: d4,
          final: d5,
        });
      }
    }
  }, [newStartDate, newEndDate]);

  // Handle Create Project Submit
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showNotification("error", "Project Name is required.");
      return;
    }
    if (!newCustomerName.trim()) {
      showNotification("error", "Customer Name is required.");
      return;
    }
    if (!newSupervisorId) {
      showNotification("error", "Please assign a Project Supervisor.");
      return;
    }
    if (new Date(newEndDate) < new Date(newStartDate)) {
      showNotification("error", "End Date must be greater than or equal to Start Date.");
      return;
    }

    setIsSubmittingProject(true);
    try {
      await apiCreateProject({
        projectName: newProjectName.trim(),
        customerName: newCustomerName.trim(),
        supervisorId: newSupervisorId,
        startDate: newStartDate,
        endDate: newEndDate,
        stageDeadlines: newStageDeadlines,
        remark: newRemark.trim() || null,
      });

      showNotification("success", `Project "${newProjectName}" created with 5 default stages.`);
      setShowAddProjectModal(false);
      setNewProjectName("");
      setNewCustomerName("");
      setNewRemark("");
      loadReportsData();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to create project.");
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // Handle Add Custom Column
  const handleAddColumnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedProjectId || !newColumnName.trim()) return;

    try {
      await apiAddProjectStage(expandedProjectId, {
        name: newColumnName.trim(),
        plannedCompletionDate: newColumnDate,
      });
      showNotification("success", `Custom stage "${newColumnName}" added to project.`);
      setShowAddColumnModal(false);
      setNewColumnName("");
      reloadActiveProjectDetail(expandedProjectId);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to add stage.");
    }
  };

  // Handle Rename Column
  const handleRenameColumnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedProjectId || !showRenameColumnModal || !renameColumnInput.trim()) return;

    try {
      await apiRenameProjectStage(expandedProjectId, showRenameColumnModal.stageId, renameColumnInput.trim());
      showNotification("success", `Stage renamed to "${renameColumnInput.trim()}".`);
      setShowRenameColumnModal(null);
      setRenameColumnInput("");
      reloadActiveProjectDetail(expandedProjectId);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to rename stage.");
    }
  };

  // Handle Delete Custom Column
  const handleDeleteColumnConfirm = async () => {
    if (!expandedProjectId || !showDeleteColumnConfirm) return;

    try {
      await apiDeleteProjectStage(expandedProjectId, showDeleteColumnConfirm.stageId);
      showNotification("success", `Custom stage "${showDeleteColumnConfirm.name}" deleted.`);
      setShowDeleteColumnConfirm(null);
      reloadActiveProjectDetail(expandedProjectId);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to delete stage.");
    }
  };

  // Handle Add Item Row
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedProjectId || !newItemMaterial.trim() || !newItemDrawing.trim()) return;

    try {
      await apiAddProjectItem(expandedProjectId, {
        material: newItemMaterial.trim(),
        drawingNumber: newItemDrawing.trim(),
      });
      showNotification("success", `Material item "${newItemMaterial}" added.`);
      setShowAddItemModal(false);
      setNewItemMaterial("");
      setNewItemDrawing("");
      reloadActiveProjectDetail(expandedProjectId);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to add item.");
    }
  };

  // Handle Cell Update (Complete, Incomplete, Remark)
  const handleCellAction = async (status: "COMPLETE" | "INCOMPLETE", remark?: string) => {
    if (!expandedProjectId || !activeCellModal) return;

    try {
      await apiUpdateItemStageStatus(expandedProjectId, activeCellModal.itemId, activeCellModal.stageId, {
        status,
        remark: remark !== undefined ? remark : activeCellModal.currentRemark,
      });

      showNotification("success", `Stage marked ${status}.`);
      setActiveCellModal(null);
      reloadActiveProjectDetail(expandedProjectId);
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to update stage cell.");
    }
  };

  // 1. Strict Access Denial for ACCOUNT Role
  if (isAccountant) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center shadow-xs">
          <div className="size-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldAlert className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-red-950 mb-2">Access Restricted to Project Operations</h2>
          <p className="text-sm text-red-700 max-w-md mx-auto mb-6">
            The Reports and Project Tracking module is restricted to <strong>Super Admin</strong>, <strong>Admin</strong>, and <strong>Supervisor</strong> roles. Commercial accounting operations are managed under Accounts & Commercial.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100/80 rounded-lg text-xs font-semibold text-red-800">
            Current Role: {role}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {statusNotice && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-semibold flex items-center gap-2.5 transition-all duration-200 ${
            statusNotice.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          {statusNotice.type === "success" ? (
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="size-5 text-red-600 shrink-0" />
          )}
          <span>{statusNotice.text}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* HEADER SECTION WITH ADD PROJECT BUTTON FOR ADMIN & SUPER_ADMIN */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">REPORTS</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Plant Efficiency, Throughput Telemetry & Stage-Wise Project Execution
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={loadReportsData}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh reports data"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          {(isSuperAdmin || isAdmin) && (
            <button
              type="button"
              onClick={() => {
                if (supervisorsList.length > 0 && !newSupervisorId) {
                  setNewSupervisorId(supervisorsList[0].id);
                }
                setShowAddProjectModal(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. TOP 4 KPI CARDS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: EFFICIENCY */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">KPI 1: EFFICIENCY</span>
            <div className="size-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {summary?.efficiency.actual ?? 0}%
              </span>
              <span className="text-xs font-semibold text-slate-400">target {summary?.efficiency.target ?? 85}%</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {(summary?.efficiency.variance ?? 0) >= 0 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <TrendingUp className="size-3.5" /> +{summary?.efficiency.variance}% vs planned
                </span>
              ) : (
                <span className="text-rose-700 font-bold flex items-center gap-0.5">
                  <TrendingDown className="size-3.5" /> {summary?.efficiency.variance}% vs planned
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t pt-2">
            Formula: (Actual Progress / Planned Progress) × 100
          </div>
        </div>

        {/* KPI 2: OUTPUT */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">KPI 2: OUTPUT</span>
            <div className="size-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="size-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {summary?.output.value ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">{summary?.output.unit ?? "Tons"}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">
              {summary?.output.subtext || "Fabricated structural tonnage across accessible workloads"}
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t pt-2">
            Total structural fabrication output (MT)
          </div>
        </div>

        {/* KPI 3: TODAY */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">KPI 3: TODAY</span>
            <div className="size-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {summary?.today.value ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">{summary?.today.unit ?? "Tons"}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">
              {summary?.today.subtext || "Today's shift fabricated tonnage cleared"}
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t pt-2">
            Daily shop-floor verified throughput (MT)
          </div>
        </div>

        {/* KPI 4: PERIOD OUTPUT (With Weekly / Monthly Selector) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">KPI 4: PERIOD OUTPUT</span>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setPeriod("weekly")}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                  period === "weekly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                  period === "monthly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {summary?.periodOutput.value ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">{summary?.periodOutput.unit ?? "Tons"}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600 capitalize">
              {period} throughput cycle
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-400 border-t pt-2">
            {period === "weekly" ? "Rolling 7-day fabricated output (Tons)" : "Rolling 30-day fabricated output (Tons)"}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. KPI DETAILS DROPDOWN (Expandable Context) */}
      {/* ==================================================================== */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowDetailsDropdown((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <span>{showDetailsDropdown ? "Hide Details" : "View KPI Details"}</span>
          {showDetailsDropdown ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {showDetailsDropdown && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
            <Info className="size-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Detailed Production & Efficiency Breakdown
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Efficiency Math */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block border-b pb-1">Efficiency Telemetry</span>
              <div className="flex justify-between text-slate-600">
                <span>Target Efficiency:</span>
                <span className="font-semibold text-slate-900">{summary?.details.targetEfficiency}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Actual Efficiency:</span>
                <span className="font-semibold text-slate-900">{summary?.details.actualEfficiency}%</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t">
                <span>Variance:</span>
                <span className={`font-bold ${(summary?.details.variance ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {summary?.details.variance}%
                </span>
              </div>
            </div>

            {/* Output Breakdowns */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block border-b pb-1">Output Volumes</span>
              <div className="flex justify-between text-slate-600">
                <span>Today's Output:</span>
                <span className="font-semibold text-slate-900">{summary?.details.todayOutput} Tons</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Weekly Output:</span>
                <span className="font-semibold text-slate-900">{summary?.details.weeklyOutput} Tons</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t">
                <span>Monthly Output:</span>
                <span className="font-semibold text-slate-900">{summary?.details.monthlyOutput} Tons</span>
              </div>
            </div>

            {/* Project Statuses */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block border-b pb-1">Project Workload</span>
              <div className="flex justify-between text-slate-600">
                <span>Total Projects:</span>
                <span className="font-semibold text-slate-900">{summary?.details.projectsTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>In Progress:</span>
                <span className="font-semibold text-blue-700">{summary?.details.projectsInProgress}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Projects Delayed:</span>
                <span className="font-bold text-rose-700">{summary?.details.projectsDelayed}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t">
                <span>Projects Completed:</span>
                <span className="font-bold text-emerald-700">{summary?.details.projectsCompleted}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. MAIN TABS: [ PROJECT PROGRESS ] [ PROJECT DETAILS ] */}
      {/* ==================================================================== */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("progress")}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "progress"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className="size-4" />
            <span>PROJECT PROGRESS</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {projects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "details"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="size-4" />
            <span>PROJECT DETAILS</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {isSupervisor ? "My Projects" : "All Projects"}
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PROJECT PROGRESS (Line Graph & Table with Delays) */}
      {/* ==================================================================== */}
      {activeTab === "progress" && (
        <div className="space-y-6">
          {/* Line Graph Card: Planned Progress vs Actual Progress */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Project Progress Over Time (Planned vs Actual)
                </h3>
                <p className="text-xs text-slate-500">
                  Aggregated telemetry curve showing planned milestones vs actual stage completions
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-blue-600 inline-block" />
                  <span className="text-slate-700">Planned Progress (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-emerald-600 inline-block" />
                  <span className="text-slate-700">Actual Progress (%)</span>
                </div>
              </div>
            </div>

            {/* SVG Line Graph */}
            {timeline.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed rounded-lg bg-slate-50">
                <BarChart3 className="size-10 mb-2 stroke-1" />
                <p className="text-xs font-semibold">No project progress data available yet.</p>
              </div>
            ) : (
              <div className="relative pt-4">
                {/* Hover Tooltip Box */}
                {hoveredPoint && (
                  <div className="absolute top-2 right-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-md shadow-md pointer-events-none z-10 flex items-center gap-3">
                    <span className="font-bold">{hoveredPoint.date}</span>
                    <span className="text-blue-300">Planned: {hoveredPoint.plannedProgress}%</span>
                    <span className="text-emerald-300">Actual: {hoveredPoint.actualProgress}%</span>
                  </div>
                )}

                <div className="w-full overflow-x-auto">
                  <svg viewBox="0 0 700 240" className="w-full h-56 min-w-[500px]">
                    {/* Background Grid Lines */}
                    {[0, 20, 40, 60, 80, 100].map((val) => {
                      const y = 200 - val * 1.8;
                      return (
                        <g key={val}>
                          <line x1="45" y1={y} x2="680" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                          <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                            {val}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Timeline X Axis Dates */}
                    {timeline.map((pt, idx) => {
                      const x = 70 + idx * ((680 - 70) / Math.max(1, timeline.length - 1));
                      return (
                        <text
                          key={pt.date}
                          x={x}
                          y="225"
                          textAnchor="middle"
                          fontSize="9.5"
                          fill="#64748b"
                          fontWeight="500"
                        >
                          {pt.date.slice(5)}
                        </text>
                      );
                    })}

                    {/* Planned Progress Line (Blue) */}
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      points={timeline
                        .map((pt, idx) => {
                          const x = 70 + idx * ((680 - 70) / Math.max(1, timeline.length - 1));
                          const y = 200 - pt.plannedProgress * 1.8;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />

                    {/* Actual Progress Line (Emerald Green) */}
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      points={timeline
                        .map((pt, idx) => {
                          const x = 70 + idx * ((680 - 70) / Math.max(1, timeline.length - 1));
                          const y = 200 - pt.actualProgress * 1.8;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />

                    {/* Interactive Data Points */}
                    {timeline.map((pt, idx) => {
                      const x = 70 + idx * ((680 - 70) / Math.max(1, timeline.length - 1));
                      const yPlanned = 200 - pt.plannedProgress * 1.8;
                      const yActual = 200 - pt.actualProgress * 1.8;

                      return (
                        <g
                          key={pt.date}
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          className="cursor-pointer"
                        >
                          {/* Planned Marker */}
                          <circle cx={x} cy={yPlanned} r="4" fill="#2563eb" />
                          {/* Actual Marker */}
                          <circle cx={x} cy={yActual} r="5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Project Progress List & Delay Highlighting Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Project Progress & Delay Monitor
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time status based on planned stage deadlines vs actual completions
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-40 sm:w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4 w-44">Progress</th>
                    <th className="py-3 px-4">Planned End Date</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Remark</th>
                    <th className="py-3 px-4">Delay Information</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No projects match the current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => {
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            p.isDelayed ? "bg-rose-50/40" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{p.projectName}</span>
                            <span className="text-[11px] text-slate-500">{p.customerName}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    p.progressPercent === 100
                                      ? "bg-emerald-600"
                                      : p.isDelayed
                                      ? "bg-rose-500"
                                      : "bg-amber-500"
                                  }`}
                                  style={{ width: `${p.progressPercent}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-800 text-xs">{p.progressPercent}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">{p.endDate}</td>
                          <td className="py-3 px-4">
                            {p.derivedStatus === "COMPLETED" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="size-3" /> COMPLETED
                              </span>
                            ) : p.isDelayed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <AlertTriangle className="size-3" /> DELAYED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                <Clock className="size-3" /> ON TRACK
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={p.remark || ""}>
                            {p.remark || "-"}
                          </td>
                          <td className="py-3 px-4">
                            {p.isDelayed ? (
                              <span className="font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                                Delayed by {p.delayDays} {p.delayDays === 1 ? "day" : "days"}
                              </span>
                            ) : p.derivedStatus === "COMPLETED" ? (
                              <span className="text-emerald-700 font-semibold">Completed on schedule</span>
                            ) : (
                              <span className="text-slate-500 font-medium">On Schedule</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PROJECT DETAILS (Expandable Rows & Dynamic Execution Table) */}
      {/* ==================================================================== */}
      {activeTab === "details" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Project Execution Directory
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any project to expand its stage-wise Material & Drawing execution table
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredProjects.length} accessible projects
            </div>
          </div>

          {/* Expandable Project List */}
          <div className="space-y-3">
            {filteredProjects.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <Layers className="size-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No projects available for your role.</p>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isExpanded = expandedProjectId === p.id;

                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all duration-200"
                  >
                    {/* Project Header Row */}
                    <div
                      onClick={() => handleToggleProject(p.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{p.projectName}</span>
                            {p.isDelayed && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800">
                                DELAYED ({p.delayDays}d)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            <span>Client: <strong>{p.customerName}</strong></span>
                            <span>•</span>
                            <span>Supervisor: <strong>{p.supervisorName || "Assigned"}</strong></span>
                            <span>•</span>
                            <span>Timeline: {p.startDate} to {p.endDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Progress Capsule */}
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <span className="text-xs font-bold text-slate-900">{p.progressPercent}%</span>
                          <span className="text-[10px] text-slate-400 block">Completion</span>
                        </div>
                        <div className="w-20 bg-slate-100 rounded-full h-2 hidden sm:block overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.progressPercent === 100
                                ? "bg-emerald-600"
                                : p.isDelayed
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${p.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Project Content: Metadata Banner & Execution Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/50 p-4 space-y-4 animate-in fade-in duration-200">
                        {isLoadingDetail ? (
                          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <RefreshCw className="size-4 animate-spin text-amber-600" />
                            <span>Loading execution table...</span>
                          </div>
                        ) : projectDetail ? (
                          <>
                            {/* Project Metadata Banner */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                              <div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase block">Customer / Client</span>
                                <span className="font-semibold text-slate-800">{projectDetail.project.customerName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase block">Supervisor</span>
                                <span className="font-semibold text-slate-800">{projectDetail.project.supervisorName || "Assigned"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase block">Planned Window</span>
                                <span className="font-semibold text-slate-800">{projectDetail.project.startDate} to {projectDetail.project.endDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase block">Status</span>
                                <span className="font-semibold text-slate-800">{projectDetail.project.derivedStatus}</span>
                              </div>
                            </div>

                            {/* Table Actions Header */}
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                Stage Execution Matrix (Material vs Dynamic Stages)
                              </h4>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowAddItemModal(true)}
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="size-3" />
                                  <span>Add Item</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setShowAddColumnModal(true)}
                                  className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="size-3" />
                                  <span>Add Stage Column</span>
                                </button>
                              </div>
                            </div>

                            {/* Execution Table with Horizontal Scroll for Dynamic Columns */}
                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                                    <th className="py-2.5 px-3 min-w-[200px] border-r">
                                      Material & Drawing
                                    </th>
                                    {projectDetail.stages.map((st) => (
                                      <th key={st.id} className="py-2.5 px-3 text-center min-w-[120px] border-r">
                                        <div className="flex items-center justify-center gap-1">
                                          <span>{st.name}</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowRenameColumnModal({ stageId: st.id, name: st.name });
                                              setRenameColumnInput(st.name);
                                            }}
                                            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                            title="Rename stage column"
                                          >
                                            <Edit2 className="size-2.5" />
                                          </button>
                                          {!st.isDefault && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDeleteColumnConfirm({ stageId: st.id, name: st.name });
                                              }}
                                              className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer"
                                              title="Delete custom stage column"
                                            >
                                              <Trash2 className="size-2.5" />
                                            </button>
                                          )}
                                        </div>
                                        <span className="text-[9px] font-normal text-slate-400 block">
                                          {st.plannedCompletionDate}
                                        </span>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {projectDetail.items.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={projectDetail.stages.length + 1}
                                        className="py-6 text-center text-slate-400"
                                      >
                                        No material/drawing items added yet. Click &quot;Add Item&quot; to begin.
                                      </td>
                                    </tr>
                                  ) : (
                                    projectDetail.items.map((item) => (
                                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Column 1: Material & Drawing */}
                                        <td className="py-2.5 px-3 border-r font-medium text-slate-900">
                                          <span className="block font-semibold text-slate-900">{item.material}</span>
                                          <span className="text-[10px] text-slate-500 font-mono">
                                            DWG: {item.drawingNumber}
                                          </span>
                                        </td>

                                        {/* Dynamic Stage Cells */}
                                        {projectDetail.stages.map((stage) => {
                                          const key = `${item.id}_${stage.id}`;
                                          const cell = projectDetail.cellStatuses[key];
                                          const isComplete = cell?.status === "COMPLETE";
                                          const hasRemark = Boolean(cell?.remark && cell.remark.trim().length > 0);

                                          return (
                                            <td
                                              key={stage.id}
                                              className="py-2.5 px-3 border-r text-center align-middle"
                                            >
                                              <div
                                                onClick={() => {
                                                  setActiveCellModal({
                                                    itemId: item.id,
                                                    stageId: stage.id,
                                                    material: item.material,
                                                    stageName: stage.name,
                                                    currentStatus: isComplete ? "COMPLETE" : "INCOMPLETE",
                                                    currentRemark: cell?.remark || "",
                                                  });
                                                  setCellRemarkInput(cell?.remark || "");
                                                }}
                                                className={`inline-flex items-center justify-center size-8 rounded-md cursor-pointer transition-all duration-150 border relative ${
                                                  isComplete
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                                    : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                                                }`}
                                                title={hasRemark ? `Remark: ${cell.remark}` : "Click to change status or add remark"}
                                              >
                                                {isComplete ? (
                                                  <Check className="size-4.5 stroke-[2.5]" />
                                                ) : (
                                                  <X className="size-4.5 stroke-[2.5]" />
                                                )}

                                                {/* Custom Remark Indicator Icon */}
                                                {hasRemark && (
                                                  <span className="absolute -top-1.5 -right-1.5 size-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs">
                                                    💬
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 29. CELL ACTION POPOVER / MODAL (Complete, Incomplete, Remark) */}
      {/* ==================================================================== */}
      {activeCellModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase">
                  Stage: {activeCellModal.stageName}
                </h4>
                <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                  {activeCellModal.material}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Status Toggles */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Update Status
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCellAction("COMPLETE")}
                  className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    activeCellModal.currentStatus === "COMPLETE"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  <Check className="size-4" />
                  <span>Mark Complete</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCellAction("INCOMPLETE")}
                  className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    activeCellModal.currentStatus === "INCOMPLETE"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                  }`}
                >
                  <X className="size-4" />
                  <span>Incomplete</span>
                </button>
              </div>
            </div>

            {/* Custom Remark Section */}
            <div className="space-y-1.5 pt-2 border-t">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <MessageSquare className="size-3 text-slate-500" />
                <span>Custom Stage Remark</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 2 plates pending, waiting for NDT, rework..."
                value={cellRemarkInput}
                onChange={(e) => setCellRemarkInput(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveCellModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCellAction(activeCellModal.currentStatus, cellRemarkInput.trim())}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer shadow-xs"
                >
                  Save Remark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 33. ADD PROJECT MODAL (Admin & Super Admin) */}
      {/* ==================================================================== */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Provision New Project</h3>
                <p className="text-xs text-slate-500">Create project and establish 5 core stage deadlines</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4 text-xs">
              {/* SECTION 1: PROJECT INFORMATION */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] block">
                  Project Information
                </span>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC Structural Plant Expansion"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Customer / Client *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Larsen & Toubro"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Assigned Supervisor *</label>
                    <select
                      value={newSupervisorId}
                      onChange={(e) => setNewSupervisorId(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      required
                    >
                      <option value="">Select Supervisor...</option>
                      {supervisorsList.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name} ({sup.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROJECT DATES */}
              <div className="space-y-2 pt-2 border-t">
                <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] block">
                  Project Timeline
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: STAGE DEADLINES */}
              <div className="space-y-2 pt-2 border-t">
                <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] block">
                  Default Stage Deadlines
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-0.5">1. Marking Deadline</label>
                    <input
                      type="date"
                      required
                      value={newStageDeadlines.marking}
                      onChange={(e) => setNewStageDeadlines({ ...newStageDeadlines, marking: e.target.value })}
                      className="w-full p-1.5 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-0.5">2. Cutting Deadline</label>
                    <input
                      type="date"
                      required
                      value={newStageDeadlines.cutting}
                      onChange={(e) => setNewStageDeadlines({ ...newStageDeadlines, cutting: e.target.value })}
                      className="w-full p-1.5 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-0.5">3. Fitting Deadline</label>
                    <input
                      type="date"
                      required
                      value={newStageDeadlines.fitting}
                      onChange={(e) => setNewStageDeadlines({ ...newStageDeadlines, fitting: e.target.value })}
                      className="w-full p-1.5 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-0.5">4. Welding Deadline</label>
                    <input
                      type="date"
                      required
                      value={newStageDeadlines.welding}
                      onChange={(e) => setNewStageDeadlines({ ...newStageDeadlines, welding: e.target.value })}
                      className="w-full p-1.5 border rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-600 font-medium mb-0.5">5. Final Inspection Deadline</label>
                    <input
                      type="date"
                      required
                      value={newStageDeadlines.final}
                      onChange={(e) => setNewStageDeadlines({ ...newStageDeadlines, final: e.target.value })}
                      className="w-full p-1.5 border rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: INITIAL REMARK */}
              <div className="space-y-1 pt-2 border-t">
                <label className="block text-slate-600 font-semibold">Initial Remark (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Material specs, drawing revisions, special precautions..."
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingProject ? "Provisioning..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 22. ADD CUSTOM COLUMN MODAL */}
      {/* ==================================================================== */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Add Stage Column</h4>
            <p className="text-xs text-slate-500 mb-4">
              Add custom project stage (e.g. Painting, NDT, Galvanizing)
            </p>

            <form onSubmit={handleAddColumnSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Column / Stage Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Painting or Inspection"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Planned Completion Date</label>
                <input
                  type="date"
                  required
                  value={newColumnDate}
                  onChange={(e) => setNewColumnDate(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md cursor-pointer"
                >
                  Add Column
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 23. RENAME COLUMN MODAL */}
      {/* ==================================================================== */}
      {showRenameColumnModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Rename Stage Column</h4>
            <p className="text-xs text-slate-500 mb-4">
              Rename stage column (cell data will be preserved)
            </p>

            <form onSubmit={handleRenameColumnSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Stage Name *</label>
                <input
                  type="text"
                  required
                  value={renameColumnInput}
                  onChange={(e) => setRenameColumnInput(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRenameColumnModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
                >
                  Save Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 24. DELETE COLUMN CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {showDeleteColumnConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              <h4 className="text-sm font-bold">Delete Custom Column</h4>
            </div>
            <p className="text-slate-600">
              Are you sure you want to delete custom stage <strong>&quot;{showDeleteColumnConfirm.name}&quot;</strong>?
              This column may contain existing cell progress entries.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowDeleteColumnConfirm(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteColumnConfirm}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer shadow-xs"
              >
                Delete Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADD ITEM ROW MODAL */}
      {/* ==================================================================== */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Add Project Material / Drawing</h4>
            <p className="text-xs text-slate-500 mb-4">Add a new fabrication row item to this project</p>

            <form onSubmit={handleAddItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Material Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plate 20mm IS 2062 or ISMB 500"
                  value={newItemMaterial}
                  onChange={(e) => setNewItemMaterial(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drawing Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DWG-STR-012"
                  value={newItemDrawing}
                  onChange={(e) => setNewItemDrawing(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md cursor-pointer"
                >
                  Add Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
