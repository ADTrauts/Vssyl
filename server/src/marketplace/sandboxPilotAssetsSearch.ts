import {
  SANDBOX_PILOT_ASSETS_MODULE_ID,
  SEARCH_DELEGATE_CONTRACT_VERSION,
  type PartnerSearchDelegateRequest,
  type PartnerSearchDelegateSuccessResponse,
  type PartnerSearchResultItem,
} from 'shared/types/search-delegate';

export interface SandboxPilotAsset {
  id: string;
  businessId: string;
  name: string;
  serialNumber?: string;
  location?: string;
  category?: string;
  status: 'active' | 'retired';
  updatedAt: string;
}

/** In-memory sandbox SoR — business-scoped asset records for pilot only. */
const SANDBOX_ASSETS: SandboxPilotAsset[] = [
  {
    id: 'ast_forklift_12',
    businessId: 'sandbox-business-a',
    name: 'Forklift #12',
    serialNumber: 'FL-2024-012',
    location: 'Warehouse A',
    category: 'equipment',
    status: 'active',
    updatedAt: '2026-06-20T14:00:00.000Z',
  },
  {
    id: 'ast_pallet_jack_3',
    businessId: 'sandbox-business-a',
    name: 'Pallet Jack #3',
    serialNumber: 'PJ-2023-003',
    location: 'Warehouse A',
    category: 'equipment',
    status: 'active',
    updatedAt: '2026-06-18T09:30:00.000Z',
  },
  {
    id: 'ast_laptop_44',
    businessId: 'sandbox-business-b',
    name: 'Laptop #44',
    serialNumber: 'LT-2025-044',
    location: 'Office B',
    category: 'it',
    status: 'active',
    updatedAt: '2026-06-19T11:15:00.000Z',
  },
];

function scoreAsset(asset: SandboxPilotAsset, query: string): number {
  const q = query.toLowerCase();
  const fields = [asset.name, asset.serialNumber, asset.location, asset.category]
    .filter(Boolean)
    .map((f) => f!.toLowerCase());

  if (asset.name.toLowerCase() === q) return 1;
  if (asset.name.toLowerCase().startsWith(q)) return 0.9;
  if (fields.some((f) => f.includes(q))) return 0.75;
  return 0;
}

function toResultItem(
  asset: SandboxPilotAsset,
  businessId: string,
  relevanceScore: number
): PartnerSearchResultItem {
  return {
    id: asset.id,
    title: asset.name,
    description: [asset.location, asset.serialNumber].filter(Boolean).join(' — '),
    type: 'asset',
    url: `/business/${businessId}/workspace/${SANDBOX_PILOT_ASSETS_MODULE_ID}?entity=${asset.id}`,
    relevanceScore,
    lastModified: asset.updatedAt,
    permissions: [{ type: 'read', granted: true }],
    metadata: {
      serialNumber: asset.serialNumber,
      location: asset.location,
      category: asset.category,
      status: asset.status,
    },
  };
}

/**
 * Internal sandbox search handler — no outbound HTTP.
 */
export function executeSandboxPilotAssetsSearch(
  request: PartnerSearchDelegateRequest
): PartnerSearchDelegateSuccessResponse {
  const businessId = request.context.businessId;
  if (!businessId) {
    return {
      success: true,
      contractVersion: SEARCH_DELEGATE_CONTRACT_VERSION,
      results: [],
      meta: { durationMs: 0, totalMatches: 0 },
    };
  }

  const query = request.query.trim().toLowerCase();
  const limit = request.limit;

  const matches = SANDBOX_ASSETS.filter(
    (a) => a.businessId === businessId && a.status === 'active'
  )
    .map((a) => ({ asset: a, score: scoreAsset(a, query) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const results = matches.map((m) => toResultItem(m.asset, businessId, m.score));

  return {
    success: true,
    contractVersion: SEARCH_DELEGATE_CONTRACT_VERSION,
    results,
    meta: {
      durationMs: 1,
      totalMatches: results.length,
      truncated: results.length >= limit,
    },
  };
}

/** Test helper — list sandbox business ids with assets */
export function getSandboxPilotBusinessIds(): string[] {
  return [...new Set(SANDBOX_ASSETS.map((a) => a.businessId))];
}
