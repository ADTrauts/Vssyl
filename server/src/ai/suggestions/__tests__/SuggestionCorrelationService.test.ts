import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { DOMAIN_EVENT_TYPES } from '../../../events/domainEventRegistry';
import type { DomainEvent } from '../../../events/types';
import { SuggestionCorrelationService } from '../SuggestionCorrelationService';

function fileUploadEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    id: 'evt_corr_1',
    type: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
    actorUserId: 'user-1',
    entityType: 'File',
    entityId: 'file-1',
    action: 'create',
    metadata: {
      fileType: 'application/pdf',
      fileName: 'invoice.pdf',
      dashboardId: 'dash-1',
    },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockDb() {
  return {
    aISuggestionSignal: {
      create: vi.fn().mockResolvedValue({ id: 'sig-1' }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    dashboard: {
      findUnique: vi.fn().mockResolvedValue({ businessId: null }),
    },
    file: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient;
}

describe('SuggestionCorrelationService (Phase 5B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records signal and returns document_upload candidate for pdf upload', async () => {
    const db = mockDb();
    const service = new SuggestionCorrelationService(db);

    const result = await service.correlateFromDomainEvent(fileUploadEvent());

    expect(db.aISuggestionSignal.create).toHaveBeenCalled();
    expect(result.signalId).toBe('sig-1');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.suggestionType).toBe('document_upload');
    expect(result.candidates[0]?.correlationRuleId).toBe('document_upload_v1');
    expect(db.aISuggestionSignal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sig-1' },
        data: expect.objectContaining({
          ruleIds: expect.arrayContaining(['document_upload_v1']),
        }),
      })
    );
  });

  it('returns no candidates for non-document mime', async () => {
    const db = mockDb();
    const service = new SuggestionCorrelationService(db);

    const result = await service.correlateFromDomainEvent(
      fileUploadEvent({ metadata: { fileType: 'image/png', dashboardId: 'dash-1' } })
    );

    expect(result.candidates).toHaveLength(0);
  });
});
