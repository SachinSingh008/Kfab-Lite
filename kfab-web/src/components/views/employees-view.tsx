"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Award,
  Phone,
  HardHat,
  ShieldCheck,
  Building2,
  Inbox,
  ArrowRight,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { WorkerRecord } from "@/lib/mock-data";

interface EmployeesViewProps {
  workers: WorkerRecord[];
  searchTerm: string;
}

const DEFAULT_PERSONNEL: (WorkerRecord & { certification?: string; phone?: string })[] = [
  {
    id: "KF-0101",
    name: "Ramesh Sharma",
    designation: "Welder Grade 1",
    dept: "Fabrication Bay 1",
    shift: "General (08:00)",
    status: "PRESENT",
    time: "08:04 AM",
    supervisor: "Ajay Verma",
    certification: "6G ASME Sec IX",
    phone: "+91 98234 11001",
  },
  {
    id: "KF-0102",
    name: "Sunil Kumar",
    designation: "Senior Fitter",
    dept: "Assembly Bay 2",
    shift: "General (08:00)",
    status: "PRESENT",
    time: "08:12 AM",
    supervisor: "Ajay Verma",
    certification: "Heavy Structural",
    phone: "+91 98234 11002",
  },
  {
    id: "KF-0103",
    name: "Mahesh Yadav",
    designation: "CNC Plasma Operator",
    dept: "Machine Shop",
    shift: "General (08:00)",
    status: "PRESENT",
    time: "07:55 AM",
    supervisor: "Prakash Patel",
    certification: "CNC G-Code / CAD",
    phone: "+91 98234 11003",
  },
  {
    id: "KF-0104",
    name: "Vikram Singh",
    designation: "Welder Grade 2",
    dept: "Fabrication Bay 3",
    shift: "General (08:00)",
    status: "ABSENT",
    time: "-",
    supervisor: "Ajay Verma",
    certification: "4G SAW Certified",
    phone: "+91 98234 11004",
  },
  {
    id: "KF-0105",
    name: "Deepak Rawat",
    designation: "Grinder & Quality Inspector",
    dept: "Finishing Bay 4",
    shift: "General (08:00)",
    status: "PRESENT",
    time: "08:00 AM",
    supervisor: "Prakash Patel",
    certification: "NDT Level II (DPT)",
    phone: "+91 98234 11005",
  },
  {
    id: "KF-0106",
    name: "Amit Tiwari",
    designation: "Senior Rigger & Crane Operator",
    dept: "Yard & Heavy Logistics",
    shift: "General (08:00)",
    status: "PRESENT",
    time: "08:18 AM",
    supervisor: "Ajay Verma",
    certification: "Heavy Crane 50T",
    phone: "+91 98234 11006",
  },
];

export function EmployeesView({ workers, searchTerm }: EmployeesViewProps) {
  const [personnelList, setPersonnelList] = useState(
    workers.length > 0 ? workers : DEFAULT_PERSONNEL
  );
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Employee Form State
  const [newName, setNewName] = useState("");
  const [newDesignation, setNewDesignation] = useState("Welder Grade 1");
  const [newDept, setNewDept] = useState("Fabrication Bay 1");
  const [newSupervisor, setNewSupervisor] = useState("Ajay Verma");
  const [newCert, setNewCert] = useState("3G / 4G Certified");
  const [newPhone, setNewPhone] = useState("+91 ");

  const departments = [
    "ALL",
    "Fabrication Bay 1",
    "Assembly Bay 2",
    "Machine Shop",
    "Finishing Bay 4",
    "Yard & Heavy Logistics",
  ];

  const filtered = personnelList.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "ALL" || w.dept === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newWorker = {
      id: `KF-0${personnelList.length + 107}`,
      name: newName.trim(),
      designation: newDesignation,
      dept: newDept,
      shift: "General (08:00)",
      status: "PRESENT" as const,
      time: "08:00 AM",
      supervisor: newSupervisor,
      certification: newCert,
      phone: newPhone,
    };

    setPersonnelList([newWorker, ...personnelList]);
    setShowAddModal(false);
    setNewName("");
  };

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-[#0F172A]">
              Workforce Roster & Trade Skill Directory
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F1FF] text-[#0F172A] border border-[#BFDBFE]">
              Active Yard Directory
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage fabricators, certified welders (3G/4G/6G), fitters, CNC machinists, and yard crane operators
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-4" />
            <span>+ Add Personnel</span>
          </button>
        </div>
      </div>

      {/* 2. Workforce Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#64748B] uppercase">Registered Workforce</p>
          <p className="text-xl font-black text-[#172033] mt-1">{personnelList.length} Technicians</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#16A34A] uppercase">Active on Duty</p>
          <p className="text-xl font-black text-[#16A34A] mt-1">
            {personnelList.filter((p) => p.status === "PRESENT").length} Present
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#2563EB] uppercase">Certified Welders</p>
          <p className="text-xl font-black text-[#2563EB] mt-1">
            {personnelList.filter((p) => p.designation.includes("Welder")).length} ASME IX
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs">
          <p className="text-[11px] font-bold text-[#0F172A] uppercase">Safety Compliance</p>
          <p className="text-xl font-black text-[#0F172A] mt-1">100% PPE Verified</p>
        </div>
      </div>

      {/* 3. Department Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-[#172033] mr-1 flex items-center gap-1">
            <Filter className="size-3.5 text-[#2563EB]" />
            Department:
          </span>
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDept === d
                  ? "bg-[#0F172A] text-white shadow-2xs"
                  : "bg-[#F4F7FC] text-[#64748B] hover:bg-[#E8F1FF] hover:text-[#0F172A]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab hover:shadow-kfab-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold text-[#0F172A] uppercase">
                    {w.id}
                  </span>
                  <h4 className="text-base font-black text-[#172033] mt-0.5">{w.name}</h4>
                  <p className="text-xs font-semibold text-[#2563EB]">{w.designation}</p>
                </div>
                <StatusBadge
                  label={w.status === "PRESENT" ? "ON DUTY" : "OFF DUTY"}
                  tone={w.status === "PRESENT" ? "success" : "danger"}
                />
              </div>

              {/* Skill Certification Tag */}
              {(w as any).certification && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold border border-[#FDE68A]">
                  <Award className="size-3" />
                  <span>{(w as any).certification}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-xs space-y-1.5 text-[#64748B]">
              <div className="flex items-center justify-between">
                <span>Fabrication Bay:</span>
                <strong className="text-[#172033]">{w.dept}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Reporting Supervisor:</span>
                <strong className="text-[#172033]">{w.supervisor}</strong>
              </div>
              {(w as any).phone && (
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>Emergency Phone:</span>
                  <span className="text-[#2563EB] font-bold flex items-center gap-1">
                    <Phone className="size-3" />
                    {(w as any).phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#0F172A]">
                <HardHat className="size-5 text-[#2563EB]" />
                <h3 className="text-base font-black text-[#172033]">
                  Register New Workforce Personnel
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#172033]">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Shinde"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-xl mt-1 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#172033]">Trade / Role *</label>
                  <select
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-xl mt-1 bg-[#F8FAFC]"
                  >
                    <option value="Welder Grade 1">Welder Grade 1</option>
                    <option value="Senior Fitter">Senior Fitter</option>
                    <option value="CNC Operator">CNC Operator</option>
                    <option value="Shot Blaster">Shot Blaster</option>
                    <option value="Industrial Painter">Industrial Painter</option>
                    <option value="Rigger">Rigger & Crane Driver</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#172033]">Shop Floor Bay *</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-xl mt-1 bg-[#F8FAFC]"
                  >
                    <option value="Fabrication Bay 1">Fabrication Bay 1</option>
                    <option value="Assembly Bay 2">Assembly Bay 2</option>
                    <option value="Machine Shop">Machine Shop</option>
                    <option value="Finishing Bay 4">Finishing Bay 4</option>
                    <option value="Yard & Heavy Logistics">Yard Logistics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#172033]">Certification</label>
                  <input
                    type="text"
                    placeholder="e.g. 6G ASME Sec IX"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-xl mt-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#172033]">Supervisor</label>
                  <input
                    type="text"
                    value={newSupervisor}
                    onChange={(e) => setNewSupervisor(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-xl mt-1 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#172033]">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98XXX XXXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#CBD5E1] rounded-xl mt-1 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
