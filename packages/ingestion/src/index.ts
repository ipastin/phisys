import { createHash } from 'node:crypto';
import {
  uuidv7,
  withPerson,
  type Pool,
  type PoolClient,
} from '@myphisys/database';
import {
  DomainError,
  validateCanonical,
  validateTemporal,
  type CanonicalInput,
  type FactKind,
  type FactValue,
  type TemporalValue,
} from '@myphisys/health-core';

export type SourceRecord = {
  personId: string;
  connectorId: string;
  externalRecordId: string;
  version: number;
  operation: 'upsert' | 'delete';
  recordedAt: string;
  eventKey?: string;
  payload: {
    conceptId?: string;
    kind?: FactKind;
    value?: FactValue;
    effective?: TemporalValue;
  };
};

export type IngestionResult =
  | { state: 'imported'; rawId: string; factId?: string }
  | { state: 'duplicate'; rawId: string }
  | {
      state: 'needs_review';
      rawId: string;
      reason: 'version_collision' | 'value_conflict' | 'semantic_conflict';
    }
  | { state: 'quarantined'; rawId: string; reason: QuarantineReason };

export type QuarantineReason =
  | DomainError['code']
  | 'stale_version'
  | 'event_key_changed'
  | 'invalid_operation'
  | 'malformed_payload';

type Row = Record<string, unknown>;

function hash(record: SourceRecord): string {
  return createHash('sha256')
    .update(
      JSON.stringify(record, (_, value: unknown) =>
        value && typeof value === 'object' && !Array.isArray(value)
          ? Object.fromEntries(Object.entries(value).sort())
          : value,
      ),
    )
    .digest('hex');
}

async function hasOtherLiveSupport(
  db: PoolClient,
  personId: string,
  factId: string,
  recordId: string,
): Promise<boolean> {
  const support = await db.query(
    `SELECT 1 FROM health.provenance p
     JOIN source.raw_record r ON r.id=p.raw_id AND r.person_id=p.person_id
     WHERE p.person_id=$1 AND p.fact_id=$2 AND r.record_id<>$3
       AND r.operation='upsert'
       AND NOT EXISTS (
         SELECT 1 FROM source.raw_record tombstone
         LEFT JOIN source.quarantine q ON q.person_id=tombstone.person_id AND q.raw_id=tombstone.id
         WHERE tombstone.person_id=r.person_id AND tombstone.record_id=r.record_id
           AND tombstone.version>r.version AND tombstone.operation='delete' AND q.id IS NULL
       ) LIMIT 1`,
    [personId, factId, recordId],
  );
  return support.rows.length > 0;
}

async function emit(
  db: PoolClient,
  personId: string,
  key: string,
  type: string,
  refId: string,
): Promise<void> {
  await db.query(
    'INSERT INTO jobs.outbox (id, person_id, event_key, type, ref_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (person_id, event_key) DO NOTHING',
    [uuidv7(), personId, key, type, refId],
  );
}

async function quarantine(
  db: PoolClient,
  personId: string,
  rawId: string,
  reason: QuarantineReason,
): Promise<IngestionResult> {
  await db.query(
    'INSERT INTO source.quarantine (id, person_id, raw_id, reason) VALUES ($1,$2,$3,$4)',
    [uuidv7(), personId, rawId, reason],
  );
  await emit(db, personId, `${rawId}:quarantine`, 'source.quarantined', rawId);
  return { state: 'quarantined', rawId, reason };
}

export async function ingest(
  pool: Pool,
  record: SourceRecord,
): Promise<IngestionResult> {
  if (
    !record.connectorId ||
    !record.externalRecordId ||
    !Number.isSafeInteger(record.version) ||
    record.version < 1 ||
    record.version > 2_147_483_647 ||
    (record.eventKey !== undefined &&
      (typeof record.eventKey !== 'string' || record.eventKey.length === 0))
  )
    throw new DomainError(
      'invalid_identity',
      'Connector, external record ID, nonempty event key and int32 version are required',
    );
  return withPerson(pool, record.personId, async (db) => {
    const sourceId = uuidv7();
    await db.query(
      'INSERT INTO source.source (id, person_id, connector_id) VALUES ($1,$2,$3) ON CONFLICT (person_id, connector_id) DO NOTHING',
      [sourceId, record.personId, record.connectorId],
    );
    const source = await db.query<Row>(
      'SELECT id FROM source.source WHERE person_id=$1 AND connector_id=$2',
      [record.personId, record.connectorId],
    );
    const actualSourceId = source.rows[0]?.id;
    if (typeof actualSourceId !== 'string')
      throw new Error('Source identity was not available');

    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${record.personId}:${record.connectorId}:${record.externalRecordId}`,
    ]);
    await db.query(
      'INSERT INTO source.record (id, person_id, source_id, external_record_id) VALUES ($1,$2,$3,$4) ON CONFLICT (person_id, source_id, external_record_id) DO NOTHING',
      [uuidv7(), record.personId, actualSourceId, record.externalRecordId],
    );
    const sourceRecord = await db.query<Row>(
      'SELECT id FROM source.record WHERE person_id=$1 AND source_id=$2 AND external_record_id=$3',
      [record.personId, actualSourceId, record.externalRecordId],
    );
    const recordId = sourceRecord.rows[0]?.id;
    if (typeof recordId !== 'string')
      throw new Error('Source record identity was not available');

    const prior = await db.query<Row>(
      "SELECT id, version, content_hash, payload->>'eventKey' AS prior_event_key FROM source.raw_record WHERE person_id=$1 AND record_id=$2 ORDER BY version DESC, ingested_at DESC",
      [record.personId, recordId],
    );
    const contentHash = hash(record);
    const exact = prior.rows.find(
      (row) =>
        row.version === record.version && row.content_hash === contentHash,
    );
    if (exact && typeof exact.id === 'string')
      return { state: 'duplicate', rawId: exact.id };

    const rawId = uuidv7();
    let validRecordedAt = true;
    try {
      validateTemporal({ kind: 'instant', value: record.recordedAt });
    } catch {
      validRecordedAt = false;
    }
    const operation =
      record.operation === 'upsert' || record.operation === 'delete'
        ? record.operation
        : 'unknown';
    await db.query(
      'INSERT INTO source.raw_record (id, person_id, record_id, version, operation, payload, content_hash, recorded_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        rawId,
        record.personId,
        recordId,
        record.version,
        operation,
        JSON.stringify(record),
        contentHash,
        validRecordedAt ? record.recordedAt : null,
      ],
    );
    await emit(
      db,
      record.personId,
      `${rawId}:received`,
      'source.received',
      rawId,
    );

    if (prior.rows.some((row) => row.version === record.version)) {
      await db.query(
        'INSERT INTO source.quarantine (id, person_id, raw_id, reason) VALUES ($1,$2,$3,$4)',
        [uuidv7(), record.personId, rawId, 'version_collision'],
      );
      await emit(
        db,
        record.personId,
        `${rawId}:review`,
        'source.needs_review',
        rawId,
      );
      return { state: 'needs_review', rawId, reason: 'version_collision' };
    }
    if (prior.rows.length && Number(prior.rows[0]?.version) > record.version)
      return quarantine(db, record.personId, rawId, 'stale_version');
    if (operation === 'unknown')
      return quarantine(db, record.personId, rawId, 'invalid_operation');
    if (!validRecordedAt)
      return quarantine(db, record.personId, rawId, 'invalid_time');

    const eventKey =
      record.eventKey ?? `${record.connectorId}:${record.externalRecordId}`;
    const first = prior.rows.at(-1);
    if (
      first &&
      (first.prior_event_key ??
        `${record.connectorId}:${record.externalRecordId}`) !== eventKey
    )
      return quarantine(db, record.personId, rawId, 'event_key_changed');
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${record.personId}:event:${eventKey}`,
    ]);
    const current = await db.query<Row>(
      'SELECT id, concept_id, kind, value, effective, origin_raw_id FROM health.fact WHERE person_id=$1 AND event_key=$2 AND state=$3 FOR UPDATE',
      [record.personId, eventKey, 'current'],
    );
    const fact = current.rows[0];

    if (record.operation === 'delete') {
      if (fact && typeof fact.id === 'string') {
        if (
          !(await hasOtherLiveSupport(db, record.personId, fact.id, recordId))
        ) {
          await db.query(
            'UPDATE health.fact SET state=$1 WHERE person_id=$2 AND id=$3',
            ['invalidated', record.personId, fact.id],
          );
          await emit(
            db,
            record.personId,
            `${rawId}:invalidated`,
            'health.invalidated',
            fact.id,
          );
        }
      }
      return { state: 'imported', rawId };
    }

    let input: CanonicalInput;
    try {
      input = validateCanonical({
        personId: record.personId,
        provenanceRawId: rawId,
        conceptId: record.payload.conceptId ?? '',
        kind: record.payload.kind ?? 'observation',
        value: structuredClone(record.payload.value) as FactValue,
        effective: structuredClone(record.payload.effective) as TemporalValue,
        recordedAt: record.recordedAt,
        epistemic:
          record.connectorId === 'manual' ? 'user_reported' : 'source_recorded',
        verification: 'unverified',
      });
    } catch (error) {
      if (error instanceof DomainError || error instanceof TypeError)
        return quarantine(
          db,
          record.personId,
          rawId,
          error instanceof DomainError ? error.code : 'malformed_payload',
        );
      throw error;
    }

    if (fact && typeof fact.id === 'string') {
      const sameResult = await db.query<Row>(
        'SELECT value=$1::jsonb AND effective=$2::jsonb AS same FROM health.fact WHERE person_id=$3 AND id=$4',
        [
          JSON.stringify(input.value),
          JSON.stringify(input.effective),
          record.personId,
          fact.id,
        ],
      );
      const same =
        fact.concept_id === input.conceptId &&
        fact.kind === input.kind &&
        sameResult.rows[0]?.same === true;
      if (same) {
        await db.query(
          'INSERT INTO health.provenance (person_id, fact_id, raw_id, transformation) VALUES ($1,$2,$3,$4)',
          [record.personId, fact.id, rawId, 'm1-map-v1'],
        );
        await emit(
          db,
          record.personId,
          `${rawId}:support`,
          'health.support_added',
          fact.id,
        );
        return { state: 'duplicate', rawId };
      }
      const previousFromSameRecord = await db.query<Row>(
        'SELECT 1 FROM source.raw_record WHERE id=$1 AND record_id=$2',
        [fact.origin_raw_id, recordId],
      );
      if (
        !previousFromSameRecord.rows.length ||
        (await hasOtherLiveSupport(db, record.personId, fact.id, recordId)) ||
        fact.concept_id !== input.conceptId ||
        fact.kind !== input.kind
      ) {
        const reason =
          fact.concept_id !== input.conceptId || fact.kind !== input.kind
            ? 'semantic_conflict'
            : 'value_conflict';
        await db.query(
          'INSERT INTO health.conflict (id, person_id, event_key, existing_fact_id, incoming_raw_id, type) VALUES ($1,$2,$3,$4,$5,$6)',
          [uuidv7(), record.personId, eventKey, fact.id, rawId, reason],
        );
        await emit(
          db,
          record.personId,
          `${rawId}:conflict`,
          'health.conflict',
          fact.id,
        );
        return { state: 'needs_review', rawId, reason };
      }
      await db.query(
        'UPDATE health.fact SET state=$1 WHERE person_id=$2 AND id=$3',
        ['superseded', record.personId, fact.id],
      );
    }

    const factId = uuidv7();
    await db.query(
      `INSERT INTO health.fact
      (id, person_id, concept_id, kind, value, effective, recorded_at, epistemic, verification, state, event_key, supersedes_id, origin_raw_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'current',$10,$11,$12)`,
      [
        factId,
        record.personId,
        input.conceptId,
        input.kind,
        JSON.stringify(input.value),
        JSON.stringify(input.effective),
        input.recordedAt,
        input.epistemic,
        input.verification,
        eventKey,
        fact?.id ?? null,
        rawId,
      ],
    );
    await db.query(
      'INSERT INTO health.provenance (person_id, fact_id, raw_id, transformation) VALUES ($1,$2,$3,$4)',
      [record.personId, factId, rawId, 'm1-map-v1'],
    );
    await db.query(
      'INSERT INTO health.event (person_id, fact_id, kind, effective) VALUES ($1,$2,$3,$4)',
      [record.personId, factId, input.kind, JSON.stringify(input.effective)],
    );
    await emit(
      db,
      record.personId,
      `${rawId}:fact`,
      'health.fact_imported',
      factId,
    );
    return { state: 'imported', rawId, factId };
  });
}
