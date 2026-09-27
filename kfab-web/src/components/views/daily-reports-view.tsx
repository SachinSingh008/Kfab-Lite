"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  HardHat,
  Image as ImageIcon,
  Plus,
  Search,
  Truck,
  Users,
  Wrench,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Camera,
  Layers,
  Check,
} from "lucide-react";
import { DailyReportRecord } from "@/lib/mock-data";

interface DailyReportsViewProps {
  reports?: DailyReportRecord[];
  onAddReport?: (report: DailyReportRecord) => void;
}

const STEP_LABELS = [
  "Project",
  "Work",
  "Progress",
  "Workers",
  "Machines",
  "QA/QC",
  "Issues",
  "Requirements",
  "Photos",
  "Submit",
] as const;

export function DailyReportsView({
  reports = [],
  onAddReport,
}: DailyReportsViewProps) {
  const [reportList, setReportList] = useState<DailyReportRecord[]>(reports);
  const [viewMode, setViewMode] = useState<"cards" | "timeline" | "table">("cards");
  const [search, setSearch] = useState("");
  const [qaFilter, setQaFilter] = useState("all");

  // 10-Step Wizard Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Form State - Starts clean with sensible blank defaults
  const [formProject, setFormProject] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formShift, setFormShift] = useState<"Day Shift" | "Night Shift">("Day Shift");
  const [formWorkPlanned, setFormWorkPlanned] = useState("");
  const [formWorkCompleted, setFormWorkCompleted] = useState("");
  const [formPercent, setFormPercent] = useState(0);
  const [formWorkers, setFormWorkers] = useState(0);
  const [formWelders, setFormWelders] = useState(0);
  const [formFitters, setFormFitters] = useState(0);
  const [formRiggers, setFormRiggers] = useState(0);
  const [formMachine, setFormMachine] = useState("");
  const [formMachineHours, setFormMachineHours] = useState(0);
  const [formQa, setFormQa] = useState<"Passed" | "Observation" | "Failed">("Passed");
  const [formQaNotes, setFormQaNotes] = useState("");
  const [formIssueTitle, setFormIssueTitle] = useState("");
  const [formIssueSeverity, setFormIssueSeverity] = useState<"Low" | "Medium" | "High">("Low");
  const [formReqItem, setFormReqItem] = useState("");
  const [formReqUrgency, setFormReqUrgency] = useState<"Low" | "Medium" | "High">("Medium");
  const [formSupervisorNotes, setFormSupervisorNotes] = useState("");

  const filteredReports = useMemo(() => {
    return reportList.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        `${r.code} ${r.project} ${r.planned} ${r.completed}`
          .toLowerCase()
          .includes(q);
      const matchesQa =
        qaFilter === "all" ||
        r.qa.toLowerCase() === qaFilter.toLowerCase();
      return matchesQuery && matchesQa;
    });
  }, [reportList, search, qaFilter]);

  const totalWorkers = reportList.reduce((s, r) => s + (r.workers || 0), 0);
  const passedQaCount = reportList.filter((r) => r.qa.toLowerCase().includes("pass")).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: DailyReportRecord = {
      code: `DR-2026-${String(reportList.length + 13).padStart(4, "0")}`,
      project: formProject,
      date: formDate,
      shift: formShift,
      planned: formWorkPlanned,
      completed: formWorkCompleted,
      percent: formPercent,
      workers: formWorkers,
      welders: formWelders,
      fitters: formFitters,
      riggers: formRiggers,
      machines: 2,
      machineName: formMachine,
      machineHours: formMachineHours,
      qa: formQa,
      qaNotes: formQaNotes,
      issueTitle: formIssueTitle || undefined,
      issueSeverity: formIssueSeverity,
      reqItem: formReqItem || undefined,
      reqUrgency: formReqUrgency,
      supervisorNotes: formSupervisorNotes,
      status: "Submitted",
    };

    setReportList([newReport, ...reportList]);
    if (onAddReport) onAddReport(newReport);
    setIsModalOpen(false);
    setStep(1);
  };

  return (
    <div className="space-y-4">
      {/* 1. Supervisor Live Shift Header Banner */}
      <div
        className="flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs"
        style={{
          borderColor: "var(--role-border)",
          backgroundColor: "var(--role-card-bg)",
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 text-xs font-bold rounded-md shadow-xs text-white"
              style={{ backgroundColor: "var(--role-primary)" }}
            >
              Live Shift Operations
            </span>
            <span className="text-xs font-semibold opacity-75">
              Jejuri Works & Erection Sites · Shift A (Morning)
            </span>
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight" style={{ color: "var(--role-header-title)" }}>
            Daily Operations & Site Reports (DPR)
          </h2>
          <p className="mt-1 text-xs opacity-75">
            Guided 10-step site logging for task execution, worker muster, crane runtime, and QA/QC observations.
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setStep(1);
              setIsModalOpen(true);
            }}
            className="h-11 px-5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: "var(--role-primary)",
              color: "#FFFFFF",
            }}
          >
            <Plus className="size-4" /> + Create Today's Report
          </button>
        </div>
      </div>

      {/* 2. Operational KPI Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Reports Logged</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black">{reportList.length} Shifts</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              100% On Time
            </span>
          </div>
          <p className="mt-1 text-[11px] opacity-70">No missing shift logs</p>
        </div>

        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Muster on Duty</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black">{totalWorkers} Personnel</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded border"
              style={{
                backgroundColor: "var(--role-badge-bg)",
                color: "var(--role-badge-text)",
                borderColor: "var(--role-border)",
              }}
            >
              Active
            </span>
          </div>
          <p className="mt-1 text-[11px] opacity-70">Welders, fitters, riggers & operators</p>
        </div>

        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">QA Compliance</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">
              {Math.round((passedQaCount / Math.max(1, reportList.length)) * 100)}%
            </span>
            <span className="text-xs font-semibold opacity-75">{passedQaCount} Passed</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${(passedQaCount / reportList.length) * 100}%` }}
            />
          </div>
        </div>

        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Equipment Uptime</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600">96.4%</span>
            <span className="text-xs font-medium opacity-75">Hydra & SAW Active</span>
          </div>
          <p className="mt-1 text-[11px] opacity-70">Zero critical downtime recorded</p>
        </div>
      </div>

      {/* 3. Search, Filter & View Toggle Strip */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 shadow-xs"
        style={{
          borderColor: "var(--role-border)",
          backgroundColor: "var(--role-card-bg)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 opacity-50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by project, task, code..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border text-xs focus:outline-none focus:ring-1"
              style={{
                borderColor: "var(--role-border)",
                backgroundColor: "var(--role-content-bg)",
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            {(["all", "passed", "observation"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setQaFilter(f)}
                className={`h-8 px-3 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer border ${
                  qaFilter === f
                    ? "text-white shadow-xs"
                    : "opacity-75 hover:opacity-100"
                }`}
                style={
                  qaFilter === f
                    ? {
                        backgroundColor: "var(--role-primary)",
                        borderColor: "var(--role-primary)",
                      }
                    : {
                        borderColor: "var(--role-border)",
                        backgroundColor: "var(--role-content-bg)",
                      }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div
          className="inline-flex rounded-lg border p-0.5"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-content-bg)",
          }}
        >
          {(["cards", "timeline", "table"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-all cursor-pointer ${
                viewMode === m ? "shadow-xs" : "opacity-60 hover:opacity-90"
              }`}
              style={
                viewMode === m
                  ? {
                      backgroundColor: "var(--role-sidebar-item-active-bg)",
                      color: "var(--role-sidebar-item-active-fg)",
                    }
                  : {}
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 4. VIEW 1: Cards View */}
      {viewMode === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => {
            const isPassed = report.qa.toLowerCase().includes("pass");

            return (
              <div
                key={report.code}
                className="rounded-xl border p-5 shadow-xs transition-all hover:shadow-md space-y-4"
                style={{
                  borderColor: "var(--role-border)",
                  backgroundColor: "var(--role-card-bg)",
                }}
              >
                {/* Header: Code, Project & QA Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: "var(--role-badge-bg)",
                        color: "var(--role-badge-text)",
                        borderColor: "var(--role-border)",
                      }}
                    >
                      {report.code}
                    </span>
                    <p className="mt-1.5 font-bold text-sm" style={{ color: "var(--role-header-title)" }}>
                      {report.project}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] opacity-70 flex items-center gap-1">
                      <Calendar className="size-3" /> {report.date}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        isPassed
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {isPassed ? "🟢 QA Passed" : "🟡 QA Observation"}
                    </span>
                  </div>
                </div>

                {/* Work Planned vs Completed Box */}
                <div
                  className="rounded-lg p-3 space-y-2 text-xs border"
                  style={{
                    backgroundColor: "var(--role-content-bg)",
                    borderColor: "var(--role-border)",
                  }}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase opacity-60">Planned Work:</span>
                    <p className="font-medium mt-0.5">{report.planned}</p>
                  </div>
                  <div className="pt-2 border-t" style={{ borderColor: "var(--role-border)" }}>
                    <span className="text-[10px] font-bold uppercase opacity-60">Completed Work:</span>
                    <p className="font-bold mt-0.5" style={{ color: "var(--role-accent)" }}>
                      {report.completed}
                    </p>
                  </div>
                </div>

                {/* Shift Target Completion Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="opacity-70">Shift Target Completion</span>
                    <span className="font-black" style={{ color: "var(--role-header-title)" }}>
                      {report.percent}%
                    </span>
                  </div>
                  <div
                    className="h-2 w-full rounded-full overflow-hidden border"
                    style={{
                      backgroundColor: "var(--role-border)",
                      borderColor: "var(--role-border)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${report.percent}%`,
                        backgroundColor: "var(--role-primary)",
                      }}
                    />
                  </div>
                </div>

                {/* Operational Details Strip */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div
                    className="rounded-lg p-2 border"
                    style={{
                      backgroundColor: "var(--role-content-bg)",
                      borderColor: "var(--role-border)",
                    }}
                  >
                    <p className="text-[10px] opacity-65 font-bold uppercase">Workers</p>
                    <p className="font-bold flex items-center justify-center gap-1 mt-0.5">
                      <Users className="size-3 text-blue-500" /> {report.workers}
                    </p>
                  </div>
                  <div
                    className="rounded-lg p-2 border"
                    style={{
                      backgroundColor: "var(--role-content-bg)",
                      borderColor: "var(--role-border)",
                    }}
                  >
                    <p className="text-[10px] opacity-65 font-bold uppercase">Machinery</p>
                    <p className="font-bold flex items-center justify-center gap-1 mt-0.5">
                      <Wrench className="size-3 text-amber-500" /> {report.machines} Units
                    </p>
                  </div>
                  <div
                    className="rounded-lg p-2 border"
                    style={{
                      backgroundColor: "var(--role-content-bg)",
                      borderColor: "var(--role-border)",
                    }}
                  >
                    <p className="text-[10px] opacity-65 font-bold uppercase">Evidence</p>
                    <p className="font-bold flex items-center justify-center gap-1 mt-0.5">
                      <ImageIcon className="size-3 text-emerald-500" /> 2 Photos
                    </p>
                  </div>
                </div>

                {/* Footer Status */}
                <div
                  className="border-t pt-3 flex items-center justify-between text-xs opacity-75"
                  style={{ borderColor: "var(--role-border)" }}
                >
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Verified by Supervisor
                  </span>
                  <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {report.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VIEW 2: Timeline Stream View */}
      {viewMode === "timeline" && (
        <div
          className="rounded-xl border p-5 shadow-xs space-y-4"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <h3 className="text-sm font-bold border-b pb-3" style={{ borderColor: "var(--role-border)" }}>
            Chronological Daily Shift Stream
          </h3>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredReports.map((report) => (
              <div key={report.code} className="relative space-y-2">
                <span
                  className="absolute -left-[27px] top-1 size-3.5 rounded-full border-2 bg-white"
                  style={{ borderColor: "var(--role-primary)" }}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: "var(--role-badge-bg)",
                        color: "var(--role-badge-text)",
                      }}
                    >
                      {report.code}
                    </span>
                    <span className="font-bold text-sm">{report.project}</span>
                  </div>
                  <span className="text-xs opacity-70">{report.date}</span>
                </div>
                <div
                  className="rounded-lg border p-3 text-xs space-y-1"
                  style={{
                    borderColor: "var(--role-border)",
                    backgroundColor: "var(--role-content-bg)",
                  }}
                >
                  <p><strong>Planned:</strong> {report.planned}</p>
                  <p><strong>Actual Completed:</strong> {report.completed} ({report.percent}%)</p>
                  <p className="opacity-70">
                    Workers: {report.workers} · QA Result: {report.qa}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. VIEW 3: Table View */}
      {viewMode === "table" && (
        <div
          className="rounded-xl border overflow-hidden shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className="border-b font-bold uppercase tracking-wider text-[10px]"
                  style={{
                    backgroundColor: "var(--role-content-bg)",
                    borderColor: "var(--role-border)",
                  }}
                >
                  <th className="p-3">Report Code</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Date & Shift</th>
                  <th className="p-3">Work Completed</th>
                  <th className="p-3 text-center">Progress %</th>
                  <th className="p-3 text-center">Workers</th>
                  <th className="p-3">QA Status</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--role-border)" }}>
                {filteredReports.map((r) => (
                  <tr key={r.code} className="hover:opacity-90">
                    <td className="p-3 font-mono font-bold" style={{ color: "var(--role-primary)" }}>
                      {r.code}
                    </td>
                    <td className="p-3 font-semibold">{r.project}</td>
                    <td className="p-3">
                      <div>{r.date}</div>
                      <div className="text-[10px] opacity-60">{r.shift}</div>
                    </td>
                    <td className="p-3 max-w-xs truncate">{r.completed}</td>
                    <td className="p-3 text-center font-bold">{r.percent}%</td>
                    <td className="p-3 text-center font-bold">{r.workers}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.qa === "Passed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.qa}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. Guided 10-Step Wizard Modal for Daily Site Logging */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: "var(--role-card-bg)",
              borderColor: "var(--role-border)",
            }}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{
                borderColor: "var(--role-border)",
                backgroundColor: "var(--role-content-bg)",
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="size-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: "var(--role-primary)" }}
                  >
                    {step}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                    Step {step} of 10 · {STEP_LABELS[step - 1]}
                  </span>
                </div>
                <h3 className="text-base font-black mt-0.5" style={{ color: "var(--role-header-title)" }}>
                  Create Daily Operations & Site Report (DPR)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Step Progress Indicators */}
            <div className="px-6 pt-3 pb-2 flex items-center gap-1 overflow-x-auto border-b" style={{ borderColor: "var(--role-border)" }}>
              {STEP_LABELS.map((lbl, idx) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setStep(idx + 1)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0 transition-colors ${
                    step === idx + 1
                      ? "text-white shadow-xs"
                      : idx + 1 < step
                      ? "text-emerald-700 bg-emerald-50"
                      : "opacity-40"
                  }`}
                  style={step === idx + 1 ? { backgroundColor: "var(--role-primary)" } : {}}
                >
                  {idx + 1 < step ? <Check className="size-3" /> : idx + 1}
                  <span>{lbl}</span>
                </button>
              ))}
            </div>

            {/* Step Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* STEP 1: Project & Shift */}
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Project & Shift Details</h4>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Select Active Project</label>
                    <select
                      value={formProject}
                      onChange={(e) => setFormProject(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    >
                      <option value="KFAB-PRJ-001 (Chakan Plant)">KFAB-PRJ-001 — Heavy Column Erection (Chakan)</option>
                      <option value="KFAB-PRJ-002 (Aurangabad Conveyor)">KFAB-PRJ-002 — Conveyor Gantry System (Aurangabad)</option>
                      <option value="KFAB-PRJ-003 (Storage Tank Unit 4)">KFAB-PRJ-003 — SS Storage Tank Assembly (Unit 4)</option>
                      <option value="KFAB-PRJ-004 (Platform & Handrail)">KFAB-PRJ-004 — Structural Platform & Handrail</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Shift Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                        style={{ borderColor: "var(--role-border)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Operational Shift</label>
                      <select
                        value={formShift}
                        onChange={(e) => setFormShift(e.target.value as any)}
                        className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                        style={{ borderColor: "var(--role-border)" }}
                      >
                        <option value="Day Shift">Day Shift (08:00 — 17:00)</option>
                        <option value="Night Shift">Night Shift (20:00 — 05:00)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Work Scope */}
              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Work Planned vs Completed</h4>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Planned Task Scope</label>
                    <textarea
                      rows={3}
                      value={formWorkPlanned}
                      onChange={(e) => setFormWorkPlanned(e.target.value)}
                      placeholder="e.g. Column erection G1-G8, splice weld fit-up..."
                      className="w-full p-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Actual Completed Work</label>
                    <textarea
                      rows={3}
                      value={formWorkCompleted}
                      onChange={(e) => setFormWorkCompleted(e.target.value)}
                      placeholder="e.g. Columns G1-G6 fully erected and torque checked..."
                      className="w-full p-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Progress Slider */}
              {step === 3 && (
                <div className="space-y-5 text-center py-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Shift Target Completion</h4>
                  <div className="text-4xl font-black" style={{ color: "var(--role-primary)" }}>
                    {formPercent}%
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formPercent}
                    onChange={(e) => setFormPercent(Number(e.target.value))}
                    className="w-full h-2 rounded-lg cursor-pointer accent-amber-500"
                  />
                  <p className="text-xs opacity-70">
                    Adjust slider to reflect percentage completion of today's planned milestones.
                  </p>
                </div>
              )}

              {/* STEP 4: Manpower */}
              {step === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Worker Muster Breakdown</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Total Workers On Site</label>
                      <input
                        type="number"
                        value={formWorkers}
                        onChange={(e) => setFormWorkers(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                        style={{ borderColor: "var(--role-border)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Certified Welders</label>
                      <input
                        type="number"
                        value={formWelders}
                        onChange={(e) => setFormWelders(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                        style={{ borderColor: "var(--role-border)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Structural Fitters</label>
                      <input
                        type="number"
                        value={formFitters}
                        onChange={(e) => setFormFitters(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                        style={{ borderColor: "var(--role-border)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Riggers & Signalmen</label>
                      <input
                        type="number"
                        value={formRiggers}
                        onChange={(e) => setFormRiggers(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                        style={{ borderColor: "var(--role-border)" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Machines */}
              {step === 5 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Machinery & Cranes</h4>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Primary Equipment Used</label>
                    <input
                      value={formMachine}
                      onChange={(e) => setFormMachine(e.target.value)}
                      placeholder="e.g. Hydra Mobile Crane 25T (ACE)"
                      className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Operating Hours Logged</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formMachineHours}
                      onChange={(e) => setFormMachineHours(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 6: QA/QC */}
              {step === 6 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Quality Assurance & Welding Inspection</h4>
                  <div className="flex gap-2">
                    {(["Passed", "Observation", "Failed"] as const).map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setFormQa(opt)}
                        className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                          formQa === opt
                            ? opt === "Passed"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : opt === "Observation"
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-red-600 text-white border-red-600 shadow-xs"
                            : "bg-white opacity-70"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">QA/QC Weld Test Notes</label>
                    <textarea
                      rows={3}
                      value={formQaNotes}
                      onChange={(e) => setFormQaNotes(e.target.value)}
                      placeholder="NDT / UT testing result observations..."
                      className="w-full p-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 7: Issues */}
              {step === 7 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Shop Floor & Site Issues</h4>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Issue / Bottleneck Title (Optional)</label>
                    <input
                      value={formIssueTitle}
                      onChange={(e) => setFormIssueTitle(e.target.value)}
                      placeholder="e.g. Crane hydraulic hose check or fitment misalignment"
                      className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Severity</label>
                    <div className="flex gap-2">
                      {(["Low", "Medium", "High"] as const).map((sev) => (
                        <button
                          type="button"
                          key={sev}
                          onClick={() => setFormIssueSeverity(sev)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold ${
                            formIssueSeverity === sev
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white opacity-70"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: Requirements */}
              {step === 8 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Consumables & Material Requirements</h4>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Requisition Item</label>
                    <input
                      value={formReqItem}
                      onChange={(e) => setFormReqItem(e.target.value)}
                      placeholder="e.g. Low-Hydrogen Electrodes E7018 250 kg"
                      className="w-full h-10 px-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Urgency Level</label>
                    <div className="flex gap-2">
                      {(["Low", "Medium", "High"] as const).map((urg) => (
                        <button
                          type="button"
                          key={urg}
                          onClick={() => setFormReqUrgency(urg)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold ${
                            formReqUrgency === urg
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-white opacity-70"
                          }`}
                        >
                          {urg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 9: Photos */}
              {step === 9 && (
                <div className="space-y-4 text-center py-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Site Evidence & Photos</h4>
                  <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-muted/20">
                    <Camera className="size-8 opacity-50" />
                    <p className="text-xs font-semibold">2 Inspection Photos Captured</p>
                    <p className="text-[11px] opacity-65">Column splice weld VT & EOT crane hook check recorded.</p>
                  </div>
                </div>
              )}

              {/* STEP 10: Submit */}
              {step === 10 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-75">Safety Declaration & Submission</h4>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Supervisor Safety Sign-off Notes</label>
                    <textarea
                      rows={3}
                      value={formSupervisorNotes}
                      onChange={(e) => setFormSupervisorNotes(e.target.value)}
                      className="w-full p-3 rounded-lg border text-xs bg-white"
                      style={{ borderColor: "var(--role-border)" }}
                    />
                  </div>
                  <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <ShieldCheck className="size-5 shrink-0 text-emerald-600" />
                    <span>I confirm zero near-miss incidents occurred during this shift and all work complies with IS/ASME specs.</span>
                  </div>
                </div>
              )}

              {/* Footer Controls */}
              <div
                className="pt-4 border-t flex items-center justify-between"
                style={{ borderColor: "var(--role-border)" }}
              >
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="px-4 py-2 rounded-lg border text-xs font-semibold disabled:opacity-30 cursor-pointer"
                  style={{ borderColor: "var(--role-border)" }}
                >
                  <ChevronLeft className="size-4 inline mr-1" /> Back
                </button>

                {step < 10 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(10, s + 1))}
                    className="px-5 py-2 rounded-lg text-xs font-bold text-white cursor-pointer shadow-xs"
                    style={{ backgroundColor: "var(--role-primary)" }}
                  >
                    Next <ChevronRight className="size-4 inline ml-1" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg text-xs font-bold text-white cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="size-4 inline mr-1" /> Submit DPR Report
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
