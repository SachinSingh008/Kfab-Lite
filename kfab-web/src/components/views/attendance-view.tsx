"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Filter,
  Users,
  AlertCircle,
  Plus,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { WorkerRecord } from "@/lib/mock-data";

interface AttendanceViewProps {
  workers: WorkerRecord[];
  searchTerm: string;
}

export function AttendanceView({ workers, searchTerm }: AttendanceViewProps) {
  const [shiftFilter, setShiftFilter] = useState("ALL");
  const [activeDate, setActiveDate] = useState("18 Sep 2026");
  const [localWorkers, setLocalWorkers] = useState<WorkerRecord[]>(workers);

  const filteredWorkers = (localWorkers.length > 0 ? localWorkers : workers).filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift =
      shiftFilter === "ALL" || w.shift.toLowerCase().includes(shiftFilter.toLowerCase());
    return matchesSearch && matchesShift;
  });

  const totalWorkers = filteredWorkers.length;
  const presentCount = filteredWorkers.filter((w) => w.status === "PRESENT").length;
  const absentCount = filteredWorkers.filter((w) => w.status === "ABSENT").length;
  const turnoutRate = totalWorkers > 0 ? ((presentCount / totalWorkers) * 100).toFixed(1) : "0.0";

  const toggleWorkerStatus = (id: string) => {
    setLocalWorkers((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const nextStatus = w.status === "PRESENT" ? "ABSENT" : "PRESENT";
          return {
            ...w,
            status: nextStatus,
            time: nextStatus === "PRESENT" ? "08:15 AM" : "-",
          };
        }
        return w;
      })
    );
  };

  const handleExportCSV = () => {
    const headers = "Employee ID,Name,Designation,Department,Supervisor,Punch Time,Status\n";
    const rows = filteredWorkers
      .map((w) => `"${w.id}","${w.name}","${w.designation}","${w.dept}","${w.supervisor}","${w.time}","${w.status}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `KFAB_Muster_${activeDate.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Date-Lock Banner */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#0F172A]">
              Daily Muster Roll & Shift Register
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
              <ShieldCheck className="size-3" />
              Active Day Locked at 23:59 IST
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Jejuri Fabrication Yard • Departmental biometric and supervisor verified muster attendance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#BFDBFE] text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="size-3.5 text-[#2563EB]" />
            <span>Export Muster Sheet (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Mini KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase">Roster Strength</p>
          <p className="text-xl font-black text-[#172033] mt-1">{totalWorkers} Personnel</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#16A34A] uppercase">Present on Duty</p>
          <p className="text-xl font-black text-[#16A34A] mt-1">{presentCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#DC2626] uppercase">Absent / Off-Duty</p>
          <p className="text-xl font-black text-[#DC2626] mt-1">{absentCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#2563EB] uppercase">Turnout Percentage</p>
          <p className="text-xl font-black text-[#2563EB] mt-1">{turnoutRate}%</p>
        </div>
      </div>

      {/* 3. Shift Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#172033] flex items-center gap-1">
            <Filter className="size-3.5 text-[#2563EB]" />
            Shift:
          </span>
          {["ALL", "General (08:00)", "Shift A (Morning)", "Shift B (Evening)"].map((s) => (
            <button
              key={s}
              onClick={() => setShiftFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                shiftFilter === s
                  ? "bg-[#0F172A] text-white shadow-2xs"
                  : "bg-[#F4F7FC] text-[#64748B] hover:bg-[#E8F1FF] hover:text-[#0F172A]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Muster Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-kfab overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Emp ID</th>
                <th className="p-3.5">Worker Name</th>
                <th className="p-3.5">Trade & Skill</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Supervisor</th>
                <th className="p-3.5">Punch Time</th>
                <th className="p-3.5">Muster Status</th>
                <th className="p-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[#172033]">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="size-8 text-[#CBD5E1] mb-2" />
                      <p className="text-xs font-bold text-[#172033]">No Personnel Records Found</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Add employees to the Workforce Directory or adjust your filter parameters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#0F172A]">{w.id}</td>
                    <td className="p-3.5 font-bold text-[#172033]">{w.name}</td>
                    <td className="p-3.5 text-[#64748B]">{w.designation}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-medium text-[11px]">
                        {w.dept}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#64748B]">{w.supervisor}</td>
                    <td className="p-3.5 text-[#64748B] font-mono">{w.time}</td>
                    <td className="p-3.5">
                      <StatusBadge
                        label={w.status}
                        tone={w.status === "PRESENT" ? "success" : "danger"}
                      />
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => toggleWorkerStatus(w.id)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          w.status === "PRESENT"
                            ? "bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border-[#FECACA]"
                            : "bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#16A34A] border-[#BBF7D0]"
                        }`}
                      >
                        Mark {w.status === "PRESENT" ? "Absent" : "Present"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
