import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  CalendarCheck,
  Boxes,
  Users,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronsLeft,
  Activity,
  Package,
  Landmark,
  FileText,
  BarChart3,
  Layers,
} from "lucide-react";
import { AppUser } from "@/lib/auth-store";

export type NavTab =
  | "dashboard"
  | "logs"
  | "chat"
  | "inventory"
  | "inventory-workbook"
  | "daily-reports"
  | "production"
  | "attendance"
  | "stock"
  | "machines"
  | "qaqc"
  | "issues"
  | "requirements"
  | "ledger"
  | "supplies"
  | "accounts"
  | "employees"
  | "reports"
  | "reports-progress"
  | "reports-details"
  | "users"
  | "settings"
  | "workbooks"
  | "workbooks-attendance"
  | "workbooks-employees"
  | "workbooks-expenses"
  | "workbooks-inventory"
  | "workbooks-outward"
  | "workbooks-salary"
  | "workbooks-salary-2025"
  | "workbooks-salary-2026"
  | "workbooks-salary-2027"
  | "workbooks-salary-2028"
  | "workbooks-sales"
  | "workbooks-others";

interface Kfab360SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: AppUser;
  onLogout: () => void;
}

// Maps any tab to its parent category folder key
function getFolderForTab(tab: NavTab, openFolder?: string | null): string | null {
  switch (tab) {
    case "inventory":
    case "stock":
      return "inventory";
    case "inventory-workbook":
      return openFolder === "workbooks" ? "workbooks" : "inventory";
    case "reports":
    case "reports-progress":
    case "reports-details":
    case "daily-reports":
    case "production":
      return "reports";
    case "accounts":
    case "ledger":
    case "supplies":
      return "accounts";
    case "employees":
      return "people";
    case "attendance":
      return openFolder === "workbooks" ? "workbooks" : "people";
    case "workbooks":
    case "workbooks-attendance":
    case "workbooks-employees":
    case "workbooks-expenses":
    case "workbooks-inventory":
    case "workbooks-outward":
    case "workbooks-salary":
    case "workbooks-salary-2025":
    case "workbooks-salary-2026":
    case "workbooks-salary-2027":
    case "workbooks-salary-2028":
    case "workbooks-sales":
    case "workbooks-others":
      return "workbooks";
    case "users":
    case "settings":
      return "security";
    default:
      return null;
  }
}

// Helper: Active tab colors. For Super Admin, uses a crisp platinum grey pill instead of black-on-black.
function getActiveTabStyle(isSuperAdmin?: boolean) {
  if (isSuperAdmin) {
    return {
      backgroundColor: "#e2e8f0",
      borderColor: "#cbd5e1",
      color: "#0f172a",
    };
  }
  return {
    backgroundColor: "var(--role-badge-bg)",
    borderColor: "var(--role-border)",
    color: "var(--role-primary)",
  };
}

export function Kfab360Sidebar({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
}: Kfab360SidebarProps) {
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const isAdmin = currentUser.role === "ADMIN";
  const isSupervisor = currentUser.role === "SUPERVISOR";
  const isAccountant = currentUser.role === "ACCOUNTANT" || currentUser.role === "ACCOUNT";

  // Role visibility permissions
  const canSeeDashboard = true;
  const canSeeLogs = true;
  const canSeeInventory = true;
  const canSeeInventorySpreadsheets = isSuperAdmin || isAdmin || isAccountant;
  const canSeeReports = isSuperAdmin || isAdmin || isSupervisor;
  const canSeeAccounts = isSuperAdmin || isAdmin || isAccountant;
  const canSeePeople = isSuperAdmin || isAdmin || isAccountant;
  const canSeeWorkbooks = isSuperAdmin || isAdmin || isAccountant;
  const canSeeSecurity = isSuperAdmin || isAdmin;

  // Shrinkable/collapsible full sidebar state
  const [isShrunk, setIsShrunk] = useState(false);
  const isAccounts = currentTab === "accounts";
  const effectivelyShrunk = isAccounts ? true : isShrunk;

  // Accordion state
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  // Active parent status calculation
  const isInventoryActive =
    ["inventory", "stock"].includes(currentTab) ||
    (currentTab === "inventory-workbook" && openFolder !== "workbooks");
  const isReportsActive =
    ["reports", "reports-progress", "reports-details", "daily-reports", "production"].includes(currentTab);
  const isPeopleActive =
    currentTab === "employees" ||
    (currentTab === "attendance" && openFolder !== "workbooks");
  const isWorkbooksActive =
    currentTab.startsWith("workbooks") ||
    (currentTab === "inventory-workbook" && openFolder === "workbooks") ||
    (currentTab === "attendance" && openFolder === "workbooks");
  const isSecurityActive =
    ["users", "settings"].includes(currentTab);

  // Whenever the active tab changes:
  useEffect(() => {
    const parent = getFolderForTab(currentTab, openFolder);
    if (parent) {
      setOpenFolder(parent);
    } else {
      setOpenFolder(null);
    }
  }, [currentTab]);

  // Handler for clicking any root item (minimizes all accordion folders)
  const handleSelectRootTab = (tab: NavTab) => {
    setOpenFolder(null);
    onSelectTab(tab);
  };

  const handleToggleFolder = (folderKey: string) => {
    setOpenFolder((prev) => (prev === folderKey ? null : folderKey));
  };

  // Ensure current user cannot stay stuck on an unauthorized tab
  useEffect(() => {
    if (
      ["reports", "reports-progress", "reports-details", "daily-reports", "production"].includes(
        currentTab
      ) &&
      !canSeeReports
    ) {
      onSelectTab("dashboard");
    } else if (
      ["accounts", "ledger", "supplies"].includes(currentTab) &&
      !canSeeAccounts
    ) {
      onSelectTab("dashboard");
    } else if (["employees"].includes(currentTab) && !canSeePeople) {
      onSelectTab("dashboard");
    } else if (["users", "settings"].includes(currentTab) && !canSeeSecurity) {
      onSelectTab("dashboard");
    } else if (
      (currentTab === "inventory-workbook" || currentTab.startsWith("workbooks")) &&
      !canSeeWorkbooks
    ) {
      onSelectTab("dashboard");
    }
  }, [
    currentUser.role,
    currentTab,
    canSeeReports,
    canSeeAccounts,
    canSeePeople,
    canSeeSecurity,
    canSeeInventorySpreadsheets,
    canSeeWorkbooks,
    onSelectTab,
  ]);

  return (
    <aside
      className={`sidebar relative flex-shrink-0 flex flex-col select-none transition-all duration-200 ease-in-out z-20 overflow-hidden ${
        effectivelyShrunk ? "w-[68px]" : "w-[245px]"
      }`}
      style={{
        background: "linear-gradient(90deg, var(--role-sidebar-gradient-start, #f1f5f9) 0%, rgba(255, 255, 255, 0.65) 45%, #ffffff 100%)",
        color: "var(--role-sidebar-fg, #0f172a)",
      }}
    >
      {/* ============================================================ */}
      {/* RIGHT EDGE GRADIENT BORDER (Theme Color Gradient) */}
      {/* ============================================================ */}
      <div
        className="absolute top-0 right-0 bottom-0 w-[1.5px] pointer-events-none z-30"
        style={{
          background: "linear-gradient(180deg, var(--role-primary) 0%, var(--role-accent, var(--role-primary)) 40%, var(--role-border) 75%, rgba(226, 232, 240, 0.4) 100%)",
        }}
      />

      {/* ============================================================ */}
      {/* 1. HEADER (Identical to Invoicing's sidebar__header) */}
      {/* ============================================================ */}
      <div
        className={`p-3.5 border-b flex ${
          effectivelyShrunk ? "flex-col items-center gap-2 px-2" : "items-center justify-between gap-2.5"
        }`}
        style={{ borderColor: "var(--role-border, #e2e8f0)" }}
      >
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          onClick={() => {
            setIsShrunk(false);
            onSelectTab("dashboard");
          }}
          title="Return to KFAB360 ERP Dashboard"
        >
          {/* Brand Mark */}
          <div
            className="shrink-0 size-8 rounded-lg bg-white flex items-center justify-center p-1 shadow-2xs border transition-transform duration-150 group-hover:scale-105"
            style={{ borderColor: "var(--role-border, #e2e8f0)" }}
          >
            <Image
              src="/logo.png"
              alt="KFAB360 Logo"
              width={24}
              height={24}
              className="object-contain"
              priority
            />
          </div>

          {!effectivelyShrunk && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[14px] tracking-tight leading-tight text-slate-900">
                  KFAB<span style={{ color: isSuperAdmin ? "#0f172a" : "var(--role-primary)" }}>360</span>
                </span>
                <span
                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wider border leading-none"
                  style={
                    isSuperAdmin
                      ? {
                          backgroundColor: "#e2e8f0",
                          color: "#0f172a",
                          borderColor: "#cbd5e1",
                        }
                      : {
                          backgroundColor: "var(--role-badge-bg)",
                          color: "var(--role-primary)",
                          borderColor: "var(--role-border)",
                        }
                  }
                >
                  {isSuperAdmin ? "ADMIN" : currentUser.role.replace("_", " ")}
                </span>
              </div>
              <p className="text-[10.5px] font-medium text-slate-400 truncate leading-tight mt-0.5">
                Heavy Steel Fabrication
              </p>
            </div>
          )}
        </div>

        {/* Invoicing-style Collapse Toggle (ChevronsLeft with rotation) */}
        {!isAccounts && (
          <button
            type="button"
            onClick={() => setIsShrunk(!isShrunk)}
            title={effectivelyShrunk ? "Expand navigation" : "Collapse navigation"}
            aria-label={effectivelyShrunk ? "Expand navigation" : "Collapse navigation"}
            className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all cursor-pointer shrink-0"
          >
            <ChevronsLeft
              className={`size-4 transition-transform duration-300 ${
                effectivelyShrunk ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. NAVIGATION ITEMS (Invoicing-styled .sidebar__nav) */}
      {/* ============================================================ */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        {isAccounts ? (
          /* When in Accounts mode: Only show ERP and Accounts */
          <div className="flex flex-col items-center gap-3 py-3">
            {/* Management (ERP) */}
            <button
              onClick={() => {
                setIsShrunk(false);
                onSelectTab("dashboard");
              }}
              title="Management (ERP) - Return to ERP Dashboard"
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-150 cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 hover:scale-105 active:scale-95"
            >
              <LayoutDashboard className="size-5 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold mt-1 text-slate-700 leading-none">ERP</span>
            </button>

            {/* Accounts (Active) */}
            <button
              onClick={() => onSelectTab("accounts")}
              title="Accounts & Invoicing"
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-150 cursor-pointer border shadow-2xs"
              style={getActiveTabStyle(isSuperAdmin)}
            >
              <Landmark className="size-5" />
              <span className="text-[10px] font-bold mt-1 leading-none">Accounts</span>
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard (Root Item) */}
            {canSeeDashboard && (
              <SidebarLink
                active={currentTab === "dashboard"}
                onClick={() => handleSelectRootTab("dashboard")}
                icon={LayoutDashboard}
                label="Dashboard"
                isShrunk={effectivelyShrunk}
                isSuperAdmin={isSuperAdmin}
              />
            )}

            {/* Logs (Root Item) */}
            {canSeeLogs && (
              <SidebarLink
                active={currentTab === "logs"}
                onClick={() => handleSelectRootTab("logs")}
                icon={FileText}
                label="Logs"
                isShrunk={effectivelyShrunk}
                isSuperAdmin={isSuperAdmin}
              />
            )}

            {/* Inventory (Accordion Category) */}
            {canSeeInventory && (
              <SidebarSection
                label="Inventory"
                isOpen={openFolder === "inventory"}
                onToggle={() => handleToggleFolder("inventory")}
                icon={Boxes}
                isShrunk={effectivelyShrunk}
                isActiveParent={isInventoryActive}
                onSelectFirstChild={() => onSelectTab("inventory")}
                isSuperAdmin={isSuperAdmin}
              >
                <SidebarChildLink
                  active={currentTab === "inventory"}
                  onClick={() => onSelectTab("inventory")}
                  icon={Boxes}
                  label="Materials"
                  isSuperAdmin={isSuperAdmin}
                />
                <SidebarChildLink
                  active={currentTab === "stock"}
                  onClick={() => onSelectTab("stock")}
                  icon={Package}
                  label="Raw Material"
                  isSuperAdmin={isSuperAdmin}
                />
                {canSeeInventorySpreadsheets && (
                  <SidebarChildLink
                    active={currentTab === "inventory-workbook" && openFolder !== "workbooks"}
                    onClick={() => onSelectTab("inventory-workbook")}
                    icon={FileSpreadsheet}
                    label="Spreadsheets"
                    isSuperAdmin={isSuperAdmin}
                  />
                )}
              </SidebarSection>
            )}

            {/* Reports (Accordion Category) */}
            {canSeeReports && (
              <SidebarSection
                label="Reports"
                isOpen={openFolder === "reports"}
                onToggle={() => handleToggleFolder("reports")}
                icon={BarChart3}
                isShrunk={effectivelyShrunk}
                isActiveParent={isReportsActive}
                onSelectFirstChild={() => onSelectTab("reports-progress")}
                isSuperAdmin={isSuperAdmin}
              >
                <SidebarChildLink
                  active={currentTab === "reports-progress" || currentTab === "reports"}
                  onClick={() => onSelectTab("reports-progress")}
                  icon={Activity}
                  label="Project Progress"
                  isSuperAdmin={isSuperAdmin}
                />
                <SidebarChildLink
                  active={currentTab === "reports-details"}
                  onClick={() => onSelectTab("reports-details")}
                  icon={Layers}
                  label="Project Details"
                  isSuperAdmin={isSuperAdmin}
                />
              </SidebarSection>
            )}

            {/* People and HR (Accordion Category) */}
            {canSeePeople && (
              <SidebarSection
                label="People and HR"
                isOpen={openFolder === "people"}
                onToggle={() => handleToggleFolder("people")}
                icon={Users}
                isShrunk={effectivelyShrunk}
                isActiveParent={isPeopleActive}
                onSelectFirstChild={() => onSelectTab("employees")}
                isSuperAdmin={isSuperAdmin}
              >
                <SidebarChildLink
                  active={currentTab === "employees"}
                  onClick={() => onSelectTab("employees")}
                  icon={Users}
                  label="Personnel Directory"
                  isSuperAdmin={isSuperAdmin}
                />
                <SidebarChildLink
                  active={currentTab === "attendance" && openFolder !== "workbooks"}
                  onClick={() => onSelectTab("attendance")}
                  icon={CalendarCheck}
                  label="Attendance Roster"
                  isSuperAdmin={isSuperAdmin}
                />
              </SidebarSection>
            )}

            {/* Workbooks (Root Item) */}
            {canSeeWorkbooks && (
              <SidebarLink
                active={isWorkbooksActive || currentTab === "workbooks" || currentTab.startsWith("workbooks-")}
                onClick={() => {
                  setOpenFolder(null);
                  onSelectTab("workbooks");
                }}
                icon={FileSpreadsheet}
                label="Workbooks"
                isShrunk={effectivelyShrunk}
                isSuperAdmin={isSuperAdmin}
              />
            )}

            {/* Admin and Security (Accordion Category) */}
            {canSeeSecurity && (
              <SidebarSection
                label="Admin & Security"
                isOpen={openFolder === "security"}
                onToggle={() => handleToggleFolder("security")}
                icon={ShieldCheck}
                isShrunk={effectivelyShrunk}
                isActiveParent={isSecurityActive}
                onSelectFirstChild={() => onSelectTab("users")}
                isSuperAdmin={isSuperAdmin}
              >
                <SidebarChildLink
                  active={currentTab === "users"}
                  onClick={() => onSelectTab("users")}
                  icon={ShieldCheck}
                  label="User Management"
                  isSuperAdmin={isSuperAdmin}
                />
                <SidebarChildLink
                  active={currentTab === "settings"}
                  onClick={() => onSelectTab("settings")}
                  icon={Settings}
                  label="Plant Configuration"
                  isSuperAdmin={isSuperAdmin}
                />
              </SidebarSection>
            )}
          </>
        )}
      </nav>

      {/* ============================================================ */}
      {/* 3. QUICK SWITCHER: MANAGEMENT & ACCOUNTS (Above Footer) */}
      {/* ============================================================ */}
      {!isAccounts && (
        <div
          className="px-2.5 py-2 border-t"
          style={{
            borderColor: "var(--role-border, #e2e8f0)",
          }}
        >
          <div className="space-y-1">
            {/* Management (ERP) */}
            <button
              onClick={() => {
                setIsShrunk(false);
                onSelectTab("dashboard");
              }}
              title="KFAB360 Management & Operations Dashboard"
              className={`w-full flex items-center ${
                effectivelyShrunk ? "justify-center p-2 rounded-xl" : "justify-between px-3 py-2 rounded-xl"
              } text-left text-[13px] transition-all duration-150 cursor-pointer ${
                currentTab === "dashboard"
                  ? "border font-semibold shadow-2xs"
                  : "border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
              }`}
              style={
                currentTab === "dashboard"
                  ? getActiveTabStyle(isSuperAdmin)
                  : undefined
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LayoutDashboard className="size-[18px] shrink-0 opacity-80" />
                {!effectivelyShrunk && <span className="truncate">Management</span>}
              </div>
              {!effectivelyShrunk && (
                <span
                  className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wider ${
                    currentTab === "dashboard"
                      ? isSuperAdmin
                        ? "bg-white/80 text-slate-800 border border-slate-300"
                        : "bg-white/60 text-[var(--role-primary)] border border-[var(--role-border)]"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  ERP
                </span>
              )}
            </button>

            {/* Accounts (Invoicing) */}
            <button
              onClick={() => onSelectTab("accounts")}
              title="Invoicing, GST & Accounting Ledgers"
              className={`w-full flex items-center ${
                effectivelyShrunk ? "justify-center p-2 rounded-xl" : "justify-between px-3 py-2 rounded-xl"
              } text-left text-[13px] transition-all duration-150 cursor-pointer border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Landmark className="size-[18px] shrink-0 opacity-80" />
                {!effectivelyShrunk && <span className="truncate">Accounts</span>}
              </div>
              {!effectivelyShrunk && (
                <span className="text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Invoicing
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. USER PROFILE & LOGOUT FOOTER (Identical to Invoicing's sidebar__footer) */}
      {/* ============================================================ */}
      <div
        className="p-3 border-t flex flex-col gap-2"
        style={{
          borderColor: "var(--role-border, #e2e8f0)",
        }}
      >
        <div className={`flex items-center ${effectivelyShrunk ? "justify-center" : "justify-between"} gap-2`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Invoicing-style Circular Avatar */}
            <div
              className="size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border shadow-2xs"
              style={
                isSuperAdmin
                  ? {
                      backgroundColor: "#e2e8f0",
                      borderColor: "#cbd5e1",
                      color: "#0f172a",
                    }
                  : {
                      backgroundColor: "var(--role-badge-bg)",
                      borderColor: "var(--role-border)",
                      color: "var(--role-primary)",
                    }
              }
              title={`${currentUser.name} (${currentUser.role})`}
            >
              {(currentUser.name || "U").slice(0, 2).toUpperCase()}
            </div>

            {!effectivelyShrunk && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate mt-0.5">
                  {currentUser.role.replace("_", " ").toLowerCase()}
                </p>
              </div>
            )}
          </div>

          {/* Invoicing-style Logout Button */}
          {!effectivelyShrunk ? (
            <button
              onClick={onLogout}
              title="Logout"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/80 border border-transparent hover:border-red-100 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="size-3.5" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50/80 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// INVOICING-STYLE DIRECT ROOT ITEM (.sidebar__link)
// Active state uses the ERP role color shade or grey for Super Admin
// ============================================================================

interface SidebarLinkProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isShrunk?: boolean;
  isSuperAdmin?: boolean;
  badge?: string;
}

function SidebarLink({
  active,
  onClick,
  icon: Icon,
  label,
  isShrunk = false,
  isSuperAdmin = false,
  badge,
}: SidebarLinkProps) {
  const activeStyle = getActiveTabStyle(isSuperAdmin);

  return (
    <button
      onClick={onClick}
      title={label}
      className={`sidebar-link relative w-full flex items-center ${
        isShrunk ? "justify-center p-2 rounded-xl" : "justify-between px-3 py-2 rounded-xl"
      } text-left text-[13px] transition-all duration-150 cursor-pointer ${
        active
          ? "border font-semibold shadow-2xs"
          : "border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
      }`}
      style={active ? activeStyle : undefined}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={`size-[18px] shrink-0 transition-opacity ${
            active ? "opacity-100" : "opacity-75"
          }`}
        />
        {!isShrunk && <span className="truncate">{label}</span>}
      </div>

      {!isShrunk && badge && (
        <span
          className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ml-1.5 ${
            active
              ? isSuperAdmin
                ? "bg-white/80 text-slate-800 border border-slate-300"
                : "bg-white/60 text-[var(--role-primary)] border border-[var(--role-border)]"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// INVOICING-STYLE ACCORDION SECTION (.sidebar__section & .sidebar__section-toggle)
// Includes the subtle left indicator tick when a child inside is active
// ============================================================================

interface SidebarSectionProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ComponentType<{ className?: string }>;
  isShrunk?: boolean;
  isActiveParent?: boolean;
  isSuperAdmin?: boolean;
  onSelectFirstChild?: () => void;
  children?: React.ReactNode;
}

function SidebarSection({
  label,
  isOpen,
  onToggle,
  icon: Icon,
  isShrunk = false,
  isActiveParent = false,
  isSuperAdmin = false,
  onSelectFirstChild,
  children,
}: SidebarSectionProps) {
  const activeStyle = getActiveTabStyle(isSuperAdmin);

  // When rail is collapsed, clicking the section icon opens the section's first child
  if (isShrunk) {
    return (
      <button
        type="button"
        onClick={onSelectFirstChild || onToggle}
        title={label}
        className={`relative w-full flex items-center justify-center p-2 rounded-xl transition-all duration-150 cursor-pointer ${
          isActiveParent
            ? "border font-semibold shadow-2xs"
            : "border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
        }`}
        style={isActiveParent ? activeStyle : undefined}
      >
        <Icon className={`size-[18px] shrink-0 ${isActiveParent ? "opacity-100" : "opacity-75"}`} />
      </button>
    );
  }

  return (
    <div className="select-none">
      {/* Section Toggle */}
      <button
        type="button"
        onClick={onToggle}
        title={label}
        className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-[13px] transition-all duration-150 cursor-pointer ${
          isActiveParent
            ? "font-semibold text-slate-900"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
        }`}
      >
        {/* Subtle indicator tick for active parent, matching Invoicing's sidebar__section-toggle--current::before */}
        {isActiveParent && (
          <span
            className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full"
            style={{
              backgroundColor: isSuperAdmin ? "#475569" : "var(--role-primary)",
            }}
          />
        )}

        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Icon
            className={`size-[18px] shrink-0 transition-colors ${
              isActiveParent
                ? isSuperAdmin
                  ? "opacity-100 text-slate-900"
                  : "opacity-100 text-[var(--role-primary)]"
                : "opacity-75"
            }`}
          />
          <span className="truncate">{label}</span>
        </div>

        <ChevronRight
          className={`size-3.5 shrink-0 opacity-60 transition-transform duration-200 ${
            isOpen ? "rotate-90 opacity-90" : ""
          }`}
        />
      </button>

      {/* Accordion children with Invoicing guide rail (.sidebar__section-items) */}
      {isOpen && (
        <div className="ml-4 pl-2.5 my-1 border-l border-slate-200/90 space-y-0.5 transition-all duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// INVOICING-STYLE CHILD ITEM (.sidebar__link--child)
// Active state uses the ERP role color shade or grey for Super Admin
// ============================================================================

interface SidebarChildLinkProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isSuperAdmin?: boolean;
  badge?: string;
}

function SidebarChildLink({
  active,
  onClick,
  icon: Icon,
  label,
  isSuperAdmin = false,
  badge,
}: SidebarChildLinkProps) {
  const activeStyle = getActiveTabStyle(isSuperAdmin);

  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[12.5px] transition-all duration-150 cursor-pointer ${
        active
          ? "border font-semibold shadow-2xs"
          : "border border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 font-medium"
      }`}
      style={active ? activeStyle : undefined}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon
          className={`size-[15px] shrink-0 ${
            active ? "opacity-100" : "opacity-70"
          }`}
        />
        <span className="truncate">{label}</span>
      </div>

      {badge && (
        <span
          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium shrink-0 ml-1.5 ${
            active
              ? isSuperAdmin
                ? "bg-white/80 text-slate-800 border border-slate-300"
                : "bg-white/60 text-[var(--role-primary)] border border-[var(--role-border)]"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
