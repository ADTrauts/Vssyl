import { describe, it, expect, vi, afterEach } from 'vitest';
import { emitDomainEvent } from '../emitDomainEvent';
import { subscribeDomainEvents } from '../domainEventBus';
import { recordDomainEventToActivityLog } from '../subscribers/activityDomainEventSubscriber';
import { prisma } from '../../lib/prisma';

describe('emitDomainEvent', () => {
  it('assigns id and createdAt and publishes to bus subscribers', () => {
    const received: unknown[] = [];
    const unsub = subscribeDomainEvents((e) => {
      received.push(e);
    });

    const event = emitDomainEvent({
      type: 'test.event',
      actorUserId: 'user_1',
      dashboardId: 'dash_1',
      entityType: 'Thing',
      entityId: 't_1',
      action: 'create',
      metadata: { a: 1 },
    });

    expect(event.id).toMatch(/^evt_/);
    expect(typeof event.createdAt).toBe('string');
    expect(event.type).toBe('test.event');
    expect(event.metadata).toEqual({ a: 1 });
    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(event);
    unsub();
  });
});

describe('recordDomainEventToActivityLog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes prisma.log with operation domain_event_recorded', async () => {
    const create = vi.spyOn(prisma.log, 'create').mockResolvedValue({ id: 'log-1' } as never);

    await recordDomainEventToActivityLog({
      id: 'evt_test',
      type: 'user.preference.updated',
      actorUserId: 'user_1',
      entityType: 'UserPreference',
      entityId: 'theme',
      action: 'update',
      metadata: { key: 'theme' },
      createdAt: new Date().toISOString(),
    });

    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0][0] as {
      data: { operation: string; message: string; metadata: unknown };
    };
    expect(arg.data.operation).toBe('domain_event_recorded');
    expect(arg.data.message).toContain('user.preference.updated');
    expect(arg.data.metadata).toMatchObject({
      id: 'evt_test',
      type: 'user.preference.updated',
      actorUserId: 'user_1',
    });
  });

  it('sets module from metadata.moduleId when present', async () => {
    const create = vi.spyOn(prisma.log, 'create').mockResolvedValue({ id: 'log-2' } as never);

    await recordDomainEventToActivityLog({
      id: 'evt_m',
      type: 'drive.file.moved',
      actorUserId: 'user_1',
      entityType: 'File',
      entityId: 'f1',
      action: 'move',
      metadata: { moduleId: 'drive' },
      createdAt: new Date().toISOString(),
    });

    const arg = create.mock.calls[0][0] as { data: { module: string | null } };
    expect(arg.data.module).toBe('drive');
  });
});
