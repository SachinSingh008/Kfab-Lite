import { createClient } from "./supabase/client";
import { INITIAL_STOCK, INITIAL_WORKERS, INITIAL_TRANSACTIONS } from "./mock-data";

/**
 * KFAB BASIC — Data & Real-Time Stock Ledger Service
 * Serves as the authoritative sync bridge between Supabase PostgreSQL,
 * the frontend UI, and authentic Excel exports/imports.
 */

export interface StockLedgerEntry {
  id: string;
  date: string;
  timestamp: number;
  material_id: string;
  material_code: string;
  material_name: string;
  type: "INWARD" | "OUTWARD" | "USAGE";
  ref: string;
  entity: string; // Supplier, Destination Site, or Fabrication Bay
  inward_qty: number;
  outward_qty: number;
  usage_qty: number;
  running_balance: number;
  unit: string;
  vehicle_number?: string;
  status: "ACTIVE" | "VOIDED" | "CANCELLED";
  void_reason?: string;
  voided_at?: string;
  voided_by?: string;
}

export interface InwardFormPayload {
  challan_number: string;
  invoice_number?: string;
  supplier_name: string;
  material_code: string;
  quantity: number;
  unit_code: string;
  vehicle_number?: string;
  remarks?: string;
}

// Clean Slate: In-memory cache initialized empty (no mock/fake data)
let cachedMaterials: any[] = [];
let cachedWorkers: any[] = [];
let cachedTransactions: any[] = [];
let inMemoryLedgerEntries: StockLedgerEntry[] = [];


/**
 * Re-calculate running balance strictly and mathematically:
 * Running Balance = Opening Balance + SUM(Active Inward) - SUM(Active Outward) - SUM(Active Usage)
 */
export function recalculateLedgerBalances(
  entries: StockLedgerEntry[],
  materialFilter?: string
): StockLedgerEntry[] {
  // Sort chronologically ascending
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  const runningByMaterial: Record<string, number> = {};

  const calculated = sorted.map((entry) => {
    const matKey = entry.material_code;
    if (runningByMaterial[matKey] === undefined) {
      runningByMaterial[matKey] = 0;
    }

    if (entry.status === "ACTIVE") {
      runningByMaterial[matKey] += entry.inward_qty - entry.outward_qty - entry.usage_qty;
    }

    return {
      ...entry,
      running_balance: parseFloat(runningByMaterial[matKey].toFixed(3)),
    };
  });

  if (materialFilter && materialFilter !== "ALL") {
    return calculated.filter((e) => e.material_code === materialFilter);
  }

  return calculated;
}

// ============================================================================
// DATA SERVICE API
// ============================================================================

export const DataService = {
  /**
   * Fetch live materials from Supabase, or use memory cache
   */
  async getMaterials() {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("materials").select("*");
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn("[DataService] Failed to load materials from DB, using fallback", err);
      }
    }
    return cachedMaterials;
  },

  /**
   * Get cached materials synchronously
   */
  getCachedMaterials() {
    return cachedMaterials;
  },

  /**
   * Fetch Stock Ledger Entries with verified mathematical running balances
   */
  async getStockLedger(materialCodeFilter?: string): Promise<StockLedgerEntry[]> {
    return recalculateLedgerBalances(inMemoryLedgerEntries, materialCodeFilter);
  },

  /**
   * Add a new Inward Stock transaction
   * Automatically updates stock ledger and in-memory materials cache
   */
  async recordInwardStock(payload: InwardFormPayload, loggedBy: string): Promise<StockLedgerEntry> {
    const matchedMaterial = cachedMaterials.find(
      (m) => m.code === payload.material_code || m.name.toLowerCase().includes(payload.material_code.toLowerCase())
    );

    const matCode = matchedMaterial ? matchedMaterial.code : payload.material_code;
    const matName = matchedMaterial ? matchedMaterial.name : payload.material_code;
    const unit = payload.unit_code || (matchedMaterial ? matchedMaterial.unit : "TON");

    const newEntry: StockLedgerEntry = {
      id: `LEG-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      timestamp: Date.now(),
      material_id: `mat-${matCode}`,
      material_code: matCode,
      material_name: matName,
      type: "INWARD",
      ref: payload.challan_number + (payload.invoice_number ? ` / ${payload.invoice_number}` : ""),
      entity: payload.supplier_name,
      inward_qty: Number(payload.quantity),
      outward_qty: 0,
      usage_qty: 0,
      running_balance: 0, // will be computed
      unit: unit,
      vehicle_number: payload.vehicle_number || "-",
      status: "ACTIVE",
    };

    inMemoryLedgerEntries.push(newEntry);

    // Also update transaction list
    cachedTransactions.unshift({
      id: `INW-${Date.now().toString().slice(-4)}`,
      type: "INWARD",
      date: newEntry.date,
      ref: newEntry.ref,
      entity: payload.supplier_name,
      material: matName,
      qty: `${payload.quantity} ${unit}`,
      vehicle: payload.vehicle_number || "-",
      status: "RECEIVED",
    });

    // Update material current stock
    if (matchedMaterial) {
      const cur = parseFloat(matchedMaterial.current || "0");
      const inw = parseFloat(matchedMaterial.inward || "0");
      matchedMaterial.current = (cur + payload.quantity).toFixed(2);
      matchedMaterial.inward = (inw + payload.quantity).toFixed(2);
      matchedMaterial.isLow = parseFloat(matchedMaterial.current) <= parseFloat(matchedMaterial.min);
    }

    // Try persisting to Supabase if configured
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from("stock_inward").insert({
          challan_number: payload.challan_number,
          invoice_number: payload.invoice_number,
          quantity: payload.quantity,
          unit_code: unit,
          vehicle_number: payload.vehicle_number,
          remarks: payload.remarks || `Logged via Web by ${loggedBy}`,
          status: "ACTIVE",
        });
      } catch (err) {
        console.warn("[DataService] Direct Supabase inward write fallback", err);
      }
    }

    return newEntry;
  },

  /**
   * Safe Void Transaction procedure
   * Preserves immutability by recording void reason, timestamp, and user
   */
  async voidLedgerTransaction(entryId: string, reason: string, voidedBy: string): Promise<boolean> {
    const entry = inMemoryLedgerEntries.find((e) => e.id === entryId);
    if (!entry) {
      throw new Error(`Ledger entry ${entryId} not found.`);
    }

    if (entry.status === "VOIDED") {
      throw new Error("This transaction has already been voided.");
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error("A comprehensive void reason (minimum 5 characters) is mandatory for audit.");
    }

    entry.status = "VOIDED";
    entry.void_reason = reason.trim();
    entry.voided_at = new Date().toISOString();
    entry.voided_by = voidedBy;

    // Recalculate material stock
    const targetMat = cachedMaterials.find((m) => m.code === entry.material_code);
    if (targetMat) {
      if (entry.type === "INWARD") {
        const cur = parseFloat(targetMat.current);
        targetMat.current = Math.max(0, cur - entry.inward_qty).toFixed(2);
        targetMat.isLow = parseFloat(targetMat.current) <= parseFloat(targetMat.min);
      }
    }

    return true;
  },

  /**
   * Commit verified rows from Excel Import to database / memory
   */
  async commitExcelImport(
    entityType: "materials" | "employees" | "inward",
    validRows: any[],
    userName: string
  ): Promise<{ success: boolean; insertedCount: number }> {
    let count = 0;

    for (const item of validRows) {
      if (entityType === "materials") {
        const code = item["Material Code"] || item["material_code"];
        const name = item["Material Name"] || item["name"];
        const unit = item["Unit Code"] || item["unit_code"] || "NOS";
        const min = item["Minimum Stock"] ?? item["minimum_stock"] ?? 5;

        const existingIndex = cachedMaterials.findIndex((m) => m.code === code);
        if (existingIndex >= 0) {
          cachedMaterials[existingIndex] = {
            ...cachedMaterials[existingIndex],
            name,
            unit,
            min: String(min),
          };
        } else {
          cachedMaterials.push({
            code,
            name,
            category: item["Category"] || "General Consumable",
            spec: item["Specification"] || "Standard",
            unit,
            inward: "0.00",
            outward: "0.00",
            usage: "0.00",
            current: "0.00",
            min: String(min),
            isLow: true,
          });
        }
        count++;
      } else if (entityType === "employees") {
        const code = item["Employee Code"] || item["employee_code"];
        const name = item["Full Name"] || item["name"];
        const dept = item["Department"] || item["dept"] || "Fabrication";

        const existingIndex = cachedWorkers.findIndex((w) => w.id === code);
        if (existingIndex >= 0) {
          cachedWorkers[existingIndex] = {
            ...cachedWorkers[existingIndex],
            name,
            dept,
          };
        } else {
          cachedWorkers.push({
            id: code,
            name,
            designation: item["Designation"] || "Fabricator",
            dept,
            shift: "General (08:00)",
            status: "PRESENT",
            time: "08:00 AM",
            supervisor: userName,
          });
        }
        count++;
      } else if (entityType === "inward") {
        const challan = item["Challan Number"] || item["challan_number"];
        const matCode = item["Material Code"] || item["material_code"];
        const qty = parseFloat(item["Quantity"] || item["quantity"]);

        await this.recordInwardStock(
          {
            challan_number: challan,
            invoice_number: item["Invoice Number"] || item["invoice_number"],
            supplier_name: item["Supplier Code"] || "Imported Vendor",
            material_code: matCode,
            quantity: qty,
            unit_code: item["Unit Code"] || "TON",
            vehicle_number: item["Vehicle Number"] || "-",
          },
          userName
        );
        count++;
      }
    }

    return { success: true, insertedCount: count };
  },

  /**
   * Get workforce list
   */
  getWorkers() {
    return cachedWorkers;
  },

  /**
   * Get transaction history
   */
  getTransactions() {
    return cachedTransactions;
  },
};
