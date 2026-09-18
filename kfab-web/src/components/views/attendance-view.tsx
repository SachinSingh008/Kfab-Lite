"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { WorkerRecord } from "@/lib/mock-data";

interface AttendanceViewProps {
  workers: WorkerRecord[];
  searchTerm: string;
}

export function AttendanceView({ workers, searchTerm }: AttendanceViewProps) {
  const [shiftFilter, setShiftFilter] = useState("ALL");

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift =
      shiftFilter === "ALL" || w.shift.toLowerCase().includes(shiftFilter.toLowerCase());
    return matchesSearch && matchesShift;
  });

  return (
    <div className="space-y-4">
      {/* Header Actions & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase">Shift:</span>
          {["ALL", "General (08:00)", "Shift A", "Shift B"].map((s) => (
            <button
              key={s}
              onClick={() => setShiftFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                shiftFilter === s
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Downloading attendance muster CSV...")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            <Download className="size-3.5" />
            <span>Download Muster (CSV)</span>
          </button>
        </div>
      </div>

      {/* Muster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Emp ID</th>
              <th className="p-3.5">Worker Name</th>
              <th className="p-3.5">Designation</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Supervisor</th>
              <th className="p-3.5">Punch Time</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredWorkers.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-slate-900">{w.id}</td>
                <td className="p-3.5 font-medium text-slate-900">{w.name}</td>
                <td className="p-3.5 text-slate-600">{w.designation}</td>
                <td className="p-3.5 text-slate-600">{w.dept}</td>
                <td className="p-3.5 text-slate-600">{w.supervisor}</td>
                <td className="p-3.5 text-slate-500">{w.time}</td>
                <td className="p-3.5">
                  <StatusBadge
                    label={w.status}
                    tone={w.status === "PRESENT" ? "success" : "danger"}
                  />
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => alert(`Toggled status for ${w.name}`)}
                    className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Edit Today
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
