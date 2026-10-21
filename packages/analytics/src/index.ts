import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import {
  readCurrentSleepFacts,
  type Pool,
  type SleepFactRow,
} from '@myphisys/database';

export type MetricDefinition = {
  readonly id: 'sleep_duration';
  readonly version: string;
  readonly conceptId: 'sleep_duration';
  readonly measurementClass: 'device_derived';
  readonly temporalClass: 'daily';
  readonly canonicalUnit: 'h';
  readonly aggregationPolicy: 'unique_local_dates';
  readonly baselinePolicy: 'lagged_rolling_median';
  readonly trendPolicy: 'descriptive';
  readonly comparisonPolicy: 'adjacent_complete_local_weeks';
  readonly interpretationPolicy: 'none';
  readonly qualityPolicy: {
    readonly minimumDays: number;
    readonly limitedCoverage: number;
    readonly sufficientCoverage: number;
    readonly maximumFreshnessDays: number;
    readonly minimumDurationHours: number;
    readonly maximumDurationHours: number;
  };
  readonly baselineParameters: {
    readonly referenceDays: number;
    readonly currentDays: number;
    readonly minimumReferenceDays: number;
  };
  readonly comparisonParameters: {
    readonly previousDays: 7;
    readonly currentDays: 7;
  };
};

export const sleepDuration: MetricDefinition = Object.freeze({
  id: 'sleep_duration',
  version: '1.2.0',
  conceptId: 'sleep_duration',
  measurementClass: 'device_derived',
  temporalClass: 'daily',
  canonicalUnit: 'h',
  aggregationPolicy: 'unique_local_dates',
  baselinePolicy: 'lagged_rolling_median',
  trendPolicy: 'descriptive',
  comparisonPolicy: 'adjacent_complete_local_weeks',
  interpretationPolicy: 'none',
  qualityPolicy: Object.freeze({
    minimumDays: 7,
    limitedCoverage: 0.5,
    sufficientCoverage: 0.8,
    maximumFreshnessDays: 7,
    minimumDurationHours: 0,
    // shortcut: 25h allows a one-hour fall-back day; use timezone-aware bounds when source zone data exists.
    maximumDurationHours: 25,
  }),
  baselineParameters: Object.freeze({
    referenceDays: 28,
    currentDays: 7,
    minimumReferenceDays: 21,
  }),
  comparisonParameters: Object.freeze({ previousDays: 7, currentDays: 7 }),
});
export const metricRegistry = Object.freeze({ sleep_duration: sleepDuration });

export type QualityWindow = {
  startDate: string;
  endDateExclusive: string;
  asOfDate: string;
  calculatedAt: string;
};

export type QualityResult = {
  metricId: 'sleep_duration';
  metricDefinitionVersion: string;
  algorithmVersion: 'sleep-quality-v1';
  parameters: MetricDefinition['qualityPolicy'];
  window: QualityWindow;
  status: 'sufficient' | 'limited' | 'insufficient';
  reasons: string[];
  coverage: { observedDays: number; expectedDays: number; ratio: number };
  sampleCount: number;
  missingDates: string[];
  freshnessDays: number | null;
  sameDayExtraFactCount: number;
  excludedFactIds: string[];
  unverifiedFactCount: number;
  duplicateReceiptCount: 'unavailable';
  sourceContinuity: {
    status: 'continuous' | 'transition' | 'ambiguous' | 'unknown';
    connectorIds: string[];
    transitions: { date: string; from: string; to: string }[];
  };
  provenance: {
    factIds: string[];
    factSupports: { factId: string; supports: SleepFactRow['supports'] }[];
    rawRecordIds: string[];
    sourceIds: string[];
    supports: {
      rawId: string;
      sourceId: string;
      connectorId: string;
      version: number;
      transformation: string;
    }[];
  };
  calculatedAt: string;
};

const dayMs = 86_400_000;

function day(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error('Expected YYYY-MM-DD');
  const time = Date.parse(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
  )
    throw new Error('Invalid calendar date');
  return time;
}

function checkedWindow(window: QualityWindow): {
  start: number;
  end: number;
  asOf: number;
} {
  const start = day(window.startDate);
  const end = day(window.endDateExclusive);
  const asOf = day(window.asOfDate);
  if (end <= start || asOf < end || (end - start) / dayMs > 366)
    throw new Error('Quality window must be 1–366 days and end by asOfDate');
  if (
    !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(window.calculatedAt) ||
    Number.isNaN(Date.parse(window.calculatedAt))
  )
    throw new Error('calculatedAt must be an ISO instant with offset');
  return { start, end, asOf };
}

export function evaluateSleepQuality(
  facts: SleepFactRow[],
  window: QualityWindow,
): QualityResult {
  const { start, end, asOf } = checkedWindow(window);
  const byDate = new Map<
    string,
    { factIds: string[]; connectors: Set<string> }
  >();
  const excludedFactIds: string[] = [];
  const factIds = new Set<string>();
  const factSupports: QualityResult['provenance']['factSupports'] = [];
  const rawRecordIds = new Set<string>();
  const sourceIds = new Set<string>();
  const connectors = new Set<string>();
  const supports = new Map<string, SleepFactRow['supports'][number]>();
  let unverifiedFactCount = 0;
  let sampleCount = 0;
  let missingProvenance = false;
  let invalidPoint = false;
  let unresolvedConflict = false;

  for (const fact of [...facts].sort((a, b) => a.id.localeCompare(b.id))) {
    const effective = fact.effective as {
      kind?: unknown;
      value?: unknown;
    } | null;
    const value = fact.value as {
      kind?: unknown;
      canonicalValue?: unknown;
      canonicalUnit?: unknown;
    } | null;
    const date =
      effective?.kind === 'local_date' && typeof effective.value === 'string'
        ? effective.value
        : '';
    let validDate = true;
    try {
      day(date);
    } catch {
      validDate = false;
    }
    if (
      validDate &&
      (date < window.startDate || date >= window.endDateExclusive)
    )
      continue;
    factIds.add(fact.id);
    factSupports.push({
      factId: fact.id,
      supports: fact.supports
        .map((support) => ({ ...support }))
        .sort((a, b) => a.rawId.localeCompare(b.rawId)),
    });
    for (const support of fact.supports) {
      rawRecordIds.add(support.rawId);
      sourceIds.add(support.sourceId);
      supports.set(support.rawId, { ...support });
    }
    const valid =
      validDate &&
      value?.kind === 'quantity' &&
      typeof value.canonicalValue === 'number' &&
      Number.isFinite(value.canonicalValue) &&
      value.canonicalUnit === sleepDuration.canonicalUnit &&
      value.canonicalValue >=
        sleepDuration.qualityPolicy.minimumDurationHours &&
      value.canonicalValue <= sleepDuration.qualityPolicy.maximumDurationHours;
    if (!valid || fact.supports.length === 0 || fact.has_unresolved_conflict) {
      excludedFactIds.push(fact.id);
      if (!valid) invalidPoint = true;
      if (fact.supports.length === 0) missingProvenance = true;
      if (fact.has_unresolved_conflict) unresolvedConflict = true;
      continue;
    }
    sampleCount++;
    if (fact.verification === 'unverified') unverifiedFactCount++;
    const entry = byDate.get(date) ?? {
      factIds: [],
      connectors: new Set<string>(),
    };
    entry.factIds.push(fact.id);
    for (const support of fact.supports) {
      entry.connectors.add(support.connectorId);
      connectors.add(support.connectorId);
    }
    byDate.set(date, entry);
  }

  const missingDates: string[] = [];
  for (let at = start; at < end; at += dayMs) {
    const date = new Date(at).toISOString().slice(0, 10);
    if (!byDate.has(date)) missingDates.push(date);
  }
  const expectedDays = (end - start) / dayMs;
  const observedDays = byDate.size;
  const ratio = observedDays / expectedDays;
  const sortedDates = [...byDate.keys()].sort();
  const freshnessDays = sortedDates.length
    ? (asOf - day(sortedDates[sortedDates.length - 1]!)) / dayMs
    : null;
  const transitions: { date: string; from: string; to: string }[] = [];
  let previous: string | undefined;
  let ambiguous = false;
  for (const date of sortedDates) {
    const sources = byDate.get(date)!.connectors;
    if (sources.size !== 1) {
      ambiguous = true;
      continue;
    }
    const current = [...sources][0]!;
    if (previous && previous !== current)
      transitions.push({ date, from: previous, to: current });
    previous = current;
  }
  const continuity = ambiguous
    ? 'ambiguous'
    : !sortedDates.length
      ? 'unknown'
      : transitions.length
        ? 'transition'
        : 'continuous';
  const sameDayExtraFactCount = sampleCount - observedDays;
  const reasons: string[] = [];
  if (observedDays < sleepDuration.qualityPolicy.minimumDays)
    reasons.push('insufficient_samples');
  if (ratio < sleepDuration.qualityPolicy.sufficientCoverage)
    reasons.push('incomplete_coverage');
  if (
    freshnessDays === null ||
    freshnessDays > sleepDuration.qualityPolicy.maximumFreshnessDays
  )
    reasons.push('stale');
  if (continuity === 'transition') reasons.push('source_transition');
  if (continuity === 'ambiguous') reasons.push('source_ambiguous');
  if (missingProvenance) reasons.push('missing_provenance');
  if (invalidPoint) reasons.push('invalid_point');
  if (unresolvedConflict) reasons.push('unresolved_conflict');
  if (unverifiedFactCount) reasons.push('unverified_inputs');
  if (sameDayExtraFactCount) reasons.push('same_day_overlap');
  const status =
    observedDays < sleepDuration.qualityPolicy.minimumDays ||
    ratio < sleepDuration.qualityPolicy.limitedCoverage
      ? 'insufficient'
      : reasons.length
        ? 'limited'
        : 'sufficient';

  return {
    metricId: sleepDuration.id,
    metricDefinitionVersion: sleepDuration.version,
    algorithmVersion: 'sleep-quality-v1',
    parameters: Object.freeze({ ...sleepDuration.qualityPolicy }),
    window: { ...window },
    status,
    reasons,
    coverage: { observedDays, expectedDays, ratio },
    sampleCount,
    missingDates,
    freshnessDays,
    sameDayExtraFactCount,
    excludedFactIds: excludedFactIds.sort(),
    unverifiedFactCount,
    duplicateReceiptCount: 'unavailable',
    sourceContinuity: {
      status: continuity,
      connectorIds: [...connectors].sort(),
      transitions,
    },
    provenance: {
      factIds: [...factIds].sort(),
      factSupports,
      rawRecordIds: [...rawRecordIds].sort(),
      sourceIds: [...sourceIds].sort(),
      supports: [...supports.values()].sort((a, b) =>
        a.rawId.localeCompare(b.rawId),
      ),
    },
    calculatedAt: window.calculatedAt,
  };
}

export async function sleepQuality(
  pool: Pool,
  personId: string,
  window: QualityWindow,
): Promise<QualityResult> {
  checkedWindow(window);
  return evaluateSleepQuality(
    await readCurrentSleepFacts(
      pool,
      personId,
      window.startDate,
      window.endDateExclusive,
    ),
    window,
  );
}

export type SleepBaselineTrendResult = {
  metricId: 'sleep_duration';
  metricDefinitionVersion: string;
  algorithmVersion: 'sleep-baseline-trend-v1';
  parameters: MetricDefinition['baselineParameters'];
  window: QualityWindow;
  status: 'sufficient' | 'limited' | 'insufficient';
  reasons: string[];
  quality: {
    reference: QualityResult;
    current: QualityResult;
    combined: QualityResult;
  };
  baseline: null | {
    window: { startDate: string; endDateExclusive: string };
    sampleDays: number;
    medianHours: number;
    madHours: number;
    iqrHours: number;
  };
  trend: null | {
    method: 'current_median_vs_reference_median';
    currentMedianHours: number;
    absoluteDeltaHours: number;
    relativeDelta: number | null;
    direction: 'increasing' | 'decreasing' | 'stable';
  };
  calculatedAt: string;
};

function median(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function dispersion(sorted: number[]): { mad: number; iqr: number } {
  const center = median(sorted);
  const deviations = sorted
    .map((value) => Math.abs(value - center))
    .sort((a, b) => a - b);
  // Inclusive Tukey hinges: an odd sample's median belongs to both halves.
  const half = Math.ceil(sorted.length / 2);
  return {
    mad: median(deviations),
    iqr:
      median(sorted.slice(sorted.length - half)) -
      median(sorted.slice(0, half)),
  };
}

export function evaluateSleepBaselineTrend(
  facts: SleepFactRow[],
  window: QualityWindow,
): SleepBaselineTrendResult {
  const { start, end } = checkedWindow(window);
  const parameters = Object.freeze({ ...sleepDuration.baselineParameters });
  if ((end - start) / dayMs !== parameters.currentDays)
    throw new Error('Current window must be exactly 7 local dates');
  const referenceStart = new Date(start - parameters.referenceDays * dayMs)
    .toISOString()
    .slice(0, 10);
  const referenceWindow = {
    ...window,
    startDate: referenceStart,
    endDateExclusive: window.startDate,
    asOfDate: window.startDate,
  };
  const combinedWindow = { ...window, startDate: referenceStart };
  const referenceFacts = facts.filter((fact) => {
    const date = (fact.effective as { value?: unknown } | null)?.value;
    return (
      typeof date === 'string' &&
      date >= referenceStart &&
      date < window.startDate
    );
  });
  const currentFacts = facts.filter((fact) => {
    const date = (fact.effective as { value?: unknown } | null)?.value;
    return (
      typeof date === 'string' &&
      date >= window.startDate &&
      date < window.endDateExclusive
    );
  });
  const quality = {
    reference: evaluateSleepQuality(referenceFacts, referenceWindow),
    current: evaluateSleepQuality(currentFacts, window),
    combined: evaluateSleepQuality(facts, combinedWindow),
  };
  const blockers: string[] = [];
  if (
    quality.reference.coverage.observedDays < parameters.minimumReferenceDays ||
    quality.reference.status === 'insufficient'
  )
    blockers.push('insufficient_reference');
  if (quality.current.status === 'insufficient')
    blockers.push('insufficient_current');
  if (
    quality.combined.sourceContinuity.status !== 'continuous' ||
    quality.combined.sourceContinuity.connectorIds.length !== 1
  )
    blockers.push('source_continuity_unproven');
  if (quality.combined.sameDayExtraFactCount) blockers.push('overlapping_day');
  if (quality.combined.excludedFactIds.length) blockers.push('excluded_inputs');
  const limitations = (['reference', 'current', 'combined'] as const).flatMap(
    (period) => quality[period].reasons.map((reason) => `${period}_${reason}`),
  );
  const reasons = [...blockers, ...limitations];
  const base = {
    metricId: sleepDuration.id,
    metricDefinitionVersion: sleepDuration.version,
    algorithmVersion: 'sleep-baseline-trend-v1' as const,
    parameters,
    window: { ...window },
    reasons,
    quality,
    calculatedAt: window.calculatedAt,
  };
  if (blockers.length)
    return { ...base, status: 'insufficient', baseline: null, trend: null };

  const values = (rows: SleepFactRow[]) =>
    rows
      .map((fact) => (fact.value as { canonicalValue: number }).canonicalValue)
      .sort((a, b) => a - b);
  const reference = values(referenceFacts);
  const current = values(currentFacts);
  const center = median(reference);
  const currentCenter = median(current);
  const delta = currentCenter - center;
  const { mad, iqr } = dispersion(reference);
  return {
    ...base,
    status: limitations.length ? 'limited' : 'sufficient',
    baseline: {
      window: { startDate: referenceStart, endDateExclusive: window.startDate },
      sampleDays: quality.reference.coverage.observedDays,
      medianHours: center,
      madHours: mad,
      iqrHours: iqr,
    },
    trend: {
      method: 'current_median_vs_reference_median',
      currentMedianHours: currentCenter,
      absoluteDeltaHours: delta,
      relativeDelta: center === 0 ? null : delta / center,
      direction: delta > 0 ? 'increasing' : delta < 0 ? 'decreasing' : 'stable',
    },
  };
}

export async function sleepBaselineTrend(
  pool: Pool,
  personId: string,
  window: QualityWindow,
): Promise<SleepBaselineTrendResult> {
  const { start, end } = checkedWindow(window);
  if ((end - start) / dayMs !== sleepDuration.baselineParameters.currentDays)
    throw new Error('Current window must be exactly 7 local dates');
  const referenceStart = new Date(
    start - sleepDuration.baselineParameters.referenceDays * dayMs,
  )
    .toISOString()
    .slice(0, 10);
  return evaluateSleepBaselineTrend(
    await readCurrentSleepFacts(
      pool,
      personId,
      referenceStart,
      window.endDateExclusive,
    ),
    window,
  );
}

function fingerprint(value: unknown): string {
  return createHash('sha256')
    .update(
      JSON.stringify(value, (_, value: unknown) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? Object.fromEntries(Object.entries(value).sort())
          : value,
      ),
    )
    .digest('hex');
}

function fingerprintSleepInputs(
  facts: SleepFactRow[],
  factIds: string[],
): string {
  const included = new Set(factIds);
  return fingerprint(
    facts
      .filter((fact) => included.has(fact.id))
      .map((fact) => ({
        id: fact.id,
        value: fact.value,
        effective: fact.effective,
        verification: fact.verification,
        epistemic: fact.epistemic,
        has_unresolved_conflict: fact.has_unresolved_conflict,
        supports: [...fact.supports].sort((a, b) =>
          a.rawId.localeCompare(b.rawId),
        ),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

export type SleepPeriodComparisonResult = {
  metricId: 'sleep_duration';
  metricDefinitionVersion: string;
  algorithmVersion: 'sleep-period-comparison-v1';
  policy: MetricDefinition['comparisonPolicy'];
  parameters: MetricDefinition['comparisonParameters'];
  window: QualityWindow;
  status: 'sufficient' | 'limited' | 'insufficient';
  reasons: string[];
  quality: {
    previous: QualityResult;
    current: QualityResult;
    combined: QualityResult;
  };
  inputFingerprints: { previous: string; current: string; comparison: string };
  comparison: null | {
    method: 'adjacent_week_medians';
    previousMedianHours: number;
    currentMedianHours: number;
    absoluteDeltaHours: number;
    relativeDelta: number | null;
    direction: 'increasing' | 'decreasing' | 'stable';
  };
  calculatedAt: string;
};

export function evaluateSleepPeriodComparison(
  facts: SleepFactRow[],
  window: QualityWindow,
): SleepPeriodComparisonResult {
  const { start, end } = checkedWindow(window);
  const parameters = Object.freeze({ ...sleepDuration.comparisonParameters });
  if ((end - start) / dayMs !== parameters.currentDays)
    throw new Error('Current window must be exactly 7 local dates');
  const previousStart = new Date(start - parameters.previousDays * dayMs)
    .toISOString()
    .slice(0, 10);
  const previousWindow = {
    ...window,
    startDate: previousStart,
    endDateExclusive: window.startDate,
    asOfDate: window.startDate,
  };
  const combinedWindow = { ...window, startDate: previousStart };
  const previousFacts = facts.filter((fact) => {
    const date = (fact.effective as { value?: unknown } | null)?.value;
    return (
      typeof date === 'string' &&
      date >= previousStart &&
      date < window.startDate
    );
  });
  const currentFacts = facts.filter((fact) => {
    const date = (fact.effective as { value?: unknown } | null)?.value;
    return (
      typeof date === 'string' &&
      date >= window.startDate &&
      date < window.endDateExclusive
    );
  });
  const quality = {
    previous: evaluateSleepQuality(previousFacts, previousWindow),
    current: evaluateSleepQuality(currentFacts, window),
    combined: evaluateSleepQuality(facts, combinedWindow),
  };
  const blockers: string[] = [];
  if (quality.previous.status === 'insufficient')
    blockers.push('insufficient_previous');
  if (quality.current.status === 'insufficient')
    blockers.push('insufficient_current');
  if (
    quality.combined.sourceContinuity.status !== 'continuous' ||
    quality.combined.sourceContinuity.connectorIds.length !== 1
  )
    blockers.push('source_continuity_unproven');
  if (quality.combined.sameDayExtraFactCount) blockers.push('overlapping_day');
  if (quality.combined.excludedFactIds.length) blockers.push('excluded_inputs');
  const limitations = (['previous', 'current', 'combined'] as const).flatMap(
    (period) => quality[period].reasons.map((reason) => `${period}_${reason}`),
  );
  const base = {
    metricId: sleepDuration.id,
    metricDefinitionVersion: sleepDuration.version,
    algorithmVersion: 'sleep-period-comparison-v1' as const,
    policy: sleepDuration.comparisonPolicy,
    parameters,
    window: { ...window },
    reasons: [...blockers, ...limitations],
    quality,
    inputFingerprints: {
      previous: fingerprintSleepInputs(
        previousFacts,
        quality.previous.provenance.factIds,
      ),
      current: fingerprintSleepInputs(
        currentFacts,
        quality.current.provenance.factIds,
      ),
      comparison: fingerprintSleepInputs(
        facts,
        quality.combined.provenance.factIds,
      ),
    },
    calculatedAt: window.calculatedAt,
  };
  if (blockers.length)
    return { ...base, status: 'insufficient', comparison: null };
  const values = (rows: SleepFactRow[]) =>
    rows
      .map((fact) => (fact.value as { canonicalValue: number }).canonicalValue)
      .sort((a, b) => a - b);
  const previousMedianHours = median(values(previousFacts));
  const currentMedianHours = median(values(currentFacts));
  const absoluteDeltaHours = currentMedianHours - previousMedianHours;
  return {
    ...base,
    status: limitations.length ? 'limited' : 'sufficient',
    comparison: {
      method: 'adjacent_week_medians',
      previousMedianHours,
      currentMedianHours,
      absoluteDeltaHours,
      relativeDelta:
        previousMedianHours === 0
          ? null
          : absoluteDeltaHours / previousMedianHours,
      direction:
        absoluteDeltaHours > 0
          ? 'increasing'
          : absoluteDeltaHours < 0
            ? 'decreasing'
            : 'stable',
    },
  };
}

export async function sleepPeriodComparison(
  pool: Pool,
  personId: string,
  window: QualityWindow,
): Promise<SleepPeriodComparisonResult> {
  const { start, end } = checkedWindow(window);
  if ((end - start) / dayMs !== sleepDuration.comparisonParameters.currentDays)
    throw new Error('Current window must be exactly 7 local dates');
  const previousStart = new Date(
    start - sleepDuration.comparisonParameters.previousDays * dayMs,
  )
    .toISOString()
    .slice(0, 10);
  return evaluateSleepPeriodComparison(
    await readCurrentSleepFacts(
      pool,
      personId,
      previousStart,
      window.endDateExclusive,
    ),
    window,
  );
}

export type SleepMetricStateRequest = Omit<QualityWindow, 'calculatedAt'>;

function fingerprintComparisonContext(
  comparison: SleepPeriodComparisonResult,
  personId: string,
): string {
  return fingerprint({
    personId,
    inputFingerprint: comparison.inputFingerprints?.comparison,
    quality: comparison.quality,
    metricDefinitionVersion: comparison.metricDefinitionVersion,
    calculatedAt: comparison.calculatedAt,
    status: comparison.status,
    reasons: comparison.reasons,
    comparisonAvailable: comparison.comparison !== null,
    previousMedianHours: comparison.comparison?.previousMedianHours ?? null,
    currentMedianHours: comparison.comparison?.currentMedianHours ?? null,
    comparisonAlgorithmVersion: comparison.algorithmVersion,
    comparisonPolicy: comparison.policy,
    comparisonParameters: comparison.parameters,
    comparisonMethod: comparison.comparison?.method ?? null,
  });
}

export type SleepMetricStateSnapshot = {
  kind: 'partial_sleep_metric_state';
  identity: {
    personId: string;
    scope: 'sleep_duration';
    window: { startDate: string; endDateExclusive: string; asOfDate: string };
    algorithmVersion: 'sleep-metric-state-v1';
    metricDefinitionVersion: string;
    inputFactIds: string[];
    inputFingerprint: string;
    comparisonContextFingerprint: string;
    factSupports: QualityResult['provenance']['factSupports'];
  };
  observedAt: { factId: string; effective: unknown }[];
  medianHours: number | null;
  quality: QualityResult;
  structuralDomains: {
    conditions: 'unavailable';
    medications: 'unavailable';
    allergies: 'unavailable';
    goals: 'unavailable';
    recentEvents: 'unavailable';
    conflicts: 'unavailable';
  };
  calculatedAt: string;
  knowledgeAsOf: 'unavailable';
};

export type SleepMetricStateDiff = {
  kind: 'partial_sleep_metric_state_diff';
  algorithmVersion: 'sleep-metric-state-diff-v1';
  comparisonAlgorithmVersion: SleepPeriodComparisonResult['algorithmVersion'];
  comparisonPolicy: SleepPeriodComparisonResult['policy'];
  comparisonParameters: SleepPeriodComparisonResult['parameters'];
  comparisonMethod:
    NonNullable<SleepPeriodComparisonResult['comparison']>['method'] | null;
  status: 'numeric_changed' | 'unchanged' | 'unknown' | 'incompatible';
  deltaHours: number | null;
  qualityStatus: SleepPeriodComparisonResult['status'] | null;
  quality: SleepPeriodComparisonResult['quality'] | null;
  reasons: string[];
  previous: SleepMetricStateSnapshot['identity'];
  current: SleepMetricStateSnapshot['identity'];
  /** Computation time only; it cannot answer historical knowledge-as-of queries. */
  calculatedAt: string;
  knowledgeAsOf: 'unavailable';
  /** numeric_changed is descriptive, never an InsightCandidate or What Changed item. Step 13 must assess Quality, reasons, uncertainty, baseline and persistence. */
  promotion: 'requires_step13_meaningfulness';
};

export type SleepMetricStatePair = {
  kind: 'partial_sleep_metric_state_pair';
  previous: SleepMetricStateSnapshot;
  current: SleepMetricStateSnapshot;
  diff: SleepMetricStateDiff;
  calculatedAt: string;
  knowledgeAsOf: 'unavailable';
};

const unavailableStructuralDomains = {
  conditions: 'unavailable',
  medications: 'unavailable',
  allergies: 'unavailable',
  goals: 'unavailable',
  recentEvents: 'unavailable',
  conflicts: 'unavailable',
} as const;

function metricStateSnapshot(
  personId: string,
  facts: SleepFactRow[],
  quality: QualityResult,
  comparisonContextFingerprint: string,
): SleepMetricStateSnapshot {
  const inputFactIds = [...quality.provenance.factIds];
  const included = new Set(inputFactIds);
  const inputFingerprint = fingerprintSleepInputs(facts, inputFactIds);
  const numericAllowed =
    quality.status !== 'insufficient' &&
    quality.sourceContinuity.status === 'continuous' &&
    quality.sourceContinuity.connectorIds.length === 1 &&
    quality.sameDayExtraFactCount === 0 &&
    quality.excludedFactIds.length === 0;
  const medianHours = numericAllowed
    ? median(
        facts
          .filter((fact) => included.has(fact.id))
          .map(
            (fact) => (fact.value as { canonicalValue: number }).canonicalValue,
          )
          .sort((a, b) => a - b),
      )
    : null;
  return {
    kind: 'partial_sleep_metric_state',
    identity: {
      personId,
      scope: 'sleep_duration',
      window: {
        startDate: quality.window.startDate,
        endDateExclusive: quality.window.endDateExclusive,
        asOfDate: quality.window.asOfDate,
      },
      algorithmVersion: 'sleep-metric-state-v1',
      metricDefinitionVersion: quality.metricDefinitionVersion,
      inputFactIds,
      inputFingerprint,
      comparisonContextFingerprint,
      factSupports: quality.provenance.factSupports.map(
        ({ factId, supports }) => ({
          factId,
          supports: supports.map((support) => ({ ...support })),
        }),
      ),
    },
    observedAt: facts
      .filter((fact) => included.has(fact.id))
      .map((fact) => ({
        factId: fact.id,
        effective: structuredClone(fact.effective),
      }))
      .sort((a, b) => a.factId.localeCompare(b.factId)),
    medianHours,
    quality: structuredClone(quality),
    structuralDomains: { ...unavailableStructuralDomains },
    calculatedAt: quality.calculatedAt,
    knowledgeAsOf: 'unavailable',
  };
}

export function diffSleepMetricStateSnapshots(
  previous: SleepMetricStateSnapshot,
  current: SleepMetricStateSnapshot,
  comparison: SleepPeriodComparisonResult,
): SleepMetricStateDiff {
  const a = previous.identity;
  const b = current.identity;
  const compatible =
    a.personId === b.personId &&
    a.scope === b.scope &&
    a.algorithmVersion === b.algorithmVersion &&
    a.metricDefinitionVersion === b.metricDefinitionVersion &&
    a.metricDefinitionVersion === comparison.metricDefinitionVersion &&
    a.window.endDateExclusive === b.window.startDate &&
    a.window.startDate === comparison.quality.previous.window.startDate &&
    a.window.endDateExclusive ===
      comparison.quality.previous.window.endDateExclusive &&
    a.window.asOfDate === comparison.quality.previous.window.asOfDate &&
    b.window.startDate === comparison.quality.current.window.startDate &&
    b.window.endDateExclusive ===
      comparison.quality.current.window.endDateExclusive &&
    b.window.asOfDate === comparison.quality.current.window.asOfDate &&
    previous.calculatedAt === current.calculatedAt &&
    current.calculatedAt === comparison.calculatedAt &&
    JSON.stringify(a.inputFactIds) ===
      JSON.stringify(comparison.quality.previous.provenance.factIds) &&
    JSON.stringify(b.inputFactIds) ===
      JSON.stringify(comparison.quality.current.provenance.factIds) &&
    JSON.stringify(a.factSupports) ===
      JSON.stringify(comparison.quality.previous.provenance.factSupports) &&
    JSON.stringify(b.factSupports) ===
      JSON.stringify(comparison.quality.current.provenance.factSupports) &&
    a.inputFingerprint === comparison.inputFingerprints?.previous &&
    b.inputFingerprint === comparison.inputFingerprints?.current &&
    a.comparisonContextFingerprint ===
      fingerprintComparisonContext(comparison, a.personId) &&
    b.comparisonContextFingerprint === a.comparisonContextFingerprint &&
    isDeepStrictEqual(previous.quality, comparison.quality.previous) &&
    isDeepStrictEqual(current.quality, comparison.quality.current) &&
    (comparison.comparison === null ||
      (previous.medianHours === comparison.comparison.previousMedianHours &&
        current.medianHours === comparison.comparison.currentMedianHours));
  const deltaHours =
    compatible && comparison.comparison
      ? comparison.comparison.currentMedianHours -
        comparison.comparison.previousMedianHours
      : null;
  return {
    kind: 'partial_sleep_metric_state_diff',
    algorithmVersion: 'sleep-metric-state-diff-v1',
    comparisonAlgorithmVersion: comparison.algorithmVersion,
    comparisonPolicy: comparison.policy,
    comparisonParameters: { ...comparison.parameters },
    comparisonMethod: comparison.comparison?.method ?? null,
    status: !compatible
      ? 'incompatible'
      : deltaHours === null
        ? 'unknown'
        : deltaHours === 0
          ? 'unchanged'
          : 'numeric_changed',
    deltaHours,
    qualityStatus: compatible ? comparison.status : null,
    quality: compatible ? structuredClone(comparison.quality) : null,
    reasons: compatible
      ? [...comparison.reasons]
      : ['incompatible_snapshot_identity'],
    previous: structuredClone(a),
    current: structuredClone(b),
    calculatedAt: comparison.calculatedAt,
    knowledgeAsOf: 'unavailable',
    promotion: 'requires_step13_meaningfulness',
  };
}

export function evaluateSleepMetricStatePair(
  facts: SleepFactRow[],
  personId: string,
  window: QualityWindow,
): SleepMetricStatePair {
  const comparison = evaluateSleepPeriodComparison(facts, window);
  const comparisonContextFingerprint = fingerprintComparisonContext(
    comparison,
    personId,
  );
  const previous = metricStateSnapshot(
    personId,
    facts,
    comparison.quality.previous,
    comparisonContextFingerprint,
  );
  const current = metricStateSnapshot(
    personId,
    facts,
    comparison.quality.current,
    comparisonContextFingerprint,
  );
  return {
    kind: 'partial_sleep_metric_state_pair',
    previous,
    current,
    diff: diffSleepMetricStateSnapshots(previous, current, comparison),
    calculatedAt: window.calculatedAt,
    knowledgeAsOf: 'unavailable',
  };
}

export async function sleepMetricStatePair(
  pool: Pool,
  personId: string,
  request: SleepMetricStateRequest,
): Promise<SleepMetricStatePair> {
  if (
    Object.keys(request).some(
      (key) => !['startDate', 'endDateExclusive', 'asOfDate'].includes(key),
    )
  )
    throw new Error('Only window dates may be supplied');
  const dates = {
    startDate: request.startDate,
    endDateExclusive: request.endDateExclusive,
    asOfDate: request.asOfDate,
  };
  const start = day(dates.startDate);
  const end = day(dates.endDateExclusive);
  const asOf = day(dates.asOfDate);
  if (
    (end - start) / dayMs !== sleepDuration.comparisonParameters.currentDays ||
    asOf < end
  )
    throw new Error('Current window must be 7 closed local dates');
  const previousStart = new Date(
    start - sleepDuration.comparisonParameters.previousDays * dayMs,
  )
    .toISOString()
    .slice(0, 10);
  const facts = await readCurrentSleepFacts(
    pool,
    personId,
    previousStart,
    dates.endDateExclusive,
  );
  const calculatedAt = new Date().toISOString();
  return evaluateSleepMetricStatePair(facts, personId, {
    ...dates,
    calculatedAt,
  });
}
