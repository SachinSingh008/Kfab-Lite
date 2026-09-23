"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Clock,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AppUser, getStoredSession, saveStoredSession } from "@/lib/auth-store";
import { StockMaterial, SupplyTransaction, WorkerRecord } from "@/lib/mock-data";
import { LoginView } from "@/components/views/login-view";
import { SplashScreen } from "@/components/common/splash-screen";
import { Kfab360Sidebar, NavTab } from "@/components/common/kfab360-sidebar";
import { FloatingChatButton } from "@/components/common/floating-chat-button";

// All Enterprise Views
import { DashboardView } from "@/components/views/dashboard-view";
import { UsersView } from "@/components/views/users-view";
import { AttendanceView } from "@/components/views/attendance-view";
import { StockView } from "@/components/views/stock-view";
import { LedgerView } from "@/components/views/ledger-view";
import { SuppliesView } from "@/components/views/supplies-view";
import { AccountsView } from "@/components/views/accounts-view";
import { EmployeesView } from "@/components/views/employees-view";
import { ReportsView } from "@/components/views/reports-view";
import { SettingsView } from "@/components/views/settings-view";
import { ChatView } from "@/components/views/chat-view";

// Supervisor Operations Views (from Kfab360)
import { DailyReportsView } from "@/components/views/daily-reports-view";
import { ProductionView } from "@/components/views/production-view";
import { MachinesView } from "@/components/views/machines-view";
import { QaqcView } from "@/components/views/qaqc-view";
import { IssuesView } from "@/components/views/issues-view";
import { RequirementsView } from "@/components/views/requirements-view";

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string; category: string }> = {
  dashboard: {
    title: "Executive Operations Dashboard",
    subtitle: "Real-time plant KPI indicators, fabrication throughput, and inventory telemetry.",
    category: "Operations",
  },
  chat: {
    title: "Team Channels & Secure Role-Scoped Messaging",
    subtitle: "WhatsApp-style enterprise chat with photo attachments, Super Admin group management, and granular role visibility isolation.",
    category: "Communications",
  },
  "daily-reports": {
    title: "Daily Shift Operations & Site Reports (DPR)",
    subtitle: "Guided 10-step site logging for task execution, worker muster, crane runtime, and QA observations.",
    category: "Site Operations",
  },
  production: {
    title: "Fabrication Bay Production & Tonnage Output",
    subtitle: "Bay-level throughput, planned vs completed tonnage, scrap rate, and machine efficiency.",
    category: "Shop Floor",
  },
  machines: {
    title: "Machinery, Cranes & Equipment Telemetry",
    subtitle: "Overhead cranes, CNC cutting gantry, SAW automatic welders, runtime, and preventive maintenance.",
    category: "Plant Machinery",
  },
  qaqc: {
    title: "Quality Assurance & NDT Weld Inspections",
    subtitle: "Ultrasonic (UT), Radiography (RT), Dye Penetrant (DPT) tests, and AWS D1.1 compliance.",
    category: "Quality Control",
  },
  issues: {
    title: "Shop Floor Issues & Resolution Bottlenecks",
    subtitle: "Tracking fit-up delays, crane breakdowns, drawing RFIs, and repair sign-offs.",
    category: "Operations",
  },
  requirements: {
    title: "Consumables & Material Requisitions",
    subtitle: "Welding electrodes, shielding gases, grinding wheels, and urgent raw steel requests.",
    category: "Store Requisitions",
  },
  users: {
    title: "User Management & RBAC Security",
    subtitle: "Security role assignments, credential overrides, and multi-tenant access control.",
    category: "System Admin",
  },
  attendance: {
    title: "Daily Attendance Muster Master",
    subtitle: "Workforce muster roll, shift allocations, and midnight date lock records.",
    category: "Shop Floor",
  },
  stock: {
    title: "Fabrication Material Stock & Inventory",
    subtitle: "Current warehouse raw material stock, reorder thresholds, and bin locations.",
    category: "Warehouse",
  },
  ledger: {
    title: "Real-Time Atomic Stock Ledger",
    subtitle: "Append-only chronological audit trail of inward goods, shop floor usage, and dispatches.",
    category: "Audit & Ledger",
  },
  supplies: {
    title: "Inward Goods & Vendor Challans",
    subtitle: "Material gate entry receipts, supplier challan scans, and weighbridge verification.",
    category: "Gate Entry",
  },
  accounts: {
    title: "Accounts & Commercial 3-Way Reconciliation",
    subtitle: "Commercial ledger, 3-way matching (PO, Challan, Invoice), and payment audit.",
    category: "Commercial",
  },
  employees: {
    title: "Workforce & Personnel Directory",
    subtitle: "Employee master records, skill classifications, fabrication bay assignments, and ASME welder certs.",
    category: "Workforce",
  },
  reports: {
    title: "Enterprise Reports Hub & Excel Data Center",
    subtitle: "Executive summaries, consumption analytics, vendor metrics, and ISO audit spreadsheets.",
    category: "Analytics",
  },
  settings: {
    title: "Plant Configuration & System Settings",
    subtitle: "Plant tenancy profiles, business date lock rules, weighbridge tolerances, and system flags.",
    category: "Configuration",
  },
};

export default function KfabBasicApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Clean empty collections (zero mock residual data)
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [stock, setStock] = useState<StockMaterial[]>([]);
  const [transactions, setTransactions] = useState<SupplyTransaction[]>([]);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setCurrentUser(session);
    }
  }, []);

  const handleLogout = () => {
    saveStoredSession(null);
    setCurrentUser(null);
    setCurrentTab("dashboard");
  };

  // Initial splash screen animation (5 seconds progressive video)
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // If not authenticated, render Login Screen as the main screen
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === "SUPERVISOR") {
            setCurrentTab("daily-reports");
          } else if (user.role === "ACCOUNTANT") {
            setCurrentTab("accounts");
          } else {
            setCurrentTab("dashboard");
          }
        }}
      />
    );
  }

  const tabMeta = TAB_TITLES[currentTab] || TAB_TITLES.dashboard;

  return (
    <div data-role-theme={currentUser.role} className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      {/* 1. KFAB360 ENTERPRISE LIGHT SIDEBAR */}
      <Kfab360Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Executive Header Bar */}
        <header
          className="h-16 px-6 flex items-center justify-between shadow-kfab z-10 shrink-0 border-b transition-colors"
          style={{
            backgroundColor: "var(--role-navbar-bg)",
            color: "var(--role-navbar-fg)",
            borderColor: "var(--role-navbar-border)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: "var(--role-div-heading-category-bg)",
                    color: "var(--role-div-heading-category-fg)",
                    borderColor: "var(--role-div-heading-border)",
                  }}
                >
                  {tabMeta.category}
                </span>
                <span className="opacity-40">/</span>
                <h2
                  className="text-sm md:text-base font-extrabold tracking-tight truncate"
                  style={{ color: "var(--role-navbar-fg)" }}
                >
                  {tabMeta.title}
                </h2>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 pl-3 border-l" style={{ borderColor: "var(--role-navbar-border)" }}>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
                style={{
                  backgroundColor: "var(--role-navbar-badge-bg)",
                  color: "var(--role-navbar-badge-fg)",
                  borderColor: "var(--role-navbar-border)",
                }}
              >
                <span className="size-2 rounded-full bg-[#16A34A] animate-pulse" />
                Jejuri MIDC &bull; Shift A Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Role Badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border transition-colors shadow-xs"
              style={{
                backgroundColor: "var(--role-badge-bg)",
                color: "var(--role-badge-text)",
                borderColor: "var(--role-border)",
              }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: "var(--role-primary)" }}
              />
              <span>{currentUser.role.replace("_", " ")}</span>
            </div>

            {/* Quick Search Bar */}
            <div className="relative w-44 md:w-60">
              <Search className="size-4 absolute left-3 top-2.5 opacity-60" style={{ color: "var(--role-navbar-search-text)" }} />
              <input
                type="text"
                placeholder="Search across module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: "var(--role-navbar-search-bg)",
                  color: "var(--role-navbar-search-text)",
                  borderColor: "var(--role-navbar-search-border)",
                }}
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                title="System Notifications"
                className="p-2 rounded-lg border transition-colors relative cursor-pointer"
                style={{
                  backgroundColor: "var(--role-navbar-badge-bg)",
                  color: "var(--role-navbar-fg)",
                  borderColor: "var(--role-navbar-border)",
                }}
              >
                <Bell className="size-4" />
                <span
                  className="absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: "var(--role-accent)" }}
                />
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E2E8F0] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-3">
                    <div className="flex items-center gap-1.5">
                      <Bell className="size-3.5 text-[#0F172A]" />
                      <span className="text-xs font-bold text-[#0F172A]">Plant Notifications</span>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[#64748B] hover:text-[#0F172A]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-start gap-2">
                      <Clock className="size-4 text-[#0F172A] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#0F172A]">Midnight Date Lock Scheduled</p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Daily attendance lock activates at 23:59 IST.
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2">
                      <ShieldCheck className="size-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#0F172A]">Weighbridge WB-01 Calibrated</p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Avery 60T gate scale inspection certified.
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2">
                      <Building2 className="size-4 text-[#F59E0B] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-[#0F172A]">Fabrication Bay 1 Active</p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Box girder assembly running on schedule.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic View Content Area */}
        <main className={`flex-1 ${currentTab === "chat" ? "overflow-hidden p-0" : "overflow-y-auto p-6 bg-[#F8FAFC]"}`}>
          {currentTab === "dashboard" && (
            <DashboardView
              currentUser={currentUser}
              stockMaterials={stock}
              supplyTransactions={transactions}
              onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
            />
          )}

          {currentTab === "chat" && (
            <ChatView currentUser={currentUser} />
          )}

          {/* Supervisor Operations Views (Matching Kfab360) */}
          {currentTab === "daily-reports" && (
            <DailyReportsView />
          )}

          {currentTab === "production" && (
            <ProductionView />
          )}

          {currentTab === "machines" && (
            <MachinesView />
          )}

          {currentTab === "qaqc" && (
            <QaqcView />
          )}

          {currentTab === "issues" && (
            <IssuesView />
          )}

          {currentTab === "requirements" && (
            <RequirementsView />
          )}

          {currentTab === "users" && (
            <UsersView />
          )}

          {currentTab === "attendance" && (
            <AttendanceView
              workers={workers}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === "stock" && (
            <StockView
              stockMaterials={stock}
              searchTerm={searchTerm}
              onOpenInward={() => setCurrentTab("supplies")}
            />
          )}

          {currentTab === "ledger" && (
            <LedgerView
              currentUser={currentUser}
            />
          )}

          {currentTab === "supplies" && (
            <SuppliesView
              supplyTransactions={transactions}
              searchTerm={searchTerm}
              onOpenInward={() => { }}
            />
          )}

          {currentTab === "accounts" && (
            <AccountsView
              currentUser={currentUser}
            />
          )}

          {currentTab === "employees" && (
            <EmployeesView
              workers={workers}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === "reports" && (
            <ReportsView
              currentUser={currentUser}
            />
          )}

          {currentTab === "settings" && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Floating circular chat button in bottom-right corner styled with role theme */}
      <FloatingChatButton
        currentUser={currentUser}
        onOpenFullChat={() => setCurrentTab("chat")}
        isFullChatActive={currentTab === "chat"}
      />
    </div>
  );
}
