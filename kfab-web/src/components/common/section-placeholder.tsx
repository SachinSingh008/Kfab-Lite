"use client";

import React from "react";
import { LucideIcon, Sparkles, Wrench, Clock, ShieldCheck } from "lucide-react";

interface SectionPlaceholderProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  stats?: { label: string; value: string }[];
}

export function SectionPlaceholder({
  title,
  subtitle,
  description,
  icon: Icon,
  badge = "Upcoming Module",
  stats,
}: SectionPlaceholderProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Icon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
            <Clock className="size-3.5" />
            Ready for UI Build
          </span>
        </div>
      </div>

      {/* Metrics Shell */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Clean Slate Canvas / Empty Container */}
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
        <div className="size-16 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
          <Wrench className="size-8 animate-pulse text-blue-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Clean Slate Canvas</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            DB Purged & Ready
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="size-3.5 text-blue-500" />
            Zero Fake Data
          </span>
        </div>
      </div>
    </div>
  );
}
