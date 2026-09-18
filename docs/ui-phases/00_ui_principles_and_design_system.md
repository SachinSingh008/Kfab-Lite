# KFAB BASIC — UI DESIGN PRINCIPLES & SYSTEM

## Purpose

This document defines the core UI principles, project structure, Supabase boundaries, and reusable design system for KFAB BASIC.

KFAB BASIC is a modern, professional, industrial management application for KFAB heavy-metal fabrication operations.

The existing local Kfab360 project may be inspected as a visual/UI reference only:
`C:\Users\rites\Desktop\library\Kfab360`

KFAB BASIC remains an independent project.

---

# 1. Core UI Principles

The UI must NOT look like a traditional old ERP.

It should feel:
- Modern
- Professional
- Industrial
- Clean
- Fast
- Simple
- Trustworthy
- Easy for factory staff
- Efficient for Accounts
- Powerful for Admin
- Touch-friendly on mobile

Priorities:
- Fast actions
- Minimal typing
- Clear information
- Large touch targets
- Strong visual hierarchy
- Consistent components
- Clear statuses
- Good empty/loading/error states
- Responsive layout
- Accessibility

---

# 2. Project Structure

```text
KFAB-BASIC/
├── kfab-mobile/       # Flutter mobile application
├── kfab-web/          # Next.js web application
├── kfab-backend/      # Supabase/database configuration
└── docs/              # Project documentation
```

---

# 3. Backend and Supabase Rules

The existing Supabase database architecture is the source of truth.

The UI must work with:
- Authentication
- Profiles
- Companies
- Company memberships
- Roles and permissions
- Employees
- Employee assignments
- Attendance
- Materials
- Units
- Suppliers
- Stock inward
- Stock outward
- Stock usage
- Correction requests
- Audit logs
- Material stock view

Do NOT redesign the database just to make UI development easier.
Do NOT weaken RLS, triggers, functions, date locks, stock validation, company isolation, or audit protection.

## Supabase access restriction

The user personally handles all Supabase.com work.

AI coding agents MUST NOT:
- Open Supabase.com
- Browse Supabase.com
- Log in to Supabase
- Create a remote Supabase project
- Link a remote project
- Deploy migrations
- Execute remote SQL
- Use user Supabase credentials
- Request service-role credentials
- Request passwords

All coding and UI development must remain local unless the user explicitly changes this instruction.

---

# 4. Design System

Before building individual screens, establish reusable design primitives.

## Typography

Create consistent styles for:
- Page titles
- Section headings
- Card headings
- Body text
- Labels
- Helper text
- Table text
- Status text
- Buttons

Prioritize readability.

## Spacing

Use a consistent spacing scale. Avoid random margins and padding.

## Colors

Create a KFAB-oriented professional palette.

Use color carefully for:
- Primary actions
- Success
- Warning
- Error
- Information
- Attendance status
- Stock status

Avoid excessive bright colors.

## Reusable Components

Create reusable components for:
- Buttons
- Inputs
- Selects
- Search
- Date selectors
- Dropdowns
- Cards
- Tables
- Badges
- Tabs
- Dialogs
- Confirmations
- Toasts
- Alerts
- Empty states
- Loading states
- Skeletons
- Pagination
- Filters
- File upload
- Status indicators
