# PHASE 1 — BASIC WEB UI

## Goal

Build the complete basic web application shell and core screens in Next.js.

Focus on:
- Layout
- Navigation
- Authentication screens
- Dashboard foundation
- Core module pages
- Basic CRUD UI
- Desktop/tablet responsiveness
- Reusable components

Do not attempt advanced analytics or complex workflows yet.

## 1. Web Application Shell

Create:
- Sidebar
- Top navigation
- Main content area
- User menu
- Company selector
- Notifications area
- Breadcrumbs where useful

Suggested structure:

```text
┌────────────────────────────────────────────────────┐
│ KFAB BASIC                         User   Company │
├──────────────┬─────────────────────────────────────┤
│ Dashboard    │                                     │
│ Attendance   │           MAIN CONTENT              │
│ Employees    │                                     │
│ Inventory    │                                     │
│ Reports      │                                     │
│ Excel        │                                     │
│ Admin        │                                     │
│ Settings     │                                     │
└──────────────┴─────────────────────────────────────┘
```

## 2. Login

Create a professional login page with:
- KFAB branding
- Email
- Password
- Login button
- Loading state
- Invalid credentials error
- Session handling

Never expose raw technical errors.

## 3. Authentication States

Create UI for:
- Loading session
- Logged in
- Logged out
- Unauthorized
- Session expired
- Authentication failure

## 4. Company Switcher

For multi-company users:

```text
Current Company
    ↓
KFAB
    ↓
Company 2
    ↓
Company 3
```

Switching company must refresh:
- Role
- Permissions
- Dashboard
- Navigation
- Company-specific data

## 5. Basic Dashboards

### Super Admin
Show:
- Companies
- Active companies
- Users
- System activity

### Company Admin
Show:
- Today's attendance
- Present
- Absent
- Not marked
- Stock alerts
- Recent inward
- Recent outward
- Recent usage
- Pending corrections

### Accounts
Show:
- Stock
- Inward
- Outward
- Usage
- Suppliers
- Reports
- Excel

### Supervisor
Show:
- Assigned workers
- Today's attendance
- Present
- Absent
- Not marked

### Viewer
Show only permitted read-only information.

## 6. Employee UI

Create:
- Employee list
- Add employee
- Edit employee
- Employee details
- Employee status
- Supervisor assignment

Support:
- Search
- Basic filters
- Sorting
- Pagination

## 7. Attendance UI

Basic daily interface:

```text
TODAY — 18 September

Employee        Status

Ramesh          ✓ Present
Suresh          ✕ Absent
Mahesh          — Not Marked
Ganesh          ✓ Present
```

Use simple actions.
Show marked time.
Historical records should visibly show `LOCKED`.
Do not provide a normal edit button for historical attendance.

## 8. Materials UI

Create:
- Materials list
- Add material
- Edit material
- Material details

Show:
- Material code
- Name
- Category
- Specification
- Unit
- Minimum stock
- Status

## 9. Supplier UI

Create:
- Supplier list
- Add supplier
- Edit supplier
- Supplier details

Show:
- Supplier name
- Contact person
- Phone
- Address
- Status

## 10. Basic Stock UI

Create:
- Stock dashboard
- Stock inward
- Stock outward
- Stock usage

Display:
- Material
- Inward
- Outward
- Usage
- Current stock
- Minimum stock
- Status

Use the database stock view as the source of truth.

## 11. Basic Forms

### Inward
```text
Date
Supplier
Material
Quantity
Unit
Vehicle No
Invoice No
Challan No
Received By
Remarks
```

### Outward
```text
Date
Material
Quantity
Destination
Vehicle No
Driver
Challan No
Issued By
Received By
Remarks
```

### Usage
```text
Date
Material
Quantity
Unit
Project / Work Bay
Used By
Remarks
```

Auto-fill values wherever possible.

## 12. Correction UI

Create:
- Correction request list
- Request correction
- Request details

Show:
- Current value
- Requested value
- Reason
- Requester
- Status
- Reviewer
- Review date

## 13. Audit UI

Create a read-only audit screen for authorized users.

Show:
- Time
- User
- Module
- Action
- Record
- Reason

No edit/delete controls.

## Phase 1 Exit Criteria

Phase 1 is complete when:
- Login UI works
- Protected routes work
- Company switcher works
- Role-aware navigation works
- Dashboard foundation works
- Employees UI exists
- Attendance UI exists
- Materials UI exists
- Suppliers UI exists
- Inward UI exists
- Outward UI exists
- Usage UI exists
- Correction UI exists
- Audit UI exists
- Loading states exist
- Empty states exist
- Error states exist
- Responsive web layout works
