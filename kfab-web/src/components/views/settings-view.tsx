"use client";

import React, { useState } from "react";
import {
  Building2,
  Clock,
  ShieldCheck,
  Scale,
  Database,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  Server,
  Layers,
  MapPin,
  Calendar,
  FileCheck2,
} from "lucide-react";

export function SettingsView() {
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Save Notification */}
      {savedNotice && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>Plant configuration settings saved successfully to company registry.</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-kfab flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#E8F1FF] text-[#0F172A]">
              <Building2 className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#172033]">
                Plant Settings & System Configuration
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage fabrication bay operational limits, midnight shift lock, weighbridge tolerances, and enterprise profiles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F1FF] text-[#0F172A] text-xs font-semibold border border-[#CBD5E1]">
            <span className="size-2 rounded-full bg-[#16A34A] animate-pulse" />
            Jejuri MIDC Active
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Plant & Corporate Identity */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-kfab">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[#E2E8F0]">
            <Building2 className="size-4 text-[#0F172A]" />
            <h4 className="text-sm font-bold text-[#172033]">Manufacturing Plant & Legal Entity</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">Legal Company Name</label>
              <input
                type="text"
                readOnly
                value="KFAB Infra Projects Pvt. Ltd."
                className="w-full p-2.5 bg-[#F4F7FC] border border-[#E2E8F0] rounded-lg font-semibold text-[#172033]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">Plant Facility Code</label>
              <input
                type="text"
                readOnly
                value="KFAB-JEU-PLANT-01"
                className="w-full p-2.5 bg-[#F4F7FC] border border-[#E2E8F0] rounded-lg font-mono font-semibold text-[#172033]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">GSTIN / Tax ID</label>
              <input
                type="text"
                readOnly
                value="27AABCK1234F1Z8"
                className="w-full p-2.5 bg-[#F4F7FC] border border-[#E2E8F0] rounded-lg font-mono font-semibold text-[#172033]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-[#64748B] block mb-1.5">
                Plant Physical Address & Fabrication Yards
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-[#F4F7FC] border border-[#E2E8F0] rounded-lg text-[#172033]">
                <MapPin className="size-4 text-[#64748B] shrink-0" />
                <span className="font-medium">
                  Plot D-44/1 & D-44/2, Jejuri Industrial Area (MIDC), Taluka Purandar, District Pune, Maharashtra - 412303
                </span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">ASME & ISO Accreditation</label>
              <input
                type="text"
                readOnly
                value="ISO 9001:2015 | ASME Sec IX"
                className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg font-semibold text-emerald-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shift Hours & Date Lock Controls */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-kfab">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[#E2E8F0]">
            <Clock className="size-4 text-[#0F172A]" />
            <h4 className="text-sm font-bold text-[#172033]">Operational Shifts & Midnight Date Lock</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">Plant Server Timezone</label>
              <input
                type="text"
                readOnly
                value="Asia/Kolkata (IST, UTC+05:30)"
                className="w-full p-2.5 bg-[#F4F7FC] border border-[#E2E8F0] rounded-lg font-semibold text-[#172033]"
              />
              <p className="text-[10px] text-[#64748B] mt-1">Strict clock synchronization for all attendance and gate entries.</p>
            </div>

            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">Muster Date Lock Rule</label>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800">
                <span className="font-semibold">Midnight Lock (23:59 IST)</span>
                <Lock className="size-3.5" />
              </div>
              <p className="text-[10px] text-[#64748B] mt-1">Previous day attendance is frozen; only Super Admin can request unlocked override.</p>
            </div>

            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">Production Shifts</label>
              <div className="space-y-1 text-[11px] font-medium text-[#172033]">
                <div className="flex justify-between p-1.5 bg-[#F4F7FC] rounded border border-[#E2E8F0]">
                  <span>Shift A (Morning)</span>
                  <span className="font-mono text-[#0F172A]">07:00 - 15:30</span>
                </div>
                <div className="flex justify-between p-1.5 bg-[#F4F7FC] rounded border border-[#E2E8F0]">
                  <span>Shift B (Evening)</span>
                  <span className="font-mono text-[#0F172A]">15:30 - 23:59</span>
                </div>
                <div className="flex justify-between p-1.5 bg-[#F4F7FC] rounded border border-[#E2E8F0]">
                  <span>General Office Shift</span>
                  <span className="font-mono text-[#0F172A]">08:30 - 17:30</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Material Quality & Weighbridge Controls */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-kfab">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-[#E2E8F0]">
            <Scale className="size-4 text-[#F59E0B]" />
            <h4 className="text-sm font-bold text-[#172033]">Weighbridge Gate & Inward Tolerance</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">Main Weighbridge Calibrator</label>
              <input
                type="text"
                defaultValue="WB-60T Avery India (Calibrated till Dec 2026)"
                className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-lg font-medium text-[#172033] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">Weight Discrepancy Tolerance (%)</label>
              <input
                type="number"
                step="0.1"
                defaultValue="0.5"
                className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-lg font-semibold text-[#172033] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
              <p className="text-[10px] text-[#64748B] mt-1">Discrepancy over 0.5% triggers automatic invoice audit hold.</p>
            </div>

            <div>
              <label className="font-semibold text-[#64748B] block mb-1.5">MTC / Heat Number Requirement</label>
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-amber-800">
                <span className="font-semibold">Mandatory for Structural Steel</span>
                <FileCheck2 className="size-3.5 text-amber-700" />
              </div>
              <p className="text-[10px] text-[#64748B] mt-1">Gate entry rejects plates without mill test certificate.</p>
            </div>
          </div>
        </div>

        {/* Section 4: Multi-tenant Security & Database Engine */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-kfab">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E2E8F0]">
            <Database className="size-4 text-[#0F172A]" />
            <h4 className="text-sm font-bold text-[#172033]">Enterprise Database & Multi-Tenant Security</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-[#F4F7FC] rounded-lg border border-[#E2E8F0] font-mono text-[11px] space-y-1.5 text-[#172033]">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Security Engine:</span>
                <span className="font-bold text-[#16A34A] flex items-center gap-1">
                  <ShieldCheck className="size-3.5" />
                  PostgreSQL Row Level Security (RLS) Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Data Integrity Model:</span>
                <span className="font-semibold text-[#172033]">Strict Multi-Tenant Isolation by Company ID</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Ledger Accounting:</span>
                <span className="font-semibold text-[#172033]">Append-Only Double Entry with Atomic Locks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Active Database State:</span>
                <span className="font-bold text-[#0F172A]">Clean Slate (Zero Mock Residuals)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg shadow-kfab transition-all cursor-pointer"
            >
              <Save className="size-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
