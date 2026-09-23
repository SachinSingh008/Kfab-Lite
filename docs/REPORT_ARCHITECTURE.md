# KFAB BASIC — Enterprise Report Architecture

## 1. Overview

KFAB BASIC provides unified reporting capabilities spanning daily operational muster logs, inventory audits, and financial reconciliation. Reports are designed for both immediate on-screen inspection and genuine `.xlsx` spreadsheet extraction for procurement audits and chartered accountant filings.

---

## 2. Standard Operational Reports

### A. Daily Muster & Attendance Report
* **Target Audience**: Supervisor, Plant Manager, HR Admin
* **Format**: `.xlsx` (Sheet: `Muster_Log`)
* **Key Fields**: Worker ID, Full Name, Department, Shift, Status (`PRESENT`, `ABSENT`, `HALF_DAY`), In-Time, Supervisor Verified, Date
* **Calculation**: Daily turnout percentage, overtime hours, active vs absent counts.

### B. Dynamic Stock Movement Ledger
* **Target Audience**: Plant Admin, Storekeeper, Financial Auditor
* **Format**: `.xlsx` (Sheet: `Stock_Ledger`)
* **Key Fields**: Date, Ref/Challan, Material, Movement Type, Inward (+), Outward (-), Usage (-), Calculated Running Balance, Unit, Counterparty/Bay, Status, Void Reason
* **Audit Trail**: Every transaction is chronologically numbered with permanent running balances.

### C. Vendor Challan vs Tax Invoice Reconciliation
* **Target Audience**: Plant Accountant, Super Admin
* **Format**: `.xlsx` (Sheet: `Accounts`)
* **Key Fields**: Challan #, Invoice #, Vendor Name, Material, Billed Qty, Received Qty, Rate/Unit (INR), Taxable Value, Reconciliation Status, Payment Clearance
* **Discrepancy Identification**: Automatically flags any bill where invoiced weight exceeds physical store receipt weight.

### D. Material Catalog & Safety Buffer Audit
* **Target Audience**: Procurement Manager, Company Admin
* **Format**: `.xlsx` (Sheet: `Materials`)
* **Key Fields**: Material Code, Description, Category, Spec, Unit, Current Balance, Minimum Buffer, Reorder Status.
