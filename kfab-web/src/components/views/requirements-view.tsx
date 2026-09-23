"use client";

import React, { useState } from "react";
import { Package, CheckCircle2, Clock, Search, Plus, AlertCircle } from "lucide-react";
import { RequirementRecord, INITIAL_REQUIREMENTS } from "@/lib/mock-data";

export function RequirementsView({ reqs = INITIAL_REQUIREMENTS }: { reqs?: RequirementRecord[] }) {
  const [search, setSearch] = useState("");

  const filtered = reqs.filter((r) =>
    `${r.code} ${r.project} ${r.item} ${r.requestedBy}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
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
            placeholder="Search material requisitions, welding rods, gas..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border text-xs focus:outline-none"
            style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-content-bg)" }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <span
                  className={`ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    r.urgency === "High"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {r.urgency} Urgency
                </span>
                <h4 className="mt-2 text-sm font-bold" style={{ color: "var(--role-header-title)" }}>
                  {r.item}
                </h4>
                <p className="text-xs opacity-70">Project: {r.project}</p>
              </div>
            </div>

            <div
              className="p-2.5 rounded-lg border text-xs space-y-1"
              style={{ borderColor: "var(--role-border)", backgroundColor: "var(--role-content-bg)" }}
            >
              <div className="flex justify-between">
                <span className="opacity-70">Quantity Required:</span>
                <span className="font-bold text-sm" style={{ color: "var(--role-primary)" }}>{r.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Required By Date:</span>
                <span className="font-semibold">{r.requiredBy}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs opacity-75 pt-2 border-t" style={{ borderColor: "var(--role-border)" }}>
              <span>Requested by: <strong>{r.requestedBy}</strong></span>
              <span className="font-bold text-emerald-600">{r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
