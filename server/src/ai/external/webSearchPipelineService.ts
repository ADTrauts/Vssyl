/**
 * Canonical web_search execution owner (Wave 1).
 *
 * Pipeline grounding retrieval is the ONLY path that performs Tavily HTTP.
 * Twin tool loop must not independently call Tavily for the same turn.
 */

import { logger } from '../../lib/logger';
import { buildWebSearchEgressQuery } from './buildWebSearchEgressQuery';
import { assertBusinessExternalReadAllowed } from './externalReadGovernance';
import type { ExternalReadResult } from './externalReadTypes';
import { executeWebSearch } from './webSearchAdapter';
import { WEB_SEARCH_DEFAULT_MAX_RESULTS } from './webSearchConstants';

export interface RunWebSearchInput {
  userId: string;
  userMessage: string;
  businessId?: string;
}

export interface RunWebSearchOutput {
  result: ExternalReadResult;
  egressQuery?: string;
}

function policyDeniedResult(message: string): ExternalReadResult {
  return {
    capabilityId: 'web_search',
    providerId: 'tavily',
    success: false,
    retrievedAt: new Date().toISOString(),
    failureCode: 'policy_denied',
    failureMessage: message,
    evidence: [],
  };
}

/**
 * Canonical entrypoint for live public web search.
 * Call only from pipeline grounding retrieval in Wave 1.
 */
export async function runWebSearchForPipeline(input: RunWebSearchInput): Promise<RunWebSearchOutput> {
  const gate = await assertBusinessExternalReadAllowed({
    userId: input.userId,
    businessId: input.businessId,
  });

  if (!gate.allowed) {
    return {
      result: policyDeniedResult(
        gate.reason === 'business_external_api_denied'
          ? 'Business policy disallows external API access'
          : 'External read not authorized'
      ),
    };
  }

  const egressOutcome = buildWebSearchEgressQuery(input.userMessage);
  if ('policyDenied' in egressOutcome) {
    void logger.warn('Web search egress denied', {
      operation: 'web_search_egress',
      reason: egressOutcome.reason,
    });
    return {
      result: policyDeniedResult(`Egress policy denied: ${egressOutcome.reason}`),
    };
  }

  void logger.debug('Web search egress query constructed', {
    operation: 'web_search_egress',
    queryLength: egressOutcome.egressQuery.length,
  });

  const result = await executeWebSearch({
    capabilityId: 'web_search',
    providerId: 'tavily',
    egressQuery: egressOutcome.egressQuery,
    maxResults: WEB_SEARCH_DEFAULT_MAX_RESULTS,
  });

  return {
    result,
    egressQuery: egressOutcome.egressQuery,
  };
}
