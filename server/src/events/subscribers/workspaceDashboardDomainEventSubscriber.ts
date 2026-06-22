import { DOMAIN_EVENT_TYPES } from '../domainEventRegistry';
import type { DomainEvent } from '../types';
import { seedBusinessWorkspaceResources } from '../../services/businessWorkspaceSeeder';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

/**
 * Workspace-owned seeding on business dashboard tab creation (K2-02).
 */
export async function workspaceDashboardTabCreatedConsumer(event: DomainEvent): Promise<void> {
  if (event.type !== DOMAIN_EVENT_TYPES.DASHBOARD_TAB_CREATED) {
    return;
  }

  const contextType = event.metadata?.contextType;
  if (contextType !== 'business' || !event.businessId || !event.dashboardId) {
    return;
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: event.businessId },
      select: { name: true },
    });

    await seedBusinessWorkspaceResources({
      userId: event.actorUserId,
      businessId: event.businessId,
      businessName: business?.name,
      dashboardId: event.dashboardId,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Workspace seed failed for business dashboard tab', {
      operation: 'workspace_dashboard_seed',
      error: { message: err.message, stack: err.stack },
      context: {
        dashboardId: event.dashboardId,
        businessId: event.businessId,
        userId: event.actorUserId,
      },
    });
  }
}
