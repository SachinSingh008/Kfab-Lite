# KFab360 — Sample Demo Data Registry & Removal Guide

This document maintains an exact registry of all sample and demo datasets injected into **KFab360 Web (`kfab-web`)** and **KFab360 Mobile (`kfab-mobile`)**.

All sample data has been structured so that it can be **toggled off or wiped completely in 1-click** from the UI, or **purged at once from the codebase** without breaking any production interfaces or APIs.

---

## 1. Web Application (`kfab-web`)

### A. Dedicated Sample Data Files
| File Path | Description & Exported Constants | Lines |
|---|---|---|
| [`kfab-web/src/lib/sample-data.ts`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-web/src/lib/sample-data.ts) | Master plant demo data: `SAMPLE_EMPLOYEES`, `SAMPLE_STOCK_ITEMS`, `SAMPLE_TRANSACTIONS`, `SAMPLE_LEDGER_ENTRIES`, `SAMPLE_DPR_REPORTS`, `SAMPLE_BAY_LOGS`, `SAMPLE_MACHINES`, `SAMPLE_QAQC_TESTS`, `SAMPLE_ISSUES`, `SAMPLE_REQUIREMENTS`, `SAMPLE_COMMERCIAL_MATCHES` | L1–550 |
| [`kfab-web/src/lib/inventory-sample-data.ts`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-web/src/lib/inventory-sample-data.ts) | Inventory module realistic datasets: `SAMPLE_RAW_MATERIALS`, `SAMPLE_CONSUMABLES`, `SAMPLE_MACHINERY_ASSETS`, `SAMPLE_SAFETY_GEAR`, `SAMPLE_TELEMETRY` | L1–330 |

### B. Control Logic & 1-Click UI Switch
| File Path | Component / Hook | Functionality |
|---|---|---|
| [`kfab-web/src/lib/data-service.ts`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-web/src/lib/data-service.ts) | `loadSampleData()`, `clearSampleData()`, `isSampleDataLoaded()` | Syncs with `localStorage` (`kfab_sample_data_active`). When cleared, returns empty lists (`[]`). |
| [`kfab-web/src/app/page.tsx`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-web/src/app/page.tsx) | Top Navigation Header Bar | Houses the 1-Click **"⚡ Demo Data: Active [Remove]"** / **"✨ Clean Slate: Empty [Load]"** button. Persists state instantly across all modules. |
| [`kfab-web/src/components/views/inventory-view.tsx`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-web/src/components/views/inventory-view.tsx) | `InventoryView` | Accepts `sampleDataActive` and `records` props to switch between live production state and demo state. |
| [`kfab-web/src/components/views/accounts-view.tsx`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-web/src/components/views/accounts-view.tsx) | `AccountsView` | Dynamically filters `SAMPLE_COMMERCIAL_MATCHES` when demo mode is active; clears to empty when clean slate is active. |

---

## 2. Mobile Application (`kfab-mobile`)

### A. Central Store State
| File Path | Variables & Methods | Lines |
|---|---|---|
| [`kfab-mobile/lib/core/state/mobile_store.dart`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-mobile/lib/core/state/mobile_store.dart) | `authoritativeEmployees` (List of 12 employees) | L15–28 |
| [`kfab-mobile/lib/core/state/mobile_store.dart`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-mobile/lib/core/state/mobile_store.dart) | `sampleStockItems` (6 structural steel & consumable stock items) | L30–112 |
| [`kfab-mobile/lib/core/state/mobile_store.dart`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-mobile/lib/core/state/mobile_store.dart) | `_isSampleDataActive`, `loadSampleData()`, `removeSampleData()`, `toggleSampleData(bool)` | L117–174 |

### B. Mobile UI Controls
| File Path | Widget | Functionality |
|---|---|---|
| [`kfab-mobile/lib/widgets/common/kfab_navigation_drawer.dart`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-mobile/lib/widgets/common/kfab_navigation_drawer.dart) | `KfabNavigationDrawer` | Houses the **"DEMO SAMPLE DATA"** card and toggle switch with instant `ScaffoldMessenger` confirmation and state update. |
| [`kfab-mobile/lib/screens/stock/inventory_screen.dart`](file:///c:/Users/rites/Desktop/Sachin/Kfab%20Bsics/kfab-mobile/lib/screens/stock/inventory_screen.dart) | `InventoryScreen` | Displays **"Demo Sample Stock Active"** banner with a **"Wipe Data"** button, and an empty state banner with **"Reload Demo Data"** button. |

---

## 3. How to Remove All Sample Data at Once

### Method A: UI Clean-Slate (Zero Code Changes)
1. **On Web**: In the top navigation bar, click `⚡ Demo Data: Active [Remove]`.
   - All modules (Inventory, Attendance, DPR Reports, Accounts, Commercial Matches) instantly clear to a 100% clean production slate.
2. **On Mobile**: Open the hamburger navigation drawer and toggle off `DEMO SAMPLE DATA` (or tap `Wipe Data` in the Inventory screen).
   - All stock items, employee muster rows, and usage records clear to clean slate.

### Method B: Complete Codebase Purge (Production Hardening)
When you are ready to permanently delete all sample data mock files:
1. Delete `kfab-web/src/lib/sample-data.ts`.
2. Delete `kfab-web/src/lib/inventory-sample-data.ts`.
3. In `kfab-web/src/lib/data-service.ts`, set default initial state to `false` and empty arrays `[]`.
4. In `kfab-mobile/lib/core/state/mobile_store.dart`, empty `sampleStockItems = []` and default `_isSampleDataActive = false`.
