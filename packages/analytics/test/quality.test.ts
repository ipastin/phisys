import { expect, test } from 'vitest';
import type { SleepFactRow } from '@myphisys/database';
import { goldenRecords } from '../../ingestion/test/golden.js';
import {
  evaluateSleepQuality,
  metricRegistry,
  sleepDuration,
  type QualityWindow,
} from '../src/index.js';

const window: QualityWindow = {
  startDate: '2026-01-01',
  endDateExclusive: '2026-04-01',
  asOfDate: '2026-04-01',
  calculatedAt: '2026-04-01T00:00:00Z',
};

function sleepFacts(): SleepFactRow[] {
  return goldenRecords()
    .filter((record) => record.payload.conceptId === 'sleep_duration')
    .map((record) => ({
      id: record.externalRecordId,
      value: {
        ...record.payload.value,
        canonicalValue: (record.payload.value as { originalValue: number })
          .originalValue,
        canonicalUnit: 'h',
      },
      effective: record.payload.effective,
      verification: 'unverified',
      epistemic: 'source_recorded',
      has_unresolved_conflict: false,
      supports: [
        {
          rawId: `raw:${record.externalRecordId}`,
          sourceId: record.connectorId,
          connectorId: record.connectorId,
          version: 1,
          transformation: 'm1-map-v1',
        },
      ],
    }));
}

test('versioned sleep profile and M1 golden quality preserve missing week and source handoff', () => {
  expect(sleepDuration).toMatchObject({
    id: 'sleep_duration',
    version: '1.0.1',
    canonicalUnit: 'h',
    temporalClass: 'daily',
    qualityPolicy: { minimumDurationHours: 0, maximumDurationHours: 25 },
  });
  expect(metricRegistry.sleep_duration).toBe(sleepDuration);
  const quality = evaluateSleepQuality(sleepFacts(), window);
  expect(quality.coverage).toEqual({
    observedDays: 83,
    expectedDays: 90,
    ratio: 83 / 90,
  });
  expect(quality.sampleCount).toBe(83);
  expect(quality.missingDates).toEqual([
    '2026-02-15',
    '2026-02-16',
    '2026-02-17',
    '2026-02-18',
    '2026-02-19',
    '2026-02-20',
    '2026-02-21',
  ]);
  expect(quality.sourceContinuity.transitions).toEqual([
    {
      date: '2026-03-02',
      from: 'synthetic-device-a',
      to: 'synthetic-device-b',
    },
  ]);
  expect(quality.status).toBe('limited');
  expect(quality.reasons).toContain('source_transition');
  expect(quality.reasons).toContain('unverified_inputs');
  expect(quality.duplicateReceiptCount).toBe('unavailable');
  expect(quality.provenance.factIds).toHaveLength(83);
  expect(quality.parameters).toEqual(sleepDuration.qualityPolicy);
  expect(quality.provenance.supports[0]).toMatchObject({
    version: 1,
    transformation: 'm1-map-v1',
  });
});

test('versioned policy and returned parameters cannot change a later result', () => {
  const facts = sleepFacts();
  const result = evaluateSleepQuality(facts, window);
  expect(result.parameters).not.toBe(sleepDuration.qualityPolicy);
  expect(Object.isFrozen(sleepDuration)).toBe(true);
  expect(Object.isFrozen(sleepDuration.qualityPolicy)).toBe(true);
  expect(Object.isFrozen(metricRegistry)).toBe(true);
  expect(Object.isFrozen(result.parameters)).toBe(true);
  expect(() => Object.assign(result.parameters, { minimumDays: 100 })).toThrow(
    TypeError,
  );
  expect(() =>
    Object.assign(sleepDuration.qualityPolicy, { minimumDays: 100 }),
  ).toThrow(TypeError);
  expect(evaluateSleepQuality(facts, window)).toEqual(result);
});

test('daily duration validity excludes impossible values without turning missing into zero', () => {
  const sevenDays = sleepFacts()
    .filter(
      (fact) => (fact.effective as { value: string }).value < '2026-01-08',
    )
    .map((fact, index) =>
      index < 2
        ? {
            ...fact,
            value: {
              kind: 'quantity',
              canonicalValue: index === 0 ? 0 : 25,
              canonicalUnit: 'h',
            },
          }
        : fact,
    );
  const sevenDayWindow = {
    ...window,
    endDateExclusive: '2026-01-08',
    asOfDate: '2026-01-08',
  };
  expect(
    evaluateSleepQuality(sevenDays, sevenDayWindow).coverage.observedDays,
  ).toBe(7);
  for (const impossibleHours of [-1, 25.1, 1000]) {
    const invalid = sevenDays.map((fact, index) =>
      index === 0
        ? {
            ...fact,
            value: {
              kind: 'quantity',
              canonicalValue: impossibleHours,
              canonicalUnit: 'h',
            },
          }
        : fact,
    );
    const quality = evaluateSleepQuality(invalid, sevenDayWindow);
    expect(quality.coverage.observedDays).toBe(6);
    expect(quality.sampleCount).toBe(6);
    expect(quality.missingDates).toContain('2026-01-01');
    expect(quality.excludedFactIds).toContain(sevenDays[0]!.id);
    expect(quality.reasons).toContain('invalid_point');
    expect(quality.status).toBe('insufficient');
  }
});

test('pure Quality ignores dated facts outside its window and excludes malformed dates', () => {
  const facts = sleepFacts();
  const narrowWindow = {
    ...window,
    startDate: '2026-01-29',
    endDateExclusive: '2026-02-05',
    asOfDate: '2026-02-05',
  };
  const scoped = facts.filter((fact) => {
    const date = (fact.effective as { value: string }).value;
    return (
      date >= narrowWindow.startDate && date < narrowWindow.endDateExclusive
    );
  });
  const quality = evaluateSleepQuality(scoped, narrowWindow);
  expect(
    evaluateSleepQuality(
      [
        {
          ...facts[0]!,
          id: 'before-window',
          effective: { kind: 'local_date', value: '2025-12-31' },
        },
        ...facts,
      ],
      narrowWindow,
    ),
  ).toEqual(quality);
  const invalid = evaluateSleepQuality(
    [
      ...scoped,
      {
        ...scoped[0]!,
        id: 'invalid-calendar-date',
        effective: { kind: 'local_date', value: '2026-02-30' },
      },
    ],
    narrowWindow,
  );
  expect(invalid.excludedFactIds).toContain('invalid-calendar-date');
  expect(invalid.reasons).toContain('invalid_point');
});

test('missing week can make a window insufficient, and row order cannot change the result', () => {
  const facts = sleepFacts();
  const gapWindow = {
    ...window,
    startDate: '2026-02-13',
    endDateExclusive: '2026-02-24',
    asOfDate: '2026-02-24',
  };
  const quality = evaluateSleepQuality(facts, gapWindow);
  expect(quality.coverage).toEqual({
    observedDays: 4,
    expectedDays: 11,
    ratio: 4 / 11,
  });
  expect(quality.status).toBe('insufficient');
  expect(evaluateSleepQuality([...facts].reverse(), gapWindow)).toEqual(
    quality,
  );
});

test('a second current fact on one date does not increase day coverage', () => {
  const facts = sleepFacts();
  facts.push({ ...facts[0]!, id: 'another-fact' });
  const quality = evaluateSleepQuality(facts, window);
  expect(quality.sampleCount).toBe(84);
  expect(quality.coverage.observedDays).toBe(83);
  expect(quality.sameDayExtraFactCount).toBe(1);
  expect(quality.reasons).toContain('same_day_overlap');
});

test('invalid windows fail before DB access or daily enumeration', () => {
  expect(() =>
    evaluateSleepQuality([], { ...window, startDate: '2026-02-30' }),
  ).toThrow();
  expect(() =>
    evaluateSleepQuality([], { ...window, asOfDate: '2026-03-01' }),
  ).toThrow();
});
