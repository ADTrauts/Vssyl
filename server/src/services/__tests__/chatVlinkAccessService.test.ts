import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as chatPolicyDual from '../../auth/chatPolicyDual';
import {
  resolveChatConversationForVLink,
  userCanLinkChatConversation,
} from '../chatVlinkAccessService';

describe('chatVlinkAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(chatPolicyDual, 'evaluateChatPolicyDual').mockResolvedValue({ blocked: false });
  });

  it('allows active participant with policy pass', async () => {
    vi.spyOn(prisma.conversation, 'findUnique').mockResolvedValue({
      id: 'conv-1',
      name: 'Team chat',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.conversationParticipant, 'findFirst').mockResolvedValue({ id: 'p1' } as never);

    const result = await resolveChatConversationForVLink('user-1', 'conv-1');

    expect(result).toEqual({
      allowed: true,
      state: 'active',
      title: 'Team chat',
      url: '/chat?conversation=conv-1',
    });
    expect(await userCanLinkChatConversation('user-1', 'conv-1')).toBe(true);
  });

  it('denies non-member even when conversation exists (V_Link membership not consulted)', async () => {
    vi.spyOn(prisma.conversation, 'findUnique').mockResolvedValue({
      id: 'conv-1',
      name: 'Private',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.conversationParticipant, 'findFirst').mockResolvedValue(null);

    const result = await resolveChatConversationForVLink('outsider-1', 'conv-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
    expect(result.title).toBe('Private');
    expect(result.url).toBeUndefined();
  });

  it('denies trashed conversation', async () => {
    vi.spyOn(prisma.conversation, 'findUnique').mockResolvedValue({
      id: 'conv-1',
      name: 'Archived',
      trashedAt: new Date(),
    } as never);

    const result = await resolveChatConversationForVLink('user-1', 'conv-1');

    expect(result).toMatchObject({
      allowed: false,
      state: 'trashed',
      title: 'Archived',
    });
  });

  it('fails closed for permanently deleted conversation', async () => {
    vi.spyOn(prisma.conversation, 'findUnique').mockResolvedValue(null);

    const result = await resolveChatConversationForVLink('user-1', 'conv-gone');

    expect(result).toEqual({ allowed: false, state: 'deleted' });
  });

  it('denies when policy dual blocks read', async () => {
    vi.spyOn(prisma.conversation, 'findUnique').mockResolvedValue({
      id: 'conv-1',
      name: 'Team',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.conversationParticipant, 'findFirst').mockResolvedValue({ id: 'p1' } as never);
    vi.spyOn(chatPolicyDual, 'evaluateChatPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'NOT_MEMBER',
    });

    const result = await resolveChatConversationForVLink('user-1', 'conv-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
  });
});
