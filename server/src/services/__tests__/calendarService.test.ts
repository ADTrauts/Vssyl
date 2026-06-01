import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as calendarPermission from '../calendarPermissionService';
import * as moduleActivity from '../moduleActivityService';
import * as calendarDomain from '../calendarDomainEventService';
import { createCalendar } from '../calendarService';

describe('calendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(calendarPermission, 'enforceCalendarContextMembership').mockResolvedValue(undefined);
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
    vi.spyOn(calendarDomain, 'recordCalendarCreatedDomainEvent').mockImplementation(() => undefined);
  });

  it('creates a calendar with owner membership', async () => {
    const created = {
      id: 'cal-1',
      name: 'Work',
      contextType: 'PERSONAL',
      contextId: 'user-1',
    };
    vi.spyOn(prisma.calendar, 'create').mockResolvedValue(created as never);

    const result = await createCalendar({
      userId: 'user-1',
      name: 'Work',
      contextType: 'PERSONAL',
      contextId: 'user-1',
    });

    expect(result).toEqual(created);
    expect(prisma.calendar.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Work',
          members: { create: { userId: 'user-1', role: 'OWNER' } },
        }),
      })
    );
  });
});
