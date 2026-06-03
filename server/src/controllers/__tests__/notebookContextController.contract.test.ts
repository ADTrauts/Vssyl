import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/notebookContextController.ts');

describe('notebookContextController contract', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('delegates to notebookContextService', () => {
    expect(source).toMatch(/notebookContextService\.getPageContext/);
  });

  it('has no direct Prisma usage', () => {
    expect(source).not.toMatch(/\bprisma\./);
    expect(source).not.toMatch(/PrismaClient/);
  });

  it('maps NotesServiceError', () => {
    expect(source).toMatch(/NotesServiceError/);
  });
});
