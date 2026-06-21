import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAdapterForEntity,
  listRegisteredAdapters,
  listSupportedEntityTypes,
} from '../adapterRegistry.js';
import { vlinkContextGraphAdapter } from '../adapters/vlinkAdapter.js';
import { driveContextGraphAdapter } from '../adapters/driveAdapter.js';
import { calendarContextGraphAdapter } from '../adapters/calendarAdapter.js';
import { todoContextGraphAdapter } from '../adapters/todoAdapter.js';
import { notesContextGraphAdapter } from '../adapters/notesAdapter.js';
import { notebookContextGraphAdapter } from '../adapters/notebookAdapter.js';
import { chatContextGraphAdapter } from '../adapters/chatAdapter.js';
import { placeContextGraphAdapter } from '../adapters/placeAdapter.js';
import type { ContextGraphAdapter } from '../contextGraphTypes.js';
import * as driveVlink from '../../services/driveVlinkAccessService.js';
import * as calendarVlink from '../../services/calendarVlinkAccessService.js';
import * as todoVlink from '../../services/todoVlinkAccessService.js';
import * as notesVlink from '../../services/notesVlinkAccessService.js';
import * as chatVlink from '../../services/chatVlinkAccessService.js';
import * as placeVlink from '../../services/place/placeVlinkAccessService.js';
import * as vlinkService from '../../services/vlinkService.js';

const ALL_ADAPTERS: ContextGraphAdapter[] = [
  vlinkContextGraphAdapter,
  driveContextGraphAdapter,
  calendarContextGraphAdapter,
  todoContextGraphAdapter,
  notesContextGraphAdapter,
  notebookContextGraphAdapter,
  chatContextGraphAdapter,
  placeContextGraphAdapter,
];

const EXPECTED_ENTITY_TYPES: Array<{ moduleId: string; entityType: string }> = [
  { moduleId: 'vlink', entityType: 'container' },
  { moduleId: 'drive', entityType: 'file' },
  { moduleId: 'drive', entityType: 'folder' },
  { moduleId: 'calendar', entityType: 'event' },
  { moduleId: 'todo', entityType: 'task' },
  { moduleId: 'notes', entityType: 'note' },
  { moduleId: 'notebook', entityType: 'notebook' },
  { moduleId: 'notebook', entityType: 'notebook_page' },
  { moduleId: 'chat', entityType: 'conversation' },
  { moduleId: 'place', entityType: 'place' },
  { moduleId: 'place', entityType: 'place_list' },
];

function assertAdapterContract(adapter: ContextGraphAdapter): void {
  expect(adapter.moduleId).toBeTruthy();
  expect(adapter.supportedEntityTypes.length).toBeGreaterThan(0);
  expect(typeof adapter.getNode).toBe('function');
  expect(typeof adapter.getNeighbors).toBe('function');
  expect(typeof adapter.getPermissions).toBe('function');
  expect(typeof adapter.getSummary).toBe('function');
}

describe('context graph adapter conformance (CG-1C)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('registry registration', () => {
    it('registers exactly eight adapters', () => {
      expect(listRegisteredAdapters()).toHaveLength(8);
    });

    it('resolves all eleven entity types', () => {
      const registered = listSupportedEntityTypes();
      expect(registered).toHaveLength(11);
      for (const expected of EXPECTED_ENTITY_TYPES) {
        expect(registered).toEqual(expect.arrayContaining([expected]));
        expect(getAdapterForEntity(expected.moduleId, expected.entityType)?.moduleId).toBe(
          expected.moduleId
        );
      }
    });

    it.each(ALL_ADAPTERS.map((a) => [a.moduleId, a]))(
      '%s adapter satisfies ContextGraphAdapter contract',
      (_name, adapter) => {
        assertAdapterContract(adapter as ContextGraphAdapter);
      }
    );
  });

  describe('vlink adapter', () => {
    it('getPermissions returns full for container without inheritance', async () => {
      const perms = await vlinkContextGraphAdapter.getPermissions(
        { userId: 'u1' },
        { moduleId: 'vlink', entityType: 'container', entityId: 'vl-1' }
      );
      expect(perms.access).toBe('full');
      expect(perms.canRead).toBe(true);
    });

    it('getPermissions denied for non-container entity type', async () => {
      const perms = await vlinkContextGraphAdapter.getPermissions(
        { userId: 'u1' },
        { moduleId: 'vlink', entityType: 'file', entityId: 'x' }
      );
      expect(perms.access).toBe('denied');
    });

    it('getSummary delegates to getNode', async () => {
      vi.spyOn(vlinkContextGraphAdapter, 'getNode').mockResolvedValue({
        moduleId: 'vlink',
        entityType: 'container',
        entityId: 'vl-1',
        title: 'Hub',
        summary: 'V_Link summary',
        permissions: { canRead: true, access: 'full' },
      });
      const summary = await vlinkContextGraphAdapter.getSummary(
        { userId: 'u1' },
        { moduleId: 'vlink', entityType: 'container', entityId: 'vl-1' }
      );
      expect(summary).toBe('V_Link summary');
    });
  });

  describe('drive adapter', () => {
    it('hydrates file descriptor', async () => {
      vi.spyOn(driveVlink, 'resolveDriveFileForVLink').mockResolvedValue({
        allowed: true,
        state: 'active',
        title: 'doc.pdf',
        url: '/drive/f1',
      });
      const node = await driveContextGraphAdapter.getNode(
        { userId: 'u1' },
        { moduleId: 'drive', entityType: 'file', entityId: 'f1' }
      );
      expect(node?.entityType).toBe('file');
      expect(node?.permissions.access).toBe('full');
    });

    it('hydrates folder descriptor', async () => {
      vi.spyOn(driveVlink, 'resolveDriveFolderForVLink').mockResolvedValue({
        allowed: true,
        state: 'active',
        title: 'Projects',
      });
      const node = await driveContextGraphAdapter.getNode(
        { userId: 'u1' },
        { moduleId: 'drive', entityType: 'folder', entityId: 'fo1' }
      );
      expect(node?.entityType).toBe('folder');
    });

    it('getNeighbors returns vlink attachment edges', async () => {
      vi.spyOn(vlinkService, 'getVLinksForEntity').mockResolvedValue([
        {
          id: 'vl-1',
          entityLinkId: 'el-1',
          publicCode: 'VL-1',
          title: 'Link hub',
        },
      ] as never);
      const edges = await driveContextGraphAdapter.getNeighbors(
        { userId: 'u1' },
        { moduleId: 'drive', entityType: 'file', entityId: 'f1' }
      );
      expect(edges).toHaveLength(1);
      expect(edges[0].edgeType).toBe('vlink.attachment');
    });

    it('rejects wrong moduleId', async () => {
      const node = await driveContextGraphAdapter.getNode(
        { userId: 'u1' },
        { moduleId: 'calendar', entityType: 'file', entityId: 'f1' }
      );
      expect(node).toBeNull();
    });
  });

  describe('calendar adapter', () => {
    it('hydrates event with permission enforcement', async () => {
      vi.spyOn(calendarVlink, 'resolveCalendarEventForVLink').mockResolvedValue({
        allowed: false,
        state: 'active',
        title: 'Private event',
      });
      const node = await calendarContextGraphAdapter.getNode(
        { userId: 'u1' },
        { moduleId: 'calendar', entityType: 'event', entityId: 'e1' }
      );
      expect(node?.permissions.access).toBe('restricted');
    });

    it('getPermissions reflects getNode access', async () => {
      vi.spyOn(calendarVlink, 'resolveCalendarEventForVLink').mockResolvedValue({
        allowed: true,
        state: 'active',
        title: 'Team sync',
      });
      const perms = await calendarContextGraphAdapter.getPermissions(
        { userId: 'u1' },
        { moduleId: 'calendar', entityType: 'event', entityId: 'e1' }
      );
      expect(perms.canRead).toBe(true);
    });
  });

  describe('todo adapter', () => {
    it('hydrates task descriptor', async () => {
      vi.spyOn(todoVlink, 'resolveTodoTaskForVLink').mockResolvedValue({
        allowed: true,
        state: 'active',
        title: 'Finish report',
      });
      const node = await todoContextGraphAdapter.getNode(
        { userId: 'u1' },
        { moduleId: 'todo', entityType: 'task', entityId: 't1' }
      );
      expect(node?.title).toBe('Finish report');
    });

    it('returns null for deleted task', async () => {
      vi.spyOn(todoVlink, 'resolveTodoTaskForVLink').mockResolvedValue({
        allowed: false,
        state: 'deleted',
      });
      const node = await todoContextGraphAdapter.getNode(
        { userId: 'u1' },
        { moduleId: 'todo', entityType: 'task', entityId: 't1' }
      );
      expect(node).toBeNull();
    });
  });

  describe('notes adapter', () => {
    it('getPermissions denied when node null', async () => {
      vi.spyOn(notesVlink, 'resolveNoteForVLink').mockResolvedValue({
        allowed: false,
        state: 'deleted',
      });
      const perms = await notesContextGraphAdapter.getPermissions(
        { userId: 'u1' },
        { moduleId: 'notes', entityType: 'note', entityId: 'n1' }
      );
      expect(perms.access).toBe('denied');
    });
  });

  describe('notebook adapter', () => {
    it('getSummary returns page summary', async () => {
      vi.spyOn(notesVlink, 'resolveNoteForVLink').mockResolvedValue({
        allowed: true,
        state: 'active',
        title: 'Page A',
      });
      const summary = await notebookContextGraphAdapter.getSummary(
        { userId: 'u1' },
        { moduleId: 'notebook', entityType: 'notebook_page', entityId: 'p1' }
      );
      expect(summary).toContain('Page A');
    });
  });

  describe('chat adapter', () => {
    it('getPermissions denied when conversation deleted', async () => {
      vi.spyOn(chatVlink, 'resolveChatConversationForVLink').mockResolvedValue({
        allowed: false,
        state: 'deleted',
      });
      const perms = await chatContextGraphAdapter.getPermissions(
        { userId: 'u1' },
        { moduleId: 'chat', entityType: 'conversation', entityId: 'c1' }
      );
      expect(perms.access).toBe('denied');
    });
  });

  describe('place adapter', () => {
    it('getPermissions for place meeting', async () => {
      vi.spyOn(placeVlink, 'resolvePlaceMeetingForVLink').mockResolvedValue({
        allowed: true,
        state: 'active',
        title: 'Downtown meetup',
      });
      const perms = await placeContextGraphAdapter.getPermissions(
        { userId: 'u1' },
        { moduleId: 'place', entityType: 'place', entityId: 'm1' }
      );
      expect(perms.access).toBe('full');
    });
  });
});
