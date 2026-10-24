"use client";

import React from "react";
import {
  X,
  History,
  Info,
  ShieldCheck,
  Building2,
  Briefcase,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { ApiUserDTO, AuditLogDTO } from "@/lib/api-client";

interface UserDetailsDrawerProps {
  viewingUser: (ApiUserDTO & { auditLogs?: AuditLogDTO[] }) | null;
  onClose: () => void;
  isLoading: boolean;
}

export function UserDetailsDrawer({
  viewingUser,
  onClose,
  isLoading,
}: UserDetailsDrawerProps) {
  if (!viewingUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
              {viewingUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{viewingUser.fullName}</h4>
              <p className="text-[11px] text-slate-300 font-mono">{viewingUser.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Identity & Status Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">System Role:</span>
              <span className="font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300 text-[10px]">
                {viewingUser.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Account Status:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  viewingUser.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {viewingUser.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Department:</span>
              <span className="font-semibold text-slate-900">{viewingUser.department || "General Plant"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Designation:</span>
              <span className="font-semibold text-slate-900">{viewingUser.designation || "Not specified"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Registered:</span>
              <span className="font-medium text-slate-700">
                {new Date(viewingUser.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Audit Logs Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="size-3.5 text-blue-600" />
                <span>Security Audit Trail</span>
              </h5>
              {isLoading && <RefreshCw className="size-3 text-blue-600 animate-spin" />}
            </div>

            {viewingUser.auditLogs && viewingUser.auditLogs.length > 0 ? (
              <div className="space-y-2">
                {viewingUser.auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border border-slate-100 bg-white text-xs shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                    {log.reason && <p className="text-[11px] text-slate-600">{log.reason}</p>}
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Module: {log.module}</span>
                      <span className={log.status === "SUCCESS" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No recent security audit events recorded for this user.
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
