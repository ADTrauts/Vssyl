import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitBusinessUpdatedEvent } from '../domainEventEmitters';
import * as emitDomainEventModule from '../emitDomainEvent';

describe('business.updated domain event', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('emits with changedFields only (no sensitive values)', () => {
    const emitSpy = vi.spyOn(emitDomainEventModule, 'emitDomainEvent').mockReturnValue({
      id: 'evt-1',
    } as never);

    emitBusinessUpdatedEvent({
      actorUserId: 'u1',
      businessId: 'b1',
      changedFields: ['name', 'industry'],
      updateKind: 'profile',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'business.updated',
        entityType: 'Business',
        entityId: 'b1',
        businessId: 'b1',
        metadata: {
          changedFields: ['name', 'industry'],
          updateKind: 'profile',
        },
      })
    );
    const payload = emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> };
    expect(payload.metadata).not.toHaveProperty('ein');
    expect(payload.metadata).not.toHaveProperty('logo');
  });
});
