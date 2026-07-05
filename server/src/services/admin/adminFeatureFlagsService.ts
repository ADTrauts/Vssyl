import { prisma } from '../../lib/prisma';
import { PROJECT_ASSISTANT_PILOT_ENV } from '../../context-graph/projectAssistantPilotEnv';

export type FeatureFlagCategory = 'environment' | 'platform' | 'experimental' | 'beta';

export interface OperatorFeatureFlag {
  key: string;
  label: string;
  category: FeatureFlagCategory;
  source: 'environment' | 'system_config';
  enabled: boolean;
  value: string | null;
  description?: string;
}

const ENV_FLAG_CATALOG: Array<{
  key: string;
  label: string;
  category: FeatureFlagCategory;
  description: string;
}> = [
  {
    key: PROJECT_ASSISTANT_PILOT_ENV.retrieval,
    label: 'AI Retrieval — Project Assistant',
    category: 'experimental',
    description: 'Enables retrieval discovery for project assistant pilot',
  },
  {
    key: PROJECT_ASSISTANT_PILOT_ENV.bridge,
    label: 'Context Graph Retrieval Bridge',
    category: 'experimental',
    description: 'Bridges retrieval bundles into context graph grounding',
  },
  {
    key: PROJECT_ASSISTANT_PILOT_ENV.reconcile,
    label: 'Grounding Reconciliation',
    category: 'experimental',
    description: 'Reconciles grounding evidence during pilot',
  },
  {
    key: 'NEXT_PUBLIC_AI_ACTIONS_UI',
    label: 'AI Actions UI',
    category: 'beta',
    description: 'Exposes AI-driven write actions in the control center',
  },
  {
    key: 'NEXT_PUBLIC_AI_CONTEXT_DENSITY_DEBUG',
    label: 'AI Context Density Debug',
    category: 'beta',
    description: 'Debug overlay for AI context density (operators only)',
  },
  {
    key: 'ADMIN_PORTAL_DEBUG',
    label: 'Operator Labs Debug Gate',
    category: 'platform',
    description: 'Unlocks debug-gated operator lab routes',
  },
  {
    key: 'NODE_ENV',
    label: 'Runtime Environment',
    category: 'environment',
    description: 'Node.js environment (production, development, test)',
  },
];

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
}

export async function getOperatorFeatureFlags(): Promise<OperatorFeatureFlag[]> {
  const flags: OperatorFeatureFlag[] = ENV_FLAG_CATALOG.map((entry) => {
    const raw = process.env[entry.key];
    const enabled =
      entry.key === 'NODE_ENV'
        ? raw === 'production'
        : isTruthyEnv(raw);
    return {
      key: entry.key,
      label: entry.label,
      category: entry.category,
      source: 'environment',
      enabled,
      value: raw ?? null,
      description: entry.description,
    };
  });

  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        OR: [
          { configKey: { contains: 'flag', mode: 'insensitive' } },
          { configKey: { contains: 'feature', mode: 'insensitive' } },
          { configKey: { contains: 'beta', mode: 'insensitive' } },
          { configKey: { contains: 'pilot', mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    for (const cfg of configs) {
      const val = cfg.configValue;
      const strVal = typeof val === 'string' ? val : JSON.stringify(val);
      flags.push({
        key: cfg.configKey,
        label: cfg.configKey,
        category: 'platform',
        source: 'system_config',
        enabled: isTruthyEnv(strVal) || strVal === 'true',
        value: strVal,
        description: cfg.description ?? 'System configuration entry',
      });
    }
  } catch {
    // system config optional
  }

  return flags;
}
