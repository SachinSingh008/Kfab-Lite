-- ==============================================================================
-- Migration 008: Inventory & Material Management Module
-- Purpose: Create inventory_items, inventory_transactions, inventory_issues
--          with hardened RLS, indexes, constraints, audit-ready schema, and
--          least-privilege permissions catalog.
-- ==============================================================================

-- 1. Inventory Items Master Catalog Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('CONSUMABLES_TACKLES', 'MACHINES_TOOLS', 'CLOTHES_SAFETY')),
  subcategory text,
  description text,
  brand text,
  model text,
  unit text NOT NULL DEFAULT 'Nos',
  item_type text NOT NULL DEFAULT 'CONSUMABLE' CHECK (item_type IN ('CONSUMABLE', 'RETURNABLE', 'MACHINE', 'TOOL', 'CLOTHING', 'SAFETY_ITEM')),
  is_returnable boolean NOT NULL DEFAULT false,
  current_quantity numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (current_quantity >= 0.0),
  available_quantity numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (available_quantity >= 0.0),
  issued_quantity numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (issued_quantity >= 0.0),
  maintenance_quantity numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (maintenance_quantity >= 0.0),
  damaged_quantity numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (damaged_quantity >= 0.0),
  lost_quantity numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (lost_quantity >= 0.0),
  minimum_stock numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (minimum_stock >= 0.0),
  maximum_stock numeric(12,2) CHECK (maximum_stock IS NULL OR maximum_stock >= minimum_stock),
  purchase_price numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (purchase_price >= 0.0),
  current_value numeric(14,2) NOT NULL DEFAULT 0.0 CHECK (current_value >= 0.0),
  supplier text,
  purchase_date date,
  warranty text,
  location text,
  storage_location text,
  condition text NOT NULL DEFAULT 'GOOD' CHECK (condition IN ('GOOD', 'DAMAGED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED')),
  remarks text,
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_item_code UNIQUE (company_id, item_code)
);

-- 2. Inventory Stock Transactions Table (Immutable Financial & Stock Movement Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL CHECK (transaction_type IN ('OPENING', 'PURCHASE', 'ISSUE', 'RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGE', 'LOSS')),
  quantity numeric(12,2) NOT NULL CHECK (quantity > 0.0),
  unit_price numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (unit_price >= 0.0),
  total_price numeric(14,2) NOT NULL DEFAULT 0.0 CHECK (total_price >= 0.0),
  employee_id uuid REFERENCES public.employees(id) ON DELETE RESTRICT,
  department text,
  reference_id text,
  condition_state text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  remarks text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Inventory Employee Issues Table (Issue & Return Tracking & Accountability)
CREATE TABLE IF NOT EXISTS public.inventory_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  quantity numeric(12,2) NOT NULL CHECK (quantity > 0.0),
  returned_quantity numeric(12,2) NOT NULL DEFAULT 0.0 CHECK (returned_quantity >= 0.0),
  issued_by uuid REFERENCES public.profiles(id),
  issuer_name text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date date,
  returned_at timestamptz,
  condition_at_issue text NOT NULL DEFAULT 'Good',
  condition_at_return text,
  status text NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'PARTIALLY_RETURNED', 'RETURNED', 'DAMAGED', 'LOST')),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_return_not_exceed_qty CHECK (returned_quantity <= quantity)
);

-- 4. High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_company_code ON public.inventory_items(company_id, item_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(company_id, category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(company_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON public.inventory_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON public.inventory_transactions(item_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_company_date ON public.inventory_transactions(company_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_employee ON public.inventory_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_issues_company_employee ON public.inventory_issues(company_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_inventory_issues_status ON public.inventory_issues(status);
CREATE INDEX IF NOT EXISTS idx_inventory_issues_item ON public.inventory_issues(item_id);

-- 5. Auto-Update Timestamp Triggers
DROP TRIGGER IF EXISTS trg_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER trg_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS trg_inventory_issues_updated_at ON public.inventory_issues;
CREATE TRIGGER trg_inventory_issues_updated_at
  BEFORE UPDATE ON public.inventory_issues
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_issues ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: inventory_items
DROP POLICY IF EXISTS "inventory_items_select" ON public.inventory_items;
CREATE POLICY "inventory_items_select" ON public.inventory_items
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "inventory_items_modify" ON public.inventory_items;
CREATE POLICY "inventory_items_modify" ON public.inventory_items
  FOR ALL TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'ACCOUNT')
    )
  );

-- 8. RLS Policies: inventory_transactions
DROP POLICY IF EXISTS "inventory_transactions_select" ON public.inventory_transactions;
CREATE POLICY "inventory_transactions_select" ON public.inventory_transactions
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "inventory_transactions_insert" ON public.inventory_transactions;
CREATE POLICY "inventory_transactions_insert" ON public.inventory_transactions
  FOR INSERT TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'ACCOUNT')
    )
  );

-- 9. RLS Policies: inventory_issues
DROP POLICY IF EXISTS "inventory_issues_select" ON public.inventory_issues;
CREATE POLICY "inventory_issues_select" ON public.inventory_issues
  FOR SELECT TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "inventory_issues_modify" ON public.inventory_issues;
CREATE POLICY "inventory_issues_modify" ON public.inventory_issues
  FOR ALL TO authenticated, service_role
  USING (
    auth.role() = 'service_role'
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'SUPERVISOR')
    )
  );

-- 10. Seed Inventory Permissions Catalog
INSERT INTO public.permissions (code, module, description) VALUES
  ('inventory.view', 'INVENTORY', 'View inventory catalog, stock levels, item details, and historical registers'),
  ('inventory.create', 'INVENTORY', 'Add new inventory items, machines, power tools, or clothes/safety gear'),
  ('inventory.update', 'INVENTORY', 'Modify inventory specifications, min/max thresholds, and storage locations'),
  ('inventory.retire', 'INVENTORY', 'Retire/deactivate obsolete or broken items from active shop-floor inventory'),
  ('inventory.purchase', 'INVENTORY', 'Record purchase stock-in and vendor material receipts'),
  ('inventory.issue', 'INVENTORY', 'Issue consumables, machines, tools, or clothes/safety gear to workforce'),
  ('inventory.return', 'INVENTORY', 'Process returns of issued machines, tools, and check condition'),
  ('inventory.stock_adjust', 'INVENTORY', 'Perform verified physical stock verification adjustments'),
  ('inventory.view_analysis', 'INVENTORY', 'Access management cost, consumption, department, and usage analytics'),
  ('inventory.ledger.view', 'INVENTORY', 'View live Excel-like inventory workbook ledger'),
  ('inventory.ledger.update', 'INVENTORY', 'Edit and paste matrix cells in live inventory workbook')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

-- 11. Seed Permissions to Roles
-- SUPER_ADMIN: Holds all 11 inventory permissions
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('SUPER_ADMIN', 'inventory.view'),
  ('SUPER_ADMIN', 'inventory.create'),
  ('SUPER_ADMIN', 'inventory.update'),
  ('SUPER_ADMIN', 'inventory.retire'),
  ('SUPER_ADMIN', 'inventory.purchase'),
  ('SUPER_ADMIN', 'inventory.issue'),
  ('SUPER_ADMIN', 'inventory.return'),
  ('SUPER_ADMIN', 'inventory.stock_adjust'),
  ('SUPER_ADMIN', 'inventory.view_analysis'),
  ('SUPER_ADMIN', 'inventory.ledger.view'),
  ('SUPER_ADMIN', 'inventory.ledger.update')
ON CONFLICT (role, permission_code) DO NOTHING;

-- ADMIN: Holds all 11 inventory permissions for authorized company scope
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('ADMIN', 'inventory.view'),
  ('ADMIN', 'inventory.create'),
  ('ADMIN', 'inventory.update'),
  ('ADMIN', 'inventory.retire'),
  ('ADMIN', 'inventory.purchase'),
  ('ADMIN', 'inventory.issue'),
  ('ADMIN', 'inventory.return'),
  ('ADMIN', 'inventory.stock_adjust'),
  ('ADMIN', 'inventory.view_analysis'),
  ('ADMIN', 'inventory.ledger.view'),
  ('ADMIN', 'inventory.ledger.update')
ON CONFLICT (role, permission_code) DO NOTHING;

-- SUPERVISOR: Operational machine/tool addition, retirement, issuing & returns
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('SUPERVISOR', 'inventory.view'),
  ('SUPERVISOR', 'inventory.create'),
  ('SUPERVISOR', 'inventory.update'),
  ('SUPERVISOR', 'inventory.retire'),
  ('SUPERVISOR', 'inventory.issue'),
  ('SUPERVISOR', 'inventory.return'),
  ('SUPERVISOR', 'inventory.ledger.view'),
  ('SUPERVISOR', 'inventory.ledger.update')
ON CONFLICT (role, permission_code) DO NOTHING;

-- ACCOUNT: Financial inspection, cost analysis, machine/tool addition & retirement
INSERT INTO public.role_permissions (role, permission_code) VALUES
  ('ACCOUNT', 'inventory.view'),
  ('ACCOUNT', 'inventory.create'),
  ('ACCOUNT', 'inventory.update'),
  ('ACCOUNT', 'inventory.retire'),
  ('ACCOUNT', 'inventory.view_analysis'),
  ('ACCOUNT', 'inventory.ledger.view')
ON CONFLICT (role, permission_code) DO NOTHING;

-- 12. Least-Privilege Table Grants
GRANT USAGE ON SCHEMA public TO service_role, authenticated;

GRANT ALL ON TABLE public.inventory_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory_items TO authenticated;

GRANT ALL ON TABLE public.inventory_transactions TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.inventory_transactions TO authenticated;

GRANT ALL ON TABLE public.inventory_issues TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory_issues TO authenticated;

-- 13. Seed Baseline Inventory Catalog for KFab Infra Project Pvt Ltd (c0000000-0000-0000-0000-000000000001)
INSERT INTO public.inventory_items (
  id, company_id, item_code, item_name, category, subcategory, description,
  brand, model, unit, item_type, is_returnable,
  current_quantity, available_quantity, issued_quantity, maintenance_quantity, damaged_quantity, lost_quantity,
  minimum_stock, maximum_stock, purchase_price, current_value, supplier, location, condition, status
) VALUES
  -- Tab 1: Consumables & Tackles
  ('i0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'CON-WEL-001', 'Welding Rod 6013 (4.0mm)', 'CONSUMABLES_TACKLES', 'Welding Consumables', 'Heavy fabrication rutile welding electrode', 'ESAB', '6013', 'Kg', 'CONSUMABLE', false, 120.0, 120.0, 0.0, 0.0, 0.0, 0.0, 50.0, 200.0, 220.00, 26400.00, 'ESAB India Ltd', 'Main Store Bay 1', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'CON-CUT-001', 'Cutting Disc 4 inch', 'CONSUMABLES_TACKLES', 'Cutting Consumables', 'Inox thin cutting disc for structural steel', 'Bosch', 'Standard Inox', 'Nos', 'CONSUMABLE', false, 18.0, 18.0, 0.0, 0.0, 0.0, 0.0, 30.0, 150.0, 85.00, 1530.00, 'Industrial Hardware Depot', 'Main Store Bay 1', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'CON-GRN-001', 'Grinding Disc 7 inch', 'CONSUMABLES_TACKLES', 'Grinding Consumables', 'Reinforced depressed center grinding wheel', 'Makita', 'A-80656', 'Nos', 'CONSUMABLE', false, 7.0, 7.0, 0.0, 0.0, 0.0, 0.0, 20.0, 80.0, 120.00, 840.00, 'Industrial Hardware Depot', 'Main Store Bay 1', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'CON-TAC-001', 'Bow Shackle 10 Ton', 'CONSUMABLES_TACKLES', 'Lifting Tackles', 'Drop forged alloy steel lifting shackle with safety pin', 'Crosby', 'G-2130', 'Nos', 'RETURNABLE', true, 25.0, 25.0, 0.0, 0.0, 0.0, 0.0, 10.0, 40.0, 950.00, 23750.00, 'Crosby Heavy Lifting Co', 'Rigging Store', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'CON-FAS-001', 'M20 High Tensile Bolts & Nuts (Grade 8.8)', 'CONSUMABLES_TACKLES', 'Fasteners', 'Hot dip galvanized M20 x 80mm bolt with washer', 'Unbrako', 'HT-8.8', 'Nos', 'CONSUMABLE', false, 350.0, 350.0, 0.0, 0.0, 0.0, 0.0, 100.0, 1000.0, 65.00, 22750.00, 'Apex Fasteners Ltd', 'Hardware Rack B', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'CON-GAS-001', 'Gas Cutting Nozzle Size 2', 'CONSUMABLES_TACKLES', 'Gas Accessories', 'Oxy-Acetylene heavy duty cutting tip', 'ESAB', 'ANME-2', 'Nos', 'CONSUMABLE', false, 12.0, 12.0, 0.0, 0.0, 0.0, 0.0, 15.0, 50.0, 180.00, 2160.00, 'ESAB India Ltd', 'Gas Cutting Depot', 'GOOD', 'ACTIVE'),

  -- Tab 2: Machines & Tools
  ('i0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'MAC-WLD-001', 'Inverter Welding Machine 400A', 'MACHINES_TOOLS', 'Welding Machines', '400 Amp 3-Phase IGBT inverter arc welding power source', 'ESAB', 'Buddy Arc 400i', 'Nos', 'MACHINE', true, 5.0, 3.0, 2.0, 0.0, 0.0, 0.0, 2.0, 10.0, 48000.00, 240000.00, 'ESAB India Ltd', 'Welding Bay 2', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'TOOL-GRN-001', 'Heavy Duty Angle Grinder 7 inch', 'MACHINES_TOOLS', 'Power Tools', '2200W professional metal fabrication angle grinder', 'Bosch', 'GWS 2200-180', 'Nos', 'TOOL', true, 12.0, 8.0, 4.0, 0.0, 0.0, 0.0, 4.0, 20.0, 6800.00, 81600.00, 'Industrial Hardware Depot', 'Tool Room', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'TOOL-TRQ-001', 'Torque Wrench 100-500 Nm', 'MACHINES_TOOLS', 'Measuring Tools', 'Calibrated mechanical click-type torque wrench for structural bolts', 'Stanley', 'STMT73591-8', 'Nos', 'TOOL', true, 4.0, 4.0, 0.0, 0.0, 0.0, 0.0, 2.0, 6.0, 14500.00, 58000.00, 'Precision Tools Corporation', 'Tool Crib A', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'MAC-DRL-001', 'Magnetic Base Core Drill Machine', 'MACHINES_TOOLS', 'Machines', '50mm magnetic drilling machine for structural beams', 'Makita', 'HB500', 'Nos', 'MACHINE', true, 3.0, 2.0, 1.0, 0.0, 0.0, 0.0, 1.0, 5.0, 62000.00, 186000.00, 'Makita Power Solutions', 'Tool Room', 'GOOD', 'ACTIVE'),

  -- Tab 3: Clothes & Safety
  ('i0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'CLO-GLO-001', 'Split Leather Heavy Welding Gloves', 'CLOTHES_SAFETY', 'Hand Protection', '16 inch cow split leather heat and spark resistant welding gloves', '3M', 'W-Series', 'Pair', 'CLOTHING', false, 120.0, 120.0, 0.0, 0.0, 0.0, 0.0, 40.0, 250.0, 120.00, 14400.00, 'Safety First PPE Suppliers', 'Safety Store Rack 1', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'CLO-APR-001', 'Leather Fabrication Apron', 'CLOTHES_SAFETY', 'Body Protection', 'Heavy duty split leather welding and chipping protection apron', 'Karam', 'AP-01', 'Nos', 'CLOTHING', true, 15.0, 15.0, 0.0, 0.0, 0.0, 0.0, 20.0, 50.0, 450.00, 6750.00, 'Safety First PPE Suppliers', 'Safety Store Rack 2', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', 'CLO-HLM-001', 'Industrial Safety Helmet (IS:2925)', 'CLOTHES_SAFETY', 'Head Protection', 'High density polymer safety helmet with 4-point ratchet suspension', 'Karam', 'Sheltek-101', 'Nos', 'SAFETY_ITEM', true, 35.0, 35.0, 0.0, 0.0, 0.0, 0.0, 20.0, 100.0, 350.00, 12250.00, 'Safety First PPE Suppliers', 'Safety Store Rack 3', 'GOOD', 'ACTIVE'),
  ('i0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000001', 'CLO-SHU-001', 'Steel Toe Safety Shoes (S1P)', 'CLOTHES_SAFETY', 'Foot Protection', '200J steel toe impact protection oil and slip resistant shoe', 'Tiger', 'Safari Pro', 'Pair', 'SAFETY_ITEM', true, 28.0, 28.0, 0.0, 0.0, 0.0, 0.0, 15.0, 60.0, 1250.00, 35000.00, 'Industrial Footwear Hub', 'Safety Store Rack 4', 'GOOD', 'ACTIVE')
ON CONFLICT (company_id, item_code) DO NOTHING;

-- 14. Seed Representative Issue History for Accountability
INSERT INTO public.inventory_issues (
  id, company_id, item_id, employee_id, quantity, returned_quantity,
  issuer_name, issue_date, expected_return_date, condition_at_issue, status, remarks
) VALUES
  ('is000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000001', 1.0, 0.0, 'Supervisor (Plant Yard)', '2026-10-01', '2026-10-07', 'Good', 'ISSUED', 'Structural box girder joint fit-up bevel grinding'),
  ('is000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000002', 1.0, 0.0, 'Supervisor (Plant Yard)', '2026-10-02', '2026-10-08', 'Good', 'ISSUED', '6G pipe coupon test welding and flange tacking'),
  ('is000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000001', 2.0, 0.0, 'Supervisor (Plant Yard)', '2026-10-03', null, 'Good', 'ISSUED', 'Routine bi-weekly PPE issue to Senior Fitter')
ON CONFLICT DO NOTHING;
