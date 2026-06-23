/** Normalized module activity envelope persisted in Log.metadata (module_activity_event). */
export interface ModuleActivityEnvelope {
  eventId?: string;
  timestamp?: string;
  actor?: { userId?: string; role?: string };
  action?: string;
  target?: { type?: string; id?: string };
  parent?: { type?: string; id?: string };
  context?: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
    moduleId?: string;
  };
  visibility?: { scope?: string };
  metadata?: Record<string, unknown>;
}

export interface PlatformActivityRecord {
  logId: string;
  eventId: string;
  timestamp: Date;
  moduleId: string;
  action: string;
  targetType: string;
  targetId: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  metadata: Record<string, unknown>;
  actorUserId: string;
}

export const MODULE_ACTIVITY_OPERATION = 'module_activity_event' as const;
