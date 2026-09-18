# PHASE 3 — BASIC MOBILE APP UI

## Goal

Build the Flutter mobile application for daily factory operations.

Mobile is NOT a miniature desktop web application.
It must be redesigned around touch and speed.

Primary users:
- Admin
- Supervisor
- Accounts

## 1. Mobile Navigation

Suggested:

```text
Home | Attendance | Stock | Employees | More
```

Choose the cleanest navigation after reviewing the actual screens.

## 2. Mobile Login

Create:
- KFAB branding
- Email
- Password
- Login
- Loading
- Error
- Session restoration
- Logout

Keep it simple.

## 3. Mobile Dashboard

### Supervisor

```text
Good Morning

Today's Attendance

32 Present
4 Absent
3 Not Marked

[Mark Attendance]
```

### Admin
Show:
- Today's overview
- Attendance
- Stock alerts
- Recent inward
- Recent outward
- Pending corrections

### Accounts
Show:
- Stock
- Inward
- Outward
- Usage
- Suppliers

## 4. Mobile Attendance

Highest-priority mobile workflow.

```text
TODAY

Search Worker

Ramesh
[ ✓ ] [ ✕ ]

Suresh
[ ✓ ] [ ✕ ]

Mahesh
[ ✓ ] [ ✕ ]

Ganesh
[ ✓ ] [ ✕ ]
```

Make controls large.
Minimize scrolling.
Give immediate feedback.

## 5. Attendance States

Clearly display:
- PRESENT
- ABSENT
- NOT MARKED
- LOCKED

Historical attendance:

```text
🔒 Locked
```

Provide:

```text
Request Correction
```

where permitted.

## 6. Mobile Stock

Create simple workflows:

```text
Stock
 ↓
Search Material
 ↓
Material
 ↓
Current Stock
 ↓
Usage / Outward
```

Show available stock prominently.

## 7. Mobile Stock Usage

Optimize for factory-floor entry:

```text
Material
[ MS Plate 10mm ]

Available
650 KG

Used
[ 25 KG ]

Work Bay
[ Bay 2 ]

[ SAVE USAGE ]
```

Keep optional fields secondary.

## 8. Mobile Employees

Provide:
- Search
- Employee list
- Employee details
- Attendance summary

Avoid dense tables.

## 9. Mobile Profile

Create:

```text
Profile
Name
Phone
Company
Role
Permissions summary
Logout
```

## 10. Offline Preparation

Prepare architecture for offline operation.

If implemented:

```text
User Action
 ↓
Local Queue
 ↓
Connection Available
 ↓
Server Validation
 ↓
Sync
```

Never bypass server security.
If full offline support would destabilize V1, prepare the architecture and document what remains for Phase 4.

## Phase 3 Exit Criteria

Phase 3 is complete when:
- Mobile login works
- Dashboard works
- Company switching works where required
- Role-aware navigation works
- Attendance works
- Employee browsing works
- Stock viewing works
- Usage entry works
- Basic inward/outward workflows work where appropriate
- Loading/error/empty states work
- UI is touch-friendly
- Common phone sizes are supported
