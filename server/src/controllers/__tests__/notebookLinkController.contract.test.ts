import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/notebookLinkController.ts');

describe('notebookLinkController contract', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('delegates to notebookLinkService', () => {
    expect(source).toMatch(/notebookLinkService\.listPageLinks/);
    expect(source).toMatch(/notebookLinkService\.listEntityLinks/);
    expect(source).toMatch(/notebookLinkService\.createPageLink/);
    expect(source).toMatch(/notebookLinkService\.archiveNotebookLink/);
  });

  it('has no direct Prisma usage', () => {
    expect(source).not.toMatch(/\bprisma\./);
    expect(source).not.toMatch(/PrismaClient/);
  });

  it('maps NotebookLinkServiceError', () => {
    expect(source).toMatch(/NotebookLinkServiceError/);
  });

  it('maps NotesServiceError from page permission checks', () => {
    expect(source).toMatch(/NotesServiceError/);
  });
});
