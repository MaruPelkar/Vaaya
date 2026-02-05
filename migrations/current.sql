-- ============================================================================
-- Vaaya Database Schema - Current Version
-- ============================================================================
-- Run this entire file in Supabase SQL Editor to set up or update the schema.
-- This is idempotent - safe to run multiple times.
-- ============================================================================

-- Step 1: Create migrations tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create companies table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS companies (
  domain TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Add all columns (idempotent - won't fail if they exist)
DO $$
BEGIN
  -- Summary tab columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'summary_data') THEN
    ALTER TABLE companies ADD COLUMN summary_data JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'summary_updated_at') THEN
    ALTER TABLE companies ADD COLUMN summary_updated_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'summary_sources') THEN
    ALTER TABLE companies ADD COLUMN summary_sources TEXT[] DEFAULT '{}';
  END IF;

  -- Product tab columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'product_data') THEN
    ALTER TABLE companies ADD COLUMN product_data JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'product_updated_at') THEN
    ALTER TABLE companies ADD COLUMN product_updated_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'product_sources') THEN
    ALTER TABLE companies ADD COLUMN product_sources TEXT[] DEFAULT '{}';
  END IF;

  -- Business tab columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_data') THEN
    ALTER TABLE companies ADD COLUMN business_data JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_updated_at') THEN
    ALTER TABLE companies ADD COLUMN business_updated_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_sources') THEN
    ALTER TABLE companies ADD COLUMN business_sources TEXT[] DEFAULT '{}';
  END IF;

  -- People tab columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'people_data') THEN
    ALTER TABLE companies ADD COLUMN people_data JSONB DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'people_updated_at') THEN
    ALTER TABLE companies ADD COLUMN people_updated_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'people_sources') THEN
    ALTER TABLE companies ADD COLUMN people_sources TEXT[] DEFAULT '{}';
  END IF;

  -- Metadata columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'schema_version') THEN
    ALTER TABLE companies ADD COLUMN schema_version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Step 4: Clean up old columns (from previous schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab1_data') THEN
    ALTER TABLE companies DROP COLUMN tab1_data;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab1_updated_at') THEN
    ALTER TABLE companies DROP COLUMN tab1_updated_at;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab1_sources') THEN
    ALTER TABLE companies DROP COLUMN tab1_sources;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab2_data') THEN
    ALTER TABLE companies DROP COLUMN tab2_data;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab2_updated_at') THEN
    ALTER TABLE companies DROP COLUMN tab2_updated_at;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab2_sources') THEN
    ALTER TABLE companies DROP COLUMN tab2_sources;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab3_data') THEN
    ALTER TABLE companies DROP COLUMN tab3_data;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab3_updated_at') THEN
    ALTER TABLE companies DROP COLUMN tab3_updated_at;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tab3_sources') THEN
    ALTER TABLE companies DROP COLUMN tab3_sources;
  END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_updated ON companies(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_summary_updated ON companies(summary_updated_at DESC);

-- Step 6: Record migration version
INSERT INTO _migrations (version, name)
VALUES (2, 'four_tab_structure')
ON CONFLICT (version) DO NOTHING;

-- Step 7: Clear old cached data (optional - uncomment if you want to reset all data)
-- DELETE FROM companies;

-- ============================================================================
-- Done! Your database is now set up for the 4-tab structure.
-- ============================================================================
