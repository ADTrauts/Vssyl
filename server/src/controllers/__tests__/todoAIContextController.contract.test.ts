import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/todoAIContextController.ts');

describe('todoAIContextController contract (Phase 1F)', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('has no prisma import or usage', () => {
    expect(source).not.toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
    expect(source).not.toMatch(/\bprisma\./);
  });

  it('delegates to todoVisibilityService AI helpers', () => {
    expect(source).toMatch(/getOverviewStatsForAI/);
    expect(source).toMatch(/getUpcomingTasksForAI/);
    expect(source).toMatch(/getOverdueTasksForAI/);
    expect(source).toMatch(/getHighPriorityTasksForAI/);
    expect(source).toMatch(/getPriorityAnalysisTasksForAI/);
  });
});
