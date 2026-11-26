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

function series(current = 7): SleepFactRow[] {
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
        canonicalValue: i < 28 ? 8 : current,
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
      baselineEvidence: null,
    });
  }
});

test('partial A17: a tiny signed delta reaches baseline without evidence of persistence', () => {
  const decision = evaluate(series(7.999));
  expect(decision).toMatchObject({
    kind: 'partial_sleep_meaningfulness',
    status: 'held',
    policy: 'sleep-meaningfulness-evidence-v1',
    reasonCodes: ['persistence_evidence_unavailable'],
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
    persistence: 'unavailable',
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
      baselineEvidence: null,
    });
    expect(decision.diff.reasons).toContain(original);
  }
});

test('partial A17: limited Quality keeps the descriptive delta and reasons', () => {
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

test('partial A20: sorted evidence identifies corrections and support swaps even when medians agree', () => {
  const facts = series();
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

  facts[21]!.supports[0]!.rawId = 'raw-replacement';
  const swapped = evaluate(facts);
  expect(swapped.diff.deltaHours).toBe(before.diff.deltaHours);
  expect(swapped.diff.previous.inputFingerprint).not.toBe(
    corrected.diff.previous.inputFingerprint,
  );
  expect(swapped.baselineEvidence?.inputFingerprint).not.toBe(
    corrected.baselineEvidence?.inputFingerprint,
  );
  expect(
    swapped.baselineEvidence?.result.quality.reference.provenance.rawRecordIds,
  ).toContain('raw-replacement');
  expect(swapped.reasonCodes).toEqual(before.reasonCodes);
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
