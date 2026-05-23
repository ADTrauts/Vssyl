import { describe, it, expect } from 'vitest';
import { suggestionDryRunService } from '../SuggestionDryRunService';
import { CORRELATION_RULE_IDS, SUGGESTION_TYPES } from '../suggestionTypes';
import { MAX_SUGGESTIONS_PER_USER_DASHBOARD_24H } from '../SuggestionRankingService';

describe('SuggestionDryRunService (Phase 5F admin)', () => {
  it('meeting_prep fixture returns rule id, confidence, and source events', async () => {
    const result = await suggestionDryRunService.run({
      fixtureId: 'meeting_prep',
      userId: 'admin-user',
      dashboardId: 'dash-admin',
    });

    expect(result.fixtureId).toBe('meeting_prep');
    expect(result.evaluatedRuleIds).toContain(CORRELATION_RULE_IDS.MEETING_PREP_V1);
    const meeting = result.candidates.find((c) => c.suggestionType === SUGGESTION_TYPES.MEETING_PREP);
    expect(meeting).toBeDefined();
    expect(meeting?.correlationRuleId).toBe(CORRELATION_RULE_IDS.MEETING_PREP_V1);
    expect(meeting?.confidence).toBeGreaterThan(0.65);
    expect(meeting?.explainSummary.length).toBeGreaterThan(0);
    expect(meeting?.sourceEventIds.length).toBeGreaterThan(0);
    expect(meeting?.contextModules).toEqual(expect.arrayContaining(['calendar', 'drive']));
  });

  it('frequency cap simulation rejects candidates when recent count at cap', async () => {
    const result = await suggestionDryRunService.run({
      fixtureId: 'document_upload',
      userId: 'admin-user',
      dashboardId: 'dash-admin',
      recentSuggestionCount: MAX_SUGGESTIONS_PER_USER_DASHBOARD_24H,
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.wouldCreateCount).toBe(0);
    expect(result.candidates.every((c) => c.rankingRejectionReason === 'frequency_cap')).toBe(true);
  });
});
