import type { SearchResult } from 'shared/types/search';
import type {
  PartnerSearchResultItem,
  PartnerSearchDelegateRegistration,
} from 'shared/types/search-delegate';

const MAX_TITLE = 512;
const MAX_DESCRIPTION = 1024;
const MAX_ID = 128;
const MAX_METADATA_BYTES = 4096;

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

function clampScore(score: number | undefined): number {
  if (score == null || Number.isNaN(score)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, score));
}

function normalizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

function hasReadGranted(item: PartnerSearchResultItem): boolean {
  return item.permissions.some((p) => p.type === 'read' && p.granted === true);
}

function metadataWithinLimit(metadata: Record<string, unknown> | undefined): boolean {
  if (!metadata) return true;
  try {
    return JSON.stringify(metadata).length <= MAX_METADATA_BYTES;
  } catch {
    return false;
  }
}

export interface NormalizePartnerSearchResultsInput {
  items: PartnerSearchResultItem[];
  registration: PartnerSearchDelegateRegistration;
  limit: number;
}

export interface NormalizePartnerSearchResultsOutput {
  results: SearchResult[];
  droppedCount: number;
}

export function normalizePartnerSearchResults(
  input: NormalizePartnerSearchResultsInput
): NormalizePartnerSearchResultsOutput {
  const { registration, limit } = input;
  const allowedTypes = new Set(registration.entityTypes);
  const results: SearchResult[] = [];
  let droppedCount = 0;

  for (const item of input.items) {
    if (results.length >= limit) {
      droppedCount += 1;
      continue;
    }

    if (!item.id || item.id.length > MAX_ID) {
      droppedCount += 1;
      continue;
    }
    if (!item.title?.trim()) {
      droppedCount += 1;
      continue;
    }
    if (!item.type || !allowedTypes.has(item.type)) {
      droppedCount += 1;
      continue;
    }
    if (!hasReadGranted(item)) {
      droppedCount += 1;
      continue;
    }

    const url = normalizeUrl(item.url);
    if (!url) {
      droppedCount += 1;
      continue;
    }

    if (!metadataWithinLimit(item.metadata)) {
      droppedCount += 1;
      continue;
    }

    let lastModified = new Date();
    if (item.lastModified) {
      const parsed = new Date(item.lastModified);
      if (!Number.isNaN(parsed.getTime())) {
        lastModified = parsed;
      }
    }

    results.push({
      id: item.id,
      title: stripHtml(item.title).slice(0, MAX_TITLE),
      description: item.description
        ? stripHtml(item.description).slice(0, MAX_DESCRIPTION)
        : undefined,
      moduleId: registration.moduleId,
      moduleName: registration.moduleName,
      url,
      type: item.type,
      metadata: item.metadata ?? {},
      permissions: [{ type: 'read', granted: true }],
      lastModified,
      relevanceScore: clampScore(item.relevanceScore),
    });
  }

  return { results, droppedCount };
}
