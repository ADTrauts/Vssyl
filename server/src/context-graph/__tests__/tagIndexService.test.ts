import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupTagsByLabel, lookupTagsByEntity } from '../tagIndexService.js';

vi.mock('../tagProviderRegistry.js', () => ({
  listTagProviders: vi.fn(() => [
    {
      moduleId: 'todo',
      supportedEntityTypes: ['task'],
      getTagsForEntity: vi.fn(),
      searchByTagLabel: vi.fn(async () => [
        {
          tagId: 'todo:task:t1:urgent',
          tagLabel: 'urgent',
          sourceModule: 'todo',
          sourceEntityType: 'task',
          sourceEntityId: 't1',
        },
      ]),
    },
  ]),
  getTagProviderForEntity: vi.fn(() => ({
    moduleId: 'todo',
    supportedEntityTypes: ['task'],
    getTagsForEntity: vi.fn(async () => [
      {
        tagId: 'todo:task:t1:urgent',
        tagLabel: 'urgent',
        sourceModule: 'todo',
        sourceEntityType: 'task',
        sourceEntityId: 't1',
      },
    ]),
    searchByTagLabel: vi.fn(),
  })),
  getTagProviderByModule: vi.fn(),
}));

describe('tagIndexService (CG-2A)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lookupTagsByLabel aggregates provider results', async () => {
    const result = await lookupTagsByLabel('u1', 'urgent', { dashboardId: 'd1' });
    expect(result.tagLabel).toBe('urgent');
    expect(result.descriptors).toHaveLength(1);
    expect(result.modulesQueried).toContain('todo');
  });

  it('lookupTagsByEntity delegates to tag provider', async () => {
    const result = await lookupTagsByEntity('u1', {
      moduleId: 'todo',
      entityType: 'task',
      entityId: 't1',
    });
    expect(result.descriptors).toHaveLength(1);
    expect(result.entity.entityId).toBe('t1');
  });
});
