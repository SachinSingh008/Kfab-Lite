import * as XLSX from "xlsx";

/**
 * KFAB BASIC — Enterprise Excel Engine Service
 * Generates genuine .xlsx binary workbooks, downloadable templates,
 * and handles safe pre-commit parsing and validation.
 */

export interface ExcelColumnDef {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelImportRow {
  rowNumber: number;
  data: Record<string, any>;
  status: "NEW" | "UPDATED" | "UNCHANGED" | "ERROR" | "CONFLICT";
  errors: string[];
  diffSummary?: string;
}

export interface ExcelValidationResult {
  fileName: string;
  sheetName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  conflictRows: number;
  rows: ExcelImportRow[];
}

/**
 * Core export helper: writes real .xlsx binary file and triggers browser download
 */
export function exportToExcel(
  rows: Record<string, any>[],
  fileName: string,
  sheetName = "Sheet1",
  columnWidths?: { wch: number }[]
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);

  if (columnWidths && columnWidths.length > 0) {
    worksheet["!cols"] = columnWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  const cleanFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, cleanFileName);
}

// ============================================================================
// 1. OPERATION SPECIFIC EXCEL EXPORTERS (.xlsx)
// ============================================================================

export function exportAttendanceExcel(records: any[]) {
  const exportRows = records.map((r, idx) => ({
    "Sl. No": idx + 1,
    "Worker ID": r.employee_code || r.id || "N/A",
    "Worker Name": r.full_name || r.name,
    "Department": r.department || r.dept || "Fabrication",
    "Designation": r.designation || "Fabricator",
    "Shift": r.shift || "General (08:00 - 17:00)",
    "Status": r.status || "PRESENT",
    "Punch In Time": r.in_time || r.time || "08:00 AM",
    "Supervisor Verified": r.supervisor || "Ajay Verma",
    "Date": r.date || new Date().toLocaleDateString("en-IN"),
  }));

  const colWidths = [
    { wch: 8 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 24 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
    { wch: 14 },
  ];

  exportToExcel(exportRows, `Attendance_${new Date().toISOString().split("T")[0]}`, "Muster_Log", colWidths);
}

export function exportEmployeeMasterExcel(employees: any[]) {
  const exportRows = employees.map((e, idx) => ({
    "Sl. No": idx + 1,
    "Employee Code": e.employee_code || e.id,
    "Full Name": e.full_name || e.name,
    "Department": e.department || e.dept,
    "Designation": e.designation,
    "Employment Type": e.employment_type || "REGULAR",
    "Daily Base Rate (INR)": e.daily_rate || 850,
    "Status": e.status || "ACTIVE",
    "Supervisor": e.supervisor || "Ajay Verma",
  }));

  const colWidths = [
    { wch: 8 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 },
    { wch: 20 },
  ];

  exportToExcel(exportRows, `Employee_Master_${new Date().toISOString().split("T")[0]}`, "Employees", colWidths);
}

export function exportMaterialMasterExcel(materials: any[]) {
  const exportRows = materials.map((m, idx) => ({
    "Sl. No": idx + 1,
    "Material Code": m.material_code || m.code,
    "Material Description": m.name,
    "Category": m.category,
    "Standard Spec": m.specification || m.spec || "-",
    "Unit": m.unit_code || m.unit,
    "Current Stock": parseFloat(m.current_stock || m.current || 0),
    "Min Buffer": parseFloat(m.minimum_stock || m.min || 0),
    "Stock Status": m.is_low_stock || m.isLow ? "LOW STOCK ALERT" : "SUFFICIENT",
  }));

  const colWidths = [
    { wch: 8 },
    { wch: 18 },
    { wch: 30 },
    { wch: 18 },
    { wch: 26 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
  ];

  exportToExcel(exportRows, `Material_Master_${new Date().toISOString().split("T")[0]}`, "Materials", colWidths);
}

export function exportSupplierMasterExcel(suppliers: any[]) {
  const exportRows = suppliers.map((s, idx) => ({
    "Sl. No": idx + 1,
    "Supplier Code": s.supplier_code || s.code,
    "Vendor Name": s.name,
    "Contact Person": s.contact_person || "-",
    "Contact Phone": s.phone || "-",
    "GSTIN / Tax ID": s.gstin || "27AABCK1234F1Z5",
    "City / State": s.city || "Mumbai, MH",
    "Status": s.status || "ACTIVE",
  }));

  const colWidths = [
    { wch: 8 },
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
  ];

  exportToExcel(exportRows, `Supplier_Master_${new Date().toISOString().split("T")[0]}`, "Suppliers", colWidths);
}

export function exportStockLedgerExcel(ledgerEntries: any[]) {
  const exportRows = ledgerEntries.map((l, idx) => ({
    "Entry #": idx + 1,
    "Transaction Date": l.date,
    "Reference / Challan": l.ref || l.challan_number || "-",
    "Material Item": l.material_name || l.material,
    "Movement Type": l.type,
    "Inward Qty (+)": l.inward_qty ? parseFloat(l.inward_qty) : 0,
    "Outward Qty (-)": l.outward_qty ? parseFloat(l.outward_qty) : 0,
    "Usage Qty (-)": l.usage_qty ? parseFloat(l.usage_qty) : 0,
    "Running Balance": parseFloat(l.running_balance || 0),
    "Unit": l.unit || "TON",
    "Counterparty / Site": l.entity || l.supplier_name || l.destination || "-",
    "Status": l.status || "ACTIVE",
    "Void Reason": l.void_reason || "-",
  }));

  const colWidths = [
    { wch: 10 },
    { wch: 16 },
    { wch: 22 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 10 },
    { wch: 26 },
    { wch: 12 },
    { wch: 24 },
  ];

  exportToExcel(exportRows, `Stock_Ledger_${new Date().toISOString().split("T")[0]}`, "Stock_Ledger", colWidths);
}

export function exportStockInwardExcel(inwardRecords: any[]) {
  const exportRows = inwardRecords.map((r, idx) => ({
    "Sl. No": idx + 1,
    "Date": r.date,
    "Challan / Ref": r.ref || r.challan_number,
    "Vendor / Supplier": r.entity || r.supplier_name,
    "Material": r.material || r.material_name,
    "Quantity Received": r.qty || `${r.quantity} ${r.unit_code}`,
    "Vehicle Number": r.vehicle || r.vehicle_number || "-",
    "Invoice Status": r.invoice_status || "VERIFIED",
    "Store Status": r.status || "RECEIVED",
  }));

  const colWidths = [
    { wch: 8 },
    { wch: 14 },
    { wch: 20 },
    { wch: 26 },
    { wch: 26 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
  ];

  exportToExcel(exportRows, `Stock_Inward_${new Date().toISOString().split("T")[0]}`, "Inward_Log", colWidths);
}

// ============================================================================
// 2. DOWNLOADABLE IMPORT TEMPLATES (.xlsx)
// ============================================================================

export function downloadMaterialImportTemplate() {
  const sampleData = [
    {
      "Material Code": "STL-PL-25",
      "Material Name": "MS Plate 25mm IS 2062",
      "Category": "Raw Steel",
      "Specification": "E250 Gr BR, 2500x6000mm",
      "Unit Code": "TON",
      "Minimum Stock": 8.0,
      "Status": "ACTIVE",
    },
    {
      "Material Code": "WLD-FLX-01",
      "Material Name": "Submerged Arc Welding Flux",
      "Category": "Consumables",
      "Specification": "Grain size 10-60 mesh, AWS A5.17",
      "Unit Code": "BAG",
      "Minimum Stock": 20.0,
      "Status": "ACTIVE",
    },
  ];

  const colWidths = [
    { wch: 18 },
    { wch: 32 },
    { wch: 18 },
    { wch: 34 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
  ];

  exportToExcel(sampleData, "KFAB_Material_Import_Template", "Materials_Template", colWidths);
}

export function downloadEmployeeImportTemplate() {
  const sampleData = [
    {
      "Employee Code": "KF-0108",
      "Full Name": "Kailash Chand",
      "Department": "Fabrication",
      "Designation": "Senior Welder",
      "Employment Type": "REGULAR",
      "Daily Rate INR": 900,
      "Status": "ACTIVE",
    },
    {
      "Employee Code": "KF-0109",
      "Full Name": "Pradeep Gurjar",
      "Department": "Machine Shop",
      "Designation": "Helper",
      "Employment Type": "CONTRACT",
      "Daily Rate INR": 650,
      "Status": "ACTIVE",
    },
  ];

  const colWidths = [
    { wch: 18 },
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
  ];

  exportToExcel(sampleData, "KFAB_Employee_Import_Template", "Employees_Template", colWidths);
}

export function downloadStockInwardTemplate() {
  const sampleData = [
    {
      "Challan Number": "CH-4055",
      "Invoice Number": "INV-Tata-8812",
      "Supplier Code": "SUP-TATA-01",
      "Material Code": "STL-PL-12",
      "Quantity": 15.5,
      "Unit Code": "TON",
      "Vehicle Number": "MH-12-RN-9921",
      "Remarks": "Delivery accepted at Bay 1",
    },
  ];

  const colWidths = [
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 30 },
  ];

  exportToExcel(sampleData, "KFAB_Stock_Inward_Template", "Inward_Template", colWidths);
}

// ============================================================================
// 3. SAFE EXCEL PARSER & VALIDATOR (Pre-Commit Pipeline)
// ============================================================================

export async function parseAndValidateExcel(
  file: File,
  entityType: "materials" | "employees" | "inward",
  existingData: any[] = []
): Promise<ExcelValidationResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const validatedRows: ExcelImportRow[] = [];
  let validCount = 0;
  let errorCount = 0;
  let conflictCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const errors: string[] = [];
    let status: ExcelImportRow["status"] = "NEW";
    let diffSummary = "";

    if (entityType === "materials") {
      const code = String(row["Material Code"] || row["material_code"] || "").trim();
      const name = String(row["Material Name"] || row["name"] || "").trim();
      const unit = String(row["Unit Code"] || row["unit_code"] || "").trim().toUpperCase();
      const minStockRaw = row["Minimum Stock"] ?? row["minimum_stock"];

      if (!code) errors.push("Missing required field: 'Material Code'");
      if (!name) errors.push("Missing required field: 'Material Name'");
      if (!unit) errors.push("Missing required field: 'Unit Code' (e.g. TON, KG, NOS)");

      const minStock = parseFloat(minStockRaw);
      if (isNaN(minStock) || minStock < 0) {
        errors.push("Invalid 'Minimum Stock': must be a non-negative number");
      }

      // Check conflict or update with existing
      const existing = existingData.find(
        (m) => (m.material_code || m.code || "").toUpperCase() === code.toUpperCase()
      );

      if (existing) {
        if (existing.name === name && (existing.unit_code || existing.unit) === unit) {
          status = "UNCHANGED";
          diffSummary = "Existing record matches exactly";
        } else {
          status = "UPDATED";
          diffSummary = `Modifying: ${existing.name} -> ${name}`;
        }
      }
    } else if (entityType === "employees") {
      const code = String(row["Employee Code"] || row["employee_code"] || "").trim();
      const name = String(row["Full Name"] || row["name"] || "").trim();
      const dept = String(row["Department"] || row["dept"] || "").trim();

      if (!code) errors.push("Missing 'Employee Code'");
      if (!name) errors.push("Missing 'Full Name'");
      if (!dept) errors.push("Missing 'Department'");

      const existing = existingData.find(
        (e) => (e.employee_code || e.id || "").toUpperCase() === code.toUpperCase()
      );
      if (existing) {
        status = "UPDATED";
        diffSummary = `Updating personnel: ${existing.name || existing.full_name}`;
      }
    } else if (entityType === "inward") {
      const challan = String(row["Challan Number"] || row["challan_number"] || "").trim();
      const matCode = String(row["Material Code"] || row["material_code"] || "").trim();
      const qtyRaw = row["Quantity"] ?? row["quantity"];
      const qty = parseFloat(qtyRaw);

      if (!challan) errors.push("Missing 'Challan Number'");
      if (!matCode) errors.push("Missing 'Material Code'");
      if (isNaN(qty) || qty <= 0) errors.push("Quantity must be a positive number greater than zero");

      const existing = existingData.find(
        (t) => (t.ref || t.challan_number || "").toUpperCase().includes(challan.toUpperCase())
      );
      if (existing) {
        status = "CONFLICT";
        errors.push(`Challan '${challan}' already recorded in stock receipt records`);
      }
    }

    if (errors.length > 0) {
      status = "ERROR";
      errorCount++;
    } else if (status === "CONFLICT") {
      conflictCount++;
    } else {
      validCount++;
    }

    validatedRows.push({
      rowNumber,
      data: row,
      status,
      errors,
      diffSummary,
    });
  });

  return {
    fileName: file.name,
    sheetName,
    totalRows: rawRows.length,
    validRows: validCount,
    errorRows: errorCount,
    conflictRows: conflictCount,
    rows: validatedRows,
  };
}
