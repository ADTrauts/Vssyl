import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveBundle } from '../bundleResolver.js';
import { resolveVLinkBundle } from '../contextGraphOrchestrator.js';
import type { ContextGraphAdapter, ContextGraphNode } from '../contextGraphTypes.js';

vi.mock('../adapterRegistry.js', () => ({
  getAdapterForEntity: vi.fn(),
}));

vi.mock('../adapters/vlinkAdapter.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../adapters/vlinkAdapter.js')>();
  return {
    ...actual,
    resolveVLinkContainer: vi.fn(),
    listVLinkAttachmentEdges: vi.fn(),
  };
});

vi.mock('../../services/vlinkService.js', () => ({
  findVLinkByIdOrCode: vi.fn(),
  getVLinksForEntity: vi.fn(),
}));

import { findVLinkByIdOrCode } from '../../services/vlinkService.js';
import { getAdapterForEntity } from '../adapterRegistry.js';
import {
  listVLinkAttachmentEdges,
  resolveVLinkContainer,
  ContextGraphForbiddenError,
} from '../adapters/vlinkAdapter.js';

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

function node(
  moduleId: string,
  entityType: string,
  entityId: string,
  access: 'full' | 'restricted' | 'denied',
  title = 'Item'
): ContextGraphNode {
  const canRead = access !== 'denied';
  return {
    moduleId,
    entityType,
    entityId,
    title,
    permissions: { canRead, access },
  };
}

function vlinkRootSetup(vlinkId = 'vl-root'): void {
  mockedResolveVLink.mockResolvedValue({
    container: { kind: 'container', containerType: 'vlink', vlinkId },
    node: node('vlink', 'container', vlinkId, 'full', 'Root VLink'),
    tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
  });
}

function attachmentEdge(
  target: { moduleId: string; entityType: string; entityId: string },
  vlinkId = 'vl-root'
) {
  return {
    edgeId: `edge-${target.moduleId}-${target.entityId}`,
    edgeType: 'vlink.attachment',
    relationshipClass: 'association',
    source: { kind: 'container' as const, containerType: 'vlink' as const, vlinkId },
    target,
    direction: 'outbound' as const,
    grantsContentAccess: false,
  };
}

describe('context graph permission traversal matrix (CG-1C / CG-F-007)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vlinkRootSetup();
  });

  it('M1: vlink → denied drive attachment omitted', async () => {
    mockedListEdges.mockResolvedValue([
      attachmentEdge({ moduleId: 'drive', entityType: 'file', entityId: 'f-denied' }),
    ]);
    mockedGetAdapter.mockReturnValue(
      mockAdapter({
        moduleId: 'drive',
        getNode: vi.fn().mockResolvedValue(node('drive', 'file', 'f-denied', 'denied')),
      })
    );

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-root' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1 },
    });

    expect(bundle.nodes).toHaveLength(1);
    expect(bundle.composition.nodesOmitted).toBe(1);
  });

  it('M2: vlink → denied note attachment omitted', async () => {
    mockedListEdges.mockResolvedValue([
      attachmentEdge({ moduleId: 'notes', entityType: 'note', entityId: 'n-denied' }),
    ]);
    mockedGetAdapter.mockReturnValue(
      mockAdapter({
        moduleId: 'notes',
        getNode: vi.fn().mockResolvedValue(node('notes', 'note', 'n-denied', 'denied')),
      })
    );

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-root' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    expect(bundle.nodes).toHaveLength(1);
    expect(bundle.permissionOutcome.omittedNodes).toBe(1);
  });

  it('M3: vlink → denied chat attachment omitted', async () => {
    mockedListEdges.mockResolvedValue([
      attachmentEdge({ moduleId: 'chat', entityType: 'conversation', entityId: 'c-denied' }),
    ]);
    mockedGetAdapter.mockReturnValue(
      mockAdapter({
        moduleId: 'chat',
        getNode: vi.fn().mockResolvedValue(node('chat', 'conversation', 'c-denied', 'denied')),
      })
    );

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-root' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    expect(bundle.nodes.every((n) => !('moduleId' in n.descriptor && n.descriptor.moduleId === 'chat'))).toBe(
      true
    );
  });

  it('M4: note → drive via notebook.link with denied file omitted', async () => {
    const noteAdapter = mockAdapter({
      moduleId: 'notes',
      getNode: vi.fn().mockResolvedValue(node('notes', 'note', 'n1', 'full', 'Note')),
      getNeighbors: vi.fn().mockResolvedValue([
        {
          edgeId: 'nl-1',
          edgeType: 'notebook.link',
          relationshipClass: 'reference',
          source: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
          target: { moduleId: 'drive', entityType: 'file', entityId: 'f-denied' },
          direction: 'outbound',
          grantsContentAccess: false,
        },
      ]),
    });
    mockedGetAdapter.mockImplementation((moduleId, entityType) => {
      if (moduleId === 'notes' && entityType === 'note') return noteAdapter;
      if (moduleId === 'drive' && entityType === 'file') {
        return mockAdapter({
          moduleId: 'drive',
          getNode: vi.fn().mockResolvedValue(node('drive', 'file', 'f-denied', 'denied')),
        });
      }
      return null;
    });

    const bundle = await resolveBundle({
      root: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1 },
    });

    expect(bundle.nodes).toHaveLength(1);
    expect(bundle.composition.nodesOmitted).toBe(1);
  });

  it('M5: note → calendar via notebook.link hydrates event', async () => {
    mockedGetAdapter.mockImplementation((moduleId, entityType) => {
      if (moduleId === 'notes' && entityType === 'note') {
        return mockAdapter({
          moduleId: 'notes',
          getNode: vi.fn().mockResolvedValue(node('notes', 'note', 'n1', 'full')),
          getNeighbors: vi.fn().mockResolvedValue([
            {
              edgeId: 'nl-cal',
              edgeType: 'notebook.link',
              relationshipClass: 'reference',
              source: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
              target: { moduleId: 'calendar', entityType: 'event', entityId: 'ev1' },
              direction: 'outbound',
              grantsContentAccess: false,
            },
          ]),
        });
      }
      if (moduleId === 'calendar' && entityType === 'event') {
        return mockAdapter({
          moduleId: 'calendar',
          getNode: vi.fn().mockResolvedValue(node('calendar', 'event', 'ev1', 'full', 'Sync')),
        });
      }
      return null;
    });

    const bundle = await resolveBundle({
      root: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1 },
    });

    expect(bundle.nodes).toHaveLength(2);
  });

  it('M6: note → todo via notebook.link', async () => {
    mockedGetAdapter.mockImplementation((moduleId, entityType) => {
      if (moduleId === 'notes' && entityType === 'note') {
        return mockAdapter({
          moduleId: 'notes',
          getNode: vi.fn().mockResolvedValue(node('notes', 'note', 'n1', 'full')),
          getNeighbors: vi.fn().mockResolvedValue([
            {
              edgeId: 'nl-todo',
              edgeType: 'notebook.link',
              relationshipClass: 'reference',
              source: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
              target: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
              direction: 'outbound',
              grantsContentAccess: false,
            },
          ]),
        });
      }
      if (moduleId === 'todo' && entityType === 'task') {
        return mockAdapter({
          moduleId: 'todo',
          getNode: vi.fn().mockResolvedValue(node('todo', 'task', 't1', 'full')),
        });
      }
      return null;
    });

    const bundle = await resolveBundle({
      root: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1 },
    });

    expect(bundle.nodes.some((n) => 'moduleId' in n.descriptor && n.descriptor.moduleId === 'todo')).toBe(true);
  });

  it('M7: note → chat via notebook.link', async () => {
    mockedGetAdapter.mockImplementation((moduleId, entityType) => {
      if (moduleId === 'notes' && entityType === 'note') {
        return mockAdapter({
          moduleId: 'notes',
          getNode: vi.fn().mockResolvedValue(node('notes', 'note', 'n1', 'full')),
          getNeighbors: vi.fn().mockResolvedValue([
            {
              edgeId: 'nl-chat',
              edgeType: 'notebook.link',
              relationshipClass: 'reference',
              source: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
              target: { moduleId: 'chat', entityType: 'conversation', entityId: 'c1' },
              direction: 'outbound',
              grantsContentAccess: false,
            },
          ]),
        });
      }
      if (moduleId === 'chat' && entityType === 'conversation') {
        return mockAdapter({
          moduleId: 'chat',
          getNode: vi.fn().mockResolvedValue(node('chat', 'conversation', 'c1', 'full')),
        });
      }
      return null;
    });

    const bundle = await resolveBundle({
      root: { moduleId: 'notes', entityType: 'note', entityId: 'n1' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1 },
    });

    expect(bundle.edges).toHaveLength(1);
  });

  it('M8: restricted node included with access restricted', async () => {
    mockedListEdges.mockResolvedValue([
      attachmentEdge({ moduleId: 'drive', entityType: 'file', entityId: 'f-restricted' }),
    ]);
    mockedGetAdapter.mockReturnValue(
      mockAdapter({
        moduleId: 'drive',
        getNode: vi.fn().mockResolvedValue(node('drive', 'file', 'f-restricted', 'restricted')),
      })
    );

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-root' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    expect(bundle.nodes).toHaveLength(2);
    expect(bundle.nodes.find((n) => n.access === 'restricted')).toBeDefined();
    expect(bundle.permissionOutcome.restrictedNodes).toBe(1);
  });

  it('M9: mixed bundle counts omitted and visible nodes', async () => {
    mockedListEdges.mockResolvedValue([
      attachmentEdge({ moduleId: 'drive', entityType: 'file', entityId: 'f-ok' }),
      attachmentEdge({ moduleId: 'todo', entityType: 'task', entityId: 't-denied' }),
    ]);
    mockedGetAdapter.mockImplementation((moduleId, entityType) => {
      if (moduleId === 'drive' && entityType === 'file') {
        return mockAdapter({
          moduleId: 'drive',
          getNode: vi.fn().mockResolvedValue(node('drive', 'file', 'f-ok', 'full')),
        });
      }
      if (moduleId === 'todo' && entityType === 'task') {
        return mockAdapter({
          moduleId: 'todo',
          getNode: vi.fn().mockResolvedValue(node('todo', 'task', 't-denied', 'denied')),
        });
      }
      return null;
    });

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-root' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    expect(bundle.nodes).toHaveLength(2);
    expect(bundle.composition.nodesOmitted).toBe(1);
    expect(bundle.summaries.stats.omittedNodeCount).toBe(1);
  });

  it('M10: depth 0 does not hydrate attachments', async () => {
    mockedListEdges.mockResolvedValue([
      attachmentEdge({ moduleId: 'notes', entityType: 'note', entityId: 'n1' }),
    ]);

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-root' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 0 },
    });

    expect(bundle.nodes).toHaveLength(1);
    expect(bundle.composition.depthUsed).toBe(0);
    expect(mockedGetAdapter).not.toHaveBeenCalled();
  });

  it('M11: node budget truncates hydration', async () => {
    mockedListEdges.mockResolvedValue([
      attachmentEdge({ moduleId: 'drive', entityType: 'file', entityId: 'f1' }),
      attachmentEdge({ moduleId: 'drive', entityType: 'file', entityId: 'f2' }),
    ]);
    mockedGetAdapter.mockReturnValue(
      mockAdapter({
        moduleId: 'drive',
        getNode: vi.fn().mockImplementation((_ctx, ref: { entityId: string }) =>
          Promise.resolve(node('drive', 'file', ref.entityId, 'full'))
        ),
      })
    );

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-root' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
      options: { depth: 1, nodeBudget: 1 },
    });

    expect(bundle.composition.truncated).toBe(true);
    expect(bundle.composition.nodeBudgetUsed).toBeLessThanOrEqual(1);
  });

  it('M12: resolveVLinkBundle throws forbidden when container inaccessible', async () => {
    mockedResolveVLink.mockResolvedValue(null);
    vi.mocked(findVLinkByIdOrCode).mockResolvedValue({ id: 'vl-forbidden' } as never);

    await expect(
      resolveVLinkBundle({ userId: 'u1', vlinkIdOrCode: 'vl-forbidden' })
    ).rejects.toBeInstanceOf(ContextGraphForbiddenError);
  });

  it('M13: duplicate attachment refs deduplicated in bundle', async () => {
    mockedListEdges.mockResolvedValue([
      attachmentEdge({ moduleId: 'drive', entityType: 'file', entityId: 'f-dup' }),
      attachmentEdge({ moduleId: 'drive', entityType: 'file', entityId: 'f-dup' }),
    ]);
    mockedGetAdapter.mockReturnValue(
      mockAdapter({
        moduleId: 'drive',
        getNode: vi.fn().mockResolvedValue(node('drive', 'file', 'f-dup', 'full')),
      })
    );

    const bundle = await resolveBundle({
      root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-root' },
      ctx: { userId: 'u1' },
      tenantScope: { dashboardId: 'dash-1', scope: 'PERSONAL' },
    });

    const driveNodes = bundle.nodes.filter(
      (n) => 'moduleId' in n.descriptor && n.descriptor.moduleId === 'drive'
    );
    expect(driveNodes).toHaveLength(1);
  });
});
