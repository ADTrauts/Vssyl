/**
 * Canonical helpers for personal dashboard URLs (Wave 2C).
 * Grid: `/dashboard/:id` · modules: `/:module?dashboard=:id` · utilities: fixed paths.
 */

import { WIDGET_REGISTRY } from '../components/dashboard/widgetRegistry';
import { buildAIChatUrl, buildAIIdentityUrl } from './aiExperienceNavigation';
import {
  type PersonalDashboardType,
  getPersonalModuleContract,
  normalizePersonalModuleId,
  PERSONAL_MODULE_ROUTE_CONTRACTS,
  isValidPersonalDashboardType,
} from './personalDashboardContracts';

export type { PersonalDashboardType };

export function normalizePersonalDashboardType(
  type: string | undefined
): PersonalDashboardType {
  if (type && isValidPersonalDashboardType(type)) {
    return type;
  }
  return 'personal';
}

/** Hub bootstrap — client redirect selects active dashboard. */
export function buildPersonalDashboardHubHref(): string {
  return '/dashboard';
}

/** Widget grid for a specific dashboard tab. */
export function buildPersonalDashboardHref(dashboardId: string): string {
  return `/dashboard/${encodeURIComponent(dashboardId)}`;
}

function appendDashboardScope(basePath: string, dashboardId?: string | null): string {
  if (!dashboardId) {
    return basePath;
  }
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}dashboard=${encodeURIComponent(dashboardId)}`;
}

/** Primary sidebar / module navigation target. */
export function buildPersonalModuleHref(moduleId: string, dashboardId?: string | null): string {
  const normalized = normalizePersonalModuleId(moduleId);

  if (normalized === 'dashboard') {
    return dashboardId ? buildPersonalDashboardHref(dashboardId) : buildPersonalDashboardHubHref();
  }

  if (normalized === 'members') {
    return '/member';
  }

  if (normalized === 'ai') {
    return buildPersonalAIQuickHref();
  }

  if (normalized === 'place') {
    return '/place';
  }

  if (normalized === 'notifications') {
    return '/notifications';
  }

  const contract = getPersonalModuleContract(normalized);
  if (!contract) {
    return appendDashboardScope(`/${encodeURIComponent(normalized)}`, dashboardId);
  }

  if (contract.routeKind === 'utility-route' && !contract.requiresDashboardScope) {
    return contract.pathSegment.startsWith('/')
      ? contract.pathSegment
      : `/${contract.pathSegment}`;
  }

  const base = `/${contract.pathSegment}`;
  return contract.requiresDashboardScope ? appendDashboardScope(base, dashboardId) : base;
}

/** Canonical quick AI entry (UX #4). */
export function buildPersonalAIQuickHref(options?: { conversationId?: string }): string {
  return buildAIChatUrl(options);
}

/** AI Identity control center — not default widget/rail escalation. */
export function buildPersonalAIIdentityHref(options?: { tab?: string }): string {
  return buildAIIdentityUrl(options);
}

/** Widget grid tile → full module surface. */
export function buildWidgetEscalationHref(widgetType: string, dashboardId: string): string {
  const normalizedWidget = widgetType === 'notes' ? 'notebook' : widgetType;

  if (normalizedWidget === 'ai') {
    return buildPersonalAIQuickHref();
  }

  const registryEntry = WIDGET_REGISTRY[normalizedWidget];
  if (registryEntry) {
    const moduleId = normalizePersonalModuleId(registryEntry.moduleId);
    const contract = PERSONAL_MODULE_ROUTE_CONTRACTS.find(
      (c) => c.moduleId === moduleId || c.widgetType === normalizedWidget
    );
    if (contract?.routeKind === 'utility-route' && !contract.requiresDashboardScope) {
      return buildPersonalModuleHref(moduleId);
    }
    return buildPersonalModuleHref(moduleId, dashboardId);
  }

  return buildPersonalModuleHref(normalizedWidget, dashboardId);
}

export function resolvePersonalDashboardModule(
  pathname: string,
  _searchParams?: { get: (key: string) => string | null } | null
): string | null {
  const path = pathname.split('?')[0];
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === 'business') {
    return null;
  }

  if (segments[0] === 'dashboard') {
    return segments.length > 1 ? 'dashboard' : null;
  }

  if (segments[0] === 'ai-chat') {
    return 'ai';
  }

  if (segments[0] === 'member') {
    return 'members';
  }

  if (segments[0] === 'notes') {
    return 'notebook';
  }

  return segments[0];
}

export function isPersonalDashboardGridPath(pathname: string): boolean {
  const path = pathname.split('?')[0];
  return path === '/dashboard' || /^\/dashboard\/[^/]+$/.test(path);
}

export function parseDashboardIdFromPath(pathname: string): string | null {
  const match = pathname.split('?')[0].match(/^\/dashboard\/([^/]+)$/);
  return match?.[1] ?? null;
}

export function isRegisteredWidgetType(widgetType: string): boolean {
  const key = widgetType === 'notes' ? 'notebook' : widgetType;
  return key in WIDGET_REGISTRY;
}

export function personalWidgetEscalationTypes(): string[] {
  return Object.keys(WIDGET_REGISTRY).sort();
}
