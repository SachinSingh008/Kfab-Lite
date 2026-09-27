"use client";

import React, { useState } from "react";
import { Wrench, CheckCircle2, AlertTriangle, Clock, Calendar, Search } from "lucide-react";
import { MachineRecord } from "@/lib/mock-data";

export function MachinesView({ machines = [] }: { machines?: MachineRecord[] }) {
  const [search, setSearch] = useState("");

  const filtered = machines.filter((m) =>
    `${m.code} ${m.name} ${m.make} ${m.operator}`.toLowerCase().includes(search.toLowerCase())
  );

  const operationalCount = machines.filter((m) => m.status === "Operational").length;

  return (
    <div className="space-y-4">
      {/* Metrics strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total Machinery</p>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--role-header-title)" }}>
            {machines.length} Units
          </p>
          <p className="text-xs opacity-70 mt-0.5">Overhead Cranes, Plasma & SAW</p>
        </div>
        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Operational Uptime</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {machines.length > 0 ? Math.round((operationalCount / machines.length) * 100) : 0}%
          </p>
          <p className="text-xs opacity-70 mt-0.5">{operationalCount} Active Units</p>
        </div>
        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Under Maintenance</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {machines.length - operationalCount} Unit
          </p>
          <p className="text-xs opacity-70 mt-0.5">Scheduled preventive service</p>
        </div>
      </div>

      {/* Search */}
      <div
        className="flex items-center justify-between rounded-xl border p-3 shadow-xs"
        style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cranes, machines, operators..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border text-xs focus:outline-none"
            style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-content-bg)" }}
          />
        </div>
      </div>

      {/* Grid of machines */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <div
            key={m.code}
            className="rounded-xl border p-5 shadow-xs space-y-3"
            style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="font-mono text-xs font-bold px-2 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: "var(--role-badge-bg)",
                    color: "var(--role-badge-text)",
                    borderColor: "var(--role-border)",
                  }}
                >
                  {m.code}
                </span>
                <h4 className="mt-2 text-sm font-bold" style={{ color: "var(--role-header-title)" }}>
                  {m.name}
                </h4>
                <p className="text-xs opacity-70">{m.make}</p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  m.status === "Operational"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {m.status}
              </span>
            </div>

            <div
              className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-content-bg)" }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase opacity-60">Run Hours Today:</span>
                <p className="font-bold mt-0.5">{m.runningHrsToday} hrs</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase opacity-60">Rated Capacity:</span>
                <p className="font-bold mt-0.5">{m.capacity}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs opacity-75 pt-2 border-t" style={{ borderColor: "var(--role-border)" }}>
              <span>Operator: <strong>{m.operator}</strong></span>
              <span className="text-[11px]">Next: {m.nextService}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
