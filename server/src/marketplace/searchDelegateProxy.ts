import { randomUUID } from 'crypto';
import {
  SEARCH_DELEGATE_CONTRACT_VERSION,
  SANDBOX_PILOT_INTERNAL_DELEGATE_URL,
  type PartnerSearchDelegateRegistration,
  type PartnerSearchDelegateRequest,
  type PartnerSearchDelegateResponse,
  type SearchDelegateProxyDiagnostics,
} from 'shared/types/search-delegate';
import type { SearchFilters, SearchTenantContext } from 'shared/types/search';
import { logger } from '../lib/logger.js';
import { issueSearchDelegateJwt } from './searchDelegateJwt.js';
import {
  getSearchDelegatePlatformMaxTimeoutMs,
  isModuleAllowedForSearchDelegate,
  isPartnerSearchDelegateEnabled,
} from './searchDelegateConfig.js';
import { normalizePartnerSearchResults } from './searchDelegateNormalizer.js';
import { isInternalSearchDelegateUrl } from './searchDelegateManifest.js';
import { executeSandboxPilotAssetsSearch } from './sandboxPilotAssetsSearch.js';

const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_WINDOW_MS = 60_000;
const circuitState = new Map<string, { failures: number; windowStart: number; open: boolean }>();

function isCircuitOpen(moduleId: string): boolean {
  const state = circuitState.get(moduleId);
  if (!state?.open) return false;
  if (Date.now() - state.windowStart > CIRCUIT_WINDOW_MS) {
    circuitState.delete(moduleId);
    return false;
  }
  return true;
}

function recordFailure(moduleId: string): void {
  const now = Date.now();
  const state = circuitState.get(moduleId);
  if (!state || now - state.windowStart > CIRCUIT_WINDOW_MS) {
    circuitState.set(moduleId, { failures: 1, windowStart: now, open: false });
    return;
  }
  state.failures += 1;
  if (state.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    state.open = true;
  }
}

function recordSuccess(moduleId: string): void {
  circuitState.delete(moduleId);
}

export function resetSearchDelegateCircuitBreakers(): void {
  circuitState.clear();
}

function resolveActiveContext(
  filters: SearchFilters | undefined
): SearchTenantContext | undefined {
  const ctx = filters?.context;
  if (ctx?.businessId) return 'business';
  if (ctx?.householdId) return 'household';
  if (ctx?.dashboardId) return 'personal';
  return undefined;
}

function contextSupported(
  registration: PartnerSearchDelegateRegistration,
  filters?: SearchFilters
): boolean {
  const active = resolveActiveContext(filters);
  if (!active) {
    return registration.supportedContexts.includes('personal');
  }
  return registration.supportedContexts.includes(active);
}

function parseDelegateResponse(body: unknown): PartnerSearchDelegateResponse | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  if (record.success === true && Array.isArray(record.results)) {
    return body as PartnerSearchDelegateResponse;
  }
  if (record.success === false && record.error) {
    return body as PartnerSearchDelegateResponse;
  }
  return null;
}

async function callInternalDelegate(
  registration: PartnerSearchDelegateRegistration,
  request: PartnerSearchDelegateRequest
): Promise<PartnerSearchDelegateResponse> {
  if (registration.delegateUrl === SANDBOX_PILOT_INTERNAL_DELEGATE_URL) {
    return executeSandboxPilotAssetsSearch(request);
  }
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unknown internal search delegate',
    },
  };
}

async function callHttpDelegate(
  registration: PartnerSearchDelegateRegistration,
  request: PartnerSearchDelegateRequest,
  token: string,
  timeoutMs: number
): Promise<{ response: PartnerSearchDelegateResponse | null; httpStatus?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(registration.delegateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Vssyl-Request-Id': request.requestId,
        'X-Vssyl-Contract-Version': SEARCH_DELEGATE_CONTRACT_VERSION,
        'User-Agent': 'Vssyl-Search-Delegate/1.0',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
      redirect: 'manual',
    });

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { response: null, httpStatus: res.status };
    }

    const delegateResponse = parseDelegateResponse(parsed);
    return { response: delegateResponse, httpStatus: res.status };
  } finally {
    clearTimeout(timer);
  }
}

export interface ProxyPartnerSearchParams {
  registration: PartnerSearchDelegateRegistration;
  query: string;
  userId: string;
  filters?: SearchFilters;
}

export interface ProxyPartnerSearchResult {
  results: import('shared/types/search').SearchResult[];
  diagnostics: SearchDelegateProxyDiagnostics;
}

export async function proxyPartnerSearch(
  params: ProxyPartnerSearchParams
): Promise<ProxyPartnerSearchResult> {
  const { registration, query, userId, filters } = params;
  const requestId = randomUUID();
  const start = Date.now();
  const platformMaxTimeout = getSearchDelegatePlatformMaxTimeoutMs();
  const timeoutMs = Math.min(registration.timeoutMs, platformMaxTimeout);

  const baseDiagnostics: SearchDelegateProxyDiagnostics = {
    moduleId: registration.moduleId,
    requestId,
    delegateUrl: isInternalSearchDelegateUrl(registration.delegateUrl)
      ? 'internal'
      : registration.delegateUrl,
    durationMs: 0,
    resultCount: 0,
    droppedCount: 0,
    outcome: 'disabled',
  };

  if (!isPartnerSearchDelegateEnabled() || !isModuleAllowedForSearchDelegate(registration.moduleId)) {
    return {
      results: [],
      diagnostics: { ...baseDiagnostics, outcome: 'disabled', durationMs: Date.now() - start },
    };
  }

  if (!contextSupported(registration, filters)) {
    return {
      results: [],
      diagnostics: {
        ...baseDiagnostics,
        outcome: 'success',
        durationMs: Date.now() - start,
      },
    };
  }

  if (isCircuitOpen(registration.moduleId)) {
    return {
      results: [],
      diagnostics: { ...baseDiagnostics, outcome: 'circuit_open', durationMs: Date.now() - start },
    };
  }

  const limit = Math.min(registration.maxResults, 25);
  const request: PartnerSearchDelegateRequest = {
    contractVersion: SEARCH_DELEGATE_CONTRACT_VERSION,
    query: query.trim(),
    userId,
    context: {
      dashboardId: filters?.context?.dashboardId,
      businessId: filters?.context?.businessId,
      householdId: filters?.context?.householdId,
    },
    moduleId: registration.moduleId,
    filters: filters
      ? {
          type: filters.type,
          pinned: filters.pinned,
          dateRange: filters.dateRange
            ? {
                start:
                  filters.dateRange.start instanceof Date
                    ? filters.dateRange.start.toISOString()
                    : String(filters.dateRange.start),
                end:
                  filters.dateRange.end instanceof Date
                    ? filters.dateRange.end.toISOString()
                    : String(filters.dateRange.end),
              }
            : undefined,
        }
      : undefined,
    limit,
    requestId,
  };

  try {
    let delegateResponse: PartnerSearchDelegateResponse | null = null;
    let httpStatus: number | undefined;

    if (isInternalSearchDelegateUrl(registration.delegateUrl)) {
      delegateResponse = await callInternalDelegate(registration, request);
    } else {
      const token = issueSearchDelegateJwt({
        userId,
        moduleId: registration.moduleId,
        moduleVersionId: registration.moduleVersionId,
        context: request.context,
        requestId,
      });
      const httpResult = await callHttpDelegate(registration, request, token, timeoutMs);
      delegateResponse = httpResult.response;
      httpStatus = httpResult.httpStatus;
    }

    const durationMs = Date.now() - start;

    if (!delegateResponse || delegateResponse.success !== true) {
      recordFailure(registration.moduleId);
      const errMsg =
        delegateResponse && !delegateResponse.success
          ? delegateResponse.error.message
          : 'Invalid delegate response';
      void logger.warn('Partner search delegate failed', {
        operation: 'partner_search_delegate',
        moduleId: registration.moduleId,
        requestId,
        httpStatus,
        outcome: httpStatus === undefined ? 'schema_error' : 'http_error',
        errorMessage: errMsg,
      });
      return {
        results: [],
        diagnostics: {
          ...baseDiagnostics,
          durationMs,
          httpStatus,
          outcome: httpStatus === undefined ? 'schema_error' : 'http_error',
          errorMessage: errMsg,
        },
      };
    }

    const { results, droppedCount } = normalizePartnerSearchResults({
      items: delegateResponse.results,
      registration,
      limit,
    });

    recordSuccess(registration.moduleId);

    void logger.info('Partner search delegate success', {
      operation: 'partner_search_delegate',
      moduleId: registration.moduleId,
      requestId,
      resultCount: results.length,
      droppedCount,
      durationMs,
    });

    return {
      results,
      diagnostics: {
        ...baseDiagnostics,
        durationMs,
        httpStatus,
        resultCount: results.length,
        droppedCount,
        outcome: 'success',
      },
    };
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    const err = error instanceof Error ? error : new Error(String(error));
    const isTimeout = err.name === 'AbortError';
    recordFailure(registration.moduleId);

    void logger.warn('Partner search delegate error', {
      operation: 'partner_search_delegate',
      moduleId: registration.moduleId,
      requestId,
      outcome: isTimeout ? 'timeout' : 'http_error',
      error: { message: err.message },
      durationMs,
    });

    return {
      results: [],
      diagnostics: {
        ...baseDiagnostics,
        durationMs,
        outcome: isTimeout ? 'timeout' : 'http_error',
        errorMessage: err.message,
      },
    };
  }
}
