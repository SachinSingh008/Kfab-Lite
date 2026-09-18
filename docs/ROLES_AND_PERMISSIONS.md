# KFAB BASIC — Roles & Permissions Specification

This document details the role-based access control (RBAC) model, permissions matrix, and administrative hierarchy for **KFAB BASIC**.

---

## 1. Hierarchy Overview

```text
Level 1: System Level
└── SUPER ADMIN (profiles.is_super_admin = true)
      ├── System User Management
      ├── Company Lifecycle (Creation, Activation, Suspension)
      ├── Cross-Company Administration
      └── Global Security & System Audit Trail

Level 2: Company Level (company_members.role)
└── ADMIN (Company Administrator)
      ├── ACCOUNTS
      ├── SUPERVISOR
      ├── STOREKEEPER
      ├── ATTENDANCE_USER
      └── VIEWER
```

---

## 2. Role Definitions

### 1. SUPER ADMIN (System-Level)
* **Identification**: Stored as `profiles.is_super_admin = true`. Does not require a `company_members` record to exercise system authority.
* **Capabilities**:
  * Create, edit, and suspend companies.
  * Appoint and manage company administrators.
  * View system-wide audit logs across all tenants.
  * Resolve cross-company conflicts and configure system-wide parameters.

### 2. ADMIN (Company-Scoped)
* **Identification**: Stored as `company_members.role = 'ADMIN'`.
* **Capabilities**:
  * Manage personnel rosters and supervisor assignments within the company.
  * Invite and manage company members (cannot promote anyone to Super Admin).
  * View, mark, and approve corrections for attendance muster.
  * Manage materials catalog, suppliers, and stock adjustments/voids.
  * Inspect company-specific audit logs.

### 3. ACCOUNTS (Company-Scoped)
* **Identification**: `company_members.role = 'ACCOUNTS'`.
* **Capabilities**:
  * View attendance muster for payroll reconciliation.
  * Review supplier invoices and inward challans.
  * View material stock balances and export financial/inventory reports to Excel.

### 4. SUPERVISOR (Team-Scoped)
* **Identification**: `company_members.role = 'SUPERVISOR'`.
* **Capabilities**:
  * View assigned worker profiles (via `employee_assignments`).
  * Mark today's attendance muster for assigned workers.
  * Log daily fabrication shop floor stock consumption (`stock_usage`).

### 5. STOREKEEPER (Company-Scoped)
* **Identification**: `company_members.role = 'STOREKEEPER'`.
* **Capabilities**:
  * Record supplier inward shipments (`stock_inward`).
  * Issue gate passes and dispatch materials (`stock_outward`).
  * Issue raw materials and consumables to work bays.
  * Void mistaken entries with mandatory audit reasoning.

### 6. ATTENDANCE_USER (Team-Scoped)
* **Identification**: `company_members.role = 'ATTENDANCE_USER'`.
* **Capabilities**:
  * Mark daily attendance for assigned team members on the current business day.

### 7. VIEWER (Company-Scoped)
* **Identification**: `company_members.role = 'VIEWER'`.
* **Capabilities**:
  * Read-only observation of attendance muster and stock inventory without modification rights.

---

## 3. Granular Permission Catalog

The `role_permissions` table maps each role to granular permissions:

| Permission String | Description | Default Roles |
| :--- | :--- | :--- |
| `users.manage` | Invite and configure users within the company | `ADMIN` |
| `employees.view` | View personnel directory | `ADMIN`, `ACCOUNTS`, `SUPERVISOR` *(assigned)*, `VIEWER` |
| `employees.manage` | Create, update, and manage employee records | `ADMIN` |
| `attendance.view` | Inspect daily muster records | `ADMIN`, `ACCOUNTS`, `SUPERVISOR` *(assigned)*, `VIEWER` |
| `attendance.mark` | Record today's muster | `ADMIN`, `SUPERVISOR` *(assigned)*, `ATTENDANCE_USER` |
| `attendance.correct`| Review and approve historical attendance corrections | `ADMIN` |
| `stock.view` | View current calculated balances and low-stock alerts | `ADMIN`, `ACCOUNTS`, `SUPERVISOR`, `STOREKEEPER`, `VIEWER` |
| `stock.inward` | Receive and record incoming supplier deliveries | `ADMIN`, `STOREKEEPER`, `ACCOUNTS` |
| `stock.outward` | Issue gate passes and external dispatches | `ADMIN`, `STOREKEEPER` |
| `stock.usage` | Log fabrication bay consumption | `ADMIN`, `STOREKEEPER`, `SUPERVISOR` |
| `stock.void` | Void or cancel mistaken stock entries | `ADMIN`, `STOREKEEPER` |
| `reports.view` | View analytical operational dashboards | `ADMIN`, `ACCOUNTS` |
| `reports.export` | Export reports to Excel (.xlsx / CSV) | `ADMIN`, `ACCOUNTS` |
| `audit.view` | Inspect company security audit trail | `ADMIN` *(Super Admin has global view)* |
