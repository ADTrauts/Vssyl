/**
 * Context profiles: conversation (quiet, small budget) vs enterprise (full assembly).
 */

import type { AIAssembledContext } from './AIContextAssembler';

export type ContextProfile = 'conversation' | 'enterprise';

export type ContextVisibility =
  | 'silent'
  | 'mention_if_useful'
  | 'explicit_only'
  | 'enterprise_only';

export const CONVERSATION_CONTEXT_BUDGET_TOKENS = 1000;
export const ENTERPRISE_CONTEXT_BUDGET_TOKENS = 6000;

const ENTERPRISE_ONLY_BLOCK_TITLES = new Set([
  'Cross-module insights',
  'Observed patterns',
  'Smart pattern analysis',
  'Semantic enhancement',
  'Collective learning patterns',
]);

const PRODUCTIVITY_LIFE_QUERY =
  /\b(productivity|work[- ]life|worklife|life balance|burnout|burned out|burnt out|efficiency score|productivity score|optimize my work|dashboard metrics)\b/i;

const TRAVEL_LIFESTYLE_QUERY =
  /\b(vacation|getaway|weekend trip|travel|affordable places|last minute|where (are|should)|best places)\b/i;

export interface ContextProfileBlockMeta {
  sourceModule?: string;
  relevanceScore?: number;
  visibility: ContextVisibility;
  reasonIncluded?: string;
}

export function resolveContextProfile(structuredResponseMode?: string): ContextProfile {
  return (structuredResponseMode || '').trim().toLowerCase() === 'conversation'
    ? 'conversation'
    : 'enterprise';
}

export function isSyntheticInsight(insight: { id?: string; synthetic?: boolean }): boolean {
  if (insight.synthetic === true) return true;
  const id = (insight.id || '').trim();
  return (
    id === 'work_life_balance_trend' ||
    id === 'productivity_opportunity' ||
    id === 'communication_pattern' ||
    id === 'automation_opportunity'
  );
}

function blockAllowedInConversation(title: string, queryText: string, relevanceScore?: number): boolean {
  if (!ENTERPRISE_ONLY_BLOCK_TITLES.has(title)) {
    if (title === 'Active modules and current focus') {
      if (PRODUCTIVITY_LIFE_QUERY.test(queryText)) return true;
      if (TRAVEL_LIFESTYLE_QUERY.test(queryText)) return false;
      return (relevanceScore ?? 0) >= 45;
    }
    return true;
  }

  if (title === 'Cross-module insights' && PRODUCTIVITY_LIFE_QUERY.test(queryText)) {
    return true;
  }

  return false;
}

export interface ApplyContextProfileInput {
  profile: ContextProfile;
  queryText: string;
  blocks: AIAssembledContext['contextBlocks'];
}

export interface ApplyContextProfileResult {
  blocks: AIAssembledContext['contextBlocks'];
  includedTitles: string[];
  excludedTitles: string[];
}

/**
 * Filter and annotate context blocks for the active profile.
 */
export function applyContextProfile(input: ApplyContextProfileInput): ApplyContextProfileResult {
  const { profile, queryText, blocks } = input;
  const includedTitles: string[] = [];
  const excludedTitles: string[] = [];

  if (profile === 'enterprise') {
    return {
      blocks: blocks.map((b) => ({
        ...b,
        inclusionReason: b.inclusionReason ?? 'enterprise profile — full context assembly',
      })),
      includedTitles: blocks.map((b) => b.title),
      excludedTitles: [],
    };
  }

  const kept: AIAssembledContext['contextBlocks'] = [];

  for (const block of blocks) {
    const score = block.relevanceScore;
    if (!blockAllowedInConversation(block.title, queryText, score)) {
      excludedTitles.push(block.title);
      continue;
    }

    let priority = block.priority;
    if (block.title === 'Active modules and current focus' && priority === 'high') {
      priority = 'medium';
    }

    includedTitles.push(block.title);
    kept.push({
      ...block,
      priority,
      inclusionReason: block.inclusionReason ?? 'conversation profile — relevance-gated',
    });
  }

  return { blocks: kept, includedTitles, excludedTitles };
}

export function conversationRankFilter(
  blocks: AIAssembledContext['contextBlocks']
): AIAssembledContext['contextBlocks'] {
  return blocks.filter((b) => {
    if (b.tier === 'tier4_cross_module') {
      return (b.relevanceScore ?? 0) >= 35;
    }
    return true;
  });
}

export function maxBlocksForProfile(profile: ContextProfile): number {
  return profile === 'conversation' ? 6 : 12;
}
