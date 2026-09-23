Inside the existing project:

```text
KFAB-BASIC/
```

Create a complete, detailed, AI-readable project specification for **KFAB BASIC**.

For this step, **DO NOT IMPLEMENT FEATURES**.

Only create documentation in Markdown format.

The documentation must be written so that another AI coding agent can read it later and understand exactly:

* What KFAB BASIC is
* Why it exists
* Who uses it
* What each role can do
* How companies work
* How users work
* How attendance works
* How stock works
* How supplies work
* How Excel works
* How data locking works
* How security should work
* How the mobile app should work
* How the web app should work
* What should be automated
* What should never happen
* What future features may be added

Do not leave important behavior ambiguous.

If something is intentionally not decided yet, explicitly mark it as:

```text
TODO / DECISION REQUIRED
```

Do not invent business requirements that are not specified below.

---

# DOCUMENTATION STRUCTURE

Create:

```text
KFAB-BASIC/
└── docs/
    ├── PROJECT_SPEC.md
    ├── ROLES_AND_PERMISSIONS.md
    ├── COMPANY_ARCHITECTURE.md
    ├── ATTENDANCE_SPEC.md
    ├── STOCK_SPEC.md
    ├── SUPPLIES_SPEC.md
    ├── EXCEL_SPEC.md
    ├── SECURITY_SPEC.md
    ├── UI_UX_SPEC.md
    ├── AUTOMATION_SPEC.md
    └── FUTURE_ROADMAP.md
```

All documents must reference `PROJECT_SPEC.md` as the master specification.

---

# 1. PROJECT_SPEC.md

Document the overall system.

## Project Name

**KFAB BASIC**

## Purpose

KFAB BASIC is a lightweight, modern, multi-company management application designed primarily for:

* Employee attendance
* Stock usage
* Material inward
* Material outward
* Supply tracking
* Basic reporting
* Controlled Excel operations

The application should eliminate unnecessary manual paperwork and repetitive data entry.

The system should automate timestamps, stock calculations, access control, data locking, summaries and validation wherever practical.

KFAB BASIC is intentionally smaller than a complete ERP.

The architecture must allow future expansion without requiring a complete rewrite.

---

# 2. APPLICATION ARCHITECTURE

The system has three independent parts:

```text
KFAB-BASIC/
│
├── kfab-mobile/
│   └── Flutter mobile application
│
├── kfab-web/
│   └── Next.js web application
│
├── kfab-backend/
│   └── Supabase backend/database
│
└── docs/
```

Technology:

### Mobile

Flutter + Dart

### Web

Next.js + TypeScript

### Backend

Supabase

### Database

PostgreSQL through Supabase

### Authentication

Supabase Auth

### Authorization

Supabase Row Level Security + application permissions

Do NOT create a separate Express/Node backend unless a future requirement genuinely requires it.

---

# 3. CORE DESIGN PRINCIPLES

Document these as mandatory principles.

## Principle 1 — Simple

The application is called KFAB BASIC because it should solve a small number of important operational problems extremely well.

Do not turn it into a giant ERP during V1.

## Principle 2 — Fast

Common actions should require minimum typing.

## Principle 3 — Automated

The system should automatically handle:

* Timestamps
* Stock calculations
* Daily summaries
* Validation
* User/company access
* Data locking
* Audit logs

## Principle 4 — Secure

Business data must be isolated between companies.

Frontend restrictions alone are NOT sufficient.

## Principle 5 — Auditable

Important changes should be traceable.

## Principle 6 — Mobile first for operations

Supervisors should be able to perform their daily work quickly from a phone.

## Principle 7 — Desktop for Accounts

Accounts users should have a more powerful desktop web interface.

---

# 4. MULTI-COMPANY SYSTEM

KFAB BASIC is a multi-company application.

An Admin can create multiple companies.

Example:

```text
Admin
│
├── KFAB
│   ├── Users
│   ├── Employees
│   ├── Attendance
│   ├── Stock
│   └── Supplies
│
├── Company 2
│   ├── Users
│   ├── Employees
│   ├── Attendance
│   ├── Stock
│   └── Supplies
│
└── Company 3
```

## Mandatory rule

Company data must be completely isolated.

Company A must never see Company B's:

* Employees
* Attendance
* Stock
* Suppliers
* Inward
* Outward
* Usage
* Reports
* Excel data
* Audit records

This isolation must be enforced at the database level using Supabase RLS.

---

# 5. COMPANY CREATION

Admin can create a company.

Company information may include:

```text
Company ID
Company Name
Company Code
Logo
Address
Phone
Email
Status
Created At
Created By
```

Status:

```text
ACTIVE
INACTIVE
```

Inactive companies should not accept normal operations.

Do not delete company data simply because a company becomes inactive.

---

# 6. USERS VS EMPLOYEES

These are different concepts.

An **application user** has login access.

An **employee** is a person whose business information is stored in the system.

Example:

```text
Application Users:
Admin
Accounts User
Supervisor

Employees:
Worker 001
Worker 002
Worker 003
Worker 004
```

Not every employee requires a login.

---

# 7. MULTI-COMPANY MEMBERSHIP

A user can potentially belong to one or multiple companies.

Example:

```text
Priya
├── KFAB → Accounts
└── Company 2 → Accounts
```

Another user:

```text
Ramesh
└── KFAB → Supervisor
```

A company membership must define:

```text
User
Company
Role
Status
Permissions
```

---

# 8. ROLES

Initial roles:

```text
SUPER ADMIN
ADMIN
ACCOUNTS
SUPERVISOR
STOREKEEPER
VIEWER
ATTENDANCE USER
```

The exact permission system should be flexible.

Do not hard-code every permission only into frontend routes.

---

# 9. SUPER ADMIN / ADMIN

Admin is the highest operational authority.

Admin can:

### Companies

* Create company
* Edit company
* Activate/deactivate company
* View company information
* Switch between authorized companies

### Users

* Create users
* Disable users
* Assign users to companies
* Change roles
* Manage permissions
* Reset access where supported
* View activity

### Supervisors

* Create supervisors
* Disable supervisors
* Assign supervisors to companies
* Assign employees to supervisors
* Control supervisor permissions

### Employees

* Add employee
* Edit employee
* Activate/deactivate employee
* Assign employee to company
* Assign employee to supervisor

### Business data

Admin can view all data within authorized companies.

Admin should NOT normally bypass historical-data controls by directly editing records.

Historical correction should use a controlled correction process.

---

# 10. SUPERVISOR ROLE

Supervisor primarily uses the Flutter mobile application.

Main functions:

```text
Attendance
Stock Usage
Supplies
```

Supervisor should be able to:

* View assigned employees
* Mark attendance
* View today's attendance
* Enter stock usage
* Record allowed supply transactions
* View relevant stock information
* View their own activity

Supervisor should NOT automatically have access to:

* Excel bulk import
* Company management
* User management
* Permission management
* Historical editing
* Other companies

unless explicitly granted by Admin.

---

# 11. ACCOUNTS ROLE

Accounts has:

### Mobile

* View relevant company data
* Attendance
* Stock
* Supplies
* Reports

### Web

* Full company operational data
* Excel import/export
* Bulk operations
* Reports
* Attendance review
* Stock review
* Supply records

Accounts should not automatically have Admin privileges.

---

# 12. STOREKEEPER

Optional operational role.

Primarily:

* Stock
* Inward
* Outward
* Material records

Permissions should be configurable by Admin.

---

# 13. VIEWER

Read-only access.

Can view permitted information but cannot modify operational records.

---

# 14. ATTENDANCE USER

Restricted role for attendance operations only.

Can mark attendance for permitted employees.

---

# 15. ATTENDANCE SYSTEM

Attendance is one of the most important modules.

The mobile UI must prioritize speed.

Supervisor opens:

```text
Attendance
→ Today
```

The application shows employees assigned to that supervisor.

Each employee has:

```text
✓ Present
✕ Absent
○ Not Marked
```

The supervisor should be able to mark attendance with one tap.

---

# 16. AUTOMATIC ATTENDANCE TIME

When attendance is marked, the system automatically records the timestamp.

Do NOT ask the supervisor to type the time.

Example:

```text
Ramesh
Present
Marked at 08:43 AM
```

The timestamp should be based on trusted/server time.

The client device time must not be trusted for security-critical operations.

---

# 17. ATTENDANCE STATES

Use:

```text
PRESENT
ABSENT
NOT_MARKED
```

Do not automatically treat NOT_MARKED as ABSENT.

---

# 18. ATTENDANCE SUMMARY

Show:

```text
Total Employees
Present
Absent
Not Marked
```

Example:

```text
30 Employees

Present: 24
Absent: 4
Not Marked: 2
```

Warn the user when attendance remains incomplete.

---

# 19. ATTENDANCE EDITING

Normal rule:

> Only current-day data can be modified.

Example:

On September 18:

```text
September 18 → Editable
September 17 → Locked
September 16 → Locked
```

At midnight:

```text
Previous day → Locked
New current day → Editable
```

The restriction MUST be enforced by the backend/database.

Do not rely on:

* Device clock
* Browser clock
* Frontend-only checks
* Hiding edit buttons

---

# 20. HISTORICAL CORRECTION

Historical records should not normally be directly edited.

Instead:

```text
Correction Request
        ↓
Reason
        ↓
Admin Review
        ↓
Approve / Reject
        ↓
Audit Log
```

If approved, preserve the original record and record the correction.

---

# 21. STOCK SYSTEM

Stock must be transaction-based.

Do not maintain only one manually editable current-stock number.

Stock should be derived from transactions.

Conceptually:

```text
Opening Stock
+
Inward
-
Outward
-
Usage
=
Closing Stock
```

Every transaction should have:

```text
Company
Material
Quantity
Unit
Date
Created By
Created At
```

---

# 22. MATERIAL MASTER

Materials should be managed through a master list.

Example:

```text
MS Plate 6mm
MS Plate 8mm
MS Plate 10mm
Welding Rod
Grinding Disc
Paint
Primer
```

Avoid free-text material names wherever possible.

Each material should have:

```text
Material ID
Name
Category
Specification
Unit
Minimum Stock
Status
```

---

# 23. UNITS

Support controlled units such as:

```text
KG
TON
NOS
LITRE
METER
MM
BAG
BOX
SET
```

Avoid allowing arbitrary unit spelling in every transaction.

---

# 24. STOCK USAGE

Supervisor can record usage.

Example:

```text
Material: MS Plate 10mm
Quantity: 25 KG
Project: Optional
Used By: Supervisor
Date: Today
```

Project can be optional because some material may be used for general factory activities.

---

# 25. STOCK INWARD

Inward is a separate transaction type/module.

Information:

```text
Date
Supplier
Material
Quantity
Unit
Vehicle Number
Invoice Number
Challan Number
Received By
Remarks
Attachments/Photo
```

---

# 26. STOCK OUTWARD

Outward is separate from inward.

Information:

```text
Date
Material
Quantity
Unit
Destination
Vehicle Number
Driver
Challan Number
Issued By
Received By
Remarks
Attachments/Photo
```

---

# 27. STOCK VALIDATION

The system should validate stock operations.

For example, it should not normally allow outward/usage greater than available stock.

If insufficient stock exists:

```text
Insufficient Stock

Available: 100 KG
Requested: 150 KG

Operation cannot continue.
```

Any exceptional override should require explicit authorization and audit logging.

---

# 28. LOW STOCK

Materials can have a minimum stock threshold.

Example:

```text
MS Plate 8mm
Current: 250 KG
Minimum: 500 KG

LOW STOCK
```

Future notification functionality can use this.

---

# 29. SUPPLIERS

Supplier master should contain:

```text
Supplier ID
Supplier Name
Contact
Phone
Email
Address
GST information (future/optional)
Status
```

Do not duplicate supplier names manually in every transaction.

---

# 30. EXCEL SYSTEM

Excel is a desktop/web Accounts tool.

It is NOT the primary database.

Supabase is the source of truth.

Excel is used for:

* Bulk import
* Bulk corrections where permitted
* Bulk creation
* Bulk updates where permitted
* Export
* Reporting

---

# 31. SEPARATE EXCEL DATA

Maintain separate Excel workflows for:

```text
Attendance
Inward
Outward
Stock Usage
Employees
Materials
```

Do not combine unrelated business data into one giant Excel file.

---

# 32. EXCEL IMPORT

Before import:

1. Read the file.
2. Validate every row.
3. Detect errors.
4. Show valid/invalid counts.
5. Show detailed errors.
6. Allow import only for valid rows.
7. Record the import event in the audit log.

Example:

```text
143 rows detected

136 valid
7 invalid

[View Errors]

[Import Valid Rows]
```

---

# 33. EXCEL ERRORS

Example:

```text
Row 24
Quantity = ABC

ERROR:
Quantity must be numeric.
```

Another:

```text
Row 38
Material = MS Platee

ERROR:
Material does not exist.
```

Another:

```text
Row 51
Date = Previous Day

ERROR:
Historical records cannot be modified through normal import.
```

---

# 34. EXCEL SECURITY

Excel imports must respect the exact same permissions as the web application.

A user must not be able to bypass:

* Company isolation
* Role permissions
* Date locking
* Validation
* Audit requirements

by uploading an Excel file.

---

# 35. DELETE POLICY

Do not casually delete business records.

For important transactions prefer:

```text
ACTIVE
CANCELLED
VOIDED
```

with an audit record.

Permanent deletion should be restricted to safe master-data situations and Admin authorization where appropriate.

---

# 36. AUDIT LOG

Record important actions.

Example:

```text
User
Company
Module
Action
Record ID
Old Data
New Data
Reason
Timestamp
```

Example:

```text
18 Sep 2026 10:43 AM

User: Priya
Company: KFAB
Module: Stock Usage

MS Plate
25 KG → 30 KG

Reason:
Correction

```

---

# 37. MOBILE UI

Flutter should be designed for operational speed.

Main navigation can include:

```text
Home
Attendance
Stock
Supplies
Profile
```

Use:

* Large touch targets
* Minimal typing
* Clear icons
* Simple forms
* Search
* Filters
* Loading states
* Empty states
* Error states
* Success feedback

---

# 38. WEB UI

Next.js web application is primarily for:

```text
Admin
Accounts
```

Potential navigation:

```text
Dashboard

Attendance

Stock
 ├── Current Stock
 ├── Inward
 ├── Outward
 └── Usage

Employees

Suppliers

Excel

Reports

Users

Companies

Settings

Audit Logs
```

Navigation should be permission-aware.

Users should only see relevant modules.

---

# 39. COMPANY SWITCHING

Users with access to multiple companies can switch companies.

Example:

```text
Current Company: KFAB ▼

KFAB
Company 2
Company 3
```

Changing company must refresh all company-specific data.

Never accidentally retain data from the previous company on screen.

---

# 40. OFFLINE SUPPORT

Future mobile support should consider poor factory internet connectivity.

Potential design:

```text
Offline
 ↓
Save locally
 ↓
Internet returns
 ↓
Sync
 ↓
Server validates
 ↓
Success / Conflict
```

Offline support must not bypass the server's date-lock or permission rules.

Mark this as a planned feature unless explicitly implemented.

---

# 41. NOTIFICATIONS

Future notifications:

### Admin

* Low stock
* Correction requests
* Important user activity

### Accounts

* Incomplete attendance
* Correction requests
* Stock warnings

### Supervisor

* Low stock
* Attendance reminders

Avoid excessive notifications.

---

# 42. DASHBOARD

Dashboard information should be role-specific.

Supervisor:

```text
Today's Attendance
Stock Usage
Supplies
```

Accounts:

```text
Attendance
Stock
Inward
Outward
Usage
Pending Corrections
Excel
Reports
```

Admin:

```text
Companies
Users
Employees
Attendance
Stock
Supplies
Activity
Alerts
```

---

# 43. AUTOMATION

Automate wherever safe.

Examples:

```text
Automatic timestamp
Automatic stock balance
Automatic daily summary
Automatic low-stock detection
Automatic validation
Automatic date locking
Automatic audit logging
Automatic role-based navigation
```

Do not automate actions that could silently create major business consequences without confirmation.

---

# 44. DATE AND TIME

Business timezone:

```text
Asia/Kolkata
```

Use trusted backend/database time for:

* Attendance timestamps
* Record creation
* Record modification
* Date locking
* Audit logs

Do not trust the client device clock for security decisions.

---

# 45. SECURITY

Use:

* Supabase Auth
* Row Level Security
* Company membership
* Role-based permissions
* Secure environment variables
* Audit logs
* Server-side validation

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to Flutter or the browser.

Only the public/anon key belongs in client applications, subject to proper RLS.

---

# 46. ERROR HANDLING

The UI should give understandable errors.

Bad:

```text
500 Internal Server Error
```

Better:

```text
Unable to save attendance.

Please check your internet connection and try again.
```

Technical details should still be logged for developers.

---

# 47. LOADING STATES

Never leave the user wondering whether an operation worked.

Use:

```text
Saving...
Saved ✓
Syncing...
Failed — Retry
```

---

# 48. CONFIRMATION

For destructive or important actions:

```text
Are you sure?

This will cancel the stock transaction.

[Cancel]
[Confirm]
```

Don't require confirmation for every simple action such as marking Present if it makes attendance unnecessarily slow.

---

# 49. DATA MODEL PRINCIPLES

The eventual database should use relational tables and foreign keys.

Expected major entities:

```text
companies
users/profiles
company_members
roles
permissions
employees
employee_assignments
attendance
materials
suppliers
stock_inward
stock_outward
stock_usage
audit_logs
correction_requests
```

Exact schema should be designed separately before implementation.

---

# 50. FUTURE EXPANSION

KFAB BASIC should eventually be expandable to:

```text
KFAB PRO
```

Potential future modules:

* Payroll
* Projects
* Purchase Orders
* Quotations
* Billing
* GST
* Fabrication drawings
* Material estimation
* Production tracking
* Quality inspection
* Dispatch
* Customer management
* Costing
* Reports
* Advanced analytics

Do not implement these in KFAB BASIC V1.

---

# 51. OUT OF SCOPE FOR INITIAL VERSION

Explicitly keep these out of V1 unless later requested:

* Full ERP
* Payroll
* GST accounting
* Customer portal
* Complex project management
* Fabrication drawing automation
* Advanced AI
* Complex financial accounting
* Manufacturing planning
* Procurement automation

---

# 52. DEVELOPMENT WORKFLOW

Future development should happen module-by-module.

Recommended order:

```text
1. Project initialization
2. Supabase database architecture
3. Authentication
4. Multi-company architecture
5. Roles and permissions
6. Admin/company/user management
7. Employee management
8. Attendance
9. Stock/material master
10. Inward
11. Outward
12. Stock usage
13. Stock calculations
14. Excel
15. Reports
16. Audit logs
17. Offline support
18. Notifications
19. UI polish
20. Testing
```

Do not build everything simultaneously.

---

# 53. AI DEVELOPMENT RULES

This documentation will be used by future AI coding agents.

Therefore:

* Read the relevant documentation before modifying code.
* Do not contradict documented business rules.
* Do not invent requirements.
* Ask for clarification when a requirement genuinely conflicts with another requirement.
* Never remove security rules to make a feature easier.
* Never bypass RLS.
* Never expose secrets.
* Do not change the database schema casually.
* Update documentation when architecture changes.
* Keep mobile and web independent.
* Keep Supabase as the backend source of truth.
* Test changes before declaring them complete.
* Preserve existing functionality when adding new modules.

---

# 54. REQUIREMENT PRIORITY

Use this hierarchy:

```text
SECURITY
    ↓
DATA INTEGRITY
    ↓
BUSINESS RULES
    ↓
FUNCTIONALITY
    ↓
UI/UX
    ↓
VISUAL DETAILS
```

A visually attractive feature must never violate security or data integrity.

---

# 55. DECISION LOG

Create a section for unresolved decisions.

Example:

```text
## TODO / DECISION REQUIRED

- Exact attendance working hours
- Whether attendance can be marked after a specific time
- Whether supervisor can edit today's attendance after marking
- Whether Accounts can mark attendance
- Exact Excel formats
- Whether offline attendance is required for V1
- Exact notification mechanism
```

Do not invent answers.

---

# FINAL REQUIREMENT

After creating all Markdown files:

1. Show the complete documentation tree.
2. Confirm every requested document was created.
3. Ensure the documents do not contain contradictory rules.
4. Ensure terminology is consistent.
5. Ensure another AI coding agent can understand the project without needing the original conversation.
6. Do NOT implement application features.
7. Do NOT modify application code unless absolutely necessary for documentation.
8. Stop after documentation is complete.
