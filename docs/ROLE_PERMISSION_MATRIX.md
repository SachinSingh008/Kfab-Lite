# KFAB BASIC — Role-Based Access Control (RBAC) Permission Matrix

This document defines the strict multi-role permission boundaries implemented across the **Next.js Web Portal**, **Flutter Mobile Terminal**, and **Supabase PostgreSQL** database.

---

## 1. System Role Hierarchy

The platform strictly recognizes **four defined roles**. No additional or arbitrary roles exist:

| Role Code | Role Name | Primary Responsibility | Scope |
|---|---|---|---|
| `SUPER_ADMIN` | System Super Administrator | Tenant & User Management, System Configuration, Database Superuser | Global / Cross-Company |
| `ADMIN` | Company Administrator | Plant Operations Management, Master Data, Stock Audits, Settings | Single Company |
| `SUPERVISOR` | Shop-Floor Supervisor | Daily Muster Attendance, Shift Assignments, Bay Consumption | Shop-Floor & Bays |
| `ACCOUNTANT` | Plant Accountant / Auditor | Inward Invoice Reconciliation, Vendor Ledgers, Stock Valuation | Financials & Stores |

---

## 2. Functional Access Matrix

| Feature / Module | Super Admin | Company Admin | Supervisor | Accountant |
|---|:---:|:---:|:---:|:---:|
| **User & Credential Management** (Create, Edit, Delete, Passwords) | ✅ Full Control | ❌ No Access | ❌ No Access | ❌ No Access |
| **Operations Dashboard** | ✅ Full View | ✅ Operational View | ✅ Bay View | ✅ Financial View |
| **Daily Muster Attendance** | ✅ Full Edit | ✅ Full Edit | ✅ Mark & Log | ❌ Hidden |
| **Material Catalog (Stock Inventory)** | ✅ Full Edit | ✅ Full Edit | 👁️ View Only | ❌ Hidden |
| **Real-Time Stock Ledger** | ✅ View & Void | ✅ View & Void | ❌ Hidden | 👁️ View & Audit |
| **Supplies & Inward Goods** | ✅ Full Access | ✅ Full Access | ✅ Log Physical Receipt | 👁️ Audit Receipts |
| **Vendor Invoice Reconciliation** | ✅ Full Access | ✅ Full Access | ❌ Hidden | ✅ Full Verification |
| **Workforce Personnel Directory** | ✅ Full Access | ✅ Full Access | 👁️ View Directory | ❌ Hidden |
| **Live Excel Exports (.xlsx)** | ✅ All Workbooks | ✅ All Workbooks | ❌ Hidden | ✅ Financial / Stock |
| **Excel ➔ DB Safe Import Hub** | ✅ Full Access | ✅ Full Access | ❌ Hidden | ✅ Stock / Inward |
| **Company Configuration & Settings** | ✅ Full Access | ✅ Full Access | ❌ Hidden | ❌ Hidden |

---

## 3. Financial & Operational Guardrails

### Supervisor Restrictions
* **No Access to Financials**: Purchase rates per unit, invoice values, tax valuations, and vendor payment statuses are completely hidden from Supervisors.
* **No User Administration**: Supervisors cannot view or manipulate system user credentials or roles.
* **Cannot Void Ledger Entries**: Only Company Admin and Super Admin possess authority to execute audit void procedures.

### Accountant Restrictions
* **No Worker Muster Manipulation**: Accountants cannot mark worker attendance, edit shifts, or reassign workers to fabrication bays.
* **No Master Data Deletion**: Materials and suppliers cannot be hard deleted; records are managed via formal approval workflows.

### Super Admin Privileges
* **Exclusive User Provisioning**: The only role permitted to provision new users (`ADMIN`, `SUPERVISOR`, `ACCOUNTANT`), reset passwords, update usernames, or deactivate accounts.
* **Master System Overseer**: Super Administrator account (`Superadmin@008`) is protected from deletion.
