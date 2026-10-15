import type { SourceRecord } from '@myphisys/ingestion';

type ManualBase = {
  personId: string;
  externalRecordId: string;
  version: number;
  recordedAt: string;
  effective: SourceRecord['payload']['effective'];
  eventKey?: string;
};

export type ManualInput = ManualBase &
  (
    | { type: 'weight'; value: number; unit: 'kg' | 'lb' }
    | {
        type: 'blood_pressure';
        systolic: number;
        diastolic: number;
        unit: 'mm[Hg]';
      }
    | {
        type: 'observation';
        conceptId:
          | 'sleep_duration'
          | 'heart_rate'
          | 'steps'
          | 'glucose'
          | 'body_temperature';
        value: number;
        unit: string;
      }
    | { type: 'symptom'; status: 'present' | 'absent' | 'unknown' }
    | { type: 'delete'; recordType: 'single' | 'blood_pressure' }
  );

export function manualRecords(input: ManualInput): SourceRecord[] {
  const base = {
    personId: input.personId,
    connectorId: 'manual',
    version: input.version,
    recordedAt: input.recordedAt,
    ...(input.eventKey ? { eventKey: input.eventKey } : {}),
  };
  if (input.type === 'delete') {
    if (input.recordType === 'blood_pressure')
      return ['systolic', 'diastolic'].map((component) => ({
        ...base,
        externalRecordId: `${input.externalRecordId}:${component}`,
        ...(input.eventKey
          ? { eventKey: `${input.eventKey}:${component}` }
          : {}),
        operation: 'delete' as const,
        payload: {},
      }));
    return [
      {
        ...base,
        externalRecordId: input.externalRecordId,
        operation: 'delete',
        payload: {},
      },
    ];
  }
  if (!input.effective) throw new Error('Effective time is required');
  if (input.type === 'blood_pressure') {
    return [
      {
        ...base,
        externalRecordId: `${input.externalRecordId}:systolic`,
        ...(input.eventKey ? { eventKey: `${input.eventKey}:systolic` } : {}),
        operation: 'upsert',
        payload: {
          conceptId: 'systolic_bp',
          kind: 'observation',
          value: {
            kind: 'quantity',
            originalValue: input.systolic,
            originalUnit: input.unit,
          },
          effective: input.effective,
        },
      },
      {
        ...base,
        externalRecordId: `${input.externalRecordId}:diastolic`,
        ...(input.eventKey ? { eventKey: `${input.eventKey}:diastolic` } : {}),
        operation: 'upsert',
        payload: {
          conceptId: 'diastolic_bp',
          kind: 'observation',
          value: {
            kind: 'quantity',
            originalValue: input.diastolic,
            originalUnit: input.unit,
          },
          effective: input.effective,
        },
      },
    ];
  }
  if (input.type === 'symptom')
    return [
      {
        ...base,
        externalRecordId: input.externalRecordId,
        operation: 'upsert',
        payload: {
          conceptId: 'symptom',
          kind: 'symptom',
          value: { kind: 'status', status: input.status },
          effective: input.effective,
        },
      },
    ];
  const conceptId = input.type === 'weight' ? 'weight' : input.conceptId;
  return [
    {
      ...base,
      externalRecordId: input.externalRecordId,
      operation: 'upsert',
      payload: {
        conceptId,
        kind: 'observation',
        value: {
          kind: 'quantity',
          originalValue: input.value,
          originalUnit: input.unit,
        },
        effective: input.effective,
      },
    },
  ];
}
