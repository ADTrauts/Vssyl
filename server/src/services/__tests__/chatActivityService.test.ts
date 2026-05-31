import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import { recordMessageSent, recordReaction, recordRead } from '../chatActivityService';

describe('chatActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
  });

  it('recordMessageSent emits normalized activity', async () => {
    await recordMessageSent({
      actorUserId: 'u1',
      messageId: 'm1',
      conversationId: 'c1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'chat',
        action: 'message',
        targetId: 'm1',
      })
    );
  });

  it('recordReaction maps added to react', async () => {
    await recordReaction({
      actorUserId: 'u1',
      messageId: 'm1',
      conversationId: 'c1',
      emoji: '👍',
      action: 'added',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'react' })
    );
  });

  it('recordRead emits read action', async () => {
    await recordRead({
      actorUserId: 'u1',
      messageId: 'm1',
      conversationId: 'c1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'read' })
    );
  });
});
