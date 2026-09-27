"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Layers,
  Search,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { ProductionLogRecord } from "@/lib/mock-data";

interface ProductionViewProps {
  logs?: ProductionLogRecord[];
}

function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 7,
  color = "#EAB308",
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-15 text-slate-400"
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-black" style={{ color }}>
        {progress}%
      </span>
    </div>
  );
}

export function ProductionView({ logs = [] }: ProductionViewProps) {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const totalPlannedMT = logs.reduce((s, r) => s + (r.plannedMT || 0), 0);
  const totalCompletedMT = logs.reduce((s, r) => s + (r.completedMT || 0), 0);
  const totalScrapMT = logs.reduce((s, r) => s + (r.scrapMT || 0), 0);
  const avgEfficiency = Math.round((totalCompletedMT / Math.max(1, totalPlannedMT)) * 100);

  return (
    <div className="space-y-4">
      {/* 1. Production Command Center Circular Metrics Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ring 1: Today's Output */}
        <div
          className="flex items-center justify-between rounded-xl border p-5 shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Output Today</p>
            <p className="text-2xl font-black mt-1" style={{ color: "var(--role-header-title)" }}>
              {totalCompletedMT.toFixed(1)} MT
            </p>
            <p className="text-xs opacity-70 mt-0.5">Planned: {totalPlannedMT.toFixed(1)} MT</p>
          </div>
          <ProgressRing
            progress={avgEfficiency}
            color={avgEfficiency >= 90 ? "#10B981" : "#EAB308"}
          />
        </div>

        {/* Ring 2: Shop Efficiency */}
        <div
          className="flex items-center justify-between rounded-xl border p-5 shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Shop Efficiency</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{avgEfficiency}%</p>
            <p className="text-xs opacity-70 mt-0.5">Target benchmark: 85%</p>
          </div>
          <ProgressRing progress={avgEfficiency} color="#10B981" />
        </div>

        {/* Ring 3: Machine Runtime */}
        <div
          className="flex items-center justify-between rounded-xl border p-5 shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Machine Runtime</p>
            <p className="text-2xl font-black text-blue-600 mt-1">86%</p>
            <p className="text-xs opacity-70 mt-0.5">Plasma & SAW operational</p>
          </div>
          <ProgressRing progress={86} color="#3B82F6" />
        </div>

        {/* Ring 4: Scrap / Yield Rate */}
        <div
          className="flex items-center justify-between rounded-xl border p-5 shadow-xs"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-card-bg)",
          }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Scrap Rate</p>
            <p className="text-2xl font-black mt-1" style={{ color: "var(--role-header-title)" }}>
              {totalScrapMT.toFixed(2)} MT
            </p>
            <p className="text-xs text-emerald-600 font-bold mt-0.5">2.4% (Below 4% limit)</p>
          </div>
          <ProgressRing progress={24} color="#F59E0B" />
        </div>
      </div>

      {/* 2. Section Header & View Toggle */}
      <div
        className="flex items-center justify-between rounded-xl border p-3 shadow-xs"
        style={{
          borderColor: "var(--role-border)",
          backgroundColor: "var(--role-card-bg)",
        }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--role-header-title)" }}>
            Fabrication Bays & Shift Execution
          </h3>
          <p className="text-xs opacity-70">Real-time tonnage output, supervisor muster, and scrap telemetry</p>
        </div>
        <div
          className="inline-flex rounded-lg border p-0.5"
          style={{
            borderColor: "var(--role-border)",
            backgroundColor: "var(--role-content-bg)",
          }}
        >
          {(["cards", "table"] as const).map((m) => (
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

      {/* 3. Cards View */}
      {viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {logs.map((log) => {
            const planned = log.plannedMT || 10;
            const actual = log.completedMT || 8;
            const eff = Math.round((actual / planned) * 100);

            return (
              <div
                key={log.code}
                className="rounded-xl border p-5 shadow-xs space-y-4 hover:shadow-md transition-all"
                style={{
                  borderColor: "var(--role-border)",
                  backgroundColor: "var(--role-card-bg)",
                }}
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
                      {log.code}
                    </span>
                    <h4 className="mt-2 text-base font-bold" style={{ color: "var(--role-header-title)" }}>
                      {log.bay}
                    </h4>
                    <p className="text-xs opacity-70">Project: {log.project}</p>
                  </div>
                  <span
                    className={`font-bold text-xs px-2 py-1 rounded border ${
                      eff >= 90
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {eff}% Efficiency
                  </span>
                </div>

                {/* Planned vs Actual Metrics Strip */}
                <div
                  className="grid grid-cols-3 gap-2 rounded-lg p-3 text-center text-xs border"
                  style={{
                    backgroundColor: "var(--role-content-bg)",
                    borderColor: "var(--role-border)",
                  }}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase opacity-60">Planned</span>
                    <p className="text-sm font-bold mt-0.5">{planned} MT</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase opacity-60">Actual</span>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--role-primary)" }}>
                      {actual} MT
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase opacity-60">Scrap</span>
                    <p className="text-sm font-bold mt-0.5 opacity-80">{log.scrapMT} MT</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="opacity-70">Output Completion</span>
                    <span className="font-bold">{eff}%</span>
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
                        width: `${Math.min(100, eff)}%`,
                        backgroundColor: "var(--role-primary)",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="flex items-center justify-between border-t pt-3 text-xs opacity-75"
                  style={{ borderColor: "var(--role-border)" }}
                >
                  <span>
                    Supervisor: <strong>{log.supervisor}</strong>
                  </span>
                  <span>Shift: {log.shift}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
                  <th className="p-3">Log Code</th>
                  <th className="p-3">Bay Location</th>
                  <th className="p-3">Project</th>
                  <th className="p-3 text-center">Planned MT</th>
                  <th className="p-3 text-center">Actual MT</th>
                  <th className="p-3 text-center">Scrap MT</th>
                  <th className="p-3 text-center">Efficiency</th>
                  <th className="p-3">Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--role-border)" }}>
                {logs.map((r) => (
                  <tr key={r.code} className="hover:opacity-90">
                    <td className="p-3 font-mono font-bold" style={{ color: "var(--role-primary)" }}>
                      {r.code}
                    </td>
                    <td className="p-3 font-semibold">{r.bay}</td>
                    <td className="p-3">{r.project}</td>
                    <td className="p-3 text-center font-semibold">{r.plannedMT} MT</td>
                    <td className="p-3 text-center font-bold" style={{ color: "var(--role-accent)" }}>
                      {r.completedMT} MT
                    </td>
                    <td className="p-3 text-center opacity-75">{r.scrapMT} MT</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{r.efficiency}</td>
                    <td className="p-3">{r.supervisor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
