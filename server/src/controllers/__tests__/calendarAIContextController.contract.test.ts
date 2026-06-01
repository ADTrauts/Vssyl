import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/calendarAIContextController.ts');

describe('calendarAIContextController contract (Phase 1F)', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('has no prisma import or usage', () => {
    expect(source).not.toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
    expect(source).not.toMatch(/\bprisma\./);
  });

  it('delegates to calendarVisibilityService AI helpers', () => {
    expect(source).toMatch(/getUpcomingEventsForAI/);
    expect(source).toMatch(/getTodayScheduleForAI/);
    expect(source).toMatch(/getAvailabilityForAI/);
  });
});
