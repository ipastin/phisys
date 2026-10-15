export type TemporalValue =
  | { kind: 'instant'; value: string }
  | { kind: 'local_date'; value: string }
  | { kind: 'partial'; value: string }
  | { kind: 'period'; start: string; end: string };

export type Quantity = {
  kind: 'quantity';
  originalValue: number;
  originalUnit: string;
  canonicalValue?: number;
  canonicalUnit?: string;
  conversion?: string;
};

export type FactValue =
  Quantity | { kind: 'status'; status: 'present' | 'absent' | 'unknown' };
export type Epistemic =
  | 'source_recorded'
  | 'user_reported'
  | 'normalized'
  | 'calculated'
  | 'inferred'
  | 'disputed'
  | 'unknown';
export type Verification =
  'source_verified' | 'user_verified' | 'system_verified' | 'unverified';
export type FactKind = 'observation' | 'symptom';

export type CanonicalInput = {
  personId: string;
  conceptId: string;
  kind: FactKind;
  value: FactValue;
  effective: TemporalValue;
  recordedAt: string;
  epistemic: Epistemic;
  verification: Verification;
  provenanceRawId: string;
};

export class DomainError extends Error {
  constructor(
    public readonly code:
      | 'invalid_time'
      | 'invalid_value'
      | 'unknown_concept'
      | 'unsupported_unit'
      | 'missing_provenance'
      | 'invalid_identity',
    message: string,
  ) {
    super(message);
  }
}

const concepts: Record<
  string,
  { kind: FactKind; unit?: string; units?: string[] }
> = {
  sleep_duration: { kind: 'observation', unit: 'h', units: ['h'] },
  heart_rate: { kind: 'observation', unit: '/min', units: ['/min'] },
  steps: { kind: 'observation', unit: '{steps}', units: ['{steps}'] },
  weight: { kind: 'observation', unit: 'kg', units: ['kg', 'lb'] },
  systolic_bp: { kind: 'observation', unit: 'mm[Hg]', units: ['mm[Hg]'] },
  diastolic_bp: { kind: 'observation', unit: 'mm[Hg]', units: ['mm[Hg]'] },
  glucose: { kind: 'observation', unit: 'mmol/L', units: ['mmol/L'] },
  body_temperature: {
    kind: 'observation',
    unit: 'Cel',
    units: ['Cel', '[degF]'],
  },
  symptom: { kind: 'symptom' },
};

export const conceptIds = Object.keys(concepts);

export function validateTemporal(value: TemporalValue): TemporalValue {
  if (value.kind === 'instant') {
    const parts =
      /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/.exec(
        value.value,
      );
    if (
      !parts ||
      !validDate(parts[1]!) ||
      Number(parts[2]) > 23 ||
      Number(parts[3]) > 59 ||
      Number(parts[4]) > 59 ||
      Number(parts[6] ?? 0) > 23 ||
      Number(parts[7] ?? 0) > 59 ||
      Number.isNaN(Date.parse(value.value))
    )
      throw new DomainError(
        'invalid_time',
        'Instant must include a valid date and offset',
      );
  } else if (value.kind === 'local_date') {
    if (!validDate(value.value))
      throw new DomainError('invalid_time', 'Invalid local date');
  } else if (value.kind === 'partial') {
    if (!/^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/.test(value.value))
      throw new DomainError(
        'invalid_time',
        'Partial date must have year or year-month precision',
      );
  } else if (value.kind === 'period') {
    validateTemporal({ kind: 'instant', value: value.start });
    validateTemporal({ kind: 'instant', value: value.end });
    if (Date.parse(value.start) >= Date.parse(value.end))
      throw new DomainError('invalid_time', 'Period end must follow start');
  } else {
    throw new DomainError('invalid_time', 'Unknown temporal kind');
  }
  return value;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

export function validateCanonical(input: CanonicalInput): CanonicalInput {
  if (!input.personId || !input.provenanceRawId)
    throw new DomainError(
      'missing_provenance',
      'Person and Raw provenance are required',
    );
  const concept = concepts[input.conceptId];
  if (!concept || concept.kind !== input.kind)
    throw new DomainError(
      'unknown_concept',
      'Concept is not allowlisted for this kind',
    );
  validateTemporal(input.effective);
  validateTemporal({ kind: 'instant', value: input.recordedAt });
  if (input.value.kind === 'quantity') {
    if (!Number.isFinite(input.value.originalValue))
      throw new DomainError('invalid_value', 'Quantity must be finite');
    if (input.conceptId !== 'body_temperature' && input.value.originalValue < 0)
      throw new DomainError('invalid_value', 'Quantity cannot be negative');
    if (!concept.units?.includes(input.value.originalUnit))
      throw new DomainError(
        'unsupported_unit',
        'Unit is not allowlisted for this concept',
      );
    if (input.conceptId === 'weight' && input.value.originalUnit === 'lb') {
      input.value.canonicalValue = input.value.originalValue * 0.45359237;
      input.value.canonicalUnit = 'kg';
      input.value.conversion = 'weight-lb-to-kg-v1';
    } else if (
      input.conceptId === 'body_temperature' &&
      input.value.originalUnit === '[degF]'
    ) {
      input.value.canonicalValue = ((input.value.originalValue - 32) * 5) / 9;
      input.value.canonicalUnit = 'Cel';
      input.value.conversion = 'temperature-f-to-c-v1';
    } else {
      input.value.canonicalValue = input.value.originalValue;
      input.value.canonicalUnit = concept.unit!;
      input.value.conversion = 'identity-v1';
    }
  } else if (
    input.kind !== 'symptom' ||
    !['present', 'absent', 'unknown'].includes(input.value.status)
  ) {
    throw new DomainError(
      'invalid_value',
      'Status is only supported for symptom',
    );
  }
  if (input.epistemic === 'inferred')
    throw new DomainError(
      'invalid_value',
      'Inferred information cannot become a canonical source fact',
    );
  return input;
}
