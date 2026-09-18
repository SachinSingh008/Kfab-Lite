# PHASE 4 — ADVANCED MOBILE APP UI

## Goal

Make mobile a highly efficient factory operations tool.

Focus on:
- Speed
- Offline support
- Realtime
- Notifications
- Camera/files
- Advanced attendance
- Advanced stock
- Better search
- Better workflows

## 1. Advanced Attendance

Add:
- Fast bulk marking
- Search
- Filters
- Supervisor grouping
- Attendance summaries
- Recent actions
- Correction requests
- Realtime updates

Optimize:

```text
Open Attendance
 ↓
See workers
 ↓
Tap status
 ↓
Done
```

## 2. Advanced Stock

Add where useful:
- Barcode/QR support
- Material photos
- Attachments
- Quick usage
- Quick outward
- Stock alerts
- Transaction history
- Realtime stock updates

Do not add hardware-dependent features unless genuinely useful.

## 3. Camera / Attachments

Where supported:

```text
Take Photo
 ↓
Attach to transaction
 ↓
Upload securely
```

Potential uses:
- Material received photo
- Invoice
- Challan
- Damaged material
- Dispatch proof

Use secure storage policies.

## 4. Notifications

Prepare or implement:
- Low stock
- Correction request
- Correction approved
- Correction rejected
- Attendance reminder
- Administrative notification

Keep notifications relevant.

## 5. Realtime

Where useful:
- Attendance
- Stock
- Correction requests
- Notifications

Do not use realtime unnecessarily.

## 6. Advanced Offline

Implement robust offline behavior where practical:
- Local pending actions
- Sync queue
- Retry
- Conflict handling
- Connection status
- Sync status
- Server confirmation

Example:

```text
Saved locally
Waiting for connection...
        ↓
Syncing...
        ↓
Synced ✓
```

Never bypass:
- RLS
- Attendance date lock
- Stock validation
- Permissions
- Company isolation

## 7. Mobile Performance

Optimize:
- Fast startup
- Small payloads
- Pagination
- Lazy loading
- Efficient lists
- Cached reference data
- Debounced search

Do not load huge datasets into memory.

## Phase 4 Exit Criteria

Phase 4 is complete when the mobile app is a polished, reliable factory-floor operations tool with advanced attendance, stock, notifications, realtime features, secure attachments, and robust offline/sync behavior where implemented.
