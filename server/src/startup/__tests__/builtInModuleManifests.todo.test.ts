import { describe, expect, it } from 'vitest';
import { buildBuiltInModuleManifest } from '../builtInModuleManifests';

describe('builtInModuleManifests todo (Wave 2 Phase 2)', () => {
  it('declares only implemented todo task entity and runtime capabilities', () => {
    const manifest = buildBuiltInModuleManifest('todo');
    expect(manifest.capabilities?.vlink).toBe(true);
    expect(manifest.capabilities?.trash).toBe(true);
    expect(manifest.capabilities?.search).toBe(true);
    expect(manifest.capabilities?.realtime).toBe(true);
    expect(manifest.capabilities?.globalActivity).toBe(true);
    expect(manifest.entities).toHaveLength(1);
    expect(manifest.entities?.[0]).toMatchObject({
      type: 'task',
      vlinkEntityType: 'TODO',
      supportsTrash: true,
      supportsSearch: true,
    });
  });

  it('includes todo_assigned notification metadata only for emitted type', () => {
    const manifest = buildBuiltInModuleManifest('todo');
    expect(manifest.notifications).toHaveLength(1);
    expect(manifest.notifications?.[0]?.type).toBe('todo_assigned');
    expect(manifest.notifications?.some((n) => n.type === 'todo_due')).toBe(false);
    expect(manifest.notifications?.some((n) => n.type === 'todo_completed')).toBe(false);
  });
});
