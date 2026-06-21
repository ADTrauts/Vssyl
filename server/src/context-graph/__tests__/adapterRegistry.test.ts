import { describe, expect, it } from 'vitest';
import {
  getAdapterByModuleId,
  getAdapterForEntity,
  listRegisteredAdapters,
  listSupportedEntityTypes,
} from '../adapterRegistry.js';

describe('context graph adapter registry (CG-1B)', () => {
  it('registers eight adapters after P1 expansion', () => {
    expect(listRegisteredAdapters()).toHaveLength(8);
  });

  it('resolves notes note adapter', () => {
    expect(getAdapterForEntity('notes', 'note')?.moduleId).toBe('notes');
  });

  it('resolves notebook entity types', () => {
    expect(getAdapterForEntity('notebook', 'notebook_page')?.moduleId).toBe('notebook');
    expect(getAdapterForEntity('notebook', 'notebook')?.moduleId).toBe('notebook');
  });

  it('resolves chat conversation adapter', () => {
    expect(getAdapterForEntity('chat', 'conversation')?.moduleId).toBe('chat');
  });

  it('resolves place entity types', () => {
    expect(getAdapterForEntity('place', 'place_list')?.moduleId).toBe('place');
    expect(getAdapterForEntity('place', 'place')?.moduleId).toBe('place');
  });

  it('lists eleven supported entity types', () => {
    const types = listSupportedEntityTypes();
    expect(types).toHaveLength(11);
    expect(types).toEqual(
      expect.arrayContaining([
        { moduleId: 'vlink', entityType: 'container' },
        { moduleId: 'drive', entityType: 'file' },
        { moduleId: 'drive', entityType: 'folder' },
        { moduleId: 'calendar', entityType: 'event' },
        { moduleId: 'todo', entityType: 'task' },
        { moduleId: 'notes', entityType: 'note' },
        { moduleId: 'notebook', entityType: 'notebook' },
        { moduleId: 'notebook', entityType: 'notebook_page' },
        { moduleId: 'chat', entityType: 'conversation' },
        { moduleId: 'place', entityType: 'place' },
        { moduleId: 'place', entityType: 'place_list' },
      ])
    );
  });

  it('gets adapter by module id for notes', () => {
    expect(getAdapterByModuleId('notes')?.supportedEntityTypes).toContain('note');
  });
});
