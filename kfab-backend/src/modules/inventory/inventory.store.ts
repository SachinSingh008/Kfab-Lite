// ============================================================================
// KFAB360 — Inventory Memory Store & Normalized DTO Definitions
// Resilient In-Memory State Store with Seed Data for Multi-Tenant Plants
// ============================================================================

import { InventoryCategory } from './inventory.schema.js';

export interface InventoryItemDTO {
  id: string;
  companyId: string;
  itemCode: string;
  itemName: string;
  category: InventoryCategory;
  subcategory: string | null;
  description: string | null;
  brand: string | null;
  model: string | null;
  unit: string;
  itemType: string;
  isReturnable: boolean;
  currentQuantity: number;
  availableQuantity: number;
  issuedQuantity: number;
  maintenanceQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;
  minimumStock: number;
  maximumStock: number | null;
  stockDeficit: number;
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NORMAL' | 'OVERSTOCK';
  purchasePrice: number;
  currentValue: number;
  supplier: string | null;
  purchaseDate: string | null;
  warranty: string | null;
  location: string | null;
  storageLocation: string | null;
  condition: string;
  status: 'ACTIVE' | 'INACTIVE' | 'RETIRED';
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionDTO {
  id: string;
  companyId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  category?: string;
  transactionType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  employeeId: string | null;
  employeeName?: string | null;
  employeeCode?: string | null;
  department: string | null;
  referenceId: string | null;
  conditionState: string | null;
  transactionDate: string;
  remarks: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface InventoryIssueDTO {
  id: string;
  companyId: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  category?: string;
  employeeId: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  quantity: number;
  returnedQuantity: number;
  outstandingQuantity: number;
  issuedBy: string | null;
  issuerName: string | null;
  issuedAt: string;
  issueDate: string;
  expectedReturnDate: string | null;
  returnedAt: string | null;
  conditionAtIssue: string;
  conditionAtReturn: string | null;
  status: 'ISSUED' | 'PARTIALLY_RETURNED' | 'RETURNED' | 'DAMAGED' | 'LOST';
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDTO {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeDTO {
  id: string;
  companyId: string;
  employeeCode: string;
  name: string;
  department: string;
  designation: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

// ------------------------------------------------------------------------------
// Default Plant & Personnel Data
// ------------------------------------------------------------------------------
export const DEFAULT_COMPANY: CompanyDTO = {
  id: 'c0000000-0000-0000-0000-000000000001',
  name: 'KFab Infra Project Pvt Ltd',
  code: 'KFAB-INFR',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const DEFAULT_EMPLOYEES: EmployeeDTO[] = [
  { id: 'e0000000-0000-0000-0000-000000000001', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-101', name: 'Rajesh Kumar', department: 'Fabrication', designation: 'Senior Fitter', phone: '+91 98230 11001', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000002', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-102', name: 'Amit Sharma', department: 'Welding', designation: '6G Coded Welder', phone: '+91 98230 11002', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000003', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-103', name: 'Suresh Patil', department: 'Cutting', designation: 'CNC Plasma Operator', phone: '+91 98230 11003', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000004', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-104', name: 'Ramesh Jadhav', department: 'Erection', designation: 'Rigger Foreman', phone: '+91 98230 11004', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000005', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-105', name: 'Vikram Shinde', department: 'Welding', designation: 'MIG Welder', phone: '+91 98230 11005', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000006', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-106', name: 'Santosh Pawar', department: 'Quality', designation: 'NDT Inspector', phone: '+91 98230 11006', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000007', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-107', name: 'Ganesh More', department: 'Fabrication', designation: 'Fabricator Bay 1', phone: '+91 98230 11007', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000008', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-108', name: 'Pradeep Kulkarni', department: 'Store', designation: 'Material Handler', phone: '+91 98230 11008', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000009', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-109', name: 'Anil Deshmukh', department: 'Cutting', designation: 'Gas Cutter', phone: '+91 98230 11009', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000010', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-110', name: 'Mahesh Chavan', department: 'Welding', designation: 'TIG Welder', phone: '+91 98230 11010', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000011', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-111', name: 'Sachin Gaikwad', department: 'Assembly', designation: 'Fitter Bay 2', phone: '+91 98230 11011', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e0000000-0000-0000-0000-000000000012', companyId: 'c0000000-0000-0000-0000-000000000001', employeeCode: 'KF-112', name: 'Deepak Salunkhe', department: 'Maintenance', designation: 'Shop Electrician', phone: '+91 98230 11012', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
];

export let memoryCompanies: CompanyDTO[] = [{ ...DEFAULT_COMPANY }];
export let memoryEmployees: EmployeeDTO[] = [...DEFAULT_EMPLOYEES];

export let memoryItems: InventoryItemDTO[] = [
  // Consumables & Tackles
  {
    id: 'i0000000-0000-0000-0000-000000000001',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'CON-WEL-001',
    itemName: 'Welding Rod 6013 (4.0mm)',
    category: 'CONSUMABLES_TACKLES',
    subcategory: 'Welding Consumables',
    description: 'Heavy fabrication rutile welding electrode',
    brand: 'ESAB',
    model: '6013',
    unit: 'Kg',
    itemType: 'CONSUMABLE',
    isReturnable: false,
    currentQuantity: 120.0,
    availableQuantity: 120.0,
    issuedQuantity: 0.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 50.0,
    maximumStock: 200.0,
    stockDeficit: 0.0,
    stockStatus: 'NORMAL',
    purchasePrice: 220.0,
    currentValue: 26400.0,
    supplier: 'ESAB India Ltd',
    purchaseDate: '2026-09-15',
    warranty: null,
    location: 'Main Store Bay 1',
    storageLocation: 'Rack W-01',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Approved AWS A5.1 specification',
    createdAt: '2026-09-15T08:00:00.000Z',
    updatedAt: '2026-09-15T08:00:00.000Z',
  },
  {
    id: 'i0000000-0000-0000-0000-000000000002',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'CON-CUT-001',
    itemName: 'Cutting Disc 4 inch',
    category: 'CONSUMABLES_TACKLES',
    subcategory: 'Cutting Consumables',
    description: 'Inox thin cutting disc for structural steel',
    brand: 'Bosch',
    model: 'Standard Inox',
    unit: 'Nos',
    itemType: 'CONSUMABLE',
    isReturnable: false,
    currentQuantity: 18.0,
    availableQuantity: 18.0,
    issuedQuantity: 0.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 30.0,
    maximumStock: 150.0,
    stockDeficit: 12.0,
    stockStatus: 'LOW_STOCK',
    purchasePrice: 85.0,
    currentValue: 1530.0,
    supplier: 'Industrial Hardware Depot',
    purchaseDate: '2026-09-20',
    warranty: null,
    location: 'Main Store Bay 1',
    storageLocation: 'Shelf C-04',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Reorder required for shop floor',
    createdAt: '2026-09-20T08:00:00.000Z',
    updatedAt: '2026-09-20T08:00:00.000Z',
  },
  {
    id: 'i0000000-0000-0000-0000-000000000003',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'CON-GRN-001',
    itemName: 'Grinding Disc 7 inch',
    category: 'CONSUMABLES_TACKLES',
    subcategory: 'Grinding Consumables',
    description: 'Reinforced depressed center grinding wheel',
    brand: 'Makita',
    model: 'A-80656',
    unit: 'Nos',
    itemType: 'CONSUMABLE',
    isReturnable: false,
    currentQuantity: 7.0,
    availableQuantity: 7.0,
    issuedQuantity: 0.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 20.0,
    maximumStock: 80.0,
    stockDeficit: 13.0,
    stockStatus: 'LOW_STOCK',
    purchasePrice: 120.0,
    currentValue: 840.0,
    supplier: 'Industrial Hardware Depot',
    purchaseDate: '2026-09-18',
    warranty: null,
    location: 'Main Store Bay 1',
    storageLocation: 'Shelf G-02',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Urgent reorder needed',
    createdAt: '2026-09-18T08:00:00.000Z',
    updatedAt: '2026-09-18T08:00:00.000Z',
  },
  {
    id: 'i0000000-0000-0000-0000-000000000004',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'CON-TAC-001',
    itemName: 'Bow Shackle 10 Ton',
    category: 'CONSUMABLES_TACKLES',
    subcategory: 'Lifting Tackles',
    description: 'Drop forged alloy steel lifting shackle with safety pin',
    brand: 'Crosby',
    model: 'G-2130',
    unit: 'Nos',
    itemType: 'RETURNABLE',
    isReturnable: true,
    currentQuantity: 25.0,
    availableQuantity: 25.0,
    issuedQuantity: 0.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 10.0,
    maximumStock: 40.0,
    stockDeficit: 0.0,
    stockStatus: 'NORMAL',
    purchasePrice: 950.0,
    currentValue: 23750.0,
    supplier: 'Crosby Heavy Lifting Co',
    purchaseDate: '2026-08-10',
    warranty: '1 Year Proof Load Certified',
    location: 'Rigging Store',
    storageLocation: 'Bin L-01',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Proof load test certified by third-party inspection',
    createdAt: '2026-08-10T08:00:00.000Z',
    updatedAt: '2026-08-10T08:00:00.000Z',
  },

  // Machines & Tools
  {
    id: 'i0000000-0000-0000-0000-000000000007',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'MAC-WLD-001',
    itemName: 'Inverter Welding Machine 400A',
    category: 'MACHINES_TOOLS',
    subcategory: 'Welding Machines',
    description: '400 Amp 3-Phase IGBT inverter arc welding power source',
    brand: 'ESAB',
    model: 'Buddy Arc 400i',
    unit: 'Nos',
    itemType: 'MACHINE',
    isReturnable: true,
    currentQuantity: 5.0,
    availableQuantity: 3.0,
    issuedQuantity: 2.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 2.0,
    maximumStock: 10.0,
    stockDeficit: 0.0,
    stockStatus: 'NORMAL',
    purchasePrice: 48000.0,
    currentValue: 240000.0,
    supplier: 'ESAB India Ltd',
    purchaseDate: '2026-06-01',
    warranty: '2 Years Manufacturer Warranty',
    location: 'Welding Bay 2',
    storageLocation: 'Machinery Depot Bay 2',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Regular 6-month calibration certified',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'i0000000-0000-0000-0000-000000000008',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'TOOL-GRN-001',
    itemName: 'Heavy Duty Angle Grinder 7 inch',
    category: 'MACHINES_TOOLS',
    subcategory: 'Power Tools',
    description: '2200W professional metal fabrication angle grinder',
    brand: 'Bosch',
    model: 'GWS 2200-180',
    unit: 'Nos',
    itemType: 'TOOL',
    isReturnable: true,
    currentQuantity: 12.0,
    availableQuantity: 8.0,
    issuedQuantity: 4.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 4.0,
    maximumStock: 20.0,
    stockDeficit: 0.0,
    stockStatus: 'NORMAL',
    purchasePrice: 6800.0,
    currentValue: 81600.0,
    supplier: 'Industrial Hardware Depot',
    purchaseDate: '2026-07-15',
    warranty: '1 Year Warranty',
    location: 'Tool Room',
    storageLocation: 'Rack T-02',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Assigned to fabrication shop bay fitters',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-15T08:00:00.000Z',
  },
  {
    id: 'i0000000-0000-0000-0000-000000000009',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'TOOL-TRQ-001',
    itemName: 'Torque Wrench 100-500 Nm',
    category: 'MACHINES_TOOLS',
    subcategory: 'Measuring Tools',
    description: 'Calibrated mechanical click-type torque wrench for structural bolts',
    brand: 'Stanley',
    model: 'STMT73591-8',
    unit: 'Nos',
    itemType: 'TOOL',
    isReturnable: true,
    currentQuantity: 4.0,
    availableQuantity: 4.0,
    issuedQuantity: 0.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 2.0,
    maximumStock: 6.0,
    stockDeficit: 0.0,
    stockStatus: 'NORMAL',
    purchasePrice: 14500.0,
    currentValue: 58000.0,
    supplier: 'Precision Tools Corporation',
    purchaseDate: '2026-05-10',
    warranty: 'NABL Calibration Certificate Included',
    location: 'Tool Crib A',
    storageLocation: 'Precision Cabinet 1',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Calibrated for bridge girder torque checks',
    createdAt: '2026-05-10T08:00:00.000Z',
    updatedAt: '2026-05-10T08:00:00.000Z',
  },

  // Clothes & Safety
  {
    id: 'i0000000-0000-0000-0000-000000000011',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'CLO-GLO-001',
    itemName: 'Split Leather Heavy Welding Gloves',
    category: 'CLOTHES_SAFETY',
    subcategory: 'Hand Protection',
    description: '16 inch cow split leather heat and spark resistant welding gloves',
    brand: '3M',
    model: 'W-Series',
    unit: 'Pair',
    itemType: 'CLOTHING',
    isReturnable: false,
    currentQuantity: 120.0,
    availableQuantity: 120.0,
    issuedQuantity: 0.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 40.0,
    maximumStock: 250.0,
    stockDeficit: 0.0,
    stockStatus: 'NORMAL',
    purchasePrice: 120.0,
    currentValue: 14400.0,
    supplier: 'Safety First PPE Suppliers',
    purchaseDate: '2026-09-01',
    warranty: null,
    location: 'Safety Store Rack 1',
    storageLocation: 'Bin PPE-01',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Standard issue PPE for yard welders and fitters',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'i0000000-0000-0000-0000-000000000012',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'CLO-APR-001',
    itemName: 'Leather Fabrication Apron',
    category: 'CLOTHES_SAFETY',
    subcategory: 'Body Protection',
    description: 'Heavy duty split leather welding and chipping protection apron',
    brand: 'Karam',
    model: 'AP-01',
    unit: 'Nos',
    itemType: 'CLOTHING',
    isReturnable: true,
    currentQuantity: 15.0,
    availableQuantity: 15.0,
    issuedQuantity: 0.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 20.0,
    maximumStock: 50.0,
    stockDeficit: 5.0,
    stockStatus: 'LOW_STOCK',
    purchasePrice: 450.0,
    currentValue: 6750.0,
    supplier: 'Safety First PPE Suppliers',
    purchaseDate: '2026-08-25',
    warranty: null,
    location: 'Safety Store Rack 2',
    storageLocation: 'Bin PPE-02',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Deficit of 5 units. Reorder recommended.',
    createdAt: '2026-08-25T08:00:00.000Z',
    updatedAt: '2026-08-25T08:00:00.000Z',
  },
  {
    id: 'i0000000-0000-0000-0000-000000000013',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemCode: 'CLO-HLM-001',
    itemName: 'Industrial Safety Helmet (IS:2925)',
    category: 'CLOTHES_SAFETY',
    subcategory: 'Head Protection',
    description: 'High density polymer safety helmet with 4-point ratchet suspension',
    brand: 'Karam',
    model: 'Sheltek-101',
    unit: 'Nos',
    itemType: 'SAFETY_ITEM',
    isReturnable: true,
    currentQuantity: 35.0,
    availableQuantity: 35.0,
    issuedQuantity: 0.0,
    maintenanceQuantity: 0.0,
    damagedQuantity: 0.0,
    lostQuantity: 0.0,
    minimumStock: 20.0,
    maximumStock: 100.0,
    stockDeficit: 0.0,
    stockStatus: 'NORMAL',
    purchasePrice: 350.0,
    currentValue: 12250.0,
    supplier: 'Safety First PPE Suppliers',
    purchaseDate: '2026-08-15',
    warranty: 'ISI Marked',
    location: 'Safety Store Rack 3',
    storageLocation: 'Bin PPE-03',
    condition: 'GOOD',
    status: 'ACTIVE',
    remarks: 'Mandatory PPE for all site personnel',
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-08-15T08:00:00.000Z',
  },
];

export let memoryTransactions: InventoryTransactionDTO[] = [
  {
    id: 't0000000-0000-0000-0000-000000000001',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemId: 'i0000000-0000-0000-0000-000000000001',
    itemCode: 'CON-WEL-001',
    itemName: 'Welding Rod 6013 (4.0mm)',
    category: 'CONSUMABLES_TACKLES',
    transactionType: 'PURCHASE',
    quantity: 150.0,
    unitPrice: 220.0,
    totalPrice: 33000.0,
    employeeId: null,
    department: 'Store',
    referenceId: 'PO-2026-09-001',
    conditionState: 'Good',
    transactionDate: '2026-09-15',
    remarks: 'Initial project inventory stock batch',
    createdBy: '00000000-0000-0000-0000-000000000001',
    createdAt: '2026-09-15T08:00:00.000Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000002',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemId: 'i0000000-0000-0000-0000-000000000001',
    itemCode: 'CON-WEL-001',
    itemName: 'Welding Rod 6013 (4.0mm)',
    category: 'CONSUMABLES_TACKLES',
    transactionType: 'ISSUE',
    quantity: 30.0,
    unitPrice: 220.0,
    totalPrice: 6600.0,
    employeeId: 'e0000000-0000-0000-0000-000000000002',
    employeeName: 'Amit Sharma',
    employeeCode: 'KF-102',
    department: 'Welding',
    referenceId: null,
    conditionState: 'Good',
    transactionDate: '2026-10-01',
    remarks: 'Bay 2 Girder Welding Consumption',
    createdBy: '00000000-0000-0000-0000-000000000001',
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000003',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemId: 'i0000000-0000-0000-0000-000000000008',
    itemCode: 'TOOL-GRN-001',
    itemName: 'Heavy Duty Angle Grinder 7 inch',
    category: 'MACHINES_TOOLS',
    transactionType: 'ISSUE',
    quantity: 1.0,
    unitPrice: 6800.0,
    totalPrice: 6800.0,
    employeeId: 'e0000000-0000-0000-0000-000000000001',
    employeeName: 'Rajesh Kumar',
    employeeCode: 'KF-101',
    department: 'Fabrication',
    referenceId: null,
    conditionState: 'Good',
    transactionDate: '2026-10-01',
    remarks: 'Fit-up bevel grinding',
    createdBy: '00000000-0000-0000-0000-000000000001',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
];

export let memoryIssues: InventoryIssueDTO[] = [
  {
    id: 'is000000-0000-0000-0000-000000000001',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemId: 'i0000000-0000-0000-0000-000000000008',
    itemCode: 'TOOL-GRN-001',
    itemName: 'Heavy Duty Angle Grinder 7 inch',
    category: 'MACHINES_TOOLS',
    employeeId: 'e0000000-0000-0000-0000-000000000001',
    employeeName: 'Rajesh Kumar',
    employeeCode: 'KF-101',
    department: 'Fabrication',
    quantity: 1.0,
    returnedQuantity: 0.0,
    outstandingQuantity: 1.0,
    issuedBy: '00000000-0000-0000-0000-000000000001',
    issuerName: 'Supervisor (Plant Yard)',
    issuedAt: '2026-10-01T10:00:00.000Z',
    issueDate: '2026-10-01',
    expectedReturnDate: '2026-10-07',
    returnedAt: null,
    conditionAtIssue: 'Good',
    conditionAtReturn: null,
    status: 'ISSUED',
    remarks: 'Structural box girder joint fit-up bevel grinding',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'is000000-0000-0000-0000-000000000002',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemId: 'i0000000-0000-0000-0000-000000000007',
    itemCode: 'MAC-WLD-001',
    itemName: 'Inverter Welding Machine 400A',
    category: 'MACHINES_TOOLS',
    employeeId: 'e0000000-0000-0000-0000-000000000002',
    employeeName: 'Amit Sharma',
    employeeCode: 'KF-102',
    department: 'Welding',
    quantity: 1.0,
    returnedQuantity: 0.0,
    outstandingQuantity: 1.0,
    issuedBy: '00000000-0000-0000-0000-000000000001',
    issuerName: 'Supervisor (Plant Yard)',
    issuedAt: '2026-10-02T08:30:00.000Z',
    issueDate: '2026-10-02',
    expectedReturnDate: '2026-10-08',
    returnedAt: null,
    conditionAtIssue: 'Good',
    conditionAtReturn: null,
    status: 'ISSUED',
    remarks: '6G pipe coupon test welding and flange tacking',
    createdAt: '2026-10-02T08:30:00.000Z',
    updatedAt: '2026-10-02T08:30:00.000Z',
  },
  {
    id: 'is000000-0000-0000-0000-000000000003',
    companyId: 'c0000000-0000-0000-0000-000000000001',
    itemId: 'i0000000-0000-0000-0000-000000000011',
    itemCode: 'CLO-GLO-001',
    itemName: 'Split Leather Heavy Welding Gloves',
    category: 'CLOTHES_SAFETY',
    employeeId: 'e0000000-0000-0000-0000-000000000001',
    employeeName: 'Rajesh Kumar',
    employeeCode: 'KF-101',
    department: 'Fabrication',
    quantity: 2.0,
    returnedQuantity: 0.0,
    outstandingQuantity: 2.0,
    issuedBy: '00000000-0000-0000-0000-000000000001',
    issuerName: 'Supervisor (Plant Yard)',
    issuedAt: '2026-10-03T09:15:00.000Z',
    issueDate: '2026-10-03',
    expectedReturnDate: null,
    returnedAt: null,
    conditionAtIssue: 'Good',
    conditionAtReturn: null,
    status: 'ISSUED',
    remarks: 'Routine bi-weekly PPE issue to Senior Fitter',
    createdAt: '2026-10-03T09:15:00.000Z',
    updatedAt: '2026-10-03T09:15:00.000Z',
  },
];
