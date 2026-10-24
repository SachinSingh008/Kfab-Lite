"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Camera,
  Check,
} from "lucide-react";
import { DailyReportRecord } from "@/lib/mock-data";

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

interface DailyReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: DailyReportRecord) => void;
  reportCount: number;
}

export function DailyReportsModal({
  isOpen,
  onClose,
  onSubmit,
  reportCount,
}: DailyReportsModalProps) {
  const [step, setStep] = useState(1);

  // Form State
  const [formProject, setFormProject] = useState("KFAB-PRJ-001 (Chakan Plant)");
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

  if (!isOpen) return null;

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: DailyReportRecord = {
      code: `DR-2026-${String(reportCount + 13).padStart(4, "0")}`,
      project: formProject,
      date: formDate,
      shift: formShift,
      planned: formWorkPlanned || "Fabrication and structural fit-up",
      completed: formWorkCompleted || "Milestones completed as per schedule",
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

    onSubmit(newReport);
    onClose();
    setStep(1);
  };

  return (
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
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
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
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0 transition-colors cursor-pointer ${
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
        <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
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
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
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
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer ${
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
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer ${
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
                  placeholder="Confirm zero safety violations during shift..."
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
  );
}
