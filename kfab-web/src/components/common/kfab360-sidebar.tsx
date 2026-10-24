"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  CalendarCheck,
  Boxes,
  Truck,
  Users,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  LogOut,
  BookOpen,
  DollarSign,
  Building2,
  Layers,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Package,
  Landmark,
  MessageSquare,
  FileText,
  BarChart3,
  HardHat,
  FileCode2,
  Minus,
  Plus,
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
  | "settings";

interface Kfab360SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: AppUser;
  onLogout: () => void;
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

  // Role visibility permissions:
  // - Dashboard: user role specific (all)
  // - Logs: as it is (all)
  // - Inventory: for all
  const canSeeInventory = true;
  // - Reports: for supervisor admin and superadmin
  const canSeeReports = isSupervisor || isAdmin || isSuperAdmin;
  // - Accounts: for acc admin and superadmin
  const canSeeAccounts = isAccountant || isAdmin || isSuperAdmin;
  // - People and hr: for acc admin and superadmin
  const canSeePeople = isAccountant || isAdmin || isSuperAdmin;
  // - Workbook: visible for acc admin and superadmin
  const canSeeWorkbooks = isAccountant || isAdmin || isSuperAdmin;
  // - Admin and security: visible for admin and superadmin
  const canSeeSecurity = isAdmin || isSuperAdmin;

  // Shrinkable/collapsible full sidebar state
  const [isShrunk, setIsShrunk] = useState(false);

  // Antigravity Explorer Collapsible Folders State (only for categories with multiple children)
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    inventory: true,
    reports: true,
    accounts: true,
    people: true,
    workbooks: true,
    security: true,
  });

  const toggleFolder = (folderKey: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  const collapseAllFolders = () => {
    setOpenFolders({
      inventory: false,
      reports: false,
      accounts: false,
      people: false,
      workbooks: false,
      security: false,
    });
  };

  const expandAllFolders = () => {
    setOpenFolders({
      inventory: true,
      reports: true,
      accounts: true,
      people: true,
      workbooks: true,
      security: true,
    });
  };

  const areAnyOpen = Object.values(openFolders).some(Boolean);

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
    }
  }, [currentUser.role, currentTab, canSeeReports, canSeeAccounts, canSeePeople, canSeeSecurity, onSelectTab]);

  // Role-specific dashboard name
  const getRoleDashboardLabel = () => {
    if (isSuperAdmin) return "Executive Operations";
    if (isAdmin) return "Plant Administration";
    if (isSupervisor) return "Fabrication & Bay Operations";
    if (isAccountant) return "Financial & Accounts Ledger";
    return "Operations Overview";
  };

  return (
    <aside
      className={`flex-shrink-0 flex flex-col border-r shadow-kfab z-20 select-none transition-all duration-300 ease-in-out ${
        isShrunk ? "w-[72px]" : "w-72"
      }`}
      style={{
        backgroundColor: "var(--role-sidebar-bg)",
        color: "var(--role-sidebar-fg)",
        borderColor: "var(--role-sidebar-border)",
      }}
    >
      {/* 1. Brand & Plant Header */}
      <div
        className="p-3.5 border-b"
        style={{ borderColor: "var(--role-sidebar-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="shrink-0 size-9 rounded-full bg-white flex items-center justify-center p-1 shadow-xs border"
              style={{ borderColor: "var(--role-sidebar-border)" }}
            >
              <Image
                src="/logo.png"
                alt="KFAB360 Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            {!isShrunk && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1
                    className="text-[16px] font-black tracking-tight"
                    style={{ color: "var(--role-sidebar-fg)" }}
                  >
                    KFAB<span style={{ color: "var(--role-accent)" }}>360</span>
                  </h1>
                  <span
                    className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border"
                    style={{
                      backgroundColor: "var(--role-badge-bg)",
                      color: "var(--role-badge-text)",
                      borderColor: "var(--role-border)",
                    }}
                  >
                    {isSuperAdmin ? "PRO" : currentUser.role.replace("_", " ")}
                  </span>
                </div>
                <p
                  className="text-[10px] font-semibold truncate opacity-85"
                  style={{ color: "var(--role-sidebar-section-title)" }}
                >
                  Heavy Steel Fabrication ERP
                </p>
              </div>
            )}
          </div>

          {/* Toggle Sidebar Shrink Button */}
          <button
            onClick={() => setIsShrunk(!isShrunk)}
            title={isShrunk ? "Expand Sidebar" : "Shrink Sidebar"}
            className="p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 opacity-70 hover:opacity-100"
            style={{ color: "var(--role-sidebar-fg)" }}
          >
            {isShrunk ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        {/* Plant Facility Badge (hidden when shrunk) */}
        {!isShrunk && (
          <div
            className="mt-3 px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-[11px]"
            style={{
              backgroundColor: "var(--role-sidebar-subtle)",
              borderColor: "var(--role-sidebar-border)",
              color: "var(--role-sidebar-fg)",
            }}
          >
            <span className="flex items-center gap-1.5 font-medium truncate">
              <Building2 className="size-3.5 opacity-70 shrink-0" />
              <span className="truncate">Jejuri Plant • MIDC Pune</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
              ONLINE
            </span>
          </div>
        )}
      </div>

      {/* Explorer Section Title (Antigravity IDE style) with Collapse All Minus Option */}
      {!isShrunk && (
        <div
          className="px-3.5 py-2 border-b flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest"
          style={{
            borderColor: "var(--role-sidebar-border)",
            color: "var(--role-sidebar-section-title)",
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <FileCode2 className="size-3.5 opacity-80" />
            <span className="truncate">Workspace Explorer</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Minus Option to Minimize All Files/Folders */}
            <button
              type="button"
              onClick={collapseAllFolders}
              title="Minimize All Folders & Files (Collapse All)"
              className="p-1 rounded hover:bg-[var(--role-sidebar-item-hover-bg)] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer flex items-center gap-1 group"
            >
              <Minus className="size-3.5 stroke-[2.5] group-hover:scale-110 transition-transform" />
              <span className="text-[9px] lowercase font-semibold opacity-80">minimize all</span>
            </button>

            {/* Expand Option when everything is minimized */}
            {!areAnyOpen && (
              <button
                type="button"
                onClick={expandAllFolders}
                title="Expand All Folders"
                className="p-1 rounded hover:bg-[var(--role-sidebar-item-hover-bg)] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Navigation Explorer Tree */}
      <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {/* ============================================================ */}
        {/* 1. DASHBOARD — USER ROLE SPECIFIC (Single Item, no folder) */}
        {/* ============================================================ */}
        <RootFileItem
          active={currentTab === "dashboard"}
          onClick={() => onSelectTab("dashboard")}
          icon={LayoutDashboard}
          label={getRoleDashboardLabel()}
          isShrunk={isShrunk}
        />

        {/* ============================================================ */}
        {/* 2. LOGS — AS IT IS (Single Item, no folder) */}
        {/* ============================================================ */}
        <RootFileItem
          active={currentTab === "logs"}
          onClick={() => onSelectTab("logs")}
          icon={FileText}
          label="Operational Activity Logs"
          isShrunk={isShrunk}
        />

        {/* ============================================================ */}
        {/* 3. INVENTORY — FOR ALL */}
        {/* ============================================================ */}
        {canSeeInventory && (
          <TreeFolder
            label="Inventory"
            isOpen={openFolders.inventory}
            onToggle={() => toggleFolder("inventory")}
            isShrunk={isShrunk}
            icon={Boxes}
          >
            <TreeFileItem
              active={currentTab === "inventory"}
              onClick={() => onSelectTab("inventory")}
              icon={Boxes}
              label="Inventory Master"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "stock"}
              onClick={() => onSelectTab("stock")}
              icon={Package}
              label="Raw Material Stock"
              isShrunk={isShrunk}
            />
          </TreeFolder>
        )}

        {/* ============================================================ */}
        {/* 4. REPORTS — FOR SUPERVISOR, ADMIN AND SUPERADMIN */}
        {/* ============================================================ */}
        {canSeeReports && (
          <TreeFolder
            label="Reports"
            isOpen={openFolders.reports}
            onToggle={() => toggleFolder("reports")}
            isShrunk={isShrunk}
            icon={BarChart3}
          >
            <TreeFileItem
              active={currentTab === "reports-progress" || currentTab === "reports"}
              onClick={() => onSelectTab("reports-progress")}
              icon={Activity}
              label="Project Progress"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "reports-details"}
              onClick={() => onSelectTab("reports-details")}
              icon={Layers}
              label="Project Details"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "daily-reports"}
              onClick={() => onSelectTab("daily-reports")}
              icon={HardHat}
              label="Daily Shift Reports (DPR)"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "production"}
              onClick={() => onSelectTab("production")}
              icon={Layers}
              label="Fabrication Production"
              isShrunk={isShrunk}
            />
          </TreeFolder>
        )}

        {/* ============================================================ */}
        {/* 5. ACCOUNTS — FOR ACC, ADMIN AND SUPERADMIN */}
        {/* ============================================================ */}
        {canSeeAccounts && (
          <TreeFolder
            label="Accounts"
            isOpen={openFolders.accounts}
            onToggle={() => toggleFolder("accounts")}
            isShrunk={isShrunk}
            icon={Landmark}
          >
            <TreeFileItem
              active={currentTab === "accounts"}
              onClick={() => onSelectTab("accounts")}
              icon={DollarSign}
              label="Accounts & 3-Way Match"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "ledger"}
              onClick={() => onSelectTab("ledger")}
              icon={BookOpen}
              label="Atomic Stock Ledger"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "supplies"}
              onClick={() => onSelectTab("supplies")}
              icon={Truck}
              label="Inward Goods & Challans"
              isShrunk={isShrunk}
            />
          </TreeFolder>
        )}

        {/* ============================================================ */}
        {/* 6. PEOPLE AND HR — FOR ACC, ADMIN AND SUPERADMIN */}
        {/* ============================================================ */}
        {canSeePeople && (
          <TreeFolder
            label="People & HR"
            isOpen={openFolders.people}
            onToggle={() => toggleFolder("people")}
            isShrunk={isShrunk}
            icon={Users}
          >
            <TreeFileItem
              active={currentTab === "employees"}
              onClick={() => onSelectTab("employees")}
              icon={Users}
              label="Personnel Directory"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "attendance"}
              onClick={() => onSelectTab("attendance")}
              icon={CalendarCheck}
              label="Attendance Roster"
              isShrunk={isShrunk}
            />
          </TreeFolder>
        )}

        {/* ============================================================ */}
        {/* 7. WORKBOOK — VISIBLE FOR ACC, ADMIN AND SUPERADMIN */}
        {/* ============================================================ */}
        {canSeeWorkbooks && (
          <TreeFolder
            label="Workbooks"
            isOpen={openFolders.workbooks}
            onToggle={() => toggleFolder("workbooks")}
            isShrunk={isShrunk}
            icon={FileSpreadsheet}
          >
            <TreeFileItem
              active={currentTab === "attendance"}
              onClick={() => onSelectTab("attendance")}
              icon={FileSpreadsheet}
              label="Attendance Workbook"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "inventory-workbook"}
              onClick={() => onSelectTab("inventory-workbook")}
              icon={FileSpreadsheet}
              label="Inventory Spreadsheet"
              isShrunk={isShrunk}
            />
          </TreeFolder>
        )}

        {/* ============================================================ */}
        {/* 8. ADMIN AND SECURITY — FOR ADMIN AND SUPERADMIN */}
        {/* ============================================================ */}
        {canSeeSecurity && (
          <TreeFolder
            label="Admin & Security"
            isOpen={openFolders.security}
            onToggle={() => toggleFolder("security")}
            isShrunk={isShrunk}
            icon={ShieldCheck}
          >
            <TreeFileItem
              active={currentTab === "users"}
              onClick={() => onSelectTab("users")}
              icon={ShieldCheck}
              label="User Management"
              isShrunk={isShrunk}
            />
            <TreeFileItem
              active={currentTab === "settings"}
              onClick={() => onSelectTab("settings")}
              icon={Settings}
              label="Plant Configuration"
              isShrunk={isShrunk}
            />
          </TreeFolder>
        )}

        {/* ============================================================ */}
        {/* TEAM CHAT — SINGLE ITEM (No folder) */}
        {/* ============================================================ */}
        <RootFileItem
          active={currentTab === "chat"}
          onClick={() => onSelectTab("chat")}
          icon={MessageSquare}
          label="Team Channels & Chat"
          isShrunk={isShrunk}
        />
      </nav>

      {/* 3. User Profile & Logout Footer */}
      <div
        className="p-2.5 border-t"
        style={{
          backgroundColor: "var(--role-sidebar-subtle)",
          borderColor: "var(--role-sidebar-border)",
        }}
      >
        <div className={`flex items-center ${isShrunk ? "justify-center" : "justify-between"} gap-2`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="size-9 rounded-full text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs"
              style={{ backgroundColor: "var(--role-primary)" }}
            >
              {(currentUser.name || "U").slice(0, 2).toUpperCase()}
            </div>
            {!isShrunk && (
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--role-sidebar-fg)" }}>
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border"
                    style={{
                      backgroundColor: "var(--role-badge-bg)",
                      color: "var(--role-badge-text)",
                      borderColor: "var(--role-border)",
                    }}
                  >
                    {currentUser.role.replace("_", " ")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isShrunk && (
            <button
              onClick={onLogout}
              title="Sign Out of Session"
              className="p-2 rounded-lg transition-colors cursor-pointer shrink-0 opacity-70 hover:opacity-100"
              style={{ color: "var(--role-sidebar-fg)" }}
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// ANTIGRAVITY IDE STYLE TREE FOLDER COMPONENT (Arrow + Folder + Name)
// ============================================================================

interface TreeFolderProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  isShrunk?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}

function TreeFolder({
  label,
  isOpen,
  onToggle,
  badge,
  isShrunk = false,
  children,
}: TreeFolderProps) {
  if (isShrunk) {
    return <div className="space-y-1">{children}</div>;
  }

  return (
    <div className="select-none mb-1">
      {/* Arrow then Folder then Name (Antigravity Explorer Style) */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-all duration-150 cursor-pointer group hover:bg-[var(--role-sidebar-item-hover-bg)]"
        style={{ color: "var(--role-sidebar-section-title)" }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Arrow Indicator: ChevronRight or ChevronDown */}
          <span className="shrink-0 transition-transform duration-150 text-slate-400 group-hover:text-slate-700 dark:text-slate-500">
            {isOpen ? (
              <ChevronDown className="size-3.5 stroke-[2.5]" />
            ) : (
              <ChevronRight className="size-3.5 stroke-[2.5]" />
            )}
          </span>

          {/* Folder Icon: Open or Closed */}
          {isOpen ? (
            <FolderOpen className="size-4 shrink-0 text-amber-500 fill-amber-400/20" />
          ) : (
            <Folder className="size-4 shrink-0 text-amber-500/80 fill-amber-400/10" />
          )}

          {/* Folder Name */}
          <span
            className="truncate uppercase font-bold tracking-wider text-[11px]"
            style={{ color: "var(--role-sidebar-fg)" }}
          >
            {label}
          </span>
        </div>

        {badge && (
          <span
            className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: "var(--role-sidebar-subtle)",
              color: "var(--role-sidebar-section-title)",
              border: "1px solid var(--role-sidebar-border)",
            }}
          >
            {badge}
          </span>
        )}
      </button>

      {/* Indented Sub-Tree with Antigravity IDE Vertical Guide Line */}
      {isOpen && (
        <div
          className="ml-3.5 pl-2.5 border-l-2 my-0.5 space-y-0.5"
          style={{ borderColor: "var(--role-sidebar-border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ANTIGRAVITY IDE STYLE TREE FILE / LEAF ITEM COMPONENT
// ============================================================================

interface TreeFileItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  isShrunk?: boolean;
}

function TreeFileItem({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
  isShrunk = false,
}: TreeFileItemProps) {
  return (
    <button
      onClick={onClick}
      title={isShrunk ? label : undefined}
      className={`relative w-full flex items-center ${
        isShrunk ? "justify-center p-2.5 rounded-xl" : "justify-between px-2.5 py-1.5 rounded-lg"
      } text-left text-xs transition-all duration-150 cursor-pointer overflow-hidden group ${
        active ? "font-bold shadow-xs" : "font-medium hover:bg-[var(--role-sidebar-item-hover-bg)]"
      }`}
      style={
        active
          ? {
              backgroundColor: "var(--role-sidebar-item-active-bg)",
              color: "var(--role-sidebar-item-active-fg)",
            }
          : {
              color: "var(--role-sidebar-item-fg)",
            }
      }
    >
      {/* Role-themed Accent Indicator Bar on Left Edge */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full"
          style={{ backgroundColor: "var(--role-sidebar-item-active-accent)" }}
        />
      )}

      <div className="flex items-center gap-2 min-w-0">
        <Icon
          className={`size-3.5 shrink-0 transition-opacity ${
            active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
          }`}
        />
        {!isShrunk && <span className="truncate text-[11.5px]">{label}</span>}
      </div>

      {!isShrunk && badge && (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
          style={
            active
              ? {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "inherit",
                }
              : {
                  backgroundColor: "var(--role-sidebar-subtle)",
                  color: "var(--role-sidebar-fg)",
                  border: "1px solid var(--role-sidebar-border)",
                }
          }
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// TOP-LEVEL SINGLE ITEM COMPONENT (For categories with only 1 child: Dashboard, Logs, Chat)
// ============================================================================

interface RootFileItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  isShrunk?: boolean;
}

function RootFileItem({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
  isShrunk = false,
}: RootFileItemProps) {
  return (
    <button
      onClick={onClick}
      title={isShrunk ? label : undefined}
      className={`relative w-full flex items-center ${
        isShrunk ? "justify-center p-2.5 rounded-xl" : "justify-between px-2.5 py-2 rounded-lg"
      } text-left text-xs transition-all duration-150 cursor-pointer overflow-hidden group mb-1 ${
        active
          ? "font-bold shadow-xs"
          : "font-semibold hover:bg-[var(--role-sidebar-item-hover-bg)]"
      }`}
      style={
        active
          ? {
              backgroundColor: "var(--role-sidebar-item-active-bg)",
              color: "var(--role-sidebar-item-active-fg)",
            }
          : {
              color: "var(--role-sidebar-fg)",
            }
      }
    >
      {/* Role-themed Accent Indicator Bar on Left Edge */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-4.5 rounded-r-full"
          style={{ backgroundColor: "var(--role-sidebar-item-active-accent)" }}
        />
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={`size-4 shrink-0 transition-opacity ${
            active ? "opacity-100" : "opacity-75 group-hover:opacity-100"
          }`}
        />
        {!isShrunk && <span className="truncate text-xs">{label}</span>}
      </div>

      {!isShrunk && badge && (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
          style={
            active
              ? {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "inherit",
                }
              : {
                  backgroundColor: "var(--role-sidebar-subtle)",
                  color: "var(--role-sidebar-fg)",
                  border: "1px solid var(--role-sidebar-border)",
                }
          }
        >
          {badge}
        </span>
      )}
    </button>
  );
}
