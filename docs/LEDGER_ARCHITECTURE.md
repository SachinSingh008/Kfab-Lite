# KFAB BASIC — Stock Ledger & Immutability Architecture

## 1. Mathematical Balance Integrity

In KFAB BASIC, **current stock is never an independently editable number**.
Stock is computed strictly and mathematically from chronological transaction history:

$$\text{Current Balance} = \text{Opening Balance} + \sum \text{Active Inward} - \sum \text{Active Outward} - \sum \text{Active Usage}$$

Any change to a transaction (e.g. logging a new receipt or voiding an erroneous challan) instantly recalculates the running balance across all subsequent entries in the ledger.

---

## 2. Ledger Transaction Schema

Every ledger movement records:
* `id`: Unique movement identifier
* `date` & `timestamp`: Strict chronological ordering keys
* `material_code` & `material_name`: The steel plate, beam, or consumable
* `type`:
  - `INWARD` (+): Supplier receipt via delivery challan / tax invoice
  - `OUTWARD` (-): Dispatch to project site or subcontractor
  - `USAGE` (-): Shop floor consumption in a fabrication bay
* `ref`: Challan number, gate pass, or bay work order number
* `entity`: Supplier company, delivery site, or fabrication bay
* `running_balance`: Cumulative stock at the moment after this transaction
* `status`: `ACTIVE` or `VOIDED`
* `void_reason`: Mandatory audit note explaining the reversal

---

## 3. Immutability & Audit Void Procedure

In manufacturing, hard deleting stock transactions destroys audit trails and causes mysterious discrepancies during plant inventory checks.

KFAB BASIC enforces an **Audit Void Policy**:
1. **No Hard Deletes**: Hard deletion of stock records is blocked at both database trigger level (`enforce_stock_void_lifecycle()`) and application level.
2. **Mandatory Audit Reason**: Voiding a transaction requires an authorized administrator (`ADMIN` or `SUPER_ADMIN`) to provide a mandatory explanation (minimum 5 characters).
3. **Audit Stamp**: The system records `voided_at` timestamp and `voided_by` user.
4. **Automatic Recalculation**: Once voided, the quantity is excluded from subsequent running balance computations, and the entry is struck through with an explicit `VOIDED` audit badge.

---

## 4. Concurrency-Safe Stock Validation

Database trigger `validate_stock_availability_trigger()` employs PostgreSQL **row-level locking** (`FOR UPDATE`) on the target material:
* Ensures two simultaneous dispatches cannot overdraft available stock into negative balance.
* Guarantees ACID serialization of concurrent consumption entries across multiple mobile terminals or web clients.
