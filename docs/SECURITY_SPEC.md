# KFAB BASIC — Security Architecture & Database Hardening Specification

This document details the security controls, privilege escalation safeguards, date-lock mechanisms, and concurrency protections implemented in **KFAB BASIC**.

---

## 1. Multi-Tenant Isolation via Row Level Security (RLS)

1. **Mandatory Tenant Key**:
   Every business entity table contains `company_id uuid NOT NULL REFERENCES companies(id)`.
2. **PostgreSQL RLS Enforcement**:
   * RLS is enabled across **all tables**.
   * Multi-tenancy is verified via `company_id IN (SELECT public.get_user_company_ids())`.
   * Security Definer helper functions (`get_user_company_ids()`, `has_company_role()`, `has_company_permission()`, `is_super_admin()`) avoid recursive RLS loops.
3. **No Client-Side Filtering Reliance**:
   Client queries that pass arbitrary `company_id` filters are strictly evaluated against the user's verified memberships in `company_members`.

---

## 2. Anti-Privilege Escalation Controls

### A. Super Admin Protection
* `profiles.is_super_admin` controls system-wide super admin authority.
* **Database Trigger**: `trg_prevent_super_admin_escalation` runs `BEFORE UPDATE ON profiles`. If `NEW.is_super_admin` differs from `OLD.is_super_admin`, it enforces:
  ```sql
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Privilege escalation rejected: Only an existing Super Admin can alter system administrator privileges.';
  END IF;
  ```
* Standard API calls and web/mobile clients cannot modify `is_super_admin`.

### B. Company Member Role Protection
* In `company_members`, only a Super Admin or an active Company Admin of that `company_id` can insert or update rows.
* RLS policy explicitly forbids an Admin from editing their own role: `(has_company_role(company_id, 'ADMIN') AND user_id != auth.uid())`.
* A Company Admin cannot grant Super Admin status or assign roles in companies where they do not hold Admin status.

### C. Function Hardening (`search_path`)
* Every `SECURITY DEFINER` function explicitly specifies:
  ```sql
  SET search_path = public, auth, pg_temp;
  ```
  This defends against malicious search_path manipulation and schema injection.

---

## 3. Server-Side Date Lock Architecture

* **Timezone**: Indian Standard Time (`Asia/Kolkata`).
* **Server Time Determination**:
  ```sql
  CREATE OR REPLACE FUNCTION get_business_date()
  RETURNS date AS $$
    SELECT (timezone('Asia/Kolkata', now()))::date;
  $$ LANGUAGE sql STABLE;
  ```
* **Enforcement Trigger (`enforce_attendance_date_lock`)**:
  * Blocks any `INSERT`, `UPDATE`, or `DELETE` where the record date does not match `get_business_date()`.
  * Forbids altering the `date` column on existing records.
  * Completely immune to client clock modifications on mobile devices or browsers.
* **Controlled Correction Override**:
  * Historical records can only be adjusted via the stored procedure `apply_approved_correction(request_id)`.
  * The procedure checks that the caller is Super Admin or Company Admin, temporarily applies the transaction under a private session flag (`kfab.controlled_correction_in_progress`), writes an audit log, and clears the flag.

---

## 4. Stock Concurrency & Void Lifecycle

### A. Concurrency-Safe Deduction (Row-Level Locking)
To prevent race conditions where two simultaneous transactions cause stock to fall below zero:
```sql
-- Acquire row lock on material row in a single transaction:
PERFORM id FROM public.materials WHERE id = NEW.material_id FOR UPDATE;

-- Under row lock, verify that available stock >= requested deduction:
IF (v_current_stock - NEW.quantity) < 0 THEN
  RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, NEW.quantity;
END IF;
```
Transactions targeting the same material are serialized, guaranteeing zero negative stock balances.

### B. Void Lifecycle (No Hard Deletions)
* `stock_inward`, `stock_outward`, and `stock_usage` enforce:
  * Hard deletions (`DELETE`) are blocked for normal users.
  * Transactions must transition to `status = 'VOIDED'` or `'CANCELLED'`.
  * Setting status to voided mandates a non-empty `void_reason`, recording `voided_by = auth.uid()` and `voided_at = now()`.
  * Voided records cannot be reactivated.
  * The ledger view `v_material_stock` dynamically filters out non-active transactions.

---

## 5. Append-Only Audit Logging

* The `audit_logs` table has **no UPDATE or DELETE RLS policies**.
* Triggers automatically log insertions, updates, and deletes for all operational entities (`attendance`, `materials`, `suppliers`, `stock_inward`, `stock_outward`, `stock_usage`, `company_members`, `correction_requests`).
* Captures actor `user_id`, `company_id`, module name, action type, old JSONB state, and new JSONB state.
* Super Admin can view all audit logs; Company Admin can view only their company's audit records.
