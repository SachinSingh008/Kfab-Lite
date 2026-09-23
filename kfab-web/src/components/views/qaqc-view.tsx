"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Search, FileCheck } from "lucide-react";
import { QaqcRecord, INITIAL_QAQC } from "@/lib/mock-data";

export function QaqcView({ records = INITIAL_QAQC }: { records?: QaqcRecord[] }) {
  const [search, setSearch] = useState("");

  const filtered = records.filter((r) =>
    `${r.code} ${r.project} ${r.component} ${r.testType} ${r.standard} ${r.inspector}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const passedCount = records.filter((r) => r.result === "Passed").length;
  const passRate = Math.round((passedCount / Math.max(1, records.length)) * 100);

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Weld Inspection Pass Rate</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{passRate}%</p>
          <p className="text-xs opacity-70 mt-0.5">{passedCount} tests approved</p>
        </div>
        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Open Observations / Holds</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {records.filter((r) => r.result === "Observation").length} Holds
          </p>
          <p className="text-xs opacity-70 mt-0.5">Radiography root pass review</p>
        </div>
        <div
          className="rounded-xl border p-4 shadow-xs"
          style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Testing Standards</p>
          <p className="text-2xl font-black mt-1" style={{ color: "var(--role-header-title)" }}>
            AWS & ASME
          </p>
          <p className="text-xs opacity-70 mt-0.5">AWS D1.1 / ASME Sec IX / IS 800</p>
        </div>
      </div>

      {/* Search Header */}
      <div
        className="flex items-center justify-between rounded-xl border p-3 shadow-xs"
        style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-card-bg)" }}
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QA records, weld joints, tests..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border text-xs focus:outline-none"
            style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-content-bg)" }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {filtered.map((r) => (
          <div
            key={r.code}
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
                  {r.code}
                </span>
                <h4 className="mt-2 text-sm font-bold" style={{ color: "var(--role-header-title)" }}>
                  {r.component}
                </h4>
                <p className="text-xs opacity-70">Project: {r.project}</p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  r.result === "Passed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {r.result === "Passed" ? "🟢 Passed" : "🟡 Observation"}
              </span>
            </div>

            <div
              className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-content-bg)" }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase opacity-60">Test Type:</span>
                <p className="font-bold mt-0.5">{r.testType}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase opacity-60">Standard:</span>
                <p className="font-bold mt-0.5">{r.standard}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs opacity-75 pt-2 border-t" style={{ borderColor: "var(--role-border)" }}>
              <span>Inspector: <strong>{r.inspector}</strong></span>
              <span>Date: {r.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
