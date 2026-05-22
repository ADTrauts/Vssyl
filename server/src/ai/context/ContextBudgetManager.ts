/**
 * Tier-aware context token budget manager (Phase 3D).
 */

import { logger } from '../../lib/logger';
import type { AIAssembledContext, AIContextTier } from './AIContextAssembler';

export const TIER_ORDER: AIContextTier[] = [
  'tier1_recent_conversation',
  'tier2_continuity',
  'tier3_profile',
  'tier4_cross_module',
];

export type ContextBudgetDropReason =
  | 'tier_budget_exhausted'
  | 'total_budget_exhausted'
  | 'priority_not_selected';

export interface ContextBudgetDroppedBlock {
  title: string;
  tier: AIContextTier;
  sourceType: string;
  reason: ContextBudgetDropReason;
  relevanceScore?: number;
  estimatedTokens: number;
}

export interface ContextBudgetTierUsage {
  tier: AIContextTier;
  blocksInjected: number;
  tokensUsedEstimate: number;
  tokenBudgetAllocated: number;
}

export interface ContextAvailabilityRow {
  title: string;
  sourceType: string;
  tier?: AIContextTier;
  relevanceScore?: number;
  available: true;
  usedInPrompt: boolean;
  dropReason?: ContextBudgetDropReason;
  budgetTokensEstimate?: number;
}

export interface ContextBudgetApplyResult {
  injectedBlocks: AIAssembledContext['contextBlocks'];
  droppedBlocks: ContextBudgetDroppedBlock[];
  contextAvailability: ContextAvailabilityRow[];
  tierUsage: ContextBudgetTierUsage[];
  totalTokensUsed: number;
}

export function allocateTierBudget(totalBudget: number, tier: AIContextTier): number {
  switch (tier) {
    case 'tier1_recent_conversation':
      return Math.round(totalBudget * 0.35);
    case 'tier2_continuity':
      return Math.round(totalBudget * 0.25);
    case 'tier3_profile':
      return Math.round(totalBudget * 0.25);
    case 'tier4_cross_module':
      return Math.round(totalBudget * 0.15);
    default:
      return Math.round(totalBudget * 0.1);
  }
}

function blockPayloadForTokenEstimate(
  b: AIAssembledContext['contextBlocks'][number]
): Record<string, unknown> {
  return {
    title: b.title,
    sourceType: b.sourceType,
    priority: b.priority,
    content: b.content,
    relevanceScore: b.relevanceScore,
  };
}

/** Cheap deterministic size proxy (~4 chars per token). */
export function estimateTokenCount(value: unknown): number {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return Math.ceil(s.length / 4);
  } catch {
    return 0;
  }
}

export function estimateBlockTokens(b: AIAssembledContext['contextBlocks'][number]): number {
  return estimateTokenCount(blockPayloadForTokenEstimate(b));
}

function resolveBlockTier(b: AIAssembledContext['contextBlocks'][number]): AIContextTier {
  return b.tier ?? 'tier4_cross_module';
}

/**
 * Apply tier-allocated token budget; marks blocks available vs usedInPrompt.
 */
export function applyContextBudget(input: {
  blocks: AIAssembledContext['contextBlocks'];
  maxEstimatedTokens: number;
  /** When false, high-priority blocks still respect the token budget (conversation profile). */
  alwaysKeepHighPriority?: boolean;
}): ContextBudgetApplyResult {
  const { blocks, maxEstimatedTokens, alwaysKeepHighPriority = true } = input;
  const blocksBefore = blocks.length;
  const keptIndices = new Set<number>();
  const droppedBlocks: ContextBudgetDroppedBlock[] = [];
  const tierTokensUsed: Record<AIContextTier, number> = {
    tier1_recent_conversation: 0,
    tier2_continuity: 0,
    tier3_profile: 0,
    tier4_cross_module: 0,
  };
  const tierBlocksInjected: Record<AIContextTier, number> = {
    tier1_recent_conversation: 0,
    tier2_continuity: 0,
    tier3_profile: 0,
    tier4_cross_module: 0,
  };

  let totalTokens = 0;

  const tryKeep = (
    idx: number,
    b: AIAssembledContext['contextBlocks'][number],
    tier: AIContextTier,
    cost: number,
    forceHigh: boolean
  ): boolean => {
    if (keptIndices.has(idx)) return true;

    if (forceHigh && alwaysKeepHighPriority) {
      keptIndices.add(idx);
      totalTokens += cost;
      tierTokensUsed[tier] += cost;
      tierBlocksInjected[tier] += 1;
      return true;
    }

    if (totalTokens + cost > maxEstimatedTokens) {
      droppedBlocks.push({
        title: b.title,
        tier,
        sourceType: b.sourceType,
        reason: 'total_budget_exhausted',
        relevanceScore: b.relevanceScore,
        estimatedTokens: cost,
      });
      return false;
    }

    const tierBudget = allocateTierBudget(maxEstimatedTokens, tier);
    if (tierTokensUsed[tier] + cost > tierBudget) {
      droppedBlocks.push({
        title: b.title,
        tier,
        sourceType: b.sourceType,
        reason: 'tier_budget_exhausted',
        relevanceScore: b.relevanceScore,
        estimatedTokens: cost,
      });
      return false;
    }

    keptIndices.add(idx);
    totalTokens += cost;
    tierTokensUsed[tier] += cost;
    tierBlocksInjected[tier] += 1;
    return true;
  };

  for (const tier of TIER_ORDER) {
    const tierEntries = blocks
      .map((b, idx) => ({ b, idx }))
      .filter(({ b }) => resolveBlockTier(b) === tier);

    for (const { b, idx } of tierEntries) {
      const cost = estimateBlockTokens(b);
      const isHigh = b.priority === 'high';
      tryKeep(idx, b, tier, cost, isHigh);
    }
  }

  const typesInRanked = [...new Set(blocks.map((bl) => bl.sourceType))];
  const typesInKept = new Set([...keptIndices].map((idx) => blocks[idx].sourceType));
  const missingTypes = typesInRanked.filter((t) => !typesInKept.has(t));

  for (const st of missingTypes) {
    const candidates = blocks
      .map((b, idx) => ({ b, idx }))
      .filter(({ b, idx }) => b.sourceType === st && !keptIndices.has(idx))
      .sort((a, c) => estimateBlockTokens(a.b) - estimateBlockTokens(c.b));

    const pick = candidates[0];
    if (!pick) continue;
    const tier = resolveBlockTier(pick.b);
    const cost = estimateBlockTokens(pick.b);
    if (!tryKeep(pick.idx, pick.b, tier, cost, false)) {
      // tryKeep already records drop reason
    }
  }

  const dropReasonByTitle = new Map<string, ContextBudgetDropReason>();
  for (const drop of droppedBlocks) {
    if (!dropReasonByTitle.has(drop.title)) {
      dropReasonByTitle.set(drop.title, drop.reason);
    }
  }

  const contextAvailability: ContextAvailabilityRow[] = blocks.map((b, idx) => {
    const tier = resolveBlockTier(b);
    const actuallyUsed = keptIndices.has(idx);
    const cost = estimateBlockTokens(b);
    return {
      title: b.title,
      sourceType: b.sourceType,
      tier,
      relevanceScore: b.relevanceScore,
      available: true as const,
      usedInPrompt: actuallyUsed,
      ...(actuallyUsed
        ? { budgetTokensEstimate: cost }
        : { dropReason: dropReasonByTitle.get(b.title) ?? 'priority_not_selected' }),
    };
  });

  const injectedBlocks: AIAssembledContext['contextBlocks'] = blocks
    .map((b, idx) => ({ b, idx }))
    .filter(({ idx }) => keptIndices.has(idx))
    .map(({ b }) => {
      const budgetTokensEstimate = estimateBlockTokens(b);
      return {
        ...b,
        available: true,
        usedInPrompt: true,
        budgetTokensEstimate,
      };
    });

  const tierUsage: ContextBudgetTierUsage[] = TIER_ORDER.map((tier) => ({
    tier,
    blocksInjected: tierBlocksInjected[tier],
    tokensUsedEstimate: tierTokensUsed[tier],
    tokenBudgetAllocated: allocateTierBudget(maxEstimatedTokens, tier),
  }));

  void logger.debug('[AI_CONTEXT_BUDGET]', {
    maxEstimatedTokens,
    blocksBefore,
    blocksAfter: injectedBlocks.length,
    blocksDropped: droppedBlocks.length,
    estimatedTokensKept: totalTokens,
    tierUsage,
    droppedBlocks: droppedBlocks.slice(0, 12).map((d) => ({
      title: d.title,
      tier: d.tier,
      reason: d.reason,
      relevanceScore: d.relevanceScore,
    })),
    topRelevanceScores: blocks
      .map((b) => ({ title: b.title, score: b.relevanceScore ?? 0, tier: b.tier }))
      .sort((a, c) => c.score - a.score)
      .slice(0, 5),
  });

  return {
    injectedBlocks,
    droppedBlocks,
    contextAvailability,
    tierUsage,
    totalTokensUsed: totalTokens,
  };
}
