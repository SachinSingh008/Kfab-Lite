"use client";

import React from "react";
import { Building2, Globe2 } from "lucide-react";

interface DashboardCompanyTabsProps {
  companies: Array<{ id: string; name: string; code: string }>;
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  canViewAllCompanies: boolean;
}

export function DashboardCompanyTabs({
  companies,
  selectedCompanyId,
  onSelectCompany,
  canViewAllCompanies,
}: DashboardCompanyTabsProps) {
  const showAllCompaniesTab = canViewAllCompanies && companies.length > 1;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-2 shadow-sm">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
        {showAllCompaniesTab && (
          <button
            onClick={() => onSelectCompany("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
              selectedCompanyId === "all"
                ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border-transparent hover:border-[#E2E8F0]"
            }`}
          >
            <Globe2 className="size-3.5" />
            <span>All Authorized Companies</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                selectedCompanyId === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {companies.length}
            </span>
          </button>
        )}

        {companies.map((c) => {
          const isSelected = selectedCompanyId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelectCompany(c.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                isSelected
                  ? "bg-[#0F172A] text-white border-[#0F172A] shadow-sm"
                  : "bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border-transparent hover:border-[#E2E8F0]"
              }`}
            >
              <Building2 className="size-3.5" />
              <span>{c.name}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {c.code}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
