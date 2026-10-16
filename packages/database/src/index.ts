import { randomBytes } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';

export { Pool };
export type { PoolClient } from 'pg';
export { readCurrentSleepFacts } from './analytics.js';
export type { SleepFactRow } from './analytics.js';

export function uuidv7(now = Date.now(), entropy = randomBytes(10)): string {
  if (
    !Number.isSafeInteger(now) ||
    now < 0 ||
    now > 0xffffffffffff ||
    entropy.length < 10
  )
    throw new Error('Invalid UUIDv7 timestamp or entropy');
  const bytes = Buffer.alloc(16);
  bytes.writeUIntBE(now, 0, 6);
  entropy.copy(bytes, 6, 0, 10);
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function withPerson<T>(
  pool: Pool,
  personId: string,
  run: (db: PoolClient) => Promise<T>,
): Promise<T> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      personId,
    )
  )
    throw new Error('A UUIDv7 person identity is required');
  const db = await pool.connect();
  let rollbackFailure: Error | undefined;
  try {
    await db.query('BEGIN');
    await db.query("SELECT set_config('app.person_id', $1, true)", [personId]);
    const result = await run(db);
    await db.query('COMMIT');
    return result;
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
