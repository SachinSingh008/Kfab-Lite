"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Truck,
  HardHat,
  AlertTriangle,
  ShieldCheck,
  X,
  Boxes,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { StockMaterial, SupplyTransaction } from "@/lib/mock-data";

interface DashboardViewProps {
  stockMaterials: StockMaterial[];
  supplyTransactions: SupplyTransaction[];
  onNavigateTab: (tab: "stock" | "supplies") => void;
}

export function DashboardView({
  stockMaterials,
  supplyTransactions,
  onNavigateTab,
}: DashboardViewProps) {
  const [attendanceNotice, setAttendanceNotice] = useState(true);

  return (
    <div className="space-y-6">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Daily Muster Turnout"
          value="94.2%"
          subtitle="49 of 52 Personnel on Duty"
          change="+3.4%"
          changeType="positive"
          icon={CalendarCheck}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          title="Today's Material Inward"
          value="24.50 T"
          subtitle="2 Shipments Received"
          change="+12.0 T"
          changeType="positive"
          icon={Truck}
          iconColor="text-blue-600 bg-blue-50"
        />
        <StatCard
          title="Active Work Bays"
          value="6 Bays"
          subtitle="Fabrication in Progress"
          change="Normal"
          changeType="neutral"
          icon={HardHat}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          title="Critical Low Stock"
          value="2 Items"
          subtitle="Below Minimum Reorder Point"
          change="Action Req"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="text-rose-600 bg-rose-50"
        />
      </div>

      {/* Notice Banner */}
      {attendanceNotice && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Enterprise Date-Lock Enforced (Asia/Kolkata)
              </h4>
              <p className="text-xs text-blue-700 mt-0.5">
                Current business day is active. All attendance marked today is locked at midnight.
                Historical corrections require formal admin approval via Correction Requests.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAttendanceNotice(false)}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Two Column Layout: Low Stock Watchlist & Recent Logistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Boxes className="size-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-800">Inventory Alert Watchlist</h3>
            </div>
            <button
              onClick={() => onNavigateTab("stock")}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All Stock <ChevronRight className="size-3" />
            </button>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {stockMaterials
              .filter((m) => m.isLow)
              .map((mat) => (
                <div key={mat.code} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{mat.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {mat.code} • {mat.spec}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-600">
                      {mat.current} {mat.unit}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Min: {mat.min} {mat.unit}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Today's Transactions Log */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-800">Today&apos;s Gate Movement</h3>
            </div>
            <button
              onClick={() => onNavigateTab("supplies")}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="size-3" />
            </button>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {supplyTransactions.slice(0, 3).map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.material}</p>
                  <p className="text-[11px] text-slate-500">
                    {item.entity} • Ref: {item.ref}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-800">{item.qty}</span>
                  <div className="mt-0.5">
                    <StatusBadge
                      label={item.type}
                      tone={item.type === "INWARD" ? "success" : "info"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
