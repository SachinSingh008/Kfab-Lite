"use client";

import React from "react";

export function SettingsView() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Company Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-500 block mb-1">Company Name</label>
            <input
              type="text"
              readOnly
              value="KFAB Infra Projects Pvt Ltd"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-500 block mb-1">Company Code</label>
            <input
              type="text"
              readOnly
              value="KFAB"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-500 block mb-1">
              Timezone / Server Date Lock
            </label>
            <input
              type="text"
              readOnly
              value="Asia/Kolkata (IST)"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-500 block mb-1">Midnight Lock Status</label>
            <input
              type="text"
              readOnly
              value="Active (Locked at 23:59 IST)"
              className="w-full p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-medium"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Backend Connection Status</h3>
        <p className="text-xs text-slate-500 mb-4">
          Local project is prepared. Remote Supabase credentials can be populated in `.env.local`.
        </p>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-1 text-slate-700">
          <p>Client: @supabase/supabase-js, @supabase/ssr</p>
          <p>Database Schema: kfab-backend/supabase/schema.sql (Ready for review)</p>
          <p>Multi-tenancy: Strict Company Member Isolation with Row Level Security</p>
        </div>
      </div>
    </div>
  );
}
