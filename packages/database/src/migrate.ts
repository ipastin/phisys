import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

const direction = process.argv[2];
if (direction !== 'up' && direction !== 'down')
  throw new Error('Usage: migrate up|down');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (direction === 'down' && process.env.M1_DISPOSABLE_DB !== '1')
  throw new Error('Down migration requires M1_DISPOSABLE_DB=1');

const sql = await readFile(
  new URL(`../migrations/0001_${direction}.sql`, import.meta.url),
  'utf8',
);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(sql);
} finally {
  await pool.end();
}
