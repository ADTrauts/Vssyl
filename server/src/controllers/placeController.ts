import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getChatSocketService } from '../services/chatSocketService';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

/**
 * GET /api/place
 * Get or create the current user's Place (Main Street)
 */
export async function getPlace(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let place = await prisma.place.findUnique({
      where: { userId },
      include: {
        nodes: true,
        settings: true,
        interests: true,
      },
    });

    if (!place) {
      place = await prisma.place.create({
        data: {
          userId,
          settings: {
            create: {},
          },
        },
        include: {
          nodes: true,
          settings: true,
          interests: true,
        },
      });
    }

    // Enrich business nodes with verification status and name fallback
    const businessNodeIds = place.nodes
      .filter(n => n.nodeType === 'BUSINESS')
      .map(n => n.entityId);

    let verifiedMap: Record<string, boolean> = {};
    let nameMap: Record<string, string> = {};
    if (businessNodeIds.length > 0) {
      const businesses = await prisma.business.findMany({
        where: { id: { in: businessNodeIds } },
        select: { id: true, name: true, einVerified: true },
      });
      verifiedMap = Object.fromEntries(businesses.map(b => [b.id, b.einVerified]));
      nameMap = Object.fromEntries(businesses.map(b => [b.id, b.name]));
    }

    const enrichedNodes = place.nodes.map(n => ({
      ...n,
      label: n.label || (n.nodeType === 'BUSINESS' ? nameMap[n.entityId] : null) || n.label,
      verified: n.nodeType === 'BUSINESS' ? (verifiedMap[n.entityId] ?? false) : undefined,
    }));

    res.json({ success: true, data: { ...place, nodes: enrichedNodes } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching place:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch place' });
  }
}

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

    const place = await prisma.place.findUnique({ where: { userId } });
    if (!place) {
      res.status(404).json({ success: false, error: 'Place not found' });
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

    const settings = await prisma.placeSettings.upsert({
      where: { placeId: place.id },
      update: {
        ...(neighborhoodVisibility !== undefined && { neighborhoodVisibility }),
        ...(defaultFollowVisibility !== undefined && { defaultFollowVisibility }),
        ...(layoutMode !== undefined && { layoutMode }),
        ...(showLabels !== undefined && { showLabels }),
        ...(highContrastMode !== undefined && { highContrastMode }),
        ...(showLocalSuggestions !== undefined && { showLocalSuggestions }),
        ...(suggestionRadius !== undefined && { suggestionRadius }),
      },
      create: {
        placeId: place.id,
        neighborhoodVisibility: neighborhoodVisibility || 'PRIVATE',
        defaultFollowVisibility: defaultFollowVisibility ?? false,
        layoutMode: layoutMode || 'FORCE',
        showLabels: showLabels ?? true,
        highContrastMode: highContrastMode ?? false,
        showLocalSuggestions: showLocalSuggestions ?? true,
        suggestionRadius: suggestionRadius ?? 50,
      },
    });

    res.json({ success: true, data: settings });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating place settings:', err.message);
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

    const place = await prisma.place.findUnique({ where: { userId } });
    if (!place) {
      res.status(404).json({ success: false, error: 'Place not found. Create your place first.' });
      return;
    }

    const { nodeType, entityId, positionX, positionY, label, color } = req.body;

    if (!nodeType || !entityId) {
      res.status(400).json({ success: false, error: 'nodeType and entityId are required' });
      return;
    }

    const node = await prisma.placeNode.create({
      data: {
        placeId: place.id,
        nodeType,
        entityId,
        positionX: positionX ?? null,
        positionY: positionY ?? null,
        label: label ?? null,
        color: color ?? null,
      },
    });

    // Sync: adding a BUSINESS node also creates a BusinessFollow
    if (nodeType === 'BUSINESS') {
      await prisma.businessFollow.upsert({
        where: { userId_businessId: { userId, businessId: entityId } },
        update: {},
        create: { userId, businessId: entityId },
      });
    }

    // Real-time: notify the user's other sessions
    try {
      getChatSocketService().broadcastPlaceEvent(userId, 'place:node:added', { nodeId: node.id, nodeType, entityId });
    } catch { /* socket not initialized in tests */ }

    res.status(201).json({ success: true, data: node });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('Unique constraint')) {
      res.status(409).json({ success: false, error: 'This node already exists in your place' });
      return;
    }
    console.error('Error adding node:', err.message);
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

    const node = await prisma.placeNode.findUnique({
      where: { id: nodeId },
      include: { place: true },
    });

    if (!node || node.place.userId !== userId) {
      res.status(404).json({ success: false, error: 'Node not found' });
      return;
    }

    const updated = await prisma.placeNode.update({
      where: { id: nodeId },
      data: {
        ...(positionX !== undefined && { positionX }),
        ...(positionY !== undefined && { positionY }),
        ...(label !== undefined && { label }),
        ...(color !== undefined && { color }),
        ...(pinned !== undefined && { pinned }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating node:', err.message);
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

    const node = await prisma.placeNode.findUnique({
      where: { id: nodeId },
      include: { place: true },
    });

    if (!node || node.place.userId !== userId) {
      res.status(404).json({ success: false, error: 'Node not found' });
      return;
    }

    // Sync: removing a BUSINESS node also removes the BusinessFollow
    if (node.nodeType === 'BUSINESS') {
      await prisma.businessFollow.deleteMany({
        where: { userId, businessId: node.entityId },
      });
    }

    await prisma.placeNode.delete({ where: { id: nodeId } });

    try {
      getChatSocketService().broadcastPlaceEvent(userId, 'place:node:removed', { nodeId, nodeType: node.nodeType, entityId: node.entityId });
    } catch { /* socket not initialized in tests */ }

    res.json({ success: true, message: 'Node removed' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error removing node:', err.message);
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

    const place = await prisma.place.findUnique({ where: { userId } });
    if (!place) {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }

    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      res.status(400).json({ success: false, error: 'categories must be an array of strings' });
      return;
    }

    // Delete existing and recreate
    await prisma.placeInterest.deleteMany({ where: { placeId: place.id } });

    const interests = await Promise.all(
      categories.map((category: string) =>
        prisma.placeInterest.create({
          data: { placeId: place.id, category },
        })
      )
    );

    res.json({ success: true, data: interests });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error setting interests:', err.message);
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

    const place = await prisma.place.update({
      where: { userId },
      data: { isSetupComplete: true },
      include: {
        nodes: true,
        settings: true,
        interests: true,
      },
    });

    res.json({ success: true, data: place });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error completing setup:', err.message);
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
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { businessId } = req.params;
    const visibility = await prisma.placeFollowVisibility.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });

    res.json({ success: true, data: visibility || { userId, businessId, isVisible: false } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching follow visibility:', err.message);
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

    if (typeof isVisible !== 'boolean') {
      res.status(400).json({ success: false, error: 'isVisible must be a boolean' });
      return;
    }

    const visibility = await prisma.placeFollowVisibility.upsert({
      where: { userId_businessId: { userId, businessId } },
      update: { isVisible },
      create: { userId, businessId, isVisible },
    });

    res.json({ success: true, data: visibility });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating follow visibility:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update follow visibility' });
  }
}

/**
 * GET /api/place/ai/context/overview
 * AI Context Provider: Place overview for AI queries
 */
export async function getPlaceContextOverview(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const place = await prisma.place.findUnique({
      where: { userId },
      include: {
        nodes: true,
        interests: true,
        settings: true,
      },
    });

    if (!place) {
      res.json({
        success: true,
        context: {
          summary: { totalNodes: 0, isSetup: false, status: 'not-created' },
          details: {},
        },
        metadata: {
          provider: 'place',
          endpoint: 'overview',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const businessNodes = place.nodes.filter(n => n.nodeType === 'BUSINESS');
    const userNodes = place.nodes.filter(n => n.nodeType === 'USER');

    res.json({
      success: true,
      context: {
        summary: {
          totalNodes: place.nodes.length,
          businessCount: businessNodes.length,
          userConnectionCount: userNodes.length,
          isSetup: place.isSetupComplete,
          interests: place.interests.map(i => i.category),
          status: place.isSetupComplete ? 'active' : 'setup-pending',
        },
        details: {
          layoutMode: place.settings?.layoutMode || 'FORCE',
          localSuggestions: place.settings?.showLocalSuggestions ?? true,
        },
      },
      metadata: {
        provider: 'place',
        endpoint: 'overview',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching place context:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch place context' });
  }
}

// ============================================================================
// USER CONNECTIONS
// ============================================================================

/**
 * GET /api/place/connections
 * Get the current user's accepted connections (for adding to Place graph)
 */
export async function getConnections(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const relationships = await prisma.relationship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    const connections = relationships.map(r => {
      const other = r.senderId === userId ? r.receiver : r.sender;
      return { id: other.id, name: other.name, email: other.email, relationshipId: r.id, type: r.type };
    });

    res.json({ success: true, data: connections });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching connections:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch connections' });
  }
}

/**
 * GET /api/place/users/search?q=...
 * Search users to connect with (for the Place "add people" feature)
 */
export async function searchUsers(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const q = req.query.q;
    if (!q || typeof q !== 'string' || q.length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] },
          { id: { not: userId } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 10,
    });

    // Check existing relationship status
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: users.map(u => u.id) } },
          { receiverId: userId, senderId: { in: users.map(u => u.id) } },
        ],
      },
    });

    const statusMap: Record<string, string> = {};
    for (const r of relationships) {
      const otherId = r.senderId === userId ? r.receiverId : r.senderId;
      statusMap[otherId] = r.status;
    }

    const results = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      relationshipStatus: statusMap[u.id] || null,
    }));

    res.json({ success: true, data: results });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error searching users:', err.message);
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
}

/**
 * POST /api/place/connections/:targetUserId
 * Send a connection request to a user (creates Relationship + PlaceNode if accepted)
 */
export async function sendConnectionRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { targetUserId } = req.params;
    if (targetUserId === userId) {
      res.status(400).json({ success: false, error: 'Cannot connect with yourself' });
      return;
    }

    const existing = await prisma.relationship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      },
    });

    if (existing) {
      res.status(200).json({ success: true, data: existing, message: `Connection already ${existing.status.toLowerCase()}` });
      return;
    }

    const relationship = await prisma.relationship.create({
      data: {
        senderId: userId,
        receiverId: targetUserId,
        status: 'PENDING',
        type: 'REGULAR',
        message: req.body.message || null,
      },
    });

    res.status(201).json({ success: true, data: relationship });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error sending connection request:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send request' });
  }
}

/**
 * PUT /api/place/connections/:relationshipId/accept
 * Accept a connection request (also creates PlaceNode for both users)
 */
export async function acceptConnection(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }

    const { relationshipId } = req.params;

    const relationship = await prisma.relationship.findUnique({ where: { id: relationshipId } });
    if (!relationship || relationship.receiverId !== userId) {
      res.status(404).json({ success: false, error: 'Connection request not found' });
      return;
    }

    if (relationship.status !== 'PENDING') {
      res.status(400).json({ success: false, error: `Connection is already ${relationship.status.toLowerCase()}` });
      return;
    }

    const updated = await prisma.relationship.update({
      where: { id: relationshipId },
      data: { status: 'ACCEPTED' },
    });

    // Auto-add user nodes to each other's Place if they have one
    const [senderPlace, receiverPlace] = await Promise.all([
      prisma.place.findUnique({ where: { userId: relationship.senderId } }),
      prisma.place.findUnique({ where: { userId: relationship.receiverId } }),
    ]);

    const senderUser = await prisma.user.findUnique({ where: { id: relationship.senderId }, select: { name: true } });
    const receiverUser = await prisma.user.findUnique({ where: { id: relationship.receiverId }, select: { name: true } });

    if (senderPlace) {
      await prisma.placeNode.upsert({
        where: { placeId_nodeType_entityId: { placeId: senderPlace.id, nodeType: 'USER', entityId: relationship.receiverId } },
        update: {},
        create: { placeId: senderPlace.id, nodeType: 'USER', entityId: relationship.receiverId, label: receiverUser?.name || null },
      });
    }

    if (receiverPlace) {
      await prisma.placeNode.upsert({
        where: { placeId_nodeType_entityId: { placeId: receiverPlace.id, nodeType: 'USER', entityId: relationship.senderId } },
        update: {},
        create: { placeId: receiverPlace.id, nodeType: 'USER', entityId: relationship.senderId, label: senderUser?.name || null },
      });
    }

    // Real-time: notify both users
    try {
      const socket = getChatSocketService();
      socket.broadcastPlaceEvent(relationship.senderId, 'place:connection:accepted', { relationshipId, withUserId: relationship.receiverId });
      socket.broadcastPlaceEvent(relationship.receiverId, 'place:connection:accepted', { relationshipId, withUserId: relationship.senderId });
    } catch { /* socket not initialized in tests */ }

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error accepting connection:', err.message);
    res.status(500).json({ success: false, error: 'Failed to accept connection' });
  }
}
