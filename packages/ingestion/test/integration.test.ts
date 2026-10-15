import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { Pool, uuidv7, withPerson } from '@myphisys/database';
import { conceptIds } from '@myphisys/health-core';
import { ingest, type SourceRecord } from '../src/index.js';
import { goldenRecords } from './golden.js';

if (!process.env.DATABASE_URL || process.env.M1_DISPOSABLE_DB !== '1')
  throw new Error(
    'DB integration tests require DATABASE_URL and M1_DISPOSABLE_DB=1',
  );

const admin = new Pool({ connectionString: process.env.DATABASE_URL });
const appUrl = new URL(process.env.DATABASE_URL);
appUrl.username = 'myphisys_m1_test';
appUrl.password = '';
const app = new Pool({ connectionString: appUrl.toString() });
const personId = uuidv7();
const otherPersonId = uuidv7();
const goldenPersonId = uuidv7();

beforeAll(async () => {
  await admin.query(
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='myphisys_m1_test') THEN CREATE ROLE myphisys_m1_test LOGIN; END IF; END $$",
  );
  await admin.query('GRANT myphisys_domain TO myphisys_m1_test');
  await admin.query('INSERT INTO identity.person(id) VALUES ($1),($2),($3)', [
    personId,
    otherPersonId,
    goldenPersonId,
  ]);
});
afterAll(async () => {
  await app.end();
  await admin.end();
});

function measurement(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    personId,
    connectorId: 'manual',
    externalRecordId: 'weight-1',
    version: 1,
    operation: 'upsert',
    recordedAt: '2026-01-01T12:00:00Z',
    eventKey: 'event-weight-1',
    payload: {
      conceptId: 'weight',
      kind: 'observation',
      value: { kind: 'quantity', originalValue: 72, originalUnit: 'kg' },
      effective: { kind: 'local_date', value: '2026-01-01' },
    },
    ...overrides,
  };
}

describe('M1 ingestion contract', () => {
  test('DB concept registry matches the canonical allowlist', async () => {
    const concepts = await withPerson(app, personId, (db) =>
      db.query('SELECT id FROM health.concept ORDER BY id'),
    );
    expect(concepts.rows.map((row: { id: string }) => row.id)).toEqual(
      [...conceptIds].sort(),
    );
  });

  test('retry, version correction, multi-source support and tombstones', async () => {
    const first = await ingest(app, measurement());
    expect(first.state).toBe('imported');
    expect(await ingest(app, measurement())).toEqual({
      state: 'duplicate',
      rawId: first.rawId,
    });
    const corrected = await ingest(
      app,
      measurement({
        version: 2,
        payload: {
          ...measurement().payload,
          value: { kind: 'quantity', originalValue: 73, originalUnit: 'kg' },
        },
      }),
    );
    expect(corrected.state).toBe('imported');
    if (corrected.state !== 'imported')
      throw new Error('Expected corrected fact');
    const support = await ingest(
      app,
      measurement({
        connectorId: 'synthetic-device',
        externalRecordId: 'same-event',
        payload: {
          ...measurement().payload,
          value: { kind: 'quantity', originalValue: 73, originalUnit: 'kg' },
        },
      }),
    );
    expect(support.state).toBe('duplicate');
    const deleteA = await ingest(
      app,
      measurement({ version: 3, operation: 'delete', payload: {} }),
    );
    expect(deleteA.state).toBe('imported');
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE state='current' AND event_key='event-weight-1'",
          ),
        )
      ).rowCount,
    ).toBe(1);
    const deleteB = await ingest(
      app,
      measurement({
        connectorId: 'synthetic-device',
        externalRecordId: 'same-event',
        version: 2,
        operation: 'delete',
        payload: {},
      }),
    );
    expect(deleteB.state).toBe('imported');
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE state='current' AND event_key='event-weight-1'",
          ),
        )
      ).rowCount,
    ).toBe(0);
    const trace = await withPerson(app, personId, (db) =>
      db.query(
        `SELECT f.id FROM health.fact f JOIN health.provenance p ON p.fact_id=f.id AND p.person_id=f.person_id JOIN source.raw_record r ON r.id=p.raw_id AND r.person_id=p.person_id WHERE f.id=$1`,
        [corrected.factId],
      ),
    );
    expect(trace.rowCount).toBeGreaterThan(0);
  });

  test('default event keys keep delimiter-containing source identities separate', async () => {
    const a = measurement({
      connectorId: 'collision:a',
      externalRecordId: 'b',
    });
    const b = measurement({
      connectorId: 'collision',
      externalRecordId: 'a:b',
    });
    delete a.eventKey;
    delete b.eventKey;
    expect((await ingest(app, a)).state).toBe('imported');
    expect((await ingest(app, b)).state).toBe('imported');
    const facts = await withPerson(app, personId, (db) =>
      db.query(
        "SELECT event_key FROM health.fact WHERE state='current' AND event_key IN ($1,$2)",
        [
          JSON.stringify(['collision:a', 'b']),
          JSON.stringify(['collision', 'a:b']),
        ],
      ),
    );
    expect(
      facts.rows.map((row: { event_key: string }) => row.event_key).sort(),
    ).toEqual(
      [
        JSON.stringify(['collision:a', 'b']),
        JSON.stringify(['collision', 'a:b']),
      ].sort(),
    );
  });

  test('sole surviving supporting source can correct a deleted origin', async () => {
    const a = measurement({
      connectorId: 'handoff-a',
      externalRecordId: 'origin',
      eventKey: 'handoff-correction',
    });
    const b = measurement({
      connectorId: 'handoff-b',
      externalRecordId: 'support',
      eventKey: 'handoff-correction',
    });
    const first = await ingest(app, a);
    expect(first.state).toBe('imported');
    if (first.state !== 'imported' || !first.factId)
      throw new Error('Expected origin fact');
    expect((await ingest(app, b)).state).toBe('duplicate');
    expect(
      (
        await ingest(app, {
          ...a,
          version: 2,
          operation: 'delete',
          payload: {},
        })
      ).state,
    ).toBe('imported');
    const corrected = await ingest(app, {
      ...b,
      version: 2,
      payload: {
        ...b.payload,
        value: { kind: 'quantity', originalValue: 73, originalUnit: 'kg' },
      },
    });
    expect(corrected.state).toBe('imported');
    const facts = await withPerson(app, personId, (db) =>
      db.query(
        "SELECT id, state, supersedes_id, value FROM health.fact WHERE event_key='handoff-correction'",
      ),
    );
    expect(facts.rows).toHaveLength(2);
    expect(
      facts.rows.find((row: { id: string }) => row.id === first.factId)?.state,
    ).toBe('superseded');
    expect(
      facts.rows.find((row: { state: string }) => row.state === 'current'),
    ).toMatchObject({
      supersedes_id: first.factId,
      value: { canonicalValue: 73 },
    });
  });

  test('equivalent canonical quantities from different units add support', async () => {
    const kg = measurement({
      connectorId: 'unit-kg',
      externalRecordId: 'measurement',
      eventKey: 'equivalent-units',
      payload: {
        ...measurement().payload,
        value: {
          kind: 'quantity',
          originalValue: 72.5747792,
          originalUnit: 'kg',
        },
      },
    });
    const lb = measurement({
      connectorId: 'unit-lb',
      externalRecordId: 'measurement',
      eventKey: 'equivalent-units',
      payload: {
        ...measurement().payload,
        value: { kind: 'quantity', originalValue: 160, originalUnit: 'lb' },
      },
    });
    expect((await ingest(app, kg)).state).toBe('imported');
    expect((await ingest(app, lb)).state).toBe('duplicate');
    const result = await withPerson(app, personId, (db) =>
      db.query(
        "SELECT (SELECT count(*)::int FROM health.fact WHERE event_key='equivalent-units') AS facts, (SELECT count(*)::int FROM health.provenance p JOIN health.fact f ON f.id=p.fact_id WHERE f.event_key='equivalent-units') AS sources, (SELECT count(*)::int FROM health.conflict WHERE event_key='equivalent-units') AS conflicts",
      ),
    );
    expect(result.rows[0]).toMatchObject({
      facts: 1,
      sources: 2,
      conflicts: 0,
    });
  });

  test('conflict remains unresolved; malformed input is quarantined', async () => {
    await ingest(
      app,
      measurement({
        externalRecordId: 'conflict-a',
        eventKey: 'event-conflict',
      }),
    );
    const conflict = await ingest(
      app,
      measurement({
        connectorId: 'synthetic-device',
        externalRecordId: 'conflict-b',
        eventKey: 'event-conflict',
        payload: {
          ...measurement().payload,
          value: { kind: 'quantity', originalValue: 80, originalUnit: 'kg' },
        },
      }),
    );
    expect(conflict).toMatchObject({
      state: 'needs_review',
      reason: 'value_conflict',
    });
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.conflict WHERE state='unresolved' AND event_key='event-conflict'",
          ),
        )
      ).rowCount,
    ).toBe(1);
    const bad = await ingest(
      app,
      measurement({
        externalRecordId: 'unknown-concept',
        payload: { ...measurement().payload, conceptId: 'invented_diagnosis' },
      }),
    );
    expect(bad).toMatchObject({
      state: 'quarantined',
      reason: 'unknown_concept',
    });
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query('SELECT id FROM source.quarantine WHERE raw_id=$1', [
            bad.rawId,
          ]),
        )
      ).rowCount,
    ).toBe(1);
  });

  test('concurrent records for one event retain both Raw claims and one unresolved conflict', async () => {
    const [a, b] = await Promise.all([
      ingest(
        app,
        measurement({
          connectorId: 'race-a',
          externalRecordId: 'a',
          eventKey: 'concurrent-event',
        }),
      ),
      ingest(
        app,
        measurement({
          connectorId: 'race-b',
          externalRecordId: 'b',
          eventKey: 'concurrent-event',
          payload: {
            ...measurement().payload,
            value: { kind: 'quantity', originalValue: 81, originalUnit: 'kg' },
          },
        }),
      ),
    ]);
    expect([a.state, b.state].sort()).toEqual(['imported', 'needs_review']);
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE event_key='concurrent-event' AND state='current'",
          ),
        )
      ).rowCount,
    ).toBe(1);
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.conflict WHERE event_key='concurrent-event' AND state='unresolved'",
          ),
        )
      ).rowCount,
    ).toBe(1);
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query('SELECT id FROM source.raw_record WHERE id IN ($1,$2)', [
            a.rawId,
            b.rawId,
          ]),
        )
      ).rowCount,
    ).toBe(2);
  });

  test('source identity pins event key across versions and rejects out-of-range versions', async () => {
    const first = measurement({
      externalRecordId: 'pinned-record',
      eventKey: 'pinned-original',
    });
    expect((await ingest(app, first)).state).toBe('imported');
    const changed = await ingest(app, {
      ...first,
      version: 2,
      eventKey: 'pinned-new',
    });
    expect(changed).toMatchObject({
      state: 'quarantined',
      reason: 'event_key_changed',
    });
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE event_key='pinned-original' AND state='current'",
          ),
        )
      ).rowCount,
    ).toBe(1);
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE event_key='pinned-new' AND state='current'",
          ),
        )
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await ingest(app, {
          ...first,
          version: 3,
          operation: 'delete',
          payload: {},
        })
      ).state,
    ).toBe('imported');
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE event_key='pinned-original' AND state='current'",
          ),
        )
      ).rowCount,
    ).toBe(0);
    await expect(
      ingest(app, measurement({ version: 2_147_483_648 })),
    ).rejects.toMatchObject({ code: 'invalid_identity' });
  });

  test('a supported fact is not silently superseded when another source still supports it', async () => {
    const first = measurement({
      externalRecordId: 'shared-a',
      eventKey: 'shared-update',
    });
    expect((await ingest(app, first)).state).toBe('imported');
    expect(
      (
        await ingest(
          app,
          measurement({
            connectorId: 'synthetic-device',
            externalRecordId: 'shared-b',
            eventKey: 'shared-update',
          }),
        )
      ).state,
    ).toBe('duplicate');
    const update = await ingest(
      app,
      measurement({
        externalRecordId: 'shared-a',
        eventKey: 'shared-update',
        version: 2,
        payload: {
          ...first.payload,
          value: { kind: 'quantity', originalValue: 75, originalUnit: 'kg' },
        },
      }),
    );
    expect(update).toMatchObject({
      state: 'needs_review',
      reason: 'value_conflict',
    });
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE event_key='shared-update' AND state='current'",
          ),
        )
      ).rowCount,
    ).toBe(1);
    const semantic = await ingest(
      app,
      measurement({
        connectorId: 'synthetic-device-c',
        externalRecordId: 'different-concept',
        eventKey: 'shared-update',
        payload: {
          conceptId: 'heart_rate',
          kind: 'observation',
          value: { kind: 'quantity', originalValue: 72, originalUnit: '/min' },
          effective: first.payload.effective!,
        },
      }),
    );
    expect(semantic).toMatchObject({
      state: 'needs_review',
      reason: 'semantic_conflict',
    });
  });

  test('quarantined correction does not revoke the last accepted supporting source', async () => {
    const a = measurement({
      externalRecordId: 'support-a',
      eventKey: 'quarantine-support',
    });
    const b = measurement({
      connectorId: 'synthetic-device',
      externalRecordId: 'support-b',
      eventKey: 'quarantine-support',
    });
    expect((await ingest(app, a)).state).toBe('imported');
    expect((await ingest(app, b)).state).toBe('duplicate');
    const badUpdate = await ingest(app, {
      ...b,
      version: 2,
      payload: {
        ...b.payload,
        value: {
          kind: 'quantity',
          originalValue: 100,
          originalUnit: 'unsupported',
        },
      },
    });
    expect(badUpdate.state).toBe('quarantined');
    expect(
      (
        await ingest(app, {
          ...a,
          version: 2,
          operation: 'delete',
          payload: {},
        })
      ).state,
    ).toBe('imported');
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE event_key='quarantine-support' AND state='current'",
          ),
        )
      ).rowCount,
    ).toBe(1);
    expect(
      (
        await ingest(app, {
          ...b,
          version: 3,
          operation: 'delete',
          payload: {},
        })
      ).state,
    ).toBe('imported');
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM health.fact WHERE event_key='quarantine-support' AND state='current'",
          ),
        )
      ).rowCount,
    ).toBe(0);
  });

  test('invalid time is retained in Raw and quarantined; same-version collision is reviewable', async () => {
    const invalid = await ingest(
      app,
      measurement({
        externalRecordId: 'bad-time',
        recordedAt: '2026-02-30T12:00:00Z',
      }),
    );
    expect(invalid).toMatchObject({
      state: 'quarantined',
      reason: 'invalid_time',
    });
    const raw = await withPerson(app, personId, (db) =>
      db.query(
        "SELECT payload->>'recordedAt' AS original_time, recorded_at FROM source.raw_record WHERE id=$1",
        [invalid.rawId],
      ),
    );
    expect(raw.rows[0]).toMatchObject({
      original_time: '2026-02-30T12:00:00Z',
      recorded_at: null,
    });
    const first = await ingest(
      app,
      measurement({ externalRecordId: 'collision' }),
    );
    expect(first.state).toBe('imported');
    const collision = await ingest(
      app,
      measurement({
        externalRecordId: 'collision',
        payload: {
          ...measurement().payload,
          value: { kind: 'quantity', originalValue: 81, originalUnit: 'kg' },
        },
      }),
    );
    expect(collision).toMatchObject({
      state: 'needs_review',
      reason: 'version_collision',
    });
  });

  test('person scope hides another patient and failed transaction leaves no outbox row', async () => {
    const other = await ingest(
      app,
      measurement({
        personId: otherPersonId,
        externalRecordId: 'other-person',
      }),
    );
    expect(other.state).toBe('imported');
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query('SELECT id FROM health.fact WHERE person_id=$1', [
            otherPersonId,
          ]),
        )
      ).rowCount,
    ).toBe(0);
    await expect(
      withPerson(app, personId, async (db) => {
        await db.query(
          'INSERT INTO jobs.outbox(id,person_id,event_key,type,ref_id) VALUES ($1,$2,$3,$4,$5)',
          [uuidv7(), personId, 'forced-rollback', 'test', uuidv7()],
        );
        throw new Error('forced failure');
      }),
    ).rejects.toThrow('forced failure');
    expect(
      (
        await withPerson(app, personId, (db) =>
          db.query(
            "SELECT id FROM jobs.outbox WHERE event_key='forced-rollback'",
          ),
        )
      ).rowCount,
    ).toBe(0);
  });

  test('golden import is reproducible and preserves missing week, source transition and conflict', async () => {
    const records = goldenRecords(goldenPersonId);
    for (const record of records) await ingest(app, record);
    const before = await withPerson(app, goldenPersonId, (db) =>
      db.query('SELECT count(*)::int AS count FROM health.fact'),
    );
    for (const record of records)
      expect((await ingest(app, record)).state).toBe('duplicate');
    const after = await withPerson(app, goldenPersonId, (db) =>
      db.query('SELECT count(*)::int AS count FROM health.fact'),
    );
    expect(after.rows[0]?.count).toBe(before.rows[0]?.count);
    expect(
      (
        await withPerson(app, goldenPersonId, (db) =>
          db.query("SELECT id FROM health.conflict WHERE state='unresolved'"),
        )
      ).rowCount,
    ).toBe(1);
  }, 120_000);
});
