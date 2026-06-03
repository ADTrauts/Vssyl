import type { AuthenticatedUser } from '../middleware/auth';

/** Stable machine-oriented deny reasons (extend in policy engine only when product needs new codes). */
export type PolicyDenyReason =
  | 'TENANT_MISMATCH'
  | 'NOT_MEMBER'
  | 'INSUFFICIENT_ROLE'
  | 'NOT_OWNER'
  | 'POLICY_NOT_IMPLEMENTED';

export type PolicyResourceType =
  | 'dashboard'
  | 'folder'
  | 'file'
  | 'business'
  | 'household'
  | 'calendar'
  | 'calendar_event'
  | 'module'
  | 'task'
  | 'note'
  | 'place'
  | 'place_node'
  | 'place_listing'
  | 'place_meeting'
  | 'conversation'
  | 'message';

export interface PolicyScope {
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
}

export interface PolicyInput {
  /** Prefer passing userId; `user` optional for future platform-role reads from JWT-backed shape. */
  user?: AuthenticatedUser;
  userId?: string;
  action: string;
  resourceType: PolicyResourceType;
  resourceId?: string;
  scope?: PolicyScope;
  metadata?: Record<string, unknown>;
}

export interface PolicyDecision {
  allow: boolean;
  reason?: PolicyDenyReason | string;
  matchedPolicy?: string;
}
