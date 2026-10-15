import { expect, test } from 'vitest';
import { manualRecords } from '../src/index.js';

const base = {
  personId: 'person',
  externalRecordId: 'bp-1',
  version: 1,
  recordedAt: '2026-10-15T12:00:00Z',
  effective: { kind: 'local_date' as const, value: '2026-10-15' },
};

test('blood pressure preserves both components and shared time', () => {
  const records = manualRecords({
    ...base,
    type: 'blood_pressure',
    systolic: 120,
    diastolic: 80,
    unit: 'mm[Hg]',
  });
  expect(records.map((r) => r.externalRecordId)).toEqual([
    'bp-1:systolic',
    'bp-1:diastolic',
  ]);
  expect(records.map((r) => r.payload.effective)).toEqual([
    base.effective,
    base.effective,
  ]);
});

test('manual delete emits a tombstone representation', () => {
  expect(
    manualRecords({ ...base, type: 'delete', recordType: 'single' })[0],
  ).toMatchObject({ operation: 'delete', connectorId: 'manual', version: 1 });
  expect(
    manualRecords({
      ...base,
      type: 'delete',
      recordType: 'blood_pressure',
    }).map((r) => r.externalRecordId),
  ).toEqual(['bp-1:systolic', 'bp-1:diastolic']);
});
