/**
 * V_Link first-class AI pipeline context — confirmed relationships only (not suggestions).
 */

import { VLinkStatus } from '@prisma/client';
import { listVLinkEntities } from '../../services/vlinkService';
import { normalizePublicCodeInput } from '../../services/vlinkPublicCodeService';
import { prisma } from '../../lib/prisma';
import type { PersistedVLinkForEntityLinking } from './entityLinking';
import type { PipelineContextRetrievedRecord } from '../types/pipelineDiagnostics';

const VL_CODE_PATTERN = /\bVL-[0-9]{6,12}\b/i;
const RELATIONSHIP_QUERY_PATTERN =
  /\b(vlink|v_link|v-link|linked|relationship|connected to|everything connected|related to|workstream|initiative|qbr|project context|meeting prep|operational summary|context summary|what(?:'s| is) connected)\b/i;

export interface VLinkPipelineLinkedEntityRef {
  entityType: string;
  entityId: string;
  moduleId: string;
  title: string;
  access: 'full' | 'restricted';
  url?: string;
}

export interface VLinkPipelineContextItem {
  vlinkId: string;
  publicCode: string;
  title: string;
  scope: string;
  parentVLinkId: string | null;
  description: string | null;
  updatedAt: Date;
  linkedEntities: VLinkPipelineLinkedEntityRef[];
  restrictedLinkedEntityCount: number;
  accessibleLinkedEntityCount: number;
}

export type VLinkPipelineSkipReason =
  | 'source_disabled'
  | 'no_membership'
  | 'no_relevant_vlinks'
  | 'vl_code_not_found'
  | 'none';

export interface VLinkPipelineContextResult {
  items: VLinkPipelineContextItem[];
  vlinksConsidered: number;
  vlinksUsed: number;
  linkedEntitiesConsidered: number;
  accessibleLinkedEntities: number;
  restrictedLinkedEntities: number;
  suggestionsIgnored: number;
  querySignals: {
    vlCodeReferenced: boolean;
    relationshipQuery: boolean;
    intentBoost: boolean;
  };
  skippedReason?: VLinkPipelineSkipReason;
}

export interface FetchVLinkPipelineContextParams {
  userId: string;
  query: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  catalogEnabled: boolean;
  intentBoost?: boolean;
  limit?: number;
}

export function detectVLinkQuerySignals(
  query: string,
  options?: { intentBoost?: boolean }
): VLinkPipelineContextResult['querySignals'] {
  const text = (query || '').trim();
  return {
    vlCodeReferenced: VL_CODE_PATTERN.test(text),
    relationshipQuery: RELATIONSHIP_QUERY_PATTERN.test(text),
    intentBoost: options?.intentBoost === true,
  };
}

export function shouldPrioritizeVLinkContext(signals: VLinkPipelineContextResult['querySignals']): boolean {
  return signals.vlCodeReferenced || signals.relationshipQuery || signals.intentBoost;
}

function extractReferencedPublicCodes(query: string): string[] {
  const matches = query.match(/\bVL-[0-9]{6,12}\b/gi) ?? [];
  return [...new Set(matches.map((m) => normalizePublicCodeInput(m)))];
}

function scopeWhere(params: FetchVLinkPipelineContextParams) {
  if (params.businessId) {
    return { businessId: params.businessId };
  }
  if (params.householdId) {
    return { householdId: params.householdId };
  }
  if (params.dashboardId) {
    return { dashboardId: params.dashboardId };
  }
  return {};
}

export async function fetchVLinkPipelineContext(
  params: FetchVLinkPipelineContextParams
): Promise<VLinkPipelineContextResult> {
  const signals = detectVLinkQuerySignals(params.query, { intentBoost: params.intentBoost });
  const emptyBase: VLinkPipelineContextResult = {
    items: [],
    vlinksConsidered: 0,
    vlinksUsed: 0,
    linkedEntitiesConsidered: 0,
    accessibleLinkedEntities: 0,
    restrictedLinkedEntities: 0,
    suggestionsIgnored: 0,
    querySignals: signals,
  };

  if (!params.catalogEnabled) {
    return { ...emptyBase, skippedReason: 'source_disabled' };
  }

  const referencedCodes = extractReferencedPublicCodes(params.query);
  if (
    referencedCodes.length === 0 &&
    !shouldPrioritizeVLinkContext(signals)
  ) {
    return { ...emptyBase, skippedReason: 'none' };
  }

  const limit = Math.min(params.limit ?? 10, 20);
  const scopeFilter = scopeWhere(params);

  const vlinks = await prisma.vLink.findMany({
    where: {
      deletedAt: null,
      status: VLinkStatus.ACTIVE,
      members: { some: { userId: params.userId } },
      ...scopeFilter,
      ...(referencedCodes.length > 0
        ? { publicCode: { in: referencedCodes } }
        : shouldPrioritizeVLinkContext(signals)
          ? {}
          : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: referencedCodes.length > 0 ? 5 : limit,
    select: {
      id: true,
      publicCode: true,
      title: true,
      scope: true,
      parentVLinkId: true,
      description: true,
      updatedAt: true,
    },
  });

  if (vlinks.length === 0) {
    return {
      ...emptyBase,
      skippedReason: referencedCodes.length > 0 ? 'no_relevant_vlinks' : 'no_membership',
    };
  }

  const items: VLinkPipelineContextItem[] = [];
  let linkedEntitiesConsidered = 0;
  let accessibleLinkedEntities = 0;
  let restrictedLinkedEntities = 0;

  for (const vlink of vlinks) {
    const entities = await listVLinkEntities(vlink.id, params.userId);
    linkedEntitiesConsidered += entities.length;

    const linkedEntities: VLinkPipelineLinkedEntityRef[] = entities.map((entity) => {
      if (entity.access === 'full') {
        accessibleLinkedEntities += 1;
      } else {
        restrictedLinkedEntities += 1;
      }
      return {
        entityType: entity.entityType,
        entityId: entity.entityId,
        moduleId: entity.moduleId ?? entity.entityType,
        title: entity.title ?? entity.entityType,
        access: entity.access,
        url: entity.access === 'full' ? entity.url : undefined,
      };
    });

    items.push({
      vlinkId: vlink.id,
      publicCode: vlink.publicCode,
      title: vlink.title,
      scope: vlink.scope,
      parentVLinkId: vlink.parentVLinkId,
      description: vlink.description,
      updatedAt: vlink.updatedAt,
      linkedEntities,
      restrictedLinkedEntityCount: linkedEntities.filter((e) => e.access === 'restricted').length,
      accessibleLinkedEntityCount: linkedEntities.filter((e) => e.access === 'full').length,
    });
  }

  const filteredItems =
    referencedCodes.length > 0
      ? items.filter((item) => referencedCodes.includes(item.publicCode))
      : items;

  if (filteredItems.length === 0) {
    return {
      ...emptyBase,
      vlinksConsidered: vlinks.length,
      linkedEntitiesConsidered,
      accessibleLinkedEntities,
      restrictedLinkedEntities,
      skippedReason: referencedCodes.length > 0 ? 'vl_code_not_found' : 'no_relevant_vlinks',
    };
  }

  return {
    items: filteredItems,
    vlinksConsidered: vlinks.length,
    vlinksUsed: filteredItems.length,
    linkedEntitiesConsidered,
    accessibleLinkedEntities,
    restrictedLinkedEntities,
    suggestionsIgnored: 0,
    querySignals: signals,
    skippedReason: undefined,
  };
}

export function toPersistedVLinksForEntityLinking(
  context?: VLinkPipelineContextResult | null
): PersistedVLinkForEntityLinking[] {
  if (!context?.items.length) return [];
  return context.items.map((item) => ({
    vlinkId: item.vlinkId,
    title: item.title,
    publicCode: item.publicCode,
    entityTypes: [...new Set(item.linkedEntities.map((e) => e.entityType))],
    linkKind: 'confirmed_vlink' as const,
    confidence: 0.98,
  }));
}

export function mapVLinkPipelineContextToRetrieved(
  context?: VLinkPipelineContextResult | null
): PipelineContextRetrievedRecord[] {
  if (!context) return [];
  if (context.skippedReason === 'source_disabled') {
    return [{ source: 'vlink', provider: 'recent_vlinks', itemCount: 0 }];
  }
  if (context.skippedReason === 'vl_code_not_found') {
    return [{ source: 'vlink', provider: 'recent_vlinks:vl_code_not_found', itemCount: 0 }];
  }
  if (context.vlinksUsed === 0) {
    return [{ source: 'vlink', provider: 'recent_vlinks', itemCount: 0 }];
  }
  return [
    {
      source: 'vlink',
      provider: 'recent_vlinks',
      itemCount: context.vlinksUsed,
    },
  ];
}
