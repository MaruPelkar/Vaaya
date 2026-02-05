import { createClient } from '@/lib/db';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/**
 * All migrations in order. Add new migrations at the end.
 * Never modify existing migrations - only add new ones.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `
      -- Create companies table with flexible JSONB structure
      CREATE TABLE IF NOT EXISTS companies (
        domain TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT,

        -- Flexible JSONB columns for each tab (schema can evolve)
        summary_data JSONB DEFAULT '{}',
        summary_updated_at TIMESTAMPTZ,
        summary_sources TEXT[] DEFAULT '{}',

        product_data JSONB DEFAULT '{}',
        product_updated_at TIMESTAMPTZ,
        product_sources TEXT[] DEFAULT '{}',

        business_data JSONB DEFAULT '{}',
        business_updated_at TIMESTAMPTZ,
        business_sources TEXT[] DEFAULT '{}',

        people_data JSONB DEFAULT '{}',
        people_updated_at TIMESTAMPTZ,
        people_sources TEXT[] DEFAULT '{}',

        -- Metadata
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
      CREATE INDEX IF NOT EXISTS idx_companies_updated ON companies(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_companies_summary_updated ON companies(summary_updated_at DESC);
    `,
  },
  {
    version: 2,
    name: 'add_missing_columns',
    sql: `
      -- Add columns if they don't exist (for existing tables)
      DO $$
      BEGIN
        -- Summary columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'summary_data') THEN
          ALTER TABLE companies ADD COLUMN summary_data JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'summary_updated_at') THEN
          ALTER TABLE companies ADD COLUMN summary_updated_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'summary_sources') THEN
          ALTER TABLE companies ADD COLUMN summary_sources TEXT[] DEFAULT '{}';
        END IF;

        -- Product columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'product_data') THEN
          ALTER TABLE companies ADD COLUMN product_data JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'product_updated_at') THEN
          ALTER TABLE companies ADD COLUMN product_updated_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'product_sources') THEN
          ALTER TABLE companies ADD COLUMN product_sources TEXT[] DEFAULT '{}';
        END IF;

        -- Business columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_data') THEN
          ALTER TABLE companies ADD COLUMN business_data JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_updated_at') THEN
          ALTER TABLE companies ADD COLUMN business_updated_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'business_sources') THEN
          ALTER TABLE companies ADD COLUMN business_sources TEXT[] DEFAULT '{}';
        END IF;

        -- People columns
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
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'created_at') THEN
          ALTER TABLE companies ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'updated_at') THEN
          ALTER TABLE companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
      END $$;

      -- Drop old columns if they exist (cleanup from old schema)
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
    `,
  },
];

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<{
  success: boolean;
  applied: string[];
  errors: string[];
}> {
  const supabase = createClient();
  const applied: string[] = [];
  const errors: string[] = [];

  try {
    // Create migrations tracking table if it doesn't exist
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS _migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    }).throwOnError();
  } catch {
    // If rpc doesn't exist, try direct SQL (this might fail on some Supabase setups)
    // In that case, user needs to run migrations manually
    console.log('Note: exec_sql RPC not available. Running migrations via direct query.');
  }

  // Get already applied migrations
  const { data: appliedMigrations } = await supabase
    .from('_migrations')
    .select('version')
    .order('version', { ascending: true });

  const appliedVersions = new Set(appliedMigrations?.map((m) => m.version) || []);

  // Run pending migrations
  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue; // Already applied
    }

    try {
      // Execute migration SQL
      const { error } = await supabase.rpc('exec_sql', { sql: migration.sql });

      if (error) {
        throw error;
      }

      // Record migration as applied
      await supabase.from('_migrations').insert({
        version: migration.version,
        name: migration.name,
      });

      applied.push(`v${migration.version}: ${migration.name}`);
      console.log(`Migration applied: v${migration.version} - ${migration.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`v${migration.version}: ${errorMessage}`);
      console.error(`Migration failed: v${migration.version} - ${migration.name}:`, errorMessage);
      // Stop on first error to prevent cascading issues
      break;
    }
  }

  return {
    success: errors.length === 0,
    applied,
    errors,
  };
}

/**
 * Get current migration status
 */
export async function getMigrationStatus(): Promise<{
  current: number;
  latest: number;
  pending: number;
}> {
  const supabase = createClient();

  const { data } = await supabase
    .from('_migrations')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const current = data?.version || 0;
  const latest = migrations[migrations.length - 1]?.version || 0;

  return {
    current,
    latest,
    pending: latest - current,
  };
}
