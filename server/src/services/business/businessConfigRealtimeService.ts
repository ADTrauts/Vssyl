import { getChatSocketService } from '../chatSocketService';
import { logger } from '../../lib/logger';

export type BusinessConfigChangeType =
  | 'business_created'
  | 'business_updated'
  | 'branding_updated'
  | 'configuration_updated'
  | 'member_invited'
  | 'member_joined'
  | 'member_updated'
  | 'member_removed'
  | 'org_structure_updated';

/**
 * Broadcast business configuration changes to clients in business_{businessId} room.
 * Safe no-op when socket service is not initialized (tests, batch jobs).
 */
export function broadcastBusinessConfigUpdated(params: {
  businessId: string;
  changeType: BusinessConfigChangeType;
  actorUserId?: string;
  metadata?: Record<string, unknown>;
}): void {
  try {
    const payload = {
      businessId: params.businessId,
      changeType: params.changeType,
      actorUserId: params.actorUserId,
      timestamp: new Date().toISOString(),
      ...(params.metadata ?? {}),
    };
    getChatSocketService().broadcastBusinessConfigUpdated(params.businessId, payload);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('business:config:updated broadcast skipped', {
      operation: 'broadcast_business_config_updated',
      error: { message: err.message, stack: err.stack },
      context: { businessId: params.businessId, changeType: params.changeType },
    });
  }
}
