# KFAB BASIC — ARCHITECTURE, SECURITY & WORKFLOW RULES

# 1. WEB VS MOBILE RESPONSIBILITIES

## Web is best for:
- Large tables
- Excel
- Reports
- Administration
- Bulk operations
- Advanced filtering
- Analytics

## Mobile is best for:
- Attendance
- Quick stock usage
- Quick stock operations
- Employee lookup
- Factory-floor workflows
- Notifications
- Quick approvals where permitted

Same business terminology must be used across both platforms.
Same design language, but not identical layouts.

---

# 2. SECURITY RULES

Never:
- Trust frontend permissions
- Trust frontend company IDs
- Trust frontend timestamps
- Expose service-role keys
- Bypass RLS
- Store passwords manually
- Implement authorization only in UI
- Hardcode production company/user IDs
- Fake stock balances
- Fake successful operations

Hiding a button is UX, not security.

The actual security boundary remains:

```text
Supabase
 ↓
RLS
 ↓
Database Functions
 ↓
Triggers
```

---

# 3. GLOBAL UI QUALITY RULES

Every screen must have:
- Loading state
- Empty state
- Error state
- Success feedback
- Permission handling
- Responsive behavior

Important destructive actions require confirmation.
Database errors should be translated into understandable messages.

Example:
- Bad: `23505 duplicate key violates...`
- Good: `This employee already has attendance marked for today.`

---

# 4. DEVELOPMENT WORKFLOW

For every phase:

```text
1. Read specifications
2. Inspect existing implementation
3. Inspect Kfab360 locally where relevant
4. Design screen
5. Build reusable components
6. Connect actual data where applicable
7. Add loading/error/empty states
8. Check permissions
9. Check responsive behavior
10. Test
11. Review UI
12. Document important decisions
```

Do not create a beautiful fake UI and postpone all real integration indefinitely.

For each completed module:

```text
UI
 ↓
Repository / service
 ↓
Supabase
 ↓
PostgreSQL / RLS
```

---

# 5. PHASE DEPENDENCY

Develop in this order:

```text
PHASE 1
Basic Web
    ↓
PHASE 2
Advanced Web
    ↓
PHASE 3
Basic Mobile
    ↓
PHASE 4
Advanced Mobile
```

Complete and review each phase before beginning the next.

---

# 6. PHASE REPORTING

At the end of every phase provide:

```text
PHASE STATUS

Completed:
- ...

Not Completed:
- ...

Known Issues:
- ...

Files Changed:
- ...

UI Screens Created:
- ...

Database/API Integration:
- ...

Next Phase:
- ...
```

Do not silently mark incomplete features as complete.

---

# 7. FINAL TARGET

At the end of Phase 4:

```text
                    KFAB BASIC
                         │
             ┌───────────┴───────────┐
             │                       │
            WEB                    MOBILE
             │                       │
       Admin / Accounts       Admin / Supervisor
                                  / Accounts
             │                       │
             └───────────┬───────────┘
                         │
                      SUPABASE
                         │
                    POSTGRESQL
                         │
             ┌───────────┼───────────┐
             │           │           │
         Attendance     Stock     Employees
             │           │           │
             └───────────┼───────────┘
                         │
                   Audit / Security
```

The final product should feel like a serious production-ready factory management application.

---

# 8. MASTER UI PRINCIPLE

Always ask:
> Can a KFAB employee complete this task faster and with less typing?

Prefer automation wherever safely possible.

Examples:
- Instead of typing employee, status, time, date:
  `Employee → [ PRESENT ] [ ABSENT ]`
- Instead of typing unit:
  `Material → automatically show unit`
- Instead of manually calculating stock:
  `Database → Current Stock`

The system should automate repetitive work while keeping the database as the source of truth.

---

# 9. FINAL RESTRICTION

The user handles:
- Supabase.com
- Remote database deployment
- Remote authentication configuration
- Production environment variables
- Production deployment

The AI coding agent handles:
- Flutter coding
- Next.js coding
- Local integration
- UI/UX
- Application logic
- Tests
- Documentation
- Local validation

Never access Supabase.com unless the user explicitly changes this instruction.
