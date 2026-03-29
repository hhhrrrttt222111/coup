import 'dotenv/config';
import { Pool } from 'pg';

const dbName = process.env.DB_NAME || 'coup';

const adminPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'postgres',
});

async function createDatabase(): Promise<void> {
  const { rows } = await adminPool.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName],
  );

  if (rows.length > 0) {
    console.log(`✓ Database "${dbName}" already exists`);
  } else {
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✓ Database "${dbName}" created`);
  }
}

createDatabase()
  .catch((err) => {
    console.error('Failed to create database:', err.message);
    process.exit(1);
  })
  .finally(() => adminPool.end());
