# PHASE 2 — ADVANCED WEB UI SPECIFICATION

```text
Status: NOT STARTED
Platform: Next.js (App Router, TypeScript, Tailwind CSS, Excel Processing, Recharts)
Target Environment: Desktop & Large Display Workstations (1280px to 4K)
Visual Reference: C:\Users\rites\Desktop\library\Kfab360 (Visual inspection only; no code merging)
```

---

## 1. Objective

Transform the foundational web portal created in Phase 1 into a sophisticated, enterprise-grade desktop management suite. Phase 2 introduces multi-dimensional operational analytics, date-range muster filtering, low-stock reorder forecasting, comprehensive Excel batch import/export pipelines with schema validation, granular multi-tenant company administration, and high-performance data tables with column customization.

---

## 2. Scope

### In-Scope (Phase 2)
* Executive KPI analytics dashboard with attendance yield, bay throughput, and consumption graphs.
* Historical date-range attendance ledger with multi-factor filters (employee, supervisor, shift, department).
* Advanced inventory ledger with full lifecycle audit trails, void tracking, and stock movement analysis.
* Comprehensive report generator (attendance muster, stock balance, vendor delivery reconciliation).
* Robust two-way Excel workflow (.xlsx bulk import with schema validation, preview modal, error rollback, and template exports).
* Super Admin multi-company management suite and Company Admin team invitation/role configuration.
* High-performance data table engine with column toggle, multi-column sorting, and bulk action toolbar.
* Power-user productivity tools: global `Cmd+K` command palette, keyboard shortcuts, and action confirmation modals.

### Out-of-Scope (Deferred to Phase 3 & 4)
* Mobile touch screen interfaces and Flutter native compilation (Phase 3).
* Mobile camera integration, challan photo capture, and push notification services (Phase 4).

---

## 3. Prerequisites

1. Phase 1 web application completed and fully approved by user.
2. All Phase 1 exit criteria met and verified with `npm run build`.
3. Client-side Excel parsing library integrated (e.g., `xlsx` or `exceljs`).
4. Charting library integrated (e.g., lightweight `recharts`).

---

## 4. UI/UX Principles

* **High Information Density**: Clean tabular presentation allowing accounts and supervisors to scan hundreds of rows without cognitive fatigue.
* **Non-Destructive Workflows**: Every bulk operation, stock void, or Excel import must feature a clear confirmation gate with audit reason logging.
* **Fail-Safe Data Ingestion**: Excel imports must never fail silently; invalid rows are highlighted in red with cell-specific error notes.
* **Fluid Keyboard Control**: Support quick search (`/` or `Ctrl+K`), table pagination via arrow keys, and modal escape.

---

## 5. Screens

### 5.1 Advanced Operations Analytics
* `/analytics`: Real-time operational command center:
  * Attendance turnout trends over 7, 30, and 90 days.
  * Material burn rate charts comparing inward vs. usage per fabrication bay.
  * Vendor reliability indicators based on on-time inward shipments.

### 5.2 Historical Attendance Matrix
* `/attendance/history`: Multi-month calendar & matrix view:
  * Date-range picker supporting custom periods (e.g., 01 Aug to 31 Aug).
  * Worker rows cross-referenced against 31 days with status chips.
  * Summary columns: Total Days, Present, Absent, Half Day, Overtime Hours.
  * Export button generating formatted Excel muster sheets.

### 5.3 Advanced Stock & Void Ledger
* `/stock/ledger`: Material transaction ledger showing chronological entries:
  * Inward (+), Outward (-), and Usage (-) movements.
  * Visual badge for voided records with strike-through and audit notes.
  * Filter by material specification, vendor, or project code.

### 5.4 Excel Import/Export Center
* `/tools/excel`: Centralized data migration and reporting hub:
  * **Muster Import**: Upload monthly biometric or supervisor Excel sheets.
  * **Material Master Import**: Bulk create materials with initial balances.
  * **Template Downloads**: Official pre-formatted `.xlsx` templates.

### 5.5 System & Company Administration
* `/admin/companies` (Super Admin Only):
  * Company roster with tenant code, creation date, status toggle, and assigned company admins.
* `/admin/team` (Company Admin):
  * Team member list with role assignment dropdowns and permission toggles.

---

## 6. Navigation

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] KFAB BASIC      [Company Switcher ▾]      [🔍 Search Cmd+K]    │
├─────────────────┬──────────────────────────────────────────────────────┤
│ ❖ Executive KPI │                                                      │
│ ⚑ Muster Matrix │               ADVANCED WORKSPACE AREA                │
│ ▤ Stock Ledger  │                                                      │
│ 📊 Reports Hub  │                                                      │
│ 📥 Excel Center │                                                      │
│ 🏢 Tenant Admin │                                                      │
│ 👥 Team Roles   │                                                      │
│ 🛡 Full Audit   │                                                      │
└─────────────────┴──────────────────────────────────────────────────────┘
```

---

## 7. Components

Advanced components residing in `src/components/advanced/`:
1. `DateRangePicker`: Calendar popover with presets (Today, Yesterday, Last 7 Days, Month to Date, Custom Range).
2. `ExcelDropzone`: Drag-and-drop file upload container with `.xlsx` / `.csv` format validation and file size check.
3. `ImportPreviewModal`: Tabular modal presenting parsed Excel rows with green checkmarks for valid rows and red badges for syntax errors.
4. `TrendChart`: Responsive area and bar charts illustrating workforce and material utilization.
5. `CommandPalette`: `Cmd+K` global search overlay for rapid navigation across pages, workers, and materials.
6. `ColumnManager`: Dropdown allowing users to show, hide, and reorder table columns.
7. `ConfirmDialog`: Two-step modal requiring explicit typed confirmation or reason text for destructive operations (e.g., transaction voids).

---

## 8. User Roles & Advanced Permissions

* **Super Admin**: Full global visibility across companies, ability to freeze/suspend tenants, and inspect cross-company audit trails.
* **Company Admin**: Configure company metadata, manage user roles, review all correction requests, and execute transaction voids.
* **Accounts**: Generate comprehensive payroll muster sheets, export tax/inventory ledgers, and reconcile vendor challans.
* **Supervisor / Storekeeper**: Restricted from accessing system admin, financial valuation metrics, or cross-tenant settings.

---

## 9. Data Integration & Excel Pipeline

The Excel import workflow enforces strict validation:

```text
User Drops .xlsx File
         ↓
Browser Parser (`xlsx` engine reads buffer)
         ↓
Schema Validator (checks column headers, employee IDs, date formats)
         ↓
Preview Modal (displays valid vs. invalid rows with exact row numbers)
         ↓
User Clicks [Confirm Import]
         ↓
Batch Server Action / Supabase RPC (`apply_bulk_muster` with transaction rollback)
         ↓
Audit Trail Entry Recorded
```

---

## 10. Loading States

* Excel file parsing: Progress bar showing percentage (`Parsing row 450 of 1,200...`).
* Multi-month muster calculation: Skeleton grid simulating 30 columns of attendance chips.
* Chart rendering: Smooth CSS pulse placeholders until time-series data settles.

---

## 11. Empty States

* Reports with no data in date range: "No transactions recorded between selected dates. Try expanding your date range."
* Void ledger empty: "No records have been voided in this company."
* Excel preview with zero errors: "All 250 rows validated successfully. Ready to import."

---

## 12. Error States

* Corrupted Excel workbook: "Invalid Excel format: Could not parse workbook. Please download and use the official KFAB template."
* Duplicate records during import: "Row 14: Worker KF-0102 already has attendance marked for 18 Sep 2026. Import aborted to prevent overwrite."
* Permission rejection: "Operation forbidden: Only Company Admins can void committed stock entries."

---

## 13. Permission Handling

* Dynamic UI adaptation: Table action menus automatically omit "Void" or "Edit" buttons if the current user lacks `manage_stock` or `manage_company`.
* Server action validation: Every bulk import or admin action independently checks `has_company_permission()` on the server before mutating the database.

---

## 14. Responsive / Workstation Requirements

* Optimized for widescreen monitors (`1440px` - `2560px`) common in factory administrative offices.
* Table containers must maintain fixed header rows (`sticky top-0`) while scrolling through thousands of entries.
* Horizontal scrollbars must be permanently visible and styled with high-contrast thumb rails.

---

## 15. Security Requirements

* Never trust parsed Excel payloads; all rows are validated server-side within a PostgreSQL database transaction.
* Super Admin boundaries: Company Admins cannot invite or elevate any user to Super Admin status (`is_super_admin` trigger enforced).
* Append-only audit trail logging for all batch operations, containing file name, row count, and acting user ID.

---

## 16. Performance Requirements

* Parsing a 2,000-row Excel file must complete in under 800 milliseconds in the browser.
* Large data tables with > 500 records must implement virtualized rendering or paginated fetches (`limit 50`).
* No source file in `kfab-web` may exceed **700 lines**.

---

## 17. Testing Requirements

* Verify Excel import with deliberately malformed files (missing columns, invalid dates, non-existent worker IDs) to ensure proper rejection.
* Test date-range filter boundaries across month and year transitions.
* `npm run build` must complete with zero errors.

---

## 18. Documentation Requirements

* Update `docs/EXCEL_SPEC.md` with official column definitions for all templates.
* Maintain implementation notes in `docs/ui-development/PHASE_2_ADVANCED_WEB_UI.md`.

---

## 19. Exit Criteria

```text
[ ] Advanced KPI operations dashboard operational with visual trend charts
[ ] Date-range attendance muster matrix functional with summary totals
[ ] Stock movement ledger complete with void record auditing
[ ] Excel bulk import engine operational with client-side schema validation
[ ] Excel preview modal functioning with row-level error indicators
[ ] Official Excel templates downloadable for attendance and materials
[ ] Super Admin company management screen functioning
[ ] Company Admin team management and role assignment operational
[ ] Data tables equipped with search, multi-column sorting, and column visibility
[ ] Global Cmd+K command palette operational
[ ] Two-step confirmation dialogs active on all destructive actions
[ ] Zero regressions in Phase 1 basic web features
[ ] Production build passes with zero errors (`npm run build`)
[ ] All source files remain strictly below 700 lines
```

---

## 20. Do Not Do

* **DO NOT** attempt remote Supabase database operations.
* **DO NOT** use heavy unoptimized charting libraries that inflate bundle size.
* **DO NOT** allow Excel imports without full client and server validation.
* **DO NOT** bypass atomic stock locking (`SELECT ... FOR UPDATE`) during bulk transactions.
