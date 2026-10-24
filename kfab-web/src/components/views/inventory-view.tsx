"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Boxes,
  Wrench,
  Shield,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { AppUser } from "@/lib/auth-store";
import {
  InventoryCategory,
  InventoryItemDTO,
  InventoryTransactionDTO,
  InventoryIssueDTO,
  InventoryCompanyDTO,
  InventoryEmployeeDTO,
  AnalysisSummaryDTO,
  MonthlyTrendDTO,
  CategoryAnalysisDTO,
  TopConsumedItemsDTO,
  DepartmentUsageDTO,
  EmployeeUsageDTO,
  LowStockItemDTO,
  MachineToolStatusDTO,
  LedgerSheetDTO,
  apiGetInventoryCompanies,
  apiGetInventoryEmployees,
  apiGetInventoryItems,
  apiGetInventoryItemDetail,
  apiCreateInventoryItem,
  apiRecordInventoryPurchase,
  apiIssueInventoryItem,
  apiReturnInventoryItem,
  apiAdjustInventoryStock,
  apiGetInventoryTransactions,
  apiGetInventoryIssues,
  apiGetInventoryAnalysisSummary,
  apiGetInventoryMonthlyTrends,
  apiGetInventoryCategoryAnalysis,
  apiGetInventoryTopItems,
  apiGetInventoryDepartmentUsage,
  apiGetInventoryEmployeeUsage,
  apiGetInventoryLowStockAnalysis,
  apiGetInventoryMachineStatus,
  apiGetInventoryLedgerSheet,
  apiUpdateInventoryLedgerCell,
  apiBatchPasteInventoryRows,
} from "@/lib/inventory-api";

import {
  InventoryTab,
  AddFormState,
  IssueFormState,
  ReturnFormState,
  RestockFormState,
  AdjustFormState,
  DetailDataState,
} from "./inventory/inventory-types";
import { InventoryHeader } from "./inventory/inventory-header";
import { InventoryMetricsBar } from "./inventory/inventory-metrics-bar";
import { InventoryConsumablesTab } from "./inventory/inventory-consumables-tab";
import { InventoryMachinesTab } from "./inventory/inventory-machines-tab";
import { InventorySafetyTab } from "./inventory/inventory-safety-tab";
import { InventoryAnalysisTab } from "./inventory/inventory-analysis-tab";
import { InventoryExcelWorkspace } from "./inventory/inventory-excel-workspace";
import {
  AddItemModal,
  IssueItemModal,
  ReturnItemModal,
  RestockModal,
  AdjustModal,
} from "./inventory/inventory-modals";
import { ItemDetailDrawer } from "./inventory/inventory-detail-drawer";
import {
  SAMPLE_INVENTORY_ITEMS,
  SAMPLE_INVENTORY_TRANSACTIONS,
  SAMPLE_INVENTORY_ISSUES,
  SAMPLE_INVENTORY_ANALYSIS_SUMMARY,
  SAMPLE_INVENTORY_MONTHLY_TRENDS,
  SAMPLE_INVENTORY_CATEGORY_ANALYSIS,
  SAMPLE_INVENTORY_TOP_ITEMS,
  SAMPLE_INVENTORY_DEPARTMENT_USAGE,
  SAMPLE_INVENTORY_EMPLOYEE_USAGE,
  SAMPLE_INVENTORY_LOW_STOCK,
  SAMPLE_INVENTORY_MACHINE_STATUS,
} from "@/lib/inventory-sample-data";

interface InventoryViewProps {
  currentUser?: AppUser | null;
  initialTab?: InventoryTab;
  initialOpenExcel?: boolean;
  sampleDataActive?: boolean;
}

export function InventoryView({
  currentUser,
  initialTab = "consumables",
  initialOpenExcel = false,
  sampleDataActive = true,
}: InventoryViewProps) {
  // Authorization flags
  const role = currentUser?.role || "GUEST";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isSupervisor = role === "SUPERVISOR";
  const isAccountant = role === "ACCOUNTANT" || role === "ACCOUNT";

  const canAddItems = isSuperAdmin || isAdmin || isSupervisor || isAccountant;
  const canIssueItems = isSuperAdmin || isAdmin || isSupervisor;
  const canReturnItems = isSuperAdmin || isAdmin || isSupervisor;
  const canAdjustStock = isSuperAdmin || isAdmin;

  // Active View State
  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);
  const [isExcelMode, setIsExcelMode] = useState(initialOpenExcel);
  const [activeSheet, setActiveSheet] = useState<string>("consumables");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Multi-Tenant Company State
  const [companies, setCompanies] = useState<InventoryCompanyDTO[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    "c0000000-0000-0000-0000-000000000001"
  );
  const [employees, setEmployees] = useState<InventoryEmployeeDTO[]>([]);

  // Inventory Datasets
  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransactionDTO[]>([]);
  const [issues, setIssues] = useState<InventoryIssueDTO[]>([]);

  // Analysis State
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummaryDTO | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendDTO[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysisDTO[]>([]);
  const [topItems, setTopItems] = useState<TopConsumedItemsDTO | null>(null);
  const [departmentUsage, setDepartmentUsage] = useState<DepartmentUsageDTO[]>([]);
  const [employeeUsage, setEmployeeUsage] = useState<EmployeeUsageDTO[]>([]);
  const [lowStockAnalysis, setLowStockAnalysis] = useState<LowStockItemDTO[]>([]);
  const [machineStatus, setMachineStatus] = useState<MachineToolStatusDTO | null>(null);
  const [dateFilter, setDateFilter] = useState<{ from?: string; to?: string }>({});

  // Excel Ledger State
  const [ledgerSheetData, setLedgerSheetData] = useState<LedgerSheetDTO | null>(null);

  // Modal Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItemDTO | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<InventoryIssueDTO | null>(null);
  const [detailData, setDetailData] = useState<DetailDataState | null>(null);

  // Form States
  const [addForm, setAddForm] = useState<AddFormState>({
    item_code: "",
    item_name: "",
    category: "CONSUMABLES_TACKLES",
    subcategory: "",
    brand: "",
    model: "",
    unit: "Nos",
    opening_quantity: 0,
    minimum_stock: 10,
    maximum_stock: 100,
    purchase_price: 0,
    supplier: "",
    purchase_date: new Date().toISOString().split("T")[0],
    warranty: "",
    location: "Main Store",
    storage_location: "Rack A",
    is_returnable: false,
    condition: "GOOD",
    remarks: "",
  });

  const [issueForm, setIssueForm] = useState<IssueFormState>({
    employee_id: "",
    quantity: 1,
    issue_date: new Date().toISOString().split("T")[0],
    expected_return_date: "",
    condition_at_issue: "Good",
    remarks: "",
  });

  const [returnForm, setReturnForm] = useState<ReturnFormState>({
    return_quantity: 1,
    return_date: new Date().toISOString().split("T")[0],
    condition_at_return: "GOOD",
    remarks: "",
  });

  const [restockForm, setRestockForm] = useState<RestockFormState>({
    quantity: 10,
    unit_price: 0,
    supplier: "",
    reference_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const [adjustForm, setAdjustForm] = useState<AdjustFormState>({
    adjustment_type: "ADJUSTMENT_IN",
    quantity: 1,
    reason: "",
  });

  // Helper notification toaster
  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Data Loading Lifecycle
  const loadCoreData = useCallback(async () => {
    setLoading(true);
    if (!sampleDataActive) {
      setItems([]);
      setTransactions([]);
      setIssues([]);
      setAnalysisSummary(null);
      setMonthlyTrends([]);
      setCategoryAnalysis([]);
      setTopItems(null);
      setDepartmentUsage([]);
      setEmployeeUsage([]);
      setLowStockAnalysis([]);
      setMachineStatus(null);
      setLoading(false);
      return;
    }
    try {
      const [compRes, empRes] = await Promise.all([
        apiGetInventoryCompanies(),
        apiGetInventoryEmployees(selectedCompanyId),
      ]);
      setCompanies(compRes.companies || []);
      setEmployees(empRes.employees || []);

      const [itemsRes, txRes, issuesRes] = await Promise.all([
        apiGetInventoryItems({ companyId: selectedCompanyId }),
        apiGetInventoryTransactions({ companyId: selectedCompanyId, limit: 100 }),
        apiGetInventoryIssues({ companyId: selectedCompanyId }),
      ]);

      const fetchedItems = itemsRes.items || [];
      const fetchedTx = txRes.transactions || [];
      const fetchedIssues = issuesRes.issues || [];

      if (fetchedItems.length === 0) {
        setItems(SAMPLE_INVENTORY_ITEMS);
        setTransactions(SAMPLE_INVENTORY_TRANSACTIONS);
        setIssues(SAMPLE_INVENTORY_ISSUES);
        setAnalysisSummary(SAMPLE_INVENTORY_ANALYSIS_SUMMARY);
        setMonthlyTrends(SAMPLE_INVENTORY_MONTHLY_TRENDS);
        setCategoryAnalysis(SAMPLE_INVENTORY_CATEGORY_ANALYSIS);
        setTopItems(SAMPLE_INVENTORY_TOP_ITEMS);
        setDepartmentUsage(SAMPLE_INVENTORY_DEPARTMENT_USAGE);
        setEmployeeUsage(SAMPLE_INVENTORY_EMPLOYEE_USAGE);
        setLowStockAnalysis(SAMPLE_INVENTORY_LOW_STOCK);
        setMachineStatus(SAMPLE_INVENTORY_MACHINE_STATUS);
      } else {
        setItems(fetchedItems);
        setTransactions(fetchedTx);
        setIssues(fetchedIssues);

        const [sumRes, trendsRes, catRes, topRes, depRes, empUsageRes, lowRes, machRes] =
          await Promise.all([
            apiGetInventoryAnalysisSummary(selectedCompanyId),
            apiGetInventoryMonthlyTrends(selectedCompanyId),
            apiGetInventoryCategoryAnalysis(selectedCompanyId),
            apiGetInventoryTopItems(selectedCompanyId),
            apiGetInventoryDepartmentUsage(selectedCompanyId),
            apiGetInventoryEmployeeUsage(selectedCompanyId),
            apiGetInventoryLowStockAnalysis(selectedCompanyId),
            apiGetInventoryMachineStatus(selectedCompanyId),
          ]);

        setAnalysisSummary(sumRes.summary);
        setMonthlyTrends(trendsRes.trends || []);
        setCategoryAnalysis(catRes.categories || []);
        setTopItems(topRes);
        setDepartmentUsage(depRes.departments || []);
        setEmployeeUsage(empUsageRes.employees || []);
        setLowStockAnalysis(lowRes.lowStock || []);
        setMachineStatus(machRes);
      }
    } catch (err: any) {
      if (sampleDataActive) {
        setItems(SAMPLE_INVENTORY_ITEMS);
        setTransactions(SAMPLE_INVENTORY_TRANSACTIONS);
        setIssues(SAMPLE_INVENTORY_ISSUES);
        setAnalysisSummary(SAMPLE_INVENTORY_ANALYSIS_SUMMARY);
        setMonthlyTrends(SAMPLE_INVENTORY_MONTHLY_TRENDS);
        setCategoryAnalysis(SAMPLE_INVENTORY_CATEGORY_ANALYSIS);
        setTopItems(SAMPLE_INVENTORY_TOP_ITEMS);
        setDepartmentUsage(SAMPLE_INVENTORY_DEPARTMENT_USAGE);
        setEmployeeUsage(SAMPLE_INVENTORY_EMPLOYEE_USAGE);
        setLowStockAnalysis(SAMPLE_INVENTORY_LOW_STOCK);
        setMachineStatus(SAMPLE_INVENTORY_MACHINE_STATUS);
      } else {
        showFeedback(err?.message || "Failed to load inventory data", true);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, sampleDataActive]);

  // Load Excel sheet data on demand
  const loadExcelSheet = useCallback(async (sheetName: string) => {
    try {
      const sheet = await apiGetInventoryLedgerSheet(selectedCompanyId, sheetName);
      setLedgerSheetData(sheet);
    } catch (err: any) {
      showFeedback("Failed to load spreadsheet", true);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    if (isExcelMode) {
      loadExcelSheet(activeSheet);
    }
  }, [isExcelMode, activeSheet, loadExcelSheet]);

  // Tab Dataset Splits
  const consumablesItems = useMemo(
    () => items.filter((i) => i.category === "CONSUMABLES_TACKLES"),
    [items]
  );
  const machinesItems = useMemo(
    () => items.filter((i) => i.category === "MACHINERY_TOOLS"),
    [items]
  );
  const safetyItems = useMemo(
    () => items.filter((i) => i.category === "SAFETY_CLOTHES"),
    [items]
  );

  // Active issues count
  const activeIssuesCount = useMemo(
    () => issues.filter((i) => i.status === "ISSUED" || i.status === "PARTIALLY_RETURNED").length,
    [issues]
  );

  // Detail Drawer Trigger
  const handleOpenDetail = async (item: InventoryItemDTO) => {
    setSelectedItem(item);
    const itemTx = transactions.filter((t) => t.itemId === item.id);
    const itemIssues = issues.filter((i) => i.itemId === item.id);
    setDetailData({
      item,
      transactions: itemTx,
      issues: itemIssues,
    });
    setIsDetailOpen(true);
  };

  // Form Submissions
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiCreateInventoryItem({
        company_id: selectedCompanyId,
        item_code: addForm.item_code,
        item_name: addForm.item_name,
        category: addForm.category,
        subcategory: addForm.subcategory,
        brand: addForm.brand,
        model: addForm.model,
        unit: addForm.unit,
        opening_quantity: addForm.opening_quantity,
        minimum_stock: addForm.minimum_stock,
        maximum_stock: addForm.maximum_stock,
        purchase_price: addForm.purchase_price,
        supplier: addForm.supplier,
        location: addForm.location,
        storage_location: addForm.storage_location,
        remarks: addForm.remarks,
      });
      setIsAddModalOpen(false);
      showFeedback(`Successfully registered SKU: ${addForm.item_code}`);
      setAddForm({
        item_code: "",
        item_name: "",
        category: "CONSUMABLES_TACKLES",
        subcategory: "",
        brand: "",
        model: "",
        unit: "Nos",
        opening_quantity: 0,
        minimum_stock: 10,
        maximum_stock: 100,
        purchase_price: 0,
        supplier: "",
        purchase_date: new Date().toISOString().split("T")[0],
        warranty: "",
        location: "Main Store",
        storage_location: "Rack A",
        is_returnable: false,
        condition: "GOOD",
        remarks: "",
      });
      await loadCoreData();
    } catch (err: any) {
      showFeedback(err?.message || "Failed to create inventory item", true);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setLoading(true);
      await apiIssueInventoryItem({
        company_id: selectedCompanyId,
        item_id: selectedItem.id,
        employee_id: issueForm.employee_id,
        quantity: issueForm.quantity,
        issue_date: issueForm.issue_date,
        expected_return_date: issueForm.expected_return_date || undefined,
        condition_at_issue: issueForm.condition_at_issue,
        remarks: issueForm.remarks,
      });
      setIsIssueModalOpen(false);
      showFeedback(`Issued ${issueForm.quantity} ${selectedItem.unit} to worker`);
      await loadCoreData();
    } catch (err: any) {
      showFeedback(err?.message || "Failed to record issue handover", true);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      setLoading(true);
      await apiReturnInventoryItem({
        company_id: selectedCompanyId,
        issue_id: selectedIssue.id,
        return_quantity: returnForm.return_quantity,
        return_date: returnForm.return_date,
        condition_at_return: returnForm.condition_at_return,
        remarks: returnForm.remarks,
      });
      setIsReturnModalOpen(false);
      showFeedback(`Returned ${returnForm.return_quantity} unit(s) to tool crib`);
      await loadCoreData();
    } catch (err: any) {
      showFeedback(err?.message || "Failed to process equipment return", true);
    } finally {
      setLoading(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setLoading(true);
      await apiRecordInventoryPurchase({
        company_id: selectedCompanyId,
        item_id: selectedItem.id,
        quantity: restockForm.quantity,
        unit_price: restockForm.unit_price,
        supplier: restockForm.supplier,
        reference_id: restockForm.reference_id,
        purchase_date: restockForm.purchase_date,
        remarks: restockForm.remarks,
      });
      setIsRestockModalOpen(false);
      showFeedback(`Inward restock of ${restockForm.quantity} ${selectedItem.unit} confirmed`);
      await loadCoreData();
    } catch (err: any) {
      showFeedback(err?.message || "Failed to inward stock purchase", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setLoading(true);
      await apiAdjustInventoryStock({
        company_id: selectedCompanyId,
        item_id: selectedItem.id,
        adjustment_type: adjustForm.adjustment_type,
        quantity: adjustForm.quantity,
        reason: adjustForm.reason,
      });
      setIsAdjustModalOpen(false);
      showFeedback(`Stock take adjustment recorded for ${selectedItem.itemCode}`);
      await loadCoreData();
    } catch (err: any) {
      showFeedback(err?.message || "Failed to adjust stock balance", true);
    } finally {
      setLoading(false);
    }
  };

  // Excel Cell & Batch Handlers
  const handleUpdateExcelCell = async (rowId: string, field: string, value: any) => {
    try {
      await apiUpdateInventoryLedgerCell({
        company_id: selectedCompanyId,
        item_id: rowId,
        field,
        value,
      });
      showFeedback(`Cell ${field} updated.`);
      await loadExcelSheet(activeSheet);
    } catch (err: any) {
      showFeedback("Failed to update cell value", true);
    }
  };

  const handleBatchPasteExcel = async (rows: Array<Record<string, any>>) => {
    try {
      const category: InventoryCategory =
        activeSheet === "machines"
          ? "MACHINERY_TOOLS"
          : activeSheet === "safety"
          ? "CLOTHES_SAFETY"
          : "CONSUMABLES_TACKLES";

      await apiBatchPasteInventoryRows({
        company_id: selectedCompanyId,
        category,
        rows,
      });
      await loadExcelSheet(activeSheet);
      await loadCoreData();
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Toolbar */}
      <InventoryHeader
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={(id) => setSelectedCompanyId(id)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={loadCoreData}
        loading={loading}
        isExcelMode={isExcelMode}
        onToggleExcelMode={() => setIsExcelMode(!isExcelMode)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        canAddItems={canAddItems}
        activeTab={activeTab}
      />

      {/* Global Alerts / Toasts */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="size-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. Top Metric KPI Indicators (Hidden when Excel Mode is active) */}
      {!isExcelMode && (
        <InventoryMetricsBar
          items={items}
          analysisSummary={analysisSummary}
          activeIssuesCount={activeIssuesCount}
        />
      )}

      {/* 3. Main Workspace Area */}
      {isExcelMode ? (
        /* Excel Live Spreadsheet Mode */
        <InventoryExcelWorkspace
          sheetData={ledgerSheetData}
          activeSheet={activeSheet}
          onSelectSheet={(s) => setActiveSheet(s)}
          onUpdateCell={handleUpdateExcelCell}
          onBatchPaste={handleBatchPasteExcel}
          onClose={() => setIsExcelMode(false)}
          loading={loading}
          onRefresh={() => loadExcelSheet(activeSheet)}
        />
      ) : (
        /* Standard 4-Tab View */
        <div className="space-y-4">
          {/* Tab Navigation Navigation Bar */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {/* Tab 1: Consumables & Tackles */}
            <button
              onClick={() => setActiveTab("consumables")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "consumables"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Boxes className="size-4" />
              <span>Consumables & Tackles</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "consumables" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {consumablesItems.length}
              </span>
            </button>

            {/* Tab 2: Machines & Tools */}
            <button
              onClick={() => setActiveTab("machines")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "machines"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Wrench className="size-4" />
              <span>Machinery & Tools</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "machines" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {machinesItems.length}
              </span>
            </button>

            {/* Tab 3: Clothes & Safety */}
            <button
              onClick={() => setActiveTab("safety")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "safety"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Shield className="size-4" />
              <span>Clothes & Safety PPE</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "safety" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {safetyItems.length}
              </span>
            </button>

            {/* Tab 4: Inventory Analysis */}
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analysis"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="size-4" />
              <span>Executive Analysis</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "analysis" ? "bg-blue-700 text-white" : "bg-emerald-100 text-emerald-800 font-black"
                }`}
              >
                KPI
              </span>
            </button>
          </div>

          {/* Tab 1 Content: Consumables */}
          {activeTab === "consumables" && (
            <InventoryConsumablesTab
              items={consumablesItems}
              searchTerm={searchTerm}
              canIssueItems={canIssueItems}
              canAdjustStock={canAdjustStock}
              onOpenIssueModal={(item) => {
                setSelectedItem(item);
                setIsIssueModalOpen(true);
              }}
              onOpenRestockModal={(item) => {
                setSelectedItem(item);
                setRestockForm((p) => ({ ...p, unit_price: item.purchasePrice || 0 }));
                setIsRestockModalOpen(true);
              }}
              onOpenAdjustModal={(item) => {
                setSelectedItem(item);
                setIsAdjustModalOpen(true);
              }}
              onOpenDetailModal={handleOpenDetail}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}

          {/* Tab 2 Content: Machinery & Tools */}
          {activeTab === "machines" && (
            <InventoryMachinesTab
              items={machinesItems}
              issues={issues}
              searchTerm={searchTerm}
              canIssueItems={canIssueItems}
              canReturnItems={canReturnItems}
              canAdjustStock={canAdjustStock}
              onOpenIssueModal={(item) => {
                setSelectedItem(item);
                setIsIssueModalOpen(true);
              }}
              onOpenReturnModal={(iss) => {
                setSelectedIssue(iss);
                setReturnForm({
                  return_quantity: iss.quantity - (iss.returnedQuantity || 0),
                  return_date: new Date().toISOString().split("T")[0],
                  condition_at_return: "GOOD",
                  remarks: "",
                });
                setIsReturnModalOpen(true);
              }}
              onOpenRestockModal={(item) => {
                setSelectedItem(item);
                setRestockForm((p) => ({ ...p, unit_price: item.purchasePrice || 0 }));
                setIsRestockModalOpen(true);
              }}
              onOpenAdjustModal={(item) => {
                setSelectedItem(item);
                setIsAdjustModalOpen(true);
              }}
              onOpenDetailModal={handleOpenDetail}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}

          {/* Tab 3 Content: Safety & Clothes */}
          {activeTab === "safety" && (
            <InventorySafetyTab
              items={safetyItems}
              searchTerm={searchTerm}
              canIssueItems={canIssueItems}
              canAdjustStock={canAdjustStock}
              onOpenIssueModal={(item) => {
                setSelectedItem(item);
                setIsIssueModalOpen(true);
              }}
              onOpenRestockModal={(item) => {
                setSelectedItem(item);
                setRestockForm((p) => ({ ...p, unit_price: item.purchasePrice || 0 }));
                setIsRestockModalOpen(true);
              }}
              onOpenAdjustModal={(item) => {
                setSelectedItem(item);
                setIsAdjustModalOpen(true);
              }}
              onOpenDetailModal={handleOpenDetail}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}

          {/* Tab 4 Content: Executive Analysis */}
          {activeTab === "analysis" && (
            <InventoryAnalysisTab
              summary={analysisSummary}
              monthlyTrends={monthlyTrends}
              categoryAnalysis={categoryAnalysis}
              topItems={topItems}
              departmentUsage={departmentUsage}
              employeeUsage={employeeUsage}
              lowStockItems={lowStockAnalysis}
              machineStatus={machineStatus}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              onRefresh={loadCoreData}
            />
          )}
        </div>
      )}

      {/* 4. Action Modals & Drawers */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        form={addForm}
        onChange={setAddForm}
        onSubmit={handleAddItemSubmit}
        loading={loading}
      />

      <IssueItemModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        item={selectedItem}
        employees={employees}
        form={issueForm}
        onChange={setIssueForm}
        onSubmit={handleIssueSubmit}
        loading={loading}
      />

      <ReturnItemModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        issue={selectedIssue}
        form={returnForm}
        onChange={setReturnForm}
        onSubmit={handleReturnSubmit}
        loading={loading}
      />

      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        item={selectedItem}
        form={restockForm}
        onChange={setRestockForm}
        onSubmit={handleRestockSubmit}
        loading={loading}
      />

      <AdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        item={selectedItem}
        form={adjustForm}
        onChange={setAdjustForm}
        onSubmit={handleAdjustSubmit}
        loading={loading}
      />

      <ItemDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={detailData}
      />
    </div>
  );
}
