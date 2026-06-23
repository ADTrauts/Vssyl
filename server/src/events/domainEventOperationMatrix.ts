/**
 * Platform Domain Events — operation matrix (PK-W3-DE-1).
 * Runtime-validated registry of emitters, subscribers, ownership, and module participation.
 */
import { DOMAIN_EVENT_TYPES } from './domainEventRegistry';

export type DomainEventSubscriberClass =
  | 'production'
  | 'partial'
  | 'stub'
  | 'dead';

export interface DomainEventSubscriberDefinition {
  id: string;
  handler: string;
  sourceFile: string;
  classification: DomainEventSubscriberClass;
  owner: string;
  constitutionalPurpose: string;
  eventScope: string;
  /** When false, never registered in production (dead / retired). */
  registrable: boolean;
  /**
   * Optional dev-only registration behind env flag (default off).
   * Env: DOMAIN_EVENT_{ID}_SUBSCRIBER_ENABLED (see subscriberEnvFlag).
   */
  optionalDevFlag?: boolean;
  subscriberEnvFlag?: string;
}

export interface DomainEventEmitterOwnership {
  id: string;
  owner: string;
  source: string;
  constitutionalPurpose: string;
  modules: string[];
}

export interface DomainEventModuleParticipation {
  moduleId: string;
  facade: string | null;
  emitsDomainEvents: boolean;
  emitsModuleActivity: boolean;
  notes?: string;
}

/** Canonical subscriber inventory — single source of truth for registration + docs. */
export const DOMAIN_EVENT_SUBSCRIBER_MATRIX: DomainEventSubscriberDefinition[] = [
  {
    id: 'activity',
    handler: 'recordDomainEventToActivityLog',
    sourceFile: 'subscribers/activityDomainEventSubscriber.ts',
    classification: 'production',
    owner: 'Platform Kernel',
    constitutionalPurpose: 'Persist domain_event_recorded audit mirror in Log',
    eventScope: 'all',
    registrable: true,
  },
  {
    id: 'socket',
    handler: 'broadcastDomainEventOnSocket',
    sourceFile: 'subscribers/socketDomainEventSubscriber.ts',
    classification: 'production',
    owner: 'Platform Kernel / Realtime',
    constitutionalPurpose: 'Actor-scoped platform:domain_event realtime fan-out',
    eventScope: 'all',
    registrable: true,
  },
  {
    id: 'notification',
    handler: 'notificationDomainEventConsumer',
    sourceFile: 'subscribers/notificationDomainEventSubscriber.ts',
    classification: 'partial',
    owner: 'Notifications Platform',
    constitutionalPurpose: 'Map high-value domain events to user notifications',
    eventScope: `${DOMAIN_EVENT_TYPES.FILE_SHARED}, ${DOMAIN_EVENT_TYPES.BUSINESS_MEMBER_ADDED}, ${DOMAIN_EVENT_TYPES.MODULE_INSTALLED}`,
    registrable: true,
  },
  {
    id: 'ai_event_consumer',
    handler: 'consumeDomainEventForAI',
    sourceFile: 'ai/consumers/AIEventConsumer.ts',
    classification: 'partial',
    owner: 'AI Platform',
    constitutionalPurpose: 'Learning stubs + ambient suggestion scheduling (no auto-exec)',
    eventScope: 'file.uploaded, chat.message.sent, calendar.event.created, module.installed/enabled/disabled',
    registrable: true,
  },
  {
    id: 'webhook_subscriptions',
    handler: 'deliverDomainEventToWebhooks',
    sourceFile: 'subscribers/webhookDomainEventSubscriber.ts',
    classification: 'production',
    owner: 'Platform Integrations',
    constitutionalPurpose: 'Deliver domain events to business webhook subscriptions',
    eventScope: 'subscription-filtered (all types eligible)',
    registrable: true,
  },
  {
    id: 'search_index_stub',
    handler: 'searchIndexDomainEventConsumer',
    sourceFile: 'subscribers/searchIndexDomainEventSubscriber.ts',
    classification: 'stub',
    owner: 'Search Program (future)',
    constitutionalPurpose: 'Deferred — federated search v2 index maintenance',
    eventScope: 'n/a (no-op stub)',
    registrable: false,
    optionalDevFlag: true,
    subscriberEnvFlag: 'DOMAIN_EVENT_SEARCH_INDEX_SUBSCRIBER_ENABLED',
  },
  {
    id: 'workflow_router_stub',
    handler: 'routeDomainEventToWorkflows',
    sourceFile: 'workflows/domainEventWorkflowRouter.ts',
    classification: 'stub',
    owner: 'Workflow Program (future)',
    constitutionalPurpose: 'Deferred — canonical workflow router for domain events',
    eventScope: 'n/a (no-op stub)',
    registrable: false,
    optionalDevFlag: true,
    subscriberEnvFlag: 'DOMAIN_EVENT_WORKFLOW_ROUTER_SUBSCRIBER_ENABLED',
  },
  {
    id: 'calendar_dashboard_bootstrap',
    handler: 'calendarDashboardTabCreatedConsumer',
    sourceFile: 'subscribers/calendarDashboardDomainEventSubscriber.ts',
    classification: 'partial',
    owner: 'Calendar + Dashboard',
    constitutionalPurpose: 'Bootstrap personal primary calendar on dashboard tab creation',
    eventScope: DOMAIN_EVENT_TYPES.DASHBOARD_TAB_CREATED,
    registrable: true,
  },
  {
    id: 'workspace_dashboard_seed',
    handler: 'workspaceDashboardTabCreatedConsumer',
    sourceFile: 'subscribers/workspaceDashboardDomainEventSubscriber.ts',
    classification: 'partial',
    owner: 'Workspace Runtime',
    constitutionalPurpose: 'Seed business workspace modules on dashboard tab creation',
    eventScope: DOMAIN_EVENT_TYPES.DASHBOARD_TAB_CREATED,
    registrable: true,
  },
];

export const DOMAIN_EVENT_EMITTER_OWNERSHIP: DomainEventEmitterOwnership[] = [
  {
    id: 'platform_emitters',
    owner: 'Platform Kernel',
    source: 'events/domainEventEmitters.ts',
    constitutionalPurpose: 'Typed cross-module emit helpers (drive, chat, calendar, todo, business, settings)',
    modules: ['drive', 'chat', 'calendar', 'todo', 'platform', 'business'],
  },
  {
    id: 'vlink_emitters',
    owner: 'V_Link Program',
    source: 'events/vlinkDomainEventEmitters.ts',
    constitutionalPurpose: 'V_Link lifecycle domain events',
    modules: ['vlink'],
  },
  {
    id: 'module_domain_event_services',
    owner: 'Module owners',
    source: 'services/*DomainEventService.ts',
    constitutionalPurpose: 'Module-scoped facade over platform emitters',
    modules: [
      'chat',
      'calendar',
      'todo',
      'notes',
      'notebook',
      'place',
      'dashboard',
      'scheduling',
      'workforce_comms',
      'orgchart',
      'approval_hierarchy',
      'account',
      'hr',
    ],
  },
  {
    id: 'inline_account_settings',
    owner: 'Account Platform',
    source: 'services/account/settingsActivityService.ts, userPreferenceService.ts',
    constitutionalPurpose: 'Settings and preference mutation emits',
    modules: ['account', 'platform'],
  },
];

export const DOMAIN_EVENT_MODULE_PARTICIPATION: DomainEventModuleParticipation[] = [
  { moduleId: 'chat', facade: 'chatDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'calendar', facade: 'calendarDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'drive', facade: 'domainEventEmitters (delegated)', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'dashboard', facade: 'dashboardDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'account', facade: 'billingDomainEventService + entitlementDomainEventService', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'place', facade: 'place/placeDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'todo', facade: 'todoDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'notebook', facade: 'notebook/notebookLinkDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'hr', facade: 'hrDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'scheduling', facade: 'schedulingDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'workforce_comms', facade: 'workforceDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'orgchart', facade: 'business/orgChartDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'approval_hierarchy', facade: 'business/approvalHierarchyDomainEventService.ts', emitsDomainEvents: true, emitsModuleActivity: true },
  { moduleId: 'analytics', facade: null, emitsDomainEvents: false, emitsModuleActivity: true, notes: 'Activity-only by design (exempt)' },
  { moduleId: 'admin_portal', facade: null, emitsDomainEvents: false, emitsModuleActivity: false, notes: 'Consumer-only surface' },
];

function isTruthyEnv(name: string): boolean {
  const value = process.env[name];
  return value === '1' || value === 'true' || value === 'yes';
}

/** Whether an optional stub subscriber is enabled via explicit env (default off). */
export function isOptionalDomainEventSubscriberEnabled(
  definition: DomainEventSubscriberDefinition
): boolean {
  if (!definition.optionalDevFlag || !definition.subscriberEnvFlag) {
    return false;
  }
  return isTruthyEnv(definition.subscriberEnvFlag);
}

/** Subscribers that register in the current process (production + optional dev flags). */
export function resolveActiveDomainEventSubscribers(): DomainEventSubscriberDefinition[] {
  return DOMAIN_EVENT_SUBSCRIBER_MATRIX.filter((entry) => {
    if (entry.classification === 'dead' || !entry.registrable) {
      if (entry.optionalDevFlag) {
        return isOptionalDomainEventSubscriberEnabled(entry);
      }
      return false;
    }
    return true;
  });
}

export interface DomainEventOperationMatrixValidation {
  valid: boolean;
  errors: string[];
  activeSubscriberIds: string[];
  productionStubCount: number;
}

/**
 * Runtime validation for DE certification baseline.
 * Ensures no stub is active without explicit opt-in and matrix integrity holds.
 */
export function validateDomainEventOperationMatrix(): DomainEventOperationMatrixValidation {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const entry of DOMAIN_EVENT_SUBSCRIBER_MATRIX) {
    if (ids.has(entry.id)) {
      errors.push(`Duplicate subscriber id: ${entry.id}`);
    }
    ids.add(entry.id);

    if (!entry.owner?.trim()) {
      errors.push(`Subscriber ${entry.id} missing owner`);
    }
    if (!entry.constitutionalPurpose?.trim()) {
      errors.push(`Subscriber ${entry.id} missing constitutionalPurpose`);
    }
    if (!entry.handler?.trim() || !entry.sourceFile?.trim()) {
      errors.push(`Subscriber ${entry.id} missing handler or sourceFile`);
    }
  }

  const active = resolveActiveDomainEventSubscribers();
  const activeSubscriberIds = active.map((s) => s.id);

  const dishonestActiveStubs = active.filter(
    (s) => s.classification === 'stub' && s.registrable
  );
  if (dishonestActiveStubs.length > 0) {
    errors.push(
      `Stub subscribers registered in production without opt-in gate: ${dishonestActiveStubs.map((s) => s.id).join(', ')}`
    );
  }

  const productionStubCount = active.filter((s) => s.classification === 'stub').length;

  for (const emitter of DOMAIN_EVENT_EMITTER_OWNERSHIP) {
    if (!emitter.owner?.trim() || !emitter.source?.trim()) {
      errors.push(`Emitter ${emitter.id} missing owner or source`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    activeSubscriberIds,
    productionStubCount,
  };
}

/** Production registrable subscribers (excludes optional stub flags). */
export const DOMAIN_EVENT_PRODUCTION_SUBSCRIBER_IDS = DOMAIN_EVENT_SUBSCRIBER_MATRIX.filter(
  (s) => s.registrable && s.classification !== 'stub' && s.classification !== 'dead'
).map((s) => s.id);

/** Modules required to have documented facade + domain event emission (PK-W3-DE-2). */
export const CERTIFIED_MODULE_PARTICIPATION_IDS = [
  'chat',
  'calendar',
  'drive',
  'todo',
  'notebook',
  'place',
  'dashboard',
  'account',
  'hr',
  'scheduling',
  'workforce_comms',
  'orgchart',
  'approval_hierarchy',
] as const;

export interface ModuleParticipationValidation {
  valid: boolean;
  errors: string[];
}

/** Validates certified module rows in the operation matrix (DE L2 baseline). */
export function validateCertifiedModuleParticipation(): ModuleParticipationValidation {
  const errors: string[] = [];

  for (const moduleId of CERTIFIED_MODULE_PARTICIPATION_IDS) {
    const row = DOMAIN_EVENT_MODULE_PARTICIPATION.find((m) => m.moduleId === moduleId);
    if (!row) {
      errors.push(`Missing module participation row: ${moduleId}`);
      continue;
    }
    if (!row.facade?.trim()) {
      errors.push(`${moduleId}: missing documented facade`);
    }
    if (!row.emitsDomainEvents) {
      errors.push(`${moduleId}: must emit domain events`);
    }
  }

  return { valid: errors.length === 0, errors };
}
