import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as emitters from '../../events/domainEventEmitters';
import {
  recordDashboardTabCreatedDomainEvent,
  recordDashboardTabDeletedDomainEvent,
  recordDashboardWidgetAddedDomainEvent,
  recordDashboardWidgetRemovedDomainEvent,
  resolveDashboardContextType,
} from '../dashboardDomainEventService';

describe('dashboardDomainEventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(emitters, 'emitDashboardTabCreatedEvent').mockReturnValue({ id: 'e1' } as never);
    vi.spyOn(emitters, 'emitDashboardTabDeletedEvent').mockReturnValue({ id: 'e2' } as never);
    vi.spyOn(emitters, 'emitDashboardWidgetAddedEvent').mockReturnValue({ id: 'e3' } as never);
    vi.spyOn(emitters, 'emitDashboardWidgetRemovedEvent').mockReturnValue({ id: 'e4' } as never);
  });

  it('resolveDashboardContextType returns personal for bare dashboard', () => {
    expect(resolveDashboardContextType({})).toBe('personal');
  });

  it('recordDashboardTabCreatedDomainEvent emits registered type', () => {
    recordDashboardTabCreatedDomainEvent({
      actorUserId: 'u1',
      dashboard: {
        id: 'd1',
        name: 'Tab',
        businessId: null,
        householdId: null,
        institutionId: null,
      },
    });

    expect(emitters.emitDashboardTabCreatedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        dashboardId: 'd1',
        contextType: 'personal',
      })
    );
  });

  it('recordDashboardTabDeletedDomainEvent emits hard delete metadata', () => {
    recordDashboardTabDeletedDomainEvent({
      actorUserId: 'u1',
      dashboard: { id: 'd1', businessId: null, householdId: null },
      hardDelete: true,
      fileAction: 'move-to-main',
    });

    expect(emitters.emitDashboardTabDeletedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        dashboardId: 'd1',
        fileAction: 'move-to-main',
      })
    );
  });

  it('recordDashboardWidgetAddedDomainEvent emits widget metadata', () => {
    recordDashboardWidgetAddedDomainEvent({
      actorUserId: 'u1',
      widget: { id: 'w1', type: 'chat', dashboardId: 'd1' },
      dashboard: { businessId: null, householdId: null },
    });

    expect(emitters.emitDashboardWidgetAddedEvent).toHaveBeenCalledWith(
      expect.objectContaining({ widgetType: 'chat', widgetId: 'w1' })
    );
  });

  it('recordDashboardWidgetRemovedDomainEvent emits widget metadata', () => {
    recordDashboardWidgetRemovedDomainEvent({
      actorUserId: 'u1',
      widget: { id: 'w1', type: 'todo', dashboardId: 'd1' },
      dashboard: { businessId: 'b1', householdId: null },
    });

    expect(emitters.emitDashboardWidgetRemovedEvent).toHaveBeenCalledWith(
      expect.objectContaining({ widgetType: 'todo', businessId: 'b1' })
    );
  });
});
