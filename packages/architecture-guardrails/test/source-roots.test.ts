import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { sourceRoots } from '../src/index.js';

const created: string[] = [];
afterEach(() => {
  for (const directory of created.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

test('discovers only package and app source roots', () => {
  const root = mkdtempSync(join(tmpdir(), 'myphisys-roots-'));
  created.push(root);
  mkdirSync(join(root, 'packages', 'architecture-guardrails', 'src'), {
    recursive: true,
  });
  mkdirSync(join(root, 'apps', 'api', 'src'), { recursive: true });
  mkdirSync(join(root, 'tests', 'architecture', 'src'), { recursive: true });
  expect(sourceRoots(root).sort()).toEqual(
    [
      join(root, 'apps', 'api', 'src'),
      join(root, 'packages', 'architecture-guardrails', 'src'),
    ].sort(),
  );
});

test('fails closed when no first-party source exists', () => {
  const root = mkdtempSync(join(tmpdir(), 'myphisys-roots-'));
  created.push(root);
  expect(() => sourceRoots(root)).toThrow('No first-party source roots found');
});
