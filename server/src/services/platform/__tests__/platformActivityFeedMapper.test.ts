import { describe, expect, it } from 'vitest';
import {
  analyticsDescriptionFromRecord,
  feedDescriptionFromRecord,
  toActivityFeedItem,
} from '../platformActivityFeedMapper';
import type { PlatformActivityRecord } from '../platformActivityTypes';

const baseRecord: PlatformActivityRecord = {
  logId: 'log-1',
  eventId: 'evt-1',
  timestamp: new Date('2026-06-22T12:00:00.000Z'),
  moduleId: 'drive',
  action: 'create',
  targetType: 'file',
  targetId: 'f-1',
  metadata: { fileName: 'budget.xlsx' },
  actorUserId: 'u1',
};

describe('platformActivityFeedMapper', () => {
  it('builds feed description from metadata', () => {
    expect(feedDescriptionFromRecord(baseRecord)).toContain('budget.xlsx');
  });

  it('maps to ActivityFeedItem with normalized source metadata', () => {
    const item = toActivityFeedItem(baseRecord, { name: 'Alex', email: 'a@test.com' });
    expect(item).toMatchObject({
      id: 'evt-1',
      module: 'drive',
      action: 'create',
      user: { name: 'Alex', email: 'a@test.com' },
      metadata: expect.objectContaining({ source: 'normalized_event', targetId: 'f-1' }),
    });
  });

  it('builds analytics description for chat messages', () => {
    const record: PlatformActivityRecord = {
      ...baseRecord,
      moduleId: 'chat',
      action: 'message',
      targetType: 'message',
      metadata: { conversationName: 'Team' },
    };
    expect(analyticsDescriptionFromRecord(record)).toContain('Team');
  });
});
