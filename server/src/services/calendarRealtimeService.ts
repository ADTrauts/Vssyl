import { getChatSocketService } from './chatSocketService';
import { logger } from '../lib/logger';

export type CalendarRealtimeAction = 'created' | 'updated' | 'deleted';

export type CalendarRealtimePayload = {
  type: 'event';
  action: CalendarRealtimeAction;
  event: Record<string, unknown>;
};

/** Transport-only fan-out for calendar_event socket channel. */
export function broadcastCalendarEventToUsers(
  userIds: string[],
  payload: CalendarRealtimePayload
): void {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueUserIds.length === 0) return;

  try {
    const socket = getChatSocketService();
    for (const userId of uniqueUserIds) {
      socket.broadcastToUser(userId, 'calendar_event', payload);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to broadcast calendar realtime event', {
      operation: 'calendar_realtime_broadcast',
      action: payload.action,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export function broadcastCalendarEventCreated(
  memberUserIds: string[],
  event: Record<string, unknown>
): void {
  broadcastCalendarEventToUsers(memberUserIds, {
    type: 'event',
    action: 'created',
    event,
  });
}

export function broadcastCalendarEventUpdated(
  memberUserIds: string[],
  event: Record<string, unknown>
): void {
  broadcastCalendarEventToUsers(memberUserIds, {
    type: 'event',
    action: 'updated',
    event,
  });
}

export function broadcastCalendarEventDeleted(
  memberUserIds: string[],
  eventId: string
): void {
  broadcastCalendarEventToUsers(memberUserIds, {
    type: 'event',
    action: 'deleted',
    event: { id: eventId },
  });
}
