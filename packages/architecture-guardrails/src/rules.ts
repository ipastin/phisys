import type { IForbiddenRuleType } from 'dependency-cruiser';

const packagePath = (name: string) =>
  `(?:^|/)packages/(?:${name})/|^@myphisys/(?:${name})(?:/|$)`;

const providerPath =
  '(?:^|/)node_modules/(?:openai|@anthropic-ai/sdk|@google/genai)(?:/|$)|^(?:openai|@anthropic-ai/sdk|@google/genai)(?:/|$)';

export const forbidden: IForbiddenRuleType[] = [
  {
    name: 'health-core-independence',
    severity: 'error',
    from: { path: packagePath('health-core') },
    to: {
      path: `${packagePath('model-gateway|ui|connectors|database')}|${providerPath}|(?:^|/)node_modules/(?:@supabase/|react(?:-native)?(?:/|$)|expo(?:/|$))|^(?:@supabase/|react(?:-native)?(?:/|$)|expo(?:/|$))`,
    },
  },
  {
    name: 'connector-isolation',
    severity: 'error',
    from: { path: packagePath('connectors') },
    to: { path: packagePath('analytics|agent-runtime') },
  },
  {
    name: 'agent-database-isolation',
    severity: 'error',
    from: { path: packagePath('agent-runtime') },
    to: { path: packagePath('database') },
  },
  {
    name: 'skills-model-gateway',
    severity: 'error',
    from: { path: packagePath('skills') },
    to: { path: providerPath },
  },
];
