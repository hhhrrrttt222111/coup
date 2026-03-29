import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: true } : false,
  max: 2,
  connectionTimeoutMillis: 10000,
});

async function migrate(): Promise<void> {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`✗ schema.sql not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Connecting to database…');
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT NOW() AS now');
    console.log(`✓ Connected at ${result.rows[0].now}\n`);

    console.log('Running schema.sql…');
    await client.query(sql);
    console.log('✓ Schema applied successfully');
  } catch (err) {
    console.error('✗ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
