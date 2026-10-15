import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cruise } from 'dependency-cruiser';
import extractTSConfig from 'dependency-cruiser/config-utl/extract-ts-config';
import { forbidden } from './rules.js';

export function sourceRoots(root: string): string[] {
  const roots = ['apps', 'packages'].flatMap((group) => {
    const directory = join(root, group);
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(directory, entry.name, 'src'))
      .filter(existsSync);
  });
  if (roots.length === 0) throw new Error('No first-party source roots found');
  return roots;
}

export async function checkArchitecture(
  paths: string[],
  tsConfig: string,
): Promise<string[]> {
  const result = await cruise(
    paths,
    {
      validate: true,
      ruleSet: { forbidden },
      outputType: 'json',
      tsConfig: { fileName: tsConfig },
      doNotFollow: { path: 'node_modules' },
      exclude: { path: '(^|/)(dist|node_modules)/' },
    },
    undefined,
    { tsConfig: extractTSConfig(tsConfig) },
  );
  const graph =
    typeof result.output === 'string'
      ? JSON.parse(result.output)
      : result.output;
  return graph.summary.violations
    .filter(
      (violation: { rule: { severity: string } }) =>
        violation.rule.severity === 'error',
    )
    .map(
      (violation: { rule: { name: string }; from: string; to: string }) =>
        `${violation.rule.name}: ${violation.from} -> ${violation.to}`,
    );
}
