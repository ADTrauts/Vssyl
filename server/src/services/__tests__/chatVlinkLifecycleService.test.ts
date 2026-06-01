import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as vlinkEvents from '../../events/vlinkDomainEventEmitters';
import { unlinkChatConversationFromAllVLinks } from '../chatVlinkLifecycleService';

describe('chatVlinkLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(vlinkEvents, 'emitVLinkEntityUnlinkedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  it('soft-unlinks all V_Link rows on permanent conversation delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.CHAT_CONVERSATION,
        entityId: 'conv-1',
        vlink: { dashboardId: null, businessId: null, householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkChatConversationFromAllVLinks({
      actorUserId: 'user-1',
      conversationId: 'conv-1',
    });

    expect(count).toBe(1);
    expect(prisma.vLinkEntity.updateMany).toHaveBeenCalled();
    expect(vlinkEvents.emitVLinkEntityUnlinkedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: VLinkEntityType.CHAT_CONVERSATION,
        entityId: 'conv-1',
      })
    );
  });

  it('returns zero when no links exist', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([] as never);
    const count = await unlinkChatConversationFromAllVLinks({
      actorUserId: 'user-1',
      conversationId: 'conv-1',
    });
    expect(count).toBe(0);
  });
});
