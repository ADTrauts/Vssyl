import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { getUserFromRequest } from '../middleware/auth';
import { respondPlaceServiceError } from '../services/place/placeErrors';
import * as placeService from '../services/place/placeService';
import * as placeVisibilityService from '../services/place/placeVisibilityService';
import * as placeConnectionService from '../services/place/placeConnectionService';

function logPlaceError(desc: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(desc, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

function getUserId(req: Request): string | null {
  const user = getUserFromRequest(req);
  return user?.id ?? null;
}

/**
 * GET /api/place
 * Get or create the current user's Place (Main Street)
 */
/* <place-get-enriched-handlers> */

export async function getPlace(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const place = await placeVisibilityService.getEnrichedPlaceGraph(userId);
    res.json({ success: true, data: place });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    logPlaceError('Error fetching place', 'place_get', error);
    res.status(500).json({ success: false, error: 'Failed to fetch place' });
  }
}

/* </place-get-enriched-handlers> */

/* <place-core-graph-handlers> */

/**
 * PUT /api/place/settings
 * Update Place settings (privacy, layout, discovery preferences)
 */
export async function updatePlaceSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const {
      neighborhoodVisibility,
      defaultFollowVisibility,
      layoutMode,
      showLabels,
      highContrastMode,
      showLocalSuggestions,
      suggestionRadius,
    } = req.body;

    const settings = await placeService.updatePlaceSettings({
      userId,
      neighborhoodVisibility,
      defaultFollowVisibility,
      layoutMode,
      showLabels,
      highContrastMode,
      showLocalSuggestions,
      suggestionRadius,
    });

    res.json({ success: true, data: settings });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    logPlaceError('Error updating place settings', 'place_settings_update', err);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
}

/**
 * POST /api/place/nodes
 * Add a node to the user's Place (follow a business or user)
 */
export async function addNode(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { nodeType, entityId, positionX, positionY, label, color } = req.body;

    if (!nodeType || !entityId) {
      res.status(400).json({ success: false, error: 'nodeType and entityId are required' });
      return;
    }

    const node = await placeService.addNode({
      userId,
      nodeType,
      entityId,
      positionX,
      positionY,
      label,
      color,
    });

    res.status(201).json({ success: true, data: node });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    logPlaceError('Error adding node', 'place_node_add', err);
    res.status(500).json({ success: false, error: 'Failed to add node' });
  }
}

/**
 * PUT /api/place/nodes/:nodeId
 * Update a node's position or display settings
 */
export async function updateNode(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { nodeId } = req.params;
    const { positionX, positionY, label, color, pinned } = req.body;

    const updated = await placeService.updateNode({
      userId,
      nodeId,
      positionX,
      positionY,
      label,
      color,
      pinned,
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    logPlaceError('Error updating node', 'place_node_update', err);
    res.status(500).json({ success: false, error: 'Failed to update node' });
  }
}

/**
 * DELETE /api/place/nodes/:nodeId
 * Remove a node from the user's Place
 */
export async function removeNode(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { nodeId } = req.params;

    await placeService.removeNode({ userId, nodeId });

    res.json({ success: true, message: 'Node removed' });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    logPlaceError('Error removing node', 'place_node_remove', err);
    res.status(500).json({ success: false, error: 'Failed to remove node' });
  }
}

/**
 * POST /api/place/interests
 * Set user's interests for discovery seeding
 */
export async function setInterests(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { categories } = req.body;

    const interests = await placeService.setInterests({ userId, categories });

    res.json({ success: true, data: interests });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    logPlaceError('Error setting interests', 'place_interests', err);
    res.status(500).json({ success: false, error: 'Failed to set interests' });
  }
}

/**
 * POST /api/place/complete-setup
 * Mark the user's Place setup as complete (onboarding finished)
 */
export async function completeSetup(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const place = await placeService.completeSetup(userId);

    res.json({ success: true, data: place });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    logPlaceError('Error completing setup', 'place_setup_complete', err);
    res.status(500).json({ success: false, error: 'Failed to complete setup' });
  }
}

/**
 * GET /api/place/follow-visibility/:businessId
 * Get whether a specific business follow is visible to others
 */
export async function getFollowVisibility(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { businessId } = req.params;
    const visibility = await placeService.getFollowVisibility(userId, businessId);

    res.json({ success: true, data: visibility });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    logPlaceError('Error fetching follow visibility', 'place_follow_visibility_get', err);
    res.status(500).json({ success: false, error: 'Failed to fetch follow visibility' });
  }
}

/**
 * PUT /api/place/follow-visibility/:businessId
 * Toggle whether a specific business follow is visible to others
 */
export async function updateFollowVisibility(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { businessId } = req.params;
    const { isVisible } = req.body;

    const visibility = await placeService.updateFollowVisibility({
      userId,
      businessId,
      isVisible,
    });

    res.json({ success: true, data: visibility });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    logPlaceError('Error updating follow visibility', 'place_follow_visibility_update', err);
    res.status(500).json({ success: false, error: 'Failed to update follow visibility' });
  }
}

/* </place-core-graph-handlers> */

/* <place-visibility-read-handlers> */

export async function getPlaceContextOverview(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const payload = await placeVisibilityService.getPlaceContextOverview(userId);
    res.json({ success: true, ...payload });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceError('Error fetching place context', 'place_context', err);
    res.status(500).json({ success: false, error: 'Failed to fetch place context' });
  }
}

export async function getConnections(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const connections = await placeVisibilityService.getConnections(userId);
    res.json({ success: true, data: connections });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceError('Error fetching connections', 'place_connections_list', err);
    res.status(500).json({ success: false, error: 'Failed to fetch connections' });
  }
}

export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const q = req.query.q;
    if (!q || typeof q !== 'string' || q.length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const results = await placeVisibilityService.searchUsersForPlace(userId, q);
    res.json({ success: true, data: results });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceError('Error searching users', 'place_user_search', err);
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
}

/* </place-visibility-read-handlers> */

/* <place-connection-handlers> */

/**
 * POST /api/place/connections/:targetUserId
 * Send a connection request (interim Place-owned; Member handoff Phase 1G)
 */
export async function sendConnectionRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { targetUserId } = req.params;
    const result = await placeConnectionService.sendConnectionRequest({
      userId,
      targetUserId,
      message: req.body.message,
    });

    if (!result.created) {
      res.status(200).json({
        success: true,
        data: result.relationship,
        message: `Connection already ${result.relationship.status.toLowerCase()}`,
      });
      return;
    }

    res.status(201).json({ success: true, data: result.relationship });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceError('Error sending connection request', 'place_connection_request', err);
    res.status(500).json({ success: false, error: 'Failed to send request' });
  }
}

/**
 * PUT /api/place/connections/:relationshipId/accept
 * Accept a connection request (mirrors PlaceNode for both users)
 */
export async function acceptConnection(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { relationshipId } = req.params;
    const updated = await placeConnectionService.acceptConnection({ userId, relationshipId });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    const err = error as Error;
    logPlaceError('Error accepting connection', 'place_connection_accept', err);
    res.status(500).json({ success: false, error: 'Failed to accept connection' });
  }
}

/* </place-connection-handlers> */
