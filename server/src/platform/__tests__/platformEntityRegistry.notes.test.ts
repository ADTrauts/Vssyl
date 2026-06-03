import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  registerNotesPlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry notes', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers page entity with trash and NOTE vlink type', () => {
    registerNotesPlatformEntities();
    const page = getPlatformEntity('notes', 'page');
    expect(page?.displayName).toBe('Page');
    expect(page?.supportsTrash).toBe(true);
    expect(page?.vlinkEntityType).toBe('NOTE');
    expect(page?.activityTargetType).toBe('page');
  });
});
