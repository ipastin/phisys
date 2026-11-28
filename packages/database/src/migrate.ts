import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

const direction = process.argv[2];
if (direction !== 'up' && direction !== 'down')
  throw new Error('Usage: migrate up|down');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (direction === 'down' && process.env.M1_DISPOSABLE_DB !== '1')
  throw new Error('Down migration requires M1_DISPOSABLE_DB=1');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaSentinels = {
  '0001': "SELECT to_regclass('health.fact') IS NOT NULL AS present",
  '0002':
    "SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='health' AND tablename='fact' AND policyname='person_scope_analytics') AS present",
  '0003': "SELECT to_regclass('identity.person_owner') IS NOT NULL AS present",
};
try {
  const versions = ['0001', '0002', '0003'] as const;
  for (const version of direction === 'up'
    ? versions
    : [...versions].reverse()) {
    const result = await pool.query<{ present: boolean }>(
      schemaSentinels[version],
    );
    const applied = result.rows[0]?.present === true;
    if (applied !== (direction === 'down')) continue;
    // shortcut: schema sentinels cover the known migrations; add a ledger before partial or concurrent upgrades.
    const sql = await readFile(
      new URL(`../migrations/${version}_${direction}.sql`, import.meta.url),
      'utf8',
    );
    await pool.query(sql);
  }
} finally {
  await pool.end();
}
