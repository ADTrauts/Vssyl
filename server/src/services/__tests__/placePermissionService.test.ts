import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  assertCanDeleteNode,
  assertCanReadPlace,
  assertCanUpdateNode,
  assertOwnsPlace,
} from '../place/placePermissionService';
import { PlaceServiceError } from '../place/placeErrors';

describe('placePermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows own place', async () => {
    vi.spyOn(prisma.place, 'findUnique').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      isSetupComplete: false,
    } as never);

    const place = await assertOwnsPlace('u1');
    expect(place.id).toBe('place-1');
  });

  it('denies other user place via node ownership check', async () => {
    vi.spyOn(prisma.placeNode, 'findUnique').mockResolvedValue({
      id: 'node-1',
      place: { id: 'place-1', userId: 'other' },
    } as never);

    await expect(assertCanUpdateNode('node-1', 'u1')).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('denies missing place', async () => {
    vi.spyOn(prisma.place, 'findUnique').mockResolvedValue(null);

    await expect(assertCanReadPlace('u1')).rejects.toMatchObject({
      code: 'place_not_found',
    });
  });

  it('denies node update when node missing', async () => {
    vi.spyOn(prisma.placeNode, 'findUnique').mockResolvedValue(null);

    await expect(assertCanDeleteNode('missing', 'u1')).rejects.toBeInstanceOf(PlaceServiceError);
  });

  it('allows node mutation when node belongs to user place', async () => {
    vi.spyOn(prisma.placeNode, 'findUnique').mockResolvedValue({
      id: 'node-1',
      nodeType: 'BUSINESS',
      entityId: 'biz-1',
      place: { id: 'place-1', userId: 'u1' },
    } as never);

    const node = await assertCanUpdateNode('node-1', 'u1');
    expect(node.id).toBe('node-1');
  });
});
