import { Request, Response } from 'express';
import {
  VLinkEntityType,
  VLinkMemberRole,
  VLinkScope,
  VLinkStatus,
  VLinkSuggestionStatus,
} from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  acceptVLinkSuggestion,
  archiveVLink,
  createVLink,
  createVLinkSuggestion,
  deleteVLink,
  findVLinkByIdOrCode,
  getVLinkDetail,
  getVLinksForEntity,
  handleVLinkServiceError,
  inviteVLinkMember,
  linkEntityToVLink,
  listVLinkActivity,
  listVLinkEntities,
  listVLinkMembers,
  listVLinks,
  listVLinkSuggestions,
  rejectVLinkSuggestion,
  removeVLinkMember,
  restoreVLink,
  searchVLinksForUser,
  transferVLinkOwnership,
  unlinkEntityFromVLink,
  updateVLink,
  updateVLinkMemberRole,
} from '../services/vlinkService';

function getUserId(req: Request): string | null {
  return (req as AuthenticatedRequest).user?.id ?? null;
}

function parseEntityType(value: unknown): VLinkEntityType | null {
  if (typeof value !== 'string') return null;
  return Object.values(VLinkEntityType).includes(value as VLinkEntityType)
    ? (value as VLinkEntityType)
    : null;
}

function parseMemberRole(value: unknown): VLinkMemberRole | null {
  if (typeof value !== 'string') return null;
  return Object.values(VLinkMemberRole).includes(value as VLinkMemberRole)
    ? (value as VLinkMemberRole)
    : null;
}

function parseScope(value: unknown): VLinkScope | null {
  if (typeof value !== 'string') return null;
  return Object.values(VLinkScope).includes(value as VLinkScope) ? (value as VLinkScope) : null;
}

export async function listVLinksHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const scope = req.query.scope ? parseScope(req.query.scope) : undefined;
    const result = await listVLinks({
      userId,
      dashboardId: typeof req.query.dashboardId === 'string' ? req.query.dashboardId : undefined,
      scope: scope ?? undefined,
      businessId: typeof req.query.businessId === 'string' ? req.query.businessId : undefined,
      householdId: typeof req.query.householdId === 'string' ? req.query.householdId : undefined,
      sharedWithMe: req.query.sharedWithMe === 'true',
      archived: req.query.archived === 'true',
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined,
      cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function createVLinkHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const scope = parseScope(req.body.scope);
    if (!scope) {
      res.status(422).json({ error: 'Valid scope is required' });
      return;
    }
    if (!req.body.title || typeof req.body.title !== 'string') {
      res.status(422).json({ error: 'title is required' });
      return;
    }
    if (!req.body.dashboardId || typeof req.body.dashboardId !== 'string') {
      res.status(422).json({ error: 'dashboardId is required' });
      return;
    }
    const vlink = await createVLink({
      userId,
      title: req.body.title,
      description: req.body.description,
      scope,
      dashboardId: req.body.dashboardId,
      businessId: req.body.businessId,
      householdId: req.body.householdId,
      parentVLinkId: req.body.parentVLinkId,
      color: req.body.color,
      icon: req.body.icon,
    });
    res.status(201).json({ success: true, vlink });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function getVLinkHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const found = await findVLinkByIdOrCode(req.params.idOrCode);
    if (!found) {
      res.status(404).json({ error: 'V_Link not found' });
      return;
    }
    const vlink = await getVLinkDetail(found.id, userId);
    res.json({ success: true, vlink });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function updateVLinkHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const vlink = await updateVLink({
      vlinkId: req.params.id,
      userId,
      title: req.body.title,
      description: req.body.description,
      color: req.body.color,
      icon: req.body.icon,
      parentVLinkId: req.body.parentVLinkId,
    });
    res.json({ success: true, vlink });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function archiveVLinkHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await archiveVLink({
      vlinkId: req.params.id,
      userId,
      includeSubtree: Boolean(req.body.includeSubtree),
    });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function restoreVLinkHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await restoreVLink({
      vlinkId: req.params.id,
      userId,
      includeSubtree: Boolean(req.body.includeSubtree),
    });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function deleteVLinkHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const strategy = req.body.strategy as 'block' | 'archive_subtree' | 'reparent_children' | undefined;
    const result = await deleteVLink({ vlinkId: req.params.id, userId, strategy });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function listVLinkMembersHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const members = await listVLinkMembers(req.params.id, userId);
    res.json({ success: true, members });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function inviteVLinkMemberHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const role = parseMemberRole(req.body.role) ?? VLinkMemberRole.VIEWER;
    if (!req.body.userId || typeof req.body.userId !== 'string') {
      res.status(422).json({ error: 'userId is required' });
      return;
    }
    const member = await inviteVLinkMember({
      vlinkId: req.params.id,
      userId,
      inviteUserId: req.body.userId,
      role,
    });
    res.status(201).json({ success: true, member });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function updateVLinkMemberHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const role = parseMemberRole(req.body.role);
    if (!role) {
      res.status(422).json({ error: 'Valid role is required' });
      return;
    }
    const member = await updateVLinkMemberRole({
      vlinkId: req.params.id,
      memberId: req.params.memberId,
      userId,
      role,
    });
    res.json({ success: true, member });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function removeVLinkMemberHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await removeVLinkMember({
      vlinkId: req.params.id,
      memberId: req.params.memberId,
      userId,
    });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function transferOwnershipHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!req.body.newOwnerUserId || typeof req.body.newOwnerUserId !== 'string') {
      res.status(422).json({ error: 'newOwnerUserId is required' });
      return;
    }
    const result = await transferVLinkOwnership({
      vlinkId: req.params.id,
      userId,
      newOwnerUserId: req.body.newOwnerUserId,
    });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function listVLinkEntitiesHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const entityType = req.query.entityType ? parseEntityType(req.query.entityType) : undefined;
    const entities = await listVLinkEntities(req.params.id, userId, entityType ?? undefined);
    res.json({ success: true, entities });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function linkEntityHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const entityType = parseEntityType(req.body.entityType);
    if (!entityType || !req.body.entityId || typeof req.body.entityId !== 'string') {
      res.status(422).json({ error: 'entityType and entityId are required' });
      return;
    }
    const link = await linkEntityToVLink({
      vlinkId: req.params.id,
      userId,
      entityType,
      entityId: req.body.entityId,
      moduleId: req.body.moduleId,
      replacePrimary: Boolean(req.body.replacePrimary),
    });
    res.status(201).json({ success: true, link });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function unlinkEntityHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await unlinkEntityFromVLink({
      vlinkId: req.params.id,
      entityLinkId: req.params.entityLinkId,
      userId,
    });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function getEntityVLinksHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const entityType = parseEntityType(req.params.entityType);
    if (!entityType) {
      res.status(422).json({ error: 'Invalid entityType' });
      return;
    }
    const vlinks = await getVLinksForEntity(userId, entityType, req.params.entityId);
    res.json({ success: true, vlinks });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function listActivityHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await listVLinkActivity({
      vlinkId: req.params.id,
      userId,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined,
      cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function searchVLinksHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await searchVLinksForUser(userId, q);
    res.json({ success: true, results });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function listSuggestionsHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const status =
      typeof req.query.status === 'string'
        ? (req.query.status as VLinkSuggestionStatus)
        : VLinkSuggestionStatus.PENDING;
    const suggestions = await listVLinkSuggestions(userId, status);
    res.json({ success: true, suggestions });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function acceptSuggestionHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await acceptVLinkSuggestion({
      suggestionId: req.params.id,
      userId,
      vlinkId: req.body.vlinkId,
    });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function rejectSuggestionHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await rejectVLinkSuggestion({ suggestionId: req.params.id, userId });
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}

export async function createSuggestionHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const entityType = parseEntityType(req.body.entityType);
    if (!entityType || !req.body.entityId) {
      res.status(422).json({ error: 'entityType and entityId are required' });
      return;
    }
    const suggestion = await createVLinkSuggestion({
      userId,
      entityType,
      entityId: req.body.entityId,
      moduleId: req.body.moduleId,
      vlinkId: req.body.vlinkId,
      suggestedTitle: req.body.suggestedTitle,
      confidence: req.body.confidence,
      reasonCodes: req.body.reasonCodes,
      explanation: req.body.explanation,
      dashboardId: req.body.dashboardId,
      businessId: req.body.businessId,
      householdId: req.body.householdId,
    });
    res.status(201).json({ success: true, suggestion });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}
