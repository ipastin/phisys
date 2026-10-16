import type { Pool } from 'pg';

export type SleepFactRow = {
  id: string;
  value: unknown;
  effective: unknown;
  verification: string;
  epistemic: string;
  has_unresolved_conflict: boolean;
  supports: {
    rawId: string;
    sourceId: string;
    connectorId: string;
    version: number;
    transformation: string;
  }[];
};

export async function readCurrentSleepFacts(
  pool: Pool,
  personId: string,
  startDate: string,
  endDateExclusive: string,
): Promise<SleepFactRow[]> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      personId,
    )
  )
    throw new Error('A UUIDv7 person identity is required');
  const db = await pool.connect();
  let rollbackFailure: Error | undefined;
  try {
    await db.query('BEGIN READ ONLY');
    await db.query('SET LOCAL ROLE myphisys_analytics');
    await db.query("SELECT set_config('app.person_id', $1, true)", [personId]);
    const result = await db.query<SleepFactRow>(
      `SELECT f.id, f.value, f.effective, f.verification, f.epistemic,
              EXISTS (
                SELECT 1 FROM health.conflict c
                WHERE c.person_id=f.person_id AND c.existing_fact_id=f.id
                  AND c.state='unresolved'
              ) AS has_unresolved_conflict,
              COALESCE(support.items, '[]'::jsonb) AS supports
       FROM health.fact f
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object(
           'rawId', r.id, 'sourceId', s.id, 'connectorId', s.connector_id,
           'version', r.version, 'transformation', p.transformation
         ) ORDER BY r.id) AS items
         FROM health.provenance p
         JOIN source.raw_record r ON r.person_id=p.person_id AND r.id=p.raw_id
         JOIN source.record sr ON sr.person_id=r.person_id AND sr.id=r.record_id
         JOIN source.source s ON s.person_id=sr.person_id AND s.id=sr.source_id
         WHERE p.person_id=f.person_id AND p.fact_id=f.id AND r.operation='upsert'
           AND NOT EXISTS (
             SELECT 1 FROM source.raw_record tombstone
             LEFT JOIN source.quarantine q
               ON q.person_id=tombstone.person_id AND q.raw_id=tombstone.id
             WHERE tombstone.person_id=r.person_id AND tombstone.record_id=r.record_id
               AND tombstone.version>r.version AND tombstone.operation='delete'
               AND q.id IS NULL
           )
       ) support ON true
       WHERE f.person_id=$1 AND f.concept_id='sleep_duration' AND f.state='current'
         AND f.effective->>'kind'='local_date'
         AND f.effective->>'value'>=$2 AND f.effective->>'value'<$3
       ORDER BY f.effective->>'value', f.id`,
      [personId, startDate, endDateExclusive],
    );
    await db.query('COMMIT');
    return result.rows;
  } catch (error) {
    try {
      await db.query('ROLLBACK');
    } catch (rollbackError) {
      rollbackFailure =
        rollbackError instanceof Error
          ? rollbackError
          : new Error('Rollback failed', { cause: rollbackError });
    }
    throw error;
  } finally {
    db.release(rollbackFailure);
  }
}
