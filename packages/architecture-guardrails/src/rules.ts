import type { IForbiddenRuleType } from 'dependency-cruiser';

const packagePath = (name: string) =>
  `(?:^|/)packages/(?:${name})/|^@myphisys/(?:${name})(?:/|$)`;

// shortcut: patterns cover the five approved provider paths; extend them when a new provider is approved.
const providerPackage =
  'openai|@anthropic-ai/[^/]+|@google/genai|@azure/[^/]+|@aws-sdk/client-bedrock(?:-runtime)?|@google-cloud/[^/]+|aws-sdk';
const providerPath = `^(?:${providerPackage})(?:/|$)|(?:^|/)node_modules/(?:${providerPackage})(?:/|$)`;

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
