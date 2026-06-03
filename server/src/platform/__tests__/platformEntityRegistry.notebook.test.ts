import { beforeEach, describe, expect, it } from 'vitest';
import {
  NOTEBOOK_PAGE_ENTITY_TYPE,
  clearPlatformEntityRegistryForTests,
  getPlatformEntity,
  registerNotebookPlatformEntities,
  registerNotesPlatformEntities,
} from '../platformEntityRegistry';

describe('platformEntityRegistry notebook (Phase 7+)', () => {
  beforeEach(() => {
    clearPlatformEntityRegistryForTests();
  });

  it('registers notebook:page product entity with NOTE vlink alias', () => {
    registerNotebookPlatformEntities();
    const page = getPlatformEntity('notebook', 'page');
    expect(page).toBeDefined();
    expect(page?.moduleId).toBe('notebook');
    expect(page?.displayName).toBe('Page');
    expect(page?.supportsTrash).toBe(true);
    expect(page?.supportsSearch).toBe(true);
    expect(page?.vlinkEntityType).toBe('NOTE');
    expect(page?.activityTargetType).toBe('page');
    expect(NOTEBOOK_PAGE_ENTITY_TYPE).toBe('NOTEBOOK_PAGE');
  });

  it('coexists with notes:page storage entity without duplicating ownership', () => {
    registerNotesPlatformEntities();
    registerNotebookPlatformEntities();
    const notesPage = getPlatformEntity('notes', 'page');
    const notebookPage = getPlatformEntity('notebook', 'page');
    expect(notesPage?.moduleId).toBe('notes');
    expect(notebookPage?.moduleId).toBe('notebook');
    expect(notesPage?.vlinkEntityType).toBe('NOTE');
    expect(notebookPage?.vlinkEntityType).toBe('NOTE');
  });
});
