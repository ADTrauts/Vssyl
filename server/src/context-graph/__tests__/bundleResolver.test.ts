import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveBundle } from '../bundleResolver.js';
import type { ContextGraphAdapter, ContextGraphNode, EntityRef, NeighborEdge } from '../contextGraphTypes.js';

vi.mock('../adapterRegistry.js', () => ({
  getAdapterForEntity: vi.fn(),
}));

vi.mock('../adapters/vlinkAdapter.js', () => ({
  resolveVLinkContainer: vi.fn(),
  listVLinkAttachmentEdges: vi.fn(),
}));

import { getAdapterForEntity } from '../adapterRegistry.js';
import { listVLinkAttachmentEdges, resolveVLinkContainer } from '../adapters/vlinkAdapter.js';

const mockedGetAdapter = vi.mocked(getAdapterForEntity);
const mockedResolveVLink = vi.mocked(resolveVLinkContainer);
const mockedListEdges = vi.mocked(listVLinkAttachmentEdges);

describe('context graph bundle resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves vlink bundle with attachments and deduplicates nodes', async () => {
    mockedResolveVLink.mockResolvedValue({
      container: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1', publicCode: 'VL-100' },
      node: {
        moduleId: 'vlink',
        entityType: 'container',
        entityId: 'vl-1',
        title: 'Project',
        permissions: { canRead: true, access: 'full' },
      },
      tenantScope: {
        dashboardId: 'dash-1',
        scope: 'PERSONAL',
      },
    });

    const target: EntityRef = { moduleId: 'drive', entityType: 'file', entityId: 'file-1' };
    mockedListEdges.mockResolvedValue([
      {
        edgeId: 'edge-1',
        edgeType: 'vlink.attachment',
        relationshipClass: 'association',
        source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
        target,
        direction: 'outbound',
        grantsContentAccess: false,
      },
    ]);

    const attachmentNode: ContextGraphNode = {
      moduleId: 'drive',
      entityType: 'file',
      entityId: 'file-1',
      title: 'Receipt.pdf',
      permissions: { canRead: true, access: 'full' },
    };

    const driveAdapter: Pick<ContextGraphAdapter, 'getNode'> = {
      getNode: vi.fn().mockResolvedValue(attachmentNode),
    };
    mockedGetAdapter.mockReturnValue(driveAdapter as unknown as ContextGraphAdapter);

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
      ctx: { userId: 'user-1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1, kind: 'vlink' },
    });

    expect(bundle.kind).toBe('vlink');
    expect(bundle.nodes).toHaveLength(2);
    expect(bundle.edges).toHaveLength(1);
    expect(bundle.permissionOutcome.overall).toBe('full');
    expect(bundle.composition.depthUsed).toBe(1);
  });

  it('omits denied attachment nodes from bundle', async () => {
    mockedResolveVLink.mockResolvedValue({
      container: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-2' },
      node: {
        moduleId: 'vlink',
        entityType: 'container',
        entityId: 'vl-2',
        title: 'Private',
        permissions: { canRead: true, access: 'full' },
      },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    const target: EntityRef = { moduleId: 'drive', entityType: 'file', entityId: 'secret' };
    mockedListEdges.mockResolvedValue([
      {
        edgeId: 'e1',
        edgeType: 'vlink.attachment',
        relationshipClass: 'association',
        source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-2' },
        target,
        direction: 'outbound',
        grantsContentAccess: false,
      },
    ]);

    mockedGetAdapter.mockReturnValue({
      getNode: vi.fn().mockResolvedValue({
        moduleId: 'drive',
        entityType: 'file',
        entityId: 'secret',
        title: 'Hidden',
        permissions: { canRead: false, access: 'denied' },
      }),
    } as unknown as ContextGraphAdapter);

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-2' },
      ctx: { userId: 'user-1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    expect(bundle.nodes).toHaveLength(1);
    expect(bundle.composition.nodesOmitted).toBe(1);
    expect(bundle.permissionOutcome.omittedNodes).toBe(1);
  });

  it('resolves entity root with neighbors', async () => {
    const root: EntityRef = { moduleId: 'todo', entityType: 'task', entityId: 'task-1' };
    const neighborEdge: NeighborEdge = {
      edgeId: 'e2',
      edgeType: 'vlink.attachment',
      relationshipClass: 'association',
      source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-3' },
      target: root,
      direction: 'inbound',
      grantsContentAccess: false,
    };

    mockedGetAdapter.mockReturnValue({
      getNode: vi.fn().mockResolvedValue({
        moduleId: 'todo',
        entityType: 'task',
        entityId: 'task-1',
        title: 'Task A',
        permissions: { canRead: true, access: 'full' },
      }),
      getNeighbors: vi.fn().mockResolvedValue([neighborEdge]),
    } as unknown as ContextGraphAdapter);

    const bundle = await resolveBundle({
      root,
      ctx: { userId: 'user-1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1 },
    });

    expect(bundle.nodes[0].role).toBe('root');
    expect(bundle.edges).toHaveLength(1);
  });
});
