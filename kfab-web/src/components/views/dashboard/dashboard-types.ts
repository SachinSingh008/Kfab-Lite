export type DashboardPeriod = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export interface DashboardKPIData {
  attendance: {
    presentToday: number;
    absentToday: number;
    odToday: number;
    totalEmployees: number;
    turnoutRate: number;
    date: string;
  };
  projects: {
    totalActive: number;
    onTrack: number;
    delayed: number;
    completed: number;
  };
  emergencies: {
    openCritical: number;
    highPriority: number;
    overdueUnresolved: number;
    resolvedPeriod: number;
  };
  bills: {
    isAuthorized: boolean;
    billsPending: number;
    billsOverdue: number;
    amountReceivable: number;
    amountPayable: number;
    currency: string;
    note?: string;
  };
}

export interface ProjectSummaryRow {
  id: string;
  projectName: string;
  customerName: string;
  supervisorName: string;
  progressPercent: number;
  plannedPercent: number;
  endDate: string;
  delayDays: number;
  isDelayed: boolean;
  status: string;
}

export interface MaterialIssueRow {
  id: string;
  date: string;
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  employeeName: string;
  companyName: string;
  projectOrDept: string;
  issuedBy: string;
  isReturnable: boolean;
  returnStatus: 'RETURNED' | 'ISSUED' | 'OVERDUE' | 'N/A';
  unitCost: number;
  totalCost: number;
}

export interface FinancialOverviewData {
  isAuthorized: boolean;
  note?: string;
  moneyNeeded?: {
    totalPayables: number;
    outstandingSupplierBills: number;
    upcomingMaterialPayables: number;
    approvedProjectFundingReq: number;
  };
  moneyComingIn?: {
    totalReceivables: number;
    customerReceivables: number;
    overdueReceivables: number;
    paymentsReceivedThisMonth: number;
  };
  moneyConsumed?: {
    totalExpensesRecorded: number;
    materialConsumptionCost: number;
    directProjectExpenses: number;
    inventoryPurchases: number;
  };
  financialMovementTrend?: Array<{
    period: string;
    moneyComingIn: number;
    moneyPaidOut: number;
    materialCost: number;
    outstanding: number;
  }>;
  projectCosting?: Array<{
    projectId: string;
    projectName: string;
    budget: number;
    recordedCost: number;
    remainingBudget: number;
    costVarianceStatus: 'ON_TRACK' | 'OVER_BUDGET';
  }>;
}

export interface PeriodReportsData {
  today: {
    attendanceDistribution: Array<{ status: string; count: number; color: string }>;
    workCompletedTodayTonnage: number;
    materialIssuedCostToday: number;
    newIssuesToday: number;
    attendanceAnnexure: Array<{ employeeName: string; date: string; status: string; overtimeHours: number; remarks?: string }>;
    projectAnnexure: ProjectSummaryRow[];
    materialAnnexure: MaterialIssueRow[];
    billsAnnexure: Array<{ ref: string; company: string; date: string; amount: number; status: string; dueDate: string }>;
  };
  this_week: {
    weeklyTonnage: number;
    weeklyTurnoutRate: number;
    issuesResolvedCount: number;
    attendanceTrend: Array<{ date: string; present: number; absent: number; od: number }>;
    projectAnnexure: ProjectSummaryRow[];
  };
  this_month: {
    monthlyTonnage: number;
    monthlyTurnoutRate: number;
    totalConsumptionCost: number;
    topItems: {
      byQuantity: Array<{ itemName: string; itemCode: string; unit: string; totalQuantity: number; totalCost: number }>;
      byCost: Array<{ itemName: string; itemCode: string; unit: string; totalQuantity: number; totalCost: number }>;
    };
    projectAnnexure: ProjectSummaryRow[];
  };
}

export interface DashboardIssue {
  id: string;
  code: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  reportedBy: string;
  assignedTo: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  targetDate: string;
  createdAt: string;
}

export interface SupervisorProjectSection {
  projectId: string;
  projectName: string;
  customerName: string;
  progressPercent: number;
  startDate: string;
  endDate: string;
  delayDays: number;
  isDelayed: boolean;
  status: string;
  workforceCount: number;
  materialUsageCost: number;
  openIssuesCount: number;
  issues: DashboardIssue[];
}

export interface SupervisorActionItem {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  subtitle: string;
  linkTab: string;
}

export interface DashboardData {
  activeCompanyId: string;
  authorizedCompanies: Array<{ id: string; name: string; code: string }>;
  kpiCards: DashboardKPIData;
  projectProgressTrend: Array<{ date: string; actualProgress: number; plannedProgress: number }>;
  workforceTrend: Array<{ date: string; present: number; absent: number; od: number }>;
  projectSummaryRows: ProjectSummaryRow[];
  periodReports: PeriodReportsData;
  financialOverview: FinancialOverviewData;
  materialConsumption: {
    totalIssuedQuantity: number;
    totalConsumptionCost: number;
    topConsumedItems: {
      byQuantity: Array<{ itemName: string; itemCode: string; unit: string; totalQuantity: number; totalCost: number }>;
      byCost: Array<{ itemName: string; itemCode: string; unit: string; totalQuantity: number; totalCost: number }>;
    };
    lowStockCount: number;
    categories: Array<{ category: string; label: string; itemCount: number; stockValue: number; consumptionCost: number; transactionCount: number }>;
    issueAccountabilityRows: MaterialIssueRow[];
    totalAccountabilityRecords: number;
  };
  issues: DashboardIssue[];
  supervisorSections: SupervisorProjectSection[];
  actionList: SupervisorActionItem[];
}
