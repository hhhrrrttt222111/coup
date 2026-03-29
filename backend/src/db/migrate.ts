import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import pool from '../config/db';

// ---------------------------------------------------------------------------
// Migration record
// ---------------------------------------------------------------------------

interface MigrationRecord {
  id: number;
  name: string;
  applied_at: Date;
}

// ---------------------------------------------------------------------------
// Ensure the migrations tracking table exists
// ---------------------------------------------------------------------------

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id          SERIAL PRIMARY KEY,
      name        TEXT UNIQUE NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ---------------------------------------------------------------------------
// Discover migration files on disk
// ---------------------------------------------------------------------------

interface MigrationFile {
  name: string;
  upPath: string;
  downPath: string;
}

function discoverMigrations(): MigrationFile[] {
  const dir = path.join(__dirname, '..', '..', 'migrations');
  if (!fs.existsSync(dir)) {
    console.log('No migrations/ directory found');
    return [];
  }

  const upFiles = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.up.sql'))
    .sort();

  return upFiles.map((upFile) => {
    const name = upFile.replace('.up.sql', '');
    return {
      name,
      upPath: path.join(dir, upFile),
      downPath: path.join(dir, `${name}.down.sql`),
    };
  });
}

// ---------------------------------------------------------------------------
// Get already-applied migrations
// ---------------------------------------------------------------------------

async function getApplied(): Promise<Set<string>> {
  const { rows } = await pool.query<MigrationRecord>(
    'SELECT name FROM migrations ORDER BY id',
  );
  return new Set(rows.map((r) => r.name));
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function up(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getApplied();
  const all = discoverMigrations();
  const pending = all.filter((m) => !applied.has(m.name));

  if (pending.length === 0) {
    console.log('✓ All migrations are up to date');
    return;
  }

  for (const m of pending) {
    const sql = fs.readFileSync(m.upPath, 'utf-8');
    console.log(`↑ Applying: ${m.name}`);
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [m.name]);
      await pool.query('COMMIT');
      console.log(`  ✓ ${m.name} applied`);
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error(`  ✗ ${m.name} failed:`, err);
      throw err;
    }
  }

  console.log(`\n✓ ${pending.length} migration(s) applied`);
}

async function down(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getApplied();
  const all = discoverMigrations();

  const lastApplied = [...all].reverse().find((m) => applied.has(m.name));
  if (!lastApplied) {
    console.log('✓ Nothing to roll back');
    return;
  }

  if (!fs.existsSync(lastApplied.downPath)) {
    console.error(`✗ No down migration found: ${lastApplied.downPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(lastApplied.downPath, 'utf-8');
  console.log(`↓ Rolling back: ${lastApplied.name}`);
  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('DELETE FROM migrations WHERE name = $1', [lastApplied.name]);
    await pool.query('COMMIT');
    console.log(`  ✓ ${lastApplied.name} rolled back`);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(`  ✗ ${lastApplied.name} rollback failed:`, err);
    throw err;
  }
}

async function status(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getApplied();
  const all = discoverMigrations();

  console.log('Migration status:\n');
  for (const m of all) {
    const mark = applied.has(m.name) ? '✓' : '○';
    console.log(`  ${mark}  ${m.name}`);
  }
  console.log(`\n${applied.size}/${all.length} applied`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'up';

  try {
    switch (command) {
      case 'up':
        await up();
        break;
      case 'down':
        await down();
        break;
      case 'status':
        await status();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Usage: migrate [up|down|status]');
        process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
