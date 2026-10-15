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
const down = await readFile(
  new URL('../migrations/0001_down.sql', import.meta.url),
  'utf8',
);

beforeAll(async () => {
  await pool.query(up);
});
afterAll(async () => {
  await pool.end();
});

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
    const sourceId = uuidv7();
    const recordId = uuidv7();
    const rawId = uuidv7();
    await pool.query('INSERT INTO identity.person(id) VALUES ($1)', [personId]);
    await pool.query(
      'INSERT INTO source.source(id,person_id,connector_id) VALUES ($1,$2,$3)',
      [sourceId, personId, 'raw-test'],
    );
    await pool.query(
      'INSERT INTO source.record(id,person_id,source_id,external_record_id) VALUES ($1,$2,$3,$4)',
      [recordId, personId, sourceId, 'one'],
    );
    await pool.query(
      'INSERT INTO source.raw_record(id,person_id,record_id,version,operation,payload,content_hash,recorded_at) VALUES ($1,$2,$3,1,$4,$5,$6,$7)',
      [
        rawId,
        personId,
        recordId,
        'upsert',
        '{}',
        'hash',
        '2026-01-01T00:00:00Z',
      ],
    );
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
    await pool.query(down);
    await pool.query(up);
    expect(
      (await pool.query("SELECT to_regclass('health.fact') AS table_name"))
        .rows[0]?.table_name,
    ).toBe('health.fact');
  });
});
