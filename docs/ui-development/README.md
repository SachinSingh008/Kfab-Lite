# KFAB BASIC — UI DEVELOPMENT MASTER ROADMAP & GOVERNANCE

## Overview

This directory contains the official, phase-wise implementation specifications for developing the user interfaces of **KFAB BASIC**. 

KFAB BASIC is an industrial-grade enterprise application designed for heavy fabrication manufacturing operations. The user interfaces span two primary application platforms:
1. **Next.js Web Application** (`kfab-web`): Desktop and tablet web portal tailored for Administration, Accounts, Inventory Management, and Excel-based Reporting.
2. **Flutter Mobile Application** (`kfab-mobile`): Touch-first mobile application optimized for factory-floor supervisors, storekeepers, and mobile administrators.

---

## UI Development Phase Structure

The development roadmap is strictly divided into four sequential phases:

```text
KFAB BASIC UI DEVELOPMENT
        │
        ├── Phase 1: Basic Web UI
        │     Next.js App Router, foundational design system, auth, shell, and core CRUD
        │
        ├── Phase 2: Advanced Web UI
        │     Advanced analytics, date-range attendance, Excel workflows, and full administration
        │
        ├── Phase 3: Basic Mobile App UI
        │     Flutter touch-first interface, mobile muster, floor stock usage, and roster
        │
        ├── Phase 4: Advanced Mobile App UI
        │     Offline sync queue, challan camera attachments, push notifications, and realtime
```

---

## Phase Documentation Directory

| Document | Platform | Target Scope | Status |
| :--- | :--- | :--- | :---: |
| [PHASE_1_BASIC_WEB_UI.md](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/docs/ui-development/PHASE_1_BASIC_WEB_UI.md) | Web (`Next.js`) | Application shell, authentication, role dashboards, daily muster, inventory, suppliers, and audit viewer | **NOT STARTED** |
| [PHASE_2_ADVANCED_WEB_UI.md](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/docs/ui-development/PHASE_2_ADVANCED_WEB_UI.md) | Web (`Next.js`) | Advanced analytics, Excel bulk import/export, historical attendance filters, advanced tables, and company admin | **NOT STARTED** |
| [PHASE_3_BASIC_MOBILE_APP.md](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/docs/ui-development/PHASE_3_BASIC_MOBILE_APP.md) | Mobile (`Flutter`) | Touch-first mobile muster, floor material consumption entry, worker roster cards, and profile management | **NOT STARTED** |
| [PHASE_4_ADVANCED_MOBILE_APP.md](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/docs/ui-development/PHASE_4_ADVANCED_MOBILE_APP.md) | Mobile (`Flutter`) | Robust offline sync queue, delivery challan camera uploads, push alerts, realtime muster updates, and performance tuning | **COMPLETED** |

---

## Phase Dependencies & Progression Rules

1. **Strict Sequential Execution**:
   ```text
   PHASE 1 (Basic Web)
          ↓
   PHASE 2 (Advanced Web)
          ↓
   PHASE 3 (Basic Mobile)
          ↓
   PHASE 4 (Advanced Mobile)
   ```
2. **Mandatory Sign-off Before Advancement**:
   A phase must meet **100% of its exit criteria** and be explicitly reviewed and approved by the user before the coding agent begins work on the subsequent phase.
3. **Component Reusability**:
   - Phase 2 builds directly upon the component library and API integration patterns developed in Phase 1.
   - Phase 3 shares common business terminology, validation logic, and Supabase data models established in Phase 1 & 2.
   - Phase 4 extends Phase 3 mobile screens with offline queuing, device capabilities (camera), and push notifications.
4. **No Premature Complexity**:
   Do not introduce Phase 2, 3, or 4 features (such as Excel parser engines or mobile camera plugins) during Phase 1 development.

---

## Absolute Boundaries & Security Rules

### 1. Remote Supabase Access Prohibition
The user personally manages all remote operations on [Supabase.com](https://supabase.com). 
AI coding agents MUST NOT:
- Browse or open `supabase.com`.
- Request or log in with user credentials or service-role keys.
- Push remote migrations or execute SQL against any remote database.
- Attempt to automate or link remote Supabase instances.
*All database configuration, integration testing, and UI development remain 100% local.*

### 2. Database Authority & RLS Boundaries
The PostgreSQL schema designed in `kfab-backend/supabase/migrations/` is the single source of truth.
- The UI layer MUST NEVER bypass Row Level Security (RLS) or database triggers.
- Frontend hiding of buttons or forms is a **UX feature**, not a security boundary.
- Server date locks (`Asia/Kolkata` midnight lockout) and atomic inventory locks (`SELECT ... FOR UPDATE`) are strictly enforced in the database; the UI must gracefully reflect and respect these server-enforced rules.

### 3. Visual Reference Guidelines (`Kfab360`)
The local project at `C:\Users\rites\Desktop\library\Kfab360` serves strictly as an inspection reference for:
- Color palette harmony, typography, and card spacing.
- Factory-friendly button sizing and high-contrast tables.
- Navigation paradigms and information hierarchy.
**DO NOT** copy or merge its code, reuse obsolete architecture, or alter KFAB BASIC's modern Next.js / Flutter / Supabase technology stack.

---

## AI Agent Development Protocol

When assigned to develop a specific phase, the AI coding assistant must adhere to these directives:
1. **Read Before Coding**: Thoroughly read the target phase document, `docs/ROLES_AND_PERMISSIONS.md`, and `docs/DATABASE_DESIGN.md`.
2. **Inspect Existing Code**: Check already created components in `src/components/` and `src/lib/` before creating new ones.
3. **Maintain Status Integrity**: Update the phase status (`NOT STARTED` → `IN PROGRESS` → `COMPLETED`) only when verifiable progress occurs.
4. **No Mock Faking**: Connect real Supabase client queries against the local schema; do not indefinitely postpone data integration with static mocks.
5. **Enforce Line Count Limits**: Ensure no newly created source or documentation file exceeds **700 lines**. Keep components modular, focused, and under 250 lines wherever possible.
