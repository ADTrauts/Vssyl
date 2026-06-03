import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

function readController(name: string): string {
  return readFileSync(join(ROOT, name), 'utf8');
}

describe('notesController contract (Phase 2)', () => {
  it('notesController has no direct prisma usage', () => {
    const src = readController('notesController.ts');
    expect(src).not.toMatch(/\bprisma\b/);
    expect(src).toContain('notesVisibility');
    expect(src).toContain('notesPage');
    expect(src).toContain('notesTrash');
  });

  it('notesShareController delegates to notesShareService', () => {
    const src = readController('notesShareController.ts');
    expect(src).not.toMatch(/\bprisma\b/);
    expect(src).toContain('notesShare');
  });

  it('notesAIContextController uses visibility service', () => {
    const src = readController('notesAIContextController.ts');
    expect(src).not.toMatch(/\bprisma\b/);
    expect(src).not.toContain('deletedAt');
    expect(src).toContain('notesVisibility');
  });
});
