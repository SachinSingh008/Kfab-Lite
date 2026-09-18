# PHASE 3 — BASIC MOBILE APP SPECIFICATION

```text
Status: NOT STARTED
Platform: Flutter (Dart, Provider/Riverpod, Supabase Flutter SDK)
Target Environment: Android & iOS Mobile Handsets (Portrait Mode)
Visual Reference: C:\Users\rites\Desktop\library\Kfab360 (Visual inspection only; no code merging)
```

---

## 1. Objective

Deliver a high-velocity, touch-first Flutter mobile application for KFAB BASIC, specifically engineered for factory-floor operations. The mobile application empowers shop-floor supervisors, storekeepers, and site administrators to execute rapid daily muster marking with 1-tap toggles, log instant material usage at fabrication bays, browse worker personnel profiles, inspect real-time material stock balances, and prepare architectural hooks for offline operation.

---

## 2. Scope

### In-Scope (Phase 3)
* Native Flutter application shell with bottom navigation bar (Home, Attendance, Stock, Employees, More).
* Mobile authentication flows (clean login card, session restoration from secure storage, biometric/PIN hooks, logout).
* Role-customized mobile dashboards (Supervisor turnout summary, Admin operations overview, Accounts inventory snapshot).
* Touch-first daily attendance muster with large action buttons (`[ PRESENT ]`, `[ ABSENT ]`) and instant visual feedback.
* Clear visual attendance states: `PRESENT`, `ABSENT`, `NOT MARKED`, and `🔒 LOCKED` with correction request submission modal.
* Streamlined material consumption logger (`Stock Usage`) designed for one-handed shop floor entry.
* Mobile personnel directory featuring searchable worker cards with phone call and supervisor tags.
* User profile screen showing active company, assigned role, and permissions summary.
* Architectural groundwork and data structures for local action queuing (offline preparation).

### Out-of-Scope (Deferred to Phase 4)
* Camera barcode/QR code material scanning.
* Delivery challan camera photo capture and Supabase Storage bucket uploads.
* Full background auto-sync conflict resolution engine (Phase 4).
* Firebase Cloud Messaging (FCM) push notifications.

---

## 3. Prerequisites

1. Flutter SDK configured and verified with `flutter doctor`.
2. Existing Flutter project in `kfab-mobile` compiles cleanly (`flutter analyze` passes).
3. Supabase Flutter SDK integrated (`supabase_flutter` package).
4. Local test device or Android emulator configured.

---

## 4. UI/UX Principles

* **Touch-First Ergonomics**: Action targets must be at least `48x48 dp`. Essential buttons (`PRESENT`, `SAVE`) are placed within the natural thumb zone.
* **Minimal Typing**: Factory supervisors wearing gloves or working in dusty bays cannot type long paragraphs; use dropdowns, steppers, and quick toggles.
* **Instant Tactile Feedback**: Micro-haptic vibration and immediate visual color transition upon marking attendance or saving usage.
* **High Legibility in Bright Sunlight**: High-contrast typography and distinct semantic colors (Emerald `#10b981`, Crimson `#ef4444`, Slate `#0f172a`).

---

## 5. Screens

### 5.1 Mobile Authentication
* `LoginScreen`: Minimalist industrial screen featuring KFAB logo, email/password fields, "Remember Me" toggle, and a full-width primary button.
* `CompanySelectScreen`: Displayed if user belongs to multiple companies, allowing 1-tap workspace activation.

### 5.2 Mobile Dashboards
* `SupervisorDashboard`:
  * Header greeting with current date and shift.
  * Turnout donut card (e.g., `32 Present / 4 Absent / 3 Unmarked`).
  * Big primary CTA: `[ MARK TODAY'S MUSTER ]`.
* `AdminDashboard`:
  * Operations card: muster turnout, critical low-stock count, today's inward gate count.
  * Quick links to pending correction approvals.

### 5.3 Daily Muster Attendance (Core Mobile Workflow)
* `AttendanceMusterScreen`:
  * Sticky search bar with worker name / ID filter.
  * Worker list card items:
    ```text
    ┌──────────────────────────────────────────────────┐
    │ Ramesh Sharma (KF-0101)        Welder Grade 1   │
    │ [  ✓ PRESENT  ]         [  ✕ ABSENT  ]           │
    └──────────────────────────────────────────────────┘
    ```
  * Historical dates clearly flagged with `🔒 Locked at 23:59 IST`. Tapping locked row opens `RequestCorrectionSheet`.

### 5.4 Floor Material Consumption (`Stock Usage`)
* `QuickUsageScreen`:
  * Searchable material dropdown showing current stock balance (`MS Plate 10mm — 650 KG Available`).
  * Quantity numeric input field with quick-add chips (`+5`, `+10`, `+25`, `+50`).
  * Work Bay selector (`Bay 1`, `Bay 2`, `Assembly Area`).
  * Big CTA: `[ RECORD CONSUMPTION ]`.

### 5.5 Mobile Personnel Directory
* `EmployeesListScreen`:
  * Searchable card roster showing employee trade, department, and assigned supervisor.
  * Quick call button to initiate phone dialer for absent workers.

### 5.6 Profile & Settings
* `ProfileScreen`: Displays user photo/initials, registered phone, company name, active role, permissions checklist, and logout button.

---

## 6. Navigation

Standard mobile bottom navigation bar:

```text
┌────────────────────────────────────────────────────────┐
│                      SCREEN VIEW                       │
│                                                        │
├───────────┬──────────────┬───────────┬───────────┬─────┤
│    ⌂      │      ✓       │    📦     │    👥     │  ⋯  │
│   Home    │  Attendance  │   Stock   │  Workers  │ More│
└───────────┴──────────────┴───────────┴───────────┴─────┘
```

---

## 7. Components

Reusable Flutter widgets residing in `lib/widgets/common/`:
1. `KfabButton`: Full-width or compact button supporting loading state, icon, and haptic feedback.
2. `AttendanceCard`: High-speed attendance marking row with dual state toggle buttons.
3. `StatSummaryCard`: Mobile summary card showing numerical metrics and status badge.
4. `StatusChip`: Semantic status indicator badge (`Present`, `Absent`, `Low Stock`, `Locked`).
5. `SearchBarField`: Clean input with clear button and debounced query callback.
6. `ConfirmationBottomSheet`: Bottom sheet asking for confirmation before sensitive actions.
7. `ShimmerLoadingList`: Shimmering placeholder cards during network fetches.

---

## 8. User Roles & Mobile Experience

* **Supervisor**: Mobile experience focuses strictly on Attendance Muster and Floor Stock Usage.
* **Storekeeper**: Mobile experience focuses on Stock Inward inspection and Usage logging.
* **Admin**: Complete access across attendance, stock alerts, worker directory, and approvals.
* **Accounts**: Read-only mobile stock review and turnout verification.

---

## 9. Data Integration & Offline Preparation

* Architecture follows the Repository Pattern:
  ```text
  UI Widget  ──>  State Provider  ──>  Repository  ──>  Supabase Flutter Client
  ```
* Offline Data Structure (`OfflineQueueItem`):
  * Unique client UUID, action type (`MARK_ATTENDANCE`, `LOG_USAGE`), payload JSON, local timestamp.
  * Stored in encrypted local storage (`flutter_secure_storage` or `hive`).
  * Prepared for sequential server replay in Phase 4.

---

## 10. Loading States

* Full-screen operations: Modal spinner with semi-transparent overlay.
* List screens: Shimmer effect placeholders matching card dimensions.
* Toggle button actions: Instant optimistic UI change with subtle indicator.

---

## 11. Empty States

* Unmarked muster: "No attendance has been submitted today. Tap [Mark All Present] or toggle individuals."
* Stock search with no results: "No materials match '[query]'. Check spelling or category."
* No supervisor assignments: "You currently have no workers assigned to your bay."

---

## 12. Error States

* Server Date-Lock Error: "Attendance date lock enforced. Cannot modify historical records directly. Submit a correction request."
* Stock Overdraft: "Cannot consume 100 KG: Only 45 KG available in current inventory."
* Network Failure: "Network unavailable. Action saved to local device queue."

---

## 13. Permission Handling

* Navigation items dynamically adjust based on user's active role.
* Non-supervisors attempting to mark attendance receive an in-app banner explaining role requirements.

---

## 14. Device & Screen Requirements

* Target platforms: Android (SDK 24+) and iOS (iOS 14+).
* Screen sizes: Optimized for common phone widths (`360dp` to `430dp`).
* Safe area compliance: Respect top status bar notches and bottom navigation gestures.

---

## 15. Security Requirements

* Encrypted token storage: Store Supabase JWT and refresh tokens using secure hardware keystore.
* Never store plain-text passwords on mobile storage.
* Absolute enforcement of PostgreSQL RLS policies across all mobile queries.

---

## 16. Performance Requirements

* Cold startup to dashboard in under 2.0 seconds on mid-range Android devices.
* Smooth 60 FPS list scrolling through 200 worker cards without frame drops.
* No source file in `kfab-mobile` may exceed **700 lines**.

---

## 17. Testing Requirements

* Run `flutter test` to verify unit and widget tests pass.
* Run `flutter analyze` to ensure **0 errors and 0 warnings**.
* Validate touch target sizes on small screen emulators (`360x640 dp`).

---

## 18. Documentation Requirements

* Document all custom widgets in `lib/widgets/README.md`.
* Maintain honest implementation status in `docs/ui-development/PHASE_3_BASIC_MOBILE_APP.md`.

---

## 19. Exit Criteria

```text
[ ] Clean mobile application shell with bottom navigation implemented
[ ] Mobile authentication flows (Login, Token Persistence, Logout) operational
[ ] Role-aware mobile dashboards built for Supervisor, Admin, and Accounts
[ ] Fast touch-first attendance muster screen with 1-tap toggles functioning
[ ] Attendance states (PRESENT, ABSENT, LOCKED) visibly distinct
[ ] Historical date-lock respected with correction request bottom sheet
[ ] Floor stock usage logging screen operational with available balance checks
[ ] Mobile employee directory cards with search functioning
[ ] User profile screen with active role and permissions summary operational
[ ] Offline queue data models and local storage initialized
[ ] Shimmer loading states, empty states, and human-readable errors verified
[ ] `flutter analyze` passes with zero issues
[ ] `flutter test` executes with zero failures
[ ] All source files remain strictly below 700 lines
```

---

## 20. Do Not Do

* **DO NOT** create a desktop table replica on mobile screens.
* **DO NOT** bypass database date-lock or inventory triggers.
* **DO NOT** attempt remote Supabase deployments or migrations.
* **DO NOT** add heavy camera/barcode plugins during Phase 3.
