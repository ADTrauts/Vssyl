import type { SearchResult } from 'shared/types/search';
import type { AIRetrievalEvidence } from './aiRetrievalTypes';

export function normalizeEvidenceConfidence(score?: number): number | undefined {
  if (score == null || Number.isNaN(score)) {
    return undefined;
  }
  return Math.min(1, Math.max(0, score));
}

function normalizeRoute(result: SearchResult): string {
  const url = result.url?.trim();
  if (url) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  return `/${result.moduleId}/${result.id}`;
}

export function mapSearchResultToEvidence(result: SearchResult): AIRetrievalEvidence {
  const permissionsVerified =
    result.permissions.length === 0 ||
    result.permissions.every((p) => p.granted !== false);

  return {
    sourceType: 'search',
    sourceModule: result.moduleId,
    entityId: result.id,
    entityType: result.type,
    title: result.title,
    summary: result.description,
    score: result.relevanceScore,
    confidence: normalizeEvidenceConfidence(result.relevanceScore),
    route: normalizeRoute(result),
    permissionsVerified,
    retrievedAt: new Date().toISOString(),
  };
}

export function mapSearchResultsToEvidence(results: SearchResult[]): AIRetrievalEvidence[] {
  return results.map(mapSearchResultToEvidence);
}

export function countEvidenceBySourceModule(
  evidence: AIRetrievalEvidence[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of evidence) {
    counts[item.sourceModule] = (counts[item.sourceModule] ?? 0) + 1;
  }
  return counts;
}

export function countEvidenceByProvider(
  evidence: AIRetrievalEvidence[]
): Record<string, number> {
  return countEvidenceBySourceModule(evidence);
}
