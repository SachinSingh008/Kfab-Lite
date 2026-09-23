# KFAB BASIC — Authentic Excel Integration Architecture

## 1. Overview & Core Philosophy

In industrial heavy fabrication, spreadsheets are foundational to daily communications with procurement vendors, clients, and shop floor managers.
KFAB BASIC provides **genuine `.xlsx` binary spreadsheet generation and pre-commit validation pipelines** powered by SheetJS (`xlsx`), eliminating fake CSV or HTML table exports.

```text
[ Supabase PostgreSQL ] <---------> [ DataService (Web) ] <---------> [ Excel Engine (xlsx) ]
           |                                                                 |
           +---> Running Balance Ledgers                                      +---> Authentic .xlsx Exports
           +---> Inward Goods & Challans                                      +---> Safe Pre-Commit Imports
           +---> Daily Muster Attendance                                      +---> Standard Templates
```

---

## 2. Authentic .xlsx Generation

All exported workbooks are genuine Office Open XML binary files with custom column formatting, appropriate cell width paddings, and header styling:

1. **`Attendance.xlsx`**:
   - Contains Sl. No, Worker ID, Name, Department, Designation, Shift, Status (`PRESENT`, `ABSENT`), Punch-in Time, Supervisor verification, and Date.
2. **`Stock_Ledger.xlsx`**:
   - Contains Entry #, Date, Ref/Challan, Material, Movement Type, Inward (+), Outward (-), Usage (-), Calculated Running Balance, Unit, Counterparty/Bay, Status, and Void Notes.
3. **`Material_Master.xlsx`**:
   - Contains Material Code, Description, Category, Standard Spec, Unit, Current Stock, Min Buffer, and Stock Status.
4. **`Supplier_Master.xlsx`**:
   - Contains Vendor Code, Vendor Name, Contact Person, Phone, GSTIN, and City/State.
5. **`Stock_Inward.xlsx`**:
   - Contains Inward Journal with Challan references, Vehicle numbers, and Invoice audit flags.
6. **`Employee_Master.xlsx`**:
   - Workforce roster, wage categories, daily rates, and department assignments.

---

## 3. Safe Excel ➔ Database Import Pipeline

To ensure bad data or missing columns in an Excel sheet never corrupt the database or break the running stock balance, imports follow a strict **Pre-Commit Preview Pipeline**:

```text
1. User Selects Entity (Materials / Employees / Inward Stock)
                     |
2. Download Standard KFAB Template (.xlsx)
                     |
3. User Uploads Filled Workbook
                     |
4. In-Memory Workbook Parser & Validator
   * Checks mandatory columns (e.g. Material Code, Unit, Quantity)
   * Validates numeric bounds (e.g. Quantity > 0, Min Buffer >= 0)
   * Cross-references existing database records
                     |
5. Interactive Pre-Commit Preview Table
   * NEW: Record does not exist and will be inserted
   * UPDATED: Existing record found; changes highlighted
   * UNCHANGED: Identical record already in system
   * ERROR: Missing column or invalid format (commit blocked for this row)
   * CONFLICT: Duplicate challan or conflicting ID
                     |
6. User Review & Explicit Confirmation ("Commit Valid Rows to DB")
                     |
7. Direct Database Write & Instant Ledger Recalculation
```

---

## 4. Downloadable Standard Templates

Templates are dynamically generated with correct headers and demonstration rows:
* `KFAB_Material_Import_Template.xlsx`
* `KFAB_Employee_Import_Template.xlsx`
* `KFAB_Stock_Inward_Template.xlsx`
