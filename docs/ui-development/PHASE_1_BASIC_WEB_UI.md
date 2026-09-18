# PHASE 1 — BASIC WEB UI SPECIFICATION

```text
Status: NOT STARTED
Platform: Next.js (App Router, TypeScript, Tailwind CSS, Supabase SSR)
Target Environment: Desktop & Tablet Browsers (1024px and wider)
Visual Reference: C:\Users\rites\Desktop\library\Kfab360 (Visual inspection only; no code merging)
```

---

## 1. Objective

Deliver a fully functional, production-ready basic web application shell and core operational screens for KFAB BASIC. The system must establish the foundational design system, secure authentication flows, role-tailored dashboards, personnel rosters, daily muster registers with Asia/Kolkata date-lock support, materials catalog, supplier ledgers, stock movement logs, and append-only audit trail viewers.

---

## 2. Scope

### In-Scope (Phase 1)
* Foundational design system (industrial color palette, typography scale, shared component primitives).
* Authentication workflows (login, session persistence, logout, protected route middleware, unauthorized screens).
* Global application shell (responsive sidebar, top header bar, company switcher, user profile chip).
* Role-based dashboard foundation for all 7 tenant roles.
* Workforce personnel roster with supervisor assignment and search.
* Daily muster attendance register for active business day (`Asia/Kolkata`) with historical lock indicators.
* Material master catalog, supplier profiles, and dynamic stock balance viewer (`v_material_stock`).
* Entry forms for material Inward, Outward (gate passes), and Shop Floor Usage.
* Correction request submission workflow for locked attendance records.
* Read-only audit trail viewer for authorized administrators.

### Out-of-Scope (Deferred to Phase 2)
* Complex multi-column chart analytics and historical trend projections.
* Excel bulk upload parsing and validation engines (.xlsx import).
* Date-range multi-month attendance matrix filters and bulk batch corrections.
* Super Admin multi-tenant company creation wizard.

---

## 3. Prerequisites

1. Local Next.js project initialized and running (`kfab-web`).
2. Supabase client utilities configured (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`).
3. Database migrations (01 through 06) reviewed and available in `kfab-backend/supabase/migrations/`.
4. Visual design primitives reviewed against `C:\Users\rites\Desktop\library\Kfab360`.

---

## 4. UI/UX Principles

* **Industrial Aesthetics**: High-contrast, clean slate surfaces (`#1e2530` sidebar, `#f8fafc` background) evoking precision manufacturing.
* **Fast Factory Entry**: Minimal form fields, keyboard-friendly Tab indexing, auto-computed units and current stock.
* **Strict Visual State Indication**: Clear status chips for `PRESENT`, `ABSENT`, `INWARD`, `OUTWARD`, `LOW STOCK`, and `LOCKED`.
* **Zero Technical Jargon**: Transform raw PostgreSQL exceptions (e.g., unique constraints or trigger errors) into helpful human-readable notices.

---

## 5. Screens

### 5.1 Authentication Screens
* `/login`: Centered industrial card with KFAB branding, email/password inputs, remember me, loading spinner, and error banner.
* `/unauthorized`: Dedicated access-denied page explaining role restrictions with a "Return to Dashboard" button.

### 5.2 Application Shell & Navigation
* `MainShell`: Persistent layout housing the left sidebar, top header bar, and breadcrumb bar.
* `CompanySwitcher`: Dropdown in the top header displaying user's active company membership, switching context seamlessly.

### 5.3 Dashboards
* `/dashboard` (Role-Aware):
  * **Super Admin**: System-wide tenant count, active users count, system audit activity.
  * **Company Admin**: Today's turnout percentage, low-stock watchlist, recent gate transactions, pending corrections count.
  * **Accounts**: Stock inventory valuation indicators, recent inward challans, supplier summary.
  * **Supervisor**: Assigned bay workers turnout, unmarked muster alert.
  * **Viewer**: Read-only operations overview.

### 5.4 Workforce Management
* `/employees`: Searchable personnel table showing Employee ID, full name, trade designation, department, and assigned supervisor.
* `/employees/new` & `/employees/[id]/edit`: Modal dialog or side-sheet form to create and update worker profiles.

### 5.5 Daily Muster Attendance
* `/attendance`: Date-stamped table showing today's active workers.
  * Quick status buttons: `[ Present ]`, `[ Absent ]`, `[ Half Day ]`.
  * Visual padlock icon (`🔒 LOCKED`) on historical dates with disabled action buttons.
  * "Request Correction" action triggering the correction submission modal.

### 5.6 Inventory & Stock Ledgers
* `/stock`: Material catalog table displaying code, name, category, unit, min stock, inward, outward, usage, and computed current stock.
* `/stock/inward/new`: Inward delivery form (supplier, challan number, vehicle, items, quantity).
* `/stock/outward/new`: Outward dispatch form (destination, gate pass number, vehicle, items, quantity).
* `/stock/usage/new`: Shop floor consumption form (project/bay, material, quantity, worker).

### 5.7 Suppliers & Corrections
* `/suppliers`: Supplier directory listing contact info, address, and delivery records.
* `/corrections`: Pending correction requests queue showing original value, requested value, justification, and approval controls.
* `/audit`: Read-only log viewer displaying timestamp, acting user, module, action, and record key.

---

## 6. Navigation

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] KFAB BASIC      [Company Switcher ▾]      [Clock IST]  [User]   │
├─────────────────┬──────────────────────────────────────────────────────┤
│ ❖ Dashboard     │                                                      │
│ ⚑ Daily Muster  │                  MAIN CONTENT AREA                   │
│ ▤ Stock Master  │                                                      │
│ ⛟ Supplies      │                                                      │
│ 👥 Employees    │                                                      │
│ ⚖ Corrections   │                                                      │
│ 🛡 Audit Logs   │                                                      │
│ ⚙ Settings      │                                                      │
└─────────────────┴──────────────────────────────────────────────────────┘
```

---

## 7. Components

The foundational component library must reside in `src/components/common/`:
1. `Button`: Variants (`primary`, `secondary`, `danger`, `outline`, `ghost`), sizes (`sm`, `md`, `lg`), loading spinner integration.
2. `Input` & `Select`: Label, error message, helper text, disabled and focus-ring states.
3. `StatCard`: Numeric KPI card with icon container, percentage delta chip, and label.
4. `StatusBadge`: Semantic tone badges (`success`, `warning`, `danger`, `info`, `neutral`).
5. `DataTable`: Clean table wrapper with header sorting, striped hover rows, and pagination bar.
6. `ModalDialog`: Accessible modal container with backdrop blur, keyboard ESC close, and action buttons.
7. `ToastNotification`: Toast system for operation feedback (success, error, warning).
8. `SkeletonLoader`: Pulsing skeleton placeholders for cards and table rows.

---

## 8. User Roles & Access Control

| Module | Super Admin | Company Admin | Accounts | Supervisor | Storekeeper | Attendance User | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Companies** | Full | None | None | None | None | None | None |
| **Employees Roster** | Full | Full | Read | Read (Assigned) | Read | Read (Assigned) | Read |
| **Mark Today's Muster** | Full | Full | None | Assigned Only | None | Assigned Only | None |
| **Request Correction** | Full | Full | View | Submit | None | Submit | None |
| **Approve Correction** | Full | Full | None | None | None | None | None |
| **Stock Inward/Outward** | Full | Full | Read | None | Full | None | Read |
| **Log Stock Usage** | Full | Full | Read | Full | Full | None | Read |
| **Audit Logs** | Global | Tenant | None | None | None | None | None |

---

## 9. Data Integration

The UI connects to Supabase through typed client utilities:
* Client Components: `createBrowserClient()` from `@supabase/ssr`.
* Server Components & Server Actions: `createServerClient()` from `@supabase/ssr`.
* Flow architecture:
  ```text
  UI Component  ──>  Server Action / Supabase Client  ──>  PostgreSQL (RLS Enforced)
  ```
* All mutations must catch database exceptions and present user-friendly error banners.

---

## 10. Loading States

* Full page transitions: Next.js `loading.tsx` displaying branded skeletal placeholders.
* Form submissions: Buttons must show animated spinner and disable interaction (`disabled={isSubmitting}`).
* Tables: Render 5-row skeletal table with shimmering background bars during fetch.

---

## 11. Empty States

* Employee directory with no results: "No employees registered yet. Click [Add Employee] to start."
* Today's muster before shift: "Muster has not been marked yet for today (18 Sep 2026). Click [Mark Muster]."
* Empty search query: "No records found matching '[keyword]'. Try adjusting your filters."

---

## 12. Error States

* Network / Supabase disconnected: Offline banner informing the user that connection is pending.
* Locked attendance violation: "Date-lock enforced: Attendance for past dates cannot be edited directly. Please submit a Correction Request."
* Insufficient stock on usage: "Cannot issue 50 KG: Only 12 KG currently available in stock."

---

## 13. Permission Handling

* Hidden buttons must be reinforced with middleware-level route protection.
* If an unauthorized user attempts to access `/audit`, redirect to `/unauthorized`.
* Components check `has_company_permission(permission_name)` before rendering sensitive mutation buttons.

---

## 14. Responsive / Device Requirements

* Target viewport widths: Desktop (`1280px` - `1920px`), Laptop (`1024px`), Tablet Landscape (`1024px`).
* Sidebar must collapse to an icon-rail on screens below `1024px`.
* Tables must provide horizontal scroll wrappers (`overflow-x-auto`) to prevent layout clipping on tablet screens.

---

## 15. Security Requirements

* Zero-trust frontend: Never assume UI role state is secure; verify all actions via PostgreSQL RLS.
* No service-role key usage in `kfab-web`; only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is permitted.
* Sanitize all text input fields to prevent XSS.

---

## 16. Performance Requirements

* Initial page load under 1.5 seconds on local broadband.
* Search inputs must debounce query calls by `300ms`.
* No single source file may exceed **700 lines**.

---

## 17. Testing Requirements

* `npm run build` must succeed with **0 TypeScript and ESLint errors**.
* Verify all 7 roles can log in and see their appropriate navigation tabs.
* Test midnight date-lock simulation to ensure historical records are read-only.

---

## 18. Documentation Requirements

* Document all reusable component props in `src/components/common/README.md`.
* Maintain honest completion logs in `docs/ui-development/PHASE_1_BASIC_WEB_UI.md`.

---

## 19. Exit Criteria

```text
[ ] Foundational design tokens and typography configured in globals.css
[ ] Reusable UI component library created in src/components/common/
[ ] Login and logout workflows connected to Supabase Auth
[ ] Session restoration and protected routes verified
[ ] Responsive application shell (Sidebar, Top Bar, User Menu) implemented
[ ] Multi-tenant company switcher operational
[ ] Role-aware dashboard foundation completed for all 7 roles
[ ] Employee roster table, search, and creation forms functioning
[ ] Daily muster attendance table operational with Asia/Kolkata date-lock
[ ] Material master catalog and current stock view functioning
[ ] Inward, Outward, and Usage entry forms operational
[ ] Correction request submission workflow working
[ ] Read-only audit trail viewer operational for company admins
[ ] Loading skeletons, empty states, and humanized error messages in place
[ ] Responsive tablet/desktop layout verified
[ ] `npm run build` passes with zero errors
[ ] No file in `kfab-web` exceeds 700 lines
```

---

## 20. Do Not Do

* **DO NOT** access `supabase.com` or deploy remote migrations.
* **DO NOT** use Tailwind arbitrarily without design tokens.
* **DO NOT** merge code directly from `C:\Users\rites\Desktop\library\Kfab360`.
* **DO NOT** hardcode mock IDs or fake successful database transactions.
* **DO NOT** bypass RLS policies or PostgreSQL triggers.
