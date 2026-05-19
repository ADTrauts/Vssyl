import { describe, expect, it } from 'vitest';
import {
  buildQuestionnaireSoftPromptInstructions,
  extractQuestionnairePromptDetail,
} from '../questionnaireSoftPromptTemplates';
import type { EffectiveSoftPreferences } from '../preferenceTypes';

const soft: EffectiveSoftPreferences = {
  tone: 'professional',
  verbosity: 'balanced',
  recommendationRichness: 'balanced',
  structurePreference: 'structured',
  communicationStyle: 'formality: formal',
};

describe('questionnaireSoftPromptTemplates', () => {
  it('extracts questionnaire detail from profile JSON', () => {
    const detail = extractQuestionnairePromptDetail({
      preferences: {
        communication: { formality: 'casual and friendly', responseSpeed: 'immediate' },
        decision: { informationNeeds: 'comprehensive' },
      },
    });
    expect(detail?.formality).toContain('casual');
    expect(detail?.informationNeeds).toBe('comprehensive');
  });

  it('builds prose instructions without raw JSON', () => {
    const text = buildQuestionnaireSoftPromptInstructions(soft, {
      formality: 'formal and professional',
      informationNeeds: 'comprehensive',
    });
    expect(text).toContain('professional');
    expect(text).not.toContain('{');
    expect(text).not.toContain('questionnaire');
  });
});
