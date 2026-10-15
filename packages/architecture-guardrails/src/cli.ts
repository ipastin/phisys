#!/usr/bin/env node
import { resolve } from 'node:path';
import { checkArchitecture, sourceRoots } from './index.js';

const [target, config] = process.argv.slice(2);
const paths = target ? [resolve(target)] : sourceRoots(process.cwd());
const tsConfig = resolve(config ?? 'tsconfig.json');

try {
  const violations = await checkArchitecture(paths, tsConfig);
  if (violations.length > 0) {
    console.error(violations.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Architecture check passed (${paths.length} source root(s))`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
