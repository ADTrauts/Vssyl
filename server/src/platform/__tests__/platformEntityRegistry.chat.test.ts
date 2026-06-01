import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  listPlatformEntitiesForModule,
  registerChatPlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry chat entities (Wave 1 Phase 4)', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers conversation descriptor for chat module', () => {
    registerChatPlatformEntities();

    const conversation = getPlatformEntity('chat', 'conversation');
    expect(conversation).toMatchObject({
      moduleId: 'chat',
      entityType: 'conversation',
      vlinkEntityType: 'CHAT_CONVERSATION',
      supportsTrash: true,
      supportsSearch: true,
      activityTargetType: 'conversation',
    });
    expect(listPlatformEntitiesForModule('chat')).toHaveLength(1);
    expect(getPlatformEntity('chat', 'message')).toBeUndefined();
  });
});
