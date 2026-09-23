"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  trendText?: string;
  trendType?: "positive" | "negative" | "neutral";
  sparklineData?: number[]; // Array of values 0-100 for mini SVG sparkline
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor,
  trendText,
  trendType = "neutral",
  sparklineData = [35, 42, 48, 55, 62, 70, 85],
}: KpiCardProps) {
  // Generate SVG points from sparkline data
  const width = 80;
  const height = 28;
  const min = Math.min(...sparklineData, 0);
  const max = Math.max(...sparklineData, 100);
  const range = max - min || 1;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-kfab hover:shadow-kfab-md transition-all duration-200 flex flex-col justify-between">
      {/* Top row: Icon & Trend pill */}
      <div className="flex items-center justify-between">
        <div
          className={`size-11 rounded-xl flex items-center justify-center ${iconBgColor} ${iconColor} shadow-2xs`}
        >
          <Icon className="size-5.5" />
        </div>

        {trendText && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              trendType === "positive"
                ? "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                : trendType === "negative"
                ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
                : "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
            }`}
          >
            {trendType === "positive" && <TrendingUp className="size-3" />}
            {trendType === "negative" && <TrendingDown className="size-3" />}
            {trendType === "neutral" && <Minus className="size-3" />}
            <span>{trendText}</span>
          </span>
        )}
      </div>

      {/* Main Metric & Title */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold text-[#64748B] tracking-wide uppercase">
            {title}
          </p>
          <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mt-1">
            {value}
          </h3>
        </div>

        {/* Mini SVG Sparkline */}
        <div className="pb-1 pl-2 opacity-85">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke={
                trendType === "positive"
                  ? "#16A34A"
                  : trendType === "negative"
                  ? "#DC2626"
                  : "#0F172A"
              }
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Subtitle / Context */}
      <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
        <span className="truncate">{subtitle}</span>
      </div>
    </div>
  );
}
