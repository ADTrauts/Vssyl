/**
 * Authoritative business workspace module contracts (Wave 1C).
 * Navigation, switch coverage, and registry drift tests import from here.
 */

export type WorkspaceRouteKind = 'hub' | 'segment-switch' | 'segment-page' | 'query-legacy';

export interface BusinessWorkspaceModuleContract {
  /** Canonical module id (registry-aligned). */
  moduleId: string;
  /** Switch `case` aliases (e.g. notes → notebook). */
  switchAliases?: string[];
  /** How the module is reached in business workspace. */
  routeKind: WorkspaceRouteKind;
  /** First path segment under `/workspace/` when segment-based. */
  segment?: string;
  /** Included in BusinessWorkspaceContent switch. */
  switchMounted: boolean;
  /** Registry module id (defaults to moduleId). */
  registryId?: string;
  /** Canonical entry component (documentation). */
  entryComponent: string;
}

/** Modules mounted in BusinessWorkspaceContent `switch`. */
export const BUSINESS_WORKSPACE_SWITCH_CONTRACTS: BusinessWorkspaceModuleContract[] = [
  { moduleId: 'dashboard', routeKind: 'hub', switchMounted: true, entryComponent: 'BusinessWorkspaceHubPanel' },
  { moduleId: 'drive', routeKind: 'segment-switch', segment: 'drive', switchMounted: true, entryComponent: 'DriveWorkspaceLanding' },
  { moduleId: 'chat', routeKind: 'segment-switch', segment: 'chat', switchMounted: true, entryComponent: 'ChatModuleWrapper' },
  { moduleId: 'calendar', routeKind: 'segment-switch', segment: 'calendar', switchMounted: true, entryComponent: 'CalendarWorkspaceLanding' },
  { moduleId: 'todo', routeKind: 'segment-switch', segment: 'todo', switchMounted: true, entryComponent: 'TodoWorkspaceLanding' },
  { moduleId: 'notebook', routeKind: 'segment-page', segment: 'notebook', switchMounted: true, switchAliases: ['notes'], entryComponent: 'NotebookShell' },
  { moduleId: 'place', routeKind: 'segment-switch', segment: 'place', switchMounted: true, entryComponent: 'PlaceWorkspaceLanding' },
  { moduleId: 'ai', routeKind: 'segment-switch', segment: 'ai', switchMounted: true, entryComponent: 'AIWorkspaceLanding' },
  { moduleId: 'vlink', routeKind: 'segment-switch', segment: 'vlink', switchMounted: true, entryComponent: 'VLinkModule' },
  { moduleId: 'hr', routeKind: 'segment-page', segment: 'hr', switchMounted: true, entryComponent: 'HRLayout' },
  { moduleId: 'scheduling', routeKind: 'segment-page', segment: 'scheduling', switchMounted: true, entryComponent: 'SchedulingLayout' },
  { moduleId: 'members', routeKind: 'segment-page', segment: 'members', switchMounted: true, switchAliases: ['connections'], entryComponent: 'WorkMembersPage' },
  { moduleId: 'analytics', routeKind: 'segment-page', segment: 'analytics', switchMounted: true, entryComponent: 'WorkAnalyticsPage' },
];

/** First-segment routes that render App Router `children` instead of the switch. */
export const WORKSPACE_CHILD_ROUTE_SEGMENTS = new Set<string>([
  'members',
  'analytics',
  'notebook',
  'notes',
  'hr',
  'scheduling',
  'settings',
  'developer-portal',
  'modules',
]);

/** Registry ids with a business workspace route (mountable in sidebar). */
export const REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS = [
  'dashboard',
  'drive',
  'chat',
  'calendar',
  'todo',
  'notebook',
  'ai',
  'hr',
  'scheduling',
  'analytics',
  'members',
  'vlink',
  'place',
] as const;

export type RegistryBusinessWorkspaceModuleId = (typeof REGISTRY_BUSINESS_WORKSPACE_MODULE_IDS)[number];

/** All switch case strings (including aliases). */
export function businessWorkspaceSwitchCaseIds(): string[] {
  const cases = new Set<string>();
  for (const c of BUSINESS_WORKSPACE_SWITCH_CONTRACTS) {
    cases.add(c.moduleId);
    for (const alias of c.switchAliases ?? []) {
      cases.add(alias);
    }
  }
  return Array.from(cases).sort();
}

/** Canonical module ids mounted in switch (aliases normalized). */
export function businessWorkspaceMountedModuleIds(): string[] {
  return BUSINESS_WORKSPACE_SWITCH_CONTRACTS.map((c) => c.moduleId).sort();
}

/** First path segments owned by segment-switch mount (switch renders; page.tsx defers). */
export function businessWorkspaceSegmentSwitchSegments(): string[] {
  return BUSINESS_WORKSPACE_SWITCH_CONTRACTS.filter(
    (c) => c.routeKind === 'segment-switch' && c.segment
  )
    .map((c) => c.segment as string)
    .sort();
}

export function getModuleContract(moduleId: string): BusinessWorkspaceModuleContract | undefined {
  return BUSINESS_WORKSPACE_SWITCH_CONTRACTS.find(
    (c) => c.moduleId === moduleId || (c.switchAliases ?? []).includes(moduleId)
  );
}

export function normalizeWorkspaceModuleId(moduleId: string): string {
  const contract = getModuleContract(moduleId);
  return contract?.moduleId ?? moduleId;
}
