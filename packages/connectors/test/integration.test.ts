import { Pool, uuidv7, withPerson } from '@myphisys/database';
import { ingest } from '@myphisys/ingestion';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { manualRecords } from '../src/index.js';

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
const base = {
  personId,
  externalRecordId: 'manual-entry',
  version: 1,
  recordedAt: '2026-02-01T12:00:00Z',
  effective: { kind: 'local_date' as const, value: '2026-02-01' },
};

beforeAll(async () => {
  await admin.query('INSERT INTO identity.person(id) VALUES ($1)', [personId]);
});
afterAll(async () => {
  await app.end();
  await admin.end();
});

test('manual weight, BP, observation and symptom all pass through Raw and provenance', async () => {
  const inputs = [
    {
      ...base,
      externalRecordId: 'weight',
      type: 'weight' as const,
      value: 160,
      unit: 'lb' as const,
    },
    {
      ...base,
      externalRecordId: 'bp',
      eventKey: 'bp-event',
      type: 'blood_pressure' as const,
      systolic: 120,
      diastolic: 80,
      unit: 'mm[Hg]' as const,
    },
    {
      ...base,
      externalRecordId: 'temp',
      type: 'observation' as const,
      conceptId: 'body_temperature' as const,
      value: 98.6,
      unit: '[degF]',
    },
    {
      ...base,
      externalRecordId: 'symptom',
      type: 'symptom' as const,
      status: 'unknown' as const,
    },
  ];
  for (const input of inputs)
    for (const record of manualRecords(input))
      expect((await ingest(app, record)).state).toBe('imported');
  const facts = await withPerson(app, personId, (db) =>
    db.query('SELECT concept_id, value FROM health.fact ORDER BY concept_id'),
  );
  expect(
    facts.rows.map((row: { concept_id: string }) => row.concept_id),
  ).toEqual([
    'body_temperature',
    'diastolic_bp',
    'symptom',
    'systolic_bp',
    'weight',
  ]);
  expect(
    facts.rows.find(
      (row: { concept_id: string }) => row.concept_id === 'weight',
    )?.value,
  ).toMatchObject({
    originalValue: 160,
    originalUnit: 'lb',
    canonicalUnit: 'kg',
  });
  expect(
    (
      await withPerson(app, personId, (db) =>
        db.query('SELECT count(*)::int AS count FROM health.provenance'),
      )
    ).rows[0]?.count,
  ).toBe(5);
  const deletions = manualRecords({
    ...base,
    externalRecordId: 'bp',
    eventKey: 'bp-event',
    version: 2,
    type: 'delete',
    recordType: 'blood_pressure',
  });
  for (const record of deletions)
    expect((await ingest(app, record)).state).toBe('imported');
  expect(
    (
      await withPerson(app, personId, (db) =>
        db.query(
          "SELECT id FROM health.fact WHERE state='current' AND concept_id IN ('systolic_bp','diastolic_bp')",
        ),
      )
    ).rowCount,
  ).toBe(0);
});

test('unsupported manual observation is quarantined after Raw capture', async () => {
  const [record] = manualRecords({
    ...base,
    externalRecordId: 'unsupported',
    type: 'observation',
    conceptId: 'glucose',
    value: 100,
    unit: 'mg/dL',
  });
  if (!record) throw new Error('Missing manual record');
  const result = await ingest(app, record);
  expect(result).toMatchObject({
    state: 'quarantined',
    reason: 'unsupported_unit',
  });
  expect(
    (
      await withPerson(app, personId, (db) =>
        db.query('SELECT id FROM source.raw_record WHERE id=$1', [
          result.rawId,
        ]),
      )
    ).rowCount,
  ).toBe(1);
});
