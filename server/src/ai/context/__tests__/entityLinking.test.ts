import { describe, expect, it } from 'vitest';
import { linkEntitiesAcrossModules } from '../entityLinking';

describe('entityLinking persistedVLinks', () => {
  it('prefers confirmed vlink relationships with higher confidence metadata', () => {
    const result = linkEntitiesAcrossModules({
      moduleContexts: {},
      persistedVLinks: [
        {
          vlinkId: 'vl-1',
          title: 'QBR Pack',
          publicCode: 'VL-483920174625',
          entityTypes: ['file', 'calendar_event'],
          linkKind: 'confirmed_vlink',
          confidence: 0.98,
        },
      ],
    });

    expect(result.links).toHaveLength(1);
    expect(result.links[0]?.type).toBe('confirmed_vlink_relationship');
    expect(result.links[0]?.linkKind).toBe('confirmed');
    expect(result.links[0]?.confidence).toBe(0.98);
    expect(result.links[0]?.entities).toContain('VL-483920174625');
  });

  it('includes inferred and confirmed links together', () => {
    const chatPayload = {
      data: {
        recentConversations: [
          {
            participants: [{ user: { id: 'u2', name: 'Alex Kim', email: 'alex@example.com' } }],
          },
        ],
      },
    };
    const calendarPayload = {
      data: {
        upcomingEvents: [
          {
            attendees: [{ email: 'alex@example.com', name: 'Alex Kim' }],
          },
        ],
      },
    };

    const result = linkEntitiesAcrossModules({
      moduleContexts: {
        chat: chatPayload,
        calendar: calendarPayload,
      },
      persistedVLinks: [
        {
          vlinkId: 'vl-2',
          title: 'Launch thread',
          publicCode: 'VL-111111111111',
          entityTypes: ['file'],
          linkKind: 'confirmed_vlink',
          confidence: 0.98,
        },
      ],
    });

    expect(result.links.some((l) => l.linkKind === 'inferred')).toBe(true);
    expect(result.links.some((l) => l.linkKind === 'confirmed')).toBe(true);
    const confirmed = result.links.find((l) => l.linkKind === 'confirmed');
    expect(confirmed?.confidence).toBeGreaterThan(0.9);
  });
});
