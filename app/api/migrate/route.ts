import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db';
import { migrations } from '@/lib/migrations';

/**
 * GET /api/migrate - Check migration status
 */
export async function GET() {
  const supabase = createClient();

  try {
    // Check if migrations table exists
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', '_migrations')
      .single();

    if (!tables) {
      return NextResponse.json({
        status: 'not_initialized',
        current: 0,
        latest: migrations[migrations.length - 1]?.version || 0,
        pending: migrations.length,
        message: 'Migrations table does not exist. Run POST /api/migrate to initialize.',
      });
    }

    // Get current migration version
    const { data } = await supabase
      .from('_migrations')
      .select('version, name, applied_at')
      .order('version', { ascending: false });

    const current = data?.[0]?.version || 0;
    const latest = migrations[migrations.length - 1]?.version || 0;

    return NextResponse.json({
      status: current >= latest ? 'up_to_date' : 'pending',
      current,
      latest,
      pending: latest - current,
      applied: data || [],
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST /api/migrate - Run pending migrations
 *
 * Protected by MIGRATION_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  // Check authorization
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.MIGRATION_SECRET;

  // In development, allow without secret. In production, require it.
  if (process.env.NODE_ENV === 'production' && expectedSecret) {
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createClient();
  const results: { applied: string[]; errors: string[] } = { applied: [], errors: [] };

  try {
    // Step 1: Create migrations tracking table
    const { error: createTableError } = await supabase.from('_migrations').select('version').limit(1);

    if (createTableError?.code === '42P01') {
      // Table doesn't exist, create it
      // We need to use raw SQL for this
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS _migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      // Try to create via Supabase SQL Editor workaround
      // Since we can't run arbitrary SQL via the JS client, we'll handle this differently
      results.errors.push('Please create _migrations table manually in Supabase SQL Editor first');
      return NextResponse.json({
        success: false,
        message: 'Migrations table needs to be created first. Run this in Supabase SQL Editor:',
        sql: createTableSQL,
        ...results,
      }, { status: 400 });
    }

    // Step 2: Get applied migrations
    const { data: appliedMigrations } = await supabase
      .from('_migrations')
      .select('version')
      .order('version', { ascending: true });

    const appliedVersions = new Set(appliedMigrations?.map((m) => m.version) || []);

    // Step 3: Find pending migrations
    const pendingMigrations = migrations.filter((m) => !appliedVersions.has(m.version));

    if (pendingMigrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All migrations already applied',
        ...results,
      });
    }

    // Step 4: Return SQL for pending migrations (user runs in Supabase)
    const pendingSql = pendingMigrations.map((m) => ({
      version: m.version,
      name: m.name,
      sql: m.sql,
    }));

    return NextResponse.json({
      success: true,
      message: 'Pending migrations found. Run the SQL below in Supabase SQL Editor, then call POST /api/migrate/confirm',
      pending: pendingSql,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...results,
    }, { status: 500 });
  }
}
