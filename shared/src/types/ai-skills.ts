/**
 * Phase 8 — AI Skills Framework contracts.
 * Skills are governed task contracts — not saved prompts and not provider model IDs.
 */

import type { AIModelCapability, AIRoutingTier } from './ai-model-routing';

export const AI_SKILLS_POLICY_VERSION = 'phase8-2026-07-13';

export type AISkillScope =
  | 'PLATFORM'
  | 'MODULE_INTERNAL'
  | 'INDUSTRY_FUTURE'
  | 'BUSINESS_FUTURE'
  | 'PERSONAL_FUTURE';

export type AISkillStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'CERTIFIED'
  | 'ACTIVE'
  | 'DEPRECATED'
  | 'RETIRED'
  | 'SUSPENDED';

export type AISkillIntentType =
  | 'DOCUMENT_SUMMARIZATION'
  | 'ACTION_EXTRACTION'
  | 'STRUCTURED_DOCUMENT_EXTRACTION'
  | 'TODO_PRIORITIZATION'
  | 'MEETING_RECAP'
  | 'GENERIC';

export type AISkillJsonSchema = Record<string, unknown>;

export interface AISkillCapabilityRequest {
  primary: AIModelCapability;
  secondary?: AIModelCapability[];
  tier: AIRoutingTier;
}

export interface AISkillContextRequirements {
  providers: string[];
  moduleIds?: string[];
  minNecessary: boolean;
  personalMemoryAllowed: boolean;
  businessMembershipRequired: boolean;
}

export interface AISkillKnowledgeRequirements {
  personalMemory: 'disallowed' | 'read_allowed';
  businessPolicy: boolean;
  liveModuleSoR: boolean;
  platformGuidance: boolean;
  industryPackFuture: boolean;
}

export interface AISkillGroundingPolicy {
  sourceCitationRequired: boolean;
  refuseWhenUngrounded: boolean;
  allowSpeculation: boolean;
}

export interface AISkillToolPolicy {
  allowedReadTools: string[];
  allowedMutatingTools: string[];
  prohibitedTools: string[];
  maxToolRounds: number;
  mutationsDefaultOff: boolean;
}

export interface AISkillApprovalPolicy {
  mandatoryApproval: boolean;
  approvalForMutations: boolean;
}

export interface AISkillPrivacyPolicy {
  redactSecrets: boolean;
  persistPrivateKnowledge: boolean;
  externalVisibilityAllowed: boolean;
}

export interface AISkillTimeoutPolicy {
  softTimeoutMs: number;
  hardTimeoutMs: number;
}

export interface AISkillCostPolicy {
  maxQueryCost?: number;
  costTierHint: 'free' | 'standard' | 'premium';
}

export interface AISkillObservationPolicy {
  emitSkillEvents: boolean;
  attachToExecutionRecord: boolean;
}

export interface AISkillEvaluationProfile {
  id: string;
  factualGroundingRequired: boolean;
  sourceCitationCompleteness: boolean;
  schemaValidityRequired: boolean;
  toolCorrectness: boolean;
  uncertaintyBehavior: boolean;
  responseCompleteness: boolean;
  prohibitedClaims: string[];
  latencyTargetMs?: number;
}

export interface AISkillDefinition {
  key: string;
  name: string;
  description: string;
  version: string;
  status: AISkillStatus;
  owner: string;
  scope: AISkillScope;
  intentTypes: AISkillIntentType[];
  inputSchema: AISkillJsonSchema;
  outputSchema: AISkillJsonSchema;
  capabilityRequest: AISkillCapabilityRequest;
  contextRequirements: AISkillContextRequirements;
  knowledgeRequirements: AISkillKnowledgeRequirements;
  groundingPolicy: AISkillGroundingPolicy;
  allowedTools: string[];
  actionPolicy: AISkillToolPolicy;
  approvalPolicy: AISkillApprovalPolicy;
  privacyPolicy: AISkillPrivacyPolicy;
  timeoutPolicy: AISkillTimeoutPolicy;
  costPolicy: AISkillCostPolicy;
  observationPolicy: AISkillObservationPolicy;
  evaluationProfile: AISkillEvaluationProfile;
  tags: string[];
  compatibility: {
    minPlatformPhase: string;
    replacesKey?: string;
  };
  customerVisible: boolean;
  internalOnly: boolean;
  systemsOfRecordRead: string[];
  instructionAssetKey: string;
  /** Implementation registration key — code-owned, not DB-executable. */
  implementationKey: string;
  certificationNotes?: string;
  activatedAt?: string;
  deprecatedAt?: string;
  retiredAt?: string;
  replacementKey?: string;
}

export interface AISkillVersionPointer {
  key: string;
  activeVersion: string;
  certifiedVersions: string[];
}

export interface AISkillSelectionInput {
  explicitSkillKey?: string;
  explicitVersion?: string;
  intentType?: AISkillIntentType;
  moduleId?: string;
  userId: string;
  businessId?: string | null;
  preferShadowAutoSelect?: boolean;
}

export interface AISkillSelectionResult {
  selected?: { key: string; version: string };
  selectionReason: string;
  confidence: number;
  eligibleAlternatives: Array<{ key: string; version: string; reason: string }>;
  rejected: Array<{ key: string; version?: string; reason: string }>;
  clarificationRequired: boolean;
  shadowMode: boolean;
}

export interface AISkillExecutionPlan {
  skillKey: string;
  skillVersion: string;
  executionId: string;
  policyVersion: string;
  normalizedInput: Record<string, unknown>;
  requiredContextProviders: string[];
  requiredKnowledgeSources: string[];
  groundingRequirements: AISkillGroundingPolicy;
  capabilityRequest: AISkillCapabilityRequest;
  allowedTools: string[];
  approvalRequirements: AISkillApprovalPolicy;
  outputSchema: AISkillJsonSchema;
  timeoutMs: number;
  observationTags: string[];
  evaluationProfileId: string;
  implementationKey: string;
}

export interface AISkillExecutionRequest {
  skillKey: string;
  version?: string;
  input: Record<string, unknown>;
  userId: string;
  businessId?: string | null;
  requestId?: string;
  conversationId?: string;
  moduleId?: string;
}

export interface AISkillExecutionResult {
  ok: boolean;
  skillKey: string;
  skillVersion: string;
  executionId: string;
  status: 'COMPLETED' | 'FAILED' | 'REJECTED';
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  plan: AISkillExecutionPlan;
  shadowRouting?: {
    proposedProvider?: string;
    proposedCatalogKey?: string;
    match?: boolean;
  };
  observationEmitted: boolean;
}

export interface AISkillRegistryListItem {
  key: string;
  name: string;
  description: string;
  activeVersion: string;
  status: AISkillStatus;
  scope: AISkillScope;
  owner: string;
  intentTypes: AISkillIntentType[];
  customerVisible: boolean;
  tags: string[];
}

export interface AISkillOpsOverview {
  policyVersion: string;
  skillCount: number;
  activeCount: number;
  draftCount: number;
  deprecatedCount: number;
  recentExecutions: number;
  successCount: number;
  failureCount: number;
  bySkill: Record<string, number>;
}
