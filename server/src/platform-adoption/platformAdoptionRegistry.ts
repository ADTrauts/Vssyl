import type { PlatformAdoptionRegistryEntry } from './platformAdoptionTypes.js';
import { decodeCapabilityString } from './platformAdoptionScoring.js';

const WAVE4 = '2026-06-25';
const WAVE2 = '2026-06-25';
const BASELINE = '2026-06-25';

function entry(
  moduleId: string,
  displayName: string,
  category: PlatformAdoptionRegistryEntry['category'],
  caps: string,
  baselineScore: number,
  certificationRef: string,
  topGap: string,
  recommendedImprovements: string[],
  recentChanges: PlatformAdoptionRegistryEntry['recentChanges'] = [],
): PlatformAdoptionRegistryEntry {
  return {
    moduleId,
    displayName,
    category,
    certificationRef,
    lastValidated: BASELINE,
    baselineScore,
    capabilities: decodeCapabilityString(caps),
    topGap,
    recommendedImprovements,
    docLinks: [
      {
        label: 'Adoption matrix',
        href: '/docs/platform-adoption/PLATFORM_ADOPTION_MATRIX.md',
      },
      {
        label: 'Scorecard',
        href: '/docs/platform-adoption/PLATFORM_ADOPTION_SCORECARD.md',
      },
    ],
    recentChanges,
  };
}

/** Canonical adoption baseline — sourced from Phase 0A matrix + scorecard (Waves 1–4). */
export const PLATFORM_ADOPTION_REGISTRY: PlatformAdoptionRegistryEntry[] = [
  entry('drive', 'File Hub', 'product', 'FFFFNPFFFFFF', 94, 'L4 Reference', 'Kernel read migration (platform-wide)', [
    'Complete federated kernel reads on all history surfaces',
  ]),
  entry('chat', 'Chat', 'product', 'FFFPNPFFFFFF', 86, 'L3', 'Context graph threads; retrieval delegate', [
    'Extend context graph to thread entities',
    'Register retrieval delegate for non-query intents',
  ]),
  entry('calendar', 'Calendar', 'product', 'FFFFNPFFFFFF', 85, 'L3', 'Kernel reads; retrieval delegate', [
    'Migrate remaining legacy activity reads to kernel',
  ]),
  entry('todo', 'Todo', 'product', 'FFFFNPFFPFFF', 84, 'L3', 'Retrieval delegate; realtime depth', [
    'Expand realtime fan-out beyond manifest baseline',
  ]),
  entry('place', 'Place', 'product', 'FPFFNPFFFFFF', 82, 'L3', 'AI retrieval grounding partial', [
    'Deepen retrieval grounding for listing discovery',
  ]),
  entry('vlink', 'V_Link', 'platform', 'FPFFNPPPMMMN', 78, 'Substrate', 'Module-local activity table', [
    'Migrate VLinkActivity to kernel federation pattern',
  ]),
  entry('notifications', 'Notifications', 'platform', 'PMMMNPPPMMMM', 76, 'UX Ref #2', 'Not a SoR; no search/graph', [
    'Document intentional utility scope in operator card',
  ]),
  entry('ai', 'AI Workspace', 'platform', 'PMMMNPPPMMMM', 82, 'Platform L2', 'Widget/shell consumption gaps', [
    'Expand query-native discovery coverage metrics',
  ]),
  entry('notebook', 'Notebook', 'product', 'FPFFPPFPMMMP', 76, 'L3', 'Graph adapter; notifications manifest', [
    'Add notifications manifest block',
    'Complete graph adapter coverage',
  ], [{ wave: 2, date: WAVE2, summary: 'Unified Search provider registered' }]),
  entry('hr', 'HR', 'business', 'FPFFPPFFFFFF', 75, 'L3 CwF', 'Kernel reads; Prisma AI list providers', [
    'Federated kernel reads for HR timeline surfaces',
  ], [{ wave: 2, date: WAVE2, summary: 'Search provider + manifest search enabled' }]),
  entry('scheduling', 'Scheduling', 'business', 'FPFFPPFFPFFF', 74, 'L3 CwF', 'Kernel reads; limited realtime', [
    'Kernel read migration for schedule activity',
  ], [{ wave: 2, date: WAVE2, summary: 'Search provider registered' }]),
  entry('workforce_comms', 'Workforce Comms', 'business', 'FPFFPPFFMFFF', 72, 'L3 CwF', 'No realtime', [
    'Add realtime manifest + socket fan-out where product requires',
  ], [{ wave: 2, date: WAVE2, summary: 'Search provider registered' }]),
  entry('dashboard', 'Dashboard', 'composition', 'FPFFPPFFMMMM', 72, 'L3 CwF', 'Quick Stats not searchable', [
    'Wire dashboard deep-link query params in web client',
  ], [{ wave: 4, date: WAVE4, summary: 'Quick Notes + Bookmarks search + kernel activity' }]),
  entry('notes', 'Notes (legacy)', 'product', 'FPFFPPFFFFFF', 62, 'L2', 'V_Link service gap; UI disabled', [
    'Deprecate or merge into Notebook with full platform parity',
  ]),
  entry('business_admin', 'Business Administration', 'platform', 'FMMMNFFFFFFF', 58, 'L3 #OC', 'No search; no workspace module', [
    'Evaluate search for org entities if product requires',
  ]),
  entry('business_workspace', 'Business Workspace', 'composition', 'PMMMNPPPMMMM', 57, 'WS-L3', 'Shell routes only; no intelligence', [
    'Delegate intelligence to child modules; avoid shell-level duplication',
  ]),
  entry('activity_feed', 'Activity Feed', 'composition', 'FMPMPPPFMMMM', 58, 'None', 'Kernel read via API', [
    'Surface kernel read path in operator diagnostics',
  ], [{ wave: 1, date: '2026-06-24', summary: 'Unified kernel timeline reads' }]),
  entry('quick_notes', 'Quick Notes', 'composition', 'FFNNMPFFMMMM', 58, 'None', 'No notifications', [
    'Add notification types if product requires alerts on notes',
  ], [{ wave: 4, date: WAVE4, summary: 'Search + kernel activity via dashboard module' }]),
  entry('bookmarks', 'Bookmarks', 'composition', 'FFNNMPFFMMMM', 52, 'None', 'External URLs only', [
    'Optional: enrich metadata for AI grounding',
  ], [{ wave: 4, date: WAVE4, summary: 'Search + kernel activity via dashboard module' }]),
  entry('analytics', 'Analytics', 'business', 'PMMMNPPPMMMM', 41, 'Capability L2', 'Redirect-only product surface', [
    'Business workspace hub or deeper platform participation decision',
  ]),
  entry('members', 'Members', 'business', 'FPMPNPPPMMMM', 40, 'Account PP-1', 'Search-only participation', [
    'Add AI context if member discovery becomes product priority',
  ]),
  entry('quick_stats', 'Quick Stats', 'composition', 'MMMPMPMMMMMM', 38, 'None', 'Analytics bridge only', [
    'Live analytics capability reads alignment',
  ]),
];

export function getAdoptionRegistryEntry(
  moduleId: string,
): PlatformAdoptionRegistryEntry | undefined {
  return PLATFORM_ADOPTION_REGISTRY.find((m) => m.moduleId === moduleId);
}

export function getAdoptionRegistryModuleIds(): string[] {
  return PLATFORM_ADOPTION_REGISTRY.map((m) => m.moduleId);
}
