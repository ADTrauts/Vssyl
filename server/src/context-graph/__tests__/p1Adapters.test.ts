import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notesContextGraphAdapter } from '../adapters/notesAdapter.js';
import { notebookContextGraphAdapter } from '../adapters/notebookAdapter.js';
import { chatContextGraphAdapter } from '../adapters/chatAdapter.js';
import { placeContextGraphAdapter } from '../adapters/placeAdapter.js';
import * as notesVlink from '../../services/notesVlinkAccessService.js';
import * as chatVlink from '../../services/chatVlinkAccessService.js';
import * as placeVlink from '../../services/place/placeVlinkAccessService.js';
import * as vlinkService from '../../services/vlinkService.js';
import * as notebookLinkService from '../../services/notebook/notebookLinkService.js';

describe('P1 context graph adapters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('notes adapter hydrates note node', async () => {
    vi.spyOn(notesVlink, 'resolveNoteForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Spec',
      url: '/notebook/page/n1',
    });
    vi.spyOn(vlinkService, 'getVLinksForEntity').mockResolvedValue([]);
    vi.spyOn(notebookLinkService, 'listPageLinks').mockResolvedValue({ pageId: 'n1', links: [] });

    const node = await notesContextGraphAdapter.getNode(
      { userId: 'u1' },
      { moduleId: 'notes', entityType: 'note', entityId: 'n1' }
    );
    expect(node?.title).toBe('Spec');
    expect(node?.permissions.access).toBe('full');
  });

  it('notebook adapter hydrates notebook_page', async () => {
    vi.spyOn(notesVlink, 'resolveNoteForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Page',
    });
    const node = await notebookContextGraphAdapter.getNode(
      { userId: 'u1' },
      { moduleId: 'notebook', entityType: 'notebook_page', entityId: 'p1' }
    );
    expect(node?.entityType).toBe('notebook_page');
  });

  it('chat adapter returns restricted when not allowed', async () => {
    vi.spyOn(chatVlink, 'resolveChatConversationForVLink').mockResolvedValue({
      allowed: false,
      state: 'active',
      title: 'Private chat',
    });
    const node = await chatContextGraphAdapter.getNode(
      { userId: 'u1' },
      { moduleId: 'chat', entityType: 'conversation', entityId: 'c1' }
    );
    expect(node?.permissions.access).toBe('restricted');
  });

  it('place adapter resolves place_list', async () => {
    vi.spyOn(placeVlink, 'resolvePlaceListingForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Coffee Shop',
      url: '/place?business=b1',
    });
    vi.spyOn(vlinkService, 'getVLinksForEntity').mockResolvedValue([]);

    const node = await placeContextGraphAdapter.getNode(
      { userId: 'u1' },
      { moduleId: 'place', entityType: 'place_list', entityId: 'listing-1' }
    );
    expect(node?.title).toBe('Coffee Shop');
  });

  it('place adapter does not support place_review', async () => {
    const node = await placeContextGraphAdapter.getNode(
      { userId: 'u1' },
      { moduleId: 'place', entityType: 'place_review', entityId: 'r1' }
    );
    expect(node).toBeNull();
  });
});
