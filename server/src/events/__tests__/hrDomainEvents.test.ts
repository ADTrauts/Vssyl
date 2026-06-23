import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitHrEmployeeCreatedEvent, emitHrPtoRequestedEvent } from '../domainEventEmitters';
import * as emitDomainEventModule from '../emitDomainEvent';

describe('HR domain events (PK-W3-DE-2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('hr.employee.created scopes employeePositionId without PII', () => {
    const emitSpy = vi
      .spyOn(emitDomainEventModule, 'emitDomainEvent')
      .mockReturnValue({ id: 'e1' } as never);

    emitHrEmployeeCreatedEvent({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      employeeHrProfileId: 'profile-1',
      employeePositionId: 'ep-1',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'hr.employee.created',
        entityId: 'profile-1',
        businessId: 'biz-1',
        metadata: expect.objectContaining({
          moduleId: 'hr',
          employeePositionId: 'ep-1',
        }),
      })
    );
    const meta = (emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> })
      .metadata;
    expect(meta).not.toHaveProperty('email');
    expect(meta).not.toHaveProperty('name');
  });

  it('hr.pto.requested includes type when provided', () => {
    const emitSpy = vi
      .spyOn(emitDomainEventModule, 'emitDomainEvent')
      .mockReturnValue({ id: 'e2' } as never);

    emitHrPtoRequestedEvent({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      timeOffRequestId: 'tor-1',
      employeePositionId: 'ep-1',
      type: 'PTO',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'hr.pto.requested',
        entityId: 'tor-1',
        metadata: expect.objectContaining({ type: 'PTO' }),
      })
    );
  });
});
