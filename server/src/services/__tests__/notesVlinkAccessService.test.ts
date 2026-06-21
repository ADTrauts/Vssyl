import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as notesPolicyDual from '../notes/notesPolicyDual';
import { resolveNoteForVLink, userCanLinkNote } from '../notesVlinkAccessService';

describe('notesVlinkAccessService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(notesPolicyDual, 'evaluateNotesPolicyDual').mockResolvedValue({ blocked: false });
  });

  it('allows owner with policy pass', async () => {
    vi.spyOn(prisma.note, 'findUnique').mockResolvedValue({
      id: 'note-1',
      title: 'My Note',
      trashedAt: null,
      dashboardId: 'dash-1',
      businessId: null,
      createdById: 'user-1',
      shares: [],
    } as never);
    vi.spyOn(prisma.note, 'findFirst').mockResolvedValue({ id: 'note-1' } as never);

    const result = await resolveNoteForVLink('user-1', 'note-1');
    expect(result.allowed).toBe(true);
    expect(result.title).toBe('My Note');
    expect(result.url).toContain('note-1');
  });

  it('denies when not readable', async () => {
    vi.spyOn(prisma.note, 'findUnique').mockResolvedValue({
      id: 'note-2',
      title: 'Secret',
      trashedAt: null,
      dashboardId: 'dash-1',
      businessId: null,
      createdById: 'other',
      shares: [],
    } as never);
    vi.spyOn(prisma.note, 'findFirst').mockResolvedValue(null);

    const result = await resolveNoteForVLink('user-1', 'note-2');
    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
  });

  it('userCanLinkNote reflects allowed state', async () => {
    vi.spyOn(prisma.note, 'findUnique').mockResolvedValue({
      id: 'note-3',
      title: 'T',
      trashedAt: null,
      dashboardId: 'd',
      businessId: null,
      createdById: 'user-1',
      shares: [],
    } as never);
    vi.spyOn(prisma.note, 'findFirst').mockResolvedValue({ id: 'note-3' } as never);

    expect(await userCanLinkNote('user-1', 'note-3')).toBe(true);
  });
});
