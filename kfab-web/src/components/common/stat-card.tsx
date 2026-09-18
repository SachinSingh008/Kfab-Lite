import React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-blue-600 bg-blue-50",
}: StatCardProps) {
  const changeColors = {
    positive: "text-emerald-600 bg-emerald-50",
    negative: "text-rose-600 bg-rose-50",
    neutral: "text-slate-600 bg-slate-50",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconColor}`}>
          <Icon className="size-5" />
        </div>
      </div>
      {change && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${changeColors[changeType]}`}>
            {change}
          </span>
          <span className="text-xs text-slate-400">vs yesterday</span>
        </div>
      )}
    </div>
  );
}
