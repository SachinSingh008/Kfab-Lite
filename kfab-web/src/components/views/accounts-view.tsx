"use client";

import React from "react";
import { AppUser } from "@/lib/auth-store";

interface AccountsViewProps {
  currentUser: AppUser;
  records?: any;
}

export function AccountsView({ currentUser }: AccountsViewProps) {
  const getInvoicingUrl = () => {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "http://localhost:5173";
      }
      return "/invoicing";
    }
    return "/invoicing";
  };

  return (
    <div className="w-full h-[calc(100vh-5.5rem)] min-h-[750px] bg-white rounded-2xl border border-[#E2E8F0] shadow-kfab overflow-hidden relative">
      <iframe
        src={getInvoicingUrl()}
        title="KFAB Invoicing Platform"
        className="w-full h-full border-0"
        allow="clipboard-write; clipboard-read"
      />
    </div>
  );
}
