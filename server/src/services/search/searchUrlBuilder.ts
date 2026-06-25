import type { SearchFilters } from 'vssyl-shared/types/search';

export function buildPersonalOrBusinessModuleUrl(
  moduleSegment: string,
  queryParams: Record<string, string>,
  filters?: SearchFilters
): string {
  const businessId = filters?.context?.businessId;
  const qs = new URLSearchParams(queryParams).toString();
  const suffix = qs ? `?${qs}` : '';

  if (businessId) {
    return `/business/${businessId}/workspace/${moduleSegment}${suffix}`;
  }

  return `/${moduleSegment}${suffix}`;
}
