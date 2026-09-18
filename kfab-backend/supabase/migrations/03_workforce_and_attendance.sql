-- ============================================================================
-- Migration 03: Employees Roster, Supervisor Assignments & Locked Attendance
-- ============================================================================

-- Employees Table (Workforce Directory)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_code text NOT NULL,
  name text NOT NULL,
  photo_url text,
  mobile text,
  designation text NOT NULL,
  department text NOT NULL,
  joining_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_code)
);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Employee Assignments Table (Supervisor Allocation with Full History)
CREATE TABLE IF NOT EXISTS public.employee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Partial Unique Index: Exactly one active supervisor per employee within a company
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_employee_assignment
  ON public.employee_assignments (company_id, employee_id)
  WHERE unassigned_at IS NULL;

-- Attendance Table (Server-Locked Daily Muster Records)
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  date date NOT NULL DEFAULT get_business_date(),
  status text NOT NULL CHECK (status IN ('PRESENT', 'ABSENT')),
  marked_at timestamptz NOT NULL DEFAULT now(),
  marked_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  client_id text, -- Offline sync idempotency key
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_id, date)
);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Strict Server-Side Date Lock Enforcement Trigger
CREATE OR REPLACE FUNCTION enforce_attendance_date_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_today date := get_business_date();
BEGIN
  -- Controlled correction override check: only valid if authorized admin/super-admin
  IF current_setting('kfab.controlled_correction_in_progress', true) = 'true' THEN
    IF public.is_super_admin() OR public.has_company_role(COALESCE(NEW.company_id, OLD.company_id), 'ADMIN') THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
  END IF;

  -- On INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.date != v_today THEN
      RAISE EXCEPTION 'Attendance date lock violation: Date (%) is not current business day (%). Submit a correction request.',
        NEW.date, v_today;
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE
  IF TG_OP = 'UPDATE' THEN
    IF OLD.date != v_today THEN
      RAISE EXCEPTION 'Historical attendance modification locked for date (%). Submit a formal correction request.',
        OLD.date;
    END IF;
    IF NEW.date != OLD.date THEN
      RAISE EXCEPTION 'Altering muster date on an existing attendance record is strictly forbidden.';
    END IF;
    RETURN NEW;
  END IF;

  -- On DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.date != v_today THEN
      RAISE EXCEPTION 'Historical attendance deletion locked for date (%). Submit a formal correction request.',
        OLD.date;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, auth, pg_temp;

CREATE TRIGGER trg_enforce_attendance_date_lock
  BEFORE INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION enforce_attendance_date_lock();

-- Historical Correction Requests Table
CREATE TABLE IF NOT EXISTS public.correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module text NOT NULL CHECK (module IN ('ATTENDANCE', 'STOCK_INWARD', 'STOCK_OUTWARD', 'STOCK_USAGE')),
  record_id uuid,
  target_date date NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
  requested_data jsonb NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_correction_requests_updated_at
  BEFORE UPDATE ON public.correction_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Controlled Procedure for Applying an Approved Correction
CREATE OR REPLACE FUNCTION public.apply_approved_correction(
  p_request_id uuid,
  p_review_notes text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_req public.correction_requests%ROWTYPE;
  v_emp_id uuid;
  v_status text;
BEGIN
  SELECT * INTO v_req
  FROM public.correction_requests
  WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Correction request % not found.', p_request_id;
  END IF;

  IF v_req.status != 'PENDING' THEN
    RAISE EXCEPTION 'Correction request % is not pending (current status: %).', p_request_id, v_req.status;
  END IF;

  IF NOT (public.is_super_admin() OR public.has_company_role(v_req.company_id, 'ADMIN')) THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin or Company Admin can approve correction requests.';
  END IF;

  PERFORM set_config('kfab.controlled_correction_in_progress', 'true', true);

  IF v_req.module = 'ATTENDANCE' THEN
    IF v_req.action_type = 'INSERT' THEN
      v_emp_id := (v_req.requested_data->>'employee_id')::uuid;
      v_status := (v_req.requested_data->>'status')::text;
      INSERT INTO public.attendance (
        company_id, employee_id, date, status, marked_by
      ) VALUES (
        v_req.company_id, v_emp_id, v_req.target_date, v_status, auth.uid()
      )
      ON CONFLICT (company_id, employee_id, date)
      DO UPDATE SET status = EXCLUDED.status, marked_by = auth.uid(), updated_at = now();
    ELSIF v_req.action_type = 'UPDATE' THEN
      v_status := (v_req.requested_data->>'status')::text;
      UPDATE public.attendance
      SET status = v_status, marked_by = auth.uid(), updated_at = now()
      WHERE id = v_req.record_id AND company_id = v_req.company_id;
    ELSIF v_req.action_type = 'DELETE' THEN
      DELETE FROM public.attendance
      WHERE id = v_req.record_id AND company_id = v_req.company_id;
    END IF;
  END IF;

  PERFORM set_config('kfab.controlled_correction_in_progress', 'false', true);

  UPDATE public.correction_requests
  SET status = 'APPROVED',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_notes = p_review_notes,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;
