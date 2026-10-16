import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

const direction = process.argv[2];
if (direction !== 'up' && direction !== 'down')
  throw new Error('Usage: migrate up|down');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (direction === 'down' && process.env.M1_DISPOSABLE_DB !== '1')
  throw new Error('Down migration requires M1_DISPOSABLE_DB=1');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  for (const version of direction === 'up'
    ? ['0001', '0002']
    : ['0002', '0001']) {
    const applied =
      version === '0001'
        ? (await pool.query("SELECT to_regclass('health.fact') AS present"))
            .rows[0]?.present !== null
        : (
            await pool.query(
              "SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='health' AND tablename='fact' AND policyname='person_scope_analytics') AS present",
            )
          ).rows[0]?.present === true;
    if (applied !== (direction === 'down')) continue;
    // shortcut: schema sentinels cover the two known migrations; add a ledger before partial or concurrent upgrades.
    const sql = await readFile(
      new URL(`../migrations/${version}_${direction}.sql`, import.meta.url),
      'utf8',
    );
    await pool.query(sql);
  }
} finally {
  await pool.end();
}
