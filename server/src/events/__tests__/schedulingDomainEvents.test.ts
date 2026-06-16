import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emitSchedulingSchedulePublishedEvent,
  emitSchedulingShiftAssignedEvent,
  emitSchedulingSwapRequestedEvent,
} from '../domainEventEmitters';
import * as emitDomainEventModule from '../emitDomainEvent';

describe('Scheduling domain events (certification remediation)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('scheduling.schedule.published includes shiftCount without schedule name', () => {
    const emitSpy = vi
      .spyOn(emitDomainEventModule, 'emitDomainEvent')
      .mockReturnValue({ id: 'e1' } as never);

    emitSchedulingSchedulePublishedEvent({
      actorUserId: 'u1',
      scheduleId: 'sched-1',
      businessId: 'biz-1',
      shiftCount: 12,
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'scheduling.schedule.published',
        entityId: 'sched-1',
        businessId: 'biz-1',
        metadata: expect.objectContaining({
          moduleId: 'scheduling',
          shiftCount: 12,
        }),
      })
    );
    const meta = (emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> })
      .metadata;
    expect(meta).not.toHaveProperty('name');
    expect(meta).not.toHaveProperty('title');
  });

  it('scheduling.shift.assigned scopes employeePositionId without PII', () => {
    const emitSpy = vi
      .spyOn(emitDomainEventModule, 'emitDomainEvent')
      .mockReturnValue({ id: 'e2' } as never);

    emitSchedulingShiftAssignedEvent({
      actorUserId: 'u1',
      shiftId: 'shift-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
      employeePositionId: 'ep-1',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'scheduling.shift.assigned',
        metadata: expect.objectContaining({
          moduleId: 'scheduling',
          scheduleId: 'sched-1',
          employeePositionId: 'ep-1',
        }),
      })
    );
    const meta = (emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> })
      .metadata;
    expect(meta).not.toHaveProperty('email');
    expect(meta).not.toHaveProperty('body');
  });

  it('scheduling.swap.requested includes shiftId reference', () => {
    const emitSpy = vi
      .spyOn(emitDomainEventModule, 'emitDomainEvent')
      .mockReturnValue({ id: 'e3' } as never);

    emitSchedulingSwapRequestedEvent({
      actorUserId: 'u1',
      swapId: 'swap-1',
      businessId: 'biz-1',
      shiftId: 'shift-1',
      requestedToId: 'u2',
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'scheduling.swap.requested',
        entityId: 'swap-1',
        metadata: expect.objectContaining({
          moduleId: 'scheduling',
          shiftId: 'shift-1',
          requestedToId: 'u2',
        }),
      })
    );
    const meta = (emitSpy.mock.calls[0]?.[0] as { metadata?: Record<string, unknown> })
      .metadata;
    expect(meta).not.toHaveProperty('reason');
  });
});
