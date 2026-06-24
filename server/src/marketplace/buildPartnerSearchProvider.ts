import { POLICY_ACTIONS } from '../auth/policyActions.js';
import type { RegisteredSearchProvider, SearchFilters } from 'shared/types/search';
import type { PartnerSearchDelegateRegistration } from 'shared/types/search-delegate';
import { proxyPartnerSearch } from './searchDelegateProxy.js';

export function buildPartnerSearchProvider(
  registration: PartnerSearchDelegateRegistration
): RegisteredSearchProvider {
  return {
    providerId: registration.moduleId,
    moduleId: registration.moduleId,
    moduleName: registration.moduleName,
    displayName: registration.moduleName,
    entityTypes: registration.entityTypes,
    supportedContexts: registration.supportedContexts,
    requiredPermission: POLICY_ACTIONS.SEARCH_READ,
    searchMethod: 'partner_http_delegate',
    readiness: 'ready',
    manifestSearchClaim: true,
    search: async (query: string, userId: string, filters?: SearchFilters) => {
      const { results } = await proxyPartnerSearch({
        registration,
        query,
        userId,
        filters,
      });
      return results;
    },
  };
}
