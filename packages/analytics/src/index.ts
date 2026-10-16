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
};

export const sleepDuration: MetricDefinition = Object.freeze({
  id: 'sleep_duration',
  version: '1.1.0',
  conceptId: 'sleep_duration',
  measurementClass: 'device_derived',
  temporalClass: 'daily',
  canonicalUnit: 'h',
  aggregationPolicy: 'unique_local_dates',
  baselinePolicy: 'lagged_rolling_median',
  trendPolicy: 'descriptive',
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
      supports.set(support.rawId, support);
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
    window,
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
    window,
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
