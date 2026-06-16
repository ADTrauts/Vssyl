/**
 * Workforce Communications notification type definitions.
 * Live types match workforceNotificationService emission.
 */

export interface WorkforceCommsNotificationTypeDefinition {
  type: string;
  category: string;
  requiresAction: boolean;
  planned?: boolean;
}

export const WORKFORCE_COMMS_NOTIFICATION_TYPES: readonly WorkforceCommsNotificationTypeDefinition[] = [
  {
    type: 'workforce_communication_published',
    category: 'workforce_comms',
    requiresAction: false,
    planned: false,
  },
  {
    type: 'workforce_ack_required',
    category: 'workforce_comms',
    requiresAction: true,
    planned: false,
  },
  {
    type: 'workforce_ack_reminder',
    category: 'workforce_comms',
    requiresAction: true,
    planned: true,
  },
  {
    type: 'workforce_campaign_completed',
    category: 'workforce_comms',
    requiresAction: false,
    planned: false,
  },
] as const;

export const WORKFORCE_COMMS_NOTIFICATION_TYPE_NAMES = WORKFORCE_COMMS_NOTIFICATION_TYPES.map(
  (entry) => entry.type
);

export const WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES = WORKFORCE_COMMS_NOTIFICATION_TYPES.filter(
  (entry) => entry.planned !== true
).map((entry) => entry.type);
