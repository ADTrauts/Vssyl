import { describe, expect, it, vi } from 'vitest';
import * as emitters from '../../events/domainEventEmitters';
import { recordEmployeeCreatedDomainEvent, recordPtoApprovedDomainEvent } from '../hrDomainEventService';

describe('hrDomainEventService', () => {
  it('delegates employee created to platform emitter', () => {
    const spy = vi.spyOn(emitters, 'emitHrEmployeeCreatedEvent').mockReturnValue({ id: 'e1' } as never);

    recordEmployeeCreatedDomainEvent({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      employeeHrProfileId: 'profile-1',
      employeePositionId: 'ep-1',
    });

    expect(spy).toHaveBeenCalledWith({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      employeeHrProfileId: 'profile-1',
      employeePositionId: 'ep-1',
    });
  });

  it('delegates pto approved to platform emitter', () => {
    const spy = vi.spyOn(emitters, 'emitHrPtoApprovedEvent').mockReturnValue({ id: 'e2' } as never);

    recordPtoApprovedDomainEvent({
      actorUserId: 'mgr-1',
      businessId: 'biz-1',
      timeOffRequestId: 'tor-1',
      employeePositionId: 'ep-1',
    });

    expect(spy).toHaveBeenCalled();
  });
});
