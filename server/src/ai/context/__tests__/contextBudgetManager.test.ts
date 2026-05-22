import { describe, expect, it } from 'vitest';
import {
  allocateTierBudget,
  applyContextBudget,
  estimateTokenCount,
} from '../ContextBudgetManager';
import type { AIAssembledContext } from '../AIContextAssembler';

function block(
  partial: Partial<AIAssembledContext['contextBlocks'][number]> &
    Pick<AIAssembledContext['contextBlocks'][number], 'title' | 'sourceType'>
): AIAssembledContext['contextBlocks'][number] {
  return {
    content: { sample: partial.title },
    priority: 'medium',
    ...partial,
  };
}

describe('ContextBudgetManager', () => {
  it('allocates tier budgets as fractions of total', () => {
    expect(allocateTierBudget(1000, 'tier1_recent_conversation')).toBe(350);
    expect(allocateTierBudget(1000, 'tier4_cross_module')).toBe(150);
  });

  it('marks dropped blocks with reasons and usedInPrompt flags', () => {
    const blocks: AIAssembledContext['contextBlocks'] = [
      block({
        title: 'Conversation history',
        sourceType: 'chat',
        tier: 'tier1_recent_conversation',
        priority: 'high',
        relevanceScore: 90,
      }),
      block({
        title: 'Module live context: Drive',
        sourceType: 'module',
        tier: 'tier4_cross_module',
        priority: 'medium',
        relevanceScore: 40,
        content: { x: 'y'.repeat(5000) },
      }),
      block({
        title: 'Cross-module summary',
        sourceType: 'module',
        tier: 'tier4_cross_module',
        priority: 'high',
        relevanceScore: 80,
        content: { x: 'z'.repeat(5000) },
      }),
    ];

    const result = applyContextBudget({
      blocks,
      maxEstimatedTokens: 120,
      alwaysKeepHighPriority: true,
    });

    expect(result.injectedBlocks.length).toBeGreaterThan(0);
    expect(result.droppedBlocks.length).toBeGreaterThan(0);
    expect(result.contextAvailability).toHaveLength(3);
    expect(result.contextAvailability.some((r) => r.usedInPrompt)).toBe(true);
    expect(result.contextAvailability.some((r) => !r.usedInPrompt && r.dropReason)).toBe(
      true
    );
    expect(result.injectedBlocks.every((b) => b.available === true && b.usedInPrompt === true)).toBe(
      true
    );
  });

  it('estimates tokens from serialized payload size', () => {
    expect(estimateTokenCount('abcd')).toBe(1);
    expect(estimateTokenCount('a'.repeat(40))).toBe(10);
  });
});
