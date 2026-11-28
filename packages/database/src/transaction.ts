import type { Pool, PoolClient } from 'pg';

export async function withTransaction<T>(
  pool: Pool,
  run: (db: PoolClient) => Promise<T>,
): Promise<T> {
  const db = await pool.connect();
  let rollbackFailure: Error | undefined;
  try {
    await db.query('BEGIN');
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
