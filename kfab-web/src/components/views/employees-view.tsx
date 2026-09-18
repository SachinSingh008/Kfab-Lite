"use client";

import React from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { WorkerRecord } from "@/lib/mock-data";

interface EmployeesViewProps {
  workers: WorkerRecord[];
  searchTerm: string;
}

export function EmployeesView({ workers, searchTerm }: EmployeesViewProps) {
  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Workforce & Personnel Roster</h3>
          <p className="text-xs text-slate-500">
            {workers.length} Active Welders, Fitters, Operators & Technicians
          </p>
        </div>
        <button
          onClick={() => alert("Opening Add Employee Dialog")}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          + Add New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((w) => (
          <div
            key={w.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase">{w.id}</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{w.name}</h4>
                <p className="text-xs text-slate-600">{w.designation}</p>
              </div>
              <StatusBadge label="ACTIVE" tone="success" />
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-500">
              <p>
                <span className="font-semibold text-slate-700">Dept:</span> {w.dept}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Supervisor:</span> {w.supervisor}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
