import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveBundle } from '../bundleResolver.js';
import {
  parseContainerRoot,
  parseEntityRoot,
  parseTenantScope,
  resolveContextBundle,
} from '../contextGraphOrchestrator.js';
import { CONTEXT_GRAPH_CONTRACT_VERSION, MAX_DEPTH } from '../contextGraphTypes.js';

vi.mock('../adapterRegistry.js', () => ({
  getAdapterForEntity: vi.fn(),
}));

vi.mock('../adapters/vlinkAdapter.js', () => ({
  resolveVLinkContainer: vi.fn(),
  listVLinkAttachmentEdges: vi.fn(),
}));

import { getAdapterForEntity } from '../adapterRegistry.js';

const mockedGetAdapter = vi.mocked(getAdapterForEntity);

describe('context graph bundle contract (CG-1C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAdapter.mockReturnValue({
      moduleId: 'todo',
      supportedEntityTypes: ['task'],
      getNode: vi.fn().mockResolvedValue({
        moduleId: 'todo',
        entityType: 'task',
        entityId: 't1',
        title: 'Task',
        permissions: { canRead: true, access: 'full' },
      }),
      getNeighbors: vi.fn().mockResolvedValue([]),
      getPermissions: vi.fn(),
      getSummary: vi.fn(),
    });
  });

  it('resolveContextBundle returns contract version 1.0 descriptor', async () => {
    const bundle = await resolveContextBundle({
      userId: 'u1',
      root: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
      tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
    });

    expect(bundle.version).toBe(CONTEXT_GRAPH_CONTRACT_VERSION);
    expect(bundle.bundleId).toBeTruthy();
    expect(bundle.createdAt).toBeTruthy();
    expect(bundle.tenantScope.dashboardId).toBe('d1');
    expect(bundle.permissionOutcome.gatesApplied.length).toBeGreaterThan(0);
    expect(bundle.provenance.sources).toBeDefined();
    expect(bundle.summaries.stats).toBeDefined();
  });

  it('resolveBundle includes composition metadata', async () => {
    const bundle = await resolveBundle({
      root: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      options: { depth: 1, nodeBudget: 50, edgeBudget: 50 },
    });

    expect(bundle.composition.depthRequested).toBe(1);
    expect(bundle.composition.nodeBudgetRequested).toBe(50);
    expect(bundle.composition.edgeBudgetRequested).toBe(50);
    expect(typeof bundle.composition.truncated).toBe('boolean');
  });

  it('caps depth at MAX_DEPTH', async () => {
    const bundle = await resolveBundle({
      root: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      options: { depth: 99 },
    });

    expect(bundle.composition.depthRequested).toBeLessThanOrEqual(MAX_DEPTH);
  });

  it('parseEntityRoot rejects malformed root', () => {
    expect(parseEntityRoot(null)).toBeNull();
    expect(parseEntityRoot({ root: { moduleId: 'x' } })).toBeNull();
    expect(parseEntityRoot({ root: { kind: 'container', vlinkId: 'vl' } })).toBeNull();
  });

  it('parseEntityRoot accepts valid entity ref', () => {
    expect(
      parseEntityRoot({
        root: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
      })
    ).toEqual({ moduleId: 'notes', entityType: 'note', entityId: 'n1' });
  });

  it('parseContainerRoot accepts vlink container', () => {
    expect(
      parseContainerRoot({
        root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
      })
    ).toEqual({
      kind: 'container',
      containerType: 'vlink',
      vlinkId: 'vl-1',
    });
  });

  it('parseTenantScope rejects invalid scope enum', () => {
    expect(
      parseTenantScope({
        tenantScope: { dashboardId: 'd1', scope: 'INVALID' },
      })
    ).toBeNull();
  });

  it('parseTenantScope accepts business scope with businessId', () => {
    expect(
      parseTenantScope({
        tenantScope: { dashboardId: 'd1', scope: 'BUSINESS', businessId: 'b1' },
      })
    ).toEqual({
      dashboardId: 'd1',
      scope: 'BUSINESS',
      businessId: 'b1',
      householdId: undefined,
    });
  });

  it('bundle kind resolved for entity root', async () => {
    const bundle = await resolveContextBundle({
      userId: 'u1',
      root: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
      tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      options: { kind: 'resolved' },
    });
    expect(bundle.kind).toBe('resolved');
  });

  it('permissionOutcome overall full for accessible root only', async () => {
    const bundle = await resolveContextBundle({
      userId: 'u1',
      root: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
      tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
    });
    expect(bundle.permissionOutcome.overall).toBe('full');
  });
});
