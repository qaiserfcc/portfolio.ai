/**
 * Database Migration Script
 * Tracks and executes incremental schema changes.
 */

import { getPool } from './connection';
import { initializeDatabase } from './init';

interface Migration {
  id: string;
  description: string;
  up: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    id: '001_initial_schema',
    description: 'Ensure base tables exist',
    up: async () => {
      const initialized = await initializeDatabase();
      if (!initialized) {
        throw new Error('Failed to initialize base schema');
      }
    },
  },
  // Add future migrations here.
];

async function ensureMigrationsTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(255) PRIMARY KEY,
      description TEXT NOT NULL,
      ran_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function hasMigrationRun(id: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query('SELECT 1 FROM schema_migrations WHERE id = $1 LIMIT 1;', [id]);
  return (result.rowCount ?? 0) > 0;
}

async function markMigrationRan(id: string, description: string) {
  const pool = getPool();
  await pool.query(
    'INSERT INTO schema_migrations (id, description) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING;',
    [id, description],
  );
}

export async function runMigrations() {
  const pool = getPool();

  try {
    await ensureMigrationsTable();

    for (const migration of migrations) {
      const alreadyRan = await hasMigrationRun(migration.id);
      if (alreadyRan) {
        console.log(`Skipping migration ${migration.id} – already applied.`);
        continue;
      }

      console.log(`Running migration ${migration.id}: ${migration.description}`);
      await migration.up();
      await markMigrationRan(migration.id, migration.description);
      console.log(`✅ Migration ${migration.id} completed.`);
    }

    console.log('All migrations up to date.');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
