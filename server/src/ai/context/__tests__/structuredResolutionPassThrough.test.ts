import { describe, expect, it, vi } from 'vitest';
import { assembleAIContext } from '../AIContextAssembler';
import * as structuredResponseMode from '../../utils/structuredResponseMode';
import { inferStructuredResponseMode } from '../../utils/structuredResponseMode';
import type { UserContext } from '../CrossModuleContextEngine';

const baseUserContext: UserContext = {
  userId: 'u1',
  activeModules: ['ai-chat'],
  currentFocus: { module: 'ai-chat' },
  preferences: {},
  patterns: [],
  relationships: [],
  crossModuleInsights: [],
};

describe('Package A — structuredResolution pass-through', () => {
  const cases = [
    {
      name: 'salt',
      query: 'Why does salt melt ice?',
      expect: { mode: 'conversation', contract: 'conversation' as const },
    },
    {
      name: 'EBITDA',
      query: 'Explain the difference between gross profit and EBITDA.',
      expect: { mode: 'conversation', contract: 'conversation' as const },
    },
    {
      name: 'travel',
      query: 'Where should I go for a relaxing three-day trip?',
      expect: { mode: 'conversation', contract: 'conversation' as const },
    },
    {
      name: 'labor budget',
      query: "What's our current labor budget?",
      businessId: 'biz1',
      expect: { mode: 'answer', contract: 'grounded_answer' as const },
    },
    {
      name: 'labor compare',
      query: 'Compare actual labor cost against budget.',
      businessId: 'biz1',
      expect: { mode: 'comparison', contract: 'enterprise' as const },
    },
    {
      name: 'meeting action',
      query: 'Move my 2 PM meeting to 3 PM.',
      expect: { mode: 'answer', contract: 'enterprise' as const, isAction: true },
    },
  ];

  for (const c of cases) {
    it(`canonical path uses pre-resolved result for ${c.name}`, () => {
      const resolution = inferStructuredResponseMode({
        query: c.query,
        toneMode: 'conversational',
        businessId: c.businessId,
      });
      expect(resolution.mode).toBe(c.expect.mode);
      expect(resolution.responseContract).toBe(c.expect.contract);
      if (c.expect.isAction) {
        expect(resolution.isActionRequest).toBe(true);
      }

      const spy = vi.spyOn(structuredResponseMode, 'inferStructuredResponseMode');
      const assembled = assembleAIContext({
        query: {
          query: c.query,
          userId: 'u1',
          context: { businessId: c.businessId },
        },
        userContext: baseUserContext,
        structuredResolution: resolution,
        toneMode: 'conversational',
      });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      expect(assembled.structuredResponseMode).toBe(resolution.mode);
    });
  }
});
