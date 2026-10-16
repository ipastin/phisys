import { afterAll, beforeAll, expect, test } from 'vitest';
import { Pool, readCurrentSleepFacts, uuidv7 } from '@myphisys/database';
import { ingest } from '@myphisys/ingestion';
import { goldenRecords } from '../../ingestion/test/golden.js';
import {
  sleepBaselineTrend,
  sleepQuality,
  type QualityWindow,
} from '../src/index.js';

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
const personC = uuidv7();
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
  await admin.query('INSERT INTO identity.person(id) VALUES ($1),($2),($3)', [
    personA,
    personB,
    personC,
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
  for (const record of goldenRecords(personC).filter(
    (item) =>
      item.payload.conceptId === 'sleep_duration' &&
      (item.payload.effective as { value: string }).value < '2026-02-05',
  )) {
    const date = (record.payload.effective as { value: string }).value;
    expect(
      (
        await ingest(writer, {
          ...record,
          payload: {
            ...record.payload,
            value: {
              kind: 'quantity',
              originalUnit: 'h',
              originalValue:
                date === '2026-01-01'
                  ? 1
                  : date < '2026-01-15'
                    ? 7.5
                    : date < '2026-01-29'
                      ? 8.5
                      : 5,
            },
          },
        })
      ).state,
    ).toBe('imported');
  }
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
  expect(quality.provenance.factSupports).toHaveLength(83);
  expect(
    quality.provenance.factSupports.find(
      ({ factId }) => factId === facts[0]?.id,
    )?.supports,
  ).toEqual(facts[0]?.supports);
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

test('DB baseline resists a current shift and reference outlier', async () => {
  const result = await sleepBaselineTrend(reader, personC, {
    startDate: '2026-01-29',
    endDateExclusive: '2026-02-05',
    asOfDate: '2026-02-05',
    calculatedAt: '2026-02-05T00:00:00Z',
  });
  expect(result.status).toBe('limited');
  expect(result.baseline).toMatchObject({
    sampleDays: 28,
    medianHours: 8,
    madHours: 0.5,
    iqrHours: 1,
  });
  expect(result.trend).toMatchObject({
    currentMedianHours: 5,
    absoluteDeltaHours: -3,
    direction: 'decreasing',
  });
  expect(await sleepBaselineTrend(reader, personC, result.window)).toEqual(
    result,
  );
});

test('DB sparse series and M1 source switch suppress baseline/trend', async () => {
  const sparseWindow: QualityWindow = {
    startDate: '2026-02-15',
    endDateExclusive: '2026-02-22',
    asOfDate: '2026-02-22',
    calculatedAt: '2026-02-22T00:00:00Z',
  };
  const missing = await sleepBaselineTrend(reader, personA, sparseWindow);
  expect(missing.status).toBe('insufficient');
  expect(missing.reasons).toContain('insufficient_current');
  expect(missing.baseline).toBeNull();
  expect(missing.trend).toBeNull();

  const sparse = await sleepBaselineTrend(reader, personB, {
    ...sparseWindow,
    startDate: '2026-01-29',
    endDateExclusive: '2026-02-05',
    asOfDate: '2026-02-05',
  });
  expect(sparse.reasons).toContain('insufficient_reference');
  expect(sparse.trend).toBeNull();

  const switched = await sleepBaselineTrend(reader, personA, {
    ...sparseWindow,
    startDate: '2026-03-09',
    endDateExclusive: '2026-03-16',
    asOfDate: '2026-03-16',
  });
  expect(switched.reasons).toContain('source_continuity_unproven');
  expect(switched.trend).toBeNull();
});

test('M1 accepts finite outlier but Quality excludes it from person-scoped samples', async () => {
  const record = goldenRecords(personB).find(
    (item) => item.payload.conceptId === 'sleep_duration',
  )!;
  expect(
    (
      await ingest(writer, {
        ...record,
        externalRecordId: 'person-b-impossible-sleep',
        payload: {
          ...record.payload,
          effective: { kind: 'local_date', value: '2026-01-02' },
          value: { kind: 'quantity', originalValue: 1000, originalUnit: 'h' },
        },
      })
    ).state,
  ).toBe('imported');
  const quality = await sleepQuality(reader, personB, window);
  expect(quality.sampleCount).toBe(1);
  expect(quality.coverage.observedDays).toBe(1);
  expect(quality.excludedFactIds).toHaveLength(1);
  expect(quality.reasons).toContain('invalid_point');
});
