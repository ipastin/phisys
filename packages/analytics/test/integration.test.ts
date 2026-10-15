import { afterAll, beforeAll, expect, test } from 'vitest';
import { Pool, readCurrentSleepFacts, uuidv7 } from '@myphisys/database';
import { ingest } from '@myphisys/ingestion';
import { goldenRecords } from '../../ingestion/test/golden.js';
import { sleepQuality, type QualityWindow } from '../src/index.js';

if (!process.env.DATABASE_URL || process.env.M1_DISPOSABLE_DB !== '1')
  throw new Error(
    'DB integration tests require DATABASE_URL and M1_DISPOSABLE_DB=1',
  );

const admin = new Pool({ connectionString: process.env.DATABASE_URL });
const writerUrl = new URL(process.env.DATABASE_URL);
writerUrl.username = 'myphisys_m2_writer';
writerUrl.password = '';
const readerUrl = new URL(process.env.DATABASE_URL);
readerUrl.username = 'myphisys_m2_reader';
readerUrl.password = '';
const writer = new Pool({ connectionString: writerUrl.toString() });
const reader = new Pool({ connectionString: readerUrl.toString() });
const personA = uuidv7();
const personB = uuidv7();
const window: QualityWindow = {
  startDate: '2026-01-01',
  endDateExclusive: '2026-04-01',
  asOfDate: '2026-04-01',
  calculatedAt: '2026-04-01T00:00:00Z',
};

beforeAll(async () => {
  await admin.query(
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='myphisys_m2_writer') THEN CREATE ROLE myphisys_m2_writer LOGIN; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='myphisys_m2_reader') THEN CREATE ROLE myphisys_m2_reader LOGIN; END IF; END $$",
  );
  await admin.query('GRANT myphisys_domain TO myphisys_m2_writer');
  await admin.query('GRANT myphisys_analytics TO myphisys_m2_reader');
  await admin.query('INSERT INTO identity.person(id) VALUES ($1),($2)', [
    personA,
    personB,
  ]);
  for (const record of goldenRecords(personA).filter(
    (item) => item.payload.conceptId === 'sleep_duration',
  ))
    expect((await ingest(writer, record)).state).toBe('imported');
  expect(
    (
      await ingest(writer, {
        ...goldenRecords(personB).find(
          (item) => item.payload.conceptId === 'sleep_duration',
        )!,
        externalRecordId: 'person-b-sleep',
      })
    ).state,
  ).toBe('imported');
}, 120_000);

afterAll(async () => {
  await Promise.all([reader.end(), writer.end(), admin.end()]);
});

test('person-scoped reader traces current facts to active Raw sources', async () => {
  const facts = await readCurrentSleepFacts(
    reader,
    personA,
    window.startDate,
    window.endDateExclusive,
  );
  expect(facts).toHaveLength(83);
  expect(facts.every((fact) => fact.supports.length === 1)).toBe(true);
  expect(new Set(facts.map((fact) => fact.supports[0]?.connectorId))).toEqual(
    new Set(['synthetic-device-a', 'synthetic-device-b']),
  );
  const quality = await sleepQuality(reader, personA, window);
  expect(quality.coverage.observedDays).toBe(83);
  expect(quality.missingDates).toHaveLength(7);
  expect(quality.sourceContinuity.status).toBe('transition');
  expect(quality.provenance.rawRecordIds).toHaveLength(83);
  expect(quality.provenance.supports).toHaveLength(83);
  expect(quality.provenance.supports[0]).toMatchObject({
    version: 1,
    transformation: 'm1-map-v1',
  });
  expect(quality.duplicateReceiptCount).toBe('unavailable');
  expect(await sleepQuality(reader, personA, window)).toEqual(quality);
});

test('exact retry cannot inflate canonical samples or provenance', async () => {
  const record = goldenRecords(personA).find(
    (item) => item.payload.conceptId === 'sleep_duration',
  )!;
  const before = await sleepQuality(reader, personA, window);
  expect((await ingest(writer, record)).state).toBe('duplicate');
  expect(await sleepQuality(reader, personA, window)).toEqual(before);
});

test('analytics role isolates persons and has no Raw or Canonical write privilege', async () => {
  const a = await sleepQuality(reader, personA, window);
  const b = await sleepQuality(reader, personB, window);
  expect(a.sampleCount).toBe(83);
  expect(b.sampleCount).toBe(1);
  expect(
    b.provenance.factIds.some((id) => a.provenance.factIds.includes(id)),
  ).toBe(false);

  const db = await reader.connect();
  try {
    await db.query('BEGIN');
    await db.query('SET LOCAL ROLE myphisys_analytics');
    await db.query("SELECT set_config('app.person_id', $1, true)", [personA]);
    expect(
      (
        await db.query('SELECT id FROM health.fact WHERE person_id=$1', [
          personB,
        ])
      ).rowCount,
    ).toBe(0);
    await expect(
      db.query(
        "UPDATE health.fact SET state='invalidated' WHERE person_id=$1",
        [personA],
      ),
    ).rejects.toMatchObject({ code: '42501' });
  } finally {
    await db.query('ROLLBACK');
    db.release();
  }
  const raw = await reader.connect();
  try {
    await raw.query('BEGIN');
    await raw.query('SET LOCAL ROLE myphisys_analytics');
    await raw.query("SELECT set_config('app.person_id', $1, true)", [personA]);
    await expect(
      raw.query('SELECT payload FROM source.raw_record WHERE person_id=$1', [
        personA,
      ]),
    ).rejects.toMatchObject({ code: '42501' });
    await raw.query('ROLLBACK');
    await raw.query('BEGIN');
    await raw.query('SET LOCAL ROLE myphisys_analytics');
    await raw.query("SELECT set_config('app.person_id', $1, true)", [personA]);
    await expect(
      raw.query('DELETE FROM source.raw_record WHERE person_id=$1', [personA]),
    ).rejects.toMatchObject({ code: '42501' });
  } finally {
    await raw.query('ROLLBACK');
    raw.release();
  }
});
