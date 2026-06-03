import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const servicePath = join(process.cwd(), 'src/services/notebook/notebookAIActionService.ts');

describe('notebookAIActionService contract', () => {
  const source = readFileSync(servicePath, 'utf8');

  it('uses notebookAIContextService for grounding', () => {
    expect(source).toMatch(/loadGroundedAIContext/);
    expect(source).toMatch(/notebookAIContextService/);
  });

  it('delegates task writes to todoAIActionService', () => {
    expect(source).toMatch(/aiCreateTask/);
    expect(source).not.toMatch(/todoTaskService\.createTask/);
  });

  it('delegates links to notebookLinkService', () => {
    expect(source).toMatch(/notebookLinkService\.createPageLink/);
  });

  it('has no direct Prisma usage', () => {
    expect(source).not.toMatch(/\bprisma\./);
  });
});
