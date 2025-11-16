-- Add invoice defaults and address fields to business_settings
-- Migration to support comprehensive business settings including invoice defaults

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS default_payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS default_tax_rate NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN business_settings.default_payment_terms IS 'Default payment terms for invoices (e.g., Net 30, Due on Receipt)';
COMMENT ON COLUMN business_settings.default_tax_rate IS 'Default tax rate percentage for invoices';
COMMENT ON COLUMN business_settings.default_notes IS 'Default notes to include on invoices';
