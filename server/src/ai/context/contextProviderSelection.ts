/**
 * Pure provider selection for context orchestration (Phase A).
 */

import type { AIQueryAnalysis } from '../../../../shared/src/types/module-ai-context';
import type {
  ContextRetrievalCost,
  ProviderSelectionDiagnostic,
} from '../../../../shared/src/types/ai-context-provider-contract';
import type { PipelineCatalog, PipelineIntentId } from '../types/pipelineDiagnostics';
import { getGroundingRuleForIntentInCatalog } from '../pipeline/pipelineCatalogDefaults';
import {
  requiresBusinessId,
  resolveModulesToFetch,
  type MatchedModuleInput,
} from '../services/moduleContextProviderSelection';
import { legacyProviderCanHandle } from './legacyProviderCanHandle';
import {
  buildProviderId,
  DEFAULT_PROVIDER_SUPPORTED_INTENTS,
  type RegisteredContextProvider,
} from './contextProviderRegistry';
import {
  getProvidersForPipelineSource,
  isModuleBackedPipelineSource,
} from './pipelineSourceProviderMap';

const COST_RANK: Record<ContextRetrievalCost, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export interface ContextSelectionBudget {
  maxLatencyMs?: number;
  maxOptionalProviders?: number;
  tokenBudget?: number;
}

export interface ProviderSelectionCandidate {
  provider: RegisteredContextProvider;
  moduleMatch?: MatchedModuleInput;
  requiredForGrounding: boolean;
  groundingSourceId?: string;
}

export interface ProviderSelectionPlan {
  required: ProviderSelectionCandidate[];
  optional: ProviderSelectionCandidate[];
  diagnostics: ProviderSelectionDiagnostic[];
}

export function requiredSourcesForGroundingIntents(
  catalog: PipelineCatalog,
  intentIds: PipelineIntentId[]
): Set<string> {
  const sources = new Set<string>();
  for (const intentId of intentIds) {
    const rule = getGroundingRuleForIntentInCatalog(catalog, intentId);
    if (!rule || rule.archived || rule.enabled === false) continue;
    for (const sourceId of rule.requiredSources) {
      sources.add(sourceId);
    }
  }
  return sources;
}

export function optionalSourcesForGroundingIntents(
  catalog: PipelineCatalog,
  intentIds: PipelineIntentId[]
): Set<string> {
  const sources = new Set<string>();
  for (const intentId of intentIds) {
    const rule = getGroundingRuleForIntentInCatalog(catalog, intentId);
    if (!rule || rule.archived || rule.enabled === false) continue;
    for (const sourceId of rule.optionalSources) {
      sources.add(sourceId);
    }
  }
  return sources;
}

function relevanceScore(relevance: MatchedModuleInput['relevance']): number {
  return relevance === 'high' ? 3 : relevance === 'medium' ? 2 : 1;
}

export function providerMatchesIntents(
  provider: RegisteredContextProvider,
  detectedIntents: string[],
  moduleRelevance?: MatchedModuleInput['relevance']
): boolean {
  const intents = detectedIntents.length > 0 ? detectedIntents : ['general_chat'];
  const supported = provider.supportedIntents.length > 0
    ? provider.supportedIntents
    : [...DEFAULT_PROVIDER_SUPPORTED_INTENTS];

  if (supported.some((i) => intents.includes(i))) {
    return true;
  }

  if (
    intents.length === 1 &&
    intents[0] === 'general_chat' &&
    moduleRelevance &&
    (moduleRelevance === 'high' || moduleRelevance === 'medium')
  ) {
    return true;
  }

  return false;
}

function rankCandidates(candidates: ProviderSelectionCandidate[]): ProviderSelectionCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.requiredForGrounding !== b.requiredForGrounding) {
      return a.requiredForGrounding ? -1 : 1;
    }
    const priorityDelta = b.provider.priority - a.provider.priority;
    if (priorityDelta !== 0) return priorityDelta;

    const relA = a.moduleMatch ? relevanceScore(a.moduleMatch.relevance) : 0;
    const relB = b.moduleMatch ? relevanceScore(b.moduleMatch.relevance) : 0;
    if (relB !== relA) return relB - relA;

    const confA = a.moduleMatch?.confidence ?? 0;
    const confB = b.moduleMatch?.confidence ?? 0;
    if (confB !== confA) return confB - confA;

    return COST_RANK[a.provider.retrievalCost] - COST_RANK[b.provider.retrievalCost];
  });
}

function pushDiagnostic(
  diagnostics: ProviderSelectionDiagnostic[],
  entry: ProviderSelectionDiagnostic
): void {
  diagnostics.push(entry);
}

function selectProviderForModule(
  moduleId: string,
  query: string,
  providers: RegisteredContextProvider[],
  detectedIntents: string[],
  moduleMatch: MatchedModuleInput | undefined,
  diagnostics: ProviderSelectionDiagnostic[],
  requiredForGrounding: boolean
): RegisteredContextProvider | undefined {
  for (const provider of providers) {
    pushDiagnostic(diagnostics, {
      providerId: provider.id,
      moduleId,
      providerName: provider.providerName,
      phase: 'considered',
      requiredForGrounding,
      retrievalCost: provider.retrievalCost,
    });
  }

  const intentEligible = providers.filter((p) =>
    providerMatchesIntents(p, detectedIntents, moduleMatch?.relevance)
  );

  for (const provider of providers) {
    if (!intentEligible.includes(provider)) {
      pushDiagnostic(diagnostics, {
        providerId: provider.id,
        moduleId,
        providerName: provider.providerName,
        phase: 'skipped',
        reason: 'intent_mismatch',
        requiredForGrounding,
        retrievalCost: provider.retrievalCost,
      });
    }
  }

  const canHandleEligible = intentEligible.filter((p) =>
    legacyProviderCanHandle(
      moduleId,
      p.providerName,
      query,
      intentEligible.map((x) => x.config)
    )
  );

  for (const provider of intentEligible) {
    if (!canHandleEligible.includes(provider)) {
      pushDiagnostic(diagnostics, {
        providerId: provider.id,
        moduleId,
        providerName: provider.providerName,
        phase: 'skipped',
        reason: 'can_handle_false',
        requiredForGrounding,
        retrievalCost: provider.retrievalCost,
      });
    }
  }

  if (canHandleEligible.length === 0) {
    return undefined;
  }

  const configs = canHandleEligible.map((p) => p.config);
  const legacyPick = canHandleEligible.find((p) =>
    legacyProviderCanHandle(moduleId, p.providerName, query, configs)
  );

  return legacyPick ?? canHandleEligible[0];
}

function sourceAllowed(sourceId: string, filter?: Set<string>): boolean {
  if (!filter || filter.size === 0) return true;
  return filter.has(sourceId);
}

export function buildProviderSelectionPlan(input: {
  query: string;
  analysis: AIQueryAnalysis;
  detectedIntents: PipelineIntentId[];
  catalog: PipelineCatalog;
  providersByModule: Map<string, RegisteredContextProvider[]>;
  installedModuleIds: string[];
  businessId?: string;
  requiredSourceIds: Set<string>;
  optionalSourceIds: Set<string>;
  budget?: ContextSelectionBudget;
  /** When set, only module-backed pipeline sources in this set are considered. */
  sourceFilter?: Set<string>;
  /** When false, skip keyword/@mention module matches (grounding-only pass). */
  includeQueryMatchedModules?: boolean;
}): ProviderSelectionPlan {
  const diagnostics: ProviderSelectionDiagnostic[] = [];
  const required: ProviderSelectionCandidate[] = [];
  const optional: ProviderSelectionCandidate[] = [];
  const moduleChosen = new Set<string>();

  const matchedModules = input.analysis.matchedModules as MatchedModuleInput[];
  const modulesToFetch =
    input.includeQueryMatchedModules === false
      ? []
      : resolveModulesToFetch(matchedModules, input.query);

  const addCandidate = (
    provider: RegisteredContextProvider,
    moduleMatch: MatchedModuleInput | undefined,
    requiredForGrounding: boolean,
    groundingSourceId?: string
  ) => {
    if (providerRequiresBusiness(provider.moduleId, input.businessId)) {
      pushDiagnostic(diagnostics, {
        providerId: provider.id,
        moduleId: provider.moduleId,
        providerName: provider.providerName,
        phase: 'skipped',
        reason: 'business_scope_required',
        requiredForGrounding,
      });
      return;
    }

    if (moduleChosen.has(provider.moduleId)) {
      pushDiagnostic(diagnostics, {
        providerId: provider.id,
        moduleId: provider.moduleId,
        providerName: provider.providerName,
        phase: 'skipped',
        reason: 'duplicate_module',
        requiredForGrounding,
      });
      return;
    }

    const selected = selectProviderForModule(
      provider.moduleId,
      input.query,
      input.providersByModule.get(provider.moduleId) ?? [provider],
      input.detectedIntents,
      moduleMatch,
      diagnostics,
      requiredForGrounding
    );

    if (!selected || selected.id !== provider.id) {
      return;
    }

    moduleChosen.add(provider.moduleId);
    pushDiagnostic(diagnostics, {
      providerId: selected.id,
      moduleId: selected.moduleId,
      providerName: selected.providerName,
      phase: 'selected',
      requiredForGrounding,
      retrievalCost: selected.retrievalCost,
    });

    const candidate: ProviderSelectionCandidate = {
      provider: selected,
      moduleMatch,
      requiredForGrounding,
      groundingSourceId,
    };

    if (requiredForGrounding) {
      required.push(candidate);
    } else {
      optional.push(candidate);
    }
  };

  for (const sourceId of input.requiredSourceIds) {
    if (!sourceAllowed(sourceId, input.sourceFilter)) continue;
    if (!isModuleBackedPipelineSource(sourceId)) continue;
    for (const ref of getProvidersForPipelineSource(sourceId)) {
      if (!input.installedModuleIds.includes(ref.moduleId)) {
        pushDiagnostic(diagnostics, {
          providerId: buildProviderId(ref.moduleId, ref.providerName),
          moduleId: ref.moduleId,
          providerName: ref.providerName,
          phase: 'skipped',
          reason: 'not_installed',
          requiredForGrounding: true,
        });
        continue;
      }

      let provider =
        input.providersByModule.get(ref.moduleId)?.find((p) => p.providerName === ref.providerName) ??
        undefined;

      if (!provider && ref.fallbackProviderName) {
        provider = input.providersByModule
          .get(ref.moduleId)
          ?.find((p) => p.providerName === ref.fallbackProviderName);
      }

      if (!provider) {
        pushDiagnostic(diagnostics, {
          providerId: buildProviderId(ref.moduleId, ref.providerName),
          moduleId: ref.moduleId,
          providerName: ref.providerName,
          phase: 'skipped',
          reason: 'not_found',
          requiredForGrounding: true,
        });
        continue;
      }

      const match = matchedModules.find((m) => m.moduleId === ref.moduleId);
      addCandidate(provider, match, true, sourceId);
    }
  }

  for (const match of modulesToFetch) {
    if (moduleChosen.has(match.moduleId)) continue;
    const providers = input.providersByModule.get(match.moduleId);
    if (!providers || providers.length === 0) {
      pushDiagnostic(diagnostics, {
        providerId: buildProviderId(match.moduleId, 'unknown'),
        moduleId: match.moduleId,
        providerName: 'unknown',
        phase: 'skipped',
        reason: 'not_found',
      });
      continue;
    }

    const sourceRequired = [...input.requiredSourceIds].some((sid) => {
      const refs = getProvidersForPipelineSource(sid);
      return refs.some((r) => r.moduleId === match.moduleId);
    });

    const picked = selectProviderForModule(
      match.moduleId,
      input.query,
      providers,
      input.detectedIntents,
      match,
      diagnostics,
      sourceRequired
    );

    if (!picked) continue;

    addCandidate(picked, match, sourceRequired);
  }

  for (const sourceId of input.optionalSourceIds) {
    if (!sourceAllowed(sourceId, input.sourceFilter)) continue;
    if (!isModuleBackedPipelineSource(sourceId)) continue;
    for (const ref of getProvidersForPipelineSource(sourceId)) {
      if (moduleChosen.has(ref.moduleId)) continue;
      if (!input.installedModuleIds.includes(ref.moduleId)) continue;

      const provider = input.providersByModule
        .get(ref.moduleId)
        ?.find(
          (p) =>
            p.providerName === ref.providerName ||
            p.providerName === ref.fallbackProviderName
        );

      if (!provider) continue;

      const match = matchedModules.find((m) => m.moduleId === ref.moduleId);
      addCandidate(provider, match, false, sourceId);
    }
  }

  const maxOptional = input.budget?.maxOptionalProviders ?? 4;
  const rankedOptional = rankCandidates(optional);
  const trimmedOptional = rankedOptional.slice(0, maxOptional);

  for (const dropped of rankedOptional.slice(maxOptional)) {
    moduleChosen.delete(dropped.provider.moduleId);
    pushDiagnostic(diagnostics, {
      providerId: dropped.provider.id,
      moduleId: dropped.provider.moduleId,
      providerName: dropped.provider.providerName,
      phase: 'skipped',
      reason: 'budget_exceeded',
      requiredForGrounding: false,
      retrievalCost: dropped.provider.retrievalCost,
    });
  }

  return {
    required: rankCandidates(required),
    optional: trimmedOptional,
    diagnostics,
  };
}

function providerRequiresBusiness(moduleId: string, businessId?: string): boolean {
  return requiresBusinessId(moduleId) && !businessId;
}

export function applyLatencyBudgetToOptional(
  optional: ProviderSelectionCandidate[],
  diagnostics: ProviderSelectionDiagnostic[],
  maxLatencyMs: number,
  latencyByProviderId: Map<string, number>
): ProviderSelectionCandidate[] {
  let elapsed = 0;
  const kept: ProviderSelectionCandidate[] = [];

  for (const candidate of optional) {
    const latency = latencyByProviderId.get(candidate.provider.id) ?? 0;
    if (elapsed + latency > maxLatencyMs && kept.length > 0) {
      pushDiagnostic(diagnostics, {
        providerId: candidate.provider.id,
        moduleId: candidate.provider.moduleId,
        providerName: candidate.provider.providerName,
        phase: 'skipped',
        reason: 'budget_exceeded',
        requiredForGrounding: false,
        retrievalCost: candidate.provider.retrievalCost,
      });
      continue;
    }
    elapsed += latency;
    kept.push(candidate);
  }

  return kept;
}
