import { beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeDomainEventForAI, isAIConsumableDomainEvent } from '../AIEventConsumer';
import { DOMAIN_EVENT_TYPES } from '../../../events/domainEventRegistry';
import type { DomainEvent } from '../../../events/types';
import * as userLearningSignalServiceModule from '../../../services/userLearningSignalService';
import * as moduleActivityServiceModule from '../../../services/moduleActivityService';

function baseEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    id: 'evt_test_1',
    type: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
    actorUserId: 'user-1',
    entityType: 'File',
    entityId: 'file-1',
    action: 'upload',
    metadata: { fileType: 'application/pdf', dashboardId: 'dash-1' },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('AIEventConsumer (Phase 4A)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('consumes file.uploaded into learning stub', async () => {
    const stubSpy = vi
      .spyOn(userLearningSignalServiceModule.userLearningSignalService, 'recordDomainEventLearningStub')
      .mockResolvedValue(undefined);
    const activitySpy = vi.spyOn(moduleActivityServiceModule, 'emitModuleActivityEvent');

    await consumeDomainEventForAI(baseEvent());

    expect(stubSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        domainEventType: DOMAIN_EVENT_TYPES.FILE_UPLOADED,
        entityId: 'file-1',
        sourceModule: 'drive',
        dashboardId: 'dash-1',
      })
    );
    expect(activitySpy).not.toHaveBeenCalled();
  });

  it('ignores unsupported domain event types', async () => {
    const stubSpy = vi
      .spyOn(userLearningSignalServiceModule.userLearningSignalService, 'recordDomainEventLearningStub')
      .mockResolvedValue(undefined);

    await consumeDomainEventForAI(
      baseEvent({ type: DOMAIN_EVENT_TYPES.USER_PREFERENCE_UPDATED, entityType: 'UserPreference' })
    );

    expect(stubSpy).not.toHaveBeenCalled();
    expect(isAIConsumableDomainEvent(baseEvent())).toBe(true);
    expect(
      isAIConsumableDomainEvent(
        baseEvent({ type: DOMAIN_EVENT_TYPES.USER_PREFERENCE_UPDATED, entityType: 'UserPreference' })
      )
    ).toBe(false);
  });

  it('does not consume events without actorUserId', async () => {
    const stubSpy = vi
      .spyOn(userLearningSignalServiceModule.userLearningSignalService, 'recordDomainEventLearningStub')
      .mockResolvedValue(undefined);

    await consumeDomainEventForAI(baseEvent({ actorUserId: '' }));

    expect(stubSpy).not.toHaveBeenCalled();
  });
});
