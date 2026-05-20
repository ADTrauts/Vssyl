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
  PipelineContextSourceId,
  PipelineEnforcementSettings,
  PipelineGroundingRule,
  PipelineIntentDefinition,
  PipelineIntentId,
  PipelineRetentionSettings,
  PipelineToolPolicy,
  PipelineToolId,
} from '../types/pipelineDiagnostics';
import { resolvePipelineEnforcementSettings } from './pipelineEnforcement';
import { getDefaultPipelineCatalog } from './pipelineCatalogDefaults';

const PIPELINE_INTENT_IDS: readonly PipelineIntentId[] = [
  'emotional_support',
  'local_discovery',
  'recommendation',
  'planning',
  'research',
  'personal_reflection',
  'business_operations',
  'technical_help',
  'workflow_action',
  'general_chat',
];

const PIPELINE_CONTEXT_SOURCE_IDS: readonly PipelineContextSourceId[] = [
  'user_memory',
  'profile',
  'recent_conversations',
  'active_goals',
  'location',
  'calendar',
  'drive_files',
  'business_context',
  'vssyl_place',
  'web_search',
  'module_context',
  'notifications_activity',
  'repo_context',
];

const PIPELINE_TOOL_IDS: readonly PipelineToolId[] = [
  'memory',
  'location',
  'place_search',
  'web_search',
  'list_drive_files',
  'share_file',
  'create_todo',
  'module_context',
  'business_context',
];

let cachedCatalog: PipelineCatalog | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 30_000;

function isPipelineIntentId(value: string): value is PipelineIntentId {
  return (PIPELINE_INTENT_IDS as readonly string[]).includes(value);
}

function isContextSourceId(value: string): value is PipelineContextSourceId {
  return (PIPELINE_CONTEXT_SOURCE_IDS as readonly string[]).includes(value);
}

function isToolId(value: string): value is PipelineToolId {
  return (PIPELINE_TOOL_IDS as readonly string[]).includes(value);
}

function filterIntentIds(values: string[]): PipelineIntentId[] {
  return values.filter(isPipelineIntentId);
}

function filterSourceIds(values: string[]): PipelineContextSourceId[] {
  return values.filter(isContextSourceId);
}

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
        await tx.aIPipelineIntentPolicy.create({
          data: {
            id: intent.id,
            name: intent.name,
            description: intent.description,
            triggerExamples: intent.triggerExamples,
            groundingRequired: intent.groundingRequired,
            enabled: intent.enabled,
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
          },
        });
      }

      for (const src of defaults.contextSources) {
        await tx.aIPipelineContextSourcePolicy.create({
          data: {
            id: src.id,
            label: src.label,
            description: src.description,
            enabled: src.enabled,
            wiredInTwin: src.wiredInTwin,
          },
        });
      }

      for (const policy of defaults.toolPolicies) {
        await tx.aIPipelineToolPolicyRow.create({
          data: {
            toolId: policy.toolId,
            purpose: policy.purpose,
            requiredIntents: policy.requiredIntents,
            optionalIntents: policy.optionalIntents,
            requiredPermissions: policy.requiredPermissions,
            fallbackBehavior: policy.fallbackBehavior,
            enabled: policy.enabled,
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
    intents: intents.map(
      (row): PipelineIntentDefinition => ({
        id: row.id as PipelineIntentId,
        name: row.name,
        description: row.description,
        triggerExamples: row.triggerExamples,
        groundingRequired: row.groundingRequired,
        enabled: row.enabled,
      })
    ),
    groundingRules: groundingRules.map(
      (row): PipelineGroundingRule => ({
        intentId: row.intentId as PipelineIntentId,
        requiredSources: filterSourceIds(row.requiredSources),
        optionalSources: filterSourceIds(row.optionalSources),
        requirementSummary: row.requirementSummary,
      })
    ),
    contextSources: contextSources.map(
      (row): PipelineContextSourceDefinition => ({
        id: row.id as PipelineContextSourceId,
        label: row.label,
        description: row.description,
        enabled: row.enabled,
        wiredInTwin: row.wiredInTwin,
      })
    ),
    toolPolicies: toolPolicies.map(
      (row): PipelineToolPolicy => ({
        toolId: row.toolId as PipelineToolId,
        purpose: row.purpose,
        requiredIntents: filterIntentIds(row.requiredIntents),
        optionalIntents: filterIntentIds(row.optionalIntents),
        requiredPermissions: row.requiredPermissions,
        fallbackBehavior: row.fallbackBehavior,
        enabled: row.enabled,
      })
    ),
    weakGenericPhrases:
      settings?.weakGenericPhrases?.length ? settings.weakGenericPhrases : defaults.weakGenericPhrases,
    enforcement: buildEnforcementFromSettingsRow(settings ?? undefined),
    retention: buildRetentionFromSettingsRow(settings ?? undefined),
  };

  return catalog;
}

export async function getEffectivePipelineCatalog(): Promise<PipelineCatalog> {
  try {
    await seedPipelinePoliciesIfEmpty();
    const catalog = await loadCatalogFromDb();
    setCache(catalog);
    return catalog;
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
  if (!isPipelineIntentId(intentId)) {
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

  return {
    id: updated.id as PipelineIntentId,
    name: updated.name,
    description: updated.description,
    triggerExamples: updated.triggerExamples,
    groundingRequired: updated.groundingRequired,
    enabled: updated.enabled,
  };
}

export async function updatePipelineGroundingRulePolicy(
  intentId: string,
  body: Partial<{
    requiredSources: string[];
    optionalSources: string[];
    requirementSummary: string;
  }>,
  adminUserId: string
): Promise<PipelineGroundingRule> {
  if (!isPipelineIntentId(intentId)) {
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

  return {
    intentId: updated.intentId as PipelineIntentId,
    requiredSources: filterSourceIds(updated.requiredSources),
    optionalSources: filterSourceIds(updated.optionalSources),
    requirementSummary: updated.requirementSummary,
  };
}

export async function updatePipelineContextSourcePolicy(
  sourceId: string,
  body: Partial<{
    label: string;
    description: string;
    enabled: boolean;
    wiredInTwin: boolean;
  }>,
  adminUserId: string
): Promise<PipelineContextSourceDefinition> {
  if (!isContextSourceId(sourceId)) {
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

  return {
    id: updated.id as PipelineContextSourceId,
    label: updated.label,
    description: updated.description,
    enabled: updated.enabled,
    wiredInTwin: updated.wiredInTwin,
  };
}

export async function updatePipelineToolPolicyRow(
  toolId: string,
  body: Partial<{
    purpose: string;
    requiredIntents: string[];
    optionalIntents: string[];
    requiredPermissions: string[];
    fallbackBehavior: string;
    enabled: boolean;
  }>,
  adminUserId: string
): Promise<PipelineToolPolicy> {
  if (!isToolId(toolId)) {
    throw new Error('Invalid tool id');
  }

  const existing = await prisma.aIPipelineToolPolicyRow.findUnique({ where: { toolId } });
  if (!existing) {
    throw new Error('Tool policy not found');
  }

  const updated = await prisma.aIPipelineToolPolicyRow.update({
    where: { toolId },
    data: {
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

  return {
    toolId: updated.toolId as PipelineToolId,
    purpose: updated.purpose,
    requiredIntents: filterIntentIds(updated.requiredIntents),
    optionalIntents: filterIntentIds(updated.optionalIntents),
    requiredPermissions: updated.requiredPermissions,
    fallbackBehavior: updated.fallbackBehavior,
    enabled: updated.enabled,
  };
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
