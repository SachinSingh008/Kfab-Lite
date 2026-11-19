"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Check,
  RotateCcw,
  Sparkles,
  Columns,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ProjectCol } from "@/lib/project-monitoring-store";

export interface FabricationRow {
  id: string;
  item: string;
  qty: string;
  status: string;
  remark: string;
}

export interface MaterialRow {
  id: string;
  itemNo: number | string;
  description: string;
  required: string;
  arrived: string;
  pending: string;
}

export interface ToolRow {
  id: string;
  itemName: string;
  status: string;
}

export interface ProjectWorksheetsData {
  fabrication: FabricationRow[];
  materials: MaterialRow[];
  tools: ToolRow[];
}

const DEFAULT_FABRICATION_ROWS: FabricationRow[] = [
  { id: "f1", item: "Base Plates 25mm THK", qty: "24 Nos", status: "Done", remark: "Cut & drilled" },
  { id: "f2", item: "Main Built-up Columns (ISMB 400)", qty: "12 Nos", status: "In Progress", remark: "Fit-up ongoing" },
  { id: "f3", item: "Rafter Trusses 18m Span", qty: "06 Nos", status: "In Progress", remark: "4 welded, 2 fit-up" },
  { id: "f4", item: "Roof Purlins 150x50x20 C-Z", qty: "84 Nos", status: "Pending", remark: "Awaiting slitting" },
  { id: "f5", item: "Sag Rods & Tie Runners M16", qty: "120 Nos", status: "Pending", remark: "Threading in queue" },
  { id: "f6", item: "Crane Gantry Girders 40T", qty: "04 Nos", status: "In Progress", remark: "Web & flange aligned" },
  { id: "f7", item: "Bracing Angles ISA 75x75x6", qty: "48 Nos", status: "Done", remark: "Shop primer applied" },
  { id: "f8", item: "Anchor Bolt Cages M24 Gr 8.8", qty: "96 Sets", status: "Done", remark: "Dispatched to site" },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `f_empty_${i + 9}`,
    item: "",
    qty: "",
    status: "",
    remark: "",
  })),
];

const DEFAULT_MATERIAL_ROWS: MaterialRow[] = [
  { id: "m1", itemNo: 1, description: "ISMB 400 Main Beams", required: "24.5 MT", arrived: "24.5 MT", pending: "0 MT" },
  { id: "m2", itemNo: 2, description: "ISMC 200 Purlin Channels", required: "16.0 MT", arrived: "12.0 MT", pending: "4.0 MT" },
  { id: "m3", itemNo: 3, description: "MS Plate 20mm E250", required: "8.5 MT", arrived: "8.5 MT", pending: "0 MT" },
  { id: "m4", itemNo: 4, description: "MS Plate 12mm E250", required: "6.2 MT", arrived: "4.0 MT", pending: "2.2 MT" },
  { id: "m5", itemNo: 5, description: "Chequered Plate 6mm Flooring", required: "3.0 MT", arrived: "0 MT", pending: "3.0 MT" },
  { id: "m6", itemNo: 6, description: "Equal Angle ISA 75x75x6", required: "4.5 MT", arrived: "4.5 MT", pending: "0 MT" },
  { id: "m7", itemNo: 7, description: "Square Tube 100x100x4", required: "5.0 MT", arrived: "5.0 MT", pending: "0 MT" },
  { id: "m8", itemNo: 8, description: "Welding Electrodes E7018", required: "50 Pkts", arrived: "50 Pkts", pending: "0 Pkts" },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `m_empty_${i + 9}`,
    itemNo: i + 9,
    description: "",
    required: "",
    arrived: "",
    pending: "",
  })),
];

const DEFAULT_TOOL_ROWS: ToolRow[] = [
  { id: "t1", itemName: "Magnetic Core Drill Machine 50mm", status: "Available (Bay 1)" },
  { id: "t2", itemName: "Inverter MIG Welding Machine 400A", status: "Assigned (Line 2)" },
  { id: "t3", itemName: "Pug Cutting Track Machine", status: "Available" },
  { id: "t4", itemName: "Torque Wrench 350 Nm (Calibrated)", status: "In Use" },
  { id: "t5", itemName: "Laser Distance Meter & Alignment Rig", status: "Available" },
  { id: "t6", itemName: "Heavy Web Lifting Clamps 5T", status: "Inspected" },
  { id: "t7", itemName: "Angle Grinder 7\" (Dewalt 2200W)", status: "Available (Stores)" },
  { id: "t8", itemName: "Digital Coating Thickness Gauge (DFT)", status: "Available" },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `t_empty_${i + 9}`,
    itemName: "",
    status: "",
  })),
];

export interface ProjectDetailSheetsModalProps {
  project: ProjectCol | null;
  onClose: () => void;
}

export function ProjectDetailSheetsModal({ project, onClose }: ProjectDetailSheetsModalProps) {
  const [activeTab, setActiveTab] = useState<"fabrication" | "material" | "tools" | "all">("fabrication");
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active selected cell coordinates for formula bar
  const [activeCellCoord, setActiveCellCoord] = useState<string>("A1");
  const [activeCellValue, setActiveCellValue] = useState<string>("");

  // Worksheet data state
  const [data, setData] = useState<ProjectWorksheetsData>(() => {
    if (!project) {
      return {
        fabrication: DEFAULT_FABRICATION_ROWS,
        materials: DEFAULT_MATERIAL_ROWS,
        tools: DEFAULT_TOOL_ROWS,
      };
    }
    try {
      const saved = localStorage.getItem(`kfab_worksheets_${project.id}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return {
      fabrication: DEFAULT_FABRICATION_ROWS,
      materials: DEFAULT_MATERIAL_ROWS,
      tools: DEFAULT_TOOL_ROWS,
    };
  });

  // Auto-save to localStorage
  useEffect(() => {
    if (!project) return;
    try {
      localStorage.setItem(`kfab_worksheets_${project.id}`, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save worksheet data", err);
    }
  }, [data, project]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  if (!project) return null;

  // Fabrication handlers
  const updateFabricationCell = (id: string, field: keyof FabricationRow, value: string) => {
    setData((prev) => ({
      ...prev,
      fabrication: prev.fabrication.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
    setActiveCellValue(value);
  };

  const addFabricationRow = () => {
    setData((prev) => ({
      ...prev,
      fabrication: [
        ...prev.fabrication,
        {
          id: `f_${Date.now()}`,
          item: "",
          qty: "",
          status: "",
          remark: "",
        },
      ],
    }));
    showToast("Added new row to Fabrication Details.");
  };

  const deleteFabricationRow = (id: string) => {
    setData((prev) => ({
      ...prev,
      fabrication: prev.fabrication.filter((r) => r.id !== id),
    }));
    showToast("Row deleted.");
  };

  // Material handlers
  const updateMaterialCell = (id: string, field: keyof MaterialRow, value: string) => {
    setData((prev) => ({
      ...prev,
      materials: prev.materials.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
    setActiveCellValue(value);
  };

  const addMaterialRow = () => {
    setData((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          id: `m_${Date.now()}`,
          itemNo: prev.materials.length + 1,
          description: "",
          required: "",
          arrived: "",
          pending: "",
        },
      ],
    }));
    showToast("Added new row to Material List.");
  };

  const deleteMaterialRow = (id: string) => {
    setData((prev) => ({
      ...prev,
      materials: prev.materials.filter((r) => r.id !== id),
    }));
    showToast("Row deleted.");
  };

  // Tool handlers
  const updateToolCell = (id: string, field: keyof ToolRow, value: string) => {
    setData((prev) => ({
      ...prev,
      tools: prev.tools.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
    setActiveCellValue(value);
  };

  const addToolRow = () => {
    setData((prev) => ({
      ...prev,
      tools: [
        ...prev.tools,
        {
          id: `t_${Date.now()}`,
          itemName: "",
          status: "",
        },
      ],
    }));
    showToast("Added new row to Tools Required.");
  };

  const deleteToolRow = (id: string) => {
    setData((prev) => ({
      ...prev,
      tools: prev.tools.filter((r) => r.id !== id),
    }));
    showToast("Row deleted.");
  };

  // Reset to default
  const handleReset = () => {
    if (confirm("Reset current project worksheets to default initial template?")) {
      setData({
        fabrication: DEFAULT_FABRICATION_ROWS,
        materials: DEFAULT_MATERIAL_ROWS,
        tools: DEFAULT_TOOL_ROWS,
      });
      showToast("Sheets reset to default.");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = "";
    if (activeTab === "fabrication" || activeTab === "all") {
      csv += "FABRICATION DETAILS\nItems to be fabricated,Qty needed,Status,Remark\n";
      data.fabrication.forEach((r) => {
        csv += `"${r.item}","${r.qty}","${r.status}","${r.remark}"\n`;
      });
      csv += "\n";
    }
    if (activeTab === "material" || activeTab === "all") {
      csv += "MATERIAL LIST\nItem no,Description,Required As per Drawing,Material Arrived,Pending Material\n";
      data.materials.forEach((r) => {
        csv += `"${r.itemNo}","${r.description}","${r.required}","${r.arrived}","${r.pending}"\n`;
      });
      csv += "\n";
    }
    if (activeTab === "tools" || activeTab === "all") {
      csv += "TOOLS REQUIRED\nItem Name,Status\n";
      data.tools.forEach((r) => {
        csv += `"${r.itemName}","${r.status}"\n`;
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.company}_${project.jobName}_Worksheets.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported to CSV!");
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 select-text animate-in fade-in duration-150"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onPaste={(e) => e.stopPropagation()}
      onCopy={(e) => e.stopPropagation()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden transition-all duration-150 ${
          isFullScreen ? "w-full h-full rounded-none" : "w-full max-w-6xl max-h-[92vh] h-[850px]"
        }`}
      >
        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-4 right-16 z-50 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 1. TOP TITLE BAR (Excel Style) */}
        <div className="bg-[#0F2642] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm uppercase tracking-wide truncate">
                  {project.company}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-slate-200 border border-white/10 shrink-0">
                  {project.status}
                </span>
                <span className="text-[11px] text-slate-300 truncate hidden md:inline">
                  • {project.jobName}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Supervisors: {project.supervisor || "Unassigned"} | Execution Worksheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export active tables to CSV"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Reset to default template"
            >
              <RotateCcw className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close worksheet"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 2. EXCEL FORMULA BAR & SHEET TOOLBAR */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          {/* Formula bar display */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-[11px] text-slate-700 shadow-2xs">
              {activeCellCoord}
            </span>
            <span className="text-slate-400 font-mono italic text-xs select-none">fx</span>
            <input
              type="text"
              readOnly
              value={activeCellValue}
              placeholder="Select any cell to view or edit"
              className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 shadow-2xs font-sans outline-none"
            />
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (activeTab === "fabrication") addFabricationRow();
                else if (activeTab === "material") addMaterialRow();
                else if (activeTab === "tools") addToolRow();
                else {
                  addFabricationRow();
                  addMaterialRow();
                  addToolRow();
                }
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>+ Add Row</span>
            </button>
          </div>
        </div>

        {/* 3. EXCEL SHEET TABS (Top Selection Bar) */}
        <div className="bg-slate-200/80 px-3 pt-2 flex items-center gap-1 border-b border-slate-300 shrink-0 overflow-x-auto">
          {/* TAB 1: Fabrication Details (Default Active) */}
          <button
            type="button"
            onClick={() => setActiveTab("fabrication")}
            className={`px-3.5 py-1.5 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border-t border-x ${
              activeTab === "fabrication"
                ? "bg-white text-emerald-950 border-slate-300 shadow-xs border-b-2 border-b-emerald-600 font-extrabold"
                : "bg-slate-100 hover:bg-slate-50 text-slate-600 border-transparent"
            }`}
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Fabrication Details</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
              {data.fabrication.length}
            </span>
          </button>

          {/* TAB 2: Material List */}
          <button
            type="button"
            onClick={() => setActiveTab("material")}
            className={`px-3.5 py-1.5 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border-t border-x ${
              activeTab === "material"
                ? "bg-white text-blue-950 border-slate-300 shadow-xs border-b-2 border-b-blue-600 font-extrabold"
                : "bg-slate-100 hover:bg-slate-50 text-slate-600 border-transparent"
            }`}
          >
            <span className="size-2 rounded-full bg-blue-500" />
            <span>Material List</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
              {data.materials.length}
            </span>
          </button>

          {/* TAB 3: Tools Required */}
          <button
            type="button"
            onClick={() => setActiveTab("tools")}
            className={`px-3.5 py-1.5 rounded-t-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border-t border-x ${
              activeTab === "tools"
                ? "bg-white text-amber-950 border-slate-300 shadow-xs border-b-2 border-b-amber-500 font-extrabold"
                : "bg-slate-100 hover:bg-slate-50 text-slate-600 border-transparent"
            }`}
          >
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Tools Required</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
              {data.tools.length}
            </span>
          </button>

          {/* TAB 4: View All 3 Side-by-Side */}
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-t-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border-t border-x ml-auto ${
              activeTab === "all"
                ? "bg-white text-slate-900 border-slate-300 shadow-xs font-bold"
                : "bg-slate-100 hover:bg-slate-50 text-slate-500 border-transparent"
            }`}
            title="View all 3 sheets side-by-side"
          >
            <Columns className="size-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>

        {/* 4. MAIN WORKSHEET GRID CONTENT */}
        <div className="flex-1 overflow-auto bg-slate-50 p-3">
          {/* TAB 1: FABRICATION DETAILS TABLE (Exact design from user image) */}
          {(activeTab === "fabrication" || activeTab === "all") && (
            <div className={`mb-6 bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden ${
              activeTab === "all" ? "w-full" : "max-w-5xl mx-auto"
            }`}>
              {/* Green Title Banner (Exact like image 2) */}
              <div className="bg-[#D6F5DE] border-b border-emerald-200 px-4 py-2 flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#14532D] tracking-wide">
                  Fabrication Details
                </h4>
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <span>{data.fabrication.filter((r) => r.item.trim()).length} Items active</span>
                  <button
                    type="button"
                    onClick={addFabricationRow}
                    className="px-2 py-0.5 bg-white/80 hover:bg-white text-emerald-900 border border-emerald-300 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>Row</span>
                  </button>
                </div>
              </div>

              {/* Editable Excel Grid */}
              <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                <table className="w-full border-collapse text-xs text-slate-800">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 font-bold text-slate-700 select-none shadow-2xs">
                    <tr>
                      <th className="w-10 py-1.5 px-2 text-center border-r border-slate-300 bg-slate-200/70">#</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300 min-w-[280px]">
                        Items to be fabricated
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 min-w-[120px]">
                        Qty needed
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 min-w-[140px]">
                        Status
                      </th>
                      <th className="py-2 px-3 text-left border-r border-slate-300 min-w-[220px]">
                        Remark
                      </th>
                      <th className="w-10 py-2 px-1 text-center bg-slate-100">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fabrication.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="hover:bg-emerald-50/40 transition-colors border-b border-slate-200 group/row"
                      >
                        {/* Row Number */}
                        <td className="py-1 px-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200 bg-slate-50 select-none">
                          {idx + 1}
                        </td>

                        {/* Items to be fabricated */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`A${idx + 1}`);
                            setActiveCellValue(row.item);
                          }}
                        >
                          <input
                            type="text"
                            value={row.item}
                            onChange={(e) => updateFabricationCell(row.id, "item", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`A${idx + 1}`);
                              setActiveCellValue(row.item);
                            }}
                            placeholder="Type item description..."
                            className="w-full px-2.5 py-1.5 font-medium text-slate-800 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Qty needed */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`B${idx + 1}`);
                            setActiveCellValue(row.qty);
                          }}
                        >
                          <input
                            type="text"
                            value={row.qty}
                            onChange={(e) => updateFabricationCell(row.id, "qty", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`B${idx + 1}`);
                              setActiveCellValue(row.qty);
                            }}
                            placeholder="e.g. 24 Nos"
                            className="w-full px-2 py-1.5 text-center font-semibold text-slate-800 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Status */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`C${idx + 1}`);
                            setActiveCellValue(row.status);
                          }}
                        >
                          <input
                            type="text"
                            value={row.status}
                            onChange={(e) => updateFabricationCell(row.id, "status", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`C${idx + 1}`);
                              setActiveCellValue(row.status);
                            }}
                            placeholder="Done / WIP / Pending"
                            className="w-full px-2 py-1.5 text-center font-bold text-slate-800 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Remark */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`D${idx + 1}`);
                            setActiveCellValue(row.remark);
                          }}
                        >
                          <input
                            type="text"
                            value={row.remark}
                            onChange={(e) => updateFabricationCell(row.id, "remark", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`D${idx + 1}`);
                              setActiveCellValue(row.remark);
                            }}
                            placeholder="Remarks / notes..."
                            className="w-full px-2.5 py-1.5 text-slate-700 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Delete Row button */}
                        <td className="py-1 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => deleteFabricationRow(row.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded opacity-30 group-hover/row:opacity-100 transition-opacity cursor-pointer"
                            title="Delete this row"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MATERIAL LIST TABLE (Exact design from user image 1) */}
          {(activeTab === "material" || activeTab === "all") && (
            <div className={`mb-6 bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden ${
              activeTab === "all" ? "w-full" : "max-w-5xl mx-auto"
            }`}>
              {/* Blue Title Banner (Exact like image 1) */}
              <div className="bg-[#DCEAF7] border-b border-blue-200 px-4 py-2 flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#1E3A8A] tracking-wide">
                  Material List
                </h4>
                <div className="flex items-center gap-2 text-xs text-blue-800 font-medium">
                  <span>{data.materials.filter((r) => r.description.trim()).length} Items listed</span>
                  <button
                    type="button"
                    onClick={addMaterialRow}
                    className="px-2 py-0.5 bg-white/80 hover:bg-white text-blue-900 border border-blue-300 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>Row</span>
                  </button>
                </div>
              </div>

              {/* Editable Material Grid */}
              <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                <table className="w-full border-collapse text-xs text-slate-800">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 font-bold text-slate-700 select-none shadow-2xs">
                    <tr>
                      <th className="w-16 py-2 px-2 text-center border-r border-slate-300 min-w-[60px]">
                        Item no
                      </th>
                      <th className="py-2 px-3 text-left border-r border-slate-300 min-w-[260px]">
                        Description
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 min-w-[160px]">
                        Required As per Drawing
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 min-w-[140px]">
                        Material Arrived
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 min-w-[140px]">
                        Pending Material
                      </th>
                      <th className="w-10 py-2 px-1 text-center bg-slate-100">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.materials.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50/40 transition-colors border-b border-slate-200 group/row"
                      >
                        {/* Item No */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`A${idx + 1}`);
                            setActiveCellValue(String(row.itemNo));
                          }}
                        >
                          <input
                            type="text"
                            value={row.itemNo}
                            onChange={(e) => updateMaterialCell(row.id, "itemNo", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`A${idx + 1}`);
                              setActiveCellValue(String(row.itemNo));
                            }}
                            className="w-full px-2 py-1.5 text-center font-bold text-slate-700 bg-transparent outline-none focus:bg-white"
                          />
                        </td>

                        {/* Description */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`B${idx + 1}`);
                            setActiveCellValue(row.description);
                          }}
                        >
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => updateMaterialCell(row.id, "description", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`B${idx + 1}`);
                              setActiveCellValue(row.description);
                            }}
                            placeholder="Material grade / section..."
                            className="w-full px-2.5 py-1.5 font-medium text-slate-800 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Required As per Drawing */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`C${idx + 1}`);
                            setActiveCellValue(row.required);
                          }}
                        >
                          <input
                            type="text"
                            value={row.required}
                            onChange={(e) => updateMaterialCell(row.id, "required", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`C${idx + 1}`);
                              setActiveCellValue(row.required);
                            }}
                            placeholder="e.g. 24.5 MT"
                            className="w-full px-2 py-1.5 text-center font-semibold text-slate-800 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Material Arrived */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`D${idx + 1}`);
                            setActiveCellValue(row.arrived);
                          }}
                        >
                          <input
                            type="text"
                            value={row.arrived}
                            onChange={(e) => updateMaterialCell(row.id, "arrived", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`D${idx + 1}`);
                              setActiveCellValue(row.arrived);
                            }}
                            placeholder="e.g. 24.5 MT"
                            className="w-full px-2 py-1.5 text-center font-semibold text-emerald-700 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Pending Material */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`E${idx + 1}`);
                            setActiveCellValue(row.pending);
                          }}
                        >
                          <input
                            type="text"
                            value={row.pending}
                            onChange={(e) => updateMaterialCell(row.id, "pending", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`E${idx + 1}`);
                              setActiveCellValue(row.pending);
                            }}
                            placeholder="e.g. 0 MT"
                            className="w-full px-2 py-1.5 text-center font-bold text-rose-700 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Delete Row button */}
                        <td className="py-1 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => deleteMaterialRow(row.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded opacity-30 group-hover/row:opacity-100 transition-opacity cursor-pointer"
                            title="Delete this row"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TOOLS REQUIRED TABLE (Exact design from user image 3) */}
          {(activeTab === "tools" || activeTab === "all") && (
            <div className={`mb-6 bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden ${
              activeTab === "all" ? "w-full" : "max-w-2xl mx-auto"
            }`}>
              {/* Amber Title Banner (Exact like image 3) */}
              <div className="bg-[#FEF3C7] border-b border-amber-200 px-4 py-2 flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#92400E] tracking-wide">
                  Tools Required
                </h4>
                <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
                  <span>{data.tools.filter((r) => r.itemName.trim()).length} Tools active</span>
                  <button
                    type="button"
                    onClick={addToolRow}
                    className="px-2 py-0.5 bg-white/80 hover:bg-white text-amber-900 border border-amber-300 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>Row</span>
                  </button>
                </div>
              </div>

              {/* Editable Tools Grid */}
              <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                <table className="w-full border-collapse text-xs text-slate-800">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 font-bold text-slate-700 select-none shadow-2xs">
                    <tr>
                      <th className="w-10 py-1.5 px-2 text-center border-r border-slate-300 bg-slate-200/70">#</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300 min-w-[260px]">
                        Item Name
                      </th>
                      <th className="py-2 px-3 text-center border-r border-slate-300 min-w-[140px]">
                        Status
                      </th>
                      <th className="w-10 py-2 px-1 text-center bg-slate-100">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tools.map((row, idx) => (
                      <tr
                        key={row.id}
                        className="hover:bg-amber-50/40 transition-colors border-b border-slate-200 group/row"
                      >
                        {/* Row Number */}
                        <td className="py-1 px-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200 bg-slate-50 select-none">
                          {idx + 1}
                        </td>

                        {/* Item Name */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-amber-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`A${idx + 1}`);
                            setActiveCellValue(row.itemName);
                          }}
                        >
                          <input
                            type="text"
                            value={row.itemName}
                            onChange={(e) => updateToolCell(row.id, "itemName", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`A${idx + 1}`);
                              setActiveCellValue(row.itemName);
                            }}
                            placeholder="Tool / equipment name..."
                            className="w-full px-2.5 py-1.5 font-medium text-slate-800 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Status */}
                        <td
                          className="p-0 border-r border-slate-200 focus-within:ring-2 focus-within:ring-amber-500 focus-within:z-10"
                          onClick={() => {
                            setActiveCellCoord(`B${idx + 1}`);
                            setActiveCellValue(row.status);
                          }}
                        >
                          <input
                            type="text"
                            value={row.status}
                            onChange={(e) => updateToolCell(row.id, "status", e.target.value)}
                            onFocus={() => {
                              setActiveCellCoord(`B${idx + 1}`);
                              setActiveCellValue(row.status);
                            }}
                            placeholder="Available / Assigned"
                            className="w-full px-2 py-1.5 text-center font-bold text-slate-800 bg-transparent outline-none focus:bg-white placeholder:text-slate-300"
                          />
                        </td>

                        {/* Delete Row button */}
                        <td className="py-1 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => deleteToolRow(row.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded opacity-30 group-hover/row:opacity-100 transition-opacity cursor-pointer"
                            title="Delete this row"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 5. BOTTOM STATUS & WORKSHEET BAR (Classic Excel bottom tab bar) */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              Ready • 100% Editable Cells
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <Check className="size-3.5" />
              <span>Auto-saved to device</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#0F2642] hover:bg-[#153457] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

