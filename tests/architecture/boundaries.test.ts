import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const fixture = 'tests/architecture/fixtures';
const cli = 'packages/architecture-guardrails/dist/cli.js';

describe('architecture boundaries', () => {
  test.each(['health-core', 'connectors', 'agent-runtime', 'skills'])(
    '%s allows approved dependency',
    (name) => {
      const result = spawnSync(
        process.execPath,
        [
          cli,
          `${fixture}/packages/${name}/src/allowed.ts`,
          `${fixture}/tsconfig.json`,
        ],
        { cwd: root, encoding: 'utf8' },
      );
      expect(result.status, result.stderr).toBe(0);
    },
  );

  test.each([
    ['health-core', 'workspace', 'health-core-independence'],
    ['health-core', 'alias', 'health-core-independence'],
    ['health-core', 'relative', 'health-core-independence'],
    ['health-core', 'health-connect', 'health-core-independence'],
    ['health-core', 'provider', 'health-core-independence'],
    ['connectors', 'workspace', 'connector-isolation'],
    ['connectors', 'alias', 'connector-isolation'],
    ['agent-runtime', 'workspace', 'agent-database-isolation'],
    ['agent-runtime', 'alias', 'agent-database-isolation'],
    ['agent-runtime', 'relative', 'agent-database-isolation'],
    ['skills', 'provider', 'skills-model-gateway'],
  ])('%s rejects %s import', (name, variant, rule) => {
    const result = spawnSync(
      process.execPath,
      [
        cli,
        `${fixture}/packages/${name}/src/${variant}.ts`,
        `${fixture}/tsconfig.json`,
      ],
      { cwd: root, encoding: 'utf8' },
    );
    expect(result.status, result.stderr).not.toBe(0);
    expect(result.stderr).toContain(rule);
    if (variant === 'provider')
      expect(result.stderr).toContain('node_modules/openai');
  });

  test('rejects Azure, Bedrock and Vertex SDK imports from skills', () => {
    const result = spawnSync(
      process.execPath,
      [
        cli,
        `${fixture}/packages/skills/src/providers.ts`,
        `${fixture}/tsconfig.json`,
      ],
      { cwd: root, encoding: 'utf8' },
    );
    expect(result.status, result.stderr).not.toBe(0);
    expect(result.stderr.match(/skills-model-gateway/g)).toHaveLength(3);
  });

  test('checks the current first-party graph with the built package', () => {
    const result = spawnSync(process.execPath, [cli], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('Architecture check passed');
  });
});
