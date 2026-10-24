"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw, Sparkles, Building2 } from "lucide-react";
import { AppUser } from "@/lib/auth-store";
import { StockMaterial, SupplyTransaction } from "@/lib/mock-data";
import {
  DashboardData,
  DashboardPeriod,
  DashboardKPIData,
} from "./dashboard/dashboard-types";
import { DashboardHeader } from "./dashboard/dashboard-header";
import { DashboardKPICards } from "./dashboard/dashboard-kpi-cards";
import { DashboardCompanyTabs } from "./dashboard/dashboard-company-tabs";
import { DashboardTrendsSection } from "./dashboard/dashboard-trends-section";
import { DashboardPeriodReports } from "./dashboard/dashboard-period-reports";
import { DashboardFinancialOverview } from "./dashboard/dashboard-financial-overview";
import { DashboardMaterialConsumption } from "./dashboard/dashboard-material-consumption";
import { DashboardSupervisorView } from "./dashboard/dashboard-supervisor-view";

interface DashboardViewProps {
  currentUser?: AppUser | null;
  stockMaterials: StockMaterial[];
  supplyTransactions: SupplyTransaction[];
  sampleDataActive?: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenQuickInward?: () => void;
}

// Resilient authoritative initial data fallback
const DEFAULT_INITIAL_DASHBOARD: DashboardData = {
  activeCompanyId: "c0000000-0000-0000-0000-000000000001",
  authorizedCompanies: [
    { id: "c0000000-0000-0000-0000-000000000001", name: "KFab Infra Project Pvt Ltd", code: "KFAB-INFR" },
    { id: "c0000000-0000-0000-0000-000000000002", name: "KFab Heavy Engineering Works", code: "KFAB-HVY" },
    { id: "c0000000-0000-0000-0000-000000000003", name: "KFab Structural Systems Ltd", code: "KFAB-STR" },
  ],
  kpiCards: {
    attendance: {
      presentToday: 9,
      absentToday: 2,
      odToday: 1,
      totalEmployees: 12,
      turnoutRate: 75.0,
      date: new Date().toISOString().split("T")[0],
    },
    projects: {
      totalActive: 4,
      onTrack: 2,
      delayed: 2,
      completed: 1,
    },
    emergencies: {
      openCritical: 2,
      highPriority: 2,
      overdueUnresolved: 1,
      resolvedPeriod: 4,
    },
    bills: {
      isAuthorized: true,
      billsPending: 4,
      billsOverdue: 1,
      amountReceivable: 3850000,
      amountPayable: 1420000,
      currency: "INR",
    },
  },
  projectProgressTrend: [
    { date: "Day 1", actualProgress: 20, plannedProgress: 25 },
    { date: "Day 5", actualProgress: 35, plannedProgress: 40 },
    { date: "Day 10", actualProgress: 48, plannedProgress: 52 },
    { date: "Day 15", actualProgress: 58, plannedProgress: 60 },
    { date: "Day 20", actualProgress: 65, plannedProgress: 70 },
    { date: "Day 25", actualProgress: 72, plannedProgress: 80 },
  ],
  workforceTrend: [
    { date: "Mon", present: 10, absent: 1, od: 1 },
    { date: "Tue", present: 11, absent: 1, od: 0 },
    { date: "Wed", present: 9, absent: 2, od: 1 },
    { date: "Thu", present: 12, absent: 0, od: 0 },
    { date: "Fri", present: 10, absent: 1, od: 1 },
    { date: "Sat", present: 8, absent: 3, od: 1 },
    { date: "Sun", present: 4, absent: 8, od: 0 },
  ],
  projectSummaryRows: [
    {
      id: "10000000-0000-0000-0000-000000000001",
      projectName: "KFab Plant Structure Extension",
      customerName: "Tata Steel Processing Ltd",
      supervisorName: "Site Supervisor",
      progressPercent: 68,
      plannedPercent: 85,
      endDate: "2026-09-25",
      delayDays: 26,
      isDelayed: true,
      status: "DELAYED",
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      projectName: "Boiler Shell Assembly (Tata Power)",
      customerName: "Tata Power Corporation",
      supervisorName: "Fabrication Lead",
      progressPercent: 42,
      plannedPercent: 60,
      endDate: "2026-10-10",
      delayDays: 11,
      isDelayed: true,
      status: "DELAYED",
    },
    {
      id: "10000000-0000-0000-0000-000000000003",
      projectName: "Storage Silo Fabrication (JSW Steel)",
      customerName: "JSW Steel Works",
      supervisorName: "Site Supervisor",
      progressPercent: 88,
      plannedPercent: 80,
      endDate: "2026-11-15",
      delayDays: 0,
      isDelayed: false,
      status: "IN_PROGRESS",
    },
    {
      id: "10000000-0000-0000-0000-000000000004",
      projectName: "Conveyor Truss Girder Fitup",
      customerName: "Adani Ports & SEZ",
      supervisorName: "Senior Fitter Lead",
      progressPercent: 95,
      plannedPercent: 95,
      endDate: "2026-10-30",
      delayDays: 0,
      isDelayed: false,
      status: "IN_PROGRESS",
    },
  ],
  periodReports: {
    today: {
      attendanceDistribution: [
        { status: "Present", count: 9, color: "#16A34A" },
        { status: "Absent", count: 2, color: "#DC2626" },
        { status: "On Duty (OD)", count: 1, color: "#2563EB" },
      ],
      workCompletedTodayTonnage: 14.8,
      materialIssuedCostToday: 48500,
      newIssuesToday: 2,
      attendanceAnnexure: [
        { employeeName: "Rajesh Kumar", date: new Date().toISOString().split("T")[0], status: "PRESENT", overtimeHours: 2.0 },
        { employeeName: "Amit Sharma", date: new Date().toISOString().split("T")[0], status: "PRESENT", overtimeHours: 1.5 },
        { employeeName: "Suresh Patil", date: new Date().toISOString().split("T")[0], status: "OD", overtimeHours: 0.0, remarks: "Site erection survey" },
        { employeeName: "Vikram Shinde", date: new Date().toISOString().split("T")[0], status: "ABSENT", overtimeHours: 0.0 },
      ],
      projectAnnexure: [
        {
          id: "10000000-0000-0000-0000-000000000001",
          projectName: "KFab Plant Structure Extension",
          customerName: "Tata Steel Processing Ltd",
          supervisorName: "Site Supervisor",
          progressPercent: 68,
          plannedPercent: 85,
          endDate: "2026-09-25",
          delayDays: 26,
          isDelayed: true,
          status: "DELAYED",
        },
      ],
      materialAnnexure: [
        {
          id: "mat-iss-1",
          date: new Date().toISOString().split("T")[0],
          itemCode: "MAT-CH-250",
          itemName: "ISMC 250 Structural Channel",
          category: "CONSUMABLES_TACKLES",
          quantity: 12.0,
          unit: "MTR",
          employeeName: "Rajesh Kumar",
          companyName: "KFab Infra Project Pvt Ltd",
          projectOrDept: "Bay 1 Heavy Fitup",
          issuedBy: "Store In-charge",
          isReturnable: false,
          returnStatus: "N/A",
          unitCost: 1450,
          totalCost: 17400,
        },
      ],
      billsAnnexure: [
        { ref: "INV-2026-081", company: "Tata Steel", date: new Date().toISOString().split("T")[0], amount: 485000, status: "PENDING", dueDate: "2026-11-05" },
        { ref: "INV-2026-079", company: "JSW Steel", date: new Date().toISOString().split("T")[0], amount: 320000, status: "PAID", dueDate: "2026-10-20" },
      ],
    },
    this_week: {
      weeklyTonnage: 86.4,
      weeklyTurnoutRate: 88.5,
      issuesResolvedCount: 4,
      attendanceTrend: [
        { date: "Mon", present: 10, absent: 1, od: 1 },
        { date: "Tue", present: 11, absent: 1, od: 0 },
        { date: "Wed", present: 9, absent: 2, od: 1 },
      ],
      projectAnnexure: [],
    },
    this_month: {
      monthlyTonnage: 342.0,
      monthlyTurnoutRate: 91.2,
      totalConsumptionCost: 685000,
      topItems: {
        byQuantity: [
          { itemName: "Welding Rod 6013 (4.0mm)", itemCode: "CON-WEL-001", unit: "Kg", totalQuantity: 240, totalCost: 52800 },
          { itemName: "Grinding Disc 7 inch", itemCode: "CON-GRN-001", unit: "Nos", totalQuantity: 180, totalCost: 21600 },
        ],
        byCost: [
          { itemName: "ISMC 250 Structural Channel", itemCode: "MAT-CH-250", unit: "MTR", totalQuantity: 85, totalCost: 123250 },
          { itemName: "Welding Rod 6013 (4.0mm)", itemCode: "CON-WEL-001", unit: "Kg", totalQuantity: 240, totalCost: 52800 },
        ],
      },
      projectAnnexure: [],
    },
  },
  financialOverview: {
    isAuthorized: true,
    moneyNeeded: {
      totalPayables: 1420000,
      outstandingSupplierBills: 980000,
      upcomingMaterialPayables: 320000,
      approvedProjectFundingReq: 120000,
    },
    moneyComingIn: {
      totalReceivables: 3850000,
      customerReceivables: 2900000,
      overdueReceivables: 950000,
      paymentsReceivedThisMonth: 1850000,
    },
    moneyConsumed: {
      totalExpensesRecorded: 1150000,
      materialConsumptionCost: 685000,
      directProjectExpenses: 245000,
      inventoryPurchases: 220000,
    },
    financialMovementTrend: [
      { period: "2026-06", moneyComingIn: 1200000, moneyPaidOut: 850000, materialCost: 450000, outstanding: 950000 },
      { period: "2026-07", moneyComingIn: 1600000, moneyPaidOut: 1100000, materialCost: 520000, outstanding: 890000 },
      { period: "2026-08", moneyComingIn: 1400000, moneyPaidOut: 980000, materialCost: 580000, outstanding: 1050000 },
      { period: "2026-09", moneyComingIn: 2100000, moneyPaidOut: 1450000, materialCost: 710000, outstanding: 1250000 },
      { period: "2026-10", moneyComingIn: 1850000, moneyPaidOut: 1150000, materialCost: 685000, outstanding: 1420000 },
    ],
    projectCosting: [
      { projectId: "10000000-0000-0000-0000-000000000001", projectName: "KFab Plant Structure Extension", budget: 4500000, recordedCost: 3200000, remainingBudget: 1300000, costVarianceStatus: "ON_TRACK" },
      { projectId: "10000000-0000-0000-0000-000000000002", projectName: "Boiler Shell Assembly (Tata Power)", budget: 3200000, recordedCost: 2850000, remainingBudget: 350000, costVarianceStatus: "ON_TRACK" },
      { projectId: "10000000-0000-0000-0000-000000000003", projectName: "Storage Silo Fabrication (JSW Steel)", budget: 2800000, recordedCost: 1450000, remainingBudget: 1350000, costVarianceStatus: "ON_TRACK" },
    ],
  },
  materialConsumption: {
    totalIssuedQuantity: 312,
    totalConsumptionCost: 685000,
    topConsumedItems: {
      byQuantity: [
        { itemName: "Welding Rod 6013 (4.0mm)", itemCode: "CON-WEL-001", unit: "Kg", totalQuantity: 240, totalCost: 52800 },
      ],
      byCost: [
        { itemName: "ISMC 250 Structural Channel", itemCode: "MAT-CH-250", unit: "MTR", totalQuantity: 85, totalCost: 123250 },
      ],
    },
    lowStockCount: 3,
    categories: [
      { category: "CONSUMABLES_TACKLES", label: "Consumables & Tackles", itemCount: 12, stockValue: 245000, consumptionCost: 385000, transactionCount: 42 },
      { category: "MACHINES_TOOLS", label: "Machines & Tools", itemCount: 8, stockValue: 680000, consumptionCost: 185000, transactionCount: 18 },
      { category: "CLOTHES_SAFETY", label: "Clothes & Safety", itemCount: 6, stockValue: 95000, consumptionCost: 115000, transactionCount: 14 },
    ],
    issueAccountabilityRows: [
      {
        id: "is000000-0000-0000-0000-000000000001",
        date: "2026-10-01",
        itemCode: "TOOL-GRN-001",
        itemName: "Heavy Duty Angle Grinder 7 inch",
        category: "MACHINES_TOOLS",
        quantity: 1,
        unit: "Nos",
        employeeName: "Rajesh Kumar",
        companyName: "KFab Infra Project Pvt Ltd",
        projectOrDept: "Fabrication Bay 1",
        issuedBy: "Supervisor (Plant Yard)",
        isReturnable: true,
        returnStatus: "ISSUED",
        unitCost: 6800,
        totalCost: 6800,
      },
      {
        id: "is000000-0000-0000-0000-000000000002",
        date: "2026-10-01",
        itemCode: "MAC-WLD-001",
        itemName: "Inverter Welding Machine 400A",
        category: "MACHINES_TOOLS",
        quantity: 1,
        unit: "Nos",
        employeeName: "Amit Sharma",
        companyName: "KFab Infra Project Pvt Ltd",
        projectOrDept: "Welding Bay 2",
        issuedBy: "Supervisor (Plant Yard)",
        isReturnable: true,
        returnStatus: "ISSUED",
        unitCost: 28500,
        totalCost: 28500,
      },
      {
        id: "is000000-0000-0000-0000-000000000003",
        date: "2026-10-03",
        itemCode: "CLO-GLO-001",
        itemName: "Split Leather Heavy Welding Gloves",
        category: "CLOTHES_SAFETY",
        quantity: 4,
        unit: "Pair",
        employeeName: "Vikram Shinde",
        companyName: "KFab Infra Project Pvt Ltd",
        projectOrDept: "Welding Bay 2",
        issuedBy: "Store In-charge",
        isReturnable: false,
        returnStatus: "N/A",
        unitCost: 120,
        totalCost: 480,
      },
    ],
    totalAccountabilityRecords: 3,
  },
  issues: [
    {
      id: "iss-101",
      code: "ISS-001",
      projectId: "10000000-0000-0000-0000-000000000001",
      projectName: "KFab Plant Structure Extension",
      title: "ISMC 250 Channel Stock Depletion in Bay 1",
      description: "Heavy structural fitup stalled due to delayed channel replenishment.",
      priority: "CRITICAL",
      category: "Material Shortage",
      reportedBy: "Site Supervisor",
      assignedTo: "Store In-charge",
      status: "OPEN",
      targetDate: "2026-10-22",
      createdAt: "2026-10-20T08:30:00.000Z",
    },
    {
      id: "iss-102",
      code: "ISS-002",
      projectId: "10000000-0000-0000-0000-000000000002",
      projectName: "Boiler Shell Assembly (Tata Power)",
      title: "Hydraulic Press #2 Pressure Valve Leaking",
      description: "Plate rolling halted on 25mm shell sections pending seal overhaul.",
      priority: "HIGH",
      category: "Machine Breakdown",
      reportedBy: "Shop Floor Lead",
      assignedTo: "Maintenance Engineer",
      status: "IN_PROGRESS",
      targetDate: "2026-10-23",
      createdAt: "2026-10-19T14:15:00.000Z",
    },
  ],
  supervisorSections: [
    {
      projectId: "10000000-0000-0000-0000-000000000001",
      projectName: "KFab Plant Structure Extension",
      customerName: "Tata Steel Processing Ltd",
      progressPercent: 68,
      startDate: "2026-09-01",
      endDate: "2026-09-25",
      delayDays: 26,
      isDelayed: true,
      status: "DELAYED",
      workforceCount: 8,
      materialUsageCost: 142000,
      openIssuesCount: 1,
      issues: [
        {
          id: "iss-101",
          code: "ISS-001",
          projectId: "10000000-0000-0000-0000-000000000001",
          projectName: "KFab Plant Structure Extension",
          title: "ISMC 250 Channel Stock Depletion in Bay 1",
          description: "Heavy structural fitup stalled due to delayed channel replenishment.",
          priority: "CRITICAL",
          category: "Material Shortage",
          reportedBy: "Site Supervisor",
          assignedTo: "Store In-charge",
          status: "OPEN",
          targetDate: "2026-10-22",
          createdAt: "2026-10-20T08:30:00.000Z",
        },
      ],
    },
    {
      projectId: "10000000-0000-0000-0000-000000000002",
      projectName: "Boiler Shell Assembly (Tata Power)",
      customerName: "Tata Power Corporation",
      progressPercent: 42,
      startDate: "2026-08-15",
      endDate: "2026-10-10",
      delayDays: 11,
      isDelayed: true,
      status: "DELAYED",
      workforceCount: 6,
      materialUsageCost: 89000,
      openIssuesCount: 1,
      issues: [
        {
          id: "iss-102",
          code: "ISS-002",
          projectId: "10000000-0000-0000-0000-000000000002",
          projectName: "Boiler Shell Assembly (Tata Power)",
          title: "Hydraulic Press #2 Pressure Valve Leaking",
          description: "Plate rolling halted on 25mm shell sections pending seal overhaul.",
          priority: "HIGH",
          category: "Machine Breakdown",
          reportedBy: "Shop Floor Lead",
          assignedTo: "Maintenance Engineer",
          status: "IN_PROGRESS",
          targetDate: "2026-10-23",
          createdAt: "2026-10-19T14:15:00.000Z",
        },
      ],
    },
  ],
  actionList: [
    {
      type: "DELAYED_PROJECT",
      severity: "HIGH",
      title: "Project Delayed: KFab Plant Structure Extension",
      subtitle: "26 days overdue against target 2026-09-25",
      linkTab: "reports",
    },
    {
      type: "LOW_STOCK",
      severity: "MEDIUM",
      title: "Critical Reorder Level: Grinding Disc 7 inch",
      subtitle: "Current stock: 7.0 Nos (Min: 20.0)",
      linkTab: "inventory",
    },
    {
      type: "CRITICAL_ISSUE",
      severity: "CRITICAL",
      title: "Urgent Issue: ISMC 250 Channel Stock Depletion in Bay 1",
      subtitle: "Reported on KFab Plant Structure Extension by Site Supervisor",
      linkTab: "issues",
    },
    {
      type: "EQUIPMENT_OVERDUE",
      severity: "MEDIUM",
      title: "Unreturned Power Tool: Heavy Duty Angle Grinder 7 inch",
      subtitle: "Issued to Fitter Rajesh Kumar over 48h ago (Due 2026-10-07)",
      linkTab: "inventory",
    },
  ],
};

export function DashboardView({
  currentUser,
  stockMaterials,
  supplyTransactions,
  sampleDataActive = true,
  onNavigateTab,
}: DashboardViewProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData>(DEFAULT_INITIAL_DASHBOARD);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("c0000000-0000-0000-0000-000000000001");
  const [period, setPeriod] = useState<DashboardPeriod>("today");
  const [startDate, setStartDate] = useState<string>("2026-10-01");
  const [endDate, setEndDate] = useState<string>("2026-10-31");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSupervisor = currentUser?.role === "SUPERVISOR";
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isFinancialAuthorized = ["SUPER_ADMIN", "ADMIN", "ACCOUNT"].includes(currentUser?.role || "");

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kfab_auth_token") : null;
      const queryParams = new URLSearchParams({
        companyId: selectedCompanyId,
        period,
        from: startDate,
        to: endDate,
      });
      if (selectedProjectId) {
        queryParams.set("projectId", selectedProjectId);
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backendUrl}/api/v1/dashboard/overview?${queryParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setDashboardData(json.data);
          return;
        }
      }
    } catch {
      // Graceful fallback to rich local state
    } finally {
      setIsRefreshing(false);
    }

    // Role-tailored local adaptation if backend is in demo mode
    setDashboardData((prev) => ({
      ...prev,
      activeCompanyId: selectedCompanyId,
      kpiCards: {
        ...prev.kpiCards,
        bills: {
          ...prev.kpiCards.bills,
          isAuthorized: isFinancialAuthorized,
          note: isFinancialAuthorized ? undefined : "Access restricted per RBAC",
        },
      },
      financialOverview: {
        ...prev.financialOverview,
        isAuthorized: isFinancialAuthorized,
      },
    }));
  }, [selectedCompanyId, period, startDate, endDate, selectedProjectId, isFinancialAuthorized]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCreateIssue = async (newIssue: { projectId: string; title: string; description: string; priority: any; category: string }) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kfab_auth_token") : null;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      await fetch(`${backendUrl}/api/v1/dashboard/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newIssue),
      });
    } catch {
      // ignore
    }
    await fetchDashboardData();
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Global Filter Header */}
      <DashboardHeader
        currentUser={currentUser || null}
        companies={dashboardData.authorizedCompanies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={setSelectedCompanyId}
        period={period}
        onSelectPeriod={setPeriod}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        projects={dashboardData.projectSummaryRows.map((p) => ({ id: p.id, projectName: p.projectName }))}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onRefresh={fetchDashboardData}
        isRefreshing={isRefreshing}
      />

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={fetchDashboardData} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* 2. Four Horizontally Scrollable KPI Cards */}
      <DashboardKPICards
        kpis={dashboardData.kpiCards}
        onNavigateTab={onNavigateTab}
      />

      {/* 3. Horizontally Scrollable Company Tabs (Admin & Super Admin) */}
      {!isSupervisor && (
        <DashboardCompanyTabs
          companies={dashboardData.authorizedCompanies}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={setSelectedCompanyId}
          canViewAllCompanies={isSuperAdmin}
        />
      )}

      {/* 4. ROLE AWARE DISPATCH: Supervisor View vs Management View */}
      {isSupervisor ? (
        /* SUPERVISOR VIEW: Vertically scrollable project stack, action list, and issues */
        <DashboardSupervisorView
          supervisorSections={dashboardData.supervisorSections}
          actionList={dashboardData.actionList}
          issues={dashboardData.issues}
          onCreateIssue={handleCreateIssue}
          onNavigateTab={onNavigateTab}
          onOpenProject={(projId) => onNavigateTab("reports")}
        />
      ) : (
        /* ADMIN / SUPER ADMIN / ACCOUNTS VIEW */
        <div className="space-y-6">
          {/* Company-wise project & workforce trends + compact project summary */}
          <DashboardTrendsSection
            projectProgressTrend={dashboardData.projectProgressTrend}
            workforceTrend={dashboardData.workforceTrend}
            projectSummaryRows={dashboardData.projectSummaryRows}
            onOpenProject={(projId) => onNavigateTab("reports")}
          />

          {/* Daily, weekly, monthly reports with charts and annexures */}
          <DashboardPeriodReports
            periodReports={dashboardData.periodReports}
            onNavigateTab={onNavigateTab}
            isFinancialAuthorized={isFinancialAuthorized}
          />

          {/* Financial Overview (Money Needed, Money In, Money Consumed) */}
          <DashboardFinancialOverview
            financialData={dashboardData.financialOverview}
            onNavigateTab={onNavigateTab}
          />

          {/* Material Consumption & Issue Accountability ("Material issued to whom") */}
          <DashboardMaterialConsumption
            materialData={dashboardData.materialConsumption}
            onNavigateTab={onNavigateTab}
          />
        </div>
      )}
    </div>
  );
}
