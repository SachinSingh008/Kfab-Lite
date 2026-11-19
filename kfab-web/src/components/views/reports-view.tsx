"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { AppUser } from "@/lib/auth-store";
import { ProjectDetailsMonitoringSheet } from "./project-details-monitoring-sheet";
import { ProjectProgressView } from "./project-progress-view";

interface ReportsViewProps {
  currentUser?: AppUser;
  initialTab?: "progress" | "details";
}

export function ReportsView({ currentUser, initialTab = "progress" }: ReportsViewProps) {
  const role = currentUser?.role || "SUPER_ADMIN";
  const isAccountant = role === "ACCOUNTANT" || role === "ACCOUNT";

  // State Management for active tab
  const [activeTab, setActiveTab] = useState<"progress" | "details">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 1. Strict Access Denial for ACCOUNT Role
  if (isAccountant) {
    return (
      <div className="p-8 max-w-4xl mx-auto font-sans">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center shadow-xs">
          <div className="size-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldAlert className="size-8" />
          </div>
          <h2 className="text-xl font-bold text-red-950 mb-2">Access Restricted to Project Operations</h2>
          <p className="text-sm text-red-700 max-w-md mx-auto mb-6">
            The Reports and Project Tracking module is restricted to <strong>Super Admin</strong>, <strong>Admin</strong>, and <strong>Supervisor</strong> roles. Commercial accounting operations are managed under Accounts &amp; Commercial.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100/80 rounded-lg text-xs font-semibold text-red-800">
            Current Role: {role}
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Project Details Monitoring Sheet
  if (activeTab === "details") {
    return (
      <ProjectDetailsMonitoringSheet
        currentUser={currentUser}
        onSwitchToProgress={() => setActiveTab("progress")}
      />
    );
  }

  // 3. Render Project Progress View (100% dependent on Project Details Sheet)
  return (
    <ProjectProgressView
      currentUser={currentUser}
      onSwitchToDetails={() => setActiveTab("details")}
    />
  );
}
