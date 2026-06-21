import { describe, expect, it } from 'vitest';
import {
  buildTagId,
  normalizeTagLabel,
  parseTagStrings,
  tagDescriptorFromEntity,
} from '../tagDescriptorTypes.js';

describe('tagDescriptorTypes (CG-2A)', () => {
  it('buildTagId is deterministic per entity and label', () => {
    const id = buildTagId('todo', 'task', 't1', 'Urgent');
    expect(id).toBe('todo:task:t1:urgent');
    expect(buildTagId('todo', 'task', 't1', 'urgent')).toBe(id);
  });

  it('parseTagStrings normalizes and caps tags', () => {
    expect(parseTagStrings([' Tax ', '2024', '', 123])).toEqual(['tax', '2024']);
  });

  it('tagDescriptorFromEntity includes required fields', () => {
    const descriptor = tagDescriptorFromEntity(
      { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
      'project-x'
    );
    expect(descriptor).toMatchObject({
      tagLabel: 'project-x',
      sourceModule: 'notes',
      sourceEntityType: 'note',
      sourceEntityId: 'n1',
    });
    expect(descriptor.tagId).toContain('notes:note:n1:project-x');
  });

  it('normalizeTagLabel lowercases', () => {
    expect(normalizeTagLabel('  QBR  ')).toBe('qbr');
  });
});
