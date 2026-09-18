# PHASE 4 — ADVANCED MOBILE APP SPECIFICATION

```text
Status: COMPLETED
Platform: Flutter (Dart, Background Sync, Camera Plugins, Supabase Storage & Realtime)
Target Environment: Android & iOS Mobile Handsets
Visual Reference: C:\Users\rites\Desktop\library\Kfab360 (Visual inspection only; no code merging)
```

---

## 1. Objective

Elevate the Flutter mobile application into an advanced, battle-tested factory operations power tool. Phase 4 equips shop-floor personnel with resilient offline synchronization capabilities, instant delivery challan camera captures with secure cloud attachment uploads, barcode/QR material verification, push notification alerts for critical low stock and correction requests, real-time muster updates, and performance tuning for harsh factory connectivity environments.

---

## 2. Scope

### In-Scope (Phase 4)
* End-to-end offline sync queue engine with automatic background re-try, connectivity status listeners, and server confirmation.
* Camera integration for photo proof: material inward delivery challans, truck license plates, and damaged goods documentation.
* Secure image compression and upload pipeline to Supabase Storage with bucket-level RLS policies.
* Push notification service (FCM / APNs) and in-app notification center for low-stock warnings and correction approvals.
* Real-time subscription feeds (Supabase Realtime WebSockets) for live muster changes and stock ledger updates.
* Advanced barcode/QR scanner integration for rapid material identification and bay inventory audits.
* Bulk attendance actions (e.g., "Mark All Assigned Present", supervisor grouping, and instant shift filters).
* Comprehensive device telemetry, memory optimization, and cached local catalogs.

### Out-of-Scope
* Desktop-style heavy Excel grid manipulation or financial ledger editing (strictly handled in Web Phase 2).
* Hardware-dependent RFID reader integrations unless explicitly requested in a future hardware spec.

---

## 3. Prerequisites

1. Phase 3 basic mobile application completed, tested, and fully approved by user.
2. `flutter analyze` and `flutter test` passing with zero warnings.
3. Native camera and image picker plugins integrated (`camera`, `image_picker`, `image_cropper`).
4. Local offline storage database initialized (`hive` or `sqlite`).

---

## 4. UI/UX Principles

* **Unbreakable Connectivity Resiliency**: The user should never be blocked by spotty factory Wi-Fi or steel-bay cellular dead zones. Actions commit instantly locally.
* **Frictionless Capture**: Camera viewfinder should open instantly; shutter button auto-compresses image to < 300KB before queuing.
* **Explicit Sync Transparency**: A clean status pill shows sync state: `● Synced`, `↻ Syncing (3 items)`, or `⚠ Offline (Saved locally)`.
* **Zero Accidental Overwrites**: Conflicts between local offline actions and server timestamps are resolved deterministically without silent data loss.

---

## 5. Screens

### 5.1 Advanced Attendance Hub
* `AdvancedMusterScreen`:
  * Supervisor bay selector dropdown.
  * Bulk action toolbar: `[ Mark All Remaining Present ]` with 1-tap confirmation.
  * Live status indicator showing real-time check-ins from other supervisors.
  * In-line correction request status badge (`Pending Approval`, `Approved`, `Rejected`).

### 5.2 Camera & Challan Capture Workflow
* `ChallanCaptureScreen`:
  * Full-screen camera viewfinder with document framing guidelines.
  * Instant photo preview modal: Crop, Rotate, Retake, Confirm.
  * Metadata form: Vendor name, Challan Number, Net Weight, Remarks.
  * Upload queue status bar.

### 5.3 QR / Barcode Material Scanner
* `BarcodeScannerScreen`:
  * Rapid camera scanner targeting material QR labels or rack barcodes.
  * Instant popup card displaying: Material Specification, Current Stock Balance, and quick action buttons (`[ Log Usage ]`, `[ View Inward History ]`).

### 5.4 Notification & Alerts Center
* `NotificationCenterScreen`:
  * Segmented inbox: `All`, `Stock Alerts`, `Approvals`, `System`.
  * Tap notification to deep-link directly to the affected record (e.g., jump to low-stock item or correction request).

### 5.5 Offline Sync Manager
* `SyncQueueScreen`:
  * Detailed diagnostic list of locally queued actions awaiting connection.
  * Manual `[ Sync Now ]` trigger and error retry buttons.

---

## 6. Navigation

Extended bottom navigation with badges:

```text
┌────────────────────────────────────────────────────────┐
│                      SCREEN VIEW                       │
│                                                        │
├───────────┬──────────────┬───────────┬───────────┬─────┤
│    ⌂      │      ✓       │    📦     │    🔔     │  ⚙  │
│   Home    │  Attendance  │   Stock   │   Alerts  │ More│
│           │              │  [QR Scan]│   (2 unread)    │
└───────────┴──────────────┴───────────┴───────────┴─────┘
```

---

## 7. Components

Advanced widgets residing in `lib/widgets/advanced/`:
1. `SyncStatusBanner`: Floating pill indicating offline mode or background synchronization progress.
2. `CameraCaptureWidget`: Native viewfinder wrapper with camera switch and flash toggle.
3. `ChallanImageThumbnail`: Cached thumbnail with tap-to-expand full-screen lightbox.
4. `QrScannerOverlay`: Animated laser scanner overlay for barcode detection.
5. `RealtimeBadge`: Pulsing green indicator signifying active WebSocket data connection.
6. `BulkActionBar`: Bottom sliding bar providing batch operations for worker selections.

---

## 8. User Roles & Advanced Mobile Features

* **Supervisor**: Uses bulk attendance marking, bay QR scanning, and receives correction status notifications.
* **Storekeeper**: Primary user of the camera challan capture tool, rack barcode audit scanner, and low-stock warning alerts.
* **Admin**: Receives instant push notifications for pending attendance correction requests and approves them with 1-tap.
* **Accounts**: Receives notification summaries when high-value material inward deliveries are logged.

---

## 9. Data Integration & Offline Engine

Offline sync architecture:

```text
User Action (Tap [Save Usage])
          ↓
Local SQLite / Hive Queue (Action encrypted & marked PENDING)
          ↓
Optimistic UI Update (Screen updates immediately)
          ↓
Connectivity Listener Detects Internet (Wi-Fi / 4G)
          ↓
Sequential Queue Dispatcher (Replays RPCs with original client UUIDs)
          ↓
Server Validates RLS & Business Rules (Asia/Kolkata date-lock & stock checks)
          ↓
Server Returns Success ──> Queue Item Marked SYNCED & Removed
```

* Strict Rule: The offline queue CANNOT bypass PostgreSQL server triggers. If an offline action violates a date-lock upon reconnect, the user is notified with an actionable resolution prompt.

---

## 10. Loading States

* Camera shutter: Brief haptic click with immediate thumbnail generation.
* Background sync: Non-blocking subtle spinning indicator in top app bar.
* Storage upload: Pie progress indicator over thumbnail (`45%... 80%... Complete`).

---

## 11. Empty States

* Notification inbox: "You're all caught up! No active stock alerts or pending approvals."
* Offline queue: "Queue is empty. All local actions are synced with the server."
* Challan attachments: "No photos attached to this transaction. Tap [Take Photo] to document challan."

---

## 12. Error States

* Camera permission denied: "Camera access required to capture delivery challans. Tap [Open Settings] to grant permission."
* Offline sync rejection: "Action rejected by server: Material stock balance insufficient at time of sync. Action quarantined for review."
* Storage upload failure: "Photo upload timed out. Stored locally; will retry automatically on connection."

---

## 13. Permission Handling

* Device permissions: Gracefully request Camera and Storage access with explanatory dialogs.
* Cloud permissions: Attachments are uploaded to Supabase Storage using tenant-isolated bucket policies (`company_id/transactions/filename.jpg`).

---

## 14. Device & Hardware Requirements

* Support camera auto-focus, LED flashlight toggle for dimly lit fabrication bays.
* Efficient battery usage: Disable camera sensor and location hooks immediately upon exiting scanner screens.

---

## 15. Security Requirements

* Encrypt offline queue records stored on device flash memory using AES-256.
* Clean image metadata (strip EXIF GPS coordinates) before uploading to protect factory operational privacy.
* Enforce strict file extension (`.jpg`, `.png`, `.pdf`) and 5MB size limits on all photo uploads.

---

## 16. Performance Requirements

* Viewfinder frame rate: Stable 30+ FPS during QR code scanning.
* Queue sync must execute on a background Dart isolate to avoid UI jank.
* No source file in `kfab-mobile` may exceed **700 lines**.

---

## 17. Testing Requirements

* Test offline flight mode: Perform 10 attendance marks offline, toggle Wi-Fi on, and verify all 10 records sync cleanly.
* Test camera capture and local thumbnail caching on actual Android/iOS hardware.
* `flutter analyze` and `flutter test` must pass with zero issues.

---

## 18. Documentation Requirements

* Document camera storage policies in `docs/SECURITY_SPEC.md`.
* Document offline conflict resolution rules in `docs/AUTOMATION_SPEC.md`.

---

## 19. Exit Criteria

```text
[ ] Robust offline action queue operational with SQLite/Hive persistence
[ ] Background sync engine syncing local queue upon connection recovery
[ ] Native camera viewfinder functional for delivery challan documentation
[ ] Secure image compression and upload pipeline connected to Supabase Storage
[ ] Barcode / QR scanner module operational for rapid material lookup
[ ] Realtime WebSocket subscriptions active for live muster and stock updates
[ ] In-app notification center receiving stock alerts and approval notices
[ ] Bulk attendance actions functioning for assigned supervisor teams
[ ] Network status pill accurately reporting connection and sync status
[ ] Device memory and battery profiles verified
[ ] Zero regressions in Phase 3 basic mobile features
[ ] `flutter analyze` passes with zero warnings
[ ] All source files remain strictly below 700 lines
```

---

## 20. Do Not Do

* **DO NOT** attempt remote Supabase administrative actions.
* **DO NOT** upload multi-megabyte uncompressed RAW images.
* **DO NOT** allow offline queue to silently discard errors or override database date-locks.
* **DO NOT** create complex desktop tables on mobile screens.
