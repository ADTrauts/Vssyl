import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/todoController.ts');

function extractCoreHandlersSection(source: string): string {
  const start = source.indexOf('/* <todo-core-handlers> */');
  const end = source.indexOf('/* </todo-core-handlers> */');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('todo-core-handlers markers missing from todoController.ts');
  }
  return source.slice(start, end);
}

describe('todoController contract (Phase 1E)', () => {
  const source = readFileSync(controllerPath, 'utf8');
  const core = extractCoreHandlersSection(source);

  it('core handlers delegate to canonical task and visibility services', () => {
    expect(core).toMatch(/todoVisibilityService\.listAccessibleTasks/);
    expect(core).toMatch(/todoVisibilityService\.getTaskByIdIfAccessible/);
    expect(core).toMatch(/todoTaskService\.createTask/);
    expect(core).toMatch(/todoTaskService\.updateTask/);
    expect(core).toMatch(/todoTaskService\.completeTask/);
    expect(core).toMatch(/todoTaskService\.reopenTask/);
    expect(core).toMatch(/todoTrashService\.softTrashTask/);
    expect(core).toMatch(/respondTodoServiceError/);
  });

  it('core handlers use orchestration helpers for deferred calendar/recurrence work', () => {
    expect(core).toMatch(/todoRecurrenceOrchestration\./);
    expect(core).toMatch(/ensureTaskCalendarEvent/);
    expect(core).toMatch(/mapTaskDetailAttachmentUrls/);
  });

  it('core handlers have no direct Prisma usage', () => {
    expect(core).not.toMatch(/\bprisma\./);
    expect(core).not.toMatch(/PrismaClient/);
  });

  it('core handlers have no direct side-effect or policy ownership', () => {
    expect(core).not.toMatch(/emitModuleActivityEvent/);
    expect(core).not.toMatch(/domainEventEmitters/);
    expect(core).not.toMatch(/emitTodoTask/);
    expect(core).not.toMatch(/NotificationService/);
    expect(core).not.toMatch(/createNotification/);
    expect(core).not.toMatch(/getChatSocketService/);
    expect(core).not.toMatch(/todoActivityService/);
    expect(core).not.toMatch(/todoDomainEventService/);
    expect(core).not.toMatch(/todoNotificationService/);
    expect(core).not.toMatch(/todoRealtimeService/);
    expect(core).not.toMatch(/evaluateModuleMutationPolicyDual/);
    expect(core).not.toMatch(/evaluateTodoPolicyDual/);
  });

  it('full controller uses Prisma only for AI/chat service instances', () => {
    expect(source).toMatch(/\bprisma\b/);
    const satelliteStart = source.indexOf('export async function createTaskComment');
    const aiStart = source.indexOf('// AI PRIORITIZATION ENDPOINTS');
    const satellite = source.slice(satelliteStart, aiStart);
    expect(satellite).not.toMatch(/\bprisma\./);
  });
});
