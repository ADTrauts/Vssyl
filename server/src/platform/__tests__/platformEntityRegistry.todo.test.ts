import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  listPlatformEntitiesForModule,
  registerTodoPlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry todo', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers todo:task with TODO vlink type', () => {
    registerTodoPlatformEntities();

    const descriptor = getPlatformEntity('todo', 'task');
    expect(descriptor).toMatchObject({
      entityType: 'task',
      moduleId: 'todo',
      vlinkEntityType: 'TODO',
      supportsTrash: true,
      supportsSearch: true,
      activityTargetType: 'task',
    });
  });

  it('does not register deferred todo entity types', () => {
    registerTodoPlatformEntities();

    expect(listPlatformEntitiesForModule('todo')).toHaveLength(1);
    expect(getPlatformEntity('todo', 'comment')).toBeUndefined();
    expect(getPlatformEntity('todo', 'project')).toBeUndefined();
  });
});
