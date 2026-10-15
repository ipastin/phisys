import { expect, test } from 'vitest';
import { goldenRecords, GOLDEN_VERSION } from './golden.js';

test('M1 golden profile is deterministic and covers the approved edge cases', () => {
  const first = goldenRecords();
  expect(first).toEqual(goldenRecords());
  expect(first).toHaveLength(83 * 4 + 2 + 1 + 2);
  expect(first.some((r) => r.externalRecordId.includes('2026-02-16'))).toBe(
    false,
  );
  expect(new Set(first.map((r) => r.connectorId))).toEqual(
    new Set([
      'synthetic-device-a',
      'synthetic-device-b',
      'synthetic-lab',
      'manual',
    ]),
  );
  expect(
    first.some((r) => r.externalRecordId.includes('2026-03-12:glucose')),
  ).toBe(true);
  expect(
    first.filter((r) => r.eventKey === `${GOLDEN_VERSION}:shared-measurement`),
  ).toHaveLength(2);
});
