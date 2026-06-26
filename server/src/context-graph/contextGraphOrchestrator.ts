import { resolveBundle, type BundleResolveInput } from './bundleResolver.js';
import {
  composeKnowledgeFromContextBundles,
  orchestrateKnowledgeBundle,
  type OrchestrateKnowledgeBundleParams,
  type OrchestrateKnowledgeBundleResult,
} from '../knowledge/knowledgeCompositionOrchestrator.js';
import {
  ContextGraphForbiddenError,
  ContextGraphNotFoundError,
  resolveVLinkContainer,
} from './adapters/vlinkAdapter.js';
import type {
  AdapterContext,
  BundleResolveOptions,
  ContextBundleDescriptor,
  EntityRef,
  RootRef,
  TenantScope,
  VLinkContainerRef,
} from './contextGraphTypes.js';

export { ContextGraphForbiddenError, ContextGraphNotFoundError };

export {
  composeKnowledgeFromContextBundles,
  orchestrateKnowledgeBundle,
  type OrchestrateKnowledgeBundleParams,
  type OrchestrateKnowledgeBundleResult,
};

export interface ResolveVLinkBundleParams {
  userId: string;
  vlinkIdOrCode: string;
  options?: BundleResolveOptions;
}

export interface ResolveBundleFromRootParams {
  userId: string;
  root: RootRef;
  tenantScope: TenantScope;
  options?: BundleResolveOptions;
}

export async function resolveVLinkBundle(
  params: ResolveVLinkBundleParams
): Promise<ContextBundleDescriptor> {
  const ctx: AdapterContext = { userId: params.userId };
  const resolved = await resolveVLinkContainer(ctx, params.vlinkIdOrCode);
  if (!resolved) {
    const vlinkExists = await import('../services/vlinkService.js').then((m) =>
      m.findVLinkByIdOrCode(params.vlinkIdOrCode)
    );
    if (!vlinkExists) {
      throw new ContextGraphNotFoundError('V_Link not found');
    }
    throw new ContextGraphForbiddenError('Access denied');
  }

  const root: VLinkContainerRef = resolved.container;
  return resolveBundle({
    root,
    ctx,
    tenantScope: resolved.tenantScope,
    options: {
      ...params.options,
      kind: 'vlink',
      consumer: params.options?.consumer ?? 'hub_ui',
    },
  });
}

export async function resolveContextBundle(
  params: ResolveBundleFromRootParams
): Promise<ContextBundleDescriptor> {
  const ctx: AdapterContext = {
    userId: params.userId,
    dashboardId: params.tenantScope.dashboardId,
    businessId: params.tenantScope.businessId,
    householdId: params.tenantScope.householdId,
  };

  const input: BundleResolveInput = {
    root: params.root,
    ctx,
    tenantScope: params.tenantScope,
    options: {
      ...params.options,
      kind: params.options?.kind ?? 'resolved',
    },
  };

  return resolveBundle(input);
}

export function parseEntityRoot(body: unknown): EntityRef | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const root = record.root;
  if (!root || typeof root !== 'object') return null;
  const r = root as Record<string, unknown>;
  if (typeof r.moduleId !== 'string' || typeof r.entityType !== 'string' || typeof r.entityId !== 'string') {
    return null;
  }
  if ('kind' in r && r.kind === 'container') return null;
  return { moduleId: r.moduleId, entityType: r.entityType, entityId: r.entityId };
}

export function parseContainerRoot(body: unknown): VLinkContainerRef | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const root = record.root;
  if (!root || typeof root !== 'object') return null;
  const r = root as Record<string, unknown>;
  if (r.kind === 'container' && r.containerType === 'vlink' && typeof r.vlinkId === 'string') {
    return {
      kind: 'container',
      containerType: 'vlink',
      vlinkId: r.vlinkId,
      publicCode: typeof r.publicCode === 'string' ? r.publicCode : undefined,
    };
  }
  if (r.moduleId === 'vlink' && r.entityType === 'container' && typeof r.entityId === 'string') {
    return { kind: 'container', containerType: 'vlink', vlinkId: r.entityId };
  }
  return null;
}

export function parseTenantScope(body: unknown): TenantScope | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  const scope = record.tenantScope;
  if (!scope || typeof scope !== 'object') return null;
  const s = scope as Record<string, unknown>;
  if (typeof s.dashboardId !== 'string') return null;
  const scopeVal = s.scope;
  if (scopeVal !== 'PERSONAL' && scopeVal !== 'BUSINESS' && scopeVal !== 'HOUSEHOLD') {
    return null;
  }
  return {
    dashboardId: s.dashboardId,
    businessId: typeof s.businessId === 'string' ? s.businessId : s.businessId === null ? null : undefined,
    householdId:
      typeof s.householdId === 'string' ? s.householdId : s.householdId === null ? null : undefined,
    scope: scopeVal,
  };
}
