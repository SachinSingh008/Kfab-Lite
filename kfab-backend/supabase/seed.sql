-- ============================================================================
-- KFAB BASIC — Clean Seed Script (No Fake / Mock Data)
-- ============================================================================
-- Clean slate: Master units only (Standard ISO measurement units)
-- Real application data will be entered via the UI and authenticated users.
-- ============================================================================

-- Standard Units of Measurement (Universal Constants)
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
