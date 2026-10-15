import {
  readCurrentSleepFacts,
  type Pool,
  type SleepFactRow,
} from '@myphisys/database';

export type MetricDefinition = {
  id: 'sleep_duration';
  version: string;
  conceptId: 'sleep_duration';
  measurementClass: 'device_derived';
  temporalClass: 'daily';
  canonicalUnit: 'h';
  aggregationPolicy: 'unique_local_dates';
  baselinePolicy: 'lagged_rolling_median';
  trendPolicy: 'descriptive';
  interpretationPolicy: 'none';
  qualityPolicy: {
    minimumDays: number;
    limitedCoverage: number;
    sufficientCoverage: number;
    maximumFreshnessDays: number;
  };
};

export const sleepDuration: MetricDefinition = {
  id: 'sleep_duration',
  version: '1.0.0',
  conceptId: 'sleep_duration',
  measurementClass: 'device_derived',
  temporalClass: 'daily',
  canonicalUnit: 'h',
  aggregationPolicy: 'unique_local_dates',
  baselinePolicy: 'lagged_rolling_median',
  trendPolicy: 'descriptive',
  interpretationPolicy: 'none',
  qualityPolicy: {
    minimumDays: 7,
    limitedCoverage: 0.5,
    sufficientCoverage: 0.8,
    maximumFreshnessDays: 7,
  },
};
export const metricRegistry = { sleep_duration: sleepDuration } as const;

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
    factIds.add(fact.id);
    for (const support of fact.supports) {
      rawRecordIds.add(support.rawId);
      sourceIds.add(support.sourceId);
      supports.set(support.rawId, support);
    }
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
    const valid =
      date >= window.startDate &&
      date < window.endDateExclusive &&
      value?.kind === 'quantity' &&
      typeof value.canonicalValue === 'number' &&
      Number.isFinite(value.canonicalValue) &&
      value.canonicalUnit === sleepDuration.canonicalUnit;
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
    parameters: sleepDuration.qualityPolicy,
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
