/**
 * Canonical classification of active Twin tool-loop tools (Phase 1).
 * Partner/webhook ActionExecutor paths are inventoried in docs; not all migrate here yet.
 */

import type { AIActionRiskDeclaration } from 'vssyl-shared';
import { resolveApprovalRequired } from 'vssyl-shared';
import type { AIToolName } from '../tools/toolDefinitions';

export const ACTIVE_AI_TOOL_RISK_REGISTRY: Record<AIToolName, AIActionRiskDeclaration> = {
  list_drive_files: {
    canonicalName: 'list_drive_files',
    domainOwner: 'drive',
    riskCategory: 'READ_ONLY',
    mutating: false,
    externalVisibility: false,
    reversible: true,
    approvalPolicy: 'NEVER',
    idempotencyRequired: false,
    auditRequired: false,
    businessScopeRequired: false,
  },
  share_file: {
    canonicalName: 'share_file',
    domainOwner: 'drive',
    riskCategory: 'EXTERNAL_VISIBILITY',
    mutating: true,
    externalVisibility: true,
    reversible: true,
    approvalPolicy: 'RISK_BASED',
    idempotencyRequired: true,
    auditRequired: true,
    businessScopeRequired: false,
  },
  summarize_notebook_page: {
    canonicalName: 'summarize_notebook_page',
    domainOwner: 'notebook',
    riskCategory: 'READ_ONLY',
    mutating: false,
    externalVisibility: false,
    reversible: true,
    approvalPolicy: 'NEVER',
    idempotencyRequired: false,
    auditRequired: false,
    businessScopeRequired: false,
  },
  extract_notebook_action_items: {
    canonicalName: 'extract_notebook_action_items',
    domainOwner: 'notebook',
    riskCategory: 'READ_ONLY',
    mutating: false,
    externalVisibility: false,
    reversible: true,
    approvalPolicy: 'NEVER',
    idempotencyRequired: false,
    auditRequired: false,
    businessScopeRequired: false,
  },
  search_places: {
    canonicalName: 'search_places',
    domainOwner: 'place',
    riskCategory: 'READ_ONLY',
    mutating: false,
    externalVisibility: false,
    reversible: true,
    approvalPolicy: 'NEVER',
    idempotencyRequired: false,
    auditRequired: false,
    businessScopeRequired: false,
  },
  get_place_recommendations: {
    canonicalName: 'get_place_recommendations',
    domainOwner: 'place',
    riskCategory: 'READ_ONLY',
    mutating: false,
    externalVisibility: false,
    reversible: true,
    approvalPolicy: 'NEVER',
    idempotencyRequired: false,
    auditRequired: false,
    businessScopeRequired: false,
  },
  get_place_purchase_help: {
    canonicalName: 'get_place_purchase_help',
    domainOwner: 'place',
    riskCategory: 'READ_ONLY',
    mutating: false,
    externalVisibility: false,
    reversible: true,
    approvalPolicy: 'NEVER',
    idempotencyRequired: false,
    auditRequired: false,
    businessScopeRequired: false,
  },
  create_todo: {
    canonicalName: 'create_todo',
    domainOwner: 'todo',
    riskCategory: 'LOW_RISK_REVERSIBLE',
    mutating: true,
    externalVisibility: false,
    reversible: true,
    approvalPolicy: 'RISK_BASED',
    idempotencyRequired: true,
    auditRequired: true,
    businessScopeRequired: false,
  },
};

export function getToolRiskDeclaration(name: string): AIActionRiskDeclaration | undefined {
  if (name in ACTIVE_AI_TOOL_RISK_REGISTRY) {
    return ACTIVE_AI_TOOL_RISK_REGISTRY[name as AIToolName];
  }
  return undefined;
}

export function toolRequiresApproval(name: string): boolean {
  const decl = getToolRiskDeclaration(name);
  if (!decl) {
    // Unknown tools: fail closed for mutations — treat as ALWAYS approval until classified
    return true;
  }
  return resolveApprovalRequired(decl);
}
