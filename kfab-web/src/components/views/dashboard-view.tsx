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

  // Production bays status
  const bays = [
    { name: "Bay 1: CNC Cutting & Beveling", target: 20.0, actual: 16.5, unit: "T", progress: 82 },
    { name: "Bay 2: Heavy Girder Fit-Up", target: 15.0, actual: 14.2, unit: "T", progress: 94 },
    { name: "Bay 3: Submerged Arc Welding", target: 18.0, actual: 12.8, unit: "T", progress: 71 },
    { name: "Bay 4: Shot Blasting & Surface Prep", target: 25.0, actual: 21.0, unit: "T", progress: 84 },
    { name: "Bay 5: Industrial Epoxy Painting", target: 22.0, actual: 19.5, unit: "T", progress: 88 },
  ];

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
          value="94.2%"
          subtitle="49 of 52 Personnel on Duty"
          icon={CalendarCheck}
          iconColor="text-[#16A34A]"
          iconBgColor="bg-[#DCFCE7]"
          trendText="+3.4% Normal"
          trendType="positive"
          sparklineData={[75, 80, 85, 82, 88, 92, 94]}
        />

        <KpiCard
          title="Today's Material Inward"
          value={totalInwardToday > 0 ? `${totalInwardToday.toFixed(2)} T` : "24.50 T"}
          subtitle="2 Shipments Received Today"
          icon={Truck}
          iconColor="text-[#2563EB]"
          iconBgColor="bg-[#E8F1FF]"
          trendText="Live Sync"
          trendType="positive"
          sparklineData={[12, 18, 15, 22, 28, 20, 24]}
        />

        <KpiCard
          title="Active Fabrication Bays"
          value="5 of 6 Bays"
          subtitle="Structural Bridge Girder WO-104"
          icon={HardHat}
          iconColor="text-[#0F172A]"
          iconBgColor="bg-slate-100"
          trendText="91% Cap"
          trendType="positive"
          sparklineData={[60, 70, 75, 80, 85, 88, 91]}
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

          {/* Multi-Bar Production Progress List */}
          <div className="mt-4 space-y-4">
            {bays.map((bay, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#0F172A]" />
                    {bay.name}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[#64748B]">
                      Actual: <strong className="text-[#0F172A]">{bay.actual} {bay.unit}</strong>
                    </span>
                    <span className="text-[#CBD5E1]">/</span>
                    <span className="text-[#64748B]">
                      Target: {bay.target} {bay.unit}
                    </span>
                    <span className="text-[11px] font-bold text-[#0F172A] w-10 text-right">
                      {bay.progress}%
                    </span>
                  </div>
                </div>

                {/* Styled Progress Bar */}
                <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#0F172A] to-[#1E293B]"
                    style={{ width: `${bay.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
            <span>Shift Target: <strong>90.0 Metric Tons</strong></span>
            <span>Recorded Output: <strong className="text-[#16A34A]">84.0 Metric Tons</strong></span>
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

          {/* SVG Donut Chart Visual */}
          <div className="my-4 flex flex-col items-center justify-center relative">
            <svg width="150" height="150" viewBox="0 0 42 42" className="rotate-[-90deg]">
              {/* Background Ring */}
              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#F1F5F9" strokeWidth="5" />
              {/* Raw Steel Plates (50%) */}
              <circle
                cx="21" cy="21" r="15.9"
                fill="transparent"
                stroke="#0F172A"
                strokeWidth="5"
                strokeDasharray="50 50"
                strokeDashoffset="0"
              />
              {/* Structural Beams (28%) */}
              <circle
                cx="21" cy="21" r="15.9"
                fill="transparent"
                stroke="#475569"
                strokeWidth="5"
                strokeDasharray="28 72"
                strokeDashoffset="-50"
              />
              {/* Consumables & Gases (15%) */}
              <circle
                cx="21" cy="21" r="15.9"
                fill="transparent"
                stroke="#F59E0B"
                strokeWidth="5"
                strokeDasharray="15 85"
                strokeDashoffset="-78"
              />
              {/* Hardware (7%) */}
              <circle
                cx="21" cy="21" r="15.9"
                fill="transparent"
                stroke="#10B981"
                strokeWidth="5"
                strokeDasharray="7 93"
                strokeDashoffset="-93"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-[#64748B]">Total Stock</span>
              <span className="text-base font-black text-[#0F172A]">142.5 T</span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#0F172A]">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#0F172A]" />
                Raw Steel Plates (IS 2062)
              </span>
              <span className="font-bold">50% (71.2 T)</span>
            </div>
            <div className="flex items-center justify-between text-[#0F172A]">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#475569]" />
                Structural Beams (ISMB)
              </span>
              <span className="font-bold">28% (40.0 T)</span>
            </div>
            <div className="flex items-center justify-between text-[#0F172A]">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#F59E0B]" />
                Welding Rods & Gases
              </span>
              <span className="font-bold">15% (21.4 T)</span>
            </div>
            <div className="flex items-center justify-between text-[#0F172A]">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#10B981]" />
                Hardware & Fasteners
              </span>
              <span className="font-bold">7% (9.9 T)</span>
            </div>
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
