import { expect, test, vi } from 'vitest';
import type { Pool, SleepFactRow } from '@myphisys/database';
import {
  diffSleepMetricStateSnapshots,
  evaluateSleepMetricStatePair,
  evaluateSleepPeriodComparison,
  sleepMetricStatePair,
  type QualityWindow,
  type SleepMetricStateRequest,
} from '../src/index.js';

const personId = '019a0000-0000-7000-8000-000000000001';
const window: QualityWindow = {
  startDate: '2026-01-08',
  endDateExclusive: '2026-01-15',
  asOfDate: '2026-01-15',
  calculatedAt: '2026-01-15T10:11:12.000Z',
};

function weeks(previous = 8, current = 8): SleepFactRow[] {
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, index + 1))
      .toISOString()
      .slice(0, 10);
    return {
      id: `fact-${String(index + 1).padStart(2, '0')}`,
      effective: { kind: 'local_date', value: date },
      value: {
        kind: 'quantity',
        canonicalValue: index < 7 ? previous : current,
        canonicalUnit: 'h',
      },
      verification: 'verified',
      epistemic: 'source_recorded',
      has_unresolved_conflict: false,
      supports: [
        {
          rawId: `raw-${String(index + 1).padStart(2, '0')}`,
          sourceId: 'source-a',
          connectorId: 'connector-a',
          version: 1,
          transformation: 'm1-map-v1',
        },
      ],
    };
  });
}

test('A15/A16 partial: exact zero, tiny signed D1 delta, limited quality and no insight promotion', () => {
  const stable = evaluateSleepMetricStatePair(weeks(), personId, window);
  expect(stable.diff).toMatchObject({
    status: 'unchanged',
    deltaHours: 0,
    qualityStatus: 'sufficient',
    algorithmVersion: 'sleep-metric-state-diff-v1',
    comparisonAlgorithmVersion: 'sleep-period-comparison-v1',
    comparisonPolicy: 'adjacent_complete_local_weeks',
    comparisonParameters: { previousDays: 7, currentDays: 7 },
    comparisonMethod: 'adjacent_week_medians',
    promotion: 'requires_step13_meaningfulness',
    knowledgeAsOf: 'unavailable',
  });
  expect(stable.current.structuralDomains).toEqual({
    conditions: 'unavailable',
    medications: 'unavailable',
    allergies: 'unavailable',
    goals: 'unavailable',
    recentEvents: 'unavailable',
    conflicts: 'unavailable',
  });
  const tiny = evaluateSleepMetricStatePair(weeks(8, 8.001), personId, window);
  expect(tiny.diff.status).toBe('numeric_changed');
  expect(tiny.diff.deltaHours).toBeCloseTo(0.001);
  expect(tiny.diff).not.toHaveProperty('insight');
  expect(tiny.diff).not.toHaveProperty('knowledge_as_of');
  const limitedFacts = weeks(8, 7.999).map((fact) => ({
    ...fact,
    verification: 'unverified',
  }));
  const limited = evaluateSleepMetricStatePair(limitedFacts, personId, window);
  expect(limited.diff.status).toBe('numeric_changed');
  expect(limited.diff.deltaHours).toBeCloseTo(-0.001);
  expect(limited.diff.qualityStatus).toBe('limited');
  expect(limited.diff.reasons).toContain('current_unverified_inputs');
});

test('A16 partial: missing date and source transition suppress numeric claims with reasons', () => {
  const missing = evaluateSleepMetricStatePair(
    weeks().slice(1),
    personId,
    window,
  );
  expect(missing.diff.status).toBe('unknown');
  expect(missing.diff.deltaHours).toBeNull();
  expect(missing.previous.medianHours).toBeNull();
  expect(missing.diff.reasons).toContain('insufficient_previous');

  const switched = weeks(8, 7).map((fact, index) =>
    index === 7
      ? {
          ...fact,
          supports: [
            {
              ...fact.supports[0]!,
              sourceId: 'source-b',
              connectorId: 'connector-b',
            },
          ],
        }
      : fact,
  );
  const blocked = evaluateSleepMetricStatePair(switched, personId, window);
  expect(blocked.diff.status).toBe('unknown');
  expect(blocked.diff.deltaHours).toBeNull();
  expect(blocked.diff.reasons).toContain('source_continuity_unproven');
  expect(blocked.diff.quality.combined.sourceContinuity.status).toBe(
    'transition',
  );
  expect(blocked.diff).toMatchObject({
    comparisonAlgorithmVersion: 'sleep-period-comparison-v1',
    comparisonPolicy: 'adjacent_complete_local_weeks',
    comparisonParameters: { previousDays: 7, currentDays: 7 },
    comparisonMethod: null,
  });
});

test('A20 partial: input order, correction and Raw support identity remain auditable', () => {
  const facts = weeks();
  const original = evaluateSleepMetricStatePair(facts, personId, window);
  expect(
    evaluateSleepMetricStatePair([...facts].reverse(), personId, window),
  ).toEqual(original);
  expect(original.current.identity.inputFactIds).toEqual(
    [...original.current.identity.inputFactIds].sort(),
  );
  expect(original.current.observedAt[0]).toEqual({
    factId: 'fact-08',
    effective: { kind: 'local_date', value: '2026-01-08' },
  });
  expect(original.current.identity.factSupports[0]?.supports[0]).toMatchObject({
    rawId: 'raw-08',
    sourceId: 'source-a',
    connectorId: 'connector-a',
  });

  const corrected = facts.map((fact, index) =>
    index === 7
      ? {
          ...fact,
          id: 'fact-08-corrected',
          value: { kind: 'quantity', canonicalValue: 9, canonicalUnit: 'h' },
        }
      : fact,
  );
  const afterCorrection = evaluateSleepMetricStatePair(
    corrected,
    personId,
    window,
  );
  expect(afterCorrection.diff.status).toBe('unchanged');
  expect(afterCorrection.current.identity.inputFactIds).not.toEqual(
    original.current.identity.inputFactIds,
  );

  const swapped = facts.map((fact, index) =>
    index === 7
      ? {
          ...fact,
          supports: [{ ...fact.supports[0]!, rawId: 'raw-08-replacement' }],
        }
      : fact,
  );
  const afterSwap = evaluateSleepMetricStatePair(swapped, personId, window);
  expect(afterSwap.diff.status).toBe('unchanged');
  expect(afterSwap.current.identity.factSupports).not.toEqual(
    original.current.identity.factSupports,
  );
  expect(afterSwap.current.quality.provenance.rawRecordIds).toContain(
    'raw-08-replacement',
  );
});

test('A20 partial: same fact IDs and Raw support still identify changed canonical inputs', () => {
  const facts = weeks();
  const original = evaluateSleepMetricStatePair(facts, personId, window);
  const changedValue = facts.map((fact, index) =>
    index >= 7
      ? {
          ...fact,
          value: { kind: 'quantity', canonicalValue: 9, canonicalUnit: 'h' },
        }
      : fact,
  );
  const recomputed = evaluateSleepMetricStatePair(
    changedValue,
    personId,
    window,
  );
  expect(recomputed.current.identity.inputFactIds).toEqual(
    original.current.identity.inputFactIds,
  );
  expect(recomputed.current.identity.factSupports).toEqual(
    original.current.identity.factSupports,
  );
  expect(recomputed.current.identity.inputFingerprint).not.toBe(
    original.current.identity.inputFingerprint,
  );
  expect(recomputed.diff.status).toBe('numeric_changed');

  const changedVerification = facts.map((fact, index) =>
    index === 7 ? { ...fact, verification: 'unverified' } : fact,
  );
  const sameMedian = evaluateSleepMetricStatePair(
    changedVerification,
    personId,
    window,
  );
  expect(sameMedian.current.identity.inputFingerprint).not.toBe(
    original.current.identity.inputFingerprint,
  );
  expect(sameMedian.diff.status).toBe('unchanged');
});

test('diff rejects incompatible person, scope and profile', () => {
  const facts = weeks();
  const pair = evaluateSleepMetricStatePair(facts, personId, window);
  const comparison = evaluateSleepPeriodComparison(facts, window);
  for (const identity of [
    { personId: 'another-person' },
    { scope: 'other_metric' as 'sleep_duration' },
    { metricDefinitionVersion: 'other-profile' },
  ]) {
    const incompatible = diffSleepMetricStateSnapshots(
      pair.previous,
      { ...pair.current, identity: { ...pair.current.identity, ...identity } },
      comparison,
    );
    expect(incompatible.status).toBe('incompatible');
    expect(incompatible.deltaHours).toBeNull();
    expect(incompatible.reasons).toContain('incompatible_snapshot_identity');
  }
});

test('standalone diff rejects comparison from a different input or Quality revision', () => {
  const facts = weeks();
  const original = evaluateSleepMetricStatePair(facts, personId, window);
  const comparison = evaluateSleepPeriodComparison(facts, window);
  expect(
    diffSleepMetricStateSnapshots(
      original.previous,
      original.current,
      comparison,
    ).status,
  ).toBe('unchanged');

  const changedValue = evaluateSleepMetricStatePair(
    facts.map((fact, index) =>
      index === 7
        ? {
            ...fact,
            value: { kind: 'quantity', canonicalValue: 9, canonicalUnit: 'h' },
          }
        : fact,
    ),
    personId,
    window,
  );
  expect(changedValue.current.medianHours).toBe(original.current.medianHours);
  expect(changedValue.current.identity.inputFactIds).toEqual(
    original.current.identity.inputFactIds,
  );
  expect(changedValue.current.identity.factSupports).toEqual(
    original.current.identity.factSupports,
  );
  const mismatchedInputs = diffSleepMetricStateSnapshots(
    original.previous,
    changedValue.current,
    comparison,
  );
  expect(mismatchedInputs.status).toBe('incompatible');
  expect(mismatchedInputs.deltaHours).toBeNull();
  expect(mismatchedInputs.reasons).toContain('incompatible_snapshot_identity');

  const changedVerification = evaluateSleepMetricStatePair(
    facts.map((fact, index) =>
      index === 7 ? { ...fact, verification: 'unverified' } : fact,
    ),
    personId,
    window,
  );
  expect(changedVerification.current.quality.status).toBe('limited');
  expect(
    diffSleepMetricStateSnapshots(
      original.previous,
      changedVerification.current,
      comparison,
    ).status,
  ).toBe('incompatible');

  const changedQuality = {
    ...original.current,
    quality: {
      ...original.current.quality,
      status: 'limited' as const,
      reasons: ['unverified_inputs'],
    },
  };
  expect(
    diffSleepMetricStateSnapshots(original.previous, changedQuality, comparison)
      .status,
  ).toBe('incompatible');

  const comparisonWithoutFingerprints = { ...comparison };
  delete (comparisonWithoutFingerprints as Partial<typeof comparison>)
    .inputFingerprints;
  expect(
    diffSleepMetricStateSnapshots(
      original.previous,
      original.current,
      comparisonWithoutFingerprints,
    ).status,
  ).toBe('incompatible');
});

test('T1 runtime captures once after read and refuses external time override', async () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date('2026-01-15T00:00:00Z'));
    const calls: string[] = [];
    const pool = {
      connect: async () => ({
        query: async (sql: string) => {
          calls.push(sql);
          if (sql.includes('FROM health.fact f')) {
            vi.setSystemTime(new Date('2026-01-15T10:11:12Z'));
            return { rows: weeks() };
          }
          return { rows: [] };
        },
        release: () => undefined,
      }),
    } as unknown as Pool;
    const request: SleepMetricStateRequest = {
      startDate: window.startDate,
      endDateExclusive: window.endDateExclusive,
      asOfDate: window.asOfDate,
    };
    const pair = await sleepMetricStatePair(pool, personId, request);
    expect(
      calls.filter((sql) => sql.includes('FROM health.fact f')),
    ).toHaveLength(1);
    expect(calls[0]).toBe('BEGIN READ ONLY');
    expect(calls).toContain('SET LOCAL ROLE myphisys_analytics');
    expect(pair.calculatedAt).toBe('2026-01-15T10:11:12.000Z');
    for (const timestamp of [
      pair.previous.calculatedAt,
      pair.current.calculatedAt,
      pair.diff.calculatedAt,
      pair.previous.quality.calculatedAt,
      pair.current.quality.calculatedAt,
      pair.diff.quality.combined.calculatedAt,
    ])
      expect(timestamp).toBe(pair.calculatedAt);
    expect(pair.knowledgeAsOf).toBe('unavailable');
    for (const key of ['calculatedAt', 'calculated_at', 'knowledgeAsOf'])
      await expect(
        sleepMetricStatePair(pool, personId, {
          ...request,
          [key]: '2000-01-01T00:00:00Z',
        }),
      ).rejects.toThrow('Only window dates may be supplied');
    expect(
      calls.filter((sql) => sql.includes('FROM health.fact f')),
    ).toHaveLength(1);
  } finally {
    vi.useRealTimers();
  }
});

test('T1 runtime ignores caller mutations made during the person-scoped read', async () => {
  const request: SleepMetricStateRequest = {
    startDate: window.startDate,
    endDateExclusive: window.endDateExclusive,
    asOfDate: window.asOfDate,
  };
  const pool = {
    connect: async () => ({
      query: async (sql: string, params?: unknown[]) => {
        if (sql.includes('FROM health.fact f')) {
          expect(params).toEqual([personId, '2026-01-01', '2026-01-15']);
          request.asOfDate = '2026-01-20';
          request.endDateExclusive = '2026-01-22';
          Object.assign(request, {
            knowledgeAsOf: '2000-01-01T00:00:00Z',
            calculated_at: '2000-01-01T00:00:00Z',
          });
          return { rows: weeks() };
        }
        return { rows: [] };
      },
      release: () => undefined,
    }),
  } as unknown as Pool;
  const pair = await sleepMetricStatePair(pool, personId, request);
  expect(pair.current.identity.window).toEqual({
    startDate: window.startDate,
    endDateExclusive: window.endDateExclusive,
    asOfDate: window.asOfDate,
  });
  expect(pair.current.quality.window).toEqual({
    ...window,
    calculatedAt: pair.calculatedAt,
  });
  expect(pair.current.quality.window.calculatedAt).toBe(pair.calculatedAt);
  expect(pair.current.quality.window).not.toHaveProperty('knowledgeAsOf');
  expect(pair.current.quality.window).not.toHaveProperty('calculated_at');
  expect(pair.knowledgeAsOf).toBe('unavailable');
});
