"use client";

import React from "react";
import {
  X,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
  Building2,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { ApiEmployeeDTO } from "@/lib/api-client";

interface CreateUserModalProps {
  showModal: boolean;
  onClose: () => void;
  createStep: number;
  setCreateStep: (step: number) => void;
  isSubmitting: boolean;
  handleCreateSubmit: (e: React.FormEvent) => Promise<void>;

  createFullName: string;
  setCreateFullName: (val: string) => void;
  createUsername: string;
  setCreateUsername: (val: string) => void;
  createEmail: string;
  setCreateEmail: (val: string) => void;
  createEmployeeId: string;
  setCreateEmployeeId: (val: string) => void;
  createDepartment: string;
  setCreateDepartment: (val: string) => void;
  createDesignation: string;
  setCreateDesignation: (val: string) => void;
  createRole: string;
  setCreateRole: (val: string) => void;
  createPassword: string;
  setCreatePassword: (val: string) => void;
  createStatus: string;
  setCreateStatus: (val: string) => void;
  createForceReset: boolean;
  setCreateForceReset: (val: boolean) => void;
  showCreatePassword: boolean;
  setShowCreatePassword: (val: boolean) => void;
  createConfirmed: boolean;
  setCreateConfirmed: (val: boolean) => void;
  generateRandomPassword: () => void;
  employees: ApiEmployeeDTO[];
}

export function CreateUserModal({
  showModal,
  onClose,
  createStep,
  setCreateStep,
  isSubmitting,
  handleCreateSubmit,

  createFullName,
  setCreateFullName,
  createUsername,
  setCreateUsername,
  createEmail,
  setCreateEmail,
  createEmployeeId,
  setCreateEmployeeId,
  createDepartment,
  setCreateDepartment,
  createDesignation,
  setCreateDesignation,
  createRole,
  setCreateRole,
  createPassword,
  setCreatePassword,
  createStatus,
  setCreateStatus,
  createForceReset,
  setCreateForceReset,
  showCreatePassword,
  setShowCreatePassword,
  createConfirmed,
  setCreateConfirmed,
  generateRandomPassword,
  employees,
}: CreateUserModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <UserPlus className="size-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Enterprise User Provisioning</h4>
              <p className="text-[11px] text-slate-300">
                Step {createStep} of 6 &bull;{" "}
                {createStep === 1
                  ? "Identity & Full Legal Name"
                  : createStep === 2
                  ? "Email & Unique Identifier"
                  : createStep === 3
                  ? "Department & Employee Link"
                  : createStep === 4
                  ? "RBAC Role Assignment"
                  : createStep === 5
                  ? "Credentials & Lifecycle"
                  : "Review & Provision"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="grid grid-cols-6 h-1 bg-slate-100">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`h-full transition-all duration-300 ${
                s <= createStep ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* STEP 1: Full Name */}
          {createStep === 1 && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                Enter the full legal identity of the employee or stakeholder to be granted ERP system access.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh K. Shinde"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 2: Email & Username */}
          {createStep === 2 && (
            <div className="space-y-4 animate-in fade-in-50">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Corporate Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@kfab.in"
                  value={createEmail}
                  onChange={(e) => {
                    setCreateEmail(e.target.value);
                    if (!createUsername) setCreateUsername(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Identifier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh.shinde"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Department & Employee */}
          {createStep === 3 && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Fabrication"
                    value={createDepartment}
                    onChange={(e) => setCreateDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Floor Supervisor"
                    value={createDesignation}
                    onChange={(e) => setCreateDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link to Employee Record (Optional)</label>
                <select
                  value={createEmployeeId}
                  onChange={(e) => setCreateEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="">-- No Employee Linked --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} &bull; {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: RBAC Role Assignment */}
          {createStep === 4 && (
            <div className="space-y-3 animate-in fade-in-50">
              <label className="block text-xs font-bold text-slate-700">Assign System Role</label>
              {[
                {
                  role: "SUPERVISOR",
                  name: "Supervisor",
                  desc: "Shop-floor operations, workforce attendance marking, and material consumption entries.",
                },
                {
                  role: "ACCOUNTANT",
                  name: "Accountant",
                  desc: "Material inward entries, vendor purchase bills, payroll summaries, and reports.",
                },
                {
                  role: "ADMIN",
                  name: "Plant Administrator",
                  desc: "Plant-wide operations, master data, user profile editing, and operational dashboards.",
                },
                {
                  role: "SUPER_ADMIN",
                  name: "Super Administrator",
                  desc: "Full administrative authority across all modules, security auditing, and system credentials.",
                },
              ].map((item) => (
                <div
                  key={item.role}
                  onClick={() => setCreateRole(item.role)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    createRole === item.role
                      ? "border-blue-600 bg-blue-50/70 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{item.name}</span>
                    <input
                      type="radio"
                      name="role_radio"
                      checked={createRole === item.role}
                      onChange={() => setCreateRole(item.role)}
                      className="text-blue-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* STEP 5: Password & Security */}
          {createStep === 5 && (
            <div className="space-y-4 animate-in fade-in-50">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Initial Temporary Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    required
                    placeholder="Minimum 8 characters"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showCreatePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForceReset}
                    onChange={(e) => setCreateForceReset(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">Force password change on initial login</span>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <label className="text-xs font-bold text-slate-700">Initial Account Status:</label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Final Confirmation */}
          {createStep === 6 && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{createFullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-900">{createEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono text-slate-900">{createUsername}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-bold text-blue-700">{createRole}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-medium text-slate-900">{createDepartment || "General Plant"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700">{createStatus}</span>
                </div>
              </div>

              <label className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={createConfirmed}
                  onChange={(e) => setCreateConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-amber-900 font-medium">
                  I confirm this user profile is accurate and authorize provisioning their access credentials directly to the live database.
                </span>
              </label>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {createStep > 1 ? (
              <button
                type="button"
                onClick={() => setCreateStep(createStep - 1)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            {createStep < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (createStep === 1 && !createFullName.trim()) return;
                  if (createStep === 2 && (!createEmail.trim() || !createUsername.trim())) return;
                  if (createStep === 5 && createPassword.length < 8) return;
                  setCreateStep(createStep + 1);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !createConfirmed}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="size-4" />
                <span>{isSubmitting ? "Provisioning..." : "Provision User"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
