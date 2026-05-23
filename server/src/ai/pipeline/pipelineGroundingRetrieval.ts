/**
 * Phase 4 — supplemental retrieval for grounding (location + Place discoveries).
 */

import { geolocationService, type LocationData } from '../../services/geolocationService';
import { moduleAIContextService } from '../services/ModuleAIContextService';
import { logger } from '../../lib/logger';
import type {
  PipelineCatalog,
  PipelineContextRetrievedRecord,
  PipelineIntentId,
  PipelineToolPolicy,
  PipelineToolUsageRecord,
} from '../types/pipelineDiagnostics';
import {
  getGroundingRuleForIntentInCatalog,
  getIntentDefinitionFromCatalog,
} from './pipelineCatalogDefaults';
import {
  detectVLinkQuerySignals,
  fetchVLinkPipelineContext,
  mapVLinkPipelineContextToRetrieved,
  shouldPrioritizeVLinkContext,
} from '../context/vlinkPipelineContextService';
import { inferPipelineIntents } from './inferPipelineIntents';
import { optionalSourcesForInferredIntents } from './pipelineGroundingRuleReconcile';

export interface PipelineGroundingRetrievalInput {
  userId: string;
  userMessage: string;
  catalog: PipelineCatalog;
  clientIp?: string;
  businessId?: string;
  dashboardId?: string;
  householdId?: string;
  existingModuleContexts?: Record<string, unknown>;
  existingVLinkPipelineContext?: import('../context/vlinkPipelineContextService').VLinkPipelineContextResult;
}

export interface PipelineGroundingRetrievalResult {
  moduleContextsPatch: Record<string, unknown>;
  contextRetrieved: PipelineContextRetrievedRecord[];
  sourcesUsed: string[];
  toolsUsed: PipelineToolUsageRecord[];
  locationSummary?: string;
  vlinkPipelineContext?: import('../context/vlinkPipelineContextService').VLinkPipelineContextResult;
}

function isToolEnabled(catalog: PipelineCatalog, toolId: PipelineToolPolicy['toolId']): boolean {
  return catalog.toolPolicies.some((p) => p.toolId === toolId && p.enabled);
}

function isSourceEnabled(catalog: PipelineCatalog, sourceId: string): boolean {
  return catalog.contextSources.some((s) => s.id === sourceId && s.enabled);
}

function requiredSourcesForIntents(
  catalog: PipelineCatalog,
  intentIds: PipelineIntentId[]
): Set<string> {
  const sources = new Set<string>();
  for (const intentId of intentIds) {
    const rule = getGroundingRuleForIntentInCatalog(catalog, intentId);
    if (!rule) continue;
    for (const s of rule.requiredSources) sources.add(s);
    for (const s of rule.optionalSources) sources.add(s);
  }
  return sources;
}

async function resolveLocation(clientIp?: string): Promise<LocationData | null> {
  if (!clientIp) return null;
  try {
    return await geolocationService.detectUserLocation(clientIp);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('Pipeline location retrieval failed', {
      operation: 'pipeline_grounding_location',
      error: { message: err.message },
    });
    return null;
  }
}

function formatLocationSummary(location: LocationData): string {
  return `${location.city}, ${location.region}, ${location.country}`;
}

export async function runPipelineGroundingRetrieval(
  input: PipelineGroundingRetrievalInput
): Promise<PipelineGroundingRetrievalResult> {
  const result: PipelineGroundingRetrievalResult = {
    moduleContextsPatch: {},
    contextRetrieved: [],
    sourcesUsed: [],
    toolsUsed: [],
  };

  const inferredIntents = inferPipelineIntents(input.userMessage);
  const groundingIntents = inferredIntents.filter(
    (id) => getIntentDefinitionFromCatalog(input.catalog, id)?.groundingRequired === true
  );
  const optionalSourcesForInferred = optionalSourcesForInferredIntents(input.catalog, inferredIntents);

  if (groundingIntents.length > 0) {
    const neededSources = requiredSourcesForIntents(input.catalog, groundingIntents);

    if (
      neededSources.has('location') &&
      isSourceEnabled(input.catalog, 'location') &&
      isToolEnabled(input.catalog, 'location')
    ) {
      const location = await resolveLocation(input.clientIp);
      if (location) {
        result.locationSummary = formatLocationSummary(location);
        result.contextRetrieved.push({
          source: 'location',
          provider: 'ip_geolocation',
          itemCount: 1,
        });
        result.sourcesUsed.push('location');
        result.toolsUsed.push({ name: 'location', round: 0, success: true });
      } else {
        result.toolsUsed.push({ name: 'location', round: 0, success: false });
      }
    }

    const needsPlace =
      (neededSources.has('vssyl_place') || groundingIntents.includes('local_discovery')) &&
      isSourceEnabled(input.catalog, 'vssyl_place') &&
      isToolEnabled(input.catalog, 'place_search');

    if (needsPlace) {
      try {
        const placeContext = await moduleAIContextService.fetchModuleContext(
          'place',
          'place_discoveries',
          input.userId,
          input.businessId ? { businessId: input.businessId } : undefined
        );
        result.moduleContextsPatch.place = {
          ...(typeof input.existingModuleContexts?.place === 'object'
            ? (input.existingModuleContexts.place as Record<string, unknown>)
            : {}),
          pipelineGroundingBoost: true,
          discoveries: placeContext.data,
          providerName: placeContext.providerName,
        };
        result.contextRetrieved.push({
          source: 'vssyl_place',
          provider: 'place_discoveries',
          itemCount: 1,
        });
        result.sourcesUsed.push('vssyl_place', 'place');
        result.toolsUsed.push({ name: 'place_search', round: 0, success: true });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        void logger.warn('Pipeline place_search retrieval failed', {
          operation: 'pipeline_grounding_place_search',
          error: { message: err.message },
        });
        result.toolsUsed.push({ name: 'place_search', round: 0, success: false });
      }
    }

    if (neededSources.has('web_search') && isToolEnabled(input.catalog, 'web_search')) {
      result.toolsUsed.push({ name: 'web_search', round: 0, success: false });
    }
  }

  const vlinkSignals = detectVLinkQuerySignals(input.userMessage, {
    intentBoost: inferredIntents.some((id) =>
      ['planning', 'workflow_action', 'business_operations'].includes(id)
    ),
  });
  const shouldFetchVLink =
    optionalSourcesForInferred.has('vlink') ||
    shouldPrioritizeVLinkContext(vlinkSignals) ||
    vlinkSignals.vlCodeReferenced;

  if (
    shouldFetchVLink &&
    isSourceEnabled(input.catalog, 'vlink') &&
    !input.existingVLinkPipelineContext
  ) {
    try {
      const vlinkContext = await fetchVLinkPipelineContext({
        userId: input.userId,
        query: input.userMessage,
        businessId: input.businessId,
        dashboardId: input.dashboardId,
        householdId: input.householdId,
        catalogEnabled: true,
        intentBoost: vlinkSignals.intentBoost,
      });
      result.vlinkPipelineContext = vlinkContext;
      result.contextRetrieved.push(...mapVLinkPipelineContextToRetrieved(vlinkContext));
      if (vlinkContext.vlinksUsed > 0) {
        result.sourcesUsed.push('vlink');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.warn('Pipeline vlink retrieval failed', {
        operation: 'pipeline_grounding_vlink',
        error: { message: err.message },
      });
    }
  } else if (input.existingVLinkPipelineContext) {
    result.vlinkPipelineContext = input.existingVLinkPipelineContext;
    result.contextRetrieved.push(
      ...mapVLinkPipelineContextToRetrieved(input.existingVLinkPipelineContext)
    );
    if (input.existingVLinkPipelineContext.vlinksUsed > 0) {
      result.sourcesUsed.push('vlink');
    }
  }

  return result;
}
