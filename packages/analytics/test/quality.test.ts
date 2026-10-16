import { expect, test } from 'vitest';
import type { SleepFactRow } from '@myphisys/database';
import { goldenRecords } from '../../ingestion/test/golden.js';
import {
  evaluateSleepBaselineTrend,
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
    version: '1.1.0',
    canonicalUnit: 'h',
    temporalClass: 'daily',
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

const baselineWindow: QualityWindow = {
  startDate: '2026-01-29',
  endDateExclusive: '2026-02-05',
  asOfDate: '2026-02-05',
  calculatedAt: '2026-02-05T00:00:00Z',
};

test('M1 golden gives lagged 28-day median, MAD/IQR and descriptive 7-day delta', () => {
  const facts = sleepFacts().filter(
    (fact) => (fact.effective as { value: string }).value < '2026-02-05',
  );
  const result = evaluateSleepBaselineTrend(facts, baselineWindow);
  expect(result.parameters).toEqual({
    referenceDays: 28,
    currentDays: 7,
    minimumReferenceDays: 21,
  });
  expect(result.status).toBe('limited');
  expect(result.baseline).toMatchObject({
    window: { startDate: '2026-01-01', endDateExclusive: '2026-01-29' },
    sampleDays: 28,
  });
  expect(result.baseline?.medianHours).toBeCloseTo(7.5675);
  expect(result.baseline?.madHours).toBeCloseTo(0.035);
  expect(result.baseline?.iqrHours).toBeCloseTo(0.07);
  expect(result.trend?.currentMedianHours).toBeCloseTo(7.655);
  expect(result.trend?.absoluteDeltaHours).toBeCloseTo(0.0875);
  expect(result.trend?.direction).toBe('increasing');
  expect(
    evaluateSleepBaselineTrend([...facts].reverse(), baselineWindow),
  ).toEqual(result);
});

test('current shift and isolated reference outlier cannot contaminate lagged baseline', () => {
  const facts = sleepFacts()
    .filter(
      (fact) => (fact.effective as { value: string }).value < '2026-02-05',
    )
    .map((fact) => {
      const date = (fact.effective as { value: string }).value;
      return {
        ...fact,
        value: {
          kind: 'quantity',
          canonicalUnit: 'h',
          canonicalValue:
            date === '2026-01-01'
              ? 1
              : date < '2026-01-15'
                ? 7.5
                : date < '2026-01-29'
                  ? 8.5
                  : 5,
        },
      };
    });
  const shifted = evaluateSleepBaselineTrend(facts, baselineWindow);
  expect(shifted.baseline?.medianHours).toBe(8);
  expect(shifted.baseline?.madHours).toBe(0.5);
  expect(shifted.baseline?.iqrHours).toBe(1);
  expect(shifted.trend).toMatchObject({
    currentMedianHours: 5,
    absoluteDeltaHours: -3,
    direction: 'decreasing',
  });
  const moreShifted = evaluateSleepBaselineTrend(
    facts.map((fact) =>
      (fact.effective as { value: string }).value >= '2026-01-29'
        ? {
            ...fact,
            value: { kind: 'quantity', canonicalUnit: 'h', canonicalValue: 2 },
          }
        : fact,
    ),
    baselineWindow,
  );
  expect(moreShifted.baseline).toEqual(shifted.baseline);
  const stable = evaluateSleepBaselineTrend(
    facts.map((fact) => ({
      ...fact,
      value: { kind: 'quantity', canonicalUnit: 'h', canonicalValue: 7.5 },
    })),
    baselineWindow,
  );
  expect(stable.trend).toMatchObject({
    absoluteDeltaHours: 0,
    direction: 'stable',
  });
});

test('sparse reference/current and source switch return no fabricated baseline or trend', () => {
  const facts = sleepFacts();
  const sparse = facts.filter((fact) => {
    const date = (fact.effective as { value: string }).value;
    return date >= '2026-01-10';
  });
  const reference = evaluateSleepBaselineTrend(sparse, baselineWindow);
  expect(reference.status).toBe('insufficient');
  expect(reference.reasons).toContain('insufficient_reference');
  expect(reference.baseline).toBeNull();
  expect(reference.trend).toBeNull();

  const missingWeek = evaluateSleepBaselineTrend(facts, {
    ...baselineWindow,
    startDate: '2026-02-15',
    endDateExclusive: '2026-02-22',
    asOfDate: '2026-02-22',
  });
  expect(missingWeek.reasons).toContain('insufficient_current');
  expect(missingWeek.trend).toBeNull();

  const switched = evaluateSleepBaselineTrend(facts, {
    ...baselineWindow,
    startDate: '2026-03-09',
    endDateExclusive: '2026-03-16',
    asOfDate: '2026-03-16',
  });
  expect(switched.reasons).toContain('source_continuity_unproven');
  expect(switched.trend).toBeNull();
});

test('overlapping day and unsupported current period cannot produce a trend', () => {
  const facts = sleepFacts().filter(
    (fact) => (fact.effective as { value: string }).value < '2026-02-05',
  );
  const overlapping = evaluateSleepBaselineTrend(
    [...facts, { ...facts[0]!, id: 'overlap' }],
    baselineWindow,
  );
  expect(overlapping.reasons).toContain('overlapping_day');
  expect(overlapping.trend).toBeNull();
  expect(() =>
    evaluateSleepBaselineTrend(facts, {
      ...baselineWindow,
      endDateExclusive: '2026-02-06',
      asOfDate: '2026-02-06',
    }),
  ).toThrow('exactly 7 local dates');
});
