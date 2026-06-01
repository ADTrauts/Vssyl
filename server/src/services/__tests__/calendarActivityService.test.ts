import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import { AuditService } from '../auditService';
import { recordEventCreated } from '../calendarActivityService';

vi.mock('../auditService', () => ({
  AuditService: {
    logBlockIdAction: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('calendarActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
  });

  it('recordEventCreated emits module activity and audit', async () => {
    await recordEventCreated({
      actorUserId: 'u1',
      eventId: 'evt-1',
      calendarId: 'cal-1',
      startAt: new Date('2026-06-01T10:00:00Z'),
      endAt: new Date('2026-06-01T11:00:00Z'),
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'calendar',
        action: 'event_created',
        targetId: 'evt-1',
      })
    );
    expect(AuditService.logBlockIdAction).toHaveBeenCalledWith(
      'u1',
      'CALENDAR_EVENT_CREATED',
      expect.any(String),
      expect.objectContaining({ eventId: 'evt-1' })
    );
  });
});
