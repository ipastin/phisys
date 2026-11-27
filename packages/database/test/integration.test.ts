import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { beforeAll, afterAll, describe, expect, test } from 'vitest';
import { uuidv7 } from '../src/index.js';

if (!process.env.DATABASE_URL || process.env.M1_DISPOSABLE_DB !== '1')
  throw new Error(
    'DB integration tests require DATABASE_URL and M1_DISPOSABLE_DB=1',
  );

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const up = await readFile(
  new URL('../migrations/0001_up.sql', import.meta.url),
  'utf8',
);
const analyticsUp = await readFile(
  new URL('../migrations/0002_up.sql', import.meta.url),
  'utf8',
);
const verificationUp = await readFile(
  new URL('../migrations/0003_up.sql', import.meta.url),
  'utf8',
);
const down = await readFile(
  new URL('../migrations/0001_down.sql', import.meta.url),
  'utf8',
);
const analyticsDown = await readFile(
  new URL('../migrations/0002_down.sql', import.meta.url),
  'utf8',
);
const verificationDown = await readFile(
  new URL('../migrations/0003_down.sql', import.meta.url),
  'utf8',
);

async function migrateAsOwner(...migrations: string[]) {
  const client = await pool.connect();
  try {
    await client.query('SET ROLE myphisys_test_migration_owner');
    for (const migration of migrations) await client.query(migration);
  } finally {
    client.release(true);
  }
}

beforeAll(async () => {
  await pool.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'myphisys_test_migration_owner') THEN
      CREATE ROLE myphisys_test_migration_owner NOLOGIN CREATEROLE NOSUPERUSER NOBYPASSRLS;
    END IF;
    EXECUTE format('GRANT CREATE ON DATABASE %I TO myphisys_test_migration_owner', current_database());
  END $$`);
  await migrateAsOwner(up, analyticsUp, verificationUp);
});
afterAll(async () => {
  await pool.end();
});

async function seedRaw(personId: string, connectorId: string) {
  const sourceId = uuidv7();
  const recordId = uuidv7();
  const rawId = uuidv7();
  await pool.query('INSERT INTO identity.person(id) VALUES ($1)', [personId]);
  await pool.query(
    'INSERT INTO source.source(id,person_id,connector_id) VALUES ($1,$2,$3)',
    [sourceId, personId, connectorId],
  );
  await pool.query(
    'INSERT INTO source.record(id,person_id,source_id,external_record_id) VALUES ($1,$2,$3,$4)',
    [recordId, personId, sourceId, 'one'],
  );
  await pool.query(
    'INSERT INTO source.raw_record(id,person_id,record_id,version,operation,payload,content_hash,recorded_at) VALUES ($1,$2,$3,1,$4,$5,$6,$7)',
    [rawId, personId, recordId, 'upsert', '{}', 'hash', '2026-01-01T00:00:00Z'],
  );
  return rawId;
}

describe('M1 PostgreSQL foundation', () => {
  test('RLS isolates people and connector cannot write clinical tables', async () => {
    const a = uuidv7();
    const b = uuidv7();
    const sourceA = uuidv7();
    const sourceB = uuidv7();
    await pool.query('INSERT INTO identity.person(id) VALUES ($1),($2)', [
      a,
      b,
    ]);
    await pool.query(
      'INSERT INTO source.source(id,person_id,connector_id) VALUES ($1,$2,$3),($4,$5,$6)',
      [sourceA, a, 'test-a', sourceB, b, 'test-b'],
    );
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL ROLE myphisys_connector');
      await client.query("SELECT set_config('app.person_id',$1,true)", [a]);
      const visible = await client.query('SELECT id FROM source.source');
      expect(visible.rows.map((r: { id: string }) => r.id)).toEqual([sourceA]);
      await expect(
        client.query('INSERT INTO health.fact(id) VALUES ($1)', [uuidv7()]),
      ).rejects.toMatchObject({ code: '42501' });
      await client.query('ROLLBACK');
      await client.query('BEGIN');
      await client.query('SET LOCAL ROLE myphisys_connector');
      await client.query("SELECT set_config('app.person_id',$1,true)", [a]);
      await expect(
        client.query(
          'INSERT INTO source.source(id,person_id,connector_id) VALUES ($1,$2,$3)',
          [uuidv7(), b, 'forbidden'],
        ),
      ).rejects.toMatchObject({ code: '42501' });
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  test('Raw is immutable and fact provenance is required', async () => {
    const personId = uuidv7();
    const rawId = await seedRaw(personId, 'raw-test');
    await expect(
      pool.query('UPDATE source.raw_record SET payload=$1 WHERE id=$2', [
        '{}',
        rawId,
      ]),
    ).rejects.toThrow('immutable');
    await expect(
      pool.query(
        'INSERT INTO health.fact(id,person_id,concept_id,kind,value,effective,recorded_at,epistemic,verification,state,event_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        [
          uuidv7(),
          personId,
          'weight',
          'observation',
          '{}',
          '{}',
          '2026-01-01T00:00:00Z',
          'source_recorded',
          'unverified',
          'current',
          'missing-provenance',
        ],
      ),
    ).rejects.toMatchObject({ code: '23502' });
  });

  test('verification down resets audited facts under an owner without BYPASSRLS', async () => {
    const personId = uuidv7();
    const rawId = await seedRaw(personId, 'manual');
    const confirmedId = uuidv7();
    const priorId = uuidv7();
    await pool.query(
      `INSERT INTO health.fact (id, person_id, concept_id, kind, value, effective, recorded_at,
          epistemic, verification, state, origin_raw_id)
       SELECT id, $3, 'sleep_duration', 'observation', '{"kind":"quantity","originalValue":8,"originalUnit":"h"}'::jsonb,
          jsonb_build_object('kind', 'local_date', 'value', day), '2026-01-02T12:00:00Z'::timestamptz,
          'user_reported', 'user_verified', 'current', $4
       FROM (VALUES ($1::uuid, '2026-01-01'), ($2::uuid, '2026-01-02')) AS fixture(id, day)`,
      [confirmedId, priorId, personId, rawId],
    );
    await pool.query(
      `INSERT INTO health.sleep_verification_event (person_id, fact_id, from_revision, issuer,
          subject, action, policy_version, revision_fingerprint, supports)
       VALUES ($1, $2, 0, 'https://fixture.example/auth/v1', $3, 'confirm', 'fixture', 'fixture', '[]')`,
      [personId, confirmedId, uuidv7()],
    );

    await migrateAsOwner(verificationDown);
    try {
      const facts = await pool.query(
        'SELECT id, verification, origin_raw_id FROM health.fact WHERE id = ANY($1::uuid[])',
        [[confirmedId, priorId]],
      );
      expect(facts.rows).toEqual(
        expect.arrayContaining([
          { id: confirmedId, verification: 'unverified', origin_raw_id: rawId },
          { id: priorId, verification: 'user_verified', origin_raw_id: rawId },
        ]),
      );
      const schema =
        await pool.query(`SELECT relrowsecurity, relforcerowsecurity,
        to_regclass('health.sleep_verification_event') AS audit_table,
        has_table_privilege('myphisys_domain', 'health.fact', 'UPDATE') AS domain_update,
        has_column_privilege('myphisys_analytics', 'health.fact', 'verification', 'SELECT') AS analytics_read,
        has_column_privilege('myphisys_sleep_verifier', 'health.fact', 'verification', 'UPDATE') AS verifier_update
        FROM pg_class WHERE oid = 'health.fact'::regclass`);
      expect(schema.rows[0]).toEqual({
        relrowsecurity: true,
        relforcerowsecurity: true,
        audit_table: null,
        domain_update: true,
        analytics_read: true,
        verifier_update: false,
      });
    } finally {
      await migrateAsOwner(verificationUp);
    }
  });

  test('transaction rollback removes outbox writes; migration down and reapply works', async () => {
    const personId = uuidv7();
    await pool.query('INSERT INTO identity.person(id) VALUES ($1)', [personId]);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO jobs.outbox(id,person_id,event_key,type,ref_id) VALUES ($1,$2,$3,$4,$5)',
        [uuidv7(), personId, 'rollback-test', 'test', uuidv7()],
      );
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
    expect(
      (
        await pool.query('SELECT id FROM jobs.outbox WHERE event_key=$1', [
          'rollback-test',
        ])
      ).rowCount,
    ).toBe(0);
    await migrateAsOwner(verificationDown);
    expect(
      (
        await pool.query(
          "SELECT to_regclass('identity.person_owner') AS table_name",
        )
      ).rows[0]?.table_name,
    ).toBeNull();
    await migrateAsOwner(analyticsDown, down, up, analyticsUp, verificationUp);
    expect(
      (await pool.query("SELECT to_regclass('health.fact') AS table_name"))
        .rows[0]?.table_name,
    ).toBe('health.fact');
    expect(
      (await pool.query("SELECT to_regrole('myphisys_analytics') AS role_name"))
        .rows[0]?.role_name,
    ).toBe('myphisys_analytics');
    expect(
      (
        await pool.query(
          "SELECT to_regclass('health.sleep_verification_event') AS table_name",
        )
      ).rows[0]?.table_name,
    ).toBe('health.sleep_verification_event');
  });
});
