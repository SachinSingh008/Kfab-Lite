"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  CalendarCheck,
  Boxes,
  Truck,
  Users,
  FileSpreadsheet,
  Settings,
  Search,
  Bell,
  HardHat,
  Plus,
  Building2,
  Clock,
} from "lucide-react";
import {
  INITIAL_WORKERS,
  INITIAL_STOCK,
  INITIAL_TRANSACTIONS,
} from "@/lib/mock-data";
import { DashboardView } from "@/components/views/dashboard-view";
import { AttendanceView } from "@/components/views/attendance-view";
import { StockView } from "@/components/views/stock-view";
import { SuppliesView } from "@/components/views/supplies-view";
import { EmployeesView } from "@/components/views/employees-view";
import { ReportsView } from "@/components/views/reports-view";
import { SettingsView } from "@/components/views/settings-view";

type NavTab =
  | "dashboard"
  | "attendance"
  | "stock"
  | "supplies"
  | "employees"
  | "reports"
  | "settings";

export default function KfabBasicApp() {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [workers] = useState(INITIAL_WORKERS);
  const [stock] = useState(INITIAL_STOCK);
  const [transactions] = useState(INITIAL_TRANSACTIONS);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
      {/* 1. SIDEBAR (Industrial Slate Design) */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#1e2530] text-slate-200 border-r border-[#2d3748]">
        {/* Brand & Logo Header */}
        <div className="p-4 border-b border-[#2d3748] flex items-center gap-3">
          <div className="size-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs overflow-hidden">
            <Image
              src="/logo.png"
              alt="KFAB Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-white flex items-center gap-1.5">
              KFAB BASIC
            </h1>
            <p className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">
              Enterprise Portal
            </p>
          </div>
        </div>

        {/* Company Active Badge */}
        <div className="px-4 py-2.5 bg-[#161c24] border-b border-[#2d3748] flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Building2 className="size-3.5 text-blue-400" />
            KFAB Infra Projects
          </span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
            PROD
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "dashboard"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:bg-[#2d3748] hover:text-white"
            }`}
          >
            <LayoutDashboard className="size-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Daily Operations
          </div>

          <button
            onClick={() => setCurrentTab("attendance")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "attendance"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:bg-[#2d3748] hover:text-white"
            }`}
          >
            <CalendarCheck className="size-4 shrink-0" />
            <span>Daily Muster</span>
          </button>

          <button
            onClick={() => setCurrentTab("stock")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "stock"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:bg-[#2d3748] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Boxes className="size-4 shrink-0" />
              <span>Stock Inventory</span>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full font-bold">
              2 LOW
            </span>
          </button>

          <button
            onClick={() => setCurrentTab("supplies")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "supplies"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:bg-[#2d3748] hover:text-white"
            }`}
          >
            <Truck className="size-4 shrink-0" />
            <span>Supplies & Inward</span>
          </button>

          <button
            onClick={() => setCurrentTab("employees")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "employees"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:bg-[#2d3748] hover:text-white"
            }`}
          >
            <Users className="size-4 shrink-0" />
            <span>Personnel Roster</span>
          </button>

          <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Management & Audit
          </div>

          <button
            onClick={() => setCurrentTab("reports")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "reports"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:bg-[#2d3748] hover:text-white"
            }`}
          >
            <FileSpreadsheet className="size-4 shrink-0" />
            <span>Reports & Excel</span>
          </button>

          <button
            onClick={() => setCurrentTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === "settings"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:bg-[#2d3748] hover:text-white"
            }`}
          >
            <Settings className="size-4 shrink-0" />
            <span>Settings & Access</span>
          </button>
        </nav>

        {/* User Profile / Status Footer */}
        <div className="p-3 border-t border-[#2d3748] bg-[#161c24] flex items-center gap-3">
          <div className="size-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">Admin & Accounts</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected (Local)
            </p>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 capitalize tracking-tight">
              {currentTab === "dashboard" && "Executive Operations Dashboard"}
              {currentTab === "attendance" && "Daily Muster Attendance"}
              {currentTab === "stock" && "Fabrication Material Stock & Ledger"}
              {currentTab === "supplies" && "Inward Goods & Supplier Challans"}
              {currentTab === "employees" && "Workforce & Personnel Directory"}
              {currentTab === "reports" && "Enterprise Reports & Excel Export"}
              {currentTab === "settings" && "Company Configuration & RBAC"}
            </h2>
            <span className="text-xs text-slate-400 font-normal">|</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              <Clock className="size-3.5" />
              IST Date: 18 Sep 2026 (Active Business Day)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative w-64">
              <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search records, challans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => alert("No unread alerts")}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="size-4.5" />
              <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full" />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                if (currentTab === "attendance") alert("Opening Muster Entry Form for 18 Sep 2026");
                else if (currentTab === "stock" || currentTab === "supplies")
                  alert("Opening Inward Voucher Entry Form");
                else alert("Action modal for " + currentTab);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="size-3.5" />
              <span>
                {currentTab === "attendance"
                  ? "Mark Muster"
                  : currentTab === "stock"
                  ? "Log Material"
                  : "New Entry"}
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable Main View Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentTab === "dashboard" && (
            <DashboardView
              stockMaterials={stock}
              supplyTransactions={transactions}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === "attendance" && (
            <AttendanceView workers={workers} searchTerm={searchTerm} />
          )}

          {currentTab === "stock" && (
            <StockView stockMaterials={stock} searchTerm={searchTerm} />
          )}

          {currentTab === "supplies" && (
            <SuppliesView supplyTransactions={transactions} searchTerm={searchTerm} />
          )}

          {currentTab === "employees" && (
            <EmployeesView workers={workers} searchTerm={searchTerm} />
          )}

          {currentTab === "reports" && <ReportsView />}

          {currentTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
