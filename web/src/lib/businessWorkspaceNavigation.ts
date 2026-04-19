/**
 * Canonical helpers for business workspace URLs: `/business/:id/workspace?module=…`
 * and `/business/:id/workspace/:segment/…`. Keeps sidebar + hub page in sync (A-043).
 */

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

/** Primary navigation target for sidebar / module switches (matches existing hub + members routes). */
export function buildBusinessWorkspaceModuleHref(businessId: string, moduleId: string): string {
  const id = moduleId === 'connections' ? 'members' : moduleId;
  if (id === 'members') {
    return `/business/${businessId}/workspace/members`;
  }
  return `/business/${businessId}/workspace?module=${encodeURIComponent(moduleId)}`;
}
