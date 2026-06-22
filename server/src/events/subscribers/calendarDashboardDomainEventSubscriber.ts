import { DOMAIN_EVENT_TYPES } from '../domainEventRegistry';
import type { DomainEvent } from '../types';
import { ensurePersonalPrimaryCalendarForUser } from '../../services/calendar/calendarDashboardBootstrapService';

export async function calendarDashboardTabCreatedConsumer(event: DomainEvent): Promise<void> {
  if (event.type !== DOMAIN_EVENT_TYPES.DASHBOARD_TAB_CREATED) {
    return;
  }

  const contextType = event.metadata?.contextType;
  if (contextType !== 'personal') {
    return;
  }

  const name = typeof event.metadata?.name === 'string' ? event.metadata.name : 'My Dashboard';

  await ensurePersonalPrimaryCalendarForUser({
    actorUserId: event.actorUserId,
    dashboardName: name,
  });
}
