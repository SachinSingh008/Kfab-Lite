import React, { useState, useEffect, useRef } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Package,
  Landmark,
  MessageSquare,
  FileText,
  BarChart3,
  HardHat,
  Search,
  X,
  Minus,
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

// Maps any tab to its parent category folder key
function getFolderForTab(tab: NavTab): string | null {
  switch (tab) {
    case "inventory":
    case "stock":
      return "inventory";
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
    case "inventory-workbook":
      return "workbooks";
    case "attendance":
      return "people";
    case "users":
    case "settings":
      return "security";
    default:
      return null;
  }
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
  const canSeeInventory = true;
  const canSeeReports = isSupervisor || isAdmin || isSuperAdmin;
  const canSeeAccounts = isAccountant || isAdmin || isSuperAdmin;
  const canSeePeople = isAccountant || isAdmin || isSuperAdmin;
  const canSeeWorkbooks = isAccountant || isAdmin || isSuperAdmin;
  const canSeeSecurity = isAdmin || isSuperAdmin;

  // Shrinkable/collapsible full sidebar state
  const [isShrunk, setIsShrunk] = useState(false);

  // ServiceNow Filter Navigator search query
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ACCORDION STATE: ONLY ONE folder open at a time (remaining all minimized)
  // When openFolder is null, all folders are minimized
  const [openFolder, setOpenFolder] = useState<string | null>(() => {
    return getFolderForTab(currentTab) || "inventory";
  });

  // Whenever the active tab changes, automatically open its parent folder
  // and minimize/close all other folders!
  useEffect(() => {
    const parent = getFolderForTab(currentTab);
    if (parent) {
      setOpenFolder(parent);
    }
  }, [currentTab]);

  // Toggle folder accordion:
  // If clicking the currently open folder -> minimize it (null)
  // If clicking another folder -> open that folder and minimize all others!
  const handleToggleFolder = (folderKey: string) => {
    setOpenFolder((prev) => (prev === folderKey ? null : folderKey));
  };

  const handleMinimizeAll = () => {
    setOpenFolder(null);
  };

  // Keyboard shortcut '/' to quickly focus the ServiceNow Filter Navigator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !isShrunk
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShrunk]);

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

  // Search filter helper to check if text matches
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.trim().toLowerCase());
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <aside
      className={`flex-shrink-0 flex flex-col border-r shadow-kfab z-20 select-none transition-all duration-300 ease-in-out ${
        isShrunk ? "w-[72px]" : "w-[280px]"
      }`}
      style={{
        backgroundColor: "var(--role-sidebar-bg)",
        color: "var(--role-sidebar-fg)",
        borderColor: "var(--role-sidebar-border)",
      }}
    >
      {/* ============================================================ */}
      {/* 1. SERVICENOW STYLE APPLICATION HEADER */}
      {/* ============================================================ */}
      <div
        className="p-3 border-b flex flex-col gap-2.5"
        style={{ borderColor: "var(--role-sidebar-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Brand Logo with Elevation Badge */}
            <div
              className="shrink-0 size-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-xs border transition-transform duration-200 hover:scale-105"
              style={{ borderColor: "var(--role-sidebar-border)" }}
            >
              <Image
                src="/logo.png"
                alt="KFAB360 Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>

            {!isShrunk && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1
                    className="text-[15px] font-black tracking-tight"
                    style={{ color: "var(--role-sidebar-fg)" }}
                  >
                    KFAB<span style={{ color: "var(--role-accent)" }}>360</span>
                  </h1>
                  <span
                    className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full tracking-wider border"
                    style={{
                      backgroundColor: "var(--role-badge-bg)",
                      color: "var(--role-badge-text)",
                      borderColor: "var(--role-border)",
                    }}
                  >
                    {isSuperAdmin ? "ENTERPRISE" : currentUser.role.replace("_", " ")}
                  </span>
                </div>
                <p
                  className="text-[10.5px] font-medium truncate opacity-75 leading-tight"
                  style={{ color: "var(--role-sidebar-section-title)" }}
                >
                  Heavy Steel Fabrication ERP
                </p>
              </div>
            )}
          </div>

          {/* Toggle Sidebar Shrink/Expand Button */}
          <button
            onClick={() => setIsShrunk(!isShrunk)}
            title={isShrunk ? "Expand Navigation" : "Collapse Navigation"}
            className="p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 opacity-70 hover:opacity-100 hover:bg-[var(--role-sidebar-item-hover-bg)]"
            style={{ color: "var(--role-sidebar-fg)" }}
          >
            {isShrunk ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        {/* Plant Facility Status Pill (Hidden when Shrunk) */}
        {!isShrunk && (
          <div
            className="px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-[11px] shadow-2xs"
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
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
              <span className="size-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              LIVE
            </span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. SERVICENOW FILTER NAVIGATOR (Search Input) */}
      {/* ============================================================ */}
      {!isShrunk && (
        <div
          className="px-2.5 pt-2.5 pb-2 border-b"
          style={{ borderColor: "var(--role-sidebar-border)" }}
        >
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter navigator..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border transition-all duration-150 outline-none placeholder:text-slate-400 font-medium"
              style={{
                backgroundColor: "var(--role-sidebar-subtle)",
                borderColor: searchQuery ? "var(--role-accent)" : "var(--role-sidebar-border)",
                color: "var(--role-sidebar-fg)",
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 p-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Clear filter"
              >
                <X className="size-3 stroke-[2.5]" />
              </button>
            ) : (
              <span
                className="absolute right-2 text-[9.5px] font-mono px-1 py-0.2 rounded border text-slate-400 pointer-events-none"
                style={{
                  backgroundColor: "var(--role-sidebar-bg)",
                  borderColor: "var(--role-sidebar-border)",
                }}
              >
                /
              </span>
            )}
          </div>

          {/* ServiceNow Header Ribbon: Modules / Accordion Controls */}
          <div className="mt-2 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
            <span style={{ color: "var(--role-sidebar-section-title)" }}>
              {isSearching ? "FILTER RESULTS" : "APPLICATION NAVIGATOR"}
            </span>
            <div className="flex items-center gap-1.5">
              {openFolder !== null && !isSearching && (
                <button
                  type="button"
                  onClick={handleMinimizeAll}
                  title="Minimize Current Folder"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all hover:bg-[var(--role-sidebar-item-hover-bg)] cursor-pointer"
                  style={{ color: "var(--role-sidebar-section-title)" }}
                >
                  <Minus className="size-3 stroke-[2.5]" />
                  <span>minimize</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. NAVIGATION ITEMS & ACCORDION FOLDERS */}
      {/* ============================================================ */}
      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {/* ============================================================ */}
        {/* TOP-LEVEL 1: DASHBOARD (Single Root Item - No Folder) */}
        {/* ============================================================ */}
        {matchesSearch(getRoleDashboardLabel()) && (
          <ServiceNowRootItem
            active={currentTab === "dashboard"}
            onClick={() => onSelectTab("dashboard")}
            icon={LayoutDashboard}
            label={getRoleDashboardLabel()}
            isShrunk={isShrunk}
            badge="LIVE"
          />
        )}

        {/* ============================================================ */}
        {/* TOP-LEVEL 2: LOGS (Single Root Item - No Folder) */}
        {/* ============================================================ */}
        {matchesSearch("Activity & Audit Logs") && (
          <ServiceNowRootItem
            active={currentTab === "logs"}
            onClick={() => onSelectTab("logs")}
            icon={FileText}
            label="Activity & Audit Logs"
            isShrunk={isShrunk}
          />
        )}

        {/* ============================================================ */}
        {/* MODULE CATEGORY 1: INVENTORY (FOR ALL) */}
        {/* ============================================================ */}
        {canSeeInventory && (
          <ServiceNowModuleCategory
            label="Inventory & Stock"
            folderKey="inventory"
            isOpen={isSearching ? true : openFolder === "inventory"}
            onToggle={() => handleToggleFolder("inventory")}
            icon={Boxes}
            count={2}
            isShrunk={isShrunk}
            isActiveParent={["inventory", "stock"].includes(currentTab)}
          >
            {matchesSearch("Inventory Master") && (
              <ServiceNowModuleItem
                active={currentTab === "inventory"}
                onClick={() => onSelectTab("inventory")}
                icon={Boxes}
                label="Inventory Master"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Raw Material Stock") && (
              <ServiceNowModuleItem
                active={currentTab === "stock"}
                onClick={() => onSelectTab("stock")}
                icon={Package}
                label="Raw Material Stock"
                isShrunk={isShrunk}
              />
            )}
          </ServiceNowModuleCategory>
        )}

        {/* ============================================================ */}
        {/* MODULE CATEGORY 2: REPORTS (SUPERVISOR, ADMIN, SUPERADMIN) */}
        {/* ============================================================ */}
        {canSeeReports && (
          <ServiceNowModuleCategory
            label="Project & Shift Reports"
            folderKey="reports"
            isOpen={isSearching ? true : openFolder === "reports"}
            onToggle={() => handleToggleFolder("reports")}
            icon={BarChart3}
            count={4}
            isShrunk={isShrunk}
            isActiveParent={[
              "reports-progress",
              "reports",
              "reports-details",
              "daily-reports",
              "production",
            ].includes(currentTab)}
          >
            {matchesSearch("Project Progress") && (
              <ServiceNowModuleItem
                active={currentTab === "reports-progress" || currentTab === "reports"}
                onClick={() => onSelectTab("reports-progress")}
                icon={Activity}
                label="Project Progress"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Project Details") && (
              <ServiceNowModuleItem
                active={currentTab === "reports-details"}
                onClick={() => onSelectTab("reports-details")}
                icon={Layers}
                label="Project Details"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Daily Shift Reports (DPR)") && (
              <ServiceNowModuleItem
                active={currentTab === "daily-reports"}
                onClick={() => onSelectTab("daily-reports")}
                icon={HardHat}
                label="Daily Shift Reports (DPR)"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Fabrication Production") && (
              <ServiceNowModuleItem
                active={currentTab === "production"}
                onClick={() => onSelectTab("production")}
                icon={Layers}
                label="Fabrication Production"
                isShrunk={isShrunk}
              />
            )}
          </ServiceNowModuleCategory>
        )}

        {/* ============================================================ */}
        {/* MODULE CATEGORY 3: ACCOUNTS (ACCOUNTS, ADMIN, SUPERADMIN) */}
        {/* ============================================================ */}
        {canSeeAccounts && (
          <ServiceNowModuleCategory
            label="Accounts & Ledger"
            folderKey="accounts"
            isOpen={isSearching ? true : openFolder === "accounts"}
            onToggle={() => handleToggleFolder("accounts")}
            icon={Landmark}
            count={3}
            isShrunk={isShrunk}
            isActiveParent={["accounts", "ledger", "supplies"].includes(currentTab)}
          >
            {matchesSearch("Accounts & 3-Way Match") && (
              <ServiceNowModuleItem
                active={currentTab === "accounts"}
                onClick={() => onSelectTab("accounts")}
                icon={DollarSign}
                label="Accounts & 3-Way Match"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Atomic Stock Ledger") && (
              <ServiceNowModuleItem
                active={currentTab === "ledger"}
                onClick={() => onSelectTab("ledger")}
                icon={BookOpen}
                label="Atomic Stock Ledger"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Inward Goods & Challans") && (
              <ServiceNowModuleItem
                active={currentTab === "supplies"}
                onClick={() => onSelectTab("supplies")}
                icon={Truck}
                label="Inward Goods & Challans"
                isShrunk={isShrunk}
              />
            )}
          </ServiceNowModuleCategory>
        )}

        {/* ============================================================ */}
        {/* MODULE CATEGORY 4: PEOPLE & HR (ACCOUNTS, ADMIN, SUPERADMIN) */}
        {/* ============================================================ */}
        {canSeePeople && (
          <ServiceNowModuleCategory
            label="People & Workforce"
            folderKey="people"
            isOpen={isSearching ? true : openFolder === "people"}
            onToggle={() => handleToggleFolder("people")}
            icon={Users}
            count={2}
            isShrunk={isShrunk}
            isActiveParent={["employees", "attendance"].includes(currentTab)}
          >
            {matchesSearch("Personnel Directory") && (
              <ServiceNowModuleItem
                active={currentTab === "employees"}
                onClick={() => onSelectTab("employees")}
                icon={Users}
                label="Personnel Directory"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Attendance Roster") && (
              <ServiceNowModuleItem
                active={currentTab === "attendance"}
                onClick={() => onSelectTab("attendance")}
                icon={CalendarCheck}
                label="Attendance Roster"
                isShrunk={isShrunk}
              />
            )}
          </ServiceNowModuleCategory>
        )}

        {/* ============================================================ */}
        {/* MODULE CATEGORY 5: WORKBOOKS (ACCOUNTS, ADMIN, SUPERADMIN) */}
        {/* ============================================================ */}
        {canSeeWorkbooks && (
          <ServiceNowModuleCategory
            label="Spreadsheet Workbooks"
            folderKey="workbooks"
            isOpen={isSearching ? true : openFolder === "workbooks"}
            onToggle={() => handleToggleFolder("workbooks")}
            icon={FileSpreadsheet}
            count={2}
            isShrunk={isShrunk}
            isActiveParent={["attendance", "inventory-workbook"].includes(currentTab)}
          >
            {matchesSearch("Attendance Workbook") && (
              <ServiceNowModuleItem
                active={currentTab === "attendance"}
                onClick={() => onSelectTab("attendance")}
                icon={FileSpreadsheet}
                label="Attendance Workbook"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Inventory Spreadsheet") && (
              <ServiceNowModuleItem
                active={currentTab === "inventory-workbook"}
                onClick={() => onSelectTab("inventory-workbook")}
                icon={FileSpreadsheet}
                label="Inventory Spreadsheet"
                isShrunk={isShrunk}
              />
            )}
          </ServiceNowModuleCategory>
        )}

        {/* ============================================================ */}
        {/* MODULE CATEGORY 6: ADMIN & SECURITY (ADMIN, SUPERADMIN) */}
        {/* ============================================================ */}
        {canSeeSecurity && (
          <ServiceNowModuleCategory
            label="System & Security"
            folderKey="security"
            isOpen={isSearching ? true : openFolder === "security"}
            onToggle={() => handleToggleFolder("security")}
            icon={ShieldCheck}
            count={2}
            isShrunk={isShrunk}
            isActiveParent={["users", "settings"].includes(currentTab)}
          >
            {matchesSearch("User Management") && (
              <ServiceNowModuleItem
                active={currentTab === "users"}
                onClick={() => onSelectTab("users")}
                icon={ShieldCheck}
                label="User Management"
                isShrunk={isShrunk}
              />
            )}
            {matchesSearch("Plant Configuration") && (
              <ServiceNowModuleItem
                active={currentTab === "settings"}
                onClick={() => onSelectTab("settings")}
                icon={Settings}
                label="Plant Configuration"
                isShrunk={isShrunk}
              />
            )}
          </ServiceNowModuleCategory>
        )}

        {/* ============================================================ */}
        {/* TOP-LEVEL 3: TEAM CHAT (Single Root Item - No Folder) */}
        {/* ============================================================ */}
        {matchesSearch("Team Channels & Chat") && (
          <ServiceNowRootItem
            active={currentTab === "chat"}
            onClick={() => onSelectTab("chat")}
            icon={MessageSquare}
            label="Team Channels & Chat"
            isShrunk={isShrunk}
          />
        )}
      </nav>

      {/* ============================================================ */}
      {/* 4. SERVICENOW USER PROFILE & LOGOUT FOOTER */}
      {/* ============================================================ */}
      <div
        className="p-2.5 border-t"
        style={{
          backgroundColor: "var(--role-sidebar-subtle)",
          borderColor: "var(--role-sidebar-border)",
        }}
      >
        <div className={`flex items-center ${isShrunk ? "justify-center" : "justify-between"} gap-2`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* User Avatar with Status Indicator */}
            <div className="relative shrink-0">
              <div
                className="size-9 rounded-xl text-white font-bold flex items-center justify-center text-xs shadow-xs"
                style={{ backgroundColor: "var(--role-primary)" }}
              >
                {(currentUser.name || "U").slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#16A34A] border-2 border-white ring-1 ring-[#BBF7D0]" />
            </div>

            {!isShrunk && (
              <div className="min-w-0">
                <p className="text-xs font-bold truncate leading-tight" style={{ color: "var(--role-sidebar-fg)" }}>
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider border"
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

          {/* Quick Sign Out Action */}
          {!isShrunk && (
            <button
              onClick={onLogout}
              title="Sign Out of Session"
              className="p-2 rounded-lg transition-all duration-150 cursor-pointer shrink-0 opacity-70 hover:opacity-100 hover:bg-[var(--role-sidebar-item-hover-bg)]"
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
// SERVICENOW STYLE ACCORDION MODULE CATEGORY (Application Menu)
// ============================================================================

interface ServiceNowModuleCategoryProps {
  label: string;
  folderKey: string;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  isShrunk?: boolean;
  isActiveParent?: boolean;
  children?: React.ReactNode;
}

function ServiceNowModuleCategory({
  label,
  isOpen,
  onToggle,
  icon: Icon,
  count,
  isShrunk = false,
  isActiveParent = false,
  children,
}: ServiceNowModuleCategoryProps) {
  if (isShrunk) {
    return <div className="space-y-1">{children}</div>;
  }

  return (
    <div className="select-none mb-1">
      {/* ServiceNow Application Menu Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
          isOpen
            ? "bg-[var(--role-sidebar-subtle)] font-bold shadow-2xs border border-[var(--role-sidebar-border)]/70"
            : "hover:bg-[var(--role-sidebar-item-hover-bg)] font-semibold border border-transparent"
        }`}
        style={{
          color: isOpen ? "var(--role-sidebar-fg)" : "var(--role-sidebar-section-title)",
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Rotating Chevron Indicator */}
          <span
            className={`shrink-0 transition-transform duration-200 ${
              isOpen
                ? "rotate-90 text-[var(--role-accent)]"
                : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500"
            }`}
          >
            <ChevronRight className="size-3.5 stroke-[2.5]" />
          </span>

          {/* ServiceNow Domain Icon Frame */}
          <div
            className={`size-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isOpen
                ? "bg-[var(--role-primary)] text-white shadow-2xs"
                : "bg-[var(--role-sidebar-subtle)] text-[var(--role-sidebar-fg)] border border-[var(--role-sidebar-border)]/80 group-hover:border-[var(--role-accent)]"
            }`}
          >
            <Icon className="size-3.5 shrink-0" />
          </div>

          {/* Category Title */}
          <span
            className="truncate uppercase text-[11px] tracking-wider"
            style={{ color: "var(--role-sidebar-fg)" }}
          >
            {label}
          </span>
        </div>

        {/* Counter Badge */}
        {count !== undefined && (
          <span
            className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold tracking-wider shrink-0 transition-colors ${
              isOpen
                ? "bg-[var(--role-primary)] text-white"
                : "bg-[var(--role-sidebar-bg)] text-slate-500 border border-[var(--role-sidebar-border)] group-hover:border-slate-300"
            }`}
          >
            {count}
          </span>
        )}
      </button>

      {/* Indented Module Items with ServiceNow Vertical Tree Hierarchy Guide */}
      {isOpen && (
        <div
          className="ml-4 pl-2.5 border-l-2 my-1 space-y-0.5 transition-all duration-200 ease-in-out"
          style={{ borderColor: "var(--role-sidebar-border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SERVICENOW STYLE MODULE ITEM (Sub-Item / Leaf View)
// ============================================================================

interface ServiceNowModuleItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  isShrunk?: boolean;
}

function ServiceNowModuleItem({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
  isShrunk = false,
}: ServiceNowModuleItemProps) {
  return (
    <button
      onClick={onClick}
      title={isShrunk ? label : undefined}
      className={`relative w-full flex items-center ${
        isShrunk ? "justify-center p-2.5 rounded-xl" : "justify-between px-2.5 py-1.5 rounded-lg"
      } text-left text-xs transition-all duration-150 cursor-pointer overflow-hidden group ${
        active
          ? "font-bold shadow-xs"
          : "font-medium hover:bg-[var(--role-sidebar-item-hover-bg)]"
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
      {/* ServiceNow Active Left Accent Indicator Pill */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4.5 rounded-r-full"
          style={{ backgroundColor: "var(--role-sidebar-item-active-accent)" }}
        />
      )}

      <div className="flex items-center gap-2 min-w-0">
        <Icon
          className={`size-3.5 shrink-0 transition-opacity ${
            active ? "opacity-100" : "opacity-65 group-hover:opacity-100"
          }`}
        />
        {!isShrunk && <span className="truncate text-[11.5px]">{label}</span>}
      </div>

      {!isShrunk && badge && (
        <span
          className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0"
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
// SERVICENOW STYLE TOP-LEVEL ROOT ITEM (Dashboard, Logs, Chat)
// ============================================================================

interface ServiceNowRootItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  isShrunk?: boolean;
}

function ServiceNowRootItem({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
  isShrunk = false,
}: ServiceNowRootItemProps) {
  return (
    <button
      onClick={onClick}
      title={isShrunk ? label : undefined}
      className={`relative w-full flex items-center ${
        isShrunk ? "justify-center p-2.5 rounded-xl" : "justify-between px-2.5 py-2 rounded-xl"
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
      {/* ServiceNow Active Left Accent Indicator Pill */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-full"
          style={{ backgroundColor: "var(--role-sidebar-item-active-accent)" }}
        />
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`size-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            active
              ? "bg-[var(--role-sidebar-item-active-accent)] text-white shadow-2xs"
              : "bg-[var(--role-sidebar-subtle)] text-[var(--role-sidebar-fg)] border border-[var(--role-sidebar-border)]/80 group-hover:border-[var(--role-accent)]"
          }`}
        >
          <Icon className="size-3.5 shrink-0" />
        </div>
        {!isShrunk && <span className="truncate text-xs font-semibold">{label}</span>}
      </div>

      {!isShrunk && badge && (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0"
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
