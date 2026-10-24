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
import { LogsView } from "@/components/views/logs-view";
import { InventoryView } from "@/components/views/inventory-view";

// Supervisor Operations Views (from Kfab360)
import { DailyReportsView } from "@/components/views/daily-reports-view";
import { ProductionView } from "@/components/views/production-view";
import { MachinesView } from "@/components/views/machines-view";
import { QaqcView } from "@/components/views/qaqc-view";
import { IssuesView } from "@/components/views/issues-view";
import { RequirementsView } from "@/components/views/requirements-view";

// Authoritative Sample Demonstration Data & DataService
import {
  SAMPLE_WORKERS,
  SAMPLE_STOCK,
  SAMPLE_TRANSACTIONS,
  SAMPLE_DAILY_REPORTS,
  SAMPLE_PRODUCTION_LOGS,
  SAMPLE_MACHINES,
  SAMPLE_QAQC,
  SAMPLE_ISSUES,
  SAMPLE_REQUIREMENTS,
  SAMPLE_ACCOUNTS,
  SAMPLE_LEDGER_ENTRIES,
} from "@/lib/sample-data";
import { DataService } from "@/lib/data-service";

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string; category: string }> = {
  dashboard: {
    title: "Executive Operations Dashboard",
    subtitle: "Real-time plant KPI indicators, fabrication throughput, and inventory telemetry.",
    category: "Operations",
  },
  logs: {
    title: "Operational Activity & System Audit Logs",
    subtitle: "User activity logs, consolidated team events, and automated application audit trails.",
    category: "Audit & Logs",
  },
  chat: {
    title: "Team Channels & Secure Role-Scoped Messaging",
    subtitle: "WhatsApp-style enterprise chat with photo attachments, Super Admin group management, and granular role visibility isolation.",
    category: "Communications",
  },
  inventory: {
    title: "Inventory & Material Management Master",
    subtitle: "Shop floor consumables, tackles, machinery, power tools, clothes, safety gear, and complete cost telemetry.",
    category: "Store & Inventory",
  },
  "inventory-workbook": {
    title: "Inventory Live Spreadsheet Workspace",
    subtitle: "Excel-compatible live ledger, fast multi-cell copy-paste, cell editing, and batch ledger reconciliation.",
    category: "Files & Workbooks",
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
    title: "Reports & Project Progress Dashboard",
    subtitle: "Plant efficiency, delivery schedule tracking, and dynamic stage execution.",
    category: "Reports",
  },
  "reports-progress": {
    title: "Project Progress Dashboard (Tab 1)",
    subtitle: "Real-time delivery milestones, planned vs. actual progress curves, and delay tracking.",
    category: "Reports",
  },
  "reports-details": {
    title: "Project Details & Stage Execution (Tab 2)",
    subtitle: "Normalized material item tracking across marking, cutting, fitting, welding, and final stages.",
    category: "Reports",
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

  // Easily Removable Sample Demo Data State
  const [sampleDataActive, setSampleDataActive] = useState<boolean>(true);
  const [workers, setWorkers] = useState<WorkerRecord[]>(SAMPLE_WORKERS);
  const [stock, setStock] = useState<StockMaterial[]>(SAMPLE_STOCK);
  const [transactions, setTransactions] = useState<SupplyTransaction[]>(SAMPLE_TRANSACTIONS);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setCurrentUser(session);
    }

    // Hydrate sample data mode from localStorage
    const storedSamplePref = typeof window !== "undefined" ? localStorage.getItem("kfab360_sample_data_active") : null;
    const isSampleActive = storedSamplePref !== null ? storedSamplePref === "true" : true;
    setSampleDataActive(isSampleActive);

    if (isSampleActive) {
      setWorkers(SAMPLE_WORKERS);
      setStock(SAMPLE_STOCK);
      setTransactions(SAMPLE_TRANSACTIONS);
      DataService.loadSampleData(SAMPLE_STOCK, SAMPLE_TRANSACTIONS, SAMPLE_WORKERS, SAMPLE_LEDGER_ENTRIES);
    } else {
      setWorkers([]);
      setStock([]);
      setTransactions([]);
      DataService.clearSampleData();
    }

    if (typeof window !== "undefined") {
      if (window.location.pathname.startsWith("/logs") || window.location.search.includes("tab=logs")) {
        setCurrentTab("logs");
      } else if (window.location.pathname.startsWith("/reports") || window.location.search.includes("tab=reports")) {
        setCurrentTab("reports");
      } else if (window.location.pathname.startsWith("/inventory") || window.location.search.includes("tab=inventory")) {
        setCurrentTab("inventory");
      }
    }
  }, []);

  const handleToggleSampleData = () => {
    const nextState = !sampleDataActive;
    setSampleDataActive(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("kfab360_sample_data_active", String(nextState));
    }
    if (nextState) {
      setWorkers(SAMPLE_WORKERS);
      setStock(SAMPLE_STOCK);
      setTransactions(SAMPLE_TRANSACTIONS);
      DataService.loadSampleData(SAMPLE_STOCK, SAMPLE_TRANSACTIONS, SAMPLE_WORKERS, SAMPLE_LEDGER_ENTRIES);
    } else {
      setWorkers([]);
      setStock([]);
      setTransactions([]);
      DataService.clearSampleData();
    }
  };

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      if (tab === "logs") {
        window.history.pushState(null, "", "/logs");
      } else if (tab === "reports" || tab === "reports-progress" || tab === "reports-details") {
        window.history.pushState(null, "", "/reports");
      } else if (tab === "inventory" || tab === "inventory-workbook") {
        window.history.pushState(null, "", "/inventory");
      } else {
        window.history.pushState(null, "", "/");
      }
    }
  };

  const handleLogout = () => {
    saveStoredSession(null);
    setCurrentUser(null);
    setCurrentTab("dashboard");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/");
    }
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
        onSelectTab={handleSelectTab}
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
            {/* Easily Removable Sample Demo Data Mode Toggle Button */}
            <button
              onClick={handleToggleSampleData}
              title={
                sampleDataActive
                  ? "Click to remove all sample demo records across all tabs"
                  : "Click to load sample demonstration data across all tabs"
              }
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                sampleDataActive
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400 hover:bg-amber-500/25"
                  : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
              }`}
            >
              <Sparkles className={`size-3.5 ${sampleDataActive ? "text-amber-500 fill-amber-500 animate-pulse" : "text-slate-400"}`} />
              <span>{sampleDataActive ? "Demo Data: Active" : "Clean Slate: Empty"}</span>
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  sampleDataActive ? "bg-amber-500 text-white" : "bg-slate-300 text-slate-700"
                }`}
              >
                {sampleDataActive ? "Remove" : "Load"}
              </span>
            </button>

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
              stockMaterials={sampleDataActive ? stock : []}
              supplyTransactions={sampleDataActive ? transactions : []}
              sampleDataActive={sampleDataActive}
              onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
            />
          )}

          {currentTab === "logs" && (
            <LogsView currentUser={currentUser} />
          )}

          {currentTab === "chat" && (
            <ChatView
              currentUser={currentUser}
              onBackToDashboard={() => setCurrentTab("dashboard")}
            />
          )}

          {/* Supervisor Operations Views (Matching Kfab360) */}
          {currentTab === "daily-reports" && (
            <DailyReportsView reports={sampleDataActive ? SAMPLE_DAILY_REPORTS : []} />
          )}

          {currentTab === "production" && (
            <ProductionView logs={sampleDataActive ? SAMPLE_PRODUCTION_LOGS : []} />
          )}

          {currentTab === "machines" && (
            <MachinesView machines={sampleDataActive ? SAMPLE_MACHINES : []} />
          )}

          {currentTab === "qaqc" && (
            <QaqcView records={sampleDataActive ? SAMPLE_QAQC : []} />
          )}

          {currentTab === "issues" && (
            <IssuesView issues={sampleDataActive ? SAMPLE_ISSUES : []} />
          )}

          {currentTab === "requirements" && (
            <RequirementsView reqs={sampleDataActive ? SAMPLE_REQUIREMENTS : []} />
          )}

          {currentTab === "users" && (
            <UsersView currentUser={currentUser} />
          )}

          {currentTab === "attendance" && (
            <AttendanceView
              workers={sampleDataActive ? workers : []}
              searchTerm={searchTerm}
              currentUser={currentUser}
            />
          )}

          {currentTab === "inventory" && (
            <InventoryView currentUser={currentUser} initialOpenExcel={false} sampleDataActive={sampleDataActive} />
          )}

          {currentTab === "inventory-workbook" && (
            <InventoryView currentUser={currentUser} initialOpenExcel={true} sampleDataActive={sampleDataActive} />
          )}

          {currentTab === "stock" && (
            <StockView
              stockMaterials={sampleDataActive ? stock : []}
              searchTerm={searchTerm}
              onOpenInward={() => setCurrentTab("supplies")}
            />
          )}

          {currentTab === "ledger" && (
            <LedgerView
              key={sampleDataActive ? "sample-ledger" : "clean-ledger"}
              currentUser={currentUser}
            />
          )}

          {currentTab === "supplies" && (
            <SuppliesView
              supplyTransactions={sampleDataActive ? transactions : []}
              searchTerm={searchTerm}
              onOpenInward={() => { }}
            />
          )}

          {currentTab === "accounts" && (
            <AccountsView
              currentUser={currentUser}
              records={sampleDataActive ? SAMPLE_ACCOUNTS : []}
            />
          )}

          {currentTab === "employees" && (
            <EmployeesView
              workers={sampleDataActive ? workers : []}
              searchTerm={searchTerm}
            />
          )}

          {(currentTab === "reports" || currentTab === "reports-progress" || currentTab === "reports-details") && (
            <ReportsView
              currentUser={currentUser}
              initialTab={currentTab === "reports-details" ? "details" : "progress"}
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
