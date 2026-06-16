import { describe, expect, it } from 'vitest';
import { NotificationGroupingService } from '../notificationGroupingService';

type GroupingServiceInternals = {
  getGroupingRule: (type: string) => { type: string } | null;
  getGroupKey: (notification: {
    id: string;
    type: string;
    title: string;
    read: boolean;
    createdAt: Date;
    data?: Record<string, unknown>;
  }) => string;
};

function getInternals(): GroupingServiceInternals {
  return NotificationGroupingService.getInstance() as unknown as GroupingServiceInternals;
}

describe('notificationGroupingService hr + scheduling (CO-02)', () => {
  const internals = getInternals();

  it('maps scheduling types to scheduling grouping rule', () => {
    expect(internals.getGroupingRule('scheduling_schedule_published')?.type).toBe('scheduling');
    expect(internals.getGroupingRule('scheduling_swap_approved')?.type).toBe('scheduling');
  });

  it('maps hr attendance and time-off types to hr grouping rule', () => {
    expect(internals.getGroupingRule('hr_attendance_missing_punch')?.type).toBe('hr');
    expect(internals.getGroupingRule('hr_time_off_request_submitted')?.type).toBe('hr');
    expect(internals.getGroupingRule('hr_onboarding_assigned')?.type).toBe('hr');
  });

  it('groups swap notifications by shift id', () => {
    const key = internals.getGroupKey({
      id: 'n1',
      type: 'scheduling_swap_requested',
      title: 'Swap requested',
      read: false,
      createdAt: new Date(),
      data: { shiftId: 'shift-1' },
    });
    expect(key).toBe('scheduling_swap_shift-1');
  });

  it('groups publish notifications by schedule id', () => {
    const key = internals.getGroupKey({
      id: 'n2',
      type: 'scheduling_schedule_published',
      title: 'Published',
      read: false,
      createdAt: new Date(),
      data: { scheduleId: 'sched-1' },
    });
    expect(key).toBe('scheduling_publish_sched-1');
  });
});
