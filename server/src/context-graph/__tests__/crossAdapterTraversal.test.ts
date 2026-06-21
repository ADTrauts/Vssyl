import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveBundle } from '../bundleResolver.js';
import type { ContextGraphAdapter, ContextGraphNode } from '../contextGraphTypes.js';

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

function mockAdapter(
  partial: Partial<ContextGraphAdapter> & Pick<ContextGraphAdapter, 'moduleId'>
): ContextGraphAdapter {
  return {
    supportedEntityTypes: [],
    getNode: vi.fn(),
    getNeighbors: vi.fn().mockResolvedValue([]),
    getPermissions: vi.fn(),
    getSummary: vi.fn(),
    ...partial,
  } as ContextGraphAdapter;
}

describe('context graph cross-adapter traversal (CG-1B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('V_Link → Note attachment hydrates via notes adapter', async () => {
    mockedResolveVLink.mockResolvedValue({
      container: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
      node: {
        moduleId: 'vlink',
        entityType: 'container',
        entityId: 'vl-1',
        title: 'Hub',
        permissions: { canRead: true, access: 'full' },
      },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    mockedListEdges.mockResolvedValue([
      {
        edgeId: 'e-note',
        edgeType: 'vlink.attachment',
        relationshipClass: 'association',
        source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
        target: { moduleId: 'notes', entityType: 'note', entityId: 'note-1' },
        direction: 'outbound',
        grantsContentAccess: false,
      },
    ]);

    const noteNode: ContextGraphNode = {
      moduleId: 'notes',
      entityType: 'note',
      entityId: 'note-1',
      title: 'Meeting notes',
      permissions: { canRead: true, access: 'full' },
    };

    mockedGetAdapter.mockImplementation((moduleId, entityType) => {
      if (moduleId === 'notes' && entityType === 'note') {
        return mockAdapter({
          moduleId: 'notes',
          getNode: vi.fn().mockResolvedValue(noteNode),
        });
      }
      return null;
    });

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
      ctx: { userId: 'user-1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1, kind: 'vlink' },
    });

    expect(bundle.nodes).toHaveLength(2);
    expect(bundle.nodes.some((n) => 'moduleId' in n.descriptor && n.descriptor.moduleId === 'notes')).toBe(true);
  });

  it('V_Link → Chat conversation attachment', async () => {
    mockedResolveVLink.mockResolvedValue({
      container: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-2' },
      node: {
        moduleId: 'vlink',
        entityType: 'container',
        entityId: 'vl-2',
        title: 'Chat hub',
        permissions: { canRead: true, access: 'full' },
      },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    mockedListEdges.mockResolvedValue([
      {
        edgeId: 'e-chat',
        edgeType: 'vlink.attachment',
        relationshipClass: 'association',
        source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-2' },
        target: { moduleId: 'chat', entityType: 'conversation', entityId: 'conv-1' },
        direction: 'outbound',
        grantsContentAccess: false,
      },
    ]);

    mockedGetAdapter.mockImplementation((moduleId, entityType) => {
      if (moduleId === 'chat' && entityType === 'conversation') {
        return mockAdapter({
          moduleId: 'chat',
          getNode: vi.fn().mockResolvedValue({
            moduleId: 'chat',
            entityType: 'conversation',
            entityId: 'conv-1',
            title: 'Team chat',
            permissions: { canRead: true, access: 'full' },
          }),
        });
      }
      return null;
    });

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-2' },
      ctx: { userId: 'user-1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    expect(bundle.nodes.some((n) => 'moduleId' in n.descriptor && n.descriptor.moduleId === 'chat')).toBe(true);
  });

  it('Note root with notebook.link neighbor to drive file', async () => {
    const noteAdapter = mockAdapter({
      moduleId: 'notes',
      getNode: vi.fn().mockResolvedValue({
        moduleId: 'notes',
        entityType: 'note',
        entityId: 'note-1',
        title: 'Linked note',
        permissions: { canRead: true, access: 'full' },
      }),
      getNeighbors: vi.fn().mockResolvedValue([
        {
          edgeId: 'nl-1',
          edgeType: 'notebook.link',
          relationshipClass: 'reference',
          source: { moduleId: 'notes', entityType: 'note', entityId: 'note-1' },
          target: { moduleId: 'drive', entityType: 'file', entityId: 'file-1' },
          direction: 'outbound',
          grantsContentAccess: false,
        },
      ]),
    });

    const driveAdapter = mockAdapter({
      moduleId: 'drive',
      getNode: vi.fn().mockResolvedValue({
        moduleId: 'drive',
        entityType: 'file',
        entityId: 'file-1',
        title: 'doc.pdf',
        permissions: { canRead: true, access: 'full' },
      }),
    });

    mockedGetAdapter.mockImplementation((moduleId, entityType) => {
      if (moduleId === 'notes' && entityType === 'note') return noteAdapter;
      if (moduleId === 'drive' && entityType === 'file') return driveAdapter;
      return null;
    });

    const bundle = await resolveBundle({
      root: { moduleId: 'notes', entityType: 'note', entityId: 'note-1' },
      ctx: { userId: 'user-1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1 },
    });

    expect(bundle.nodes).toHaveLength(2);
    expect(bundle.edges.some((e) => e.edge.edgeType === 'notebook.link')).toBe(true);
  });

  it('omits denied chat attachment from vlink bundle', async () => {
    mockedResolveVLink.mockResolvedValue({
      container: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-3' },
      node: {
        moduleId: 'vlink',
        entityType: 'container',
        entityId: 'vl-3',
        title: 'Private',
        permissions: { canRead: true, access: 'full' },
      },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    mockedListEdges.mockResolvedValue([
      {
        edgeId: 'e-denied',
        edgeType: 'vlink.attachment',
        relationshipClass: 'association',
        source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-3' },
        target: { moduleId: 'chat', entityType: 'conversation', entityId: 'conv-secret' },
        direction: 'outbound',
        grantsContentAccess: false,
      },
    ]);

    mockedGetAdapter.mockReturnValue(
      mockAdapter({
        moduleId: 'chat',
        getNode: vi.fn().mockResolvedValue({
          moduleId: 'chat',
          entityType: 'conversation',
          entityId: 'conv-secret',
          title: 'Hidden',
          permissions: { canRead: false, access: 'denied' },
        }),
      })
    );

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-3' },
      ctx: { userId: 'user-1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    expect(bundle.nodes).toHaveLength(1);
    expect(bundle.composition.nodesOmitted).toBe(1);
  });
});
