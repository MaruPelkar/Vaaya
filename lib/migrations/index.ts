import { createClient } from '@/lib/db';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/**
 * All migrations in order. Add new migrations at the end.
 * Never modify existing migrations - only add new ones.
 *
 * NOTE: This is a fresh start migration that drops existing data.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'dashboard_schema',
    sql: `
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
      CREATE INDEX IF NOT EXISTS idx_companies_dashboard_updated ON companies(dashboard_updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_companies_created ON companies(created_at DESC);
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

/**
 * Get raw SQL for manual execution
 */
export function getMigrationSQL(): string {
  return migrations.map(m => `-- Migration v${m.version}: ${m.name}\n${m.sql}`).join('\n\n');
}
