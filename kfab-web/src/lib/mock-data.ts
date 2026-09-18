export interface WorkerRecord {
  id: string;
  name: string;
  designation: string;
  dept: string;
  shift: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
  time: string;
  supervisor: string;
}

export interface StockMaterial {
  code: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  inward: string;
  outward: string;
  usage: string;
  current: string;
  min: string;
  isLow: boolean;
}

export interface SupplyTransaction {
  id: string;
  type: "INWARD" | "OUTWARD" | "USAGE";
  date: string;
  ref: string;
  entity: string;
  material: string;
  qty: string;
  vehicle: string;
  status: string;
}

export const INITIAL_WORKERS: WorkerRecord[] = [
  { id: "KF-0101", name: "Ramesh Sharma", designation: "Welder Grade 1", dept: "Fabrication", shift: "General (08:00)", status: "PRESENT", time: "08:04 AM", supervisor: "Ajay Verma" },
  { id: "KF-0102", name: "Sunil Kumar", designation: "Fitter Senior", dept: "Assembly Bay", shift: "General (08:00)", status: "PRESENT", time: "08:12 AM", supervisor: "Ajay Verma" },
  { id: "KF-0103", name: "Mahesh Yadav", designation: "CNC Operator", dept: "Machine Shop", shift: "General (08:00)", status: "PRESENT", time: "07:55 AM", supervisor: "Prakash Patel" },
  { id: "KF-0104", name: "Vikram Singh", designation: "Welder Grade 2", dept: "Fabrication", shift: "General (08:00)", status: "ABSENT", time: "-", supervisor: "Ajay Verma" },
  { id: "KF-0105", name: "Deepak Rawat", designation: "Grinder & Helper", dept: "Finishing Bay", shift: "General (08:00)", status: "PRESENT", time: "08:00 AM", supervisor: "Prakash Patel" },
  { id: "KF-0106", name: "Amit Tiwari", designation: "Rigger", dept: "Yard & Logistics", shift: "General (08:00)", status: "PRESENT", time: "08:18 AM", supervisor: "Ajay Verma" },
  { id: "KF-0107", name: "Santosh Naik", designation: "Gas Cutter", dept: "Fabrication", shift: "General (08:00)", status: "PRESENT", time: "08:05 AM", supervisor: "Ajay Verma" },
];

export const INITIAL_STOCK: StockMaterial[] = [
  { code: "STL-PL-12", name: "MS Plate 12mm IS 2062", category: "Raw Steel", spec: "E250 Gr A, 2500x12000", unit: "TON", inward: "42.50", outward: "14.20", usage: "24.80", current: "3.50", min: "5.00", isLow: true },
  { code: "STL-PL-20", name: "MS Plate 20mm IS 2062", category: "Raw Steel", spec: "E250 Gr BR, 2500x6000", unit: "TON", inward: "68.00", outward: "0.00", usage: "38.50", current: "29.50", min: "10.00", isLow: false },
  { code: "STL-BEAM-250", name: "ISMB 250 Heavy Beam", category: "Structural", spec: "Standard 12m length", unit: "TON", inward: "35.00", outward: "8.50", usage: "16.00", current: "10.50", min: "8.00", isLow: false },
  { code: "GAS-ARG-D", name: "Argon Shielding Gas Cyl", category: "Gases", spec: "High Purity 7m3 D-Type", unit: "NOS", inward: "40", outward: "0", usage: "36", current: "4", min: "8", isLow: true },
  { code: "WLD-E7018", name: "Low Hydrogen Electrode 7018", category: "Consumables", spec: "4.00mm x 450mm", unit: "BOX", inward: "120", outward: "0", usage: "64", current: "56", min: "25", isLow: false },
  { code: "BLT-M20-75", name: "HT Structural Bolts M20x75", category: "Hardware", spec: "Grade 8.8 with Nut & Washer", unit: "NOS", inward: "1200", outward: "200", usage: "450", current: "550", min: "200", isLow: false },
];

export const INITIAL_TRANSACTIONS: SupplyTransaction[] = [
  { id: "INW-2026-084", type: "INWARD", date: "18 Sep 2026", ref: "INV-9921 / CH-402", entity: "Tata Steel BSL Ltd", material: "MS Plate 20mm IS 2062", qty: "24.50 TON", vehicle: "MH-12-RN-8812", status: "RECEIVED" },
  { id: "INW-2026-083", type: "INWARD", date: "18 Sep 2026", ref: "CH-1102", entity: "Air Liquide India", material: "Argon Shielding Gas", qty: "15 NOS", vehicle: "MH-14-AZ-4501", status: "RECEIVED" },
  { id: "OUT-2026-041", type: "OUTWARD", date: "17 Sep 2026", ref: "GP-2026-104", entity: "Site B - Bridge Project", material: "ISMB 250 Heavy Beam", qty: "8.50 TON", vehicle: "MH-04-E-9021", status: "DISPATCHED" },
  { id: "USG-2026-112", type: "USAGE", date: "18 Sep 2026", ref: "WO-GIRDER-4", entity: "Bay 2 (Fabrication)", material: "MS Plate 12mm IS 2062", qty: "4.20 TON", vehicle: "-", status: "CONSUMED" },
];
