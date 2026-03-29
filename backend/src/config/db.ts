import { Pool, QueryResult, QueryResultRow } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const result: QueryResult<T> = await pool.query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function queryMany<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result: QueryResult<T> = await pool.query<T>(text, params);
  return result.rows;
}

export async function connectDB(): Promise<void> {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    console.log(`✓ Database connected at ${result.rows[0].now}`);
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    throw err;
  }
}

export default pool;
