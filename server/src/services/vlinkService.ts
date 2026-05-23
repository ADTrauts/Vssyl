import {
  Prisma,
  VLinkEntityRelationType,
  VLinkEntitySource,
  VLinkEntityType,
  VLinkMemberRole,
  VLinkScope,
  VLinkStatus,
  VLinkSuggestionSource,
  VLinkSuggestionStatus,
  type VLink,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  assertVLinkAccess,
  getVLinkMembership,
  validateScopeFields,
} from './vlinkPermissionService';
import {
  entityTypeLabel,
  resolveEntityAccess,
  userCanLinkEntity,
  type ResolvedVLinkEntity,
} from './vlinkEntityResolverService';
import {
  generateUniquePublicCode,
  isUuid,
  normalizePublicCodeInput,
} from './vlinkPublicCodeService';
import {
  emitVLinkArchivedEvent,
  emitVLinkCreatedEvent,
  emitVLinkDeletedEvent,
  emitVLinkEntityLinkedEvent,
  emitVLinkEntityUnlinkedEvent,
  emitVLinkMemberAddedEvent,
  emitVLinkMemberRemovedEvent,
  emitVLinkMemberUpdatedEvent,
  emitVLinkOwnershipTransferredEvent,
  emitVLinkRestoredEvent,
  emitVLinkSuggestionAcceptedEvent,
  emitVLinkSuggestionCreatedEvent,
  emitVLinkSuggestionRejectedEvent,
  emitVLinkUpdatedEvent,
} from '../events/vlinkDomainEventEmitters';

export class VLinkServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code?: string
  ) {
    super(message);
    this.name = 'VLinkServiceError';
  }
}

async function recordActivity(params: {
  vlinkId: string;
  actorUserId?: string;
  action: string;
  entityType?: VLinkEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.vLinkActivity.create({
    data: {
      vlinkId: params.vlinkId,
      actorUserId: params.actorUserId ?? null,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

async function assertNoCycle(vlinkId: string, parentVLinkId: string): Promise<void> {
  let currentId: string | null = parentVLinkId;
  const visited = new Set<string>();
  while (currentId) {
    if (currentId === vlinkId) {
      throw new VLinkServiceError('Circular nesting is not allowed', 409, 'CYCLE_DETECTED');
    }
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);
    const parentRow: { parentVLinkId: string | null } | null = await prisma.vLink.findUnique({
      where: { id: currentId },
      select: { parentVLinkId: true },
    });
    currentId = parentRow?.parentVLinkId ?? null;
  }
}

export async function countEntitySummary(vlinkId: string, userId: string) {
  const links = await prisma.vLinkEntity.findMany({
    where: { vlinkId, unlinkedAt: null },
    select: { entityType: true, entityId: true, moduleId: true },
  });
  const accessible: Record<string, number> = {};
  let restricted = 0;
  for (const link of links) {
    const resolved = await resolveEntityAccess(userId, link.entityType, link.entityId);
    const key = link.moduleId ?? link.entityType.toLowerCase();
    if (resolved.access === 'full') {
      accessible[key] = (accessible[key] ?? 0) + 1;
    } else {
      restricted += 1;
    }
  }
  return { accessible, restricted };
}

export async function createVLink(params: {
  userId: string;
  title: string;
  description?: string;
  scope: VLinkScope;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  parentVLinkId?: string | null;
  color?: string | null;
  icon?: string | null;
}) {
  const scopeError = validateScopeFields(params.scope, params.businessId, params.householdId);
  if (scopeError) {
    throw new VLinkServiceError(scopeError, 422);
  }
  if (params.parentVLinkId) {
    const parent = await prisma.vLink.findFirst({
      where: { id: params.parentVLinkId, status: VLinkStatus.ACTIVE, deletedAt: null },
    });
    if (!parent) {
      throw new VLinkServiceError('Parent vlink not found', 404);
    }
    const parentAccess = await assertVLinkAccess({ vlink: parent, userId: params.userId, action: 'read' });
    if (!parentAccess.allowed) {
      throw new VLinkServiceError('Access denied to parent vlink', 403);
    }
  }

  const publicCode = await generateUniquePublicCode();
  const vlink = await prisma.vLink.create({
    data: {
      publicCode,
      title: params.title.trim(),
      description: params.description?.trim() || null,
      scope: params.scope,
      dashboardId: params.dashboardId,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
      ownerUserId: params.userId,
      parentVLinkId: params.parentVLinkId ?? null,
      color: params.color ?? null,
      icon: params.icon ?? null,
      createdById: params.userId,
      members: {
        create: {
          userId: params.userId,
          role: VLinkMemberRole.OWNER,
          acceptedAt: new Date(),
        },
      },
    },
  });

  await recordActivity({ vlinkId: vlink.id, actorUserId: params.userId, action: 'created' });
  emitVLinkCreatedEvent({
    actorUserId: params.userId,
    vlinkId: vlink.id,
    publicCode: vlink.publicCode,
    scope: vlink.scope,
    dashboardId: vlink.dashboardId,
    businessId: vlink.businessId,
    householdId: vlink.householdId,
    parentVLinkId: vlink.parentVLinkId,
  });

  const entityCounts = await countEntitySummary(vlink.id, params.userId);
  return { ...vlink, entityCounts, childVLinkCount: 0 };
}

export async function listVLinks(params: {
  userId: string;
  dashboardId?: string;
  scope?: VLinkScope;
  status?: VLinkStatus;
  businessId?: string;
  householdId?: string;
  sharedWithMe?: boolean;
  archived?: boolean;
  limit?: number;
  cursor?: string;
}) {
  const limit = Math.min(params.limit ?? 20, 50);
  const status = params.archived ? VLinkStatus.ARCHIVED : params.status ?? VLinkStatus.ACTIVE;

  const where: Prisma.VLinkWhereInput = {
    deletedAt: null,
    status,
    members: { some: { userId: params.userId } },
  };
  if (params.dashboardId) where.dashboardId = params.dashboardId;
  if (params.scope) where.scope = params.scope;
  if (params.businessId) where.businessId = params.businessId;
  if (params.householdId) where.householdId = params.householdId;
  if (params.sharedWithMe) {
    where.NOT = { ownerUserId: params.userId };
  }

  const vlinks = await prisma.vLink.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(params.cursor
      ? { cursor: { id: params.cursor }, skip: 1 }
      : {}),
  });

  const page = vlinks.slice(0, limit);
  const nextCursor = vlinks.length > limit ? vlinks[limit]?.id : undefined;

  const enriched = await Promise.all(
    page.map(async (vlink) => {
      const entityCounts = await countEntitySummary(vlink.id, params.userId);
      const childVLinkCount = await prisma.vLink.count({
        where: { parentVLinkId: vlink.id, deletedAt: null, status: VLinkStatus.ACTIVE },
      });
      return { ...vlink, entityCounts, childVLinkCount };
    })
  );

  return { vlinks: enriched, nextCursor };
}

export async function findVLinkByIdOrCode(idOrCode: string) {
  if (isUuid(idOrCode)) {
    return prisma.vLink.findFirst({ where: { id: idOrCode, deletedAt: null } });
  }
  const publicCode = normalizePublicCodeInput(idOrCode);
  return prisma.vLink.findFirst({ where: { publicCode, deletedAt: null } });
}

export async function getVLinkDetail(vlinkId: string, userId: string) {
  const vlink = await prisma.vLink.findFirst({ where: { id: vlinkId, deletedAt: null } });
  if (!vlink) {
    throw new VLinkServiceError('V_Link not found', 404);
  }
  const access = await assertVLinkAccess({ vlink, userId, action: 'read' });
  if (!access.allowed) {
    throw new VLinkServiceError('Access denied', 403);
  }
  const entityCounts = await countEntitySummary(vlink.id, userId);
  const childVLinkCount = await prisma.vLink.count({
    where: { parentVLinkId: vlink.id, deletedAt: null, status: { not: VLinkStatus.DELETED } },
  });
  const membership = await getVLinkMembership(vlink.id, userId);
  return { ...vlink, entityCounts, childVLinkCount, membershipRole: membership?.role ?? null };
}

export async function updateVLink(params: {
  vlinkId: string;
  userId: string;
  title?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentVLinkId?: string | null;
}) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'update_metadata' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  if (params.parentVLinkId !== undefined && params.parentVLinkId) {
    await assertNoCycle(params.vlinkId, params.parentVLinkId);
  }

  const updated = await prisma.vLink.update({
    where: { id: params.vlinkId },
    data: {
      ...(params.title !== undefined ? { title: params.title.trim() } : {}),
      ...(params.description !== undefined ? { description: params.description } : {}),
      ...(params.color !== undefined ? { color: params.color } : {}),
      ...(params.icon !== undefined ? { icon: params.icon } : {}),
      ...(params.parentVLinkId !== undefined ? { parentVLinkId: params.parentVLinkId } : {}),
      updatedById: params.userId,
    },
  });

  await recordActivity({ vlinkId: updated.id, actorUserId: params.userId, action: 'updated' });
  emitVLinkUpdatedEvent({ actorUserId: params.userId, vlinkId: updated.id, vlink: updated });
  return updated;
}

export async function archiveVLink(params: {
  vlinkId: string;
  userId: string;
  includeSubtree?: boolean;
}) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'archive' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const ids = params.includeSubtree ? await collectSubtreeIds(params.vlinkId) : [params.vlinkId];
  await prisma.vLink.updateMany({
    where: { id: { in: ids } },
    data: { status: VLinkStatus.ARCHIVED, archivedAt: new Date(), updatedById: params.userId },
  });

  await recordActivity({ vlinkId: params.vlinkId, actorUserId: params.userId, action: 'archived', metadata: { includeSubtree: Boolean(params.includeSubtree) } });
  emitVLinkArchivedEvent({ actorUserId: params.userId, vlinkId: params.vlinkId, vlink });
  return { archivedIds: ids };
}

async function collectSubtreeIds(rootId: string): Promise<string[]> {
  const ids: string[] = [rootId];
  const queue = [rootId];
  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    const children = await prisma.vLink.findMany({
      where: { parentVLinkId: current, deletedAt: null },
      select: { id: true },
    });
    for (const child of children) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }
  return ids;
}

export async function restoreVLink(params: { vlinkId: string; userId: string; includeSubtree?: boolean }) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'restore' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const ids = params.includeSubtree ? await collectSubtreeIds(params.vlinkId) : [params.vlinkId];
  await prisma.vLink.updateMany({
    where: { id: { in: ids } },
    data: { status: VLinkStatus.ACTIVE, archivedAt: null, updatedById: params.userId },
  });

  await recordActivity({ vlinkId: params.vlinkId, actorUserId: params.userId, action: 'restored' });
  emitVLinkRestoredEvent({ actorUserId: params.userId, vlinkId: params.vlinkId, vlink });
  return { restoredIds: ids };
}

export async function deleteVLink(params: {
  vlinkId: string;
  userId: string;
  strategy?: 'block' | 'archive_subtree' | 'reparent_children';
}) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'delete' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const childCount = await prisma.vLink.count({
    where: { parentVLinkId: params.vlinkId, deletedAt: null, status: { not: VLinkStatus.DELETED } },
  });
  const strategy = params.strategy ?? 'block';
  if (childCount > 0 && strategy === 'block') {
    throw new VLinkServiceError('Cannot delete vlink with active children', 409, 'HAS_CHILDREN');
  }
  if (childCount > 0 && strategy === 'reparent_children') {
    await prisma.vLink.updateMany({
      where: { parentVLinkId: params.vlinkId, deletedAt: null },
      data: { parentVLinkId: vlink.parentVLinkId },
    });
  }
  if (childCount > 0 && strategy === 'archive_subtree') {
    await archiveVLink({ vlinkId: params.vlinkId, userId: params.userId, includeSubtree: true });
    return { strategy: 'archive_subtree' as const };
  }

  await prisma.vLink.update({
    where: { id: params.vlinkId },
    data: { status: VLinkStatus.DELETED, deletedAt: new Date(), updatedById: params.userId },
  });
  await recordActivity({ vlinkId: params.vlinkId, actorUserId: params.userId, action: 'deleted' });
  emitVLinkDeletedEvent({ actorUserId: params.userId, vlinkId: params.vlinkId, vlink });
  return { strategy: 'soft_delete' as const };
}

export async function linkEntityToVLink(params: {
  vlinkId: string;
  userId: string;
  entityType: VLinkEntityType;
  entityId: string;
  moduleId?: string | null;
  source?: VLinkEntitySource;
  replacePrimary?: boolean;
}) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null, status: VLinkStatus.ACTIVE } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'link_entity' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const canLink = await userCanLinkEntity(params.userId, params.entityType, params.entityId);
  if (!canLink) {
    throw new VLinkServiceError('You do not have permission to link this item', 403);
  }

  const existingPrimary = await prisma.vLinkEntity.findFirst({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      relationType: VLinkEntityRelationType.PRIMARY,
      isPrimary: true,
      unlinkedAt: null,
    },
  });

  if (existingPrimary && existingPrimary.vlinkId !== params.vlinkId && !params.replacePrimary) {
    throw new VLinkServiceError('Entity already linked to another primary vlink', 409, 'PRIMARY_EXISTS');
  }

  if (existingPrimary && existingPrimary.vlinkId !== params.vlinkId && params.replacePrimary) {
    await prisma.vLinkEntity.update({
      where: { id: existingPrimary.id },
      data: { unlinkedAt: new Date() },
    });
    emitVLinkEntityUnlinkedEvent({
      actorUserId: params.userId,
      vlinkId: existingPrimary.vlinkId,
      entityType: params.entityType,
      entityId: params.entityId,
      vlink,
    });
  }

  const link = await prisma.vLinkEntity.upsert({
    where: {
      vlinkId_entityType_entityId: {
        vlinkId: params.vlinkId,
        entityType: params.entityType,
        entityId: params.entityId,
      },
    },
    create: {
      vlinkId: params.vlinkId,
      entityType: params.entityType,
      entityId: params.entityId,
      moduleId: params.moduleId ?? null,
      relationType: VLinkEntityRelationType.PRIMARY,
      isPrimary: true,
      linkedById: params.userId,
      source: params.source ?? VLinkEntitySource.MANUAL,
      unlinkedAt: null,
    },
    update: {
      unlinkedAt: null,
      linkedById: params.userId,
      moduleId: params.moduleId ?? null,
      source: params.source ?? VLinkEntitySource.MANUAL,
    },
  });

  await recordActivity({
    vlinkId: params.vlinkId,
    actorUserId: params.userId,
    action: 'entity_linked',
    entityType: params.entityType,
    entityId: params.entityId,
  });
  emitVLinkEntityLinkedEvent({
    actorUserId: params.userId,
    vlinkId: params.vlinkId,
    entityType: params.entityType,
    entityId: params.entityId,
    moduleId: params.moduleId ?? null,
    source: link.source,
    vlink,
  });

  return link;
}

export async function unlinkEntityFromVLink(params: {
  vlinkId: string;
  entityLinkId: string;
  userId: string;
}) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'link_entity' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const link = await prisma.vLinkEntity.findFirst({
    where: { id: params.entityLinkId, vlinkId: params.vlinkId, unlinkedAt: null },
  });
  if (!link) throw new VLinkServiceError('Entity link not found', 404);

  await prisma.vLinkEntity.update({
    where: { id: link.id },
    data: { unlinkedAt: new Date() },
  });

  await recordActivity({
    vlinkId: params.vlinkId,
    actorUserId: params.userId,
    action: 'entity_unlinked',
    entityType: link.entityType,
    entityId: link.entityId,
  });
  emitVLinkEntityUnlinkedEvent({
    actorUserId: params.userId,
    vlinkId: params.vlinkId,
    entityType: link.entityType,
    entityId: link.entityId,
    vlink,
  });

  return { unlinked: true };
}

export async function listVLinkEntities(vlinkId: string, userId: string, entityType?: VLinkEntityType) {
  const vlink = await prisma.vLink.findFirst({ where: { id: vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId, action: 'read' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const links = await prisma.vLinkEntity.findMany({
    where: {
      vlinkId,
      unlinkedAt: null,
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  const resolved: ResolvedVLinkEntity[] = [];
  for (const link of links) {
    const accessResult = await resolveEntityAccess(userId, link.entityType, link.entityId);
    resolved.push({
      id: link.id,
      entityType: link.entityType,
      entityId: link.entityId,
      moduleId: link.moduleId,
      access: accessResult.access,
      title: accessResult.access === 'full' ? accessResult.title : entityTypeLabel(link.entityType),
      url: accessResult.url,
      linkedAt: link.createdAt,
    });
  }
  return resolved;
}

export async function getVLinksForEntity(userId: string, entityType: VLinkEntityType, entityId: string) {
  const links = await prisma.vLinkEntity.findMany({
    where: { entityType, entityId, unlinkedAt: null, isPrimary: true },
    include: { vlink: true },
  });
  const results = [];
  for (const link of links) {
    if (link.vlink.deletedAt) continue;
    const access = await assertVLinkAccess({ vlink: link.vlink, userId, action: 'read' });
    if (!access.allowed) continue;
    results.push({
      id: link.vlink.id,
      publicCode: link.vlink.publicCode,
      title: link.vlink.title,
      scope: link.vlink.scope,
      entityLinkId: link.id,
    });
  }
  return results;
}

export async function listVLinkMembers(vlinkId: string, userId: string) {
  const vlink = await prisma.vLink.findFirst({ where: { id: vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId, action: 'read' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  return prisma.vLinkMember.findMany({
    where: { vlinkId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function inviteVLinkMember(params: {
  vlinkId: string;
  userId: string;
  inviteUserId: string;
  role: VLinkMemberRole;
}) {
  if (params.role === VLinkMemberRole.OWNER) {
    throw new VLinkServiceError('Cannot invite as OWNER; use ownership transfer', 422);
  }
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'invite_member' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const member = await prisma.vLinkMember.upsert({
    where: { vlinkId_userId: { vlinkId: params.vlinkId, userId: params.inviteUserId } },
    create: {
      vlinkId: params.vlinkId,
      userId: params.inviteUserId,
      role: params.role,
      invitedById: params.userId,
      acceptedAt: new Date(),
    },
    update: { role: params.role },
  });

  await recordActivity({
    vlinkId: params.vlinkId,
    actorUserId: params.userId,
    action: 'member_added',
    metadata: { userId: params.inviteUserId, role: params.role },
  });
  emitVLinkMemberAddedEvent({
    actorUserId: params.userId,
    vlinkId: params.vlinkId,
    memberUserId: params.inviteUserId,
    role: params.role,
    vlink,
  });

  return member;
}

export async function updateVLinkMemberRole(params: {
  vlinkId: string;
  memberId: string;
  userId: string;
  role: VLinkMemberRole;
}) {
  if (params.role === VLinkMemberRole.OWNER) {
    throw new VLinkServiceError('Use ownership transfer to change owner', 422);
  }
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'invite_member' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const member = await prisma.vLinkMember.findFirst({ where: { id: params.memberId, vlinkId: params.vlinkId } });
  if (!member) throw new VLinkServiceError('Member not found', 404);
  if (member.role === VLinkMemberRole.OWNER) {
    throw new VLinkServiceError('Cannot change owner role directly', 422);
  }

  const updated = await prisma.vLinkMember.update({
    where: { id: member.id },
    data: { role: params.role },
  });

  emitVLinkMemberUpdatedEvent({
    actorUserId: params.userId,
    vlinkId: params.vlinkId,
    memberUserId: member.userId,
    role: params.role,
    vlink,
  });

  return updated;
}

export async function removeVLinkMember(params: { vlinkId: string; memberId: string; userId: string }) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'invite_member' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const member = await prisma.vLinkMember.findFirst({ where: { id: params.memberId, vlinkId: params.vlinkId } });
  if (!member) throw new VLinkServiceError('Member not found', 404);
  if (member.role === VLinkMemberRole.OWNER) {
    throw new VLinkServiceError('Cannot remove owner', 422);
  }

  await prisma.vLinkMember.delete({ where: { id: member.id } });
  emitVLinkMemberRemovedEvent({
    actorUserId: params.userId,
    vlinkId: params.vlinkId,
    memberUserId: member.userId,
    vlink,
  });
  return { removed: true };
}

export async function transferVLinkOwnership(params: {
  vlinkId: string;
  userId: string;
  newOwnerUserId: string;
}) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);

  const ownerAccess = await assertVLinkAccess({ vlink, userId: params.userId, action: 'transfer_ownership' });
  if (!ownerAccess.allowed) {
    throw new VLinkServiceError('Access denied', 403);
  }

  await prisma.$transaction(async (tx) => {
    const currentOwner = await tx.vLinkMember.findFirst({
      where: { vlinkId: params.vlinkId, role: VLinkMemberRole.OWNER },
    });
    if (currentOwner) {
      await tx.vLinkMember.update({
        where: { id: currentOwner.id },
        data: { role: VLinkMemberRole.EDITOR },
      });
    }
    await tx.vLinkMember.upsert({
      where: { vlinkId_userId: { vlinkId: params.vlinkId, userId: params.newOwnerUserId } },
      create: {
        vlinkId: params.vlinkId,
        userId: params.newOwnerUserId,
        role: VLinkMemberRole.OWNER,
        invitedById: params.userId,
        acceptedAt: new Date(),
      },
      update: { role: VLinkMemberRole.OWNER },
    });
    await tx.vLink.update({
      where: { id: params.vlinkId },
      data: { ownerUserId: params.newOwnerUserId, updatedById: params.userId },
    });
  });

  emitVLinkOwnershipTransferredEvent({
    actorUserId: params.userId,
    vlinkId: params.vlinkId,
    fromUserId: vlink.ownerUserId,
    toUserId: params.newOwnerUserId,
    vlink,
  });

  return { ownerUserId: params.newOwnerUserId };
}

export async function listVLinkActivity(params: {
  vlinkId: string;
  userId: string;
  limit?: number;
  cursor?: string;
}) {
  const vlink = await prisma.vLink.findFirst({ where: { id: params.vlinkId, deletedAt: null } });
  if (!vlink) throw new VLinkServiceError('V_Link not found', 404);
  const access = await assertVLinkAccess({ vlink, userId: params.userId, action: 'read' });
  if (!access.allowed) throw new VLinkServiceError('Access denied', 403);

  const limit = Math.min(params.limit ?? 30, 100);
  const rows = await prisma.vLinkActivity.findMany({
    where: { vlinkId: params.vlinkId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });
  const activities = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? rows[limit]?.id : undefined;
  return { activities, nextCursor };
}

export async function listVLinkSuggestions(userId: string, status?: VLinkSuggestionStatus) {
  return prisma.vLinkSuggestion.findMany({
    where: {
      userId,
      status: status ?? VLinkSuggestionStatus.PENDING,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function acceptVLinkSuggestion(params: { suggestionId: string; userId: string; vlinkId?: string }) {
  const suggestion = await prisma.vLinkSuggestion.findFirst({
    where: { id: params.suggestionId, userId: params.userId, status: VLinkSuggestionStatus.PENDING },
  });
  if (!suggestion) throw new VLinkServiceError('Suggestion not found', 404);

  let targetVlinkId = params.vlinkId ?? suggestion.vlinkId;
  if (!targetVlinkId) {
    throw new VLinkServiceError('vlinkId required to accept suggestion', 422);
  }

  await linkEntityToVLink({
    vlinkId: targetVlinkId,
    userId: params.userId,
    entityType: suggestion.entityType,
    entityId: suggestion.entityId,
    moduleId: suggestion.moduleId,
    source: VLinkEntitySource.AI_SUGGESTED,
    replacePrimary: true,
  });

  await prisma.vLinkSuggestion.update({
    where: { id: suggestion.id },
    data: {
      status: VLinkSuggestionStatus.ACCEPTED,
      reviewedById: params.userId,
      reviewedAt: new Date(),
      vlinkId: targetVlinkId,
    },
  });

  emitVLinkSuggestionAcceptedEvent({
    actorUserId: params.userId,
    suggestionId: suggestion.id,
    vlinkId: targetVlinkId,
  });

  return { vlinkId: targetVlinkId };
}

export async function rejectVLinkSuggestion(params: { suggestionId: string; userId: string }) {
  const suggestion = await prisma.vLinkSuggestion.findFirst({
    where: { id: params.suggestionId, userId: params.userId, status: VLinkSuggestionStatus.PENDING },
  });
  if (!suggestion) throw new VLinkServiceError('Suggestion not found', 404);

  await prisma.vLinkSuggestion.update({
    where: { id: suggestion.id },
    data: { status: VLinkSuggestionStatus.REJECTED, reviewedById: params.userId, reviewedAt: new Date() },
  });

  emitVLinkSuggestionRejectedEvent({
    actorUserId: params.userId,
    suggestionId: suggestion.id,
    vlinkId: suggestion.vlinkId,
  });

  return { rejected: true };
}

export async function createVLinkSuggestion(params: {
  userId: string;
  entityType: VLinkEntityType;
  entityId: string;
  moduleId?: string | null;
  vlinkId?: string | null;
  suggestedTitle?: string | null;
  confidence?: number;
  reasonCodes?: Record<string, unknown>;
  explanation?: string | null;
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
}) {
  const suggestion = await prisma.vLinkSuggestion.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      moduleId: params.moduleId ?? null,
      vlinkId: params.vlinkId ?? null,
      suggestedTitle: params.suggestedTitle ?? null,
      suggestedBy: VLinkSuggestionSource.AI,
      confidence: params.confidence ?? null,
      reasonCodes: params.reasonCodes as Prisma.InputJsonValue | undefined,
      explanation: params.explanation ?? null,
      dashboardId: params.dashboardId ?? null,
      businessId: params.businessId ?? null,
      householdId: params.householdId ?? null,
    },
  });

  emitVLinkSuggestionCreatedEvent({
    actorUserId: params.userId,
    suggestionId: suggestion.id,
    entityType: params.entityType,
    entityId: params.entityId,
  });

  return suggestion;
}

export async function searchVLinksForUser(userId: string, query: string) {
  const normalized = query.trim();
  if (!normalized) return [];

  const codeQuery = normalizePublicCodeInput(normalized);
  const vlinks = await prisma.vLink.findMany({
    where: {
      deletedAt: null,
      status: VLinkStatus.ACTIVE,
      members: { some: { userId } },
      OR: [
        { publicCode: { contains: codeQuery, mode: 'insensitive' } },
        { title: { contains: normalized, mode: 'insensitive' } },
        { description: { contains: normalized, mode: 'insensitive' } },
      ],
    },
    take: 20,
    orderBy: { updatedAt: 'desc' },
  });

  return vlinks.map((vlink) => ({
    id: vlink.id,
    title: vlink.title,
    publicCode: vlink.publicCode,
    scope: vlink.scope,
    url: `/vlink/${vlink.id}`,
  }));
}

export async function getRecentVLinksForAIContext(userId: string, limit = 10) {
  const vlinks = await prisma.vLink.findMany({
    where: {
      deletedAt: null,
      status: VLinkStatus.ACTIVE,
      members: { some: { userId } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      publicCode: true,
      title: true,
      scope: true,
      description: true,
    },
  });

  const enriched = [];
  for (const vlink of vlinks) {
    const entities = await listVLinkEntities(vlink.id, userId);
    enriched.push({
      ...vlink,
      linkedEntities: entities.filter((e) => e.access === 'full').slice(0, 5),
    });
  }
  return enriched;
}

export function handleVLinkServiceError(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof VLinkServiceError) {
    return { status: error.statusCode, body: { error: error.message, code: error.code } };
  }
  void logger.error('Unexpected V_Link service error', {
    operation: 'vlink_service_error',
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    },
  });
  return { status: 500, body: { error: 'Internal server error' } };
}
