import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import * as chatVlinkAccess from '../chatVlinkAccessService';
import { resolveEntityAccess, userCanLinkEntity } from '../vlinkEntityResolverService';

describe('vlinkEntityResolverService chat compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates CHAT_CONVERSATION resolution to chatVlinkAccessService', async () => {
    const spy = vi.spyOn(chatVlinkAccess, 'resolveChatConversationForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Standup',
      url: '/chat?conversation=conv-1',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.CHAT_CONVERSATION,
      'conv-1'
    );

    expect(spy).toHaveBeenCalledWith('user-1', 'conv-1');
    expect(result).toEqual({
      access: 'full',
      title: 'Standup',
      url: '/chat?conversation=conv-1',
    });
  });

  it('returns restricted when chat access denied (non-participant / trashed / deleted)', async () => {
    vi.spyOn(chatVlinkAccess, 'resolveChatConversationForVLink').mockResolvedValue({
      allowed: false,
      state: 'trashed',
      title: 'Old thread',
    });

    const result = await resolveEntityAccess(
      'vlink-member-only',
      VLinkEntityType.CHAT_CONVERSATION,
      'conv-1'
    );

    expect(result.access).toBe('restricted');
    expect(result.title).toBe('Old thread');
    expect(result.url).toBeUndefined();
  });

  it('userCanLinkEntity for CHAT_CONVERSATION uses chat link permission helper', async () => {
    vi.spyOn(chatVlinkAccess, 'userCanLinkChatConversation').mockResolvedValue(false);

    await expect(
      userCanLinkEntity('outsider', VLinkEntityType.CHAT_CONVERSATION, 'conv-1')
    ).resolves.toBe(false);
  });
});
