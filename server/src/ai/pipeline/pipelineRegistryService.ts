/**
 * Dynamic AI pipeline registry CRUD (archive-only lifecycle).
 */

import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type {
  PipelineContextSourceDefinition,
  PipelineGroundingRule,
  PipelineIntentDefinition,
  PipelineToolPolicy,
} from '../types/pipelineDiagnostics';
import {
  mapGroundingRow,
  mapIntentRow,
  mapSourceRow,
  mapToolRow,
  seedRuntimeKindForTool,
} from './pipelineCatalogMappers';
import {
  capabilitiesToJson,
  defaultContextSourceCapabilities,
  defaultIntentCapabilities,
  defaultToolCapabilities,
} from './pipelineRegistryCapabilities';
import {
  getEffectivePipelineCatalog,
  refreshPipelineCatalogCache,
  writePipelinePolicyAudit,
} from './pipelineCatalogService';
import { suggestDuplicateId } from './pipelineRegistryIds';
import {
  validateRegistryChange,
  type RegistryValidationResult,
} from './pipelineRegistryValidator';

async function validateOrThrow(
  entityType: 'intent' | 'context_source' | 'tool' | 'grounding_rule',
  action: 'create' | 'update' | 'archive' | 'duplicate',
  entityId: string,
  payload: Record<string, unknown>,
  existingEntity?: Record<string, unknown> | null
): Promise<RegistryValidationResult> {
  const catalog = await getEffectivePipelineCatalog({ includeArchived: true });
  const result = validateRegistryChange({
    catalog,
    entityType,
    action,
    entityId,
    payload,
    existingEntity,
  });
  if (!result.valid) {
    const msg = result.errors.map((e) => e.message).join('; ');
    throw new Error(msg || 'Registry validation failed');
  }
  return result;
}

// --- Intents ---

export async function createPipelineIntent(
  body: {
    id: string;
    name: string;
    description: string;
    triggerExamples: string[];
    groundingRequired?: boolean;
    enabled?: boolean;
    category?: string | null;
    priority?: number | null;
    defaultRequiredTools?: string[];
    createGroundingRule?: boolean;
  },
  adminUserId: string
): Promise<{ intent: PipelineIntentDefinition; validation: RegistryValidationResult }> {
  const id = body.id.trim();
  const validation = await validateOrThrow('intent', 'create', id, { ...body, id });
  const capabilities = defaultIntentCapabilities(id);

  const created = await prisma.aIPipelineIntentPolicy.create({
    data: {
      id,
      name: body.name,
      description: body.description,
      triggerExamples: body.triggerExamples,
      groundingRequired: body.groundingRequired ?? false,
      enabled: body.enabled ?? true,
      isSystem: false,
      archived: false,
      category: body.category ?? null,
      priority: body.priority ?? null,
      defaultRequiredTools: body.defaultRequiredTools ?? [],
      capabilities: capabilitiesToJson(capabilities) as Prisma.InputJsonValue,
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    },
  });

  if (body.createGroundingRule !== false && (body.groundingRequired ?? false)) {
    const hasRule = await prisma.aIPipelineGroundingRulePolicy.findUnique({ where: { intentId: id } });
    if (!hasRule) {
      await prisma.aIPipelineGroundingRulePolicy.create({
        data: {
          intentId: id,
          requiredSources: [],
          optionalSources: [],
          requirementSummary: `Grounding for ${id}`,
          enabled: true,
          isSystem: false,
          archived: false,
          createdByAdminId: adminUserId,
          updatedByAdminId: adminUserId,
        },
      });
    }
  }

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'intent',
    entityId: id,
    action: 'create',
    after: created as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return { intent: mapIntentRow(created), validation };
}

export async function duplicatePipelineIntent(
  sourceId: string,
  body: { newId?: string },
  adminUserId: string
): Promise<PipelineIntentDefinition> {
  const existing = await prisma.aIPipelineIntentPolicy.findUnique({ where: { id: sourceId } });
  if (!existing) throw new Error('Intent not found');
  const newId = (body.newId?.trim() || suggestDuplicateId(sourceId)).trim();
  await validateOrThrow('intent', 'duplicate', newId, {
    id: newId,
    name: `${existing.name} (copy)`,
    description: existing.description,
    triggerExamples: existing.triggerExamples,
    groundingRequired: existing.groundingRequired,
  });

  const created = await prisma.aIPipelineIntentPolicy.create({
    data: {
      id: newId,
      name: `${existing.name} (copy)`,
      description: existing.description,
      triggerExamples: [...existing.triggerExamples],
      groundingRequired: existing.groundingRequired,
      enabled: existing.enabled,
      isSystem: false,
      archived: false,
      category: existing.category,
      priority: existing.priority,
      defaultRequiredTools: [...existing.defaultRequiredTools],
      capabilities: existing.capabilities ?? capabilitiesToJson(defaultIntentCapabilities(newId)),
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    },
  });

  const srcRule = await prisma.aIPipelineGroundingRulePolicy.findUnique({ where: { intentId: sourceId } });
  if (srcRule && !(await prisma.aIPipelineGroundingRulePolicy.findUnique({ where: { intentId: newId } }))) {
    await prisma.aIPipelineGroundingRulePolicy.create({
      data: {
        intentId: newId,
        requiredSources: [...srcRule.requiredSources],
        optionalSources: [...srcRule.optionalSources],
        requirementSummary: srcRule.requirementSummary,
        enabled: srcRule.enabled,
        isSystem: false,
        archived: false,
        requiredTools: [...srcRule.requiredTools],
        minimumConfidence: srcRule.minimumConfidence,
        enforcementBehavior: srcRule.enforcementBehavior,
        createdByAdminId: adminUserId,
        updatedByAdminId: adminUserId,
      },
    });
  }

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'intent',
    entityId: newId,
    action: 'duplicate',
    before: { sourceId } as Prisma.InputJsonValue,
    after: created as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapIntentRow(created);
}

export async function setPipelineIntentArchived(
  intentId: string,
  archived: boolean,
  adminUserId: string
): Promise<PipelineIntentDefinition> {
  const existing = await prisma.aIPipelineIntentPolicy.findUnique({ where: { id: intentId } });
  if (!existing) throw new Error('Intent not found');
  await validateOrThrow('intent', 'archive', intentId, { archived }, existing as unknown as Record<string, unknown>);

  const updated = await prisma.aIPipelineIntentPolicy.update({
    where: { id: intentId },
    data: {
      archived,
      enabled: archived ? false : existing.enabled,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'intent',
    entityId: intentId,
    action: archived ? 'archive' : 'restore',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapIntentRow(updated);
}

export async function setPipelineIntentEnabled(
  intentId: string,
  enabled: boolean,
  adminUserId: string
): Promise<PipelineIntentDefinition> {
  const existing = await prisma.aIPipelineIntentPolicy.findUnique({ where: { id: intentId } });
  if (!existing) throw new Error('Intent not found');

  const updated = await prisma.aIPipelineIntentPolicy.update({
    where: { id: intentId },
    data: { enabled, updatedByAdminId: adminUserId },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'intent',
    entityId: intentId,
    action: enabled ? 'enable' : 'disable',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapIntentRow(updated);
}

// --- Context sources ---

export async function createPipelineContextSource(
  body: {
    id: string;
    label: string;
    description: string;
    enabled?: boolean;
    wiredInTwin?: boolean;
    sourceType?: string | null;
    lifecycleStatus?: string | null;
    retrievalPriority?: number;
    supportedIntents?: string[];
    permissionsRequired?: string[];
    sensitivityLevel?: string | null;
    mappedTools?: string[];
  },
  adminUserId: string
): Promise<{ source: PipelineContextSourceDefinition; validation: RegistryValidationResult }> {
  const id = body.id.trim();
  const lifecycle = body.lifecycleStatus ?? (body.wiredInTwin ? 'live' : 'planned');
  const validation = await validateOrThrow('context_source', 'create', id, { ...body, id });
  const capabilities = defaultContextSourceCapabilities(body.wiredInTwin ?? false, lifecycle);

  const created = await prisma.aIPipelineContextSourcePolicy.create({
    data: {
      id,
      label: body.label,
      description: body.description,
      enabled: body.enabled ?? true,
      wiredInTwin: body.wiredInTwin ?? false,
      isSystem: false,
      archived: false,
      sourceType: body.sourceType ?? 'external',
      lifecycleStatus: lifecycle,
      retrievalPriority: body.retrievalPriority ?? 50,
      supportedIntents: body.supportedIntents ?? [],
      permissionsRequired: body.permissionsRequired ?? [],
      sensitivityLevel: body.sensitivityLevel ?? 'medium',
      mappedTools: body.mappedTools ?? [],
      capabilities: capabilitiesToJson(capabilities) as Prisma.InputJsonValue,
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'context_source',
    entityId: id,
    action: 'create',
    after: created as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return { source: mapSourceRow(created), validation };
}

export async function duplicatePipelineContextSource(
  sourceId: string,
  body: { newId?: string },
  adminUserId: string
): Promise<PipelineContextSourceDefinition> {
  const existing = await prisma.aIPipelineContextSourcePolicy.findUnique({ where: { id: sourceId } });
  if (!existing) throw new Error('Context source not found');
  const newId = (body.newId?.trim() || suggestDuplicateId(sourceId)).trim();
  await validateOrThrow('context_source', 'duplicate', newId, { id: newId, label: existing.label });

  const created = await prisma.aIPipelineContextSourcePolicy.create({
    data: {
      id: newId,
      label: `${existing.label} (copy)`,
      description: existing.description,
      enabled: existing.enabled,
      wiredInTwin: existing.wiredInTwin,
      isSystem: false,
      archived: false,
      sourceType: existing.sourceType,
      lifecycleStatus: existing.lifecycleStatus,
      retrievalPriority: existing.retrievalPriority,
      supportedIntents: [...existing.supportedIntents],
      permissionsRequired: [...existing.permissionsRequired],
      sensitivityLevel: existing.sensitivityLevel,
      mappedTools: [...existing.mappedTools],
      capabilities: existing.capabilities ?? undefined,
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'context_source',
    entityId: newId,
    action: 'duplicate',
    before: { sourceId } as Prisma.InputJsonValue,
    after: created as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapSourceRow(created);
}

export async function setPipelineContextSourceArchived(
  sourceId: string,
  archived: boolean,
  adminUserId: string
): Promise<PipelineContextSourceDefinition> {
  const existing = await prisma.aIPipelineContextSourcePolicy.findUnique({ where: { id: sourceId } });
  if (!existing) throw new Error('Context source not found');
  await validateOrThrow(
    'context_source',
    'archive',
    sourceId,
    { archived },
    existing as unknown as Record<string, unknown>
  );

  const updated = await prisma.aIPipelineContextSourcePolicy.update({
    where: { id: sourceId },
    data: {
      archived,
      enabled: archived ? false : existing.enabled,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'context_source',
    entityId: sourceId,
    action: archived ? 'archive' : 'restore',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapSourceRow(updated);
}

export async function setPipelineContextSourceEnabled(
  sourceId: string,
  enabled: boolean,
  adminUserId: string
): Promise<PipelineContextSourceDefinition> {
  const existing = await prisma.aIPipelineContextSourcePolicy.findUnique({ where: { id: sourceId } });
  if (!existing) throw new Error('Context source not found');

  const updated = await prisma.aIPipelineContextSourcePolicy.update({
    where: { id: sourceId },
    data: { enabled, updatedByAdminId: adminUserId },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'context_source',
    entityId: sourceId,
    action: enabled ? 'enable' : 'disable',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapSourceRow(updated);
}

// --- Tools ---

export async function createPipelineToolPolicy(
  body: {
    toolId: string;
    displayName?: string | null;
    purpose: string;
    requiredIntents?: string[];
    optionalIntents?: string[];
    requiredPermissions?: string[];
    fallbackBehavior: string;
    enabled?: boolean;
    riskLevel?: string | null;
    requiresGrounding?: boolean;
    rateLimitPerMinute?: number | null;
    runtimeKind?: string | null;
  },
  adminUserId: string
): Promise<{ tool: PipelineToolPolicy; validation: RegistryValidationResult }> {
  const toolId = body.toolId.trim();
  const runtimeKind = (body.runtimeKind as 'openai_tool' | 'prepass' | 'policy_only') ?? 'policy_only';
  const validation = await validateOrThrow('tool', 'create', toolId, { ...body, toolId });
  const capabilities = defaultToolCapabilities(runtimeKind);

  const created = await prisma.aIPipelineToolPolicyRow.create({
    data: {
      toolId,
      displayName: body.displayName ?? body.toolId,
      purpose: body.purpose,
      requiredIntents: body.requiredIntents ?? [],
      optionalIntents: body.optionalIntents ?? [],
      requiredPermissions: body.requiredPermissions ?? [],
      fallbackBehavior: body.fallbackBehavior,
      enabled: body.enabled ?? true,
      isSystem: false,
      archived: false,
      riskLevel: body.riskLevel ?? 'medium',
      requiresGrounding: body.requiresGrounding ?? false,
      rateLimitPerMinute: body.rateLimitPerMinute ?? null,
      runtimeKind,
      capabilities: capabilitiesToJson(capabilities) as Prisma.InputJsonValue,
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'tool_policy',
    entityId: toolId,
    action: 'create',
    after: created as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return { tool: mapToolRow(created), validation };
}

export async function duplicatePipelineToolPolicy(
  toolId: string,
  body: { newToolId?: string },
  adminUserId: string
): Promise<PipelineToolPolicy> {
  const existing = await prisma.aIPipelineToolPolicyRow.findUnique({ where: { toolId } });
  if (!existing) throw new Error('Tool policy not found');
  const newToolId = (body.newToolId?.trim() || suggestDuplicateId(toolId)).trim();
  await validateOrThrow('tool', 'duplicate', newToolId, { toolId: newToolId });

  const created = await prisma.aIPipelineToolPolicyRow.create({
    data: {
      toolId: newToolId,
      displayName: existing.displayName ? `${existing.displayName} (copy)` : `${newToolId} (copy)`,
      purpose: existing.purpose,
      requiredIntents: [...existing.requiredIntents],
      optionalIntents: [...existing.optionalIntents],
      requiredPermissions: [...existing.requiredPermissions],
      fallbackBehavior: existing.fallbackBehavior,
      enabled: existing.enabled,
      isSystem: false,
      archived: false,
      riskLevel: existing.riskLevel,
      requiresGrounding: existing.requiresGrounding,
      rateLimitPerMinute: existing.rateLimitPerMinute,
      runtimeKind: existing.runtimeKind,
      capabilities: existing.capabilities ?? undefined,
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'tool_policy',
    entityId: newToolId,
    action: 'duplicate',
    before: { toolId } as Prisma.InputJsonValue,
    after: created as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapToolRow(created);
}

export async function setPipelineToolArchived(
  toolId: string,
  archived: boolean,
  adminUserId: string
): Promise<PipelineToolPolicy> {
  const existing = await prisma.aIPipelineToolPolicyRow.findUnique({ where: { toolId } });
  if (!existing) throw new Error('Tool policy not found');
  await validateOrThrow('tool', 'archive', toolId, { archived }, existing as unknown as Record<string, unknown>);

  const updated = await prisma.aIPipelineToolPolicyRow.update({
    where: { toolId },
    data: {
      archived,
      enabled: archived ? false : existing.enabled,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'tool_policy',
    entityId: toolId,
    action: archived ? 'archive' : 'restore',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapToolRow(updated);
}

export async function setPipelineToolEnabled(
  toolId: string,
  enabled: boolean,
  adminUserId: string
): Promise<PipelineToolPolicy> {
  const existing = await prisma.aIPipelineToolPolicyRow.findUnique({ where: { toolId } });
  if (!existing) throw new Error('Tool policy not found');

  const updated = await prisma.aIPipelineToolPolicyRow.update({
    where: { toolId },
    data: { enabled, updatedByAdminId: adminUserId },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'tool_policy',
    entityId: toolId,
    action: enabled ? 'enable' : 'disable',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapToolRow(updated);
}

// --- Grounding rules ---

export async function createPipelineGroundingRule(
  body: {
    intentId: string;
    requiredSources?: string[];
    optionalSources?: string[];
    requirementSummary: string;
    requiredTools?: string[];
    minimumConfidence?: string | null;
    enforcementBehavior?: string | null;
    enabled?: boolean;
  },
  adminUserId: string
): Promise<{ rule: PipelineGroundingRule; validation: RegistryValidationResult }> {
  const intentId = body.intentId.trim();
  const validation = await validateOrThrow('grounding_rule', 'create', intentId, body);

  const created = await prisma.aIPipelineGroundingRulePolicy.create({
    data: {
      intentId,
      requiredSources: body.requiredSources ?? [],
      optionalSources: body.optionalSources ?? [],
      requirementSummary: body.requirementSummary,
      enabled: body.enabled ?? true,
      isSystem: false,
      archived: false,
      requiredTools: body.requiredTools ?? [],
      minimumConfidence: body.minimumConfidence ?? null,
      enforcementBehavior: body.enforcementBehavior ?? null,
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'grounding_rule',
    entityId: intentId,
    action: 'create',
    after: created as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return { rule: mapGroundingRow(created), validation };
}

export async function duplicatePipelineGroundingRule(
  sourceIntentId: string,
  body: { targetIntentId: string },
  adminUserId: string
): Promise<PipelineGroundingRule> {
  const existing = await prisma.aIPipelineGroundingRulePolicy.findUnique({
    where: { intentId: sourceIntentId },
  });
  if (!existing) throw new Error('Grounding rule not found');
  const targetIntentId = body.targetIntentId.trim();
  await validateOrThrow('grounding_rule', 'duplicate', targetIntentId, {
    intentId: targetIntentId,
    requiredSources: existing.requiredSources,
    optionalSources: existing.optionalSources,
    requirementSummary: existing.requirementSummary,
  });

  const created = await prisma.aIPipelineGroundingRulePolicy.create({
    data: {
      intentId: targetIntentId,
      requiredSources: [...existing.requiredSources],
      optionalSources: [...existing.optionalSources],
      requirementSummary: existing.requirementSummary,
      enabled: existing.enabled,
      isSystem: false,
      archived: false,
      requiredTools: [...existing.requiredTools],
      minimumConfidence: existing.minimumConfidence,
      enforcementBehavior: existing.enforcementBehavior,
      createdByAdminId: adminUserId,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'grounding_rule',
    entityId: targetIntentId,
    action: 'duplicate',
    before: { sourceIntentId } as Prisma.InputJsonValue,
    after: created as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapGroundingRow(created);
}

export async function setPipelineGroundingArchived(
  intentId: string,
  archived: boolean,
  adminUserId: string
): Promise<PipelineGroundingRule> {
  const existing = await prisma.aIPipelineGroundingRulePolicy.findUnique({ where: { intentId } });
  if (!existing) throw new Error('Grounding rule not found');
  await validateOrThrow(
    'grounding_rule',
    'archive',
    intentId,
    { archived },
    existing as unknown as Record<string, unknown>
  );

  const updated = await prisma.aIPipelineGroundingRulePolicy.update({
    where: { intentId },
    data: {
      archived,
      enabled: archived ? false : existing.enabled,
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'grounding_rule',
    entityId: intentId,
    action: archived ? 'archive' : 'restore',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapGroundingRow(updated);
}

export async function setPipelineGroundingEnabled(
  intentId: string,
  enabled: boolean,
  adminUserId: string
): Promise<PipelineGroundingRule> {
  const existing = await prisma.aIPipelineGroundingRulePolicy.findUnique({ where: { intentId } });
  if (!existing) throw new Error('Grounding rule not found');

  const updated = await prisma.aIPipelineGroundingRulePolicy.update({
    where: { intentId },
    data: { enabled, updatedByAdminId: adminUserId },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'grounding_rule',
    entityId: intentId,
    action: enabled ? 'enable' : 'disable',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();
  return mapGroundingRow(updated);
}
