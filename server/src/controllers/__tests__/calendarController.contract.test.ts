import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('calendarController side-effect contract', () => {
  const source = readFileSync(
    resolve(__dirname, '../calendarController.ts'),
    'utf8'
  );

  it('does not import audit, domain emitters, or email services directly', () => {
    expect(source).not.toMatch(/AuditService/);
    expect(source).not.toMatch(/emitCalendarEventCreatedEvent/);
    expect(source).not.toMatch(/sendCalendarInviteEmail/);
    expect(source).not.toMatch(/NotificationService/);
  });

  it('does not broadcast calendar events inline except ICS import adapter', () => {
    const withoutIcs = source.replace(/export async function importIcsEvents[\s\S]*^}/m, '');
    expect(withoutIcs).not.toMatch(/getChatSocketService/);
    expect(withoutIcs).not.toMatch(/broadcastToUser/);
  });
});
