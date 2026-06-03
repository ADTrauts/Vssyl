import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(
  process.cwd(),
  'src/controllers/notebookWorkspaceContextController.ts'
);

describe('notebookWorkspaceContextController contract', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('delegates to notebookWorkspaceContextService', () => {
    expect(source).toMatch(/notebookWorkspaceContextService\.getWorkspaceContext/);
    expect(source).toMatch(/notebookWorkspaceContextService\.getWorkspaceInsights/);
  });

  it('has no direct Prisma usage', () => {
    expect(source).not.toMatch(/\bprisma\./);
  });

  it('maps TodoServiceError for dashboard scope', () => {
    expect(source).toMatch(/TodoServiceError/);
    expect(source).toMatch(/error\.status/);
  });
});
