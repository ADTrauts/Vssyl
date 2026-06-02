import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/todoController.ts');
const source = readFileSync(controllerPath, 'utf8');

function extractSatelliteSection(): string {
  const start = source.indexOf('export async function createEventFromTask');
  const end = source.indexOf('// AI PRIORITIZATION ENDPOINTS');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('satellite section markers missing');
  }
  return source.slice(start, end);
}

describe('todoController satellite contract (Phase 1G)', () => {
  const satellite = extractSatelliteSection();

  it('delegates to satellite services', () => {
    expect(satellite).toMatch(/todoCommentService\./);
    expect(satellite).toMatch(/todoSubtaskService\./);
    expect(satellite).toMatch(/todoAttachmentService\./);
    expect(satellite).toMatch(/todoProjectService\./);
    expect(satellite).toMatch(/todoDependencyService\./);
    expect(satellite).toMatch(/todoTimeLogService\./);
    expect(satellite).toMatch(/todoIntegrationLinkService\./);
    expect(satellite).toMatch(/todoRecurrenceOrchestration\.generateRecurringInstancesForTask/);
  });

  it('satellite handlers have no direct Prisma usage', () => {
    expect(satellite).not.toMatch(/\bprisma\./);
  });

  it('satellite handlers use respondTodoServiceError', () => {
    expect(satellite).toMatch(/respondTodoServiceError/);
  });
});
