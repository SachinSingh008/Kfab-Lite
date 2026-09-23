# KFAB BASIC — Data Access Model & Synchronization

## 1. Single Source of Truth

KFAB BASIC maintains **PostgreSQL (Supabase)** as the primary source of truth, backed by **Row-Level Security (RLS)**, database triggers, and synchronized client layers across web and mobile:

```text
               +----------------------------------+
               |      Supabase PostgreSQL        |
               | (15 Tables, RLS, Concurrency Trg)|
               +-----------------+----------------+
                                 |
         +-----------------------+-----------------------+
         |                                               |
+--------v---------+                           +---------v--------+
|  Next.js Portal  |                           |  Flutter Mobile  |
|  (DataService)   |                           |  (State Provider)|
|  * Running Ledger|                           |  * Offline Cache |
|  * Excel Engine  |                           |  * Local SQLite  |
|  * Accounts Hub  |                           |  * Fast Punch-in |
+------------------+                           +------------------+
```

---

## 2. Synchronization Mechanisms

### A. Real-Time In-Memory & Database Bridge
* When online, transactions are saved directly to `stock_inward`, `stock_outward`, or `stock_usage`.
* In-memory cache ensures that network interruptions do not block shop-floor storekeepers from issuing goods or supervisors from marking attendance.
* The application maintains deterministic state between UI components, recomputing ledger balances as soon as any transaction is added or voided.

### B. Excel Two-Way Sync Pipeline
* **Export**: Direct serialization of live database records into authentic binary `.xlsx` workbooks.
* **Import**: Strict validation pipeline with status codes (`NEW`, `UPDATED`, `UNCHANGED`, `ERROR`, `CONFLICT`), preventing partial or corrupted imports.
* **Recalculation**: Once committed, imported materials or inward receipts immediately flow into `v_material_stock` and the live running ledger.

---

## 3. Row-Level Security (RLS) & Multi-Tenancy

Every operational record is partitioned by `company_id`.
* Tenant isolation is enforced via database policies (`p_tenant_isolation`).
* Super Admin bypasses company filtering for system-wide auditing and user maintenance.
* Company Admins and Supervisors are strictly constrained to their designated company tenant.
