"use client";

import React from "react";
import {
  X,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Truck,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Calendar,
  DollarSign,
  UserCheck,
  Building2,
  Clock,
  HardHat,
  Eye,
} from "lucide-react";
import {
  InventoryCategory,
  InventoryItemDTO,
  InventoryEmployeeDTO,
  InventoryIssueDTO,
  InventoryTransactionDTO,
} from "@/lib/inventory-api";
import {
  AddFormState,
  IssueFormState,
  ReturnFormState,
  RestockFormState,
  AdjustFormState,
  DetailDataState,
} from "./inventory-types";

// ============================================================================
// 1. ADD ITEM MODAL
// ============================================================================
interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: AddFormState;
  onChange: React.Dispatch<React.SetStateAction<AddFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export function AddItemModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  loading,
}: AddItemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add New Inventory Item</h2>
              <p className="text-xs text-slate-500">Register consumable, machinery, or PPE gear</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    category: e.target.value as InventoryCategory,
                  }))
                }
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="CONSUMABLES_TACKLES">Consumables & Tackles (Tab 1)</option>
                <option value="MACHINERY_TOOLS">Machinery & Tools (Tab 2)</option>
                <option value="SAFETY_CLOTHES">Clothes & Safety Gear (Tab 3)</option>
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subcategory
              </label>
              <input
                type="text"
                placeholder="e.g. Welding Electrodes, Drills"
                value={form.subcategory}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, subcategory: e.target.value }))
                }
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Item Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Item Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ELEC-7018-01"
                value={form.item_code}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, item_code: e.target.value }))
                }
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-blue-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure *</label>
              <select
                value={form.unit}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, unit: e.target.value }))
                }
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Nos">Nos (Pieces)</option>
                <option value="Kgs">Kgs (Kilograms)</option>
                <option value="Meters">Meters</option>
                <option value="Pairs">Pairs</option>
                <option value="Boxes">Boxes</option>
                <option value="Sets">Sets</option>
                <option value="Liters">Liters</option>
              </select>
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Item Name & Specifications *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. E7018 3.15mm Heavy Low-Hydrogen Welding Electrode"
              value={form.item_name}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, item_name: e.target.value }))
              }
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Make</label>
              <input
                type="text"
                placeholder="e.g. ESAB, Bosch, Karam"
                value={form.brand}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, brand: e.target.value }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model / Spec</label>
              <input
                type="text"
                placeholder="e.g. GWS 600, Size 9"
                value={form.model}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, model: e.target.value }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Opening Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Opening Stock</label>
              <input
                type="number"
                min="0"
                value={form.opening_quantity}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    opening_quantity: Number(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>

            {/* Minimum Stock */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Buffer Alert</label>
              <input
                type="number"
                min="0"
                value={form.minimum_stock}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    minimum_stock: Number(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                min="0"
                value={form.purchase_price}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    purchase_price: Number(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Storage Bin / Rack</label>
              <input
                type="text"
                placeholder="e.g. Rack A-3, Bay 2 Store"
                value={form.location}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, location: e.target.value }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Supplier</label>
              <input
                type="text"
                placeholder="e.g. Apex Industrial Supplies"
                value={form.supplier}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, supplier: e.target.value }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Registering..." : "Save to Inventory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ISSUE ITEM MODAL
// ============================================================================
interface IssueItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemDTO | null;
  employees: InventoryEmployeeDTO[];
  form: IssueFormState;
  onChange: React.Dispatch<React.SetStateAction<IssueFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export function IssueItemModal({
  isOpen,
  onClose,
  item,
  employees,
  form,
  onChange,
  onSubmit,
  loading,
}: IssueItemModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Issue to Floor / Worker</h2>
              <p className="text-xs text-slate-500">Record material handover & custody</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Selected Item Banner */}
        <div className="mt-4 p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-mono font-bold text-blue-700">{item.itemCode}</span>
            <p className="font-bold text-slate-900 mt-0.5">{item.itemName}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">Available in Store</span>
            <span className="font-extrabold text-blue-800 text-sm">
              {item.currentStock} {item.unit}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3.5">
          {/* Employee Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient Employee / Operator *
            </label>
            <select
              required
              value={form.employee_id}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, employee_id: e.target.value }))
              }
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden"
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode} - {emp.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity to Issue *
              </label>
              <input
                type="number"
                min="1"
                max={item.currentStock}
                required
                value={form.quantity}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value) || 1,
                  }))
                }
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, issue_date: e.target.value }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Expected Return Date (for machinery or returnable items) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expected Return Date (Optional)
            </label>
            <input
              type="date"
              value={form.expected_return_date}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, expected_return_date: e.target.value }))
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Work Bay / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Bay 2 Heavy Girder Fit-Up"
              value={form.remarks}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, remarks: e.target.value }))
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || item.currentStock <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Recording Issue..." : "Confirm Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 3. RETURN ITEM MODAL
// ============================================================================
interface ReturnItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: InventoryIssueDTO | null;
  form: ReturnFormState;
  onChange: React.Dispatch<React.SetStateAction<ReturnFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export function ReturnItemModal({
  isOpen,
  onClose,
  issue,
  form,
  onChange,
  onSubmit,
  loading,
}: ReturnItemModalProps) {
  if (!isOpen || !issue) return null;

  const pendingQty = issue.quantity - (issue.returnedQuantity || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowDownLeft className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Return Equipment to Tool Crib</h2>
              <p className="text-xs text-slate-500">Record equipment handover & check condition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Selected Issue Info */}
        <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-900">{issue.itemName || "Item"}</span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Issued to: <span className="font-bold text-indigo-900">{issue.employeeName}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">Pending in Custody</span>
            <span className="font-extrabold text-indigo-700 text-sm">{pendingQty} Nos</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            {/* Return Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Return Quantity *
              </label>
              <input
                type="number"
                min="1"
                max={pendingQty}
                required
                value={form.return_quantity}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    return_quantity: Number(e.target.value) || 1,
                  }))
                }
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Return Date</label>
              <input
                type="date"
                value={form.return_date}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, return_date: e.target.value }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Condition at Return */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Condition at Return *
            </label>
            <select
              value={form.condition_at_return}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  condition_at_return: e.target.value as any,
                }))
              }
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
            >
              <option value="GOOD">Operational / Good Condition</option>
              <option value="UNDER_MAINTENANCE">Requires Service / Maintenance</option>
              <option value="DAMAGED">Damaged / Broken</option>
              <option value="LOST">Lost / Missing</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Return Notes</label>
            <input
              type="text"
              placeholder="e.g. Carbon brush needs replacement"
              value={form.remarks}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, remarks: e.target.value }))
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Processing Return..." : "Confirm Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 4. RESTOCK PURCHASE MODAL
// ============================================================================
interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemDTO | null;
  form: RestockFormState;
  onChange: React.Dispatch<React.SetStateAction<RestockFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export function RestockModal({
  isOpen,
  onClose,
  item,
  form,
  onChange,
  onSubmit,
  loading,
}: RestockModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Inward Purchase & Restock</h2>
              <p className="text-xs text-slate-500">Record gate arrival & increase warehouse stock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Selected Item Banner */}
        <div className="mt-4 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-mono font-bold text-emerald-800">{item.itemCode}</span>
            <p className="font-bold text-slate-900 mt-0.5">{item.itemName}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">Current Balance</span>
            <span className="font-extrabold text-emerald-700 text-sm">
              {item.currentStock} {item.unit}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Inward Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value) || 1,
                  }))
                }
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                min="0"
                value={form.unit_price}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    unit_price: Number(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Supplier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Name</label>
              <input
                type="text"
                placeholder="Supplier or Vendor"
                value={form.supplier}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, supplier: e.target.value }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              />
            </div>

            {/* Reference ID (Challan/PO) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Challan / Invoice No.
              </label>
              <input
                type="text"
                placeholder="e.g. CH-2026-904"
                value={form.reference_id}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, reference_id: e.target.value }))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
            <input
              type="text"
              placeholder="e.g. Weighbridge verified"
              value={form.remarks}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, remarks: e.target.value }))
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Recording Purchase..." : "Confirm Inward"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 5. ADJUST STOCK MODAL
// ============================================================================
interface AdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemDTO | null;
  form: AdjustFormState;
  onChange: React.Dispatch<React.SetStateAction<AdjustFormState>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

export function AdjustModal({
  isOpen,
  onClose,
  item,
  form,
  onChange,
  onSubmit,
  loading,
}: AdjustModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Stock Take Adjustment</h2>
              <p className="text-xs text-slate-500">Correct physical count discrepancy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Selected Item Banner */}
        <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-mono font-bold text-amber-800">{item.itemCode}</span>
            <p className="font-bold text-slate-900 mt-0.5">{item.itemName}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">System Balance</span>
            <span className="font-extrabold text-slate-800 text-sm">
              {item.currentStock} {item.unit}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            {/* Adjustment Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Type *</label>
              <select
                value={form.adjustment_type}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    adjustment_type: e.target.value as any,
                  }))
                }
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
              >
                <option value="ADJUSTMENT_IN">Adjustment IN (Increase +)</option>
                <option value="ADJUSTMENT_OUT">Adjustment OUT (Decrease -)</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adjustment Qty *
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value) || 1,
                  }))
                }
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Audit Reason / Variance Justification *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly physical audit recount variance"
              value={form.reason}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, reason: e.target.value }))
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Recording..." : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
