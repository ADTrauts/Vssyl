/**
 * Tavily Search adapter — server-side READ only (SEARCH ONLY Wave 1).
 * Auth: TAVILY_API_KEY (Secret Manager → Cloud Run).
 *
 * Canonical capability: web_search. Provider id: tavily.
 */

import { logger } from '../../lib/logger';
import type {
  ExternalEvidenceItem,
  ExternalReadFailureCode,
  ExternalReadRequest,
  ExternalReadResult,
} from './externalReadTypes';
import {
  TAVILY_SEARCH_ENDPOINT,
  WEB_SEARCH_DEFAULT_MAX_RESULTS,
  WEB_SEARCH_DEPTH,
  WEB_SEARCH_MAX_RESULTS_CAP,
  WEB_SEARCH_REQUEST_TIMEOUT_MS,
} from './webSearchConstants';

export interface TavilySearchResultRow {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string;
  publishedDate?: string;
}

export interface TavilySearchResponse {
  results?: TavilySearchResultRow[];
  response_time?: number;
  usage?: { credits?: number };
}

export type TavilySearchFn = (input: {
  query: string;
  maxResults: number;
  apiKey: string;
  signal: AbortSignal;
}) => Promise<{ status: number; body: TavilySearchResponse | null; errorText?: string }>;

let testSearchOverride: TavilySearchFn | null = null;
let testApiKeyOverride: string | null | undefined;

export function setTavilySearchForTests(fn: TavilySearchFn | null): void {
  testSearchOverride = fn;
}

export function setTavilyApiKeyForTests(key: string | null | undefined): void {
  testApiKeyOverride = key;
}

export function resetTavilyClientForTests(): void {
  testSearchOverride = null;
  testApiKeyOverride = undefined;
}

function resolveApiKey(): string | undefined {
  if (testApiKeyOverride !== undefined) {
    return testApiKeyOverride ?? undefined;
  }
  const key = process.env.TAVILY_API_KEY?.trim();
  return key || undefined;
}

function domainFromUrl(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return undefined;
  }
}

function classifyHttpStatus(status: number): ExternalReadFailureCode {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  if (status === 400) return 'invalid_request';
  if (status >= 500) return 'provider_error';
  return 'provider_error';
}

function failureResult(
  request: ExternalReadRequest,
  code: ExternalReadFailureCode,
  message: string,
  startedAt: number
): ExternalReadResult {
  return {
    capabilityId: request.capabilityId,
    providerId: request.providerId,
    success: false,
    retrievedAt: new Date().toISOString(),
    failureCode: code,
    failureMessage: message,
    evidence: [],
    usage: { latencyMs: Date.now() - startedAt, resultCount: 0 },
  };
}

const defaultTavilySearch: TavilySearchFn = async ({ query, maxResults, apiKey, signal }) => {
  const res = await fetch(TAVILY_SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: WEB_SEARCH_DEPTH,
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      auto_parameters: false,
      include_usage: true,
    }),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    return { status: res.status, body: null, errorText: errorText.slice(0, 200) };
  }

  const body = (await res.json()) as TavilySearchResponse;
  return { status: res.status, body };
};

function normalizeRow(
  row: TavilySearchResultRow,
  rank: number,
  retrievedAt: string
): ExternalEvidenceItem | null {
  const title = typeof row.title === 'string' ? row.title.trim() : '';
  const url = typeof row.url === 'string' ? row.url.trim() : '';
  if (!title || !url) return null;

  const detail =
    typeof row.content === 'string' && row.content.trim() ? row.content.trim().slice(0, 1200) : undefined;
  const publishedRaw =
    (typeof row.published_date === 'string' && row.published_date.trim()) ||
    (typeof row.publishedDate === 'string' && row.publishedDate.trim()) ||
    undefined;

  return {
    capabilityId: 'web_search',
    provider: 'tavily',
    sourceKind: 'web',
    title,
    detail,
    url,
    domain: domainFromUrl(url),
    rank,
    retrievedAt,
    publishedAt: publishedRaw,
    externalId: url,
  };
}

export async function executeWebSearch(request: ExternalReadRequest): Promise<ExternalReadResult> {
  const startedAt = Date.now();
  const retrievedAt = new Date().toISOString();
  const egressQuery = request.egressQuery.trim();

  if (request.capabilityId !== 'web_search' || request.providerId !== 'tavily') {
    return failureResult(request, 'invalid_request', 'Unsupported web search request', startedAt);
  }
  if (!egressQuery) {
    return failureResult(request, 'invalid_request', 'Empty egress query', startedAt);
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    return failureResult(
      request,
      'configuration_missing',
      'TAVILY_API_KEY is not configured',
      startedAt
    );
  }

  const maxResults = Math.min(
    Math.max(request.maxResults ?? WEB_SEARCH_DEFAULT_MAX_RESULTS, 1),
    WEB_SEARCH_MAX_RESULTS_CAP
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEB_SEARCH_REQUEST_TIMEOUT_MS);

  try {
    const searchFn = testSearchOverride ?? defaultTavilySearch;
    const { status, body, errorText } = await searchFn({
      query: egressQuery,
      maxResults,
      apiKey,
      signal: controller.signal,
    });

    if (status !== 200 || !body) {
      const code = classifyHttpStatus(status);
      void logger.warn('Tavily web search HTTP failure', {
        operation: 'web_search_tavily',
        failureCode: code,
        status,
        // Never log API key or full provider body
        errorSnippet: errorText ? 'present' : 'none',
      });
      return failureResult(request, code, `Tavily search failed (${status})`, startedAt);
    }

    const rows = Array.isArray(body.results) ? body.results : [];
    const evidence: ExternalEvidenceItem[] = [];
    let rank = 0;
    for (const row of rows) {
      if (evidence.length >= maxResults) break;
      rank += 1;
      const item = normalizeRow(row, rank, retrievedAt);
      if (item) evidence.push(item);
    }

    if (evidence.length === 0) {
      return failureResult(request, 'no_results', 'No usable web results', startedAt);
    }

    const credits =
      body.usage && typeof body.usage.credits === 'number' ? body.usage.credits : undefined;

    return {
      capabilityId: 'web_search',
      providerId: 'tavily',
      success: true,
      retrievedAt,
      evidence,
      usage: {
        latencyMs: Date.now() - startedAt,
        resultCount: evidence.length,
        billedUnits: credits,
      },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    const aborted =
      err.name === 'AbortError' || /aborted|timeout|deadline/i.test(err.message);
    const code: ExternalReadFailureCode = aborted ? 'timeout' : 'provider_error';
    void logger.warn('Tavily web search failed', {
      operation: 'web_search_tavily',
      failureCode: code,
      error: { message: err.message },
    });
    return failureResult(request, code, err.message, startedAt);
  } finally {
    clearTimeout(timer);
  }
}
