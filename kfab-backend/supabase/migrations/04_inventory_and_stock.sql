-- ============================================================================
-- Migration 04: Materials Catalog, Suppliers, Stock Ledger & Atomic Concurrency
-- ============================================================================

-- Units of Measurement Master Table
CREATE TABLE IF NOT EXISTS public.units (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_standard boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Standard Units
INSERT INTO public.units (code, name, description) VALUES
  ('KG', 'Kilogram', 'Metric mass in kilograms'),
  ('TON', 'Metric Ton', '1,000 Kilograms'),
  ('NOS', 'Numbers', 'Count of individual discrete items'),
  ('LITRE', 'Litre', 'Metric liquid volume'),
  ('METER', 'Meter', 'Linear length in meters'),
  ('MM', 'Millimeter', 'Linear length in millimeters'),
  ('BAG', 'Bag', 'Standard bagged material (e.g. cement)'),
  ('BOX', 'Box', 'Boxed packaging unit'),
  ('SET', 'Set', 'Assembled set or composite item')
ON CONFLICT (code) DO NOTHING;

-- Material Master Table
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  material_code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  specification text,
  unit_code text NOT NULL REFERENCES public.units(code) ON UPDATE CASCADE,
  minimum_stock numeric(12, 3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISCONTINUED', 'INACTIVE')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, material_code)
);

CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_code text NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLACKLISTED')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, supplier_code)
);

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Stock Inward Table (Material Receipts from Suppliers)
CREATE TABLE IF NOT EXISTS public.stock_inward (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT get_business_date(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_code text NOT NULL REFERENCES public.units(code) ON UPDATE CASCADE,
  vehicle_number text,
  invoice_number text,
  challan_number text,
  received_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  remarks text,
  attachment_url text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED', 'CANCELLED')),
  voided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  voided_at timestamptz,
  void_reason text,
  client_id text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stock_inward_updated_at
  BEFORE UPDATE ON public.stock_inward
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Stock Outward Table (Dispatches to Clients / Subcontractors / Sites)
CREATE TABLE IF NOT EXISTS public.stock_outward (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT get_business_date(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_code text NOT NULL REFERENCES public.units(code) ON UPDATE CASCADE,
  destination text NOT NULL,
  vehicle_number text,
  driver text,
  challan_number text,
  issued_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  received_by_name text,
  remarks text,
  attachment_url text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED', 'CANCELLED')),
  voided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  voided_at timestamptz,
  void_reason text,
  client_id text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stock_outward_updated_at
  BEFORE UPDATE ON public.stock_outward
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Stock Usage Table (Shop Floor / Fabrication Bay Consumption)
CREATE TABLE IF NOT EXISTS public.stock_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT get_business_date(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_code text NOT NULL REFERENCES public.units(code) ON UPDATE CASCADE,
  project_name text,
  used_by text,
  remarks text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOIDED', 'CANCELLED')),
  voided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  voided_at timestamptz,
  void_reason text,
  client_id text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_stock_usage_updated_at
  BEFORE UPDATE ON public.stock_usage
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Stock Void & Immutability Lifecycle Policy
CREATE OR REPLACE FUNCTION enforce_stock_void_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Hard deletion of stock transactions is prohibited. Use the void/cancel procedure instead.';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('VOIDED', 'CANCELLED') THEN
      RAISE EXCEPTION 'Modification of voided or cancelled stock transactions is strictly prohibited.';
    END IF;

    IF OLD.status = 'ACTIVE' AND NEW.status IN ('VOIDED', 'CANCELLED') THEN
      IF NEW.void_reason IS NULL OR trim(NEW.void_reason) = '' THEN
        RAISE EXCEPTION 'A valid void_reason is mandatory when voiding a stock transaction.';
      END IF;
      NEW.voided_by := auth.uid();
      NEW.voided_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_stock_inward_void_lifecycle
  BEFORE UPDATE OR DELETE ON public.stock_inward
  FOR EACH ROW EXECUTE FUNCTION enforce_stock_void_lifecycle();

CREATE TRIGGER trg_stock_outward_void_lifecycle
  BEFORE UPDATE OR DELETE ON public.stock_outward
  FOR EACH ROW EXECUTE FUNCTION enforce_stock_void_lifecycle();

CREATE TRIGGER trg_stock_usage_void_lifecycle
  BEFORE UPDATE OR DELETE ON public.stock_usage
  FOR EACH ROW EXECUTE FUNCTION enforce_stock_void_lifecycle();

-- Concurrency-Safe Atomic Stock Deduction Trigger (Row-Level Locking)
CREATE OR REPLACE FUNCTION validate_stock_availability_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock numeric(12, 3);
  v_inward numeric(12, 3) := 0;
  v_outward numeric(12, 3) := 0;
  v_usage numeric(12, 3) := 0;
BEGIN
  IF NEW.status IN ('VOIDED', 'CANCELLED') THEN
    RETURN NEW;
  END IF;

  -- Row lock on material to serialize concurrent deductions
  PERFORM id FROM public.materials WHERE id = NEW.material_id FOR UPDATE;

  SELECT COALESCE(SUM(quantity), 0) INTO v_inward
  FROM public.stock_inward
  WHERE material_id = NEW.material_id AND status = 'ACTIVE';

  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_outward
    FROM public.stock_outward
    WHERE material_id = NEW.material_id AND status = 'ACTIVE';

    SELECT COALESCE(SUM(quantity), 0) INTO v_usage
    FROM public.stock_usage
    WHERE material_id = NEW.material_id AND status = 'ACTIVE';
  ELSE -- UPDATE
    SELECT COALESCE(SUM(quantity), 0) INTO v_outward
    FROM public.stock_outward
    WHERE material_id = NEW.material_id AND status = 'ACTIVE'
      AND (TG_TABLE_NAME != 'stock_outward' OR id != OLD.id);

    SELECT COALESCE(SUM(quantity), 0) INTO v_usage
    FROM public.stock_usage
    WHERE material_id = NEW.material_id AND status = 'ACTIVE'
      AND (TG_TABLE_NAME != 'stock_usage' OR id != OLD.id);
  END IF;

  v_current_stock := v_inward - (v_outward + v_usage);

  IF (v_current_stock - NEW.quantity) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for material %. Available: %, Requested: %.',
      NEW.material_id, v_current_stock, NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_validate_stock_outward
  BEFORE INSERT OR UPDATE ON public.stock_outward
  FOR EACH ROW EXECUTE FUNCTION validate_stock_availability_trigger();

CREATE TRIGGER trg_validate_stock_usage
  BEFORE INSERT OR UPDATE ON public.stock_usage
  FOR EACH ROW EXECUTE FUNCTION validate_stock_availability_trigger();

-- Dynamic Calculated Stock View
CREATE OR REPLACE VIEW public.v_material_stock AS
SELECT
  m.id AS material_id,
  m.company_id,
  m.material_code,
  m.name AS material_name,
  m.category,
  m.specification,
  m.unit_code,
  m.minimum_stock,
  m.status AS material_status,
  COALESCE(i.total_inward, 0)::numeric(12, 3) AS total_inward,
  COALESCE(o.total_outward, 0)::numeric(12, 3) AS total_outward,
  COALESCE(u.total_usage, 0)::numeric(12, 3) AS total_usage,
  (COALESCE(i.total_inward, 0) - COALESCE(o.total_outward, 0) - COALESCE(u.total_usage, 0))::numeric(12, 3) AS current_stock,
  ((COALESCE(i.total_inward, 0) - COALESCE(o.total_outward, 0) - COALESCE(u.total_usage, 0)) <= m.minimum_stock) AS is_low_stock
FROM public.materials m
LEFT JOIN (
  SELECT material_id, SUM(quantity) AS total_inward
  FROM public.stock_inward
  WHERE status = 'ACTIVE'
  GROUP BY material_id
) i ON i.material_id = m.id
LEFT JOIN (
  SELECT material_id, SUM(quantity) AS total_outward
  FROM public.stock_outward
  WHERE status = 'ACTIVE'
  GROUP BY material_id
) o ON o.material_id = m.id
LEFT JOIN (
  SELECT material_id, SUM(quantity) AS total_usage
  FROM public.stock_usage
  WHERE status = 'ACTIVE'
  GROUP BY material_id
) u ON u.material_id = m.id;
