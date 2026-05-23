import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  MAX_SUGGESTIONS_PER_USER_DASHBOARD_24H,
  MIN_CONFIDENCE_SHOWN,
  SuggestionRankingService,
} from '../SuggestionRankingService';
import type { SuggestionCandidate } from '../suggestionRuleTypes';

function baseCandidate(overrides: Partial<SuggestionCandidate> = {}): SuggestionCandidate {
  return {
    userId: 'user-1',
    dashboardId: 'dash-1',
    suggestionType: 'document_upload',
    title: 'Test',
    body: 'Test body',
    actionData: { fileId: 'f1' },
    confidence: 0.75,
    explainability: {
      summary: 'Test',
      contextUsed: [],
      correlationReason: 'test',
      sourceEventIds: ['evt-1'],
    },
    correlationRuleId: 'document_upload_v1',
    suppressionKey: 'document_upload:dash-1:f1',
    sourceEventIds: ['evt-1'],
    ...overrides,
  };
}

function mockDb(recentCount = 0, feedback: { suppressed?: boolean; dismissCount?: number } = {}) {
  return {
    aISuggestion: {
      count: vi.fn().mockResolvedValue(recentCount),
    },
    aISuggestionFeedback: {
      findFirst: vi.fn().mockResolvedValue(feedback.suppressed ? { id: 'fb-1' } : null),
      count: vi.fn().mockResolvedValue(feedback.dismissCount ?? 0),
    },
  } as unknown as PrismaClient;
}

describe('SuggestionRankingService (Phase 5B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts candidates above confidence threshold', async () => {
    const service = new SuggestionRankingService(mockDb(0));
    const result = await service.filterCandidates('user-1', 'dash-1', [baseCandidate()]);
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
  });

  it('rejects candidates below confidence threshold', async () => {
    const service = new SuggestionRankingService(mockDb(0));
    const result = await service.filterCandidates('user-1', 'dash-1', [
      baseCandidate({ confidence: MIN_CONFIDENCE_SHOWN - 0.01 }),
    ]);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toBe('below_confidence_threshold');
  });

  it('rejects when frequency cap exceeded', async () => {
    const service = new SuggestionRankingService(
      mockDb(MAX_SUGGESTIONS_PER_USER_DASHBOARD_24H)
    );
    const result = await service.filterCandidates('user-1', 'dash-1', [baseCandidate()]);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toBe('frequency_cap');
  });

  it('assigns high priority when confidence >= 0.85', async () => {
    const service = new SuggestionRankingService(mockDb(0));
    const result = await service.filterCandidates('user-1', 'dash-1', [
      baseCandidate({ confidence: 0.9 }),
    ]);
    expect(result.accepted[0]?.priority).toBe('high');
  });

  it('rejects suppressed candidates (Phase 5E)', async () => {
    const service = new SuggestionRankingService(mockDb(0, { suppressed: true }));
    const result = await service.filterCandidates('user-1', 'dash-1', [baseCandidate()]);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toBe('suppressed');
  });

  it('applies dismissal decay to confidence (Phase 5E)', async () => {
    const service = new SuggestionRankingService(mockDb(0, { dismissCount: 2 }));
    const result = await service.filterCandidates('user-1', 'dash-1', [
      baseCandidate({ confidence: 0.68 }),
    ]);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toBe('dismissal_decay');
  });
});
