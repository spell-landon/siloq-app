-- =====================================================
-- MILEAGE TABLE
-- Track mileage for tax deductions
-- =====================================================
CREATE TABLE IF NOT EXISTS mileage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Trip Details
  date DATE NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  miles NUMERIC(10, 2) NOT NULL,
  purpose TEXT NOT NULL,
  notes TEXT,

  -- Business Classification
  is_business BOOLEAN DEFAULT true,

  -- Rate & Calculation
  rate_per_mile NUMERIC(10, 4) DEFAULT 0.67, -- IRS standard rate for 2024
  total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (miles * rate_per_mile) STORED,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mileage_user_id ON mileage(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_date ON mileage(date);
CREATE INDEX IF NOT EXISTS idx_mileage_is_business ON mileage(is_business);

-- RLS Policies
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

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mileage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_mileage_updated_at
  BEFORE UPDATE ON mileage
  FOR EACH ROW
  EXECUTE FUNCTION update_mileage_updated_at();
