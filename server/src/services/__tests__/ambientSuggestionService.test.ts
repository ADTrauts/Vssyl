import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  AmbientSuggestionService,
  buildSuggestionListWhere,
} from '../ambientSuggestionService';
import { isDocumentMime } from '../../ai/suggestions/suggestionTypes';
import { NotificationService } from '../notificationService';
import { shouldDeferOutboundNotification } from '../quietHoursService';

vi.mock('../notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../userLearningSignalService', () => ({
  userLearningSignalService: {
    recordSuggestionAccepted: vi.fn().mockResolvedValue(undefined),
    recordSuggestionDismissed: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../quietHoursService', () => ({
  shouldDeferOutboundNotification: vi.fn().mockResolvedValue(false),
}));

function mockDb() {
  return {
    dashboard: { findFirst: vi.fn(), findUnique: vi.fn() },
    businessMember: { findFirst: vi.fn() },
    aISuggestion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    aISuggestionFeedback: { findFirst: vi.fn(), create: vi.fn() },
    file: { findUnique: vi.fn() },
  } as unknown as PrismaClient;
}

describe('buildSuggestionListWhere', () => {
  const userId = 'user_test';

  it('returns pending non-expired suggestions for user', () => {
    const where = buildSuggestionListWhere(userId);
    expect(where.userId).toBe(userId);
    expect(where.status).toBe('PENDING');
    const andClauses = where.AND as Array<{ OR?: Array<Record<string, unknown>> }>;
    expect(andClauses).toBeDefined();
    expect(
      andClauses.some(
        (c) =>
          c.OR?.some((o) => o.expiresAt === null) &&
          c.OR?.some((o) => typeof o.expiresAt === 'object')
      )
    ).toBe(true);
  });

  it('filters by dashboardId when provided', () => {
    const where = buildSuggestionListWhere(userId, { dashboardId: 'dash_a' });
    expect(where.dashboardId).toBe('dash_a');
  });

  it('filters by businessId when provided', () => {
    const where = buildSuggestionListWhere(userId, { businessId: 'biz_a' });
    expect(where.businessId).toBe('biz_a');
  });
});

describe('isDocumentMime', () => {
  it('recognizes pdf and text documents', () => {
    expect(isDocumentMime('application/pdf')).toBe(true);
    expect(isDocumentMime('text/plain')).toBe(true);
  });

  it('rejects image mime types', () => {
    expect(isDocumentMime('image/png')).toBe(false);
  });
});

describe('AmbientSuggestionService', () => {
  let db: PrismaClient;
  let service: AmbientSuggestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    db = mockDb();
    service = new AmbientSuggestionService(db);
  });

  it('expireStaleSuggestions marks overdue pending rows as EXPIRED', async () => {
    vi.mocked(db.aISuggestion.updateMany).mockResolvedValue({ count: 2 });
    const count = await service.expireStaleSuggestions('user_1');
    expect(count).toBe(2);
    expect(db.aISuggestion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING', userId: 'user_1' }),
        data: { status: 'EXPIRED' },
      })
    );
  });

  it('listPending validates dashboard access', async () => {
    vi.mocked(db.dashboard.findFirst).mockResolvedValue(null);
    await expect(
      service.listPending('user_1', { dashboardId: 'dash_other' })
    ).rejects.toThrow('Dashboard not found');
  });

  it('acceptSuggestion rejects expired suggestions', async () => {
    vi.mocked(db.aISuggestion.findFirst).mockResolvedValue({
      id: 's1',
      userId: 'user_1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 1000),
      type: 'document_upload',
      suggestionType: 'document_upload',
      title: 'Doc',
      suppressionKey: 'k1',
    } as never);
    vi.mocked(db.aISuggestion.update).mockResolvedValue({} as never);

    await expect(service.acceptSuggestion('user_1', 's1')).rejects.toThrow('expired');
    expect(db.aISuggestion.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'EXPIRED' } })
    );
  });

  it('dismissSuggestion records feedback with doNotShowAgain', async () => {
    vi.mocked(db.aISuggestion.findFirst).mockResolvedValue({
      id: 's1',
      userId: 'user_1',
      status: 'PENDING',
      type: 'document_upload',
      suggestionType: 'document_upload',
      title: 'Doc',
      suppressionKey: 'document_upload:dash:f1',
      dashboardId: 'dash_1',
      businessId: null,
    } as never);
    vi.mocked(db.aISuggestion.update).mockResolvedValue({} as never);
    vi.mocked(db.aISuggestionFeedback.create).mockResolvedValue({} as never);

    const result = await service.dismissSuggestion('user_1', 's1', {
      doNotShowAgain: true,
      reason: 'Not helpful',
    });

    expect(result.suggestionId).toBe('s1');
    expect(db.aISuggestionFeedback.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'dismissed',
          doNotShowAgain: true,
          reason: 'Not helpful',
        }),
      })
    );
  });

  it('createSuggestion skips notification during quiet hours (Phase 5E)', async () => {
    vi.mocked(shouldDeferOutboundNotification).mockResolvedValue(true);
    vi.mocked(db.dashboard.findFirst).mockResolvedValue({ id: 'dash-1' } as never);
    vi.mocked(db.aISuggestionFeedback.findFirst).mockResolvedValue(null);
    vi.mocked(db.aISuggestion.findFirst).mockResolvedValue(null);
    vi.mocked(db.aISuggestion.create).mockResolvedValue({
      id: 's-new',
      body: 'Review doc',
    } as never);

    await service.createSuggestion({
      userId: 'user_1',
      dashboardId: 'dash_1',
      suggestionType: 'document_upload',
      title: 'Doc',
      body: 'Review doc',
      actionData: { fileId: 'f1', suggestedPrompt: 'x' },
      confidence: 0.8,
      explainability: {
        summary: 'test',
        contextUsed: [],
        correlationReason: 'test',
        sourceEventIds: [],
      },
      correlationRuleId: 'document_upload_v1',
      suppressionKey: 'document_upload:dash_1:f1',
    });

    expect(NotificationService.createNotification).not.toHaveBeenCalled();
  });
});
