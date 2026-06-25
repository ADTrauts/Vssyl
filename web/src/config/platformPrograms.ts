/**
 * Platform Controller — certified platform program registry (Phase 1B).
 * Static metadata only; health loaded via existing APIs on the hub page.
 */

export type PlatformProgramId =
  | 'platform-kernel'
  | 'unified-search'
  | 'ai-retrieval'
  | 'context-graph'
  | 'marketplace-partner-runtime';

export type PlatformProgramCertificationLevel =
  | 'foundation'
  | 'l2'
  | 'l3'
  | 'l3-cwf'
  | 'capability';

export interface PlatformProgramDefinition {
  id: PlatformProgramId;
  name: string;
  description: string;
  certificationLevel: PlatformProgramCertificationLevel;
  certificationLabel: string;
  version: string;
  lastValidated: string;
  openFindings: string[];
  primaryAction: { label: string; href: string };
  secondaryActions: Array<{ label: string; href: string }>;
  operatorLinks: Array<{ label: string; href: string; description?: string }>;
  engineerLinks: Array<{ label: string; href: string; description?: string }>;
  /** Which existing API probe supplies live health (none = links only). */
  healthSource:
    | 'dashboard'
    | 'pipeline'
    | 'catalog'
    | 'moduleStats'
    | 'searchPilotReadiness'
    | 'none';
}

/** Sandbox pilot module for Unified Search readiness (existing probe target). */
export const UNIFIED_SEARCH_PILOT_MODULE_ID = 'vssyl-pilot-assets';

export const PLATFORM_PROGRAM_DEFINITIONS: PlatformProgramDefinition[] = [
  {
    id: 'platform-kernel',
    name: 'Platform Kernel',
    description:
      'Core platform runtime — system configuration, migrations, performance, and infrastructure health.',
    certificationLevel: 'foundation',
    certificationLabel: 'Platform foundation',
    version: '2026.06',
    lastValidated: '2026-06-18',
    openFindings: [],
    primaryAction: { label: 'Open system administration', href: '/admin-portal/system' },
    secondaryActions: [
      { label: 'Performance', href: '/admin-portal/performance' },
      { label: 'Platform overview', href: '/admin-portal/dashboard' },
    ],
    operatorLinks: [
      { label: 'System health', href: '/admin-portal/system', description: 'Config & migrations' },
      { label: 'Performance metrics', href: '/admin-portal/performance' },
    ],
    engineerLinks: [
      { label: 'System logs', href: '/admin-portal/system-logs' },
      { label: 'Dangerous ops', href: '/admin-portal/system', description: 'Gated migration tools' },
    ],
    healthSource: 'dashboard',
  },
  {
    id: 'unified-search',
    name: 'Unified Search',
    description:
      'Cross-module search with partner Search Delegate participation. Probe readiness per module in Marketplace.',
    certificationLevel: 'capability',
    certificationLabel: 'Platform capability (pilot-gated)',
    version: '1B-F',
    lastValidated: '2026-06-24',
    openFindings: ['No aggregate search index ops UI (intentional)'],
    primaryAction: { label: 'Marketplace modules', href: '/admin-portal/modules' },
    secondaryActions: [
      {
        label: 'Pilot module readiness',
        href: `/admin-portal/modules`,
      },
    ],
    operatorLinks: [
      {
        label: 'Platform Adoption',
        href: '/admin-portal/platform-adoption',
        description: 'Fleet-wide search participation metrics',
      },
      {
        label: 'Search delegate probe',
        href: '/admin-portal/modules',
        description: 'Run on submission detail readiness card',
      },
    ],
    engineerLinks: [
      {
        label: 'Search delegate docs',
        href: '/docs/marketplace/SEARCH_DELEGATE_ARCHITECTURE.md',
        description: 'Repository documentation',
      },
    ],
    healthSource: 'searchPilotReadiness',
  },
  {
    id: 'ai-retrieval',
    name: 'AI Retrieval',
    description:
      'Retrieval orchestration, grounding enforcement, trace forensics, and pipeline policy governance.',
    certificationLevel: 'l3',
    certificationLabel: 'L3 — AI Pipeline admin',
    version: 'Pipeline admin',
    lastValidated: '2026-06-18',
    openFindings: [],
    primaryAction: { label: 'Open AI Pipeline', href: '/admin-portal/ai-pipeline' },
    secondaryActions: [
      { label: 'Diagnostics', href: '/admin-portal/ai-pipeline/diagnostics' },
      { label: 'Test lab', href: '/admin-portal/ai-pipeline/test-lab' },
    ],
    operatorLinks: [
      { label: 'Trace diagnostics', href: '/admin-portal/ai-pipeline/diagnostics' },
      { label: 'Quality dashboard', href: '/admin-portal/ai-pipeline/quality' },
      { label: 'Provider governance', href: '/admin-portal/ai-pipeline#provider-governance' },
    ],
    engineerLinks: [
      { label: 'Policy audit', href: '/admin-portal/ai-pipeline/audit' },
      { label: 'Compliance', href: '/admin-portal/ai-pipeline/compliance' },
      { label: 'Registry graph', href: '/admin-portal/ai-pipeline/sources' },
    ],
    healthSource: 'pipeline',
  },
  {
    id: 'context-graph',
    name: 'Context Graph',
    description:
      'Context sources, module provider registration, and cross-module context policy bindings.',
    certificationLevel: 'capability',
    certificationLabel: 'Platform capability',
    version: '2026.06',
    lastValidated: '2026-06-24',
    openFindings: ['AI Context tab does not show delegate readiness (AP-G09)'],
    primaryAction: { label: 'Context sources', href: '/admin-portal/ai-pipeline/sources' },
    secondaryActions: [
      { label: 'Module AI providers', href: '/admin-portal/modules?tab=ai-context' },
    ],
    operatorLinks: [
      { label: 'Pipeline sources registry', href: '/admin-portal/ai-pipeline/sources' },
      {
        label: 'Module AI context',
        href: '/admin-portal/modules?tab=ai-context',
        description: 'Per-module provider registration',
      },
    ],
    engineerLinks: [
      { label: 'Grounding rules', href: '/admin-portal/ai-pipeline/grounding' },
      { label: 'Intent catalog', href: '/admin-portal/ai-pipeline/intents' },
    ],
    healthSource: 'catalog',
  },
  {
    id: 'marketplace-partner-runtime',
    name: 'Marketplace Partner Runtime',
    description:
      'Partner module certification, sandbox probes (Search, Workspace, Billing, Activity), and developer oversight.',
    certificationLevel: 'l3-cwf',
    certificationLabel: 'L3 Certified With Findings — Partner Capability',
    version: 'Validator v1.4.0',
    lastValidated: '2026-06-24',
    openFindings: ['External partner E2E not yet certified', 'No sandbox pilot aggregate dashboard'],
    primaryAction: { label: 'Open Marketplace', href: '/admin-portal/modules' },
    secondaryActions: [{ label: 'Developers', href: '/admin-portal/developers' }],
    operatorLinks: [
      { label: 'Submissions & certification', href: '/admin-portal/modules' },
      { label: 'Developer management', href: '/admin-portal/developers' },
    ],
    engineerLinks: [
      {
        label: 'Readiness probes',
        href: '/admin-portal/modules',
        description: 'Per-module on submission detail',
      },
    ],
    healthSource: 'moduleStats',
  },
];

export function getPlatformProgramDefinition(
  id: PlatformProgramId,
): PlatformProgramDefinition | undefined {
  return PLATFORM_PROGRAM_DEFINITIONS.find((p) => p.id === id);
}
