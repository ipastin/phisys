import { expect, test, vi } from 'vitest';
import { uuidv7, withPerson, type Pool } from '../src/index.js';

test('UUIDv7 has timestamp ordering and correct version/variant', () => {
  const a = uuidv7(1_700_000_000_000, Buffer.alloc(10));
  const b = uuidv7(1_700_000_000_001, Buffer.alloc(10));
  expect(a).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(a < b).toBe(true);
});

test('failed rollback preserves the original error and discards the client', async () => {
  const original = new Error('original failure');
  const rollback = new Error('rollback failure');
  const client = {
    query: vi.fn(async (sql: string) => {
      if (sql === 'ROLLBACK') throw rollback;
    }),
    release: vi.fn(),
  };
  const pool = { connect: async () => client } as unknown as Pool;
  await expect(
    withPerson(pool, uuidv7(), async () => {
      throw original;
    }),
  ).rejects.toBe(original);
  expect(client.release).toHaveBeenCalledWith(rollback);
});
