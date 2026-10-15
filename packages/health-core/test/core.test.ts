import { describe, expect, test } from 'vitest';
import {
  validateCanonical,
  validateTemporal,
  type CanonicalInput,
} from '../src/index.js';

const base: CanonicalInput = {
  personId: 'person',
  provenanceRawId: 'raw',
  conceptId: 'weight',
  kind: 'observation',
  value: { kind: 'quantity', originalValue: 200, originalUnit: 'lb' },
  effective: { kind: 'partial', value: '2026-03' },
  recordedAt: '2026-03-20T12:00:00Z',
  epistemic: 'user_reported',
  verification: 'unverified',
};

describe('canonical validation', () => {
  test('retains original quantity, converts only with concept context, and preserves partial precision', () => {
    const result = validateCanonical(structuredClone(base));
    expect(result.value).toMatchObject({
      originalValue: 200,
      originalUnit: 'lb',
      canonicalUnit: 'kg',
      conversion: 'weight-lb-to-kg-v1',
    });
    expect(result.effective).toEqual({ kind: 'partial', value: '2026-03' });
  });
  test('rejects unsupported unit, absent provenance and inferred facts', () => {
    expect(() => validateCanonical({ ...base, conceptId: 'glucose' })).toThrow(
      'Unit',
    );
    expect(() => validateCanonical({ ...base, provenanceRawId: '' })).toThrow(
      'provenance',
    );
    expect(() => validateCanonical({ ...base, epistemic: 'inferred' })).toThrow(
      'Inferred',
    );
  });
  test('rejects invented and impossible dates', () => {
    expect(() =>
      validateTemporal({ kind: 'local_date', value: '2026-02-30' }),
    ).toThrow();
    expect(() =>
      validateTemporal({ kind: 'partial', value: '2026-00' }),
    ).toThrow();
    expect(() =>
      validateTemporal({ kind: 'instant', value: '2026-02-30T12:00:00Z' }),
    ).toThrow();
  });
  test('unknown symptom status stays unknown', () => {
    expect(
      validateCanonical({
        ...base,
        conceptId: 'symptom',
        kind: 'symptom',
        value: { kind: 'status', status: 'unknown' },
      }).value,
    ).toEqual({ kind: 'status', status: 'unknown' });
  });
});
