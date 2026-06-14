/**
 * Authoritative personal dashboard contracts (Wave 2C).
 * Navigation and drift tests import from here.
 */

import type { LegacyDashboardContext } from '../runtime/modules/contextMapping';

export type PersonalDashboardType = LegacyDashboardContext;

export type PersonalRouteKind = 'grid' | 'grid-hub' | 'module-route' | 'utility-route';

export interface PersonalModuleRouteContract {
  moduleId: string;
  switchAliases?: string[];
  routeKind: PersonalRouteKind;
  /** First URL path segment (or utility path without leading semantics). */
  pathSegment: string;
  requiresDashboardScope: boolean;
  /** Widget registry id when escalation uses widget type key. */
  widgetType?: string;
}

/** Personal sidebar / module-route contracts (grid excluded). */
export const PERSONAL_MODULE_ROUTE_CONTRACTS: PersonalModuleRouteContract[] = [
  { moduleId: 'drive', routeKind: 'module-route', pathSegment: 'drive', requiresDashboardScope: true, widgetType: 'drive' },
  { moduleId: 'chat', routeKind: 'module-route', pathSegment: 'chat', requiresDashboardScope: true, widgetType: 'chat' },
  { moduleId: 'calendar', routeKind: 'module-route', pathSegment: 'calendar', requiresDashboardScope: true, widgetType: 'calendar' },
  { moduleId: 'todo', routeKind: 'module-route', pathSegment: 'todo', requiresDashboardScope: true, widgetType: 'todo' },
  { moduleId: 'notebook', routeKind: 'module-route', pathSegment: 'notebook', requiresDashboardScope: true, switchAliases: ['notes'], widgetType: 'notebook' },
  { moduleId: 'vlink', routeKind: 'module-route', pathSegment: 'vlink', requiresDashboardScope: true },
  { moduleId: 'place', routeKind: 'utility-route', pathSegment: 'place', requiresDashboardScope: false },
  { moduleId: 'members', routeKind: 'utility-route', pathSegment: 'member', requiresDashboardScope: false, switchAliases: ['connections'] },
  { moduleId: 'notifications', routeKind: 'utility-route', pathSegment: 'notifications', requiresDashboardScope: false, widgetType: 'notifications' },
  { moduleId: 'ai', routeKind: 'utility-route', pathSegment: 'ai-chat', requiresDashboardScope: false, widgetType: 'ai' },
];

/** Registry-aligned default install set when PositionAwareModuleProvider is unavailable. */
export const PERSONAL_DEFAULT_MODULE_PERMISSIONS = [
  { id: 'dashboard', permissions: ['view'] },
  { id: 'drive', permissions: ['view', 'upload', 'delete'] },
  { id: 'chat', permissions: ['view', 'send'] },
  { id: 'calendar', permissions: ['view', 'create'] },
  { id: 'todo', permissions: ['view'] },
  { id: 'notebook', permissions: ['view'] },
] as const;

export const PERSONAL_DASHBOARD_TYPES: PersonalDashboardType[] = [
  'personal',
  'household',
  'educational',
];

export function getPersonalModuleContract(moduleId: string): PersonalModuleRouteContract | undefined {
  return PERSONAL_MODULE_ROUTE_CONTRACTS.find(
    (c) => c.moduleId === moduleId || (c.switchAliases ?? []).includes(moduleId)
  );
}

export function normalizePersonalModuleId(moduleId: string): string {
  const contract = getPersonalModuleContract(moduleId);
  return contract?.moduleId ?? moduleId;
}

export function personalModuleRouteIds(): string[] {
  return PERSONAL_MODULE_ROUTE_CONTRACTS.map((c) => c.moduleId).sort();
}

export function isValidPersonalDashboardType(type: string): type is PersonalDashboardType {
  return (PERSONAL_DASHBOARD_TYPES as readonly string[]).includes(type);
}
