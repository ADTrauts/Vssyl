import { describe, expect, it } from 'vitest';
import { shouldUseInformationalAnswerEscape } from '../informationalAnswerEscape';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { inferQueryIntent } from '../queryIntent';
import { resolveContextProfile } from '../../context/contextProfile';
import { inferConversationCoachingProfile } from '../../prompts/conversationCoachingProfile';
import { buildStructuredResponseFormatInstructions } from '../../prompts/structuredResponseFormat';
import {
  CONVERSATION_ASSISTANT_IDENTITY,
  CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK,
} from '../../prompts/conversationRecommendationRichness';

const SALT = 'Why does salt melt ice?';
const COMPOUND = "Explain compound interest like I'm new to investing.";
const DEPRECIATION = 'What does depreciation mean?';
const INFLATION = 'Help me understand why inflation reduces purchasing power.';

describe('informational answer escape (P2)', () => {
  describe('general informational', () => {
    const cases = [
      { name: 'salt/ice', query: SALT },
      { name: 'compound interest', query: COMPOUND },
      { name: 'depreciation', query: DEPRECIATION },
      { name: 'inflation purchasing power', query: INFLATION },
    ] as const;

    for (const { name, query } of cases) {
      it(`${name}: escapes residual answer into informational conversation`, () => {
        expect(inferQueryIntent(query)).toBe('answer');

        const inferred = inferStructuredResponseMode({
          query,
          toneMode: 'conversational',
        });
        expect(inferred.mode).toBe('conversation');
        expect(inferred.informationalAnswerEscape).toBe(true);
        expect(resolveContextProfile(inferred.mode)).toBe('conversation');

        const coaching = inferConversationCoachingProfile({
          userQuery: query,
          conversationObjective: 'learn',
        });
        expect(coaching.style).toBe('informational');
        expect(coaching.includeRecommendationRichness).toBe(false);

        const format = buildStructuredResponseFormatInstructions('conversation', {
          includeRecommendationGuidance: false,
        });
        const enterpriseFormat = buildStructuredResponseFormatInstructions('answer');
        expect(format).toContain('conversation mode');
        expect(format).toMatch(/Answer naturally and directly/i);
        expect(format).not.toContain('RECOMMENDATION INTELLIGENCE');
        expect(enterpriseFormat).toContain('keyInsights');
        expect(enterpriseFormat).toContain('recommendedActions');
        expect(CONVERSATION_ASSISTANT_IDENTITY).toMatch(/Answer naturally and directly/i);
        expect(CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK).toContain('RECOMMENDATION INTELLIGENCE');
      });
    }

    it('salt: shouldUseInformationalAnswerEscape is true for provisional answer', () => {
      expect(
        shouldUseInformationalAnswerEscape({
          query: SALT,
          provisionalMode: 'answer',
        })
      ).toBe(true);
    });
  });

  describe('grounded requests must not escape', () => {
    it('calendar: who am I meeting tomorrow', () => {
      const q = 'Who am I meeting tomorrow?';
      expect(inferQueryIntent(q)).toBe('answer');
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.mode).toBe('answer');
      expect(
        shouldUseInformationalAnswerEscape({ query: q, provisionalMode: 'answer' })
      ).toBe(false);
    });

    it('calendar: meetings this week', () => {
      const q = 'What meetings do I have this week?';
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.mode).toBe('answer');
    });

    it('business: current labor budget', () => {
      const q = "What's our current labor budget?";
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.mode).toBe('answer');
    });

    it('files: Sarah shared', () => {
      const q = 'What files did Sarah share with me?';
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.mode).toBe('answer');
    });
  });

  describe('action requests must not escape', () => {
    it('move meeting', () => {
      const q = 'Move my 2 PM meeting to 3 PM.';
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.mode).toBe('answer');
    });

    it('share file', () => {
      const q = 'Share this file with Sarah.';
      const inferred = inferStructuredResponseMode({ query: q, toneMode: 'conversational' });
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.mode).toBe('answer');
    });
  });

  describe('enterprise deliverables preserved', () => {
    it('labor cost vs budget stays comparison (not informational escape)', () => {
      const q = 'Compare actual labor cost against budget.';
      const inferred = inferStructuredResponseMode({ query: q });
      expect(inferred.mode).toBe('comparison');
      expect(inferred.informationalAnswerEscape).not.toBe(true);
    });

    it('Q1/Q2 labor with business data stays comparison', () => {
      const q = 'Compare Q1 and Q2 labor performance using our business data.';
      const inferred = inferStructuredResponseMode({ query: q });
      expect(inferred.mode).toBe('comparison');
      expect(inferred.informationalAnswerEscape).not.toBe(true);
    });

    it('tone analytical + labor comparison does not become informational conversation', () => {
      // Remaining concern: tone can override to analysis; escape must not fight that into GK.
      const q = 'Compare actual labor cost against budget.';
      const inferred = inferStructuredResponseMode({
        query: q,
        toneMode: 'analytical',
      });
      expect(inferred.mode).toBe('analysis');
      expect(inferred.informationalAnswerEscape).not.toBe(true);
    });
  });

  describe('request context guards', () => {
    it('fileIds block escape even for otherwise informational wording', () => {
      expect(
        shouldUseInformationalAnswerEscape({
          query: 'What does depreciation mean?',
          provisionalMode: 'answer',
          fileIds: ['file-1'],
        })
      ).toBe(false);
    });

    it('businessId alone does not block pure general knowledge', () => {
      expect(
        shouldUseInformationalAnswerEscape({
          query: SALT,
          provisionalMode: 'answer',
          businessId: 'biz-1',
        })
      ).toBe(true);
    });
  });
});
