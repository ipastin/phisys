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
    version: '1.0.0',
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
