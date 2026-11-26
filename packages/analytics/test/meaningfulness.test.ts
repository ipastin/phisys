import { expect, test, vi } from 'vitest';
import type { Pool, SleepFactRow } from '@myphisys/database';
import {
  evaluateSleepMeaningfulness,
  evaluateSleepMetricStatePair,
  sleepMeaningfulness,
  type QualityWindow,
} from '../src/index.js';

const personId = '019a0000-0000-7000-8000-000000000001';
const otherPerson = '019a0000-0000-7000-8000-000000000002';
const window: QualityWindow = {
  startDate: '2026-01-29',
  endDateExclusive: '2026-02-05',
  asOfDate: '2026-02-05',
  calculatedAt: '2026-02-05T12:00:00.000Z',
};

function series(
  current: number | readonly number[] = 7,
  reference: readonly number[] = Array<number>(28).fill(8),
): SleepFactRow[] {
  return Array.from({ length: 35 }, (_, i) => {
    const id = String(i + 1).padStart(2, '0');
    return {
      id: `fact-${id}`,
      effective: {
        kind: 'local_date',
        value: new Date(Date.UTC(2026, 0, i + 1)).toISOString().slice(0, 10),
      },
      value: {
        kind: 'quantity',
        canonicalValue:
          i < 28
            ? reference[i]!
            : typeof current === 'number'
              ? current
              : current[i - 28]!,
        canonicalUnit: 'h',
      },
      verification: 'source_verified',
      epistemic: 'source_recorded',
      has_unresolved_conflict: false,
      supports: [
        {
          rawId: `raw-${id}`,
          sourceId: 'source-a',
          connectorId: 'connector-a',
          version: 1,
          transformation: 'm1-map-v1',
        },
      ],
    };
  });
}

const evaluate = (facts: SleepFactRow[]) =>
  evaluateSleepMeaningfulness(facts, personId, window);

test('partial A17: zero and an isolated outlier leave the diff unchanged', () => {
  const unchanged = series(8);
  const outlier = series(8);
  outlier[28]!.value = {
    kind: 'quantity',
    canonicalValue: 24,
    canonicalUnit: 'h',
  };
  for (const facts of [unchanged, outlier]) {
    expect(evaluate(facts)).toMatchObject({
      status: 'held',
      reasonCodes: ['diff_unchanged'],
      diff: { status: 'unchanged', deltaHours: 0 },
      persistence: { status: 'pattern_not_observed' },
    });
  }
});

test('partial A17: a tiny signed delta reaches baseline and stays held', () => {
  const decision = evaluate(series(7.999));
  expect(decision).toMatchObject({
    kind: 'partial_sleep_meaningfulness',
    status: 'held',
    policy: 'sleep-meaningfulness-evidence-v1',
    reasonCodes: ['promotion_policy_unavailable'],
    diff: { status: 'numeric_changed', qualityStatus: 'sufficient' },
    baselineEvidence: {
      policy: 'lagged_rolling_median',
      result: {
        algorithmVersion: 'sleep-baseline-trend-v1',
        status: 'sufficient',
        baseline: { sampleDays: 28, medianHours: 8, madHours: 0, iqrHours: 0 },
        trend: { direction: 'decreasing' },
      },
    },
    persistence: {
      status: 'pattern_not_observed',
      reasonCode: 'persistence_run_not_observed',
    },
    knowledgeAsOf: 'unavailable',
  });
  expect(decision.diff.deltaHours).toBeCloseTo(-0.001);
  expect(decision).not.toHaveProperty('insight');
});

test('partial A17: insufficient and blocked diffs retain their distinct Quality reasons', () => {
  const missing = series().filter((fact) => fact.id !== 'fact-29');
  const switched = series();
  switched[28]!.supports[0]!.connectorId = 'connector-b';
  for (const [facts, code, original] of [
    [missing, 'diff_insufficient_quality', 'insufficient_current'],
    [switched, 'diff_blocked', 'source_continuity_unproven'],
  ] as const) {
    const decision = evaluate(facts);
    expect(decision).toMatchObject({
      status: 'held',
      reasonCodes: [code],
      diff: { status: 'unknown', deltaHours: null },
      persistence: { status: 'unavailable' },
    });
    expect(decision.diff.reasons).toContain(original);
  }
});

test('A13-10: limited Quality keeps D1 and makes persistence unavailable', () => {
  const facts = series();
  facts[29]!.verification = 'unverified';
  const decision = evaluate(facts);
  expect(decision.reasonCodes).toEqual([
    'diff_limited_quality',
    'baseline_limited_quality',
  ]);
  expect(decision.diff).toMatchObject({
    status: 'numeric_changed',
    deltaHours: -1,
    qualityStatus: 'limited',
  });
  expect(decision.diff.reasons).toContain('current_unverified_inputs');
  expect(decision.persistence).toMatchObject({
    status: 'unavailable',
    reasonCode: 'persistence_quality_blocked',
    directions: null,
  });
  expect(decision.baselineEvidence?.result.reasons).toContain(
    'current_unverified_inputs',
  );
});

test('partial A17: reference coverage and a reference-only blocker explain an absent baseline', () => {
  const tooShort = evaluate(series().slice(21));
  expect(tooShort.reasonCodes).toEqual(['baseline_insufficient_coverage']);
  expect(tooShort.baselineEvidence?.result).toMatchObject({
    baseline: null,
    quality: { reference: { coverage: { observedDays: 7 } } },
  });

  const facts = series();
  facts[0]!.supports[0]!.connectorId = 'connector-b';
  const blocked = evaluate(facts);
  expect(blocked.reasonCodes).toEqual(['baseline_unavailable']);
  expect(blocked.baselineEvidence?.result).toMatchObject({
    baseline: null,
    reasons: expect.arrayContaining(['source_continuity_unproven']),
  });
  for (const decision of [tooShort, blocked])
    expect(decision.diff).toMatchObject({
      status: 'numeric_changed',
      deltaHours: -1,
    });
});

test('A13-17: a malformed reference-only date blocks evidence without changing D1', () => {
  const facts = series();
  const cleanDiff = evaluateSleepMetricStatePair(
    facts.slice(21),
    personId,
    window,
  ).diff;
  facts[8]!.effective = { kind: 'local_date', value: '2026-01-09x' };
  const decision = evaluate(facts);
  expect(decision.diff).toEqual(cleanDiff);
  expect(decision.diff).toMatchObject({
    status: 'numeric_changed',
    deltaHours: -1,
  });
  expect(decision.reasonCodes).toEqual(['baseline_unavailable']);
  expect(decision.persistence).toMatchObject({
    status: 'unavailable',
    reasonCode: 'persistence_quality_blocked',
  });
  expect(decision.baselineEvidence?.result).toMatchObject({
    baseline: null,
    quality: { combined: { excludedFactIds: ['fact-09'] } },
  });

  const withinComparison = series();
  withinComparison[24]!.effective = {
    kind: 'local_date',
    value: '2026-01-25x',
  };
  expect(evaluate(withinComparison)).toMatchObject({
    diff: { status: 'unknown', deltaHours: null },
    persistence: {
      status: 'unavailable',
      reasonCode: 'persistence_quality_blocked',
    },
  });
});

test('A13-16 / partial A20: a support revision changes provenance but preserves persistence', () => {
  const facts = series(fourBelow);
  const before = evaluate(facts);
  expect(evaluate([...facts].reverse())).toEqual(before);
  expect(before.diff.previous.personId).toBe(personId);
  expect(before.diff.current.scope).toBe('sleep_duration');
  expect(
    before.baselineEvidence?.result.quality.combined.provenance,
  ).toMatchObject({
    factIds: facts.map(({ id }) => id),
    factSupports: facts.map(({ id, supports }) => ({ factId: id, supports })),
    sourceIds: ['source-a'],
  });

  facts[0]!.value = { kind: 'quantity', canonicalValue: 9, canonicalUnit: 'h' };
  const corrected = evaluate(facts);
  expect(corrected.diff).toEqual(before.diff);
  expect(corrected.baselineEvidence?.result.baseline?.medianHours).toBe(8);
  expect(corrected.baselineEvidence?.inputFingerprint).not.toBe(
    before.baselineEvidence?.inputFingerprint,
  );

  facts[29]!.supports[0]!.rawId = 'raw-replacement';
  const swapped = evaluate(facts);
  expect(swapped.diff.deltaHours).toBe(before.diff.deltaHours);
  expect(swapped.diff.current.inputFingerprint).not.toBe(
    corrected.diff.current.inputFingerprint,
  );
  expect(swapped.baselineEvidence?.inputFingerprint).not.toBe(
    corrected.baselineEvidence?.inputFingerprint,
  );
  expect(swapped.persistence).toMatchObject({
    status: 'pattern_observed',
    reasonCode: 'persistence_run_observed',
    directions: corrected.persistence.directions,
    inputFingerprint: swapped.baselineEvidence.inputFingerprint,
  });
  expect(swapped.persistence.inputFingerprint).not.toBe(
    corrected.persistence.inputFingerprint,
  );
  expect(evaluate([...facts].reverse())).toEqual(swapped);
  expect(
    swapped.baselineEvidence.result.quality.current.provenance.rawRecordIds,
  ).toContain('raw-replacement');
  expect(swapped.reasonCodes).toEqual(before.reasonCodes);
});

const fourBelow = [7, 7, 7, 7, 8, 8, 8];

test.each([
  {
    id: 'A13-01',
    hours: fourBelow,
    side: 'below',
    count: 4,
    run: 4,
    delta: -1,
  },
  {
    id: 'A13-02',
    hours: [7, 8, 7, 8, 7, 8, 7],
    side: 'below',
    count: 4,
    run: 1,
    delta: -1,
  },
  {
    id: 'A13-03',
    hours: [7, 7, 9, 7, 7, 9, 9],
    side: 'below',
    count: 4,
    run: 2,
    delta: -1,
  },
  {
    id: 'A13-04',
    hours: [8, 8, 8, 8, 8, 8, 1],
    side: 'below',
    count: 1,
    run: 1,
    delta: 0,
  },
  {
    id: 'A13-05',
    hours: [9, 9, 9, 9, 8, 8, 8],
    side: 'above',
    count: 4,
    run: 4,
    delta: 1,
  },
] as const)(
  '$id: count and longest same-direction sequence are distinct',
  ({ hours, side, count, run, delta }) => {
    const decision = evaluate(series(hours));
    const observed = run === 4;
    expect(decision.status).toBe('held');
    expect(decision.diff.deltaHours).toBe(delta);
    expect(decision.persistence).toMatchObject({
      status: observed ? 'pattern_observed' : 'pattern_not_observed',
      reasonCode: observed
        ? 'persistence_run_observed'
        : 'persistence_run_not_observed',
      directions: {
        [side]: { qualifyingDays: count, longestRun: { days: run } },
      },
    });
    if (delta !== 0)
      expect(decision.reasonCodes).toEqual(['promotion_policy_unavailable']);
    if (side === 'below' && delta === -1)
      expect(decision.persistence.directions?.below.longestRun?.startDate).toBe(
        '2026-01-29',
      );
  },
);

test('A13-06: six current dates cannot establish evidence even with a visible run', () => {
  const decision = evaluate(
    series(fourBelow).filter((fact) => fact.id !== 'fact-34'),
  );
  expect(decision).toMatchObject({
    status: 'held',
    diff: { status: 'unknown', deltaHours: null },
    persistence: {
      status: 'unavailable',
      reasonCode: 'persistence_current_coverage_insufficient',
      directions: null,
    },
  });
});

test.each([
  {
    id: 'A13-07',
    omitted: 5,
    observedDays: 23,
    quality: 'sufficient',
    status: 'pattern_observed',
    reasonCode: 'persistence_run_observed',
  },
  {
    id: 'A13-08',
    omitted: 6,
    observedDays: 22,
    quality: 'limited',
    status: 'unavailable',
    reasonCode: 'persistence_reference_coverage_insufficient',
  },
])(
  '$id: reference coverage gates evidence separately from a numeric baseline',
  ({ omitted, observedDays, quality, status, reasonCode }) => {
    const decision = evaluate(series(fourBelow).slice(omitted));
    expect(decision.baselineEvidence.result).toMatchObject({
      status: quality,
      baseline: { sampleDays: observedDays },
    });
    expect(decision.persistence).toMatchObject({ status, reasonCode });
    expect(decision.diff.deltaHours).toBe(-1);
  },
);

test.each([28, 31])(
  'A13-09: source transition starting at index %i makes evidence unavailable',
  (from) => {
    const facts = series(fourBelow);
    for (const fact of facts.slice(from)) {
      fact.supports[0]!.sourceId = 'source-b';
      fact.supports[0]!.connectorId = 'connector-b';
    }
    const decision = evaluate(facts);
    expect(decision).toMatchObject({
      status: 'held',
      diff: { status: 'unknown', deltaHours: null },
      persistence: {
        status: 'unavailable',
        reasonCode: 'persistence_source_unproven',
      },
      baselineEvidence: {
        result: {
          quality: { combined: { sourceContinuity: { status: 'transition' } } },
        },
      },
    });
    expect(decision.diff.reasons).toContain('source_continuity_unproven');
  },
);

test.each(['overlap', 'conflict'] as const)(
  'A13-11: %s blocks persistence and keeps Quality evidence',
  (problem) => {
    const facts = series(fourBelow);
    if (problem === 'overlap') {
      const extra = structuredClone(facts[29]!);
      extra.id = 'extra-day-two';
      facts.push(extra);
    } else facts[29]!.has_unresolved_conflict = true;
    const decision = evaluate(facts);
    expect(decision).toMatchObject({
      status: 'held',
      diff: { status: 'unknown' },
      persistence: {
        status: 'unavailable',
        reasonCode: 'persistence_quality_blocked',
      },
    });
    const combined = decision.baselineEvidence.result.quality.combined;
    if (problem === 'overlap') expect(combined.sameDayExtraFactCount).toBe(1);
    else expect(combined.excludedFactIds).toEqual(['fact-30']);
  },
);

test.each([
  {
    hours: 7.5,
    status: 'pattern_observed',
    reasonCode: 'persistence_run_observed',
  },
  {
    hours: 7.75,
    status: 'pattern_not_observed',
    reasonCode: 'persistence_run_not_observed',
  },
])(
  'A13-12: MAD zero has an inclusive 0.5h floor at $hours hours',
  ({ hours, status, reasonCode }) => {
    const decision = evaluate(series([hours, hours, hours, hours, 8, 8, 8]));
    expect(decision.baselineEvidence.result.baseline?.madHours).toBe(0);
    expect(decision.persistence).toMatchObject({
      bandHours: 0.5,
      status,
      reasonCode,
    });
  },
);

test('A13-13: reference variation widens the band instead of counting noise', () => {
  const reference = Array.from({ length: 28 }, (_, i) => (i % 2 ? 8.5 : 7.5));
  const decision = evaluate(
    series([7.25, 7.25, 7.25, 7.25, 8, 8, 8], reference),
  );
  expect(decision.baselineEvidence.result.baseline).toMatchObject({
    medianHours: 8,
    madHours: 0.5,
  });
  expect(decision.persistence).toMatchObject({
    bandHours: 1,
    status: 'pattern_not_observed',
    reasonCode: 'persistence_run_not_observed',
    directions: { below: { qualifyingDays: 0, longestRun: null } },
  });
});

test.each([
  { median: 8.2, hours: 7.7, side: 'below', observed: true },
  { median: 8.2, hours: 7.700001, side: 'below', observed: false },
  { median: 8.2, hours: 7.699999, side: 'below', observed: true },
  { median: 7.7, hours: 8.2, side: 'above', observed: true },
  { median: 7.7, hours: 8.199999, side: 'above', observed: false },
  { median: 7.7, hours: 8.200001, side: 'above', observed: true },
  { median: 5.5, hours: 4.7, side: 'below', observed: true },
  { median: 5.5, hours: 6.3, side: 'above', observed: true },
] as const)(
  'A13 decimal boundary: baseline $median h and four days of $hours h',
  ({ median, hours, side, observed }) => {
    const reference = Array.from({ length: 28 }, (_, i) =>
      median === 5.5 ? (i % 2 === 0 ? 5.1 : 5.9) : median,
    );
    const decision = evaluate(
      series([hours, hours, hours, hours, median, median, median], reference),
    );
    expect(decision.status).toBe('held');
    expect(decision.baselineEvidence.result.status).toBe('sufficient');
    expect(decision.persistence.bandHours).toBeCloseTo(
      median === 5.5 ? 0.8 : 0.5,
    );
    expect(decision.persistence).toMatchObject({
      status: observed ? 'pattern_observed' : 'pattern_not_observed',
      reasonCode: observed
        ? 'persistence_run_observed'
        : 'persistence_run_not_observed',
      directions: { [side]: { qualifyingDays: observed ? 4 : 0 } },
    });
  },
);

test('A13-14: equal weekly medians can coexist with current-week persistence', () => {
  const reference = [...Array<number>(21).fill(8), ...Array<number>(7).fill(7)];
  const decision = evaluate(series(7, reference));
  expect(decision).toMatchObject({
    status: 'held',
    reasonCodes: ['diff_unchanged'],
    diff: { status: 'unchanged', deltaHours: 0 },
    baselineEvidence: { result: { baseline: { medianHours: 8 } } },
    persistence: {
      status: 'pattern_observed',
      reasonCode: 'persistence_run_observed',
      directions: {
        below: {
          longestRun: {
            days: 7,
            startDate: '2026-01-29',
            endDate: '2026-02-04',
          },
        },
      },
    },
  });
});

test('A13-15: correction changes a run and its lineage with the same D1 delta', () => {
  const facts = series([7, 7, 7, 7, 7, 8, 8]);
  const before = evaluate(facts);
  const revised = facts[30]!;
  revised.id = 'corrected-fact-31';
  revised.value = { kind: 'quantity', canonicalUnit: 'h', canonicalValue: 8 };
  revised.supports[0]!.rawId = 'replacement-raw-31';
  const after = evaluate(facts);
  expect(before.persistence).toMatchObject({
    status: 'pattern_observed',
    reasonCode: 'persistence_run_observed',
    directions: { below: { longestRun: { days: 5 } } },
  });
  expect(after.persistence).toMatchObject({
    status: 'pattern_not_observed',
    reasonCode: 'persistence_run_not_observed',
    directions: { below: { longestRun: { days: 2 } } },
  });
  expect([before.diff.deltaHours, after.diff.deltaHours]).toEqual([-1, -1]);
  expect(after.persistence.inputFingerprint).not.toBe(
    before.persistence.inputFingerprint,
  );
  expect(
    after.baselineEvidence.result.quality.current.provenance.factSupports,
  ).toContainEqual({
    factId: 'corrected-fact-31',
    supports: [
      expect.objectContaining({
        rawId: 'replacement-raw-31',
        sourceId: 'source-a',
      }),
    ],
  });
});

test('runtime rejects a reference start outside four-digit years before opening a connection', async () => {
  const connect = vi.fn();
  const pool = { connect } as unknown as Pool;
  await expect(
    sleepMeaningfulness(pool, personId, {
      startDate: '0000-01-15',
      endDateExclusive: '0000-01-22',
      asOfDate: '0000-01-22',
    }),
  ).rejects.toThrow('Sleep baseline reference start must be a four-digit date');
  expect(connect).not.toHaveBeenCalled();
});

test('runtime derives both analyses after one scoped read and rejects substituted inputs', async () => {
  vi.useFakeTimers();
  try {
    const request = {
      startDate: window.startDate,
      endDateExclusive: window.endDateExclusive,
      asOfDate: window.asOfDate,
    };
    const originalRequest = { ...request };
    const facts = series();
    const query = vi.fn(async (...[sql]: [string, unknown[]?]) => {
      if (sql.includes('FROM health.fact f')) {
        request.startDate = '2026-01-30';
        return { rows: facts };
      }
      if (sql === 'COMMIT') vi.setSystemTime(new Date(window.calculatedAt));
      return { rows: [] };
    });
    vi.setSystemTime(new Date('2026-02-05T00:00:00Z'));
    const connect = vi.fn(async () => ({ query, release: () => undefined }));
    const pool = { connect } as unknown as Pool;
    const foreignDiff = evaluateSleepMetricStatePair(
      facts,
      otherPerson,
      window,
    ).diff;
    const otherRevision = evaluate(series(6)).baselineEvidence;

    for (const injected of [
      { personId: otherPerson },
      { diff: foreignDiff },
      { baseline: otherRevision },
      { persistence: evaluate(series(6)).persistence },
      { calculatedAt: window.calculatedAt },
      { knowledgeAsOf: window.calculatedAt },
    ]) {
      const supplied = { ...request, ...injected };
      await expect(
        sleepMeaningfulness(pool, personId, supplied),
      ).rejects.toThrow('Only window dates may be supplied');
    }
    expect(connect).not.toHaveBeenCalled();

    const decision = await sleepMeaningfulness(pool, personId, request);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]).toEqual(['BEGIN READ ONLY']);
    expect(query).toHaveBeenCalledWith(
      "SELECT set_config('app.person_id', $1, true)",
      [personId],
    );
    expect(
      query.mock.calls
        .filter(([sql]) => sql.includes('FROM health.fact f'))
        .map(([, params]) => params),
    ).toEqual([[personId, '2026-01-01', '2026-02-05']]);
    expect(decision).toEqual(evaluate(facts));
    expect(decision.persistence).toMatchObject({
      personId,
      metricId: 'sleep_duration',
      calculatedAt: window.calculatedAt,
      inputFingerprint: decision.baselineEvidence.inputFingerprint,
    });
    expect(decision.diff.current.window).toEqual(originalRequest);
    expect(decision.diff.quality?.combined.calculatedAt).toBe(
      window.calculatedAt,
    );
    expect(
      decision.baselineEvidence?.result.quality.combined.calculatedAt,
    ).toBe(window.calculatedAt);
  } finally {
    vi.useRealTimers();
  }
});
