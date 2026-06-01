import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/calendarController.ts');

describe('calendarController contract (Phase 1E)', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('has no prisma import or usage', () => {
    expect(source).not.toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
    expect(source).not.toMatch(/\bprisma\./);
    expect(source).not.toMatch(/PrismaClient/);
  });

  it('has no direct notification, activity, email, socket, or domain side effects', () => {
    expect(source).not.toMatch(/NotificationService/);
    expect(source).not.toMatch(/emitModuleActivityEvent/);
    expect(source).not.toMatch(/AuditService/);
    expect(source).not.toMatch(/getChatSocketService/);
    expect(source).not.toMatch(/sendCalendarInviteEmail/);
    expect(source).not.toMatch(/sendCalendarUpdateEmail/);
    expect(source).not.toMatch(/sendCalendarCancelEmail/);
    expect(source).not.toMatch(/emitCalendar/);
    expect(source).not.toMatch(/domainEventEmitters/);
    expect(source).not.toMatch(/calendarActivityService/);
    expect(source).not.toMatch(/calendarNotificationService/);
    expect(source).not.toMatch(/calendarRealtimeService/);
    expect(source).not.toMatch(/calendarDomainEventService/);
    expect(source).not.toMatch(/dispatchDueReminders/);
    expect(source).not.toMatch(/rrulestr/);
  });

  it('delegates ICS to calendarIcsService', () => {
    expect(source).toMatch(/calendarIcsService\.importIcsEvents/);
    expect(source).toMatch(/calendarIcsService\.exportIcsEvents/);
  });
});
