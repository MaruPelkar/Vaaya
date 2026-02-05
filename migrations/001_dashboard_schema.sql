-- Migration 001: Fresh dashboard schema for Vaaya
-- This migration drops existing data and creates a new schema

-- Drop existing companies table if it exists
DROP TABLE IF EXISTS companies CASCADE;

-- Create new companies table with dashboard schema
CREATE TABLE companies (
  -- Primary Key
  domain TEXT PRIMARY KEY,

  -- Company Identity
  name TEXT NOT NULL,
  logo_url TEXT,

  -- Dashboard Tab Data (JSONB)
  dashboard_data JSONB,
  dashboard_updated_at TIMESTAMPTZ,
  dashboard_sources TEXT[],

  -- Product Tab Data (for future Tab 2)
  product_data JSONB,
  product_updated_at TIMESTAMPTZ,
  product_sources TEXT[],

  -- Business Tab Data (for future Tab 3)
  business_data JSONB,
  business_updated_at TIMESTAMPTZ,
  business_sources TEXT[],

  -- Person Tab Data (for future Tab 4)
  person_data JSONB,
  person_updated_at TIMESTAMPTZ,
  person_sources TEXT[],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_companies_dashboard_updated ON companies(dashboard_updated_at DESC);
CREATE INDEX idx_companies_created ON companies(created_at DESC);

-- Reset migrations table
DROP TABLE IF EXISTS _migrations;
CREATE TABLE _migrations (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mark this migration as applied
INSERT INTO _migrations (version, name) VALUES (1, 'dashboard_schema');
