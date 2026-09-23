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
  ShieldCheck,
  LogOut,
  BookOpen,
  DollarSign,
  Building2,
  Layers,
  ChevronRight,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  FileCheck,
  Activity,
  Wrench,
  AlertTriangle,
  Package,
  HardHat,
  Landmark,
  MessageSquare,
} from "lucide-react";
import { AppUser } from "@/lib/auth-store";

export type NavTab =
  | "dashboard"
  | "chat"
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
  const isAccountant = currentUser.role === "ACCOUNTANT";

  // Shrinkable/collapsible full sidebar state
  const [isShrunk, setIsShrunk] = useState(false);

  // Collapsible section categories state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    executive: false,
    operations: false,
    commercial: isSupervisor ? true : false,
    people: isSupervisor ? true : false,
    reports: isSupervisor ? true : false,
    security: isSupervisor || isAccountant ? true : false,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside
      className={`flex-shrink-0 flex flex-col border-r shadow-kfab z-20 select-none transition-all duration-300 ease-in-out ${
        isShrunk ? "w-[72px]" : "w-68"
      }`}
      style={{
        backgroundColor: "var(--role-sidebar-bg)",
        color: "var(--role-sidebar-fg)",
        borderColor: "var(--role-sidebar-border)",
      }}
    >
      {/* 1. Brand & Organization Header */}
      <div
        className="p-3.5 border-b"
        style={{ borderColor: "var(--role-sidebar-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 size-9 rounded-full bg-white flex items-center justify-center p-1 shadow-xs border" style={{ borderColor: "var(--role-sidebar-border)" }}>
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
                    className="text-[17px] font-black tracking-tight"
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
                  className="text-[11px] font-semibold truncate opacity-85"
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

      {/* 2. Navigation Menu */}
      <nav className="flex-1 p-2.5 space-y-3 overflow-y-auto">
        {/* ============================================================ */}
        {/* Executive Section */}
        {/* ============================================================ */}
        <div>
          <SidebarNavItem
            active={currentTab === "dashboard"}
            onClick={() => onSelectTab("dashboard")}
            icon={LayoutDashboard}
            label="Executive Dashboard"
            isShrunk={isShrunk}
          />
          <SidebarNavItem
            active={currentTab === "chat"}
            onClick={() => onSelectTab("chat")}
            icon={MessageSquare}
            label="Team Chat & Channels"
            badge="Live"
            isShrunk={isShrunk}
          />
        </div>

        {/* ============================================================ */}
        {/* Projects & Operations Section (THE SUPERVISOR WORKSPACE) */}
        {/* ============================================================ */}
        <div>
          {!isShrunk ? (
            <button
              type="button"
              onClick={() => toggleSection("operations")}
              className="w-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer group"
              style={{ color: "var(--role-sidebar-section-title)" }}
            >
              <div className="flex items-center gap-1.5">
                <HardHat className="size-3" style={{ color: "var(--role-sidebar-section-title)" }} />
                <span>Projects & Operations</span>
              </div>
              <span
                className="size-4 rounded flex items-center justify-center border transition-colors"
                style={{
                  backgroundColor: "var(--role-sidebar-subtle)",
                  borderColor: "var(--role-sidebar-border)",
                  color: "var(--role-sidebar-fg)",
                }}
              >
                {collapsedSections.operations ? (
                  <ChevronRight className="size-3" />
                ) : (
                  <Minus className="size-3" />
                )}
              </span>
            </button>
          ) : (
            <div
              className="h-2 border-b mb-1"
              style={{ borderColor: "var(--role-sidebar-border)" }}
            />
          )}

          {/* Sub topics with One Tab Space Indentation */}
          {!collapsedSections.operations && (
            <div
              className={`space-y-1 mt-1 ${!isShrunk ? "pl-3.5 border-l-2 ml-2" : ""}`}
              style={{ borderColor: "var(--role-sidebar-subtle)" }}
            >
              <SidebarNavItem
                active={currentTab === "daily-reports"}
                onClick={() => onSelectTab("daily-reports")}
                icon={FileCheck}
                label="Daily Reports (DPR)"
                badge={isSupervisor ? "Primary" : undefined}
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "production"}
                onClick={() => onSelectTab("production")}
                icon={Activity}
                label="Bay Production & Tonnage"
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "attendance"}
                onClick={() => onSelectTab("attendance")}
                icon={CalendarCheck}
                label="Worker Muster & Shifts"
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "stock"}
                onClick={() => onSelectTab("stock")}
                icon={Boxes}
                label="Stores & Raw Steel Stock"
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "machines"}
                onClick={() => onSelectTab("machines")}
                icon={Wrench}
                label="Machinery & Cranes"
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "qaqc"}
                onClick={() => onSelectTab("qaqc")}
                icon={ShieldCheck}
                label="QA/QC & Weld Inspections"
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "issues"}
                onClick={() => onSelectTab("issues")}
                icon={AlertTriangle}
                label="Shop Floor Issues"
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "requirements"}
                onClick={() => onSelectTab("requirements")}
                icon={Package}
                label="Material Requisitions"
                isShrunk={isShrunk}
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Accounts & Commercial Section (THE ACCOUNTANT WORKSPACE) */}
        {/* ============================================================ */}
        <div>
          {!isShrunk ? (
            <button
              type="button"
              onClick={() => toggleSection("commercial")}
              className="w-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer group"
              style={{ color: "var(--role-sidebar-section-title)" }}
            >
              <div className="flex items-center gap-1.5">
                <Landmark className="size-3" style={{ color: "var(--role-sidebar-section-title)" }} />
                <span>Accounts & Commercial</span>
              </div>
              <span
                className="size-4 rounded flex items-center justify-center border transition-colors"
                style={{
                  backgroundColor: "var(--role-sidebar-subtle)",
                  borderColor: "var(--role-sidebar-border)",
                  color: "var(--role-sidebar-fg)",
                }}
              >
                {collapsedSections.commercial ? (
                  <ChevronRight className="size-3" />
                ) : (
                  <Minus className="size-3" />
                )}
              </span>
            </button>
          ) : (
            <div
              className="h-2 border-b mb-1"
              style={{ borderColor: "var(--role-sidebar-border)" }}
            />
          )}

          {/* Sub topics with One Tab Space Indentation */}
          {!collapsedSections.commercial && (
            <div
              className={`space-y-1 mt-1 ${!isShrunk ? "pl-3.5 border-l-2 ml-2" : ""}`}
              style={{ borderColor: "var(--role-sidebar-subtle)" }}
            >
              <SidebarNavItem
                active={currentTab === "accounts"}
                onClick={() => onSelectTab("accounts")}
                icon={DollarSign}
                label="Accounts & 3-Way Match"
                badge={isAccountant ? "Priority" : undefined}
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "ledger"}
                onClick={() => onSelectTab("ledger")}
                icon={BookOpen}
                label="Atomic Stock Ledger"
                isShrunk={isShrunk}
              />
              <SidebarNavItem
                active={currentTab === "supplies"}
                onClick={() => onSelectTab("supplies")}
                icon={Truck}
                label="Inward Goods & Challans"
                isShrunk={isShrunk}
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* People & Workforce Section */}
        {/* ============================================================ */}
        <div>
          {!isShrunk ? (
            <button
              type="button"
              onClick={() => toggleSection("people")}
              className="w-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer group"
              style={{ color: "var(--role-sidebar-section-title)" }}
            >
              <div className="flex items-center gap-1.5">
                <Users className="size-3" style={{ color: "var(--role-sidebar-section-title)" }} />
                <span>People & HR</span>
              </div>
              <span
                className="size-4 rounded flex items-center justify-center border transition-colors"
                style={{
                  backgroundColor: "var(--role-sidebar-subtle)",
                  borderColor: "var(--role-sidebar-border)",
                  color: "var(--role-sidebar-fg)",
                }}
              >
                {collapsedSections.people ? (
                  <ChevronRight className="size-3" />
                ) : (
                  <Minus className="size-3" />
                )}
              </span>
            </button>
          ) : (
            <div
              className="h-2 border-b mb-1"
              style={{ borderColor: "var(--role-sidebar-border)" }}
            />
          )}

          {!collapsedSections.people && (
            <div
              className={`space-y-1 mt-1 ${!isShrunk ? "pl-3.5 border-l-2 ml-2" : ""}`}
              style={{ borderColor: "var(--role-sidebar-subtle)" }}
            >
              <SidebarNavItem
                active={currentTab === "employees"}
                onClick={() => onSelectTab("employees")}
                icon={Users}
                label="Personnel Directory"
                isShrunk={isShrunk}
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Reports Section */}
        {/* ============================================================ */}
        <div>
          <SidebarNavItem
            active={currentTab === "reports"}
            onClick={() => onSelectTab("reports")}
            icon={FileSpreadsheet}
            label="Enterprise Reports & Excel"
            isShrunk={isShrunk}
          />
        </div>

        {/* ============================================================ */}
        {/* Configuration & Security Section */}
        {/* ============================================================ */}
        {(isSuperAdmin || isAdmin) && (
          <div>
            {!isShrunk ? (
              <button
                type="button"
                onClick={() => toggleSection("security")}
                className="w-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer group"
                style={{ color: "var(--role-sidebar-section-title)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Settings className="size-3" style={{ color: "var(--role-sidebar-section-title)" }} />
                  <span>Administration & Security</span>
                </div>
                <span
                  className="size-4 rounded flex items-center justify-center border transition-colors"
                  style={{
                    backgroundColor: "var(--role-sidebar-subtle)",
                    borderColor: "var(--role-sidebar-border)",
                    color: "var(--role-sidebar-fg)",
                  }}
                >
                  {collapsedSections.security ? (
                    <ChevronRight className="size-3" />
                  ) : (
                    <Minus className="size-3" />
                  )}
                </span>
              </button>
            ) : (
              <div
                className="h-2 border-b mb-1"
                style={{ borderColor: "var(--role-sidebar-border)" }}
              />
            )}

            {/* Sub topics with One Tab Space Indentation */}
            {!collapsedSections.security && (
              <div
                className={`space-y-1 mt-1 ${!isShrunk ? "pl-3.5 border-l-2 ml-2" : ""}`}
                style={{ borderColor: "var(--role-sidebar-subtle)" }}
              >
                <SidebarNavItem
                  active={currentTab === "users"}
                  onClick={() => onSelectTab("users")}
                  icon={ShieldCheck}
                  label="User Management"
                  badge="RBAC"
                  isShrunk={isShrunk}
                />
                <SidebarNavItem
                  active={currentTab === "settings"}
                  onClick={() => onSelectTab("settings")}
                  icon={Settings}
                  label="Plant Configuration"
                  isShrunk={isShrunk}
                />
              </div>
            )}
          </div>
        )}
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

interface SidebarNavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  isShrunk?: boolean;
}

function SidebarNavItem({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
  isShrunk = false,
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      title={isShrunk ? label : undefined}
      className={`relative w-full flex items-center ${
        isShrunk ? "justify-center p-2.5" : "justify-between px-3 py-2"
      } rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer overflow-hidden group ${
        active ? "shadow-md font-bold" : "hover:opacity-90"
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
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-full shadow-sm"
          style={{ backgroundColor: "var(--role-sidebar-item-active-accent)" }}
        />
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="size-4 shrink-0 transition-colors" />
        {!isShrunk && <span className="truncate">{label}</span>}
      </div>

      {!isShrunk && badge && (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
          style={
            active
              ? {
                  backgroundColor: "rgba(0, 0, 0, 0.15)",
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
