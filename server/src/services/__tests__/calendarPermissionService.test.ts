import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  assertCalendarMember,
  assertCalendarWriteAccess,
  enforceCalendarContextMembership,
} from '../calendarPermissionService';
import { CalendarServiceError } from '../calendar/calendarErrors';

describe('calendarPermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows personal context when contextId matches userId', async () => {
    await expect(
      enforceCalendarContextMembership('user-1', 'PERSONAL', 'user-1')
    ).resolves.toBeUndefined();
  });

  it('denies personal context for another user', async () => {
    await expect(
      enforceCalendarContextMembership('user-1', 'PERSONAL', 'user-2')
    ).rejects.toMatchObject({ code: 'forbidden', status: 403 });
  });

  it('denies calendar member check when not a member', async () => {
    vi.spyOn(prisma.calendarMember, 'findFirst').mockResolvedValue(null);
    await expect(assertCalendarMember('user-1', 'cal-1')).rejects.toBeInstanceOf(
      CalendarServiceError
    );
  });

  it('denies write when user lacks editor role', async () => {
    vi.spyOn(prisma.calendar, 'findUnique').mockResolvedValue({
      id: 'cal-1',
      contextType: 'PERSONAL',
      contextId: 'user-1',
    } as never);
    vi.spyOn(prisma.calendarMember, 'findFirst').mockResolvedValue(null);
    await expect(assertCalendarWriteAccess('user-1', 'cal-1')).rejects.toMatchObject({
      code: 'forbidden',
    });
  });
});
