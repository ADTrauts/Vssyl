/**
 * DB-backed AI pipeline policy catalog with code defaults and audit logging.
 */

import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type {
  PipelineCatalog,
  PipelineContextSourceDefinition,
  PipelineEnforcementSettings,
  PipelineGroundingRule,
  PipelineIntentDefinition,
  PipelineRetentionSettings,
  PipelineToolPolicy,
} from '../types/pipelineDiagnostics';
import { resolvePipelineEnforcementSettings } from './pipelineEnforcement';
import { getDefaultPipelineCatalog, SOURCE_TO_TOOLS } from './pipelineCatalogDefaults';
import {
  filterCatalogArchived,
  mapGroundingRow,
  mapIntentRow,
  mapSourceRow,
  mapToolRow,
  seedIsSystemForIntent,
  seedIsSystemForSource,
  seedIsSystemForTool,
  seedRuntimeKindForTool,
} from './pipelineCatalogMappers';
import {
  capabilitiesToJson,
  defaultContextSourceCapabilities,
  defaultIntentCapabilities,
  defaultToolCapabilities,
} from './pipelineRegistryCapabilities';
import { buildCatalogValidationSummary } from './pipelineRegistryValidator';
import { isSystemIntentId, isValidRegistrySlug } from './pipelineRegistryIds';

let cachedCatalog: PipelineCatalog | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 30_000;

function mapEnforcementModeFromDb(
  mode: string | null | undefined
): PipelineEnforcementSettings['enforcementMode'] {
  switch (mode) {
    case 'DISCLOSE':
      return 'disclose';
    case 'BLOCK':
      return 'block';
    case 'REGENERATE':
      return 'regenerate';
    default:
      return 'off';
  }
}

function mapEnforcementModeToDb(
  mode: PipelineEnforcementSettings['enforcementMode']
): 'OFF' | 'DISCLOSE' | 'BLOCK' | 'REGENERATE' {
  switch (mode) {
    case 'disclose':
      return 'DISCLOSE';
    case 'block':
      return 'BLOCK';
    case 'regenerate':
      return 'REGENERATE';
    default:
      return 'OFF';
  }
}

const DEFAULT_RETENTION: PipelineRetentionSettings = {
  diagnosticRetentionDays: 90,
  exportRedactUserMessages: true,
  exportRedactResponsePreviews: true,
};

function buildRetentionFromSettingsRow(
  settings:
    | {
        diagnosticRetentionDays: number;
        exportRedactUserMessages: boolean;
        exportRedactResponsePreviews: boolean;
      }
    | null
    | undefined
): PipelineRetentionSettings {
  if (!settings) return DEFAULT_RETENTION;
  return {
    diagnosticRetentionDays: settings.diagnosticRetentionDays,
    exportRedactUserMessages: settings.exportRedactUserMessages,
    exportRedactResponsePreviews: settings.exportRedactResponsePreviews,
  };
}

function buildEnforcementFromSettingsRow(
  settings: { enforcementEnabled: boolean; enforcementMode: string } | null | undefined
): PipelineEnforcementSettings {
  return resolvePipelineEnforcementSettings(
    settings
      ? {
          enforcementEnabled: settings.enforcementEnabled,
          enforcementMode: mapEnforcementModeFromDb(settings.enforcementMode),
        }
      : null
  );
}

export function invalidatePipelineCatalogCache(): void {
  cachedCatalog = null;
  cacheLoadedAt = 0;
}

export function getPipelineCatalogSync(): PipelineCatalog {
  if (cachedCatalog && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedCatalog;
  }
  return getDefaultPipelineCatalog();
}

function setCache(catalog: PipelineCatalog): void {
  cachedCatalog = catalog;
  cacheLoadedAt = Date.now();
}

export async function seedPipelinePoliciesIfEmpty(): Promise<boolean> {
  const [intentCount, settingsRow] = await Promise.all([
    prisma.aIPipelineIntentPolicy.count(),
    prisma.aIPipelineSettings.findUnique({ where: { id: 'default' } }),
  ]);

  if (intentCount > 0 && settingsRow) {
    return false;
  }

  const defaults = getDefaultPipelineCatalog();

  await prisma.$transaction(async (tx) => {
    if (intentCount === 0) {
      for (const intent of defaults.intents) {
        const caps = defaultIntentCapabilities(intent.id);
        await tx.aIPipelineIntentPolicy.create({
          data: {
            id: intent.id,
            name: intent.name,
            description: intent.description,
            triggerExamples: intent.triggerExamples,
            groundingRequired: intent.groundingRequired,
            enabled: intent.enabled,
            isSystem: seedIsSystemForIntent(intent.id),
            archived: false,
            capabilities: capabilitiesToJson(caps) as Prisma.InputJsonValue,
          },
        });
      }

      for (const rule of defaults.groundingRules) {
        await tx.aIPipelineGroundingRulePolicy.create({
          data: {
            intentId: rule.intentId,
            requiredSources: rule.requiredSources,
            optionalSources: rule.optionalSources,
            requirementSummary: rule.requirementSummary,
            enabled: true,
            isSystem: seedIsSystemForIntent(rule.intentId),
            archived: false,
            requiredTools: SOURCE_TO_TOOLS[rule.requiredSources[0] ?? ''] ?? [],
          },
        });
      }

      for (const src of defaults.contextSources) {
        const lifecycle = src.wiredInTwin ? 'live' : 'planned';
        const caps = defaultContextSourceCapabilities(src.wiredInTwin, lifecycle);
        const mapped = SOURCE_TO_TOOLS[src.id] ?? [];
        await tx.aIPipelineContextSourcePolicy.create({
          data: {
            id: src.id,
            label: src.label,
            description: src.description,
            enabled: src.enabled,
            wiredInTwin: src.wiredInTwin,
            isSystem: seedIsSystemForSource(src.id),
            archived: false,
            sourceType: 'platform',
            lifecycleStatus: lifecycle,
            mappedTools: mapped,
            capabilities: capabilitiesToJson(caps) as Prisma.InputJsonValue,
          },
        });
      }

      for (const policy of defaults.toolPolicies) {
        const runtimeKind = seedRuntimeKindForTool(policy.toolId);
        const caps = defaultToolCapabilities(runtimeKind);
        await tx.aIPipelineToolPolicyRow.create({
          data: {
            toolId: policy.toolId,
            displayName: policy.toolId,
            purpose: policy.purpose,
            requiredIntents: policy.requiredIntents,
            optionalIntents: policy.optionalIntents,
            requiredPermissions: policy.requiredPermissions,
            fallbackBehavior: policy.fallbackBehavior,
            enabled: policy.enabled,
            isSystem: seedIsSystemForTool(policy.toolId),
            archived: false,
            runtimeKind,
            capabilities: capabilitiesToJson(caps) as Prisma.InputJsonValue,
          },
        });
      }
    }

    if (!settingsRow) {
      await tx.aIPipelineSettings.create({
        data: {
          id: 'default',
          weakGenericPhrases: [...defaults.weakGenericPhrases],
          enforcementEnabled: false,
          enforcementMode: 'OFF',
          diagnosticRetentionDays: DEFAULT_RETENTION.diagnosticRetentionDays,
          exportRedactUserMessages: DEFAULT_RETENTION.exportRedactUserMessages,
          exportRedactResponsePreviews: DEFAULT_RETENTION.exportRedactResponsePreviews,
        },
      });
    }
  });

  return true;
}

async function loadCatalogFromDb(): Promise<PipelineCatalog> {
  const defaults = getDefaultPipelineCatalog();

  const [intents, groundingRules, contextSources, toolPolicies, settings] = await Promise.all([
    prisma.aIPipelineIntentPolicy.findMany({ orderBy: { id: 'asc' } }),
    prisma.aIPipelineGroundingRulePolicy.findMany({ orderBy: { intentId: 'asc' } }),
    prisma.aIPipelineContextSourcePolicy.findMany({ orderBy: { id: 'asc' } }),
    prisma.aIPipelineToolPolicyRow.findMany({ orderBy: { toolId: 'asc' } }),
    prisma.aIPipelineSettings.findUnique({ where: { id: 'default' } }),
  ]);

  if (intents.length === 0) {
    return defaults;
  }

  const catalog: PipelineCatalog = {
    intents: intents.map((row) => mapIntentRow(row)),
    groundingRules: groundingRules.map((row) => mapGroundingRow(row)),
    contextSources: contextSources.map((row) => mapSourceRow(row)),
    toolPolicies: toolPolicies.map((row) => mapToolRow(row)),
    weakGenericPhrases:
      settings?.weakGenericPhrases?.length ? settings.weakGenericPhrases : defaults.weakGenericPhrases,
    enforcement: buildEnforcementFromSettingsRow(settings ?? undefined),
    retention: buildRetentionFromSettingsRow(settings ?? undefined),
    validationSummary: buildCatalogValidationSummary({
      intents: intents.map((row) => mapIntentRow(row)),
      groundingRules: groundingRules.map((row) => mapGroundingRow(row)),
      contextSources: contextSources.map((row) => mapSourceRow(row)),
      toolPolicies: toolPolicies.map((row) => mapToolRow(row)),
      weakGenericPhrases: defaults.weakGenericPhrases,
    }),
  };

  return catalog;
}

export async function getEffectivePipelineCatalog(options?: {
  includeArchived?: boolean;
}): Promise<PipelineCatalog> {
  try {
    await seedPipelinePoliciesIfEmpty();
    const catalog = await loadCatalogFromDb();
    const filtered = filterCatalogArchived(catalog, options?.includeArchived === true);
    setCache(filtered);
    return filtered;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('Failed to load pipeline catalog from DB; using defaults', {
      operation: 'pipeline_catalog_load_fallback',
      error: { message: err.message },
    });
    const defaults = getDefaultPipelineCatalog();
    setCache(defaults);
    return defaults;
  }
}

export async function refreshPipelineCatalogCache(): Promise<PipelineCatalog> {
  invalidatePipelineCatalogCache();
  return getEffectivePipelineCatalog();
}

export type PipelinePolicyEntityType =
  | 'intent'
  | 'grounding_rule'
  | 'context_source'
  | 'tool_policy'
  | 'settings';

export async function writePipelinePolicyAudit(params: {
  adminUserId: string;
  entityType: PipelinePolicyEntityType;
  entityId: string;
  action: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.aIPipelinePolicyAuditLog.create({
    data: {
      id: randomUUID(),
      adminUserId: params.adminUserId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      before: params.before ?? undefined,
      after: params.after ?? undefined,
    },
  });
}

export interface PipelinePolicyAuditEntry {
  id: string;
  adminUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  before: unknown;
  after: unknown;
  createdAt: string;
  adminEmail?: string;
}

export async function listPipelinePolicyAudit(params: {
  limit?: number;
  entityType?: string;
  entityId?: string;
}): Promise<PipelinePolicyAuditEntry[]> {
  const limit = Math.min(params.limit ?? 50, 100);
  const rows = await prisma.aIPipelinePolicyAuditLog.findMany({
    where: {
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.entityId ? { entityId: params.entityId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      adminUser: { select: { email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    adminUserId: row.adminUserId,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    before: row.before,
    after: row.after,
    createdAt: row.createdAt.toISOString(),
    adminEmail: row.adminUser.email ?? undefined,
  }));
}

export async function updatePipelineIntentPolicy(
  intentId: string,
  body: Partial<{
    name: string;
    description: string;
    triggerExamples: string[];
    groundingRequired: boolean;
    enabled: boolean;
  }>,
  adminUserId: string
): Promise<PipelineIntentDefinition> {
  if (!isValidRegistrySlug(intentId) && !isSystemIntentId(intentId)) {
    throw new Error('Invalid intent id');
  }

  const existing = await prisma.aIPipelineIntentPolicy.findUnique({ where: { id: intentId } });
  if (!existing) {
    throw new Error('Intent policy not found');
  }

  const updated = await prisma.aIPipelineIntentPolicy.update({
    where: { id: intentId },
    data: {
      ...(typeof body.name === 'string' ? { name: body.name } : {}),
      ...(typeof body.description === 'string' ? { description: body.description } : {}),
      ...(Array.isArray(body.triggerExamples) ? { triggerExamples: body.triggerExamples } : {}),
      ...(typeof body.groundingRequired === 'boolean'
        ? { groundingRequired: body.groundingRequired }
        : {}),
      ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'intent',
    entityId: intentId,
    action: 'update',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();

  return mapIntentRow(updated);
}

export async function updatePipelineGroundingRulePolicy(
  intentId: string,
  body: Partial<{
    requiredSources: string[];
    optionalSources: string[];
    requirementSummary: string;
    requiredTools: string[];
    enabled: boolean;
    minimumConfidence: string | null;
    enforcementBehavior: string | null;
  }>,
  adminUserId: string
): Promise<PipelineGroundingRule> {
  if (!intentId.trim()) {
    throw new Error('Invalid intent id');
  }

  const existing = await prisma.aIPipelineGroundingRulePolicy.findUnique({ where: { intentId } });
  if (!existing) {
    throw new Error('Grounding rule not found');
  }

  const updated = await prisma.aIPipelineGroundingRulePolicy.update({
    where: { intentId },
    data: {
      ...(Array.isArray(body.requiredSources)
        ? { requiredSources: body.requiredSources }
        : {}),
      ...(Array.isArray(body.optionalSources)
        ? { optionalSources: body.optionalSources }
        : {}),
      ...(typeof body.requirementSummary === 'string'
        ? { requirementSummary: body.requirementSummary }
        : {}),
      ...(Array.isArray(body.requiredTools) ? { requiredTools: body.requiredTools } : {}),
      ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
      ...(body.minimumConfidence !== undefined ? { minimumConfidence: body.minimumConfidence } : {}),
      ...(body.enforcementBehavior !== undefined
        ? { enforcementBehavior: body.enforcementBehavior }
        : {}),
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'grounding_rule',
    entityId: intentId,
    action: 'update',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();

  return mapGroundingRow(updated);
}

export async function updatePipelineContextSourcePolicy(
  sourceId: string,
  body: Partial<{
    label: string;
    description: string;
    enabled: boolean;
    wiredInTwin: boolean;
    sourceType: string | null;
    lifecycleStatus: string | null;
    retrievalPriority: number;
    supportedIntents: string[];
    permissionsRequired: string[];
    sensitivityLevel: string | null;
    mappedTools: string[];
  }>,
  adminUserId: string
): Promise<PipelineContextSourceDefinition> {
  if (!isValidRegistrySlug(sourceId)) {
    throw new Error('Invalid context source id');
  }

  const existing = await prisma.aIPipelineContextSourcePolicy.findUnique({ where: { id: sourceId } });
  if (!existing) {
    throw new Error('Context source policy not found');
  }

  const updated = await prisma.aIPipelineContextSourcePolicy.update({
    where: { id: sourceId },
    data: {
      ...(typeof body.label === 'string' ? { label: body.label } : {}),
      ...(typeof body.description === 'string' ? { description: body.description } : {}),
      ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
      ...(typeof body.wiredInTwin === 'boolean' ? { wiredInTwin: body.wiredInTwin } : {}),
      ...(body.sourceType !== undefined ? { sourceType: body.sourceType } : {}),
      ...(body.lifecycleStatus !== undefined ? { lifecycleStatus: body.lifecycleStatus } : {}),
      ...(typeof body.retrievalPriority === 'number'
        ? { retrievalPriority: body.retrievalPriority }
        : {}),
      ...(Array.isArray(body.supportedIntents) ? { supportedIntents: body.supportedIntents } : {}),
      ...(Array.isArray(body.permissionsRequired)
        ? { permissionsRequired: body.permissionsRequired }
        : {}),
      ...(body.sensitivityLevel !== undefined ? { sensitivityLevel: body.sensitivityLevel } : {}),
      ...(Array.isArray(body.mappedTools) ? { mappedTools: body.mappedTools } : {}),
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'context_source',
    entityId: sourceId,
    action: 'update',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();

  return mapSourceRow(updated);
}

export async function updatePipelineToolPolicyRow(
  toolId: string,
  body: Partial<{
    displayName: string | null;
    purpose: string;
    requiredIntents: string[];
    optionalIntents: string[];
    requiredPermissions: string[];
    fallbackBehavior: string;
    enabled: boolean;
    riskLevel: string | null;
    requiresGrounding: boolean;
    rateLimitPerMinute: number | null;
    runtimeKind: string | null;
  }>,
  adminUserId: string
): Promise<PipelineToolPolicy> {
  if (!isValidRegistrySlug(toolId)) {
    throw new Error('Invalid tool id');
  }

  const existing = await prisma.aIPipelineToolPolicyRow.findUnique({ where: { toolId } });
  if (!existing) {
    throw new Error('Tool policy not found');
  }

  const updated = await prisma.aIPipelineToolPolicyRow.update({
    where: { toolId },
    data: {
      ...(typeof body.displayName === 'string' ? { displayName: body.displayName } : {}),
      ...(typeof body.purpose === 'string' ? { purpose: body.purpose } : {}),
      ...(Array.isArray(body.requiredIntents) ? { requiredIntents: body.requiredIntents } : {}),
      ...(Array.isArray(body.optionalIntents) ? { optionalIntents: body.optionalIntents } : {}),
      ...(Array.isArray(body.requiredPermissions)
        ? { requiredPermissions: body.requiredPermissions }
        : {}),
      ...(typeof body.fallbackBehavior === 'string'
        ? { fallbackBehavior: body.fallbackBehavior }
        : {}),
      ...(typeof body.enabled === 'boolean' ? { enabled: body.enabled } : {}),
      ...(body.riskLevel !== undefined ? { riskLevel: body.riskLevel } : {}),
      ...(typeof body.requiresGrounding === 'boolean'
        ? { requiresGrounding: body.requiresGrounding }
        : {}),
      ...(body.rateLimitPerMinute !== undefined
        ? { rateLimitPerMinute: body.rateLimitPerMinute }
        : {}),
      ...(body.runtimeKind !== undefined ? { runtimeKind: body.runtimeKind } : {}),
      updatedByAdminId: adminUserId,
    },
  });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'tool_policy',
    entityId: toolId,
    action: 'update',
    before: existing as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();

  return mapToolRow(updated);
}

export async function updatePipelineSettings(
  body: {
    weakGenericPhrases?: string[];
    enforcementEnabled?: boolean;
    enforcementMode?: PipelineEnforcementSettings['enforcementMode'];
  },
  adminUserId: string
): Promise<{
  weakGenericPhrases: string[];
  enforcement: PipelineEnforcementSettings;
}> {
  const existing = await prisma.aIPipelineSettings.findUnique({ where: { id: 'default' } });
  const phrases =
    Array.isArray(body.weakGenericPhrases)
      ? body.weakGenericPhrases.map((p) => String(p).trim()).filter(Boolean)
      : (existing?.weakGenericPhrases ?? getDefaultPipelineCatalog().weakGenericPhrases);

  const enforcementEnabled =
    typeof body.enforcementEnabled === 'boolean'
      ? body.enforcementEnabled
      : (existing?.enforcementEnabled ?? false);
  const enforcementMode =
    body.enforcementMode !== undefined
      ? mapEnforcementModeToDb(body.enforcementMode)
      : (existing?.enforcementMode ?? 'OFF');

  const updated = existing
    ? await prisma.aIPipelineSettings.update({
        where: { id: 'default' },
        data: {
          weakGenericPhrases: phrases,
          enforcementEnabled,
          enforcementMode,
          updatedByAdminId: adminUserId,
        },
      })
    : await prisma.aIPipelineSettings.create({
        data: {
          id: 'default',
          weakGenericPhrases: phrases,
          enforcementEnabled,
          enforcementMode,
          updatedByAdminId: adminUserId,
        },
      });

  await writePipelinePolicyAudit({
    adminUserId,
    entityType: 'settings',
    entityId: 'default',
    action: 'update',
    before: (existing ?? null) as unknown as Prisma.InputJsonValue,
    after: updated as unknown as Prisma.InputJsonValue,
  });

  await refreshPipelineCatalogCache();

  return {
    weakGenericPhrases: updated.weakGenericPhrases,
    enforcement: buildEnforcementFromSettingsRow(updated),
  };
}

export async function getPipelineEnforcementSettings(): Promise<PipelineEnforcementSettings> {
  const catalog = await getEffectivePipelineCatalog();
  return catalog.enforcement ?? resolvePipelineEnforcementSettings(null);
}
