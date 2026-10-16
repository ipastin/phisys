import { expect, test } from 'vitest';
import type { SleepFactRow } from '@myphisys/database';
import { goldenRecords } from '../../ingestion/test/golden.js';
import {
  evaluateSleepBaselineTrend,
  evaluateSleepPeriodComparison,
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
    version: '1.2.0',
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
  expect(quality.provenance.factSupports).toHaveLength(83);
  expect(quality.parameters).toEqual(sleepDuration.qualityPolicy);
  expect(quality.provenance.supports[0]).toMatchObject({
    version: 1,
    transformation: 'm1-map-v1',
  });
});

const periodWindow: QualityWindow = {
  startDate: '2026-01-08',
  endDateExclusive: '2026-01-15',
  asOfDate: '2026-01-15',
  calculatedAt: '2026-01-15T00:00:00Z',
};

function completeWeeks(previous = 8, current = 8): SleepFactRow[] {
  return sleepFacts()
    .filter((fact) => {
      const date = (fact.effective as { value: string }).value;
      return date >= '2026-01-01' && date < '2026-01-15';
    })
    .map((fact) => ({
      ...fact,
      verification: 'verified',
      value: {
        kind: 'quantity',
        canonicalUnit: 'h',
        canonicalValue:
          (fact.effective as { value: string }).value < '2026-01-08'
            ? previous
            : current,
      },
    }));
}

test('complete adjacent weeks compare medians without changing lagged baseline semantics', () => {
  const stable = evaluateSleepPeriodComparison(completeWeeks(), periodWindow);
  expect(sleepDuration.comparisonPolicy).toBe('adjacent_complete_local_weeks');
  expect(sleepDuration.comparisonParameters).toEqual({
    previousDays: 7,
    currentDays: 7,
  });
  expect(Object.isFrozen(sleepDuration.comparisonParameters)).toBe(true);
  expect(stable.status).toBe('sufficient');
  expect(stable.comparison).toMatchObject({
    previousMedianHours: 8,
    currentMedianHours: 8,
    absoluteDeltaHours: 0,
    relativeDelta: 0,
    direction: 'stable',
  });
  const shifted = evaluateSleepPeriodComparison(
    completeWeeks(8, 6),
    periodWindow,
  );
  expect(shifted.comparison).toMatchObject({
    previousMedianHours: 8,
    currentMedianHours: 6,
    absoluteDeltaHours: -2,
    relativeDelta: -0.25,
    direction: 'decreasing',
  });
  expect(shifted.quality.combined.coverage).toMatchObject({
    observedDays: 14,
    expectedDays: 14,
  });
  expect(shifted.quality.combined.duplicateReceiptCount).toBe('unavailable');
  expect(
    evaluateSleepPeriodComparison(
      [...completeWeeks(8, 6)].reverse(),
      periodWindow,
    ),
  ).toEqual(shifted);
  const zero = evaluateSleepPeriodComparison(completeWeeks(0, 2), periodWindow);
  expect(zero.comparison).toMatchObject({
    previousMedianHours: 0,
    absoluteDeltaHours: 2,
    relativeDelta: null,
    direction: 'increasing',
  });
});

test('one missing date, a missing week and sparse observations suppress comparison', () => {
  const facts = completeWeeks();
  for (const date of ['2026-01-04', '2026-01-11']) {
    const result = evaluateSleepPeriodComparison(
      facts.filter(
        (fact) => (fact.effective as { value: string }).value !== date,
      ),
      periodWindow,
    );
    expect(result.status).toBe('insufficient');
    expect(result.comparison).toBeNull();
    expect(result.reasons).toContain(
      date < '2026-01-08' ? 'insufficient_previous' : 'insufficient_current',
    );
    expect(result.quality.combined.missingDates).toContain(date);
  }
  for (const subset of [facts.slice(0, 7), facts.slice(0, 2)]) {
    const result = evaluateSleepPeriodComparison(subset, periodWindow);
    expect(result.status).toBe('insufficient');
    expect(result.comparison).toBeNull();
  }
});

test('one valid outlier does not invent a shift, while a midweek connector switch blocks it', () => {
  const facts = completeWeeks();
  const noisy = facts.map((fact, index) =>
    index === 10
      ? {
          ...fact,
          value: { kind: 'quantity', canonicalUnit: 'h', canonicalValue: 25 },
        }
      : fact,
  );
  const noiseResult = evaluateSleepPeriodComparison(noisy, periodWindow);
  expect(noiseResult.status).toBe('sufficient');
  expect(noiseResult.comparison).toMatchObject({
    previousMedianHours: 8,
    currentMedianHours: 8,
    absoluteDeltaHours: 0,
    direction: 'stable',
  });

  const switched = facts.map((fact, index) =>
    index === 10
      ? { ...fact, supports: [{ ...fact.supports[0]!, connectorId: 'other' }] }
      : fact,
  );
  const switchResult = evaluateSleepPeriodComparison(switched, periodWindow);
  expect(switchResult.quality.current.sourceContinuity.status).toBe(
    'transition',
  );
  expect(switchResult.reasons).toContain('source_continuity_unproven');
  expect(switchResult.comparison).toBeNull();
});

test('source switch, overlap, invalid point, conflict and missing Raw support block numbers', () => {
  const facts = completeWeeks();
  const variants: SleepFactRow[][] = [
    facts.map((fact, index) =>
      index < 7
        ? fact
        : {
            ...fact,
            supports: [{ ...fact.supports[0]!, connectorId: 'other' }],
          },
    ),
    [
      ...facts,
      {
        ...facts[0]!,
        id: 'overlap',
        supports: [{ ...facts[0]!.supports[0]!, rawId: 'raw:overlap' }],
      },
    ],
    facts.map((fact, index) =>
      index === 0
        ? {
            ...fact,
            value: { kind: 'quantity', canonicalUnit: 'h', canonicalValue: 26 },
          }
        : fact,
    ),
    facts.map((fact, index) =>
      index === 0 ? { ...fact, has_unresolved_conflict: true } : fact,
    ),
    facts.map((fact, index) =>
      index === 0 ? { ...fact, supports: [] } : fact,
    ),
    facts.map((fact, index) =>
      index === 0
        ? {
            ...fact,
            supports: [
              fact.supports[0]!,
              {
                ...fact.supports[0]!,
                rawId: 'raw:second',
                connectorId: 'other',
              },
            ],
          }
        : fact,
    ),
    [
      ...facts,
      {
        ...facts[0]!,
        id: 'malformed',
        effective: { kind: 'local_date', value: '2026-01-40' },
      },
    ],
  ];
  for (const input of variants) {
    const result = evaluateSleepPeriodComparison(input, periodWindow);
    expect(result.status).toBe('insufficient');
    expect(result.comparison).toBeNull();
  }
  expect(
    evaluateSleepPeriodComparison(variants[0]!, periodWindow).reasons,
  ).toContain('source_continuity_unproven');
  expect(
    evaluateSleepPeriodComparison(variants[1]!, periodWindow).reasons,
  ).toContain('overlapping_day');
  expect(
    evaluateSleepPeriodComparison(variants[2]!, periodWindow).quality.combined
      .reasons,
  ).toContain('invalid_point');
  expect(
    evaluateSleepPeriodComparison(variants[5]!, periodWindow).quality.combined
      .sourceContinuity.status,
  ).toBe('ambiguous');
});

test('period provenance follows each active Raw support, independent of row order', () => {
  const facts = completeWeeks(8, 7);
  const first = evaluateSleepPeriodComparison(facts, periodWindow);
  const swapped = evaluateSleepPeriodComparison(
    [
      { ...facts[0]!, supports: facts[1]!.supports },
      { ...facts[1]!, supports: facts[0]!.supports },
      ...facts.slice(2),
    ],
    periodWindow,
  );
  expect(swapped.comparison).toEqual(first.comparison);
  expect(swapped.quality.combined.provenance.factSupports).not.toEqual(
    first.quality.combined.provenance.factSupports,
  );
  expect(swapped.quality.combined.provenance.rawRecordIds).toEqual(
    first.quality.combined.provenance.rawRecordIds,
  );
});

test('out-of-window dates do not suppress; unverified and stale weeks stay qualified', () => {
  const facts = completeWeeks(8, 7);
  const outside = [
    {
      ...facts[0]!,
      id: 'before',
      effective: { kind: 'local_date', value: '2025-12-31' },
      value: { kind: 'quantity', canonicalUnit: 'h', canonicalValue: 26 },
    },
    {
      ...facts[0]!,
      id: 'after',
      effective: { kind: 'local_date', value: '2026-01-15' },
    },
  ];
  expect(
    evaluateSleepPeriodComparison([...outside, ...facts], periodWindow),
  ).toEqual(evaluateSleepPeriodComparison(facts, periodWindow));
  const limited = evaluateSleepPeriodComparison(
    facts.map((fact) => ({ ...fact, verification: 'unverified' })),
    { ...periodWindow, asOfDate: '2026-02-15' },
  );
  expect(limited.status).toBe('limited');
  expect(limited.comparison?.absoluteDeltaHours).toBe(-1);
  expect(limited.reasons).toContain('previous_unverified_inputs');
  expect(limited.reasons).toContain('current_stale');
  expect(limited.reasons).toContain('combined_stale');
  expect(() =>
    evaluateSleepPeriodComparison(facts, {
      ...periodWindow,
      startDate: '2026-01-09',
    }),
  ).toThrow('exactly 7');
  expect(() =>
    evaluateSleepPeriodComparison(facts, {
      ...periodWindow,
      startDate: '2026-02-30',
    }),
  ).toThrow();
});

test('seven local dates remain seven across leap day and DST', () => {
  const template = completeWeeks()[0]!;
  for (const startDate of ['2024-03-03', '2024-03-10', '2024-10-27']) {
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const dates = Array.from({ length: 14 }, (_, index) =>
      new Date(start + (index - 7) * 86_400_000).toISOString().slice(0, 10),
    );
    const endDateExclusive = new Date(start + 7 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const facts = dates.map((date) => ({
      ...template,
      id: date,
      effective: { kind: 'local_date', value: date },
      supports: [{ ...template.supports[0]!, rawId: `raw:${date}` }],
    }));
    const result = evaluateSleepPeriodComparison(facts, {
      startDate,
      endDateExclusive,
      asOfDate: endDateExclusive,
      calculatedAt: `${endDateExclusive}T00:00:00Z`,
    });
    expect(result.status).toBe('sufficient');
    expect(result.quality.previous.coverage.expectedDays).toBe(7);
    expect(result.quality.current.coverage.expectedDays).toBe(7);
  }
});

test('per-fact Raw supports distinguish swapped lineage while aggregates stay stable', () => {
  const facts = sleepFacts()
    .slice(0, 2)
    .sort((a, b) => a.id.localeCompare(b.id));
  const original = evaluateSleepQuality(facts, window);
  const swapped = evaluateSleepQuality(
    [
      { ...facts[0]!, supports: facts[1]!.supports },
      { ...facts[1]!, supports: facts[0]!.supports },
    ],
    window,
  );
  expect(original.provenance.factSupports).toEqual(
    facts.map((fact) => ({ factId: fact.id, supports: fact.supports })),
  );
  expect(swapped.provenance.factSupports).not.toEqual(
    original.provenance.factSupports,
  );
  expect(swapped.provenance.factIds).toEqual(original.provenance.factIds);
  expect(swapped.provenance.rawRecordIds).toEqual(
    original.provenance.rawRecordIds,
  );
  expect(swapped.provenance.sourceIds).toEqual(original.provenance.sourceIds);
  expect(swapped.provenance.supports).toEqual(original.provenance.supports);

  const missing = evaluateSleepQuality(
    [{ ...facts[0]!, supports: [] }],
    window,
  );
  expect(missing.provenance.factSupports).toEqual([
    { factId: facts[0]!.id, supports: [] },
  ]);
  expect(missing.excludedFactIds).toContain(facts[0]!.id);
});

test('mutating a Quality result cannot change its inputs or a repeated calculation', () => {
  const facts = sleepFacts().slice(0, 1);
  const inputWindow = { ...window };
  const originalFacts = structuredClone(facts);
  const originalWindow = { ...inputWindow };
  const result = evaluateSleepQuality(facts, inputWindow);

  result.provenance.supports[0]!.sourceId = 'changed-in-result';
  result.provenance.factSupports[0]!.supports[0]!.rawId = 'changed-in-result';
  result.window.startDate = '2026-01-02';

  expect(facts).toEqual(originalFacts);
  expect(inputWindow).toEqual(originalWindow);
  expect(evaluateSleepQuality(facts, inputWindow)).toEqual(
    evaluateSleepQuality(originalFacts, originalWindow),
  );
});

test('versioned policy and returned parameters cannot change a later result', () => {
  const facts = sleepFacts();
  const result = evaluateSleepQuality(facts, window);
  expect(result.parameters).not.toBe(sleepDuration.qualityPolicy);
  expect(Object.isFrozen(sleepDuration)).toBe(true);
  expect(Object.isFrozen(sleepDuration.qualityPolicy)).toBe(true);
  expect(Object.isFrozen(sleepDuration.baselineParameters)).toBe(true);
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
  expect(result.parameters).not.toBe(sleepDuration.baselineParameters);
  expect(Object.isFrozen(result.parameters)).toBe(true);
  expect(() =>
    Object.assign(sleepDuration.baselineParameters, { referenceDays: 100 }),
  ).toThrow(TypeError);
  expect(() =>
    Object.assign(result.parameters, { referenceDays: 100 }),
  ).toThrow(TypeError);
  expect(result.status).toBe('limited');
  expect(result.reasons).toContain('reference_unverified_inputs');
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
  expect(
    evaluateSleepBaselineTrend(
      [
        {
          ...facts[0]!,
          id: 'before-reference-window',
          effective: { kind: 'local_date', value: '2025-12-31' },
          value: { kind: 'quantity', canonicalUnit: 'h', canonicalValue: 1000 },
        },
        ...sleepFacts(),
      ],
      baselineWindow,
    ),
  ).toEqual(result);
});

test('mutating a baseline result window cannot change its input or repeated calculation', () => {
  const facts = sleepFacts().filter(
    (fact) => (fact.effective as { value: string }).value < '2026-02-05',
  );
  const inputWindow = { ...baselineWindow };
  const original = evaluateSleepBaselineTrend(facts, { ...inputWindow });
  const result = evaluateSleepBaselineTrend(facts, inputWindow);

  result.window.startDate = '2026-01-30';

  expect(inputWindow).toEqual(baselineWindow);
  expect(result.quality.current.window.startDate).toBe('2026-01-29');
  expect(evaluateSleepBaselineTrend(facts, inputWindow)).toEqual(original);
});

test('odd reference sample uses inclusive Tukey hinges for IQR', () => {
  const facts = sleepFacts()
    .filter((fact) => {
      const date = (fact.effective as { value: string }).value;
      return date >= '2026-01-08' && date < '2026-02-05';
    })
    .map((fact) => {
      const date = (fact.effective as { value: string }).value;
      return {
        ...fact,
        value: {
          kind: 'quantity',
          canonicalUnit: 'h',
          canonicalValue: date < '2026-01-29' ? Number(date.slice(-2)) - 7 : 11,
        },
      };
    });
  const result = evaluateSleepBaselineTrend(facts, baselineWindow);
  expect(result.status).toBe('limited');
  expect(result.baseline).toMatchObject({
    sampleDays: 21,
    medianHours: 11,
    madHours: 5,
    iqrHours: 10,
  });
  expect(result.trend?.absoluteDeltaHours).toBe(0);
});

test('limited baseline names incomplete coverage and stale reference', () => {
  const facts = sleepFacts().filter((fact) => {
    const date = (fact.effective as { value: string }).value;
    return (
      date <= '2026-01-21' || (date >= '2026-01-29' && date < '2026-02-05')
    );
  });
  const result = evaluateSleepBaselineTrend(facts, baselineWindow);
  expect(result.status).toBe('limited');
  expect(result.reasons).toContain('reference_incomplete_coverage');
  expect(result.reasons).toContain('reference_stale');
  expect(result.reasons).toContain('reference_unverified_inputs');
  expect(result.baseline?.sampleDays).toBe(21);
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

test('impossible in-window duration suppresses baseline and trend', () => {
  const facts = sleepFacts().filter(
    (fact) => (fact.effective as { value: string }).value < '2026-02-05',
  );
  const result = evaluateSleepBaselineTrend(
    facts.map((fact, index) =>
      index === 0
        ? {
            ...fact,
            value: {
              kind: 'quantity',
              canonicalUnit: 'h',
              canonicalValue: 1000,
            },
          }
        : fact,
    ),
    baselineWindow,
  );
  expect(result.status).toBe('insufficient');
  expect(result.reasons).toContain('excluded_inputs');
  expect(result.reasons).toContain('reference_invalid_point');
  expect(result.quality.reference.coverage.observedDays).toBe(27);
  expect(result.baseline).toBeNull();
  expect(result.trend).toBeNull();
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
