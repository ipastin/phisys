import { expect, test } from 'vitest';
import { uuidv7 } from '../src/index.js';

test('UUIDv7 has timestamp ordering and correct version/variant', () => {
  const a = uuidv7(1_700_000_000_000, Buffer.alloc(10));
  const b = uuidv7(1_700_000_000_001, Buffer.alloc(10));
  expect(a).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(a < b).toBe(true);
});
