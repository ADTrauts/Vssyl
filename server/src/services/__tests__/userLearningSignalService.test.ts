import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  LearningSignalValidationError,
  UserLearningSignalService,
} from '../userLearningSignalService';
import { LEARNING_SIGNAL_TYPES } from '../../ai/learning/learningSignalTypes';
import { LEARNING_EVENT_TYPES } from '../../ai/learning/learningProposalTypes';

vi.mock('../learningApplicationService', () => ({
  learningApplicationService: {
    createPendingPreferenceFromSuggestionPattern: vi.fn().mockResolvedValue({ id: 'ctx-1' }),
  },
}));

import { learningApplicationService } from '../learningApplicationService';

function mockDb() {
  return {
    businessMember: { findFirst: vi.fn().mockResolvedValue({ id: 'm1' }) },
    dashboard: { findFirst: vi.fn().mockResolvedValue({ id: 'dash-1' }) },
    aILearningEvent: {
      create: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    aISuggestionFeedback: {
      count: vi.fn().mockResolvedValue(0),
    },
  } as unknown as PrismaClient;
}

describe('userLearningSignalService', () => {
  let db: PrismaClient;
  let service: UserLearningSignalService;

  beforeEach(() => {
    db = mockDb();
    service = new UserLearningSignalService(db);
    vi.mocked(db.aILearningEvent.create).mockResolvedValue({ id: 'evt-1' } as never);
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue(null);
    vi.mocked(db.aILearningEvent.count).mockResolvedValue(0);
  });

  it('records suggestion accepted with tenant scope in artifact', async () => {
    await service.recordSuggestionAccepted({
      userId: 'user-1',
      suggestionId: 'sug-1',
      suggestionType: 'document_upload',
      suggestionTitle: 'Document uploaded',
      businessId: 'biz-1',
      dashboardId: 'dash-1',
    });

    expect(db.businessMember.findFirst).toHaveBeenCalled();
    expect(db.dashboard.findFirst).toHaveBeenCalled();
    expect(db.aILearningEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          eventType: LEARNING_EVENT_TYPES.BEHAVIORAL_SIGNAL,
          moduleSpecificData: expect.objectContaining({
            signalType: LEARNING_SIGNAL_TYPES.SUGGESTION_ACCEPTED,
            businessId: 'biz-1',
            dashboardId: 'dash-1',
          }),
        }),
      })
    );
  });

  it('records suggestion dismissed signal', async () => {
    await service.recordSuggestionDismissed({
      userId: 'user-1',
      suggestionId: 'sug-2',
      suggestionType: 'document_upload',
      suggestionTitle: 'Review invoice',
      doNotShowAgain: true,
      correlationRuleId: 'document_upload_v1',
    });

    expect(db.aILearningEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          moduleSpecificData: expect.objectContaining({
            signalType: LEARNING_SIGNAL_TYPES.SUGGESTION_DISMISSED,
          }),
        }),
      })
    );
  });

  it('creates pending learning proposal after repeated accepts (Phase 5E)', async () => {
    vi.mocked(db.aISuggestionFeedback.count).mockResolvedValue(3);

    await service.recordSuggestionAccepted({
      userId: 'user-1',
      suggestionId: 'sug-3',
      suggestionType: 'meeting_prep',
      suggestionTitle: 'Prep for meeting',
      correlationRuleId: 'meeting_prep_v1',
    });

    expect(learningApplicationService.createPendingPreferenceFromSuggestionPattern).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        suggestionType: 'meeting_prep',
        acceptanceCount: 3,
      })
    );
  });

  it('rejects invalid business tenancy', async () => {
    vi.mocked(db.businessMember.findFirst).mockResolvedValue(null);

    await expect(
      service.recordSignal({
        userId: 'user-1',
        signalType: LEARNING_SIGNAL_TYPES.FEEDBACK_POSITIVE,
        businessId: 'biz-unknown',
      })
    ).rejects.toBeInstanceOf(LearningSignalValidationError);
  });

  it('upserts module usage signals', async () => {
    vi.mocked(db.aILearningEvent.findFirst).mockResolvedValue({
      id: 'existing-module',
    } as never);

    await service.recordModuleUsageFromTwin({
      userId: 'user-1',
      modulesReferenced: ['drive', 'chat'],
      businessId: 'biz-1',
    });

    expect(db.aILearningEvent.update).toHaveBeenCalled();
    expect(db.aILearningEvent.create).not.toHaveBeenCalled();
  });
});
