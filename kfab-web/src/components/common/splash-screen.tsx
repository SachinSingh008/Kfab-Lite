"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export function SplashScreen({
  onComplete,
  minDurationMs = 3800,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();

    // Smooth progress bar update over duration
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / minDurationMs) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        handleFinish();
      }
    }, 40);

    const fallbackTimer = setTimeout(() => {
      handleFinish();
    }, minDurationMs + 400);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [minDurationMs]);

  const handleFinish = () => {
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 sm:p-14 lg:p-16 overflow-hidden transition-opacity duration-600 select-none bg-slate-950 text-white ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* 1. Full-Bleed Background Image (Exact match to Login Screen) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/kfab_structure.jpg"
          alt="KFAB Heavy Structural Steel Fabrication Facility"
          fill
          priority
          unoptimized
          className="object-cover object-center scale-105 transition-transform duration-3000 ease-out"
        />
        {/* Sophisticated Dark Cinematic Scrim matching Login Screen */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70" />
      </div>

      {/* 2. Centerpiece: Pure Logo & Prominent Senior-Designer Typography */}
      <div className="relative z-10 flex flex-col items-center max-w-3xl w-full text-center my-auto py-8">
        {/* Pure Logo (Zero Box, Zero Background Fill, 2X Size) */}
        <div className="relative mb-6 shrink-0 transform transition-transform duration-700 hover:scale-105">
          <Image
            src="/logo.png"
            alt="KFAB Logo"
            width={184}
            height={184}
            className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.95)]"
            priority
          />
        </div>

        {/* Master Brand Title (Significantly Increased Font Size) */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
          KFAB<span className="text-[#F59E0B]">360</span>
        </h1>

        {/* Corporate Identity Tagline */}
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-slate-300 mt-2.5 drop-shadow-md">
          KFAB Infra Projects Pvt. Ltd. &bull; Pune
        </p>

        {/* Industrial Amber Divider */}
        <div className="w-16 sm:w-20 h-1.5 bg-[#F59E0B] rounded-full my-5 shadow-[0_0_15px_rgba(245,158,11,0.8)]" />

        {/* Tagline Headings (Prominent, High-Impact Font Size) */}
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
            Precision Engineering.
          </h2>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-slate-300 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            Heavy Structural Steel.
          </h3>
        </div>

        {/* Platform Enterprise Descriptor */}
        <p className="text-xs sm:text-sm md:text-base text-slate-300/90 font-light max-w-xl mx-auto mt-4 leading-relaxed drop-shadow-md px-4">
          Unified manufacturing intelligence platform for structural fabrication shop-floors, atomic material ledgers, and workforce deployment.
        </p>

        {/* High-End Enterprise Progress Telemetry */}
        <div className="mt-8 w-72 sm:w-96 max-w-full flex flex-col items-center gap-2">
          <div className="w-full flex items-center justify-between text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            <span className="text-amber-400">INITIALIZING WORKSPACE</span>
            <span className="text-white font-mono">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/15 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-[#F59E0B] to-amber-300 rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(245,158,11,0.9)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Continue to Portal Button (Pure text link, Zero background fill) */}
        <button
          onClick={handleFinish}
          className="mt-7 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/90 hover:text-white uppercase tracking-widest py-2 px-5 rounded-full border border-white/20 hover:border-amber-400/80 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md shadow-xl hover:scale-105 group"
        >
          <span>Continue to Portal</span>
          <ArrowRight className="size-4 text-[#F59E0B] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 4. Bottom Corporate Footer */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-400 font-medium tracking-wider pt-4 border-t border-white/10">
        <div>
          Plant Facility: Jejuri Industrial Area (MIDC), Pune
        </div>
        <div className="text-slate-500 font-mono">
          v2026.1 KFab360 Enterprise ERP
        </div>
      </div>
    </div>
  );
}
