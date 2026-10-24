"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  MessageSquare,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { AppUser } from "@/lib/auth-store";

interface ChatUnderProcessViewProps {
  currentUser: AppUser;
  onBackToDashboard?: () => void;
  onEnableDevChat?: () => void;
}

const FUNNY_QUOTES = [
  "Beep Boop! 🤖 Tightening the last bolts on the chat servers!",
  "Watch out for the sparks! ⚡ Welding Bay 1 to the cloud!",
  "Android Bot #008 reporting! 👷‍♂️ Chat feature is being fabricated!",
  "Turning 1,024 screws... 🔩 Please hold your messages!",
  "Coffee tank at 20%! ☕ Tap to fuel me up!",
  "Applying anti-rust coating 🛡️ to the real-time websocket pipes!",
];

export function ChatUnderProcessView({
  currentUser,
  onBackToDashboard,
  onEnableDevChat,
}: ChatUnderProcessViewProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [bouncing, setBouncing] = useState(false);
  const [coffeeCount, setCoffeeCount] = useState(0);

  const pokeBot = () => {
    setBouncing(true);
    setQuoteIndex((prev) => (prev + 1) % FUNNY_QUOTES.length);
    setTimeout(() => setBouncing(false), 300);
  };

  const fuelCoffee = () => {
    setBouncing(true);
    setCoffeeCount((c) => c + 1);
    setQuoteIndex((prev) => (prev + 1) % FUNNY_QUOTES.length);
    setTimeout(() => setBouncing(false), 300);
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50/50">
      {/* Top Header Bar */}
      <div className="h-14 px-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <MessageSquare className="size-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">
              Team Chat
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Under Process
            </p>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center">

          {/* Speech Bubble */}
          <div
            onClick={pokeBot}
            className="group cursor-pointer select-none bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-2 transition-all hover:shadow-md max-w-sm"
          >
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              {FUNNY_QUOTES[quoteIndex]}
            </p>
            <p className="text-[10px] text-slate-400 italic mt-1 group-hover:text-slate-600 transition-colors">
              👆 Click the bot or bubble to poke!
            </p>
          </div>

          {/* Speech Bubble Arrow */}
          <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white mb-4 -mt-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]" />

          {/* 3D Mechanic Android Bot Image with Floating and Bounce */}
          <div
            onClick={pokeBot}
            className="relative cursor-pointer select-none py-2 flex flex-col items-center group"
          >
            <div
              className={`transition-transform duration-300 ${
                bouncing ? "-translate-y-4 scale-105" : "hover:-translate-y-1 animate-pulse-gentle"
              }`}
            >
              <Image
                src="/android_bot_mechanic.png"
                alt="KFAB Mechanic Android Bot"
                width={240}
                height={230}
                className="object-contain drop-shadow-md select-none pointer-events-none"
                priority
              />
            </div>
            {/* Ground Shadow */}
            <div className="w-36 h-3 bg-slate-900/10 rounded-full blur-[3px] mt-1 transition-transform duration-300" />
          </div>

          {/* Headline */}
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-5 mb-6">
            This feature is under process
          </h2>

          {/* Fuel Coffee Button */}
          <button
            type="button"
            onClick={fuelCoffee}
            className="w-full max-w-xs py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer mb-3"
          >
            <span>☕</span>
            <span>
              {coffeeCount === 0
                ? "Fuel Android Bot with Coffee"
                : `Fuel More Coffee! (Total: ${coffeeCount} ☕)`}
            </span>
          </button>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            )}

            {onEnableDevChat && currentUser.role === "SUPER_ADMIN" && (
              <button
                type="button"
                onClick={onEnableDevChat}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors cursor-pointer py-2.5 px-3"
              >
                <Zap className="size-3.5" />
                Dev Preview
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
