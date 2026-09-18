import React from "react";

export type BadgeTone = "success" | "danger" | "warning" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}

export function StatusBadge({ label, tone = "neutral", dot = true }: StatusBadgeProps) {
  const styles: Record<BadgeTone, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const dotStyles: Record<BadgeTone, string> = {
    success: "bg-emerald-500",
    danger: "bg-rose-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[tone]}`}
    >
      {dot && <span className={`size-1.5 rounded-full ${dotStyles[tone]}`} />}
      {label}
    </span>
  );
}
