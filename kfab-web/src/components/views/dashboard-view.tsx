"use client";

import React from "react";
import {
  CalendarCheck,
  Truck,
  HardHat,
  AlertTriangle,
  Boxes,
  ChevronRight,
  Inbox,
  Flame,
  Wrench,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { KpiCard } from "@/components/common/kpi-card";
import { ExecutiveHeroBanner } from "@/components/common/executive-hero-banner";
import { StatusBadge } from "@/components/common/status-badge";
import { StockMaterial, SupplyTransaction } from "@/lib/mock-data";
import { AppUser } from "@/lib/auth-store";

interface DashboardViewProps {
  currentUser?: AppUser | null;
  stockMaterials: StockMaterial[];
  supplyTransactions: SupplyTransaction[];
  onNavigateTab: (tab: any) => void;
  onOpenQuickInward?: () => void;
}

export function DashboardView({
  currentUser,
  stockMaterials,
  supplyTransactions,
  onNavigateTab,
  onOpenQuickInward,
}: DashboardViewProps) {
  const lowStockCount = stockMaterials.filter((m) => m.isLow).length;
  const totalInwardToday = supplyTransactions
    .filter((t) => t.type === "INWARD")
    .reduce((acc, curr) => acc + (parseFloat(curr.qty) || 0), 0);


  return (
    <div className="space-y-6">
      {/* 1. Executive Hero Banner */}
      <ExecutiveHeroBanner
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
        onOpenQuickInward={onOpenQuickInward}
      />

      {/* 2. 4 Rich KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Daily Muster Turnout"
          value={`${stockMaterials.length + supplyTransactions.length > 0 ? "—" : "0"} Records`}
          subtitle="Enter attendance data to see muster stats"
          icon={CalendarCheck}
          iconColor="text-[#16A34A]"
          iconBgColor="bg-[#DCFCE7]"
          trendText="Awaiting Data"
          trendType="positive"
          sparklineData={[0, 0, 0, 0, 0, 0, 0]}
        />

        <KpiCard
          title="Today's Material Inward"
          value={totalInwardToday > 0 ? `${totalInwardToday.toFixed(2)} T` : "0 T"}
          subtitle={supplyTransactions.filter((t) => t.type === "INWARD").length > 0 ? `${supplyTransactions.filter((t) => t.type === "INWARD").length} Shipments Today` : "No inward today"}
          icon={Truck}
          iconColor="text-[#2563EB]"
          iconBgColor="bg-[#E8F1FF]"
          trendText="Live Sync"
          trendType="positive"
          sparklineData={[0, 0, 0, 0, 0, 0, totalInwardToday]}
        />

        <KpiCard
          title="Active Fabrication Bays"
          value="— / —"
          subtitle="Enter production data to track bays"
          icon={HardHat}
          iconColor="text-[#0F172A]"
          iconBgColor="bg-slate-100"
          trendText="Awaiting Data"
          trendType="positive"
          sparklineData={[0, 0, 0, 0, 0, 0, 0]}
        />

        <KpiCard
          title="Critical Low Stock"
          value={`${lowStockCount} Items`}
          subtitle="Below Minimum Reorder Point"
          icon={AlertTriangle}
          iconColor={lowStockCount > 0 ? "text-[#DC2626]" : "text-[#16A34A]"}
          iconBgColor={lowStockCount > 0 ? "bg-[#FEE2E2]" : "bg-[#DCFCE7]"}
          trendText={lowStockCount > 0 ? "Action Req" : "Optimal"}
          trendType={lowStockCount > 0 ? "negative" : "positive"}
          sparklineData={lowStockCount > 0 ? [10, 8, 6, 4, 3, 2, 2] : [0, 0, 0, 0, 0, 0, 0]}
        />
      </div>

      {/* 3. Visual Charts & Production Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fabrication Bay Production Throughput (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-slate-100 text-[#0F172A] flex items-center justify-center">
                <Layers className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]">
                  Fabrication Bay Throughput & Shop Floor Progress
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Real-time shift output vs daily planned tonnage target
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                84.8% Overall Target Met
              </span>
            </div>
          </div>

          {/* Empty State: no bay data yet */}
          <div className="mt-4 py-10 flex flex-col items-center justify-center text-center text-[#64748B]">
            <Layers className="size-10 text-[#CBD5E1] mb-2" />
            <p className="text-xs font-bold text-[#172033]">No Production Data Yet</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Bay throughput will appear here once supervisors submit daily production reports.
            </p>
          </div>
        </div>

        {/* Material Category Distribution Donut / Radial Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col justify-between">
          <div className="pb-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <Boxes className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#172033]">
                  Inventory Distribution
                </h3>
                <p className="text-[11px] text-[#64748B]">Current warehouse material breakdown</p>
              </div>
            </div>
          </div>

          {/* Empty State: no inventory data yet */}
          <div className="my-4 flex flex-col items-center justify-center text-center">
            <div className="size-28 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
              <Boxes className="size-10 text-[#CBD5E1]" />
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-center text-[11px] text-[#64748B]">No inventory recorded yet.</p>
            <p className="text-center text-[11px] text-[#64748B]">Add materials to see breakdown.</p>
          </div>
        </div>
      </div>

      {/* 4. Two Operational Data Cards: Low Stock Watchlist & Gate Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                <AlertTriangle className="size-3.5" />
              </div>
              <h3 className="text-sm font-black text-[#0F172A]">
                Inventory Reorder Watchlist
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("stock")}
              className="text-xs text-[#0F172A] hover:text-[#1E293B] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Stock</span>
              <ChevronRight className="size-3" />
            </button>
          </div>

          <div className="mt-3">
            {stockMaterials.filter((m) => m.isLow).length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center text-[#64748B]">
                <Boxes className="size-8 text-[#CBD5E1] mb-2" />
                <p className="text-xs font-bold text-[#172033]">All Material Levels Optimal</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  No fabrication raw material items are currently below minimum safety stock.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {stockMaterials
                  .filter((m) => m.isLow)
                  .map((mat) => (
                    <div key={mat.code} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#172033]">{mat.name}</p>
                        <p className="text-[11px] text-[#64748B]">
                          {mat.code} • {mat.spec}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#DC2626]">
                          {mat.current} {mat.unit}
                        </p>
                        <p className="text-[10px] text-[#64748B]">
                          Min: {mat.min} {mat.unit}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Gate Movement & Inward Challans */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-[#E8F1FF] text-[#2563EB] flex items-center justify-center">
                <Truck className="size-3.5" />
              </div>
              <h3 className="text-sm font-black text-[#172033]">
                Today&apos;s Gate Movement & Logistics
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("supplies")}
              className="text-xs text-[#0F172A] hover:text-[#1E293B] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View Gate Log</span>
              <ChevronRight className="size-3" />
            </button>
          </div>

          <div className="mt-3">
            {supplyTransactions.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center text-[#64748B]">
                <Inbox className="size-8 text-[#CBD5E1] mb-2" />
                <p className="text-xs font-bold text-[#172033]">No Gate Passes Recorded Today</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Incoming vendor trucks and weighbridge slips will synchronize here in real time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {supplyTransactions.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#172033]">{item.material}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {item.entity} • Ref: {item.ref}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#172033]">{item.qty}</span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
