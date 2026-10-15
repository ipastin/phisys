import type { SourceRecord } from '../src/index.js';

export const GOLDEN_VERSION = 'm1-golden-v1';
export const PERSON_A = '0199a1c0-1234-7abc-8def-123456789abc';
export const PERSON_B = '0199a1c0-1234-7abc-8def-123456789abd';

export function goldenRecords(personId = PERSON_A): SourceRecord[] {
  const records: SourceRecord[] = [];
  const start = Date.UTC(2026, 0, 1);
  for (let day = 0; day < 90; day++) {
    if (day >= 45 && day < 52) continue;
    const date = new Date(start + day * 86_400_000).toISOString().slice(0, 10);
    const connectorId = day < 60 ? 'synthetic-device-a' : 'synthetic-device-b';
    const values: [string, number, string][] = [
      ['sleep_duration', day === 70 ? 2 : 7.5 + day * 0.005, 'h'],
      ['heart_rate', 60 + Math.floor(day / 20), '/min'],
      ['steps', 7_000 + day * 10, '{steps}'],
      ['weight', 72 + day * 0.01, 'kg'],
    ];
    for (const [conceptId, value, unit] of values) {
      records.push({
        personId,
        connectorId,
        externalRecordId: `${GOLDEN_VERSION}:${date}:${conceptId}`,
        version: 1,
        operation: 'upsert',
        recordedAt: `${date}T12:00:00Z`,
        payload: {
          conceptId,
          kind: 'observation',
          value: { kind: 'quantity', originalValue: value, originalUnit: unit },
          effective: { kind: 'local_date', value: date },
        },
      });
    }
  }
  for (const [date, value] of [
    ['2026-01-12', 5.2],
    ['2026-03-12', 5.8],
  ] as const)
    records.push({
      personId,
      connectorId: 'synthetic-lab',
      externalRecordId: `${GOLDEN_VERSION}:${date}:glucose`,
      version: 1,
      operation: 'upsert',
      recordedAt: `${date}T12:00:00Z`,
      payload: {
        conceptId: 'glucose',
        kind: 'observation',
        value: {
          kind: 'quantity',
          originalValue: value,
          originalUnit: 'mmol/L',
        },
        effective: { kind: 'local_date', value: date },
      },
    });
  records.push({
    personId,
    connectorId: 'manual',
    externalRecordId: `${GOLDEN_VERSION}:symptom`,
    version: 1,
    operation: 'upsert',
    recordedAt: '2026-03-10T12:00:00Z',
    payload: {
      conceptId: 'symptom',
      kind: 'symptom',
      value: { kind: 'status', status: 'present' },
      effective: { kind: 'local_date', value: '2026-03-10' },
    },
  });
  records.push({
    personId,
    connectorId: 'synthetic-device-a',
    externalRecordId: `${GOLDEN_VERSION}:conflict-a`,
    eventKey: `${GOLDEN_VERSION}:shared-measurement`,
    version: 1,
    operation: 'upsert',
    recordedAt: '2026-03-20T12:00:00Z',
    payload: {
      conceptId: 'weight',
      kind: 'observation',
      value: { kind: 'quantity', originalValue: 73, originalUnit: 'kg' },
      effective: { kind: 'local_date', value: '2026-03-20' },
    },
  });
  records.push({
    personId,
    connectorId: 'synthetic-device-b',
    externalRecordId: `${GOLDEN_VERSION}:conflict-b`,
    eventKey: `${GOLDEN_VERSION}:shared-measurement`,
    version: 1,
    operation: 'upsert',
    recordedAt: '2026-03-20T12:00:00Z',
    payload: {
      conceptId: 'weight',
      kind: 'observation',
      value: { kind: 'quantity', originalValue: 74, originalUnit: 'kg' },
      effective: { kind: 'local_date', value: '2026-03-20' },
    },
  });
  return records;
}
