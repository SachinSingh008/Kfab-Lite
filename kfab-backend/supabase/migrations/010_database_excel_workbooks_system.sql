-- ==============================================================================
-- Migration 010: Complete Live Database System for All Excel Workbooks
-- Purpose: Unified PostgreSQL schema for KFab360 live Excel workbooks system.
--          Creates authoritative multi-tenant tables, relationships, indexes,
--          triggers, RLS policies, views, and seeds the 5 operational companies.
-- ==============================================================================

-- 1. Operational Companies Roster Table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed The 5 Authoritative Industrial Units
INSERT INTO public.companies (id, name, code, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Chattisgarh (Singh Enterprises - Bhilai)', 'CHATTISGARH', true),
  ('c1000000-0000-0000-0000-000000000002', 'Hubli (Vedanta Cranes - Hubli)', 'HUBLI', true),
  ('c1000000-0000-0000-0000-000000000003', 'Kumar Fabricators Pvt Ltd (KFPL)', 'KFPL', true),
  ('c1000000-0000-0000-0000-000000000004', 'KFab Infra Project Pvt Ltd (KIPL)', 'KIPL', true),
  ('c1000000-0000-0000-0000-000000000005', 'Lonanad (KFab Unit 2 - Lonand)', 'LONANAD', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, is_active = true;

-- 2. Personnel Master Roster (Employees Table)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_code text NOT NULL,
  company_name text,
  name text NOT NULL,
  designation text,
  mobile text,
  esic_no text,
  father_name text,
  dob date,
  gender text,
  marital_status text,
  date_of_joining date,
  aadhaar_no text,
  pan_no text,
  salary_wage numeric(12,2) DEFAULT 0,
  bank_account_no text,
  ifsc_code text,
  bank_name text,
  branch text,
  account_holder_name text,
  uan_pf_no text,
  nominee_details jsonb DEFAULT '{}',
  family_details jsonb DEFAULT '[]',
  emergency_contact text,
  address text,
  blood_group text,
  is_active boolean NOT NULL DEFAULT true,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_employee UNIQUE (company_id, employee_code)
);

-- 3. Creditor Bank Details Table
CREATE TABLE IF NOT EXISTS public.creditor_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sr_no integer,
  name text NOT NULL,
  mobile text,
  account_no text,
  ifsc_code text,
  bank_name text,
  branch text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Clients Register Table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_no integer,
  client_id text NOT NULL UNIQUE,
  client_name text NOT NULL,
  contact_person text,
  mobile text,
  alt_mobile text,
  email text,
  gstin text,
  billing_address text,
  site_address text,
  city text,
  state text,
  pin_code text,
  payment_terms text,
  credit_limit numeric(12,2) DEFAULT 0,
  opening_balance numeric(12,2) DEFAULT 0,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Consumers Register Table
CREATE TABLE IF NOT EXISTS public.consumers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_no integer,
  consumer_id text NOT NULL UNIQUE,
  consumer_name text NOT NULL,
  mobile text,
  alt_mobile text,
  email text,
  address text,
  area text,
  city text,
  state text,
  pin_code text,
  consumer_type text,
  product_service text,
  preferred_contact text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Bills & Expense Register Table
CREATE TABLE IF NOT EXISTS public.bills_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sr_no integer,
  site text,
  bill_name text,
  date date,
  name text,
  invoice_challan_no text,
  description_of_goods text,
  qty numeric(12,3) DEFAULT 0,
  type text,
  rate numeric(12,2) DEFAULT 0,
  amount numeric(12,2) DEFAULT 0,
  signature text,
  category text NOT NULL CHECK (category IN ('RECURRING', 'ONE_TIME', 'MISCELLANEOUS')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Inventory Movements (Material In / Out) Table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  sr_no integer,
  site text,
  bill_name text,
  date date,
  name text,
  emp_expense text,
  invoice_challan_no text,
  description_of_goods text,
  qty numeric(12,3) DEFAULT 0,
  type text,
  rate numeric(12,2) DEFAULT 0,
  amount numeric(12,2) DEFAULT 0,
  signature text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Outward Register Table
CREATE TABLE IF NOT EXISTS public.outward_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sr_no integer,
  site text,
  bill_name text,
  date date,
  name text,
  invoice_challan_no text,
  description_of_goods text,
  qty numeric(12,3) DEFAULT 0,
  type text,
  rate numeric(12,2) DEFAULT 0,
  amount numeric(12,2) DEFAULT 0,
  signature text,
  destination_company_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Salary Register Table
CREATE TABLE IF NOT EXISTS public.salary_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  year integer NOT NULL,
  month text NOT NULL,
  sr_no integer,
  name text NOT NULL,
  p_day numeric(5,2) DEFAULT 0,
  ot numeric(6,2) DEFAULT 0,
  total_day numeric(6,2) DEFAULT 0,
  rate numeric(12,2) DEFAULT 0,
  per_day numeric(12,2) DEFAULT 0,
  salary numeric(12,2) DEFAULT 0,
  ot_amount numeric(12,2) DEFAULT 0,
  total_salary numeric(12,2) DEFAULT 0,
  advance numeric(12,2) DEFAULT 0,
  rcd_advance numeric(12,2) DEFAULT 0,
  room_rent numeric(12,2) DEFAULT 0,
  other_deductions numeric(12,2) DEFAULT 0,
  back_salary numeric(12,2) DEFAULT 0,
  salary_payable numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Advance Register Table
CREATE TABLE IF NOT EXISTS public.advance_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  year integer NOT NULL,
  month text NOT NULL,
  sr_no integer,
  name text NOT NULL,
  advance_entries jsonb DEFAULT '[]',
  total_advance numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Attendance Register Table
CREATE TABLE IF NOT EXISTS public.attendance_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  year integer NOT NULL,
  month text NOT NULL,
  sr_no integer,
  employee_name text NOT NULL,
  designation text,
  days jsonb NOT NULL DEFAULT '{}',
  p_days numeric(5,2) DEFAULT 0,
  hd_days numeric(5,2) DEFAULT 0,
  od_days numeric(5,2) DEFAULT 0,
  ot_hours numeric(6,2) DEFAULT 0,
  total_present_days numeric(6,2) DEFAULT 0,
  total_ot numeric(6,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Sales Register Table
CREATE TABLE IF NOT EXISTS public.sales_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month text NOT NULL,
  sr_no integer,
  date date,
  challan_no text,
  to_party text,
  description_of_goods text,
  qty numeric(12,3) DEFAULT 0,
  rate numeric(12,2) DEFAULT 0,
  amount numeric(12,2) DEFAULT 0,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_no text,
  client_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Dynamic Database Views for Automatic Routing & Sub-Tables

-- Employee Master Views
CREATE OR REPLACE VIEW public.v_employees_active AS
  SELECT * FROM public.employees WHERE is_active = true;

CREATE OR REPLACE VIEW public.v_employees_bank_details AS
  SELECT id, company_id, employee_code, company_name, name, designation,
         bank_account_no, ifsc_code, bank_name, branch, account_holder_name, pan_no, uan_pf_no
  FROM public.employees WHERE is_active = true;

CREATE OR REPLACE VIEW public.v_employees_inactive AS
  SELECT * FROM public.employees WHERE is_active = false;

-- Expense Category Views
CREATE OR REPLACE VIEW public.v_expenses_recurring AS
  SELECT * FROM public.bills_expenses WHERE category = 'RECURRING';

CREATE OR REPLACE VIEW public.v_expenses_onetime AS
  SELECT * FROM public.bills_expenses WHERE category = 'ONE_TIME';

CREATE OR REPLACE VIEW public.v_expenses_misc AS
  SELECT * FROM public.bills_expenses WHERE category = 'MISCELLANEOUS';

-- Outward Company Views
CREATE OR REPLACE VIEW public.v_outward_hubli AS
  SELECT * FROM public.outward_register WHERE destination_company_code = 'HUBLI';

CREATE OR REPLACE VIEW public.v_outward_kfpl AS
  SELECT * FROM public.outward_register WHERE destination_company_code = 'KFPL';

CREATE OR REPLACE VIEW public.v_outward_kipl AS
  SELECT * FROM public.outward_register WHERE destination_company_code = 'KIPL';

CREATE OR REPLACE VIEW public.v_outward_lonanad AS
  SELECT * FROM public.outward_register WHERE destination_company_code = 'LONANAD';

-- Inventory Stock Balance View
CREATE OR REPLACE VIEW public.v_inventory_stock_balance AS
  SELECT 
    company_id,
    description_of_goods AS material_name,
    type AS unit,
    SUM(CASE WHEN movement_type = 'IN' THEN qty ELSE 0 END) AS total_in,
    SUM(CASE WHEN movement_type = 'OUT' THEN qty ELSE 0 END) AS total_out,
    SUM(CASE WHEN movement_type = 'IN' THEN qty ELSE -qty END) AS current_stock
  FROM public.inventory_movements
  GROUP BY company_id, description_of_goods, type;

-- Sales Annual Summary View
CREATE OR REPLACE VIEW public.v_sales_annual_summary AS
  SELECT 
    company_id,
    year,
    month,
    COUNT(id) AS sales_entries_count,
    SUM(qty) AS total_quantity,
    SUM(amount) AS total_sales_amount
  FROM public.sales_register
  GROUP BY company_id, year, month;

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_employees_comp ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_comp_ym ON public.attendance_register(company_id, year, month);
CREATE INDEX IF NOT EXISTS idx_salary_comp_ym ON public.salary_register(company_id, year, month);
CREATE INDEX IF NOT EXISTS idx_advance_comp_ym ON public.advance_register(company_id, year, month);
CREATE INDEX IF NOT EXISTS idx_expenses_comp_cat ON public.bills_expenses(company_id, category);
CREATE INDEX IF NOT EXISTS idx_inventory_comp_type ON public.inventory_movements(company_id, movement_type);
CREATE INDEX IF NOT EXISTS idx_outward_comp_dest ON public.outward_register(company_id, destination_company_code);
CREATE INDEX IF NOT EXISTS idx_sales_comp_ym ON public.sales_register(company_id, year, month);

-- 15. Security & Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditor_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outward_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_register ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and service role full operational access
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'companies', 'employees', 'creditor_bank_details', 'clients', 'consumers',
    'bills_expenses', 'inventory_movements', 'outward_register', 'salary_register',
    'advance_register', 'attendance_register', 'sales_register'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_authenticated_all" ON public.%s;', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_authenticated_all" ON public.%s FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);', tbl, tbl);
    EXECUTE format('GRANT ALL ON TABLE public.%s TO authenticated, service_role;', tbl);
  END LOOP;
END $$;
