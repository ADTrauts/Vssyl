/**
 * Canonical helpers for business workspace URLs: `/business/:id/workspace/:segment`
 * and legacy `/business/:id/workspace?module=…`. Keeps sidebar + hub in sync (A-043).
 */

import {
  WORKSPACE_CHILD_ROUTE_SEGMENTS,
  type BusinessWorkspaceModuleContract,
  BUSINESS_WORKSPACE_SWITCH_CONTRACTS,
} from './businessWorkspaceContracts';

export function resolveBusinessWorkspaceModule(
  pathname: string,
  searchParams: { get: (key: string) => string | null } | null | undefined
): string {
  const path = pathname.split('?')[0];
  const workspaceIdx = path.indexOf('/workspace');
  if (workspaceIdx === -1) {
    return 'dashboard';
  }

  const tail = path.slice(workspaceIdx + '/workspace'.length);
  if (tail === '' || tail === '/') {
    const m = searchParams?.get('module');
    return m && m.length > 0 ? m : 'dashboard';
  }

  const firstSegment = tail.replace(/^\//, '').split('/')[0] || '';
  if (firstSegment === 'connections') {
    return 'members';
  }
  if (firstSegment === 'notes') {
    return 'notebook';
  }
  if (firstSegment === 'workforce-comms') {
    return 'workforce_comms';
  }
  return firstSegment || 'dashboard';
}

/** True when URL has more than one segment under `/workspace/` (e.g. …/workspace/hr/team). */
export function hasNestedWorkspaceRoute(pathname: string): boolean {
  const path = pathname.split('?')[0];
  const match = path.match(/\/workspace\/(.+)$/);
  if (!match) return false;
  const segments = match[1].split('/').filter(Boolean);
  return segments.length > 1;
}

export function resolveFirstWorkspaceSegment(pathname: string): string | null {
  const path = pathname.split('?')[0];
  const match = path.match(/\/workspace\/([^/]+)/);
  return match?.[1] ?? null;
}

/**
 * True when App Router `children` should render (dedicated pages / deep paths).
 * Prevents switch redirect loops for segment-page modules (members, analytics).
 */
export function shouldRenderWorkspaceChildren(pathname: string): boolean {
  if (hasNestedWorkspaceRoute(pathname)) {
    return true;
  }
  const first = resolveFirstWorkspaceSegment(pathname);
  if (!first) {
    return false;
  }
  if (first === 'connections') {
    return WORKSPACE_CHILD_ROUTE_SEGMENTS.has('members');
  }
  if (first === 'notes') {
    return WORKSPACE_CHILD_ROUTE_SEGMENTS.has('notebook');
  }
  if (first === 'workforce-comms') {
    return WORKSPACE_CHILD_ROUTE_SEGMENTS.has('workforce-comms');
  }
  return WORKSPACE_CHILD_ROUTE_SEGMENTS.has(first);
}

function segmentForModuleId(moduleId: string): string | undefined {
  const contract = BUSINESS_WORKSPACE_SWITCH_CONTRACTS.find(
    (c) => c.moduleId === moduleId || (c.switchAliases ?? []).includes(moduleId)
  );
  if (!contract) {
    return undefined;
  }
  if (contract.routeKind === 'hub') {
    return undefined;
  }
  if (contract.moduleId === 'notebook') {
    return 'notebook';
  }
  if (contract.moduleId === 'members') {
    return 'members';
  }
  return contract.segment ?? contract.moduleId;
}

/** Primary navigation target for sidebar / module switches. */
export function buildBusinessWorkspaceModuleHref(businessId: string, moduleId: string): string {
  const normalized =
    moduleId === 'connections' ? 'members' : moduleId === 'notes' ? 'notebook' : moduleId;

  if (normalized === 'dashboard') {
    return `/business/${businessId}/workspace`;
  }

  const segment = segmentForModuleId(normalized);
  if (segment) {
    return `/business/${businessId}/workspace/${encodeURIComponent(segment)}`;
  }

  return `/business/${businessId}/workspace?module=${encodeURIComponent(moduleId)}`;
}

/** Parse canonical segment from an href produced by buildBusinessWorkspaceModuleHref. */
export function parseWorkspaceHrefSegment(href: string): string | null {
  const match = href.match(/\/workspace\/([^/?]+)/);
  return match?.[1] ?? null;
}

export function isLegacyQueryModuleHref(href: string): boolean {
  return href.includes('?module=');
}

export function contractForSegment(segment: string): BusinessWorkspaceModuleContract | undefined {
  return BUSINESS_WORKSPACE_SWITCH_CONTRACTS.find(
    (c) =>
      c.segment === segment ||
      c.moduleId === segment ||
      (c.switchAliases ?? []).includes(segment)
  );
}
