"use client";

import React, { useState } from "react";
import {
  Layers,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Users,
  Boxes,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { SupervisorProjectSection, DashboardIssue, SupervisorActionItem } from "./dashboard-types";

interface DashboardSupervisorViewProps {
  supervisorSections: SupervisorProjectSection[];
  actionList: SupervisorActionItem[];
  issues: DashboardIssue[];
  onCreateIssue: (issue: { projectId: string; title: string; description: string; priority: any; category: string }) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onOpenProject: (projectId: string) => void;
}

export function DashboardSupervisorView({
  supervisorSections,
  actionList,
  issues,
  onCreateIssue,
  onNavigateTab,
  onOpenProject,
}: DashboardSupervisorViewProps) {
  const [searchProject, setSearchProject] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Raise Issue Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(supervisorSections[0]?.projectId || "");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issuePriority, setIssuePriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [issueCategory, setIssueCategory] = useState("Shop Floor Bottleneck");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProjects = supervisorSections
    .filter((p) => {
      const matchSearch =
        p.projectName.toLowerCase().includes(searchProject.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchProject.toLowerCase());
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      // Sort delayed projects first
      if (a.isDelayed && !b.isDelayed) return -1;
      if (!a.isDelayed && b.isDelayed) return 1;
      return b.delayDays - a.delayDays;
    });

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !selectedProjectId) return;
    setIsSubmitting(true);
    try {
      await onCreateIssue({
        projectId: selectedProjectId,
        title: issueTitle.trim(),
        description: issueDescription.trim() || "No additional description provided",
        priority: issuePriority,
        category: issueCategory,
      });
      setShowIssueModal(false);
      setIssueTitle("");
      setIssueDescription("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Supervisor Action List (Practical Alerts & Priorities) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0F172A]">
                Supervisor Action List & Critical Shop Alerts
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Immediate attention items: delayed jobs, low reorder levels, overdue tools
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#DC2626] bg-[#FEE2E2] px-2.5 py-0.5 rounded-full">
            {actionList.length} Action Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {actionList.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onNavigateTab(item.linkTab)}
              className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 transition-all cursor-pointer flex items-start justify-between gap-3 group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${
                      item.severity === "CRITICAL"
                        ? "bg-[#DC2626]"
                        : item.severity === "HIGH"
                        ? "bg-[#EA580C]"
                        : "bg-[#D97706]"
                    }`}
                  />
                  <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] pl-3.5">{item.subtitle}</p>
              </div>
              <ArrowRight className="size-3.5 text-[#94A3B8] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Vertically Scrollable Scoped Project Sections */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                <Layers className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]">
                  Assigned Project Sections (Vertical Browser)
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Detailed breakdown of assigned jobs, delayed stages, and work bay workforce
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchProject}
              onChange={(e) => setSearchProject(e.target.value)}
              placeholder="Search assigned projects..."
              className="px-3 py-1 text-xs rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] focus:outline-none w-44"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-[#CBD5E1] rounded-lg px-2.5 py-1 bg-[#F8FAFC] font-bold text-[#0F172A] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DELAYED">Delayed</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Stacked Project Cards */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-[#64748B]">
              No assigned projects match the selected filter.
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isExpanded = expandedProjects[p.projectId] !== false; // Default expanded

              return (
                <div
                  key={p.projectId}
                  className={`rounded-xl border transition-all ${
                    p.isDelayed
                      ? "border-[#FECACA] bg-[#FEF2F2]/20"
                      : "border-[#E2E8F0] bg-white"
                  }`}
                >
                  {/* Card Header / Summary Row */}
                  <div
                    onClick={() => toggleExpand(p.projectId)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 rounded-t-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                          p.isDelayed ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#E0F2FE] text-[#0284C7]"
                        }`}
                      >
                        <Layers className="size-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-[#0F172A]">{p.projectName}</h4>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              p.isDelayed
                                ? "bg-[#FEE2E2] text-[#DC2626]"
                                : "bg-[#DCFCE7] text-[#16A34A]"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          Customer: {p.customerName} • Target Completion: {p.endDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end md:self-auto">
                      <div className="text-right">
                        <span className="text-sm font-black text-[#0F172A]">{p.progressPercent}%</span>
                        <span className="text-[10px] text-[#64748B] block">Actual Completed</span>
                      </div>
                      {p.isDelayed ? (
                        <span className="text-xs font-bold text-[#DC2626] bg-[#FEE2E2] px-2 py-1 rounded">
                          +{p.delayDays}d Overdue
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-1 rounded">
                          On Track
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="size-4 text-[#64748B]" /> : <ChevronDown className="size-4 text-[#64748B]" />}
                    </div>
                  </div>

                  {/* Expanded Project Details */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#F1F5F9] space-y-4 text-xs">
                      {/* Operational Telemetry Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                        <div>
                          <span className="text-[#64748B] block text-[10px] font-bold">Assigned Workers</span>
                          <span className="text-sm font-black text-[#0F172A]">{p.workforceCount} Persons</span>
                          <button
                            onClick={() => onNavigateTab("attendance")}
                            className="text-[10px] text-[#0284C7] hover:underline font-bold block mt-0.5 cursor-pointer"
                          >
                            View Muster & Shifts →
                          </button>
                        </div>
                        <div>
                          <span className="text-[#64748B] block text-[10px] font-bold">Material Issued</span>
                          <span className="text-sm font-black text-[#0F172A]">₹{p.materialUsageCost.toLocaleString()}</span>
                          <button
                            onClick={() => onNavigateTab("inventory")}
                            className="text-[10px] text-[#0284C7] hover:underline font-bold block mt-0.5 cursor-pointer"
                          >
                            Inspect Issues →
                          </button>
                        </div>
                        <div>
                          <span className="text-[#64748B] block text-[10px] font-bold">Shop Open Issues</span>
                          <span className="text-sm font-black text-[#DC2626]">{p.openIssuesCount} Bottlenecks</span>
                          <span className="text-[10px] text-[#64748B] block mt-0.5">Pending Resolution</span>
                        </div>
                        <div className="flex flex-col justify-center">
                          <button
                            onClick={() => onOpenProject(p.projectId)}
                            className="px-3 py-1.5 rounded-lg bg-[#0F172A] text-white font-bold text-xs hover:bg-[#1E293B] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Open Stage Report</span>
                            <ExternalLink className="size-3" />
                          </button>
                        </div>
                      </div>

                      {/* Project Open Issues List */}
                      {p.issues.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="font-bold text-[#0F172A] text-xs">Active Issues on this Job:</span>
                          <div className="space-y-1.5">
                            {p.issues.map((iss) => (
                              <div
                                key={iss.id}
                                className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-[#0F172A]">{iss.title}</span>
                                  <p className="text-[11px] text-[#64748B] mt-0.5">{iss.description}</p>
                                </div>
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                    iss.priority === "CRITICAL"
                                      ? "bg-[#FEE2E2] text-[#DC2626]"
                                      : iss.priority === "HIGH"
                                      ? "bg-[#FEF3C7] text-[#D97706]"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {iss.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Problems & Raised Issues Section with "Raise New Issue" Button */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-sm font-black text-[#0F172A]">
              Problems & Raised Issues Tracker
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Direct supervisor submission for material delays, crane breakdowns, and welder shortages
            </p>
          </div>
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Raise New Issue</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {issues.map((iss) => (
            <div
              key={iss.id}
              className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-2 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#64748B]">{iss.code}</span>
                  <h4 className="font-bold text-[#0F172A] text-xs mt-0.5">{iss.title}</h4>
                  <span className="text-[11px] text-[#0284C7] font-semibold">{iss.projectName}</span>
                </div>
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    iss.priority === "CRITICAL"
                      ? "bg-[#FEE2E2] text-[#DC2626]"
                      : iss.priority === "HIGH"
                      ? "bg-[#FEF3C7] text-[#D97706]"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {iss.priority}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">{iss.description}</p>
              <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0] text-[10px] text-[#64748B]">
                <span>Reported by: <strong>{iss.reportedBy}</strong></span>
                <span className="font-mono">Target: {iss.targetDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Raise Issue Modal Form */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <AlertOctagon className="size-4 text-[#DC2626]" />
                <h3 className="text-sm font-black text-[#0F172A]">Raise Plant Floor Issue</h3>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Target Project *</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white font-medium focus:outline-none"
                  required
                >
                  {supervisorSections.map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g. Crane breakdown in Bay 2, Electrode delay..."
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white font-medium focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Category</label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white font-medium focus:outline-none"
                >
                  <option value="Shop Floor Bottleneck">Shop Floor Bottleneck</option>
                  <option value="Material Shortage">Material Shortage</option>
                  <option value="Machine Breakdown">Machine Breakdown</option>
                  <option value="QA/QC Inspection Delay">QA/QC Inspection Delay</option>
                  <option value="Manpower Shortage">Manpower Shortage</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Severity Priority</label>
                <select
                  value={issuePriority}
                  onChange={(e) => setIssuePriority(e.target.value as any)}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white font-medium focus:outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical (Immediate Stop)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Description</label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe problem details, impacted work bay, and needed assistance..."
                  rows={3}
                  className="w-full p-2 border border-[#CBD5E1] rounded-lg bg-white font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#DC2626] text-white font-bold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Issue Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
