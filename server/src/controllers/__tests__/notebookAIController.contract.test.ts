import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/notebookAIController.ts');

describe('notebookAIController contract', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('delegates to notebookAIActionService', () => {
    expect(source).toMatch(/notebookAIActionService\.summarizePage/);
    expect(source).toMatch(/notebookAIActionService\.extractActionItems/);
    expect(source).toMatch(/notebookAIActionService\.confirmExtractedActionItems/);
    expect(source).toMatch(/notebookAIActionService\.generateMeetingRecap/);
    expect(source).toMatch(/notebookAIActionService\.suggestLinks/);
  });

  it('has no direct Prisma usage', () => {
    expect(source).not.toMatch(/\bprisma\./);
    expect(source).not.toMatch(/PrismaClient/);
  });

  it('maps service errors', () => {
    expect(source).toMatch(/NotebookAIServiceError/);
    expect(source).toMatch(/NotesServiceError/);
  });
});
