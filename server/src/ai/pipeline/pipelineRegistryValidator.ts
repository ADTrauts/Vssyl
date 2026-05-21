/**
 * AI pipeline registry validation and dependency graph.
 */

import type { PipelineCatalog } from '../types/pipelineDiagnostics';
import { SOURCE_TO_TOOLS } from './pipelineCatalogDefaults';
import {
  isSystemContextSourceId,
  isSystemIntentId,
  isSystemToolId,
  isValidRegistrySlug,
} from './pipelineRegistryIds';

export type RegistryEntityType = 'intent' | 'context_source' | 'tool' | 'grounding_rule';

export type RegistryValidationAction = 'create' | 'update' | 'archive' | 'duplicate';

export type RegistryIssueSeverity = 'error' | 'warning';

export interface RegistryIssue {
  code: string;
  message: string;
  entityType?: RegistryEntityType;
  entityId?: string;
  relatedIds?: string[];
  severity: RegistryIssueSeverity;
}

export interface RegistryDependency {
  fromType: RegistryEntityType;
  fromId: string;
  toType: RegistryEntityType;
  toId: string;
  kind: string;
}

export interface RegistryValidationResult {
  valid: boolean;
  errors: RegistryIssue[];
  warnings: RegistryIssue[];
  dependencies: RegistryDependency[];
}

export interface RegistryGraphNode {
  id: string;
  type: RegistryEntityType;
  label: string;
  status: string;
  isSystem: boolean;
  archived: boolean;
}

export interface RegistryGraphEdge {
  from: string;
  to: string;
  kind: string;
}

export interface RegistryGraph {
  nodes: RegistryGraphNode[];
  edges: RegistryGraphEdge[];
  orphans: string[];
  warnings: string[];
}

function issue(
  code: string,
  message: string,
  severity: RegistryIssueSeverity,
  partial?: Partial<RegistryIssue>
): RegistryIssue {
  return { code, message, severity, ...partial };
}

function activeIntents(catalog: PipelineCatalog): PipelineCatalog['intents'] {
  return catalog.intents.filter((i) => !i.archived);
}

function activeSources(catalog: PipelineCatalog): PipelineCatalog['contextSources'] {
  return catalog.contextSources.filter((s) => !s.archived);
}

function activeTools(catalog: PipelineCatalog): PipelineCatalog['toolPolicies'] {
  return catalog.toolPolicies.filter((t) => !t.archived);
}

function activeRules(catalog: PipelineCatalog): PipelineCatalog['groundingRules'] {
  return catalog.groundingRules.filter((r) => !r.archived && r.enabled !== false);
}

function intentExists(catalog: PipelineCatalog, id: string, includeArchived = true): boolean {
  return catalog.intents.some((i) => i.id === id && (includeArchived || !i.archived));
}

function sourceExists(catalog: PipelineCatalog, id: string, includeArchived = true): boolean {
  return catalog.contextSources.some((s) => s.id === id && (includeArchived || !s.archived));
}

function toolExists(catalog: PipelineCatalog, id: string, includeArchived = true): boolean {
  return catalog.toolPolicies.some((t) => t.toolId === id && (includeArchived || !t.archived));
}

export function buildSourceToToolsMap(catalog: PipelineCatalog): Record<string, string[]> {
  const map: Record<string, string[]> = { ...SOURCE_TO_TOOLS };
  for (const src of catalog.contextSources) {
    if (src.mappedTools && src.mappedTools.length > 0) {
      map[src.id] = [...src.mappedTools];
    }
  }
  return map;
}

export function buildRegistryGraph(catalog: PipelineCatalog): RegistryGraph {
  const nodes: RegistryGraphNode[] = [];
  const edges: RegistryGraphEdge[] = [];
  const orphans: string[] = [];
  const warnings: string[] = [];
  const sourceToolMap = buildSourceToToolsMap(catalog);

  for (const intent of catalog.intents) {
    nodes.push({
      id: intent.id,
      type: 'intent',
      label: intent.name,
      status: intent.archived ? 'archived' : intent.enabled ? 'enabled' : 'disabled',
      isSystem: intent.isSystem,
      archived: intent.archived,
    });
  }

  for (const src of catalog.contextSources) {
    nodes.push({
      id: src.id,
      type: 'context_source',
      label: src.label,
      status: src.lifecycleStatus ?? (src.wiredInTwin ? 'live' : 'planned'),
      isSystem: src.isSystem,
      archived: src.archived,
    });
    for (const toolId of sourceToolMap[src.id] ?? []) {
      edges.push({ from: src.id, to: toolId, kind: 'source_maps_tool' });
    }
    for (const intentId of src.supportedIntents ?? []) {
      edges.push({ from: src.id, to: intentId, kind: 'source_supports_intent' });
      if (!intentExists(catalog, intentId)) {
        orphans.push(`source:${src.id}->intent:${intentId}`);
      }
    }
  }

  for (const tool of catalog.toolPolicies) {
    nodes.push({
      id: tool.toolId,
      type: 'tool',
      label: tool.displayName ?? tool.toolId,
      status: tool.runtimeKind ?? 'policy_only',
      isSystem: tool.isSystem,
      archived: tool.archived,
    });
    for (const intentId of [...tool.requiredIntents, ...tool.optionalIntents]) {
      edges.push({
        from: tool.toolId,
        to: intentId,
        kind: tool.requiredIntents.includes(intentId) ? 'tool_requires_intent' : 'tool_optional_intent',
      });
      if (!intentExists(catalog, intentId)) {
        orphans.push(`tool:${tool.toolId}->intent:${intentId}`);
      }
    }
  }

  for (const rule of catalog.groundingRules) {
    const nodeId = `grounding:${rule.intentId}`;
    nodes.push({
      id: nodeId,
      type: 'grounding_rule',
      label: rule.requirementSummary,
      status: rule.enabled === false ? 'disabled' : 'enabled',
      isSystem: rule.isSystem,
      archived: rule.archived,
    });
    edges.push({ from: rule.intentId, to: nodeId, kind: 'intent_has_grounding_rule' });
    if (!intentExists(catalog, rule.intentId)) {
      orphans.push(`grounding:${rule.intentId}`);
    }
    for (const srcId of rule.requiredSources) {
      edges.push({ from: nodeId, to: srcId, kind: 'rule_requires_source' });
      if (!sourceExists(catalog, srcId)) orphans.push(`grounding:${rule.intentId}->source:${srcId}`);
    }
    for (const srcId of rule.optionalSources) {
      edges.push({ from: nodeId, to: srcId, kind: 'rule_optional_source' });
      if (!sourceExists(catalog, srcId)) orphans.push(`grounding:${rule.intentId}->source:${srcId}`);
    }
    for (const toolId of rule.requiredTools ?? []) {
      edges.push({ from: nodeId, to: toolId, kind: 'rule_requires_tool' });
      if (!toolExists(catalog, toolId)) orphans.push(`grounding:${rule.intentId}->tool:${toolId}`);
    }
  }

  for (const intent of activeIntents(catalog)) {
    if (intent.groundingRequired && !catalog.groundingRules.some((r) => r.intentId === intent.id && !r.archived)) {
      warnings.push(`Intent ${intent.id} requires grounding but has no grounding rule`);
    }
    if (!intent.isSystem && intent.capabilities?.inferable === false) {
      warnings.push(`Intent ${intent.id} is not inferable yet (v2)`);
    }
  }

  return { nodes, edges, orphans, warnings };
}

export interface ValidateRegistryChangeInput {
  catalog: PipelineCatalog;
  entityType: RegistryEntityType;
  action: RegistryValidationAction;
  entityId: string;
  payload: Record<string, unknown>;
  existingEntity?: Record<string, unknown> | null;
}

export function validateRegistryChange(input: ValidateRegistryChangeInput): RegistryValidationResult {
  const { catalog, entityType, action, entityId, payload, existingEntity } = input;
  const errors: RegistryIssue[] = [];
  const warnings: RegistryIssue[] = [];
  const dependencies: RegistryDependency[] = [];

  const pushError = (code: string, message: string, partial?: Partial<RegistryIssue>) => {
    errors.push(issue(code, message, 'error', { entityType, entityId, ...partial }));
  };

  const pushWarning = (code: string, message: string, partial?: Partial<RegistryIssue>) => {
    warnings.push(issue(code, message, 'warning', { entityType, entityId, ...partial }));
  };

  if (action === 'create' || action === 'duplicate') {
    const newId = String(payload.id ?? payload.toolId ?? payload.intentId ?? entityId).trim();
    if (!isValidRegistrySlug(newId)) {
      pushError('INVALID_SLUG', `Invalid registry id "${newId}". Use lowercase snake_case (3–50 chars).`);
    }
    const exists =
      entityType === 'intent'
        ? catalog.intents.some((i) => i.id === newId && !i.archived)
        : entityType === 'context_source'
          ? catalog.contextSources.some((s) => s.id === newId && !s.archived)
          : entityType === 'tool'
            ? catalog.toolPolicies.some((t) => t.toolId === newId && !t.archived)
            : catalog.groundingRules.some((r) => r.intentId === newId && !r.archived);
    if (exists) {
      pushError('DUPLICATE_ID', `An active registry entry already exists for id "${newId}".`);
    }
  }

  if (entityType === 'intent') {
    const intent = catalog.intents.find((i) => i.id === entityId);
    if (action === 'archive' && intent?.isSystem) {
      pushError('SYSTEM_PROTECTED', 'System intents cannot be archived.');
    }
    if (action === 'create' || action === 'update' || action === 'duplicate') {
      const examples = payload.triggerExamples;
      if (Array.isArray(examples)) {
        const valid = examples.map(String).map((s) => s.trim()).filter(Boolean);
        if (valid.length < 1) {
          pushError('MIN_TRIGGER_EXAMPLES', 'At least one trigger example is required.');
        }
      } else if (action === 'create') {
        pushError('MIN_TRIGGER_EXAMPLES', 'Trigger examples are required.');
      }
      if (payload.groundingRequired === true && action === 'create') {
        const autoRule = payload.createGroundingRule !== false;
        if (autoRule && catalog.groundingRules.some((r) => r.intentId === String(payload.id) && !r.archived)) {
          pushError('GROUNDING_RULE_EXISTS', 'A grounding rule already exists for this intent.');
        }
      }
      if (!intent?.isSystem && action !== 'archive') {
        pushWarning(
          'NO_INFERENCE_MATCH',
          'Custom intents are stored as policy metadata; catalog-driven inference is v2.',
          { relatedIds: [entityId] }
        );
      }
    }
    if (action === 'archive' && intent) {
      const deps = catalog.groundingRules.filter((r) => r.intentId === entityId && !r.archived);
      if (deps.length > 0) {
        pushWarning('DISABLED_DEPENDENCY', `Archiving intent affects ${deps.length} grounding rule(s).`, {
          relatedIds: deps.map((r) => r.intentId),
        });
      }
    }
  }

  if (entityType === 'grounding_rule') {
    const intentId = String(payload.intentId ?? entityId).trim();
    if (!intentExists(catalog, intentId, false) && action === 'create') {
      pushError('ORPHAN_INTENT', `Intent "${intentId}" does not exist or is archived.`);
    }
    if (action === 'create' && catalog.groundingRules.some((r) => r.intentId === intentId && !r.archived)) {
      pushError('GROUNDING_RULE_EXISTS', `Grounding rule already exists for intent "${intentId}".`);
    }
    const rule = catalog.groundingRules.find((r) => r.intentId === entityId);
    if (action === 'archive' && rule?.isSystem) {
      pushError('SYSTEM_PROTECTED', 'System grounding rules cannot be archived.');
    }
    const requiredSources = Array.isArray(payload.requiredSources)
      ? payload.requiredSources.map(String)
      : rule?.requiredSources ?? [];
    const optionalSources = Array.isArray(payload.optionalSources)
      ? payload.optionalSources.map(String)
      : rule?.optionalSources ?? [];
    const requiredTools = Array.isArray(payload.requiredTools)
      ? payload.requiredTools.map(String)
      : rule?.requiredTools ?? [];

    for (const srcId of [...requiredSources, ...optionalSources]) {
      if (!sourceExists(catalog, srcId, true)) {
        pushError('ORPHAN_SOURCE', `Context source "${srcId}" is not registered.`, { relatedIds: [srcId] });
      } else {
        const src = catalog.contextSources.find((s) => s.id === srcId);
        if (src && (!src.enabled || src.archived) && requiredSources.includes(srcId)) {
          pushWarning('DISABLED_DEPENDENCY', `Required source "${srcId}" is disabled or archived.`, {
            relatedIds: [srcId],
          });
        }
      }
    }
    for (const toolId of requiredTools) {
      if (!toolExists(catalog, toolId, true)) {
        pushError('ORPHAN_TOOL', `Tool "${toolId}" is not registered.`, { relatedIds: [toolId] });
      } else {
        const t = catalog.toolPolicies.find((x) => x.toolId === toolId);
        if (t?.runtimeKind === 'policy_only') {
          pushWarning('POLICY_ONLY_TOOL', `Tool "${toolId}" is policy-only (not executable yet).`, {
            relatedIds: [toolId],
          });
        }
      }
    }
    if (requiredSources.length === 0 && requiredTools.length === 0 && intentExists(catalog, intentId)) {
      const intent = catalog.intents.find((i) => i.id === intentId);
      if (intent?.groundingRequired) {
        pushWarning(
          'IMPOSSIBLE_REQUIREMENT',
          'Grounding rule has no required sources or tools while intent requires grounding.'
        );
      }
    }
  }

  if (entityType === 'context_source') {
    const src = catalog.contextSources.find((s) => s.id === entityId);
    if (action === 'archive' && src?.isSystem) {
      pushError('SYSTEM_PROTECTED', 'System context sources cannot be archived.');
    }
    if (action === 'archive' && src) {
      for (const rule of activeRules(catalog)) {
        if (rule.requiredSources.includes(entityId) || rule.optionalSources.includes(entityId)) {
          pushWarning('DISABLED_DEPENDENCY', `Source used by grounding rule for ${rule.intentId}.`, {
            relatedIds: [rule.intentId],
          });
          dependencies.push({
            fromType: 'grounding_rule',
            fromId: rule.intentId,
            toType: 'context_source',
            toId: entityId,
            kind: 'requires',
          });
        }
      }
    }
    if (payload.lifecycleStatus === 'live' && payload.wiredInTwin === false) {
      pushWarning(
        'DISABLED_DEPENDENCY',
        'Source marked live but not wired in twin — retrieval may be policy-only.'
      );
    }
  }

  if (entityType === 'tool') {
    const tool = catalog.toolPolicies.find((t) => t.toolId === entityId);
    if (action === 'archive' && tool?.isSystem) {
      pushError('SYSTEM_PROTECTED', 'System tool policies cannot be archived.');
    }
    const requiredIntents = Array.isArray(payload.requiredIntents)
      ? payload.requiredIntents.map(String)
      : tool?.requiredIntents ?? [];
    const optionalIntents = Array.isArray(payload.optionalIntents)
      ? payload.optionalIntents.map(String)
      : tool?.optionalIntents ?? [];
    for (const intentId of [...requiredIntents, ...optionalIntents]) {
      if (!intentExists(catalog, intentId, true)) {
        pushError('ORPHAN_INTENT', `Intent "${intentId}" is not registered.`, { relatedIds: [intentId] });
      }
    }
    if (payload.runtimeKind === 'policy_only' || tool?.runtimeKind === 'policy_only') {
      pushWarning('POLICY_ONLY_TOOL', 'Tool is policy-only — not executable in the twin yet.');
    }
    if (action === 'update' || action === 'create') {
      for (const other of activeTools(catalog)) {
        if (other.toolId === entityId) continue;
        const otherReq = other.requiredIntents;
        if (
          requiredIntents.some((i) => other.optionalIntents.includes(i)) &&
          otherReq.some((i) => optionalIntents.includes(i))
        ) {
          pushWarning('CIRCULAR_TOOL_INTENT', `Possible circular tool/intent dependency with ${other.toolId}.`, {
            relatedIds: [other.toolId],
          });
        }
      }
    }
  }

  if (catalog.enforcement?.enforcementEnabled === false) {
    const groundingHeavy =
      entityType === 'grounding_rule' &&
      Array.isArray(payload.requiredSources) &&
      (payload.requiredSources as string[]).length > 0;
    if (groundingHeavy) {
      pushWarning(
        'ENFORCEMENT_CONFLICT',
        'Grounding requirements exist but platform enforcement is disabled in settings.'
      );
    }
  }

  if (action === 'update' && existingEntity && entityType === 'intent' && isSystemIntentId(entityId)) {
    if (payload.id && payload.id !== entityId) {
      pushError('SYSTEM_PROTECTED', 'Cannot change id of a system intent.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    dependencies,
  };
}

export function buildCatalogValidationSummary(catalog: PipelineCatalog): {
  orphanCount: number;
  archivedCount: number;
  customIntentCount: number;
  policyOnlyToolCount: number;
} {
  const graph = buildRegistryGraph(catalog);
  return {
    orphanCount: graph.orphans.length,
    archivedCount:
      catalog.intents.filter((i) => i.archived).length +
      catalog.contextSources.filter((s) => s.archived).length +
      catalog.toolPolicies.filter((t) => t.archived).length +
      catalog.groundingRules.filter((r) => r.archived).length,
    customIntentCount: catalog.intents.filter((i) => !i.isSystem && !i.archived).length,
    policyOnlyToolCount: catalog.toolPolicies.filter(
      (t) => !t.archived && t.runtimeKind === 'policy_only'
    ).length,
  };
}
