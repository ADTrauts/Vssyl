/**
 * Workforce Communications module activity action definitions (Phase A — taxonomy only).
 * Emission wiring is Phase D via workforceActivityService.
 */

export const WORKFORCE_COMMS_MODULE_ID = 'workforce_comms' as const;

export interface WorkforceCommsActivityActionDefinition {
  action: string;
  targetType: string;
  description: string;
}

export const WORKFORCE_COMMS_ACTIVITY_ACTIONS: readonly WorkforceCommsActivityActionDefinition[] = [
  {
    action: 'workforce_communication_created',
    targetType: 'communication',
    description: 'Draft communication created',
  },
  {
    action: 'workforce_communication_updated',
    targetType: 'communication',
    description: 'Draft communication updated',
  },
  {
    action: 'workforce_communication_scheduled',
    targetType: 'communication',
    description: 'Communication scheduled for future publish',
  },
  {
    action: 'workforce_communication_published',
    targetType: 'communication',
    description: 'Communication published to resolved audience',
  },
  {
    action: 'workforce_communication_cancelled',
    targetType: 'communication',
    description: 'Communication cancelled before or after publish',
  },
  {
    action: 'workforce_communication_expired',
    targetType: 'communication',
    description: 'Communication expired',
  },
  {
    action: 'workforce_communication_trashed',
    targetType: 'communication',
    description: 'Communication soft-trashed',
  },
  {
    action: 'workforce_communication_restored',
    targetType: 'communication',
    description: 'Communication restored from trash',
  },
  {
    action: 'workforce_communication_purged',
    targetType: 'communication',
    description: 'Communication permanently deleted',
  },
  {
    action: 'workforce_read_recorded',
    targetType: 'communication',
    description: 'User read recorded for communication',
  },
  {
    action: 'workforce_ack_completed',
    targetType: 'communication',
    description: 'User acknowledged required communication',
  },
  {
    action: 'workforce_campaign_created',
    targetType: 'campaign',
    description: 'Campaign created',
  },
  {
    action: 'workforce_campaign_completed',
    targetType: 'campaign',
    description: 'Campaign marked complete',
  },
  {
    action: 'workforce_campaign_trashed',
    targetType: 'campaign',
    description: 'Campaign soft-trashed',
  },
  {
    action: 'workforce_campaign_restored',
    targetType: 'campaign',
    description: 'Campaign restored from trash',
  },
  {
    action: 'workforce_campaign_purged',
    targetType: 'campaign',
    description: 'Campaign permanently deleted',
  },
  {
    action: 'workforce_attachment_added',
    targetType: 'attachment',
    description: 'Attachment added to communication',
  },
  {
    action: 'workforce_bridge_created',
    targetType: 'communication',
    description: 'Bridge reference created from schedule or HR domain',
  },
] as const;

export const WORKFORCE_COMMS_ACTIVITY_ACTION_NAMES = WORKFORCE_COMMS_ACTIVITY_ACTIONS.map(
  (entry) => entry.action
);
