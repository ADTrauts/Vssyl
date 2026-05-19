/**
 * Resolve business id when the active dashboard is a business workspace.
 */

export function resolveBusinessIdFromDashboard(
  dashboard: unknown,
  dashboardType: string
): string | undefined {
  if (!dashboard || dashboardType !== 'business') return undefined;
  if (typeof dashboard !== 'object') return undefined;
  const business = (dashboard as { business?: { id?: string } }).business;
  if (business && typeof business.id === 'string' && business.id.trim()) {
    return business.id;
  }
  return undefined;
}
