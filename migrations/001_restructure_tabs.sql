-- Migration: Restructure from 3 tabs to 4 tabs
-- Date: 2025-02-05
-- Description: Changes tab1/tab2/tab3 columns to summary/product/business/people

-- Step 1: Add new columns for the 4-tab structure
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS summary_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS summary_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS summary_sources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS product_sources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS business_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_sources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS people_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS people_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS people_sources TEXT[] DEFAULT '{}';

-- Step 2: Drop old columns (if they exist)
-- Note: Run this only after verifying the new columns work correctly
-- ALTER TABLE companies
--   DROP COLUMN IF EXISTS tab1_data,
--   DROP COLUMN IF EXISTS tab1_updated_at,
--   DROP COLUMN IF EXISTS tab1_sources,
--   DROP COLUMN IF EXISTS tab2_data,
--   DROP COLUMN IF EXISTS tab2_updated_at,
--   DROP COLUMN IF EXISTS tab2_sources,
--   DROP COLUMN IF EXISTS tab3_data,
--   DROP COLUMN IF EXISTS tab3_updated_at,
--   DROP COLUMN IF EXISTS tab3_sources;

-- Step 3: Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_updated ON companies(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_summary_updated ON companies(summary_updated_at DESC);

-- Note: Run this migration in your Supabase SQL editor or via the CLI
-- After running, test the application to ensure everything works before
-- uncommenting and running Step 2 to drop the old columns.
