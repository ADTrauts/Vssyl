/**
 * Legacy provider selection — wraps selectContextProvider as canHandle (Phase A).
 */

import {
  selectContextProvider,
  type ContextProviderConfig,
} from '../services/moduleContextProviderSelection';

export function legacyProviderCanHandle(
  moduleId: string,
  providerName: string,
  query: string,
  providers: ContextProviderConfig[]
): boolean {
  if (providers.length === 0) return false;
  const selected = selectContextProvider(moduleId, query, providers);
  return selected?.name === providerName;
}
