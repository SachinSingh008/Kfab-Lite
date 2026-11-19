"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Building2,
  Folder,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  RotateCw,
  Sparkles,
  BarChart3,
  Calendar,
  ShieldAlert,
  ArrowRight,
  Info,
} from "lucide-react";
import { AppUser } from "@/lib/auth-store";
import {
  ProjectCol,
  SheetRowItem,
  getStoredMonitoringProjects,
  getStoredMonitoringRows,
  calculateProductionMetrics,
} from "@/lib/project-monitoring-store";

interface ProjectProgressViewProps {
  currentUser?: AppUser;
  onSwitchToDetails?: () => void;
}

export function ProjectProgressView({
  currentUser,
  onSwitchToDetails,
}: ProjectProgressViewProps) {
  // Read live projects and sheet rows from the shared monitoring store
  const [projects, setProjects] = useState<ProjectCol[]>(() => getStoredMonitoringProjects());
  const [rows, setRows] = useState<SheetRowItem[]>(() => getStoredMonitoringRows());

  // Listen to updates made in the Project Details tab
  useEffect(() => {
    const handleUpdate = () => {
      setProjects(getStoredMonitoringProjects());
      setRows(getStoredMonitoringRows());
    };

    window.addEventListener("kfab_monitoring_sheet_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("kfab_monitoring_sheet_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Top Filters:
  // 1. Select Company (Default: "ALL")
  // 2. Select Job showing all active projects (Default: "ALL" -> all active projects)
  const [selectedCompany, setSelectedCompany] = useState<string>("ALL");
  const [selectedJobId, setSelectedJobId] = useState<string>("ALL");

  // Filtered active projects available for the job dropdown
  const availableActiveProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.status !== "Active") return false;
      if (selectedCompany !== "ALL" && p.company !== selectedCompany) return false;
      return true;
    });
  }, [projects, selectedCompany]);

  // When selected company changes, reset job if it no longer matches
  useEffect(() => {
    if (selectedJobId !== "ALL") {
      const match = availableActiveProjects.find((p) => p.id === selectedJobId);
      if (!match) setSelectedJobId("ALL");
    }
  }, [selectedCompany, availableActiveProjects, selectedJobId]);

  // Dynamically calculate all telemetry, curves, KPIs, bottlenecks, and highlights strictly from Project Details Sheet
  const metrics = useMemo(() => {
    return calculateProductionMetrics(projects, rows, selectedCompany, selectedJobId);
  }, [projects, rows, selectedCompany, selectedJobId]);

  return (
    <div className="space-y-4 pb-12 font-sans text-slate-800">
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <span>Reports</span>
            <ChevronRight className="size-3 text-slate-400" />
            <span className="text-slate-900 font-semibold">Project Progress</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="size-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                Project Progress &amp; Telemetry
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Live stage-wise tracking &amp; execution curves powered directly by the Project Details Monitoring Sheet
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Switch to Project Details Sheet */}
        <div className="flex items-center gap-2">
          {onSwitchToDetails && (
            <button
              type="button"
              onClick={onSwitchToDetails}
              className="px-3.5 py-1.5 bg-[#0F2642] hover:bg-[#153457] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="size-3.5 text-blue-200" />
              <span>Open Project Details Sheet →</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TOP DROPDOWNS: SELECT COMPANY & SELECT JOB (Showing all active projects, default: all active) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Select Company Dropdown */}
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Select Company
            </label>
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="appearance-none pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer min-w-[180px]"
              >
                <option value="ALL">All Companies</option>
                {Array.from(new Set(projects.map((p) => p.company))).map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
              <Building2 className="size-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Select Job Dropdown (Showing all active projects, default: all active projects) */}
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Select Job / Execution Workload
            </label>
            <div className="relative">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="appearance-none pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer min-w-[240px]"
              >
                <option value="ALL">All Active Projects (Default)</option>
                {availableActiveProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.company} – {p.jobName}
                  </option>
                ))}
              </select>
              <Folder className="size-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Selected Scope Indicator */}
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Scope Telemetry
          </span>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{metrics.targetCompany}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 truncate max-w-[200px]">{metrics.targetJobName}</span>
          </div>
        </div>
      </div>

      {/* 3. TOP 4 DYNAMIC KPI CARDS (Calculated strictly from Project Details Sheet) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: OVERALL PROGRESS */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">OVERALL PROGRESS</span>
            <div className="size-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {metrics.overallProgressPercent}%
              </span>
              <span className="text-xs font-semibold text-slate-500">completed</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
              <div
                style={{ width: `${metrics.overallProgressPercent}%` }}
                className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between font-medium">
              <span>{metrics.completedActivities} done</span>
              <span>{metrics.totalActivities} total activities</span>
            </div>
          </div>
        </div>

        {/* KPI 2: EFFICIENCY VARIANCE */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">EFFICIENCY VARIANCE</span>
            <div className="size-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="size-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {metrics.efficiencyVariance >= 0 ? `+${metrics.efficiencyVariance}%` : `${metrics.efficiencyVariance}%`}
              </span>
              <span className="text-xs font-semibold text-slate-400">vs milestone baseline</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {metrics.efficiencyVariance >= 0 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <TrendingUp className="size-3.5" /> Ahead of planned milestone pace
                </span>
              ) : (
                <span className="text-rose-700 font-bold flex items-center gap-0.5">
                  <TrendingDown className="size-3.5" /> Behind scheduled production target
                </span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 mt-2">
            Formula: (Actual Tasks Completed / Milestone Baseline) × 100
          </div>
        </div>

        {/* KPI 3: BOTTLENECK TASKS */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">ACTION BOTTLENECKS</span>
            <div className="size-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600">
                {metrics.delayedActivities + metrics.pendingActivities}
              </span>
              <span className="text-xs font-semibold text-slate-500">items requiring action</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <div className="flex justify-between">
                <span>Critical Delays (Not Done):</span>
                <span className="font-bold text-rose-600">{metrics.delayedActivities}</span>
              </div>
              <div className="flex justify-between">
                <span>In Progress (Pending):</span>
                <span className="font-bold text-amber-600">{metrics.pendingActivities}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: SCOPE SUMMARY */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">SUPERVISOR &amp; WORKLOAD</span>
            <div className="size-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <User className="size-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 truncate">
              {metrics.targetSupervisor}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {metrics.isSpecificJob
                ? `Company: ${metrics.targetCompany}`
                : `${metrics.activeProjectsCount} Active Projects Monitored`}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <Clock className="size-3.5 text-slate-500" />
              <span className="font-semibold truncate">
                {metrics.stages[metrics.stages.length - 1]?.targetDate || "25-Sep-2026"} Target
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE SVG PROGRESS OVER TIME GRAPH (Planned vs Actual) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Production Execution Curve (Planned vs Actual)
            </h3>
            <p className="text-xs text-slate-500">
              Cumulative progress curve computed directly from Project Details activities across all 7 stages
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-blue-600 inline-block" />
              <span className="text-slate-700">Planned Target (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-emerald-600 inline-block" />
              <span className="text-slate-700">Actual Completed (%)</span>
            </div>
          </div>
        </div>

        {/* SVG Curve Visualization */}
        <div className="relative w-full h-56 sm:h-64 pt-4 pb-8 select-none">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
            {/* Grid horizontal lines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = 180 - (val / 100) * 160;
              return (
                <g key={val}>
                  <line x1="30" y1={y} x2="680" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                  <text x="5" y={y + 3} fill="#94A3B8" fontSize="10" fontFamily="sans-serif">
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Compute SVG path points */}
            {(() => {
              const pts = metrics.timelineCurve;
              if (pts.length === 0) return null;

              const stepX = (680 - 60) / Math.max(pts.length - 1, 1);

              const plannedPath = pts
                .map((pt, i) => {
                  const x = 60 + i * stepX;
                  const y = 180 - (pt.planned / 100) * 160;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ");

              const actualPath = pts
                .map((pt, i) => {
                  const x = 60 + i * stepX;
                  const y = 180 - (pt.actual / 100) * 160;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                })
                .join(" ");

              return (
                <>
                  {/* Planned Line (Blue) */}
                  <path d={plannedPath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="4 2" />

                  {/* Actual Line (Green) */}
                  <path d={actualPath} fill="none" stroke="#16A34A" strokeWidth="3" />

                  {/* Stage Points */}
                  {pts.map((pt, i) => {
                    const x = 60 + i * stepX;
                    const yPlanned = 180 - (pt.planned / 100) * 160;
                    const yActual = 180 - (pt.actual / 100) * 160;

                    return (
                      <g key={pt.stage}>
                        {/* Planned circle point */}
                        <circle cx={x} cy={yPlanned} r="3.5" fill="#2563EB" />
                        {/* Actual circle point */}
                        <circle cx={x} cy={yActual} r="4.5" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.5" />

                        {/* X-axis Stage Label */}
                        <text
                          x={x}
                          y="196"
                          textAnchor="middle"
                          fill="#475569"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {pt.stage}
                        </text>
                        {/* Target Date */}
                        <text
                          x={x}
                          y="208"
                          textAnchor="middle"
                          fill="#94A3B8"
                          fontSize="8.5"
                        >
                          {pt.date}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* 5. STAGE-BY-STAGE PROGRESS METERS (All 7 Sections from Project Details) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Stage Completion Telemetry (7 Production Sections)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {metrics.completedActivities} / {metrics.totalActivities} Tasks Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.stages.map((stg, idx) => (
            <div
              key={stg.id || stg.name}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                  <span className="truncate">
                    {idx + 1}. {stg.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                      stg.status === "done"
                        ? "bg-emerald-100 text-emerald-800"
                        : stg.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {stg.progressPercent}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-1.5">
                  <div
                    style={{ width: `${stg.progressPercent}%` }}
                    className={`h-full rounded-full ${
                      stg.status === "done"
                        ? "bg-[#16A34A]"
                        : stg.status === "in_progress"
                        ? "bg-blue-600"
                        : "bg-slate-400"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 border-t border-slate-200 pt-1.5">
                <span>{stg.completedTasks} / {stg.totalTasks} Done</span>
                <span className="font-mono text-slate-600 font-semibold">{stg.targetDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. HIGHLIGHTS ROW: MILESTONES, BOTTLENECKS & ATTACHED DRIVE DOCUMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Highlight 1: Recent Completed Milestones */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            <CheckCircle2 className="size-4" />
            <span>Verified Milestones</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {metrics.milestones.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No milestones completed yet.</p>
            ) : (
              metrics.milestones.map((m) => (
                <div key={m.id} className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="truncate">{m.activity}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      {m.stage}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 truncate">{m.remark}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Highlight 2: Critical Bottlenecks & Delays */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            <AlertTriangle className="size-4" />
            <span>Active Delays &amp; Queries</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {metrics.bottlenecks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">All activities currently on track.</p>
            ) : (
              metrics.bottlenecks.map((b) => (
                <div
                  key={b.id}
                  className={`border rounded-lg p-2 text-xs ${
                    b.status === "not_done"
                      ? "bg-rose-50/70 border-rose-100 text-rose-900"
                      : "bg-amber-50/70 border-amber-100 text-amber-900"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="truncate">{b.activity}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-extrabold ${
                        b.status === "not_done" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.status === "not_done" ? "DELAY" : "PENDING"}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px] mt-0.5 truncate">{b.remark}</p>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>Supervisor: {b.supervisor}</span>
                    <span>Stage: {b.stage}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Highlight 3: Attached Google Drive Documents & QA Dossiers */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
            <ExternalLink className="size-4" />
            <span>Inspection &amp; Drive Dossiers</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {metrics.documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No document links detected.</p>
            ) : (
              metrics.documents.map((doc, dIdx) => (
                <div key={dIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block truncate">{doc.title}</span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {doc.company} • {doc.activity}
                    </span>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-bold text-blue-700 flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <span>Open</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

