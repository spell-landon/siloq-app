-- Siloq Database Schema
-- Based on Ledgerly with adaptations for mobile app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- BUSINESS SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT,
  business_number TEXT,
  business_owner TEXT,
  business_address TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_mobile TEXT,
  business_website TEXT,
  logo_url TEXT,
  default_invoice_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies for business_settings
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business settings"
  ON business_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business settings"
  ON business_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business settings"
  ON business_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  fax TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  contact_person TEXT,
  tax_id TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_is_active ON clients(is_active);

-- RLS Policies for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- LINE ITEM TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS line_item_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_line_item_templates_user_id ON line_item_templates(user_id);

-- RLS Policies for line_item_templates
ALTER TABLE line_item_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON line_item_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON line_item_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON line_item_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON line_item_templates FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_name TEXT,
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL,
  due_date DATE,
  terms TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

  -- From (Business) Information
  from_name TEXT,
  from_email TEXT,
  from_address TEXT,
  from_phone TEXT,
  from_business_number TEXT,
  from_website TEXT,
  from_owner TEXT,

  -- Bill To (Client) Information
  bill_to_name TEXT,
  bill_to_email TEXT,
  bill_to_address TEXT,
  bill_to_phone TEXT,
  bill_to_mobile TEXT,
  bill_to_fax TEXT,

  -- Line Items (JSONB for flexibility)
  line_items JSONB DEFAULT '[]'::jsonb,

  -- Calculations
  subtotal NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) DEFAULT 0,
  balance_due NUMERIC(10, 2) DEFAULT 0,

  -- Additional Information
  notes TEXT,
  payment_instructions TEXT,

  -- Sharing
  share_token TEXT UNIQUE,

  -- Payment Tracking
  payment_method TEXT,
  payment_date DATE,
  payment_reference TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_share_token ON invoices(share_token);

-- RLS Policies for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view shared invoices"
  ON invoices FOR SELECT
  USING (share_token IS NOT NULL);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- ESTIMATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS estimates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  estimate_name TEXT,
  estimate_number TEXT NOT NULL,
  date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'declined', 'expired')),

  -- From (Business) Information
  from_name TEXT,
  from_email TEXT,
  from_address TEXT,
  from_phone TEXT,

  -- Bill To (Client) Information
  bill_to_name TEXT,
  bill_to_email TEXT,
  bill_to_address TEXT,
  bill_to_phone TEXT,

  -- Line Items
  line_items JSONB DEFAULT '[]'::jsonb,

  -- Calculations
  subtotal NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) DEFAULT 0,

  -- Additional Information
  notes TEXT,

  -- Conversion tracking
  converted_to_invoice_id UUID REFERENCES invoices(id),

  -- Sharing
  share_token TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_estimates_user_id ON estimates(user_id);
CREATE INDEX idx_estimates_client_id ON estimates(client_id);
CREATE INDEX idx_estimates_status ON estimates(status);

-- RLS Policies for estimates
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estimates"
  ON estimates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view shared estimates"
  ON estimates FOR SELECT
  USING (share_token IS NOT NULL);

CREATE POLICY "Users can insert own estimates"
  ON estimates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own estimates"
  ON estimates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own estimates"
  ON estimates FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant TEXT NOT NULL,
  category TEXT,
  date DATE NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) DEFAULT 0,
  description TEXT,
  receipt_url TEXT,

  -- Tax Deduction
  is_tax_deductible BOOLEAN DEFAULT false,
  business_use_percentage NUMERIC(5, 2) DEFAULT 100,
  tax_category TEXT,
  deductible_amount NUMERIC(10, 2),

  -- Returns/Refunds
  is_return BOOLEAN DEFAULT false,
  original_expense_id UUID REFERENCES expenses(id),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- RLS Policies for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(date);

-- RLS Policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
  ON payments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- MILEAGE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mileage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  purpose TEXT NOT NULL,
  miles NUMERIC(10, 2) NOT NULL,
  rate_per_mile NUMERIC(10, 4) DEFAULT 0.67,
  total NUMERIC(10, 2) GENERATED ALWAYS AS (miles * rate_per_mile) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_mileage_user_id ON mileage(user_id);
CREATE INDEX idx_mileage_date ON mileage(date);

-- RLS Policies for mileage
ALTER TABLE mileage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mileage"
  ON mileage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mileage"
  ON mileage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mileage"
  ON mileage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mileage"
  ON mileage FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_line_item_templates_updated_at BEFORE UPDATE ON line_item_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mileage_updated_at BEFORE UPDATE ON mileage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE PROFILE AND BUSINESS SETTINGS ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );

  INSERT INTO public.business_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Create storage buckets (run these in Supabase Dashboard if not already created)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage RLS Policies for receipts bucket
-- CREATE POLICY "Users can upload own receipts"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own receipts"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own receipts"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS Policies for logos bucket
-- CREATE POLICY "Anyone can view logos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'logos');

-- CREATE POLICY "Users can upload own logos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own logos"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
