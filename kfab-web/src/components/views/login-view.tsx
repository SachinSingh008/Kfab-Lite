"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  KeyRound,
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { AppUser, authenticateUser } from "@/lib/auth-store";

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<"superadmin" | "admin" | "supervisor" | "accountant">("superadmin");
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Assistance Dialog
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotDone, setForgotDone] = useState(false);

  const handleRoleSelect = (role: "superadmin" | "admin" | "supervisor" | "accountant") => {
    setSelectedRole(role);
    setError(null);
    if (role === "superadmin") {
      setUsername("superadmin");
      setPassword("admin123");
    } else if (role === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else if (role === "supervisor") {
      setUsername("supervisor");
      setPassword("admin123");
    } else {
      setUsername("accountant");
      setPassword("admin123");
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const user = authenticateUser(username, password);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(user);
      }, 250);
    } catch (err: unknown) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Authentication failed. Please verify credentials.");
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotDone(true);
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-12 bg-white">
      {/* 1. LEFT INDUSTRIAL ARCHITECTURAL HERO COLUMN */}
      <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 relative flex-col justify-between overflow-hidden bg-slate-950 text-white min-h-screen">
        {/* Full-bleed background image */}
        <Image
          src="/kfab_structure.jpg"
          alt="KFAB Heavy Structural Steel Fabrication Facility"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover object-center scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Sophisticated dark cinematic scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/30" />

        {/* Top Branding Header */}
        <div className="relative z-10 p-12 flex items-center gap-4">
          <div className="shrink-0">
            <Image
              src="/logo.png"
              alt="KFAB Logo"
              width={46}
              height={46}
              className="object-contain drop-shadow-md"
              priority
            />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-2xl tracking-tight">
              KFAB360
            </h2>
            <p className="text-xs text-slate-300 font-medium tracking-wide">
              KFAB Infra Projects Pvt. Ltd. &bull; Jejuri MIDC, Pune
            </p>
          </div>
        </div>

        {/* Bottom Hero Typography */}
        <div className="relative z-10 p-12 space-y-5 max-w-xl">
          <div className="w-12 h-1 bg-[#F59E0B] rounded-full" />
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Precision Engineering. <br />
            <span className="text-slate-300 font-normal">Heavy Structural Steel.</span>
          </h1>
          <p className="text-sm text-slate-300 font-light leading-relaxed max-w-lg">
            Unified manufacturing intelligence platform for structural fabrication shop-floors, atomic material ledgers, and workforce deployment.
          </p>
          
          <div className="pt-6 border-t border-white/15 text-xs text-slate-400 font-medium tracking-wider">
            <span>Plant Facility: Jejuri Industrial Area (MIDC), Pune</span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT LOGIN FORM COLUMN */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-8 sm:p-14 lg:p-16 bg-white min-h-screen">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 lg:hidden mb-8">
          <div className="shrink-0">
            <Image
              src="/logo.png"
              alt="KFAB Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">KFAB360</h2>
            <p className="text-xs text-slate-500">KFAB Infra Projects Pvt. Ltd.</p>
          </div>
        </div>

        {/* Center Container */}
        <div className="my-auto max-w-md w-full mx-auto space-y-7">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Enter your credentials to access your enterprise workspace.
            </p>
          </div>

          {/* Minimalist Segmented Role Switcher */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Role Select
            </label>
            <div className="grid grid-cols-4 p-1 bg-slate-100/90 rounded-xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => handleRoleSelect("superadmin")}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                  selectedRole === "superadmin"
                    ? "bg-[#0F172A] text-white shadow-sm"
                    : "text-slate-600 hover:text-[#0F172A]"
                }`}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("admin")}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                  selectedRole === "admin"
                    ? "bg-[#DC2626] text-white shadow-sm shadow-red-600/30"
                    : "text-slate-600 hover:text-[#DC2626]"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("supervisor")}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                  selectedRole === "supervisor"
                    ? "bg-[#FACC15] text-[#0F172A] shadow-sm shadow-yellow-400/40 border border-[#EAB308]"
                    : "text-slate-600 hover:text-[#CA8A04]"
                }`}
              >
                Supervisor
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("accountant")}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                  selectedRole === "accountant"
                    ? "bg-[#16A34A] text-white shadow-sm shadow-green-600/30"
                    : "text-slate-600 hover:text-[#16A34A]"
                }`}
              >
                Accountant
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Login ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Username / Login ID
              </label>
              <div className="relative">
                <User className="size-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="superadmin"
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] font-mono transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotDone(false);
                    setForgotEmail(username || "");
                    setForgotOpen(true);
                  }}
                  className="text-xs text-slate-500 hover:text-[#0F172A] font-semibold transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="size-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="admin123"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-[#0F172A] transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember device checkbox */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-[#0F172A] focus:ring-[#0F172A] size-4 accent-[#0F172A]"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Submit Button (Authoritative Dark Theme) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} KFAB Infra Projects Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative text-[#0F172A]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-slate-100 text-[#0F172A] flex items-center justify-center">
                  <KeyRound className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Password Assistance</h4>
                  <p className="text-[11px] text-slate-500">Recovery instructions dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setForgotOpen(false)}
                className="text-slate-400 hover:text-[#0F172A] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {!forgotDone ? (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@kfab.in"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-[#0F172A] font-mono focus:bg-white focus:ring-1 focus:ring-[#0F172A] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Default credentials are <strong className="text-[#0F172A]">superadmin</strong> with password <strong className="text-[#0F172A]">admin123</strong>.
                </p>
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Reset Link Dispatched
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    If an active account exists for <strong className="text-slate-900">{forgotEmail}</strong>, instructions have been sent.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="px-4 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
