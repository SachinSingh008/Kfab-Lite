"use client";

import React, { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const pathname = window.location.pathname;

      // Gracefully recover to root with appropriate tab parameter
      if (search && search.includes("tab=")) {
        window.location.replace(`/${search}`);
      } else {
        const cleanPath = pathname.replace(/^\//, "");
        if (cleanPath && cleanPath !== "404") {
          window.location.replace(`/?tab=${cleanPath}`);
        } else {
          window.location.replace("/");
        }
      }
    }
  }, []);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0F172A] text-white select-none">
      <RefreshCw className="size-8 text-amber-500 animate-spin mb-4" />
      <h2 className="text-lg font-bold">Restoring KFAB360 Workspace...</h2>
      <p className="text-xs text-slate-400 mt-1">Reconnecting to active session...</p>
    </div>
  );
}
